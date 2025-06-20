import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  limit,
  increment,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Advertisement, AdvertisementStats } from '@/types';

export class AdvertisementService {
  private static collection = 'advertisements';

  // Görsel yükle
  static async uploadImage(file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `advertisements/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      throw new Error('Görsel yüklenemedi');
    }
  }

  // Reklam oluştur
  static async createAdvertisement(data: Omit<Advertisement, 'id' | 'createdAt' | 'updatedAt' | 'clickCount' | 'viewCount'>): Promise<string> {
    try {
      const advertisementData = {
        ...data,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        clickCount: 0,
        viewCount: 0
      };

      const docRef = await addDoc(collection(db, this.collection), advertisementData);
      return docRef.id;
    } catch (error) {
      console.error('Reklam oluşturma hatası:', error);
      throw new Error('Reklam oluşturulamadı');
    }
  }

  // Tüm reklamları getir
  static async getAllAdvertisements(): Promise<Advertisement[]> {
    try {
      const q = query(
        collection(db, this.collection),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const advertisements: Advertisement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        advertisements.push({
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Advertisement);
      });

      return advertisements;
    } catch (error) {
      console.error('Reklamları getirme hatası:', error);
      throw new Error('Reklamlar getirilemedi');
    }
  }

  // Pozisyona göre aktif reklamları getir
  static async getActiveAdvertisementsByPosition(position: string, targetAudience: string = 'all'): Promise<Advertisement[]> {
    try {
      const now = Timestamp.now();
      
      // Basit sorgu - composite index problemi olabilir
      const q = query(
        collection(db, this.collection),
        where('position', '==', position),
        where('isActive', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const advertisements: Advertisement[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const ad = {
          id: doc.id,
          ...data,
          startDate: data.startDate.toDate(),
          endDate: data.endDate.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Advertisement;

        // Tarih kontrolü
        const nowDate = now.toDate();
        const isDateValid = ad.startDate <= nowDate && ad.endDate >= nowDate;

        // Hedef kitle kontrolü
        const isTargetAudienceValid = ad.targetAudience === 'all' || ad.targetAudience === targetAudience;

        if (isDateValid && isTargetAudienceValid) {
          advertisements.push(ad);
        }
      });

      // Priority'ye göre sırala
      advertisements.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Yüksek priority önce
        }
        return b.createdAt.getTime() - a.createdAt.getTime(); // Sonra yeni olanlar
      });

      return advertisements;
    } catch (error) {
      console.error('Aktif reklamları getirme hatası:', error);
      throw new Error('Aktif reklamlar getirilemedi');
    }
  }

  // Pozisyona göre aktif reklamları getir (AdvertisementBanner için)
  static async getActiveAdvertisements(position: string, targetAudience: string = 'all'): Promise<Advertisement[]> {
    const result = await this.getActiveAdvertisementsByPosition(position, targetAudience);
    return result;
  }

  // Reklam güncelle
  static async updateAdvertisement(id: string, data: Partial<Advertisement>): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      // Tarih alanlarını Timestamp'e çevir
      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Reklam güncelleme hatası:', error);
      throw new Error('Reklam güncellenemedi');
    }
  }

  // Reklam sil
  static async deleteAdvertisement(id: string): Promise<void> {
    try {
      // Önce reklam bilgilerini al
      const ad = await this.getAdvertisementById(id);
      
      // Görseli sil
      if (ad.imageUrl) {
        try {
          const imageRef = ref(storage, ad.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Görsel silinirken hata:', error);
        }
      }

      // Reklam dokümanını sil
      const docRef = doc(db, this.collection, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Reklam silme hatası:', error);
      throw new Error('Reklam silinemedi');
    }
  }

  // ID'ye göre reklam getir
  static async getAdvertisementById(id: string): Promise<Advertisement> {
    try {
      const docRef = doc(db, this.collection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Reklam bulunamadı');
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Advertisement;
    } catch (error) {
      console.error('Reklam getirme hatası:', error);
      throw new Error('Reklam getirilemedi');
    }
  }

  // Görüntüleme sayısını artır
  static async incrementViewCount(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        viewCount: increment(1),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Görüntüleme sayısı artırma hatası:', error);
    }
  }

  // Tıklama sayısını artır
  static async incrementClickCount(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collection, id);
      await updateDoc(docRef, {
        clickCount: increment(1),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Tıklama sayısı artırma hatası:', error);
    }
  }

  // Reklam istatistiklerini getir
  static async getAdvertisementStats(id: string): Promise<AdvertisementStats> {
    try {
      const ad = await this.getAdvertisementById(id);
      
      // Basit istatistikler - gerçek uygulamada daha detaylı analitik olabilir
      const ctr = ad.viewCount > 0 ? (ad.clickCount / ad.viewCount) * 100 : 0;
      
      return {
        totalViews: ad.viewCount,
        totalClicks: ad.clickCount,
        ctr: parseFloat(ctr.toFixed(2)),
        dailyStats: [] // Bu kısım daha karmaşık analitik gerektirir
      };
    } catch (error) {
      console.error('İstatistik getirme hatası:', error);
      throw new Error('İstatistikler getirilemedi');
    }
  }
} 