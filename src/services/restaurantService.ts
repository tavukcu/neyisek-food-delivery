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
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { RestaurantInfo, EmailType } from '@/types';
import { EmailService } from './emailService';
import { getCityById, getDistrictById } from '@/data/cities';

export interface RestaurantApplication {
  id: string;
  userId: string;
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  latitude?: number;  // Harita koordinatı - enlem
  longitude?: number; // Harita koordinatı - boylam
  city: string;       // İl ID'si
  district: string;   // İlçe ID'si
  businessLicense: string;
  taxNumber: string;
  categoryIds: string[]; // Seçilen kategori ID'leri
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
}

export class RestaurantService {
  private static readonly COLLECTION_NAME = 'restaurants';
  private static readonly APPLICATIONS_COLLECTION = 'restaurant_applications';

  // Restoran oluşturma
  static async createRestaurant(restaurantData: Omit<RestaurantInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const restaurantRef = doc(collection(db, this.COLLECTION_NAME));
    await setDoc(restaurantRef, {
      ...restaurantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return restaurantRef.id;
  }

  // Restoran getirme
  static async getRestaurant(restaurantId: string): Promise<RestaurantInfo | null> {
    const restaurantRef = doc(db, this.COLLECTION_NAME, restaurantId);
    const restaurantSnap = await getDoc(restaurantRef);
    
    if (restaurantSnap.exists()) {
      const data = restaurantSnap.data();
      
      // Çalışma saatleri yoksa varsayılan değerler ekle
      const workingHours = data.workingHours || {
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '09:00', close: '22:00', isOpen: true },
        saturday: { open: '09:00', close: '23:00', isOpen: true },
        sunday: { open: '10:00', close: '21:00', isOpen: true }
      };
      
      return {
        id: restaurantSnap.id,
        ...data,
        workingHours,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as RestaurantInfo;
    }
    
    return null;
  }

  // Tüm restoranları getirme
  static async getAllRestaurants(): Promise<RestaurantInfo[]> {
    const restaurantsRef = collection(db, this.COLLECTION_NAME);
    const q = query(restaurantsRef, orderBy('name', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as RestaurantInfo[];
  }

  // Aktif restoranları getir
  static async getActiveRestaurants(): Promise<RestaurantInfo[]> {
    try {
      console.log('🔍 getActiveRestaurants: Aktif restoranlar alınıyor...');
      const restaurantsRef = collection(db, 'restaurants');
      // Index hatası yerine tüm restoranları al ve client-side'da filtrele
      const querySnapshot = await getDocs(restaurantsRef);
      
      const restaurants: RestaurantInfo[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Sadece aktif restoranları dahil et
        if (data.isOpen === true) {
          console.log('📋 Restoran verisi:', { id: doc.id, name: data.name, isOpen: data.isOpen });
          
          // Çalışma saatleri yoksa varsayılan değerler ekle
          const workingHours = data.workingHours || {
            monday: { open: '09:00', close: '22:00', isOpen: true },
            tuesday: { open: '09:00', close: '22:00', isOpen: true },
            wednesday: { open: '09:00', close: '22:00', isOpen: true },
            thursday: { open: '09:00', close: '22:00', isOpen: true },
            friday: { open: '09:00', close: '22:00', isOpen: true },
            saturday: { open: '09:00', close: '23:00', isOpen: true },
            sunday: { open: '10:00', close: '21:00', isOpen: true }
          };
          
          restaurants.push({
            id: doc.id,
            ...data,
            workingHours,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as RestaurantInfo);
        }
      });
      
      console.log('✅ getActiveRestaurants: Toplam restoran sayısı:', restaurants.length);
      restaurants.forEach(restaurant => {
        console.log('📊 Restoran detayı:', {
          id: restaurant.id,
          name: restaurant.name,
          isOpen: restaurant.isOpen,
          categoryIds: restaurant.categoryIds,
          rating: restaurant.rating,
          reviewCount: restaurant.reviewCount,
          hasWorkingHours: !!restaurant.workingHours
        });
      });
      
      return restaurants;
    } catch (error) {
      console.error('❌ getActiveRestaurants hatası:', error);
      throw error;
    }
  }

  // Restoran güncelleme
  static async updateRestaurant(restaurantId: string, restaurantData: Partial<RestaurantInfo>): Promise<void> {
    const restaurantRef = doc(db, this.COLLECTION_NAME, restaurantId);
    await updateDoc(restaurantRef, {
      ...restaurantData,
      updatedAt: serverTimestamp()
    });
  }

  // Restoran silme
  static async deleteRestaurant(restaurantId: string): Promise<void> {
    const restaurantRef = doc(db, this.COLLECTION_NAME, restaurantId);
    await deleteDoc(restaurantRef);
  }

  // Restoran başvurusu oluşturma - ENHANCED ERROR HANDLING
  static async createApplication(applicationData: Omit<RestaurantApplication, 'id' | 'appliedAt' | 'status'>): Promise<string> {
    try {
      console.log('🍕 Creating restaurant application...', {
        userId: applicationData.userId,
        restaurantName: applicationData.restaurantName,
        hasCoordinates: !!(applicationData.latitude && applicationData.longitude)
      });

      // Kullanıcının mevcut başvurusunu kontrol et
      const existingApplication = await this.getUserApplication(applicationData.userId);
      if (existingApplication && existingApplication.status === 'pending') {
        throw new Error('Zaten beklemede olan bir başvurunuz var. Lütfen mevcut başvurunuzun sonucunu bekleyin.');
      }

      // City ve district ID'lerini isme çevir
      const cityData = getCityById('45'); // Manisa kod'u
      const districtData = getDistrictById('45', applicationData.district); // Manisa kod'u, district ID

      const applicationDoc: Omit<RestaurantApplication, 'id'> = {
        ...applicationData,
        city: cityData?.name || applicationData.city,
        district: districtData?.name || applicationData.district,
        status: 'pending',
        appliedAt: new Date()
      };

      console.log('🍕 Application data prepared:', {
        cityName: applicationDoc.city,
        districtName: applicationDoc.district,
        categoryCount: applicationDoc.categoryIds.length
      });

      // Firestore'a kaydet
      const docRef = await addDoc(collection(db, 'restaurant_applications'), {
        ...applicationDoc,
        appliedAt: serverTimestamp()
      });

      console.log('✅ Restaurant application created with ID:', docRef.id);

      // Hoş geldin e-postası gönder
      try {
        await EmailService.sendRestaurantApplicationEmail({
          restaurantName: applicationData.restaurantName,
          ownerName: applicationData.ownerName,
          ownerEmail: applicationData.email,
          status: 'pending'
        });
        console.log('📧 Welcome email sent successfully');
      } catch (emailError) {
        console.warn('📧 Welcome email failed (non-critical):', emailError);
        // E-posta gönderimi başarısız olsa da başvuru devam eder
      }

      return docRef.id;

    } catch (error: any) {
      console.error('🚨 Restaurant application creation failed:', {
        error: error.message,
        code: error.code,
        userId: applicationData.userId
      });
      
      // Firebase hata kodlarına göre kullanıcı dostu mesajlar
      if (error.code === 'permission-denied') {
        throw new Error('Restoran başvurusu yapma yetkiniz yok. Lütfen giriş yapın ve tekrar deneyin.');
      } else if (error.code === 'unauthenticated') {
        throw new Error('Bu işlem için giriş yapmanız gerekiyor.');
      } else if (error.code === 'resource-exhausted') {
        throw new Error('Sistem yoğunluğu nedeniyle işlem tamamlanamadı. Lütfen birkaç dakika sonra tekrar deneyin.');
      } else if (error.message.includes('already pending')) {
        throw error; // User-friendly message already set
      }
      
      throw new Error(error.message || 'Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  // Bekleyen başvuruları getirme
  static async getPendingApplications(): Promise<RestaurantApplication[]> {
    const applicationsRef = collection(db, this.APPLICATIONS_COLLECTION);
    const q = query(
      applicationsRef, 
      where('status', '==', 'pending'),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate() || new Date(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    })) as RestaurantApplication[];
  }

  // Tüm başvuruları getirme
  static async getAllApplications(): Promise<RestaurantApplication[]> {
    const applicationsRef = collection(db, this.APPLICATIONS_COLLECTION);
    const q = query(applicationsRef, orderBy('appliedAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      appliedAt: doc.data().appliedAt?.toDate() || new Date(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    })) as RestaurantApplication[];
  }

  // Başvuru durumunu güncelleme (e-posta bildirimi ile)
  static async updateApplicationStatus(
    applicationId: string, 
    status: 'approved' | 'rejected',
    adminId: string,
    adminNotes?: string
  ): Promise<void> {
    // İlk olarak başvuru detaylarını alıyoruz
    const applicationRef = doc(db, this.APPLICATIONS_COLLECTION, applicationId);
    const applicationSnap = await getDoc(applicationRef);
    
    if (!applicationSnap.exists()) {
      throw new Error('Başvuru bulunamadı');
    }

    const application = applicationSnap.data() as RestaurantApplication;

    // Başvuru durumunu güncelle
    await updateDoc(applicationRef, {
      status,
      reviewedAt: serverTimestamp(),
      reviewedBy: adminId,
      adminNotes: adminNotes || ''
    });

    // Eğer başvuru onaylandıysa, restoran kaydı oluştur ve kullanıcı rolünü güncelle
    if (status === 'approved') {
      try {
        // 1. Restaurants koleksiyonunda yeni restoran kaydı oluştur
        // City ve district string olarak application'da zaten var, getCityById'e gerek yok
        
        const newRestaurant: Omit<RestaurantInfo, 'id' | 'createdAt' | 'updatedAt'> = {
          name: application.restaurantName,
          description: `${application.restaurantName} - Lezzetli yemekler için doğru adres`,
          categoryIds: application.categoryIds || [], // Başvurudaki kategori ID'leri
          address: {
            street: application.address,
            city: application.city, // Zaten string olarak geliyor
            district: application.district, // Zaten string olarak geliyor  
            zipCode: '', // Varsayılan
            country: 'Türkiye',
            coordinates: application.latitude && application.longitude ? {
              lat: application.latitude,
              lng: application.longitude
            } : undefined
          },
          phone: application.phone,
          email: application.email,
          workingHours: {
            monday: { open: '09:00', close: '22:00', isOpen: true },
            tuesday: { open: '09:00', close: '22:00', isOpen: true },
            wednesday: { open: '09:00', close: '22:00', isOpen: true },
            thursday: { open: '09:00', close: '22:00', isOpen: true },
            friday: { open: '09:00', close: '22:00', isOpen: true },
            saturday: { open: '09:00', close: '22:00', isOpen: true },
            sunday: { open: '09:00', close: '22:00', isOpen: true }
          },
          deliveryRadius: 5, // 5 km varsayılan teslimat alanı
          minimumOrderAmount: 30, // 30 TL minimum sipariş
          deliveryFee: 8, // 8 TL teslimat ücreti
          estimatedDeliveryTime: 30, // 30 dakika tahmini teslimat süresi
          isOpen: true,
          rating: 4.5, // Varsayılan başlangıç puanı
          reviewCount: 0, // Başlangıçta 0 değerlendirme
          commissionRate: 9 // %9 komisyon oranı
        };

        const restaurantId = await this.createRestaurant(newRestaurant);
        console.log('✅ Yeni restoran oluşturuldu ID:', restaurantId, 'Name:', application.restaurantName);

        // 2. Kullanıcı rolünü 'restaurant' olarak güncelle ve restaurantId'yi ata
        const userRef = doc(db, 'users', application.userId);
        await updateDoc(userRef, {
          role: 'restaurant',
          restaurantId: restaurantId,
          restaurantName: application.restaurantName,
          phoneNumber: application.phone,
          status: 'active', // Restoran aktif olarak başlasın
          updatedAt: serverTimestamp()
        });

        console.log('✅ Kullanıcı rolü güncellendi:', application.userId, '-> restaurant, restaurantId:', restaurantId);

      } catch (restaurantCreationError) {
        console.error('Restoran oluşturma hatası:', restaurantCreationError);
        
        // Restoran oluşturulamazsa başvuru durumunu geri al
        await updateDoc(applicationRef, {
          status: 'pending',
          adminNotes: 'Restoran oluşturma hatası: ' + (restaurantCreationError as Error).message
        });
        
        throw new Error('Restoran oluşturulurken hata oluştu: ' + (restaurantCreationError as Error).message);
      }
    }

    // Başvuru durumu e-postası gönder
    try {
      await this.sendApplicationStatusEmail(applicationId, status, adminNotes);
    } catch (emailError) {
      console.error('Başvuru durumu e-postası gönderilirken hata:', emailError);
      // E-posta hatası diğer işlemleri etkilemesin
    }
  }

  // Başvuru durumu e-postası gönderme
  private static async sendApplicationStatusEmail(
    applicationId: string, 
    status: 'approved' | 'rejected',
    adminMessage?: string
  ) {
    try {
      const applicationRef = doc(db, this.APPLICATIONS_COLLECTION, applicationId);
      const applicationSnap = await getDoc(applicationRef);
      
      if (!applicationSnap.exists()) return;
      
      const application = applicationSnap.data() as RestaurantApplication;

      const emailData = {
        restaurantName: application.restaurantName,
        ownerName: application.ownerName,
        ownerEmail: application.email,
        status,
        adminMessage
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: EmailType.RESTAURANT_APPLICATION,
          data: emailData
        })
      });

      if (!response.ok) {
        throw new Error('E-posta API hatası');
      }
    } catch (error) {
      console.error('Başvuru durumu e-postası gönderme hatası:', error);
      throw error;
    }
  }

  // Kullanıcının mevcut başvurusunu getir
  static async getUserApplication(userId: string): Promise<RestaurantApplication | null> {
    try {
      const q = query(
        collection(db, 'restaurant_applications'),
        where('userId', '==', userId),
        orderBy('appliedAt', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        appliedAt: data.appliedAt?.toDate() || new Date()
      } as RestaurantApplication;
      
    } catch (error: any) {
      console.error('Error getting user application:', error);
      return null; // Hata durumunda null döndür
    }
  }

  // Restoran arama
  static async searchRestaurants(searchTerm: string): Promise<RestaurantInfo[]> {
    const restaurantsRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      restaurantsRef,
      where('isOpen', '==', true),
      orderBy('name'),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    
    // Client-side filtreleme yapıyoruz
    const restaurants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as RestaurantInfo[];
    
    // Arama terimini içeren restoranları filtrele
    return restaurants.filter(restaurant => 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address.district.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Restoran durumunu dinleme (Real-time)
  static subscribeToRestaurantStatus(
    restaurantId: string, 
    callback: (restaurant: RestaurantInfo | null) => void
  ): Unsubscribe {
    const restaurantRef = doc(db, this.COLLECTION_NAME, restaurantId);
    
    return onSnapshot(restaurantRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as RestaurantInfo);
      } else {
        callback(null);
      }
    });
  }

  // Çalışma saatlerini güncelleme
  static async updateWorkingHours(
    restaurantId: string, 
    workingHours: RestaurantInfo['workingHours']
  ): Promise<void> {
    const restaurantRef = doc(db, this.COLLECTION_NAME, restaurantId);
    await updateDoc(restaurantRef, {
      workingHours,
      updatedAt: serverTimestamp()
    });
  }

  // Teslimat ayarlarını güncelleme
  static async updateDeliverySettings(
    restaurantId: string,
    settings: {
      deliveryRadius: number;
      minimumOrderAmount: number;
      deliveryFee: number;
      estimatedDeliveryTime: number;
    }
  ): Promise<void> {
    const restaurantRef = doc(db, this.COLLECTION_NAME, restaurantId);
    await updateDoc(restaurantRef, {
      ...settings,
      updatedAt: serverTimestamp()
    });
  }

  // Restoran durumunu değiştirme
  static async toggleRestaurantStatus(restaurantId: string): Promise<void> {
    const restaurant = await this.getRestaurant(restaurantId);
    if (restaurant) {
      await this.updateRestaurant(restaurantId, { isOpen: !restaurant.isOpen });
    }
  }

  // Teslimat aralığındaki restoranları getirme
  static async getRestaurantsInDeliveryRange(
    userLat: number, 
    userLng: number, 
    maxDistance: number = 10
  ): Promise<RestaurantInfo[]> {
    // Bu fonksiyon için geospatial query kullanılabilir
    // Şimdilik tüm aktif restoranları döndürüyoruz
    return await this.getActiveRestaurants();
  }

  // Popüler restoranları getirme
  static async getPopularRestaurants(limitCount: number = 6): Promise<RestaurantInfo[]> {
    const restaurantsRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      restaurantsRef,
      where('isOpen', '==', true),
      orderBy('rating', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as RestaurantInfo[];
  }

  // Kategoriye göre restoranları getirme
  static async getRestaurantsByCategory(categoryId: string): Promise<RestaurantInfo[]> {
    const restaurantsRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      restaurantsRef,
      where('isOpen', '==', true),
      where('categoryIds', 'array-contains', categoryId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as RestaurantInfo[];
  }

  // Kullanıcı ID'sine göre restoran getirme (restoran sahipleri için)
  static async getRestaurantByUserId(userId: string): Promise<RestaurantInfo | null> {
    try {
      // İlk olarak kullanıcının restaurantId'sini al
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return null;
      }
      
      const userData = userSnap.data();
      if (!userData.restaurantId) {
        return null;
      }
      
      // Restoran bilgilerini getir
      return await this.getRestaurant(userData.restaurantId);
    } catch (error) {
      console.error('Error getting restaurant by user ID:', error);
      return null;
    }
  }

  // Birden fazla kategoriye göre restoranları getirme
  static async getRestaurantsByCategories(categoryIds: string[]): Promise<RestaurantInfo[]> {
    if (categoryIds.length === 0) {
      return await this.getActiveRestaurants();
    }

    const restaurantsRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      restaurantsRef,
      where('isOpen', '==', true),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    // Client-side filtering for multiple categories
    const restaurants = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date()
    })) as RestaurantInfo[];

    return restaurants.filter(restaurant => 
      restaurant.categoryIds && 
      restaurant.categoryIds.some(catId => categoryIds.includes(catId))
    );
  }

  // Restoran getirme (alias for getRestaurant)
  static async getRestaurantById(restaurantId: string): Promise<RestaurantInfo | null> {
    return this.getRestaurant(restaurantId);
  }

  // Restoran görseli yükleme
  static async uploadRestaurantImage(file: File, restaurantId?: string): Promise<string> {
    try {
      console.log('🔧 RestaurantService.uploadRestaurantImage başladı:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        restaurantId
      });

      // Modern Image Upload Service'i kullan
      const { RestaurantImageService } = await import('@/services/imageUploadService');
      
      const imageUrl = await RestaurantImageService.uploadRestaurantImage(
        file,
        restaurantId
      );
      
      console.log('✅ Modern servis ile görsel yüklendi:', imageUrl);
      return imageUrl;
      
    } catch (error) {
      console.error('❌ RestaurantService.uploadRestaurantImage hatası:', error);
      
      if (error instanceof Error) {
        // Modern servisin hata mesajlarını kullan
        throw error;
      }
      
      throw new Error('Görsel yükleme başarısız oldu. Lütfen tekrar deneyin.');
    }
  }

  // Restoran görselini silme
  static async deleteRestaurantImage(imageUrl: string): Promise<void> {
    try {
      // URL'den dosya yolunu çıkar
      const url = new URL(imageUrl);
      const pathSegments = url.pathname.split('/');
      const fileName = pathSegments[pathSegments.length - 1].split('?')[0];
      
      // Storage referansı oluştur
      const storageRef = ref(storage, `restaurants/${fileName}`);
      
      // Dosyayı sil
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Restoran görseli silme hatası:', error);
      // Görsel silme hatası kritik değil, sessizce devam et
    }
  }
} 