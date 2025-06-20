import { 
  doc, 
  updateDoc, 
  serverTimestamp,
  collection,
  query,
  where,
  onSnapshot,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

export interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
  userInfo: {
    displayName: string;
    email: string;
    role?: string;
    isAdmin?: boolean;
  };
}

export class UserPresenceService {
  private static unsubscribes: (() => void)[] = [];
  private static heartbeatIntervals: Map<string, number> = new Map();
  private static isEnabled = true; // 🚀 Feature flag for presence service

  // 🚀 MODERN APPROACH: Graceful presence management with enhanced error handling
  static async setUserOnline(userId: string, user?: User): Promise<void> {
    if (!this.isEnabled || !userId) return;
    
    try {
      const presenceRef = doc(db, 'userPresence', userId);
      
      const presenceData: any = {
        userId,
        isOnline: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Eğer user bilgisi varsa userInfo'yu da ekle
      if (user) {
        presenceData.userInfo = {
          displayName: user.displayName || '',
          email: user.email,
          role: user.role || 'customer',
          isAdmin: user.isAdmin || false
        };
      }
      
      // Online durumunu ayarla - silence errors for UX
      await setDoc(presenceRef, presenceData, { merge: true }).catch(error => {
        if (error?.code !== 'permission-denied') {
          console.warn('🔕 User presence update silently failed:', error.code);
        }
        // Don't throw error to avoid breaking user experience
      });

      // Heartbeat başlat (sadece başarılı olursa)
      this.startHeartbeat(userId);

      // Sayfa kapatılırken offline yap
      this.setupOfflineListener(userId);

    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        console.warn('🔕 User presence service temporarily unavailable:', error?.code || 'unknown');
      }
      // Gracefully fail without breaking the app
    }
  }

  // 🚀 RESILIENT heartbeat system with enhanced error handling
  private static startHeartbeat(userId: string): void {
    if (!this.isEnabled) return;
    
    // Varolan heartbeat'i temizle
    const existingInterval = this.heartbeatIntervals.get(userId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    // Yeni heartbeat başlat - increased interval to reduce errors
    const interval = setInterval(async () => {
      try {
        const presenceRef = doc(db, 'userPresence', userId);
        await updateDoc(presenceRef, {
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch((error) => {
          if (error?.code !== 'permission-denied') {
            console.warn('🔕 Heartbeat update failed:', error?.code || 'unknown');
          }
          // Silently handle failures to avoid console spam
        });
      } catch (error: any) {
        if (error?.code !== 'permission-denied') {
          console.warn('🔕 Heartbeat error:', error?.code || 'unknown');
        }
        // Silent failure for heartbeat
      }
    }, 60000) as unknown as number; // Increased to 60 seconds

    this.heartbeatIntervals.set(userId, interval);
  }

  // Offline listener'ını ayarla
  private static setupOfflineListener(userId: string): void {
    if (typeof window !== 'undefined') {
      const handleOffline = () => this.setUserOffline(userId);
      
      window.addEventListener('beforeunload', handleOffline);
      window.addEventListener('unload', handleOffline);
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.setUserOffline(userId);
        } else {
          this.updateLastSeen(userId);
        }
      });
    }
  }

  // 🚀 RESILIENT last seen update
  private static async updateLastSeen(userId: string): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      const presenceRef = doc(db, 'userPresence', userId);
      await updateDoc(presenceRef, {
        isOnline: true,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(() => {
        // Silent failure
      });
    } catch (error) {
      // Silent failure for last seen update
    }
  }

  // 🚀 GRACEFUL offline handling
  static async setUserOffline(userId: string): Promise<void> {
    if (!this.isEnabled) return;
    
    try {
      // Heartbeat'i durdur
      const interval = this.heartbeatIntervals.get(userId);
      if (interval) {
        clearInterval(interval);
        this.heartbeatIntervals.delete(userId);
      }

      const presenceRef = doc(db, 'userPresence', userId);
      await updateDoc(presenceRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(() => {
        // Silent failure for offline status
      });
    } catch (error) {
      // Silent failure for offline handling
    }
  }

  // Online kullanıcıları dinle - WITH ERROR RESILIENCE
  static subscribeToOnlineUsers(callback: (users: UserPresence[]) => void): () => void {
    if (!this.isEnabled) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(db, 'userPresence'),
        where('isOnline', '==', true)
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const onlineUsers: UserPresence[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              userId: doc.id,
              isOnline: data.isOnline,
              lastSeen: data.lastSeen?.toDate() || new Date(),
              userInfo: data.userInfo || {
                displayName: 'Unknown',
                email: 'unknown@example.com'
              }
            };
          });

          callback(onlineUsers);
        },
        (error) => {
          console.warn('🔕 Online users subscription failed:', error.code);
          callback([]); // Return empty array on error
        }
      );

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn('🔕 Failed to setup online users subscription:', error);
      callback([]);
      return () => {};
    }
  }

  // Tüm kullanıcı presence'larını dinle - WITH ERROR RESILIENCE
  static subscribeToAllUserPresence(callback: (users: UserPresence[]) => void): () => void {
    if (!this.isEnabled) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(collection(db, 'userPresence'));

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const allUsers: UserPresence[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              userId: doc.id,
              isOnline: data.isOnline,
              lastSeen: data.lastSeen?.toDate() || new Date(),
              userInfo: data.userInfo || {
                displayName: 'Unknown',
                email: 'unknown@example.com'
              }
            };
          });

          callback(allUsers);
        },
        (error) => {
          console.warn('🔕 All users presence subscription failed:', error.code);
          callback([]); // Return empty array on error
        }
      );

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn('🔕 Failed to setup all users presence subscription:', error);
      callback([]);
      return () => {};
    }
  }

  // Belirli bir kullanıcının online durumunu dinle - WITH ERROR RESILIENCE
  static subscribeToUserPresence(userId: string, callback: (presence: UserPresence | null) => void): () => void {
    if (!this.isEnabled || !userId) {
      callback(null);
      return () => {};
    }

    try {
      const presenceRef = doc(db, 'userPresence', userId);

      const unsubscribe = onSnapshot(presenceRef, 
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const presence: UserPresence = {
              userId: doc.id,
              isOnline: data.isOnline,
              lastSeen: data.lastSeen?.toDate() || new Date(),
              userInfo: data.userInfo || {
                displayName: 'Unknown',
                email: 'unknown@example.com'
              }
            };
            callback(presence);
          } else {
            callback(null);
          }
        },
        (error) => {
          console.warn('🔕 User presence subscription failed:', error.code);
          callback(null); // Return null on error
        }
      );

      this.unsubscribes.push(unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.warn('🔕 Failed to setup user presence subscription:', error);
      callback(null);
      return () => {};
    }
  }

  // 🚀 MODERN cleanup with error handling
  static clearAllPresence(): void {
    try {
      // Tüm subscriptions'ları temizle
      this.unsubscribes.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          // Silent cleanup failure
        }
      });
      this.unsubscribes = [];

      // Tüm heartbeat'leri temizle
      this.heartbeatIntervals.forEach((interval) => {
        clearInterval(interval);
      });
      this.heartbeatIntervals.clear();
    } catch (error) {
      console.warn('🔕 Presence cleanup had minor issues:', error);
    }
  }

  // 🚀 UTILITY functions with better UX
  static formatLastSeen(lastSeen: Date): string {
    try {
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Az önce';
      if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours} saat önce`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} gün önce`;
    } catch (error) {
      return 'Bilinmiyor';
    }
  }

  // Online durumu kontrolü
  static isUserOnline(userPresence: UserPresence): boolean {
    try {
      if (!userPresence.isOnline) return false;
      
      const now = new Date();
      const lastSeen = userPresence.lastSeen;
      const diffInMinutes = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
      
      // 5 dakikadan fazla aktivite yoksa offline kabul et
      return diffInMinutes <= 5;
    } catch (error) {
      return false;
    }
  }

  // 🚀 SERVICE CONTROL methods for debugging
  static enable(): void {
    this.isEnabled = true;
    console.log('🟢 UserPresenceService enabled');
  }

  static disable(): void {
    this.isEnabled = false;
    this.clearAllPresence();
    console.log('🔴 UserPresenceService disabled');
  }

  static isServiceEnabled(): boolean {
    return this.isEnabled;
  }

  // 🚀 Get all users presence data
  static async getAllUsersPresence(): Promise<UserPresence[]> {
    if (!this.isEnabled) return [];
    
    try {
      const { getDocs, collection } = await import('firebase/firestore');
      const querySnapshot = await getDocs(collection(db, 'userPresence'));
      
      const users: UserPresence[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen?.toDate() || new Date(),
          userInfo: data.userInfo || {
            displayName: 'Unknown',
            email: 'unknown@example.com',
            role: 'customer',
            isAdmin: false
          }
        };
      });

      return users;
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        console.warn('🔕 Get all users presence failed:', error?.code || 'unknown');
      }
      return [];
    }
  }

  // 🚀 Get online users only
  static async getOnlineUsers(): Promise<UserPresence[]> {
    if (!this.isEnabled) return [];
    
    try {
      const { getDocs, collection, query, where } = await import('firebase/firestore');
      const q = query(
        collection(db, 'userPresence'),
        where('isOnline', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      
      const onlineUsers: UserPresence[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          isOnline: data.isOnline,
          lastSeen: data.lastSeen?.toDate() || new Date(),
          userInfo: data.userInfo || {
            displayName: 'Unknown',
            email: 'unknown@example.com',
            role: 'customer',
            isAdmin: false
          }
        };
      });

      return onlineUsers;
    } catch (error: any) {
      if (error?.code !== 'permission-denied') {
        console.warn('🔕 Get online users failed:', error?.code || 'unknown');
      }
      return [];
    }
  }
} 