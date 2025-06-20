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
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Complaint, 
  ComplaintResponse, 
  ComplaintStats, 
  ComplaintFilters, 
  ComplaintNotification,
  ComplaintType, 
  ComplaintStatus, 
  ComplaintPriority,
  User 
} from '@/types';

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Error types
export class ComplaintServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ComplaintServiceError';
  }
}

export class ComplaintService {
  private static readonly COLLECTION_NAME = 'complaints';
  private static readonly RESPONSES_COLLECTION = 'complaintResponses';
  private static readonly NOTIFICATIONS_COLLECTION = 'complaintNotifications';
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  
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
  private static mapDocumentToComplaint(doc: DocumentSnapshot): Complaint {
    const data = doc.data();
    if (!data) {
      throw new ComplaintServiceError(
        'Document data is null',
        'INVALID_DOCUMENT',
      );
    }

    return {
      id: doc.id,
      userId: data.userId || '',
      user: data.user || {},
      type: data.type || ComplaintType.OTHER,
      title: data.title || '',
      description: data.description || '',
      orderId: data.orderId,
      productId: data.productId,
      restaurantId: data.restaurantId,
      status: data.status || ComplaintStatus.PENDING,
      priority: data.priority || ComplaintPriority.MEDIUM,
      images: data.images || [],
      adminNotes: data.adminNotes,
      assignedTo: data.assignedTo,
      resolution: data.resolution,
      satisfactionRating: data.satisfactionRating,
      isAnonymous: data.isAnonymous || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate(),
      responseTime: data.responseTime
    } as Complaint;
  }

  private static mapDocumentToComplaintResponse(doc: DocumentSnapshot): ComplaintResponse {
    const data = doc.data();
    if (!data) {
      throw new ComplaintServiceError(
        'Response document data is null',
        'INVALID_DOCUMENT',
      );
    }

    return {
      id: doc.id,
      complaintId: data.complaintId || '',
      adminId: data.adminId || '',
      adminName: data.adminName || '',
      message: data.message || '',
      isPublic: data.isPublic || false,
      createdAt: data.createdAt?.toDate() || new Date()
    } as ComplaintResponse;
  }

  // Error handling wrapper
  private static async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`❌ ComplaintService.${operationName} error:`, error);
      
      if (error instanceof FirestoreError) {
        throw new ComplaintServiceError(
          `Firestore error in ${operationName}: ${error.message}`,
          error.code,
          error
        );
      }
      
      throw new ComplaintServiceError(
        `Unknown error in ${operationName}`,
        'UNKNOWN_ERROR',
        error as Error
      );
    }
  }

  // Şikayet oluşturma
  static async createComplaint(complaintData: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'responseTime'>): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      console.log('🔥 ComplaintService.createComplaint başladı');
      console.log('📋 Gelen veri:', {
        userId: complaintData.userId,
        type: complaintData.type,
        title: complaintData.title,
        priority: complaintData.priority
      });

      const complaintRef = doc(collection(db, this.COLLECTION_NAME));
      
      // Otomatik öncelik belirleme
      let priority = complaintData.priority;
      if (complaintData.type === ComplaintType.PAYMENT || complaintData.type === ComplaintType.TECHNICAL) {
        priority = ComplaintPriority.HIGH;
      } else if (complaintData.type === ComplaintType.DELIVERY) {
        priority = ComplaintPriority.MEDIUM;
      }

      // Temiz veri hazırla
      const cleanComplaintData: any = {
        userId: complaintData.userId,
        user: complaintData.user,
        type: complaintData.type,
        title: complaintData.title,
        description: complaintData.description,
        priority,
        status: ComplaintStatus.PENDING,
        isAnonymous: complaintData.isAnonymous || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Opsiyonel alanları ekle
      if (complaintData.orderId) {
        cleanComplaintData.orderId = complaintData.orderId;
      }
      if (complaintData.productId) {
        cleanComplaintData.productId = complaintData.productId;
      }
      if (complaintData.restaurantId) {
        cleanComplaintData.restaurantId = complaintData.restaurantId;
      }
      if (complaintData.images && complaintData.images.length > 0) {
        cleanComplaintData.images = complaintData.images;
      }

      console.log('💾 Firestore\'a yazılıyor...');
      await setDoc(complaintRef, cleanComplaintData);
      
      console.log('✅ Şikayet başarıyla oluşturuldu:', complaintRef.id);
      this.clearCache();
      return complaintRef.id;
    }, 'createComplaint');
  }

  // Şikayet getirme
  static async getComplaint(id: string): Promise<Complaint | null> {
    const cacheKey = this.getCacheKey('getComplaint', [id]);
    const cached = this.getFromCache<Complaint | null>(cacheKey);
    if (cached !== null) return cached;

    return this.executeWithErrorHandling(async () => {
      const complaintRef = doc(db, this.COLLECTION_NAME, id);
      const complaintSnap = await getDoc(complaintRef);
      
      const result = complaintSnap.exists() ? this.mapDocumentToComplaint(complaintSnap) : null;
      this.setCache(cacheKey, result);
      
      return result;
    }, 'getComplaint');
  }

  // Kullanıcının şikayetlerini getirme
  static async getUserComplaints(userId: string, useCache: boolean = true): Promise<Complaint[]> {
    const cacheKey = this.getCacheKey('getUserComplaints', [userId]);
    
    if (useCache) {
      const cached = this.getFromCache<Complaint[]>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      const complaintsRef = collection(db, this.COLLECTION_NAME);
      const q = query(
        complaintsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const complaints = querySnapshot.docs.map(doc => this.mapDocumentToComplaint(doc));
      
      if (useCache) {
        this.setCache(cacheKey, complaints);
      }
      
      return complaints;
    }, 'getUserComplaints');
  }

  // Admin için tüm şikayetleri getirme (filtreleme ile)
  static async getComplaints(
    filters: ComplaintFilters = {},
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
    useCache: boolean = true
  ): Promise<{ complaints: Complaint[], lastDoc: DocumentSnapshot | null }> {
    const cacheKey = this.getCacheKey('getComplaints', [filters, pageSize, lastDoc?.id]);
    
    if (useCache && !filters.searchTerm) {
      const cached = this.getFromCache<{ complaints: Complaint[], lastDoc: DocumentSnapshot | null }>(cacheKey);
      if (cached) return cached;
    }

    return this.executeWithErrorHandling(async () => {
      console.log('🔍 ComplaintService.getComplaints başladı');
      console.log('📋 Parametreler:', { filters, pageSize, useCache });
      
      const complaintsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [];
      
      // Filtreler
      if (filters.status && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
        console.log('🔍 Status filtresi eklendi:', filters.status);
      }
      
      if (filters.type && filters.type.length > 0) {
        constraints.push(where('type', 'in', filters.type));
        console.log('🔍 Type filtresi eklendi:', filters.type);
      }
      
      if (filters.priority && filters.priority.length > 0) {
        constraints.push(where('priority', 'in', filters.priority));
        console.log('🔍 Priority filtresi eklendi:', filters.priority);
      }
      
      if (filters.userId) {
        constraints.push(where('userId', '==', filters.userId));
        console.log('🔍 UserId filtresi eklendi:', filters.userId);
      }
      
      if (filters.restaurantId) {
        constraints.push(where('restaurantId', '==', filters.restaurantId));
        console.log('🔍 RestaurantId filtresi eklendi:', filters.restaurantId);
      }
      
      if (filters.assignedTo) {
        constraints.push(where('assignedTo', '==', filters.assignedTo));
        console.log('🔍 AssignedTo filtresi eklendi:', filters.assignedTo);
      }
      
      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(pageSize));
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      console.log('🔍 Query constraints:', constraints.length);
      
      const q = query(complaintsRef, ...constraints);
      console.log('🔍 Firestore query oluşturuldu, çalıştırılıyor...');
      
      const querySnapshot = await getDocs(q);
      console.log('✅ Firestore query tamamlandı:', {
        docsCount: querySnapshot.docs.length,
        empty: querySnapshot.empty
      });
      
      let complaints = querySnapshot.docs.map(doc => {
        console.log('📄 Document:', { id: doc.id, data: doc.data() });
        return this.mapDocumentToComplaint(doc);
      });
      
      // Metin araması (client-side)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const originalCount = complaints.length;
        complaints = complaints.filter(complaint => 
          complaint.title.toLowerCase().includes(searchLower) ||
          complaint.description.toLowerCase().includes(searchLower) ||
          complaint.user.displayName?.toLowerCase().includes(searchLower)
        );
        console.log('🔍 Search filtresi uygulandı:', {
          searchTerm: filters.searchTerm,
          originalCount,
          filteredCount: complaints.length
        });
      }
      
      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      const result = { complaints, lastDoc: lastDocument };
      
      console.log('✅ ComplaintService.getComplaints tamamlandı:', {
        complaintsCount: complaints.length,
        hasLastDoc: !!lastDocument
      });
      
      if (useCache && !filters.searchTerm) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    }, 'getComplaints');
  }

  // Şikayet güncelleme (Admin)
  static async updateComplaint(
    id: string, 
    updates: Partial<Omit<Complaint, 'id' | 'createdAt' | 'userId' | 'user'>>,
    adminId?: string
  ): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const complaintRef = doc(db, this.COLLECTION_NAME, id);
      const currentComplaint = await getDoc(complaintRef);
      
      if (!currentComplaint.exists()) {
        throw new ComplaintServiceError('Şikayet bulunamadı', 'NOT_FOUND');
      }
      
      const currentData = currentComplaint.data();
      const updateData: any = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Çözüm zamanını hesapla
      if (updates.status === ComplaintStatus.RESOLVED && currentData.status !== ComplaintStatus.RESOLVED) {
        const createdAt = currentData.createdAt?.toDate();
        if (createdAt) {
          const responseTime = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60)); // dakika
          updateData.responseTime = responseTime;
          updateData.resolvedAt = serverTimestamp();
        }
      }
      
      await updateDoc(complaintRef, updateData);
      
      // Durum değişikliği bildirimi
      if (updates.status && updates.status !== currentData.status) {
        await this.createNotification({
          complaintId: id,
          userId: currentData.userId,
          adminId,
          type: 'STATUS_UPDATE',
          title: 'Şikayet Durumu Güncellendi',
          message: `Şikayetinizin durumu "${this.getStatusText(updates.status)}" olarak güncellendi.`,
          isRead: false,
          createdAt: new Date()
        });
      }
      
      this.clearCache();
    }, 'updateComplaint');
  }

  // Şikayet yanıtı ekleme
  static async addComplaintResponse(
    complaintId: string,
    adminId: string,
    adminName: string,
    message: string,
    isPublic: boolean = true
  ): Promise<string> {
    return this.executeWithErrorHandling(async () => {
      const responseRef = doc(collection(db, this.RESPONSES_COLLECTION));
      
      await setDoc(responseRef, {
        complaintId,
        adminId,
        adminName,
        message,
        isPublic,
        createdAt: serverTimestamp()
      });
      
      // Şikayet durumunu güncelle
      if (isPublic) {
        await this.updateComplaint(complaintId, {
          status: ComplaintStatus.IN_PROGRESS
        }, adminId);
        
        // Müşteriye bildirim gönder
        const complaint = await this.getComplaint(complaintId);
        if (complaint) {
          await this.createNotification({
            complaintId,
            userId: complaint.userId,
            adminId,
            type: 'ADMIN_RESPONSE',
            title: 'Şikayetinize Yanıt Verildi',
            message: `"${complaint.title}" başlıklı şikayetinize yanıt verildi.`,
            isRead: false,
            createdAt: new Date()
          });
        }
      }
      
      this.clearCache();
      return responseRef.id;
    }, 'addComplaintResponse');
  }

  // Şikayet yanıtlarını getirme
  static async getComplaintResponses(complaintId: string, publicOnly: boolean = true): Promise<ComplaintResponse[]> {
    const cacheKey = this.getCacheKey('getComplaintResponses', [complaintId, publicOnly]);
    const cached = this.getFromCache<ComplaintResponse[]>(cacheKey);
    if (cached) return cached;

    return this.executeWithErrorHandling(async () => {
      const responsesRef = collection(db, this.RESPONSES_COLLECTION);
      const constraints: QueryConstraint[] = [
        where('complaintId', '==', complaintId),
        orderBy('createdAt', 'asc')
      ];
      
      if (publicOnly) {
        constraints.push(where('isPublic', '==', true));
      }
      
      const q = query(responsesRef, ...constraints);
      const querySnapshot = await getDocs(q);
      const responses = querySnapshot.docs.map(doc => this.mapDocumentToComplaintResponse(doc));
      
      this.setCache(cacheKey, responses);
      return responses;
    }, 'getComplaintResponses');
  }

  // Şikayet istatistikleri
  static async getComplaintStats(
    dateFrom?: Date,
    dateTo?: Date,
    restaurantId?: string
  ): Promise<ComplaintStats> {
    const cacheKey = this.getCacheKey('getComplaintStats', [dateFrom, dateTo, restaurantId]);
    const cached = this.getFromCache<ComplaintStats>(cacheKey);
    if (cached) return cached;

    return this.executeWithErrorHandling(async () => {
      const complaintsRef = collection(db, this.COLLECTION_NAME);
      const constraints: QueryConstraint[] = [];
      
      if (dateFrom) {
        constraints.push(where('createdAt', '>=', dateFrom));
      }
      
      if (dateTo) {
        constraints.push(where('createdAt', '<=', dateTo));
      }
      
      if (restaurantId) {
        constraints.push(where('restaurantId', '==', restaurantId));
      }
      
      const q = query(complaintsRef, ...constraints);
      const querySnapshot = await getDocs(q);
      const complaints = querySnapshot.docs.map(doc => this.mapDocumentToComplaint(doc));
      
      // İstatistikleri hesapla
      const stats: ComplaintStats = {
        total: complaints.length,
        pending: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        rejected: 0,
        averageResponseTime: 0,
        satisfactionAverage: 0,
        byType: {} as Record<ComplaintType, number>,
        byPriority: {} as Record<ComplaintPriority, number>
      };
      
      let totalResponseTime = 0;
      let responseTimeCount = 0;
      let totalSatisfaction = 0;
      let satisfactionCount = 0;
      
      // Enum değerlerini başlat
      Object.values(ComplaintType).forEach(type => {
        stats.byType[type] = 0;
      });
      
      Object.values(ComplaintPriority).forEach(priority => {
        stats.byPriority[priority] = 0;
      });
      
      complaints.forEach(complaint => {
        // Durum sayıları
        switch (complaint.status) {
          case ComplaintStatus.PENDING:
            stats.pending++;
            break;
          case ComplaintStatus.IN_PROGRESS:
            stats.inProgress++;
            break;
          case ComplaintStatus.RESOLVED:
            stats.resolved++;
            break;
          case ComplaintStatus.CLOSED:
            stats.closed++;
            break;
          case ComplaintStatus.REJECTED:
            stats.rejected++;
            break;
        }
        
        // Tip ve öncelik sayıları
        stats.byType[complaint.type]++;
        stats.byPriority[complaint.priority]++;
        
        // Yanıt süresi ortalaması
        if (complaint.responseTime) {
          totalResponseTime += complaint.responseTime;
          responseTimeCount++;
        }
        
        // Memnuniyet ortalaması
        if (complaint.satisfactionRating) {
          totalSatisfaction += complaint.satisfactionRating;
          satisfactionCount++;
        }
      });
      
      stats.averageResponseTime = responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0;
      stats.satisfactionAverage = satisfactionCount > 0 ? Math.round((totalSatisfaction / satisfactionCount) * 10) / 10 : 0;
      
      this.setCache(cacheKey, stats, this.CACHE_TTL / 2); // Kısa cache süresi
      return stats;
    }, 'getComplaintStats');
  }

  // Bildirim oluşturma
  private static async createNotification(notification: Omit<ComplaintNotification, 'id'>): Promise<void> {
    const notificationRef = doc(collection(db, this.NOTIFICATIONS_COLLECTION));
    await setDoc(notificationRef, {
      ...notification,
      createdAt: serverTimestamp()
    });
  }

  // Kullanıcı bildirimlerini getirme
  static async getUserNotifications(userId: string): Promise<ComplaintNotification[]> {
    return this.executeWithErrorHandling(async () => {
      const notificationsRef = collection(db, this.NOTIFICATIONS_COLLECTION);
      const q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as ComplaintNotification));
    }, 'getUserNotifications');
  }

  // Memnuniyet puanı güncelleme
  static async updateSatisfactionRating(complaintId: string, rating: number): Promise<void> {
    return this.executeWithErrorHandling(async () => {
      const complaintRef = doc(db, this.COLLECTION_NAME, complaintId);
      await updateDoc(complaintRef, {
        satisfactionRating: rating,
        updatedAt: serverTimestamp()
      });
      
      this.clearCache();
    }, 'updateSatisfactionRating');
  }

  // Real-time şikayet dinleme (Admin için)
  static subscribeToComplaints(
    callback: (complaints: Complaint[]) => void,
    filters: ComplaintFilters = {}
  ): Unsubscribe {
    const subscriptionKey = `complaints_${JSON.stringify(filters)}`;
    
    // Mevcut aboneliği temizle
    const existingUnsubscribe = this.subscribers.get(subscriptionKey);
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    const complaintsRef = collection(db, this.COLLECTION_NAME);
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];
    
    if (filters.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }
    
    const q = query(complaintsRef, ...constraints);
    
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        try {
          const complaints = querySnapshot.docs.map(doc => this.mapDocumentToComplaint(doc));
          callback(complaints);
        } catch (error) {
          console.error('Error in complaints subscription:', error);
        }
      },
      (error) => {
        console.error('Complaints subscription error:', error);
      }
    );
    
    this.subscribers.set(subscriptionKey, unsubscribe);
    return unsubscribe;
  }

  // Utility methods
  private static getStatusText(status: ComplaintStatus): string {
    const statusTexts = {
      [ComplaintStatus.PENDING]: 'Beklemede',
      [ComplaintStatus.IN_PROGRESS]: 'İnceleniyor',
      [ComplaintStatus.RESOLVED]: 'Çözüldü',
      [ComplaintStatus.CLOSED]: 'Kapatıldı',
      [ComplaintStatus.REJECTED]: 'Reddedildi'
    };
    return statusTexts[status] || status;
  }

  static getTypeText(type: ComplaintType): string {
    const typeTexts = {
      [ComplaintType.ORDER]: 'Sipariş',
      [ComplaintType.PRODUCT]: 'Ürün',
      [ComplaintType.RESTAURANT]: 'Restoran',
      [ComplaintType.DELIVERY]: 'Teslimat',
      [ComplaintType.PAYMENT]: 'Ödeme',
      [ComplaintType.SERVICE]: 'Hizmet',
      [ComplaintType.TECHNICAL]: 'Teknik',
      [ComplaintType.OTHER]: 'Diğer'
    };
    return typeTexts[type] || type;
  }

  static getPriorityText(priority: ComplaintPriority): string {
    const priorityTexts = {
      [ComplaintPriority.LOW]: 'Düşük',
      [ComplaintPriority.MEDIUM]: 'Orta',
      [ComplaintPriority.HIGH]: 'Yüksek',
      [ComplaintPriority.URGENT]: 'Acil'
    };
    return priorityTexts[priority] || priority;
  }

  static clearAllCache(): void {
    this.clearCache();
  }

  static clearAllSubscriptions(): void {
    const unsubscribers = Array.from(this.subscribers.values());
    unsubscribers.forEach(unsubscribe => unsubscribe());
    this.subscribers.clear();
  }
} 