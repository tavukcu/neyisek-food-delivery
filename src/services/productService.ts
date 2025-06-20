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
  addDoc,
  onSnapshot,
  Unsubscribe,
  startAfter,
  DocumentSnapshot,
  increment,
  writeBatch,
  QueryConstraint,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, Category } from '@/types';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Error types
export class ProductServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ProductServiceError';
  }
}

export class ProductService {
  private static readonly COLLECTION_NAME = 'products';
  private static readonly CATEGORIES_COLLECTION = 'categories';
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_BATCH_SIZE = 500;
  
  // In-memory cache
  private static cache = new Map<string, CacheEntry<any>>();
  private static subscribers = new Map<string, Unsubscribe>();

  // Cache utilities
  private static getCacheKey(method: string, params: any[]): string {
    return `${method}_${JSON.stringify(params)}`;
  }

  private static getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  private static setCache<T>(key: string, data: T, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private static clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    
    const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Document mapping utility
  private static mapDocumentToProduct(doc: DocumentSnapshot): Product {
    const data = doc.data();
    if (!data) {
      throw new ProductServiceError(
        'Document data is null',
        'INVALID_DOCUMENT',
      );
    }

    return {
      id: doc.id,
      restaurantId: data.restaurantId || '',
      name: data.name || '',
      description: data.description || '',
      price: data.price || 0,
      categoryId: data.categoryId || '',
      imageUrl: data.imageUrl || '',
      images: data.images || [],
      variants: data.variants || [],
      ingredients: data.ingredients || [],
      allergens: data.allergens || [],
      tags: data.tags || [],
      isVegetarian: data.isVegetarian || false,
      isVegan: data.isVegan || false,
      isGlutenFree: data.isGlutenFree || false,
      preparationTime: data.preparationTime || 15,
      calories: data.calories || 0,
      stock: data.stock || 0,
      minStock: data.minStock || 0,
      maxStock: data.maxStock || 999,
      rating: data.rating || 0,
      reviewCount: data.reviewCount || 0,
      isPopular: data.isPopular || false,
      isFeatured: data.isFeatured || false,
      isActive: data.isActive !== false, // Default to true
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Product;
  }

  private static mapDocumentToCategory(doc: DocumentSnapshot): Category {
    const data = doc.data();
    if (!data) {
      throw new ProductServiceError(
        'Category document data is null',
        'INVALID_DOCUMENT',
      );
    }

    return {
      id: doc.id,
      name: data.name || '',
      description: data.description || '',
      imageUrl: data.imageUrl || '',
      sortOrder: data.sortOrder || 0,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Category;
  }

  // Error handling wrapper
  private static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ ProductService.${operationName} error:`, error);
      
      if (error instanceof FirestoreError) {
        throw new ProductServiceError(
          `Firestore error in ${operationName}: ${error.message}`,
          error.code,
          error
        );
      }
      
      throw new ProductServiceError(
        `Unknown error in ${operationName}`,
        'UNKNOWN_ERROR',
        error as Error
      );
    }
  }

  // Ürün oluşturma
  static async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      const productRef = doc(collection(db, this.COLLECTION_NAME));
      await setDoc(productRef, {
        ...productData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Clear relevant cache
      this.clearCache('getAllProducts');
      this.clearCache('getProductsByRestaurant');
      this.clearCache('getProductsByCategory');
      
      return productRef.id;
    }, 'createProduct');
  }

  // Batch ürün oluşturma
  static async createProductsBatch(products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> {
    return this.executeWithErrorHandling(async () => {
      const batch = writeBatch(db);
      const productIds: string[] = [];
      
      for (let i = 0; i < products.length; i += this.MAX_BATCH_SIZE) {
        const chunk = products.slice(i, i + this.MAX_BATCH_SIZE);
        
        for (const productData of chunk) {
          const productRef = doc(collection(db, this.COLLECTION_NAME));
          batch.set(productRef, {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          productIds.push(productRef.id);
        }
        
        await batch.commit();
      }
      
      this.clearCache();
      return productIds;
    }, 'createProductsBatch');
  }

  // Ürün getirme
  static async getProduct(id: string): Promise<Product | null> {
    const cacheKey = this.getCacheKey('getProduct', [id]);
    const cached = this.getFromCache<Product | null>(cacheKey);
    if (cached !== null) return cached;

    return this.executeWithErrorHandling(async () => {
      const productRef = doc(db, this.COLLECTION_NAME, id);
      const productSnap = await getDoc(productRef);
      
      const result = productSnap.exists() ? this.mapDocumentToProduct(productSnap) : null;
      this.setCache(cacheKey, result);
      
      return result;
    }, 'getProduct');
  }

  // Optimized getAllProducts with proper indexing
  static async getAllProducts(
    pageSize: number = 20, 
    lastDoc?: DocumentSnapshot,
    useCache: boolean = true
  ): Promise<{ products: Product[], lastDoc: DocumentSnapshot | null }> {
    const cacheKey = this.getCacheKey('getAllProducts', [pageSize, lastDoc?.id]);
    
    if (useCache) {
      const cached = this.getFromCache<{ products: Product[], lastDoc: DocumentSnapshot | null }>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      console.log('🔍 ProductService.getAllProducts: Starting optimized query...');
      
      const productsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(pageSize)
      ];
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      const result = { products, lastDoc: lastDocument };
      
      if (useCache) {
        this.setCache(cacheKey, result, this.CACHE_TTL);
      }
      
      console.log('✅ ProductService.getAllProducts: Optimized result:', products.length);
      return result;
    }, 'getAllProducts');
  }

  // Kategoriye göre ürün getirme - Optimized
  static async getProductsByCategory(categoryId: string, useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getProductsByCategory', [categoryId]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('categoryId', '==', categoryId),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getProductsByCategory');
  }

  // Restorana göre ürün getirme - Optimized
  static async getProductsByRestaurant(restaurantId: string, useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getProductsByRestaurant', [restaurantId]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getProductsByRestaurant');
  }

  // Restorana göre TÜM ürünleri getirme (aktif + pasif) - Yönetim paneli için
  static async getAllProductsByRestaurant(restaurantId: string): Promise<Product[]> {
    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
    }, 'getAllProductsByRestaurant');
  }

  // Restorana ve kategoriye göre ürün getirme - Optimized
  static async getProductsByRestaurantAndCategory(
    restaurantId: string, 
    categoryId: string,
    useCache: boolean = true
  ): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getProductsByRestaurantAndCategory', [restaurantId, categoryId]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('restaurantId', '==', restaurantId),
        where('categoryId', '==', categoryId),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getProductsByRestaurantAndCategory');
  }

  // Popüler ürünleri getirme - Optimized
  static async getPopularProducts(limitCount: number = 10, useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getPopularProducts', [limitCount]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('isActive', '==', true),
        where('isPopular', '==', true),
        orderBy('rating', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getPopularProducts');
  }

  // Öne çıkan ürünleri getirme - Optimized
  static async getFeaturedProducts(limitCount: number = 8, useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getFeaturedProducts', [limitCount]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('isActive', '==', true),
        where('isFeatured', '==', true),
        orderBy('updatedAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getFeaturedProducts');
  }

  // Ürün güncelleme
  static async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const productRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(productRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Clear relevant cache
      this.clearCache();
    }, 'updateProduct');
  }

  // Batch ürün güncelleme
  static async updateProductsBatch(updates: { id: string; data: Partial<Omit<Product, 'id' | 'createdAt'>> }[]): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const batch = writeBatch(db);
      
      for (const update of updates) {
        const productRef = doc(db, this.COLLECTION_NAME, update.id);
        batch.update(productRef, {
          ...update.data,
          updatedAt: serverTimestamp()
        });
      }
      
      await batch.commit();
      this.clearCache();
    }, 'updateProductsBatch');
  }

  // Ürün silme (Soft delete)
  static async deleteProduct(id: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const productRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(productRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      this.clearCache();
    }, 'deleteProduct');
  }

  // Ürün stok güncelleme
  static async updateStock(id: string, quantity: number): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const productRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(productRef, {
        stock: increment(quantity),
        updatedAt: serverTimestamp()
      });
      
      // Clear stock-related cache
      this.clearCache('getProduct');
      this.clearCache('getLowStockProducts');
    }, 'updateStock');
  }

  // Optimized search with better indexing
  static async searchProducts(
    searchTerm: string, 
    categoryId?: string,
    restaurantId?: string,
    useCache: boolean = true
  ): Promise<Product[]> {
    const cacheKey = this.getCacheKey('searchProducts', [searchTerm, categoryId, restaurantId]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [
        where('isActive', '==', true)
      ];

      // Add search constraints
      if (searchTerm) {
        const searchTermLower = searchTerm.toLowerCase();
        constraints.push(
          where('name', '>=', searchTermLower),
          where('name', '<=', searchTermLower + '\uf8ff')
        );
      }

      if (categoryId) {
        constraints.push(where('categoryId', '==', categoryId));
      }

      if (restaurantId) {
        constraints.push(where('restaurantId', '==', restaurantId));
      }

      constraints.push(limit(50)); // Reasonable limit for search

      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      // Additional client-side filtering for better search results
      const filteredProducts = products.filter(product => {
        if (!searchTerm) return true;
        
        const searchLower = searchTerm.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
          product.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchLower))
        );
      });

      if (useCache) {
        this.setCache(cacheKey, filteredProducts, this.CACHE_TTL / 2); // Shorter cache for search
      }
      
      return filteredProducts;
    }, 'searchProducts');
  }

  // Diyet özelliklerine göre ürün filtreleme - Optimized
  static async getProductsByDietaryFilter(filters: {
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    categoryId?: string;
    restaurantId?: string;
  }, useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getProductsByDietaryFilter', [filters]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [where('isActive', '==', true)];
      
      if (filters.isVegetarian) {
        constraints.push(where('isVegetarian', '==', true));
      }
      if (filters.isVegan) {
        constraints.push(where('isVegan', '==', true));
      }
      if (filters.isGlutenFree) {
        constraints.push(where('isGlutenFree', '==', true));
      }
      if (filters.categoryId) {
        constraints.push(where('categoryId', '==', filters.categoryId));
      }
      if (filters.restaurantId) {
        constraints.push(where('restaurantId', '==', filters.restaurantId));
      }
      
      constraints.push(orderBy('name', 'asc'));
      
      const q = query(productsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getProductsByDietaryFilter');
  }

  // Kategori oluşturma
  static async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      const categoryRef = doc(collection(db, this.CATEGORIES_COLLECTION));
      await setDoc(categoryRef, {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      this.clearCache('getAllCategories');
      return categoryRef.id;
    }, 'createCategory');
  }

  // Tüm kategorileri getirme - Optimized
  static async getAllCategories(useCache: boolean = true): Promise<Category[]> {
    const cacheKey = this.getCacheKey('getAllCategories', []);
    
    if (useCache) {
      const cached = this.getFromCache<Category[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const categoriesRef = collection(db, this.CATEGORIES_COLLECTION);
      const q = query(
        categoriesRef, 
        where('isActive', '==', true), 
        orderBy('sortOrder', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const categories = querySnapshot.docs.map(doc => this.mapDocumentToCategory(doc));
      
      if (useCache) {
        this.setCache(cacheKey, categories, this.CACHE_TTL * 2); // Longer cache for categories
      }
      
      return categories;
    }, 'getAllCategories');
  }

  // Kategori güncelleme
  static async updateCategory(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const categoryRef = doc(db, this.CATEGORIES_COLLECTION, id);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      this.clearCache('getAllCategories');
    }, 'updateCategory');
  }

  // Kategori silme
  static async deleteCategory(id: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const categoryRef = doc(db, this.CATEGORIES_COLLECTION, id);
      await updateDoc(categoryRef, {
        isActive: false,
        updatedAt: serverTimestamp()
      });
      
      this.clearCache('getAllCategories');
    }, 'deleteCategory');
  }

  // Real-time ürün dinleme - Improved with proper cleanup
  static subscribeToProducts(
    categoryId: string | null,
    callback: (products: Product[]) => void,
    restaurantId?: string
  ): Unsubscribe {
    const subscriptionKey = `products_${categoryId}_${restaurantId}`;
    
    // Clean up existing subscription
    const existingUnsubscribe = this.subscribers.get(subscriptionKey);
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    const productsRef = collection(db, this.COLLECTION_NAME);
    const constraints: QueryConstraint[] = [where('isActive', '==', true)];
    
    if (categoryId) {
      constraints.push(where('categoryId', '==', categoryId));
    }
    
    if (restaurantId) {
      constraints.push(where('restaurantId', '==', restaurantId));
    }
    
    constraints.push(orderBy('updatedAt', 'desc'));
    
    const q = query(productsRef, ...constraints);
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        try {
          const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
          callback(products);
        } catch (error) {
          console.error('Error in products subscription:', error);
        }
      },
      (error) => {
        console.error('Products subscription error:', error);
      }
    );
    
    this.subscribers.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  // Ürün puanlama güncelleme
  static async updateProductRating(productId: string, newRating: number): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const productRef = doc(db, this.COLLECTION_NAME, productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const currentData = productSnap.data();
        const currentRating = currentData.rating || 0;
        const currentCount = currentData.reviewCount || 0;
        
        const newCount = currentCount + 1;
        const updatedRating = ((currentRating * currentCount) + newRating) / newCount;
        
        await updateDoc(productRef, {
          rating: Math.round(updatedRating * 10) / 10, // Round to 1 decimal
          reviewCount: newCount,
          updatedAt: serverTimestamp()
        });
        
        this.clearCache('getProduct');
        this.clearCache('getPopularProducts');
      }
    }, 'updateProductRating');
  }

  // Düşük stok ürünlerini getirme - Optimized
  static async getLowStockProducts(threshold: number = 10, useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getLowStockProducts', [threshold]);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('isActive', '==', true),
        where('stock', '<=', threshold),
        orderBy('stock', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products, this.CACHE_TTL / 2); // Shorter cache for stock data
      }
      
      return products;
    }, 'getLowStockProducts');
  }

  // Aktif ürünleri getirme - Optimized
  static async getActiveProducts(useCache: boolean = true): Promise<Product[]> {
    const cacheKey = this.getCacheKey('getActiveProducts', []);
    
    if (useCache) {
      const cached = this.getFromCache<Product[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const productsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        productsRef,
        where('isActive', '==', true),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const products = querySnapshot.docs.map(doc => this.mapDocumentToProduct(doc));
      
      if (useCache) {
        this.setCache(cacheKey, products);
      }
      
      return products;
    }, 'getActiveProducts');
  }

  // Demo ürünler oluşturma (test için) - Optimized with batch
  static async createDemoProducts(restaurantId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const demoProducts: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Margherita Pizza',
          description: 'Klasik İtalyan pizzası - domates sosu, mozzarella ve fesleğen',
          price: 45,
          categoryId: 'Pizza',
          imageUrl: '/images/margherita-pizza.jpg',
          images: [],
          variants: [],
          restaurantId,
          isActive: true,
          preparationTime: 25,
          rating: 4.5,
          reviewCount: 123,
          ingredients: ['domates sosu', 'mozzarella', 'fesleğen', 'zeytinyağı'],
          allergens: ['süt ürünleri', 'gluten'],
          calories: 280,
          isVegetarian: true,
          isVegan: false,
          isGlutenFree: false,
          tags: ['popüler', 'klasik'],
          stock: 50,
          minStock: 5,
          maxStock: 100,
          isPopular: true,
          isFeatured: false
        },
        {
          name: 'Chicken Döner',
          description: 'Lezzetli tavuk döner, pilav ve salata ile',
          price: 35,
          categoryId: 'Döner',
          imageUrl: '/images/chicken-doner.jpg',
          images: [],
          variants: [],
          restaurantId,
          isActive: true,
          preparationTime: 15,
          rating: 4.3,
          reviewCount: 89,
          ingredients: ['tavuk eti', 'pilav', 'salata', 'sos'],
          allergens: ['gluten'],
          calories: 420,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          tags: ['hızlı', 'doyurucu'],
          stock: 30,
          minStock: 3,
          maxStock: 50,
          isPopular: false,
          isFeatured: true
        },
        {
          name: 'Cheeseburger',
          description: 'Sulu köfte, cheddar peyniri, marul ve domates',
          price: 28,
          categoryId: 'Burger',
          imageUrl: '/images/cheeseburger.jpg',
          images: [],
          variants: [],
          restaurantId,
          isActive: true,
          preparationTime: 20,
          rating: 4.1,
          reviewCount: 67,
          ingredients: ['dana eti', 'cheddar', 'marul', 'domates', 'burger ekmeği'],
          allergens: ['süt ürünleri', 'gluten'],
          calories: 550,
          isVegetarian: false,
          isVegan: false,
          isGlutenFree: false,
          tags: ['klasik', 'lezzetli'],
          stock: 25,
          minStock: 2,
          maxStock: 40,
          isPopular: false,
          isFeatured: false
        }
      ];

      await this.createProductsBatch(demoProducts);
      console.log(`✅ ${demoProducts.length} demo ürün başarıyla oluşturuldu!`);
    }, 'createDemoProducts');
  }

  // Utility methods
  static clearAllCache(): void {
    this.clearCache();
  }

  static clearAllSubscriptions(): void {
    const unsubscribers = Array.from(this.subscribers.values());
    unsubscribers.forEach(unsubscribe => unsubscribe());
    this.subscribers.clear();
  }

  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
} 