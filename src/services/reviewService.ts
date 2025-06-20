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
  FirestoreError,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ReviewType, ReviewStatus } from '@/types';
import type { 
  Review, 
  ProductReview, 
  RestaurantReview, 
  OrderReview,
  ReviewSummary,
  ProductReviewSummary,
  RestaurantReviewSummary,
  ReviewFilters,
  ReviewStats,
  ReviewResponse,
  ReviewReport,
  ReviewHelpful,
  ReviewNotificationSettings,
  User,
  Product,
  RestaurantInfo,
  Order
} from '@/types';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Error types
export class ReviewServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ReviewServiceError';
  }
}

export class ReviewService {
  private static readonly REVIEWS_COLLECTION = 'reviews';
  private static readonly REVIEW_RESPONSES_COLLECTION = 'reviewResponses';
  private static readonly REVIEW_REPORTS_COLLECTION = 'reviewReports';
  private static readonly REVIEW_HELPFUL_COLLECTION = 'reviewHelpful';
  private static readonly REVIEW_SUMMARIES_COLLECTION = 'reviewSummaries';
  private static readonly NOTIFICATION_SETTINGS_COLLECTION = 'reviewNotificationSettings';
  
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

  // Document mapping utilities
  private static mapDocumentToReview(doc: DocumentSnapshot): Review {
    const data = doc.data();
    if (!data) {
      throw new ReviewServiceError(
        'Review document data is null',
        'INVALID_DOCUMENT',
      );
    }

    return {
      id: doc.id,
      userId: data.userId || '',
      user: data.user || {},
      type: data.type || ReviewType.PRODUCT,
      targetId: data.targetId || '',
      orderId: data.orderId,
      rating: data.rating || 0,
      title: data.title,
      comment: data.comment || '',
      pros: data.pros || [],
      cons: data.cons || [],
      images: data.images || [],
      isVerifiedPurchase: data.isVerifiedPurchase || false,
      isAnonymous: data.isAnonymous || false,
      status: data.status || ReviewStatus.PENDING,
      helpfulCount: data.helpfulCount || 0,
      reportCount: data.reportCount || 0,
      moderatorNote: data.moderatorNote,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Review;
  }

  // Error handling wrapper
  private static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ ReviewService.${operationName} error:`, error);
      
      if (error instanceof FirestoreError) {
        throw new ReviewServiceError(
          `Firestore error in ${operationName}: ${error.message}`,
          error.code,
          error
        );
      }
      
      throw new ReviewServiceError(
        `Unknown error in ${operationName}`,
        'UNKNOWN_ERROR',
        error as Error
      );
    }
  }

  // ===== TEMEL CRUD İŞLEMLERİ =====

  // Değerlendirme oluşturma
  static async createReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'reportCount'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      console.log('📝 ReviewService.createReview: Yeni değerlendirme oluşturuluyor...');
      
      // Kullanıcının daha önce bu hedef için değerlendirme yapıp yapmadığını kontrol et
      const existingReview = await this.getUserReviewForTarget(reviewData.userId, reviewData.targetId, reviewData.type);
      if (existingReview) {
        throw new ReviewServiceError(
          'Bu ürün/restoran için zaten değerlendirme yapmışsınız',
          'REVIEW_ALREADY_EXISTS'
        );
      }

      const reviewRef = doc(collection(db, this.REVIEWS_COLLECTION));
      const newReview = {
        ...reviewData,
        helpfulCount: 0,
        reportCount: 0,
        status: ReviewStatus.APPROVED, // Otomatik onay (isteğe bağlı olarak PENDING yapılabilir)
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(reviewRef, newReview);
      
      // Hedef nesnenin puanını güncelle
      await this.updateTargetRating(reviewData.targetId, reviewData.type, reviewData.rating);
      
      // Cache'i temizle
      this.clearCache();
      
      console.log('✅ ReviewService.createReview: Değerlendirme başarıyla oluşturuldu');
      return reviewRef.id;
    }, 'createReview');
  }

  // Ürün değerlendirmesi oluşturma
  static async createProductReview(reviewData: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'reportCount'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      console.log('🍕 ReviewService.createProductReview: Ürün değerlendirmesi oluşturuluyor...');
      
      const reviewRef = doc(collection(db, this.REVIEWS_COLLECTION));
      const newReview = {
        ...reviewData,
        type: ReviewType.PRODUCT,
        helpfulCount: 0,
        reportCount: 0,
        status: ReviewStatus.APPROVED,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(reviewRef, newReview);
      
      // Ürün puanını güncelle
      await this.updateProductRating(reviewData.productId, reviewData.rating);
      
      // Restoran puanını da güncelle
      await this.updateRestaurantRatingFromProduct(reviewData.restaurantId);
      
      this.clearCache();
      return reviewRef.id;
    }, 'createProductReview');
  }

  // Restoran değerlendirmesi oluşturma
  static async createRestaurantReview(reviewData: Omit<RestaurantReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'reportCount'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      console.log('🏪 ReviewService.createRestaurantReview: Restoran değerlendirmesi oluşturuluyor...');
      
      const reviewRef = doc(collection(db, this.REVIEWS_COLLECTION));
      const newReview = {
        ...reviewData,
        type: ReviewType.RESTAURANT,
        helpfulCount: 0,
        reportCount: 0,
        status: ReviewStatus.APPROVED,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(reviewRef, newReview);
      
      // Restoran puanını güncelle
      await this.updateRestaurantRating(reviewData.restaurantId, reviewData.rating);
      
      this.clearCache();
      return reviewRef.id;
    }, 'createRestaurantReview');
  }

  // Değerlendirme getirme
  static async getReview(id: string): Promise<Review | null> {
    const cacheKey = this.getCacheKey('getReview', [id]);
    const cached = this.getFromCache<Review | null>(cacheKey);
    if (cached !== null) return cached;

    return this.executeWithErrorHandling(async () => {
      const reviewRef = doc(db, this.REVIEWS_COLLECTION, id);
      const reviewSnap = await getDoc(reviewRef);
      
      const result = reviewSnap.exists() ? this.mapDocumentToReview(reviewSnap) : null;
      this.setCache(cacheKey, result);
      
      return result;
    }, 'getReview');
  }

  // Kullanıcının belirli hedef için değerlendirmesini getirme
  static async getUserReviewForTarget(userId: string, targetId: string, type: ReviewType): Promise<Review | null> {
    return this.executeWithErrorHandling(async () => {
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const q = query(
        reviewsRef,
        where('userId', '==', userId),
        where('targetId', '==', targetId),
        where('type', '==', type),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty ? null : this.mapDocumentToReview(querySnapshot.docs[0]);
    }, 'getUserReviewForTarget');
  }

  // ===== DEĞERLENDIRME LİSTELEME İŞLEMLERİ =====

  // Ürün değerlendirmelerini getirme
  static async getProductReviews(
    productId: string, 
    filters?: ReviewFilters,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ reviews: ProductReview[], lastDoc: DocumentSnapshot | null }> {
    const cacheKey = this.getCacheKey('getProductReviews', [productId, filters, pageSize, lastDoc?.id]);
    const cached = this.getFromCache<{ reviews: ProductReview[], lastDoc: DocumentSnapshot | null }>(cacheKey);
    if (cached) return cached;

    return this.executeWithErrorHandling(async () => {
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const constraints: QueryConstraint[] = [
        where('targetId', '==', productId),
        where('type', '==', ReviewType.PRODUCT),
        where('status', '==', ReviewStatus.APPROVED)
      ];

      // Filtreleri uygula
      if (filters?.rating && filters.rating.length > 0) {
        constraints.push(where('rating', 'in', filters.rating));
      }

      if (filters?.isVerified !== undefined) {
        constraints.push(where('isVerifiedPurchase', '==', filters.isVerified));
      }

      // Sıralama
      const sortBy = filters?.sortBy || 'newest';
      switch (sortBy) {
        case 'newest':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'oldest':
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case 'highest':
          constraints.push(orderBy('rating', 'desc'));
          break;
        case 'lowest':
          constraints.push(orderBy('rating', 'asc'));
          break;
        case 'helpful':
          constraints.push(orderBy('helpfulCount', 'desc'));
          break;
      }

      constraints.push(limit(pageSize));

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(reviewsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const reviews = querySnapshot.docs.map(doc => this.mapDocumentToReview(doc) as ProductReview);
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      const result = { reviews, lastDoc: lastDocument };
      this.setCache(cacheKey, result);
      
      return result;
    }, 'getProductReviews');
  }

  // Restoran değerlendirmelerini getirme
  static async getRestaurantReviews(
    restaurantId: string, 
    filters?: ReviewFilters,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ reviews: RestaurantReview[], lastDoc: DocumentSnapshot | null }> {
    const cacheKey = this.getCacheKey('getRestaurantReviews', [restaurantId, filters, pageSize, lastDoc?.id]);
    const cached = this.getFromCache<{ reviews: RestaurantReview[], lastDoc: DocumentSnapshot | null }>(cacheKey);
    if (cached) return cached;

    return this.executeWithErrorHandling(async () => {
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const constraints: QueryConstraint[] = [
        where('targetId', '==', restaurantId),
        where('type', '==', ReviewType.RESTAURANT),
        where('status', '==', ReviewStatus.APPROVED)
      ];

      // Filtreleri uygula
      if (filters?.rating && filters.rating.length > 0) {
        constraints.push(where('rating', 'in', filters.rating));
      }

      // Sıralama
      const sortBy = filters?.sortBy || 'newest';
      switch (sortBy) {
        case 'newest':
          constraints.push(orderBy('createdAt', 'desc'));
          break;
        case 'oldest':
          constraints.push(orderBy('createdAt', 'asc'));
          break;
        case 'highest':
          constraints.push(orderBy('rating', 'desc'));
          break;
        case 'lowest':
          constraints.push(orderBy('rating', 'asc'));
          break;
        case 'helpful':
          constraints.push(orderBy('helpfulCount', 'desc'));
          break;
      }

      constraints.push(limit(pageSize));

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(reviewsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const reviews = querySnapshot.docs.map(doc => this.mapDocumentToReview(doc) as RestaurantReview);
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      const result = { reviews, lastDoc: lastDocument };
      this.setCache(cacheKey, result);
      
      return result;
    }, 'getRestaurantReviews');
  }

  // Kullanıcının değerlendirmelerini getirme
  static async getUserReviews(
    userId: string,
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ reviews: Review[], lastDoc: DocumentSnapshot | null }> {
    return this.executeWithErrorHandling(async () => {
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      ];

      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      const q = query(reviewsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      
      const reviews = querySnapshot.docs.map(doc => this.mapDocumentToReview(doc));
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      
      return { reviews, lastDoc: lastDocument };
    }, 'getUserReviews');
  }

  // ===== PUANLAMA GÜNCELLEMELERİ =====

  // Hedef nesnenin puanını güncelleme
  private static async updateTargetRating(targetId: string, type: ReviewType, newRating: number): Promise<void> {
    switch (type) {
      case ReviewType.PRODUCT:
        await this.updateProductRating(targetId, newRating);
        break;
      case ReviewType.RESTAURANT:
        await this.updateRestaurantRating(targetId, newRating);
        break;
    }
  }

  // Ürün puanını güncelleme
  private static async updateProductRating(productId: string, newRating: number): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      // Ürünün mevcut puanını al
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const currentData = productSnap.data();
        const currentRating = currentData.rating || 0;
        const currentCount = currentData.reviewCount || 0;
        
        const newCount = currentCount + 1;
        const updatedRating = ((currentRating * currentCount) + newRating) / newCount;
        
        await updateDoc(productRef, {
          rating: Math.round(updatedRating * 10) / 10,
          reviewCount: newCount,
          updatedAt: serverTimestamp()
        });
      }
    }, 'updateProductRating');
  }

  // Restoran puanını güncelleme
  private static async updateRestaurantRating(restaurantId: string, newRating: number): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      const restaurantSnap = await getDoc(restaurantRef);
      
      if (restaurantSnap.exists()) {
        const currentData = restaurantSnap.data();
        const currentRating = currentData.rating || 0;
        const currentCount = currentData.reviewCount || 0;
        
        const newCount = currentCount + 1;
        const updatedRating = ((currentRating * currentCount) + newRating) / newCount;
        
        await updateDoc(restaurantRef, {
          rating: Math.round(updatedRating * 10) / 10,
          reviewCount: newCount,
          updatedAt: serverTimestamp()
        });
      }
    }, 'updateRestaurantRating');
  }

  // Restoran puanını ürün değerlendirmelerinden güncelleme
  private static async updateRestaurantRatingFromProduct(restaurantId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      // Restoranın tüm ürün değerlendirmelerini al
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const q = query(
        reviewsRef,
        where('restaurantId', '==', restaurantId),
        where('type', '==', ReviewType.PRODUCT),
        where('status', '==', ReviewStatus.APPROVED)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => this.mapDocumentToReview(doc));
      
      if (reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        
        const restaurantRef = doc(db, 'restaurants', restaurantId);
        await updateDoc(restaurantRef, {
          rating: Math.round(averageRating * 10) / 10,
          reviewCount: reviews.length,
          updatedAt: serverTimestamp()
        });
      }
    }, 'updateRestaurantRatingFromProduct');
  }

  // ===== YARDIMCI İŞLEMLER =====

  // Değerlendirmeyi faydalı bulma
  static async markReviewHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const helpfulRef = doc(collection(db, this.REVIEW_HELPFUL_COLLECTION));
      
      // Mevcut kaydı kontrol et
      const existingQuery = query(
        collection(db, this.REVIEW_HELPFUL_COLLECTION),
        where('reviewId', '==', reviewId),
        where('userId', '==', userId)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        // Mevcut kaydı güncelle
        const existingDoc = existingSnapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          isHelpful,
          createdAt: serverTimestamp()
        });
      } else {
        // Yeni kayıt oluştur
        await setDoc(helpfulRef, {
          reviewId,
          userId,
          isHelpful,
          createdAt: serverTimestamp()
        });
      }
      
      // Değerlendirmenin faydalı sayısını güncelle
      await this.updateReviewHelpfulCount(reviewId);
      
      this.clearCache();
    }, 'markReviewHelpful');
  }

  // Değerlendirmenin faydalı sayısını güncelleme
  private static async updateReviewHelpfulCount(reviewId: string): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const helpfulQuery = query(
        collection(db, this.REVIEW_HELPFUL_COLLECTION),
        where('reviewId', '==', reviewId),
        where('isHelpful', '==', true)
      );
      
      const helpfulSnapshot = await getDocs(helpfulQuery);
      const helpfulCount = helpfulSnapshot.size;
      
      const reviewRef = doc(db, this.REVIEWS_COLLECTION, reviewId);
      await updateDoc(reviewRef, {
        helpfulCount,
        updatedAt: serverTimestamp()
      });
    }, 'updateReviewHelpfulCount');
  }

  // Değerlendirme yanıtı oluşturma
  static async createReviewResponse(responseData: Omit<ReviewResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      const responseRef = doc(collection(db, this.REVIEW_RESPONSES_COLLECTION));
      
      await setDoc(responseRef, {
        ...responseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      this.clearCache();
      return responseRef.id;
    }, 'createReviewResponse');
  }

  // Değerlendirme yanıtlarını getirme
  static async getReviewResponses(reviewId: string): Promise<ReviewResponse[]> {
    return this.executeWithErrorHandling(async () => {
      const responsesRef = collection(db, this.REVIEW_RESPONSES_COLLECTION);
      const q = query(
        responsesRef,
        where('reviewId', '==', reviewId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      } as ReviewResponse));
    }, 'getReviewResponses');
  }

  // ===== İSTATİSTİKLER VE ÖZETLERİ =====

  // Ürün değerlendirme özeti
  static async getProductReviewSummary(productId: string): Promise<ProductReviewSummary | null> {
    const cacheKey = this.getCacheKey('getProductReviewSummary', [productId]);
    const cached = this.getFromCache<ProductReviewSummary | null>(cacheKey);
    if (cached !== null) return cached;

    return this.executeWithErrorHandling(async () => {
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const q = query(
        reviewsRef,
        where('targetId', '==', productId),
        where('type', '==', ReviewType.PRODUCT),
        where('status', '==', ReviewStatus.APPROVED)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => this.mapDocumentToReview(doc) as ProductReview);
      
      if (reviews.length === 0) {
        return null;
      }

      // Puan dağılımını hesapla
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalQuality = 0, totalTaste = 0, totalPortion = 0, totalValue = 0;
      let recommendCount = 0;
      let verifiedCount = 0;

      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        
        if (review.qualityRating) totalQuality += review.qualityRating;
        if (review.tasteRating) totalTaste += review.tasteRating;
        if (review.portionRating) totalPortion += review.portionRating;
        if (review.valueRating) totalValue += review.valueRating;
        if (review.wouldRecommend) recommendCount++;
        if (review.isVerifiedPurchase) verifiedCount++;
      });

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      const summary: ProductReviewSummary = {
        targetId: productId,
        productId,
        type: ReviewType.PRODUCT,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        verifiedPurchaseCount: verifiedCount,
        averageQualityRating: Math.round((totalQuality / reviews.length) * 10) / 10,
        averageTasteRating: Math.round((totalTaste / reviews.length) * 10) / 10,
        averagePortionRating: Math.round((totalPortion / reviews.length) * 10) / 10,
        averageValueRating: Math.round((totalValue / reviews.length) * 10) / 10,
        recommendationRate: Math.round((recommendCount / reviews.length) * 100),
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, summary, this.CACHE_TTL * 2);
      return summary;
    }, 'getProductReviewSummary');
  }

  // Restoran değerlendirme özeti
  static async getRestaurantReviewSummary(restaurantId: string): Promise<RestaurantReviewSummary | null> {
    const cacheKey = this.getCacheKey('getRestaurantReviewSummary', [restaurantId]);
    const cached = this.getFromCache<RestaurantReviewSummary | null>(cacheKey);
    if (cached !== null) return cached;

    return this.executeWithErrorHandling(async () => {
      const reviewsRef = collection(db, this.REVIEWS_COLLECTION);
      const q = query(
        reviewsRef,
        where('targetId', '==', restaurantId),
        where('type', '==', ReviewType.RESTAURANT),
        where('status', '==', ReviewStatus.APPROVED)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map(doc => this.mapDocumentToReview(doc) as RestaurantReview);
      
      if (reviews.length === 0) {
        return null;
      }

      // Puan dağılımını hesapla
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let totalFood = 0, totalService = 0, totalDelivery = 0, totalValue = 0;
      let reorderCount = 0;
      let verifiedCount = 0;

      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
        
        if (review.foodQualityRating) totalFood += review.foodQualityRating;
        if (review.serviceRating) totalService += review.serviceRating;
        if (review.deliveryRating) totalDelivery += review.deliveryRating;
        if (review.valueRating) totalValue += review.valueRating;
        if (review.wouldOrderAgain) reorderCount++;
        if (review.isVerifiedPurchase) verifiedCount++;
      });

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

      const summary: RestaurantReviewSummary = {
        targetId: restaurantId,
        restaurantId,
        type: ReviewType.RESTAURANT,
        totalReviews: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        verifiedPurchaseCount: verifiedCount,
        averageFoodQualityRating: Math.round((totalFood / reviews.length) * 10) / 10,
        averageServiceRating: Math.round((totalService / reviews.length) * 10) / 10,
        averageDeliveryRating: Math.round((totalDelivery / reviews.length) * 10) / 10,
        averageValueRating: Math.round((totalValue / reviews.length) * 10) / 10,
        reorderRate: Math.round((reorderCount / reviews.length) * 100),
        lastUpdated: new Date()
      };

      this.setCache(cacheKey, summary, this.CACHE_TTL * 2);
      return summary;
    }, 'getRestaurantReviewSummary');
  }

  // ===== UTILITY METHODS =====

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