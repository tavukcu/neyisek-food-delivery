import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category } from '@/types';

export class CategoryService {
  private static readonly COLLECTION_NAME = 'categories';

  // Kategori oluşturma
  static async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // Eğer sortOrder belirtilmemişse, son sıra numarasını al ve +1 yap
    if (!categoryData.sortOrder) {
      const categoriesRef = collection(db, this.COLLECTION_NAME);
      const q = query(categoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const categories = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        sortOrder: doc.data().sortOrder || 0
      }));
      
      const maxSortOrder = categories.length > 0 
        ? Math.max(...categories.map(cat => cat.sortOrder))
        : 0;
      categoryData.sortOrder = maxSortOrder + 1;
    }

    const categoryRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(categoryRef, {
      ...categoryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return categoryRef.id;
  }

  // Kategori güncelleme
  static async updateCategory(categoryId: string, categoryData: Partial<Category>): Promise<void> {
    const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
    await updateDoc(categoryRef, {
      ...categoryData,
      updatedAt: serverTimestamp()
    });
  }

  // Kategori silme
  static async deleteCategory(categoryId: string): Promise<void> {
    const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
    await deleteDoc(categoryRef);
  }

  // Kategori getirme
  static async getCategory(categoryId: string): Promise<Category | null> {
    const categoryRef = doc(db, this.COLLECTION_NAME, categoryId);
    const categorySnap = await getDoc(categoryRef);
    
    if (categorySnap.exists()) {
      return {
        id: categorySnap.id,
        ...categorySnap.data(),
        createdAt: categorySnap.data().createdAt?.toDate() || new Date(),
        updatedAt: categorySnap.data().updatedAt?.toDate() || new Date()
      } as Category;
    }
    
    return null;
  }

  // Tüm kategorileri getirme
  static async getAllCategories(): Promise<Category[]> {
    const categoriesRef = collection(db, this.COLLECTION_NAME);
    const querySnapshot = await getDocs(categoriesRef);
    
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Category[];

    // Client-side sorting by name
    return categories.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Aktif kategorileri getirme
  static async getActiveCategories(forceRefresh: boolean = false): Promise<Category[]> {
    const categoriesRef = collection(db, this.COLLECTION_NAME);
    
    try {
      if (forceRefresh) {
        console.log('🔄 Kategoriler zorla yenileniyor...');
      }
      
      const querySnapshot = await getDocs(categoriesRef);
      
      const allCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Category[];

      // Client-side filtering and sorting
      const activeCategories = allCategories
        .filter(category => category.isActive === true)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      console.log('📊 Kategori verileri:', {
        toplam: allCategories.length,
        aktif: activeCategories.length,
        kategoriler: activeCategories.map(cat => ({ id: cat.id, name: cat.name, isActive: cat.isActive }))
      });

      return activeCategories;
    } catch (error) {
      console.error('❌ Aktif kategoriler yüklenirken hata:', error);
      throw error;
    }
  }

  // Popüler kategorileri getirme
  static async getPopularCategories(limitCount: number = 6): Promise<Category[]> {
    const categoriesRef = collection(db, this.COLLECTION_NAME);
    const querySnapshot = await getDocs(categoriesRef);
    
    const allCategories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as Category[];

    // Client-side filtering, sorting and limiting
    return allCategories
      .filter(category => category.isActive === true)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .slice(0, limitCount);
  }

  // Kategori durumunu değiştirme
  static async toggleCategoryStatus(categoryId: string): Promise<void> {
    const category = await this.getCategory(categoryId);
    if (category) {
      await this.updateCategory(categoryId, { isActive: !category.isActive });
    }
  }

  // Kategori sırasını güncelleme
  static async updateCategoryOrder(categoryId: string, newOrder: number): Promise<void> {
    await this.updateCategory(categoryId, { sortOrder: newOrder });
  }
} 