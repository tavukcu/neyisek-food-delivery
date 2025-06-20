import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Image Upload Options Interface
export interface ImageUploadOptions {
  maxSize?: number; // MB cinsinden
  quality?: number; // 0.1 - 1.0 arası
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  folder?: string;
  generateThumbnail?: boolean;
  aiOptimization?: boolean;
  onProgress?: (progress: number) => void;
}

// Upload Progress Interface
export interface UploadProgress {
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

// Image Metadata Interface
export interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  aspectRatio: number;
}

// Firebase Storage bağlantısını test et
async function testFirebaseStorageConnection(): Promise<boolean> {
  try {
    console.log('🔥 Firebase Storage bağlantısı test ediliyor...');
    
    // Test dosyası oluştur
    const testData = new Blob(['Firebase Storage Test'], { type: 'text/plain' });
    const testRef = ref(storage, 'test/connection-test.txt');
    
    // Test yüklemesi
    await uploadBytes(testRef, testData);
    console.log('✅ Firebase Storage yazma testi başarılı');
    
    // Test okuma
    const downloadURL = await getDownloadURL(testRef);
    console.log('✅ Firebase Storage okuma testi başarılı:', downloadURL);
    
    return true;
  } catch (error) {
    console.error('❌ Firebase Storage bağlantı testi başarısız:', error);
    return false;
  }
}

// Ana kapak görseli yükleme fonksiyonu
export async function uploadRestaurantImage(
  file: File,
  restaurantId?: string,
  options: ImageUploadOptions = {}
): Promise<string> {
  try {
    console.log('🚀 Kapak görseli yükleme başlatılıyor...', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      fileType: file.type,
      restaurantId,
      storageConfig: {
        bucket: storage.app.options.storageBucket,
        projectId: storage.app.options.projectId
      }
    });

    // Firebase Storage bağlantısını test et
    const isStorageConnected = await testFirebaseStorageConnection();
    if (!isStorageConnected) {
      throw new Error('Firebase Storage bağlantısı kurulamadı. Lütfen Firebase Console\'dan Storage\'ı etkinleştirin.');
    }

    // Dosya validasyonu
    const validationResult = validateImage(file);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error || 'Geçersiz dosya');
    }

    // Progress callback başlangıç
    if (options.onProgress) {
      options.onProgress(10);
    }

    // Dosya yolu oluştur
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const folderPath = restaurantId ? `restaurants/${restaurantId}` : 'restaurants';
    const filePath = `${folderPath}/${fileName}`;

    console.log('📁 Dosya yolu:', filePath);

    // Firebase Storage referansı oluştur
    const storageRef = ref(storage, filePath);
    console.log('📍 Storage referansı oluşturuldu:', storageRef.fullPath);

    // Progress simulation
    if (options.onProgress) {
      options.onProgress(25);
    }

    // Dosyayı yükle
    console.log('⬆️ Firebase Storage\'a yükleniyor...');
    
    // Progress simulation during upload
    const progressInterval = setInterval(() => {
      if (options.onProgress) {
        // Simulate progress between 25-75%
        const currentProgress = Math.min(75, 25 + Math.random() * 50);
        options.onProgress(currentProgress);
      }
    }, 200);

    try {
      const uploadResult = await uploadBytes(storageRef, file);
      clearInterval(progressInterval);
      
      console.log('✅ Dosya yükleme başarılı:', uploadResult.metadata);
      
      if (options.onProgress) {
        options.onProgress(90);
      }

      // Download URL al
      console.log('🔗 Download URL alınıyor...');
      const downloadURL = await getDownloadURL(uploadResult.ref);

      if (options.onProgress) {
        options.onProgress(100);
      }

      console.log('✅ Kapak görseli başarıyla yüklendi:', downloadURL);
      return downloadURL;

    } catch (uploadError) {
      clearInterval(progressInterval);
      console.error('❌ Upload hatası detayları:', {
        error: uploadError,
        errorMessage: uploadError instanceof Error ? uploadError.message : 'Bilinmeyen hata',
        errorCode: (uploadError as any)?.code,
        storageRef: storageRef.fullPath,
        fileSize: file.size,
        fileType: file.type
      });
      throw uploadError;
    }

  } catch (error) {
    console.error('❌ Kapak görseli yükleme hatası:', error);
    throw handleUploadError(error);
  }
}

// Hata yönetimi fonksiyonu
function handleUploadError(error: any): Error {
  console.error('🔍 Hata analizi:', {
    errorType: typeof error,
    errorName: error?.name,
    errorMessage: error?.message,
    errorCode: error?.code,
    errorStack: error?.stack
  });

  if (error instanceof Error) {
    // Firebase Storage hata kodları
    if (error.message.includes('storage/unauthorized') || error.message.includes('permission-denied')) {
      return new Error('Yetkilendirme hatası. Firebase Storage kurallarını kontrol edin.');
    } else if (error.message.includes('storage/quota-exceeded')) {
      return new Error('Depolama kotası aşıldı.');
    } else if (error.message.includes('storage/invalid-format')) {
      return new Error('Geçersiz dosya formatı.');
    } else if (error.message.includes('storage/object-not-found')) {
      return new Error('Dosya bulunamadı.');
    } else if (error.message.includes('storage/canceled')) {
      return new Error('Yükleme iptal edildi.');
    } else if (error.message.includes('storage/unknown')) {
      return new Error('Firebase Storage henüz kurulmamış. Lütfen Firebase Console\'dan Storage\'ı başlatın.');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      return new Error('İnternet bağlantısı problemi. Lütfen tekrar deneyin.');
    } else if (error.message.includes('CORS')) {
      return new Error('CORS hatası. Firebase Storage konfigürasyonunu kontrol edin.');
    } else {
      return new Error(`Yükleme hatası: ${error.message}`);
    }
  }
  
  return new Error('Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.');
}

// Görsel optimizasyonu (opsiyonel)
export async function optimizeImage(file: File, options: ImageUploadOptions = {}): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;
      
      let { width, height } = img;
      
      // Boyut sınırlaması
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: options.format === 'webp' ? 'image/webp' : file.type,
              lastModified: Date.now()
            });
            resolve(optimizedFile);
          } else {
            resolve(file);
          }
        },
        options.format === 'webp' ? 'image/webp' : file.type,
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
}

// Dosya validasyonu
export function validateImage(file: File): { isValid: boolean; error?: string } {
  // Dosya boyutu kontrolü (10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'Dosya boyutu 10MB\'dan büyük olamaz.' };
  }

  // Dosya tipi kontrolü
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Sadece JPEG, PNG ve WebP formatları desteklenir.' };
  }

  return { isValid: true };
}

// Görsel metadata'sını al
export function getImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: file.type,
        size: file.size,
        aspectRatio: img.naturalWidth / img.naturalHeight
      });
    };
    
    img.onerror = () => reject(new Error('Görsel metadata alınamadı'));
    img.src = URL.createObjectURL(file);
  });
}

// Görsel silme fonksiyonu
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    console.log('✅ Görsel başarıyla silindi');
  } catch (error) {
    console.error('❌ Görsel silme hatası:', error);
    throw new Error('Görsel silinemedi');
  }
} 