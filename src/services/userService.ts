import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';

export class UserService {
  private static readonly COLLECTION_NAME = 'users';

  // Kullanıcı oluşturma
  static async createUser(uid: string, userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const userRef = doc(db, this.COLLECTION_NAME, uid);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Kullanıcı getirme
  static async getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, this.COLLECTION_NAME, uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return {
        uid: userSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as User;
    }
    
    return null;
  }

  // Kullanıcı güncelleme
  static async updateUser(uid: string, updates: Partial<Omit<User, 'uid' | 'createdAt'>>): Promise<void> {
    const userRef = doc(db, this.COLLECTION_NAME, uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }

  // Tüm kullanıcıları getirme (Admin için)
  static async getAllUsers(userLimit: number = 50): Promise<User[]> {
    const usersRef = collection(db, this.COLLECTION_NAME);
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(userLimit));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as User[];
  }

  // Rol bazında kullanıcı getirme
  static async getUsersByRole(role: 'customer' | 'restaurant' | 'admin'): Promise<User[]> {
    const usersRef = collection(db, this.COLLECTION_NAME);
    const q = query(usersRef, where('role', '==', role), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as User[];
  }

  // Restoran sahiplerini getirme
  static async getRestaurantOwners(): Promise<User[]> {
    return this.getUsersByRole('restaurant');
  }

  // Kullanıcı silme (Soft delete)
  static async deleteUser(uid: string): Promise<void> {
    const userRef = doc(db, this.COLLECTION_NAME, uid);
    await updateDoc(userRef, {
      isActive: false,
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Kullanıcı arama (Email veya isim ile)
  static async searchUsers(searchTerm: string): Promise<User[]> {
    const usersRef = collection(db, this.COLLECTION_NAME);
    
    // Email ile arama
    const emailQuery = query(
      usersRef, 
      where('email', '>=', searchTerm),
      where('email', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    // İsim ile arama
    const nameQuery = query(
      usersRef,
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(20)
    );
    
    const [emailResults, nameResults] = await Promise.all([
      getDocs(emailQuery),
      getDocs(nameQuery)
    ]);
    
    const users = new Map<string, User>();
    
    [...emailResults.docs, ...nameResults.docs].forEach(doc => {
      if (!users.has(doc.id)) {
        users.set(doc.id, {
          uid: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        } as User);
      }
    });
    
    return Array.from(users.values());
  }
} 