import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { User } from '@/types';
import { UserPresenceService } from '@/services/userPresenceService';

// Kullanıcı kimlik doğrulama hook'u
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const isMountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Client-side hydration kontrolü
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auth state change handler'ını useCallback ile optimize et
  const handleAuthStateChange = useCallback(async (firebaseUser: FirebaseUser | null) => {
    console.log('🟦 Auth State Change - Start:', { firebaseUser: !!firebaseUser, isMounted: isMountedRef.current });
    
    try {
      if (!isMountedRef.current) {
        console.log('🟡 Auth State Change - Component unmounted, skipping');
        return;
      }
      
      if (firebaseUser) {
        console.log('🟦 Auth State Change - User exists, fetching from Firestore...');
        // Kullanıcı giriş yapmışsa Firestore'dan ek bilgileri alıyoruz
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        
        if (!isMountedRef.current) {
          console.log('🟡 Auth State Change - Component unmounted after Firestore fetch');
          return;
        }
        
        if (userDoc.exists()) {
          console.log('🟢 Auth State Change - User document found');
          // Mevcut kullanıcı
          const userData = userDoc.data() as any;
          const currentUser: User = {
            uid: firebaseUser.uid,
            email: userData.email || firebaseUser.email!,
            displayName: userData.displayName || firebaseUser.displayName || '',
            phoneNumber: userData.phoneNumber || '',
            address: userData.address,
            role: userData.role || 'customer',
            isAdmin: userData.isAdmin || false,
            isActive: userData.isActive !== false,
            profileImage: userData.profileImage,
            restaurantId: userData.restaurantId,
            // Timestamp'leri Date'e çevir
            createdAt: userData.createdAt?.toDate?.() || userData.createdAt || new Date(),
            updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt || new Date(),
            lastLoginAt: userData.lastLoginAt?.toDate?.() || userData.lastLoginAt || new Date()
          };

          // Debug: Kullanıcı verilerini kontrol et
          console.log('🔍 Kullanıcı verileri:', {
            email: currentUser.email,
            role: currentUser.role,
            isAdmin: currentUser.isAdmin,
            uid: currentUser.uid
          });

          if (isMountedRef.current) {
            setUser(currentUser);

            // Son giriş tarihini güncelle
            try {
              await updateDoc(doc(db, 'users', firebaseUser.uid), {
                lastLoginAt: serverTimestamp()
              });
            } catch (error) {
              console.warn('Last login güncelleme hatası:', error);
            }

            // User presence service'i başlat
            UserPresenceService.setUserOnline(firebaseUser.uid, currentUser).catch(error => {
              console.warn('User presence başlatma hatası:', error);
            });
          }
        } else {
          // User document bulunamadı, yeni bir tane oluştur
          if (isMountedRef.current) {
            const newUser: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || '',
              phoneNumber: '',
              role: 'customer',
              isActive: true,
              createdAt: new Date(),
              lastLoginAt: new Date()
            };

            try {
              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUser,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp()
              });
              
              if (isMountedRef.current) {
                setUser(newUser);
                UserPresenceService.setUserOnline(firebaseUser.uid, newUser).catch(error => {
                  console.warn('User presence başlatma hatası:', error);
                });
              }
            } catch (error) {
              console.error('Kullanıcı oluşturma hatası:', error);
              if (isMountedRef.current) {
                setUser(null);
              }
            }
          }
        }
      } else {
        // Kullanıcı çıkış yapmış
        if (isMountedRef.current) {
          setUser(null);
        }
        
        // User presence'ı temizle
        UserPresenceService.clearAllPresence();
      }
    } catch (error) {
      console.error('Auth state change error:', error);
      if (isMountedRef.current) {
        setUser(null);
      }
    } finally {
      if (isMountedRef.current) {
        console.log('🟢 Auth State Change - Setting loading to false');
        setLoading(false);
      } else {
        console.log('🟡 Auth State Change - Component unmounted, not setting loading');
      }
    }
  }, []);

  useEffect(() => {
    console.log('🟦 useAuth - Initializing auth listener', { isClient });
    if (!isClient) {
      console.log('🟡 useAuth - Not client-side yet, skipping auth listener');
      return;
    }
    
    isMountedRef.current = true;
    
    // Firebase auth durumu değişikliklerini dinliyoruz
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    // Cleanup function'ı ref'e ata
    cleanupRef.current = () => {
      console.log('🟡 useAuth - Cleanup called');
      isMountedRef.current = false;
      unsubscribe();
      UserPresenceService.clearAllPresence();
    };

    return cleanupRef.current;
  }, [handleAuthStateChange, isClient]);

  // Component unmount'ta cleanup
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Email ve şifre ile giriş yapma fonksiyonu
  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Email ve şifre ile kayıt olma fonksiyonu
  const signUp = async (email: string, password: string, displayName: string, phoneNumber: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Kullanıcı profilini güncelliyoruz
      await updateProfile(result.user, { displayName });
      
      // Firestore'da kullanıcı dokümanı oluşturuyoruz
      const isAdminUser = email === 'halildincer1@gmail.com';
      const newUser: Omit<User, 'uid'> = {
        email,
        displayName,
        phoneNumber,
        role: isAdminUser ? 'admin' : 'customer',
        isAdmin: isAdminUser,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await setDoc(doc(db, 'users', result.user.uid), newUser);
      
      // Hoş geldin e-postası gönder (admin değilse) - API endpoint kullan
      if (!isAdminUser) {
        try {
          await fetch('/api/email/welcome', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userName: displayName,
              userEmail: email
            })
          });
        } catch (emailError) {
          console.error('Hoş geldin e-postası gönderilirken hata:', emailError);
          // E-posta hatası kayıt işlemini etkilemesin
        }
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  // Google ile giriş yapma fonksiyonu
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Kullanıcı dokümanını kontrol ediyoruz
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (!userDoc.exists()) {
        // Yeni kullanıcı ise Firestore'da doküman oluşturuyoruz
        const isAdminUser = result.user.email === 'halildincer1@gmail.com';
        const newUser: Omit<User, 'uid'> = {
          email: result.user.email!,
          displayName: result.user.displayName || '',
          phoneNumber: '', // Google ile giriş yapanlar için boş bırakılabilir
          role: isAdminUser ? 'admin' : 'customer',
          isAdmin: isAdminUser,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', result.user.uid), newUser);
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      // User presence'ı temizle
      if (user?.uid) {
        await UserPresenceService.setUserOffline(user.uid);
      }
      
      await firebaseSignOut(auth);
      
      if (isMountedRef.current) {
        setUser(null);
      }
    } catch (error) {
      console.error('Çıkış yapma hatası:', error);
      throw error;
    }
  };

  // Kullanıcı rolünü güncelleme fonksiyonu
  const updateUserRole = async (userId: string, newRole: 'customer' | 'restaurant' | 'admin', restaurantId?: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const updateData: any = {
        role: newRole,
        updatedAt: new Date(),
      };
      
      // Eğer restoran rolüne geçiyorsa restaurantId ekle
      if (newRole === 'restaurant' && restaurantId) {
        updateData.restaurantId = restaurantId;
      }
      
      await updateDoc(userRef, updateData);
      
      // Mevcut kullanıcı bu kullanıcıysa state'i güncelle
      if (user && user.uid === userId) {
        const updatedUser = {
          ...user,
          role: newRole,
          restaurantId: restaurantId || user.restaurantId,
          updatedAt: new Date(),
        };
        setUser(updatedUser);
        
        // Presence'ı da güncelle
        await UserPresenceService.setUserOnline(userId, updatedUser);
      }
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!user || !isMountedRef.current) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });

      if (isMountedRef.current) {
        setUser(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateUserRole,
    updateUserProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isRestaurant: user?.role === 'restaurant'
  };
} 