import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  getMetadata,
  updateMetadata
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { ProductImage } from '@/types';

export interface UploadProgress {
  progress: number;
  isComplete: boolean;
  downloadURL?: string;
  error?: string;
}

export class StorageService {
  private static readonly PRODUCTS_FOLDER = 'products';
  private static readonly RESTAURANTS_FOLDER = 'restaurants';
  private static readonly CATEGORIES_FOLDER = 'categories';

  // Dosya yükleme fonksiyonu - CORS hatalarını önlemek için iyileştirildi
  static async uploadFile(
    file: File, 
    folder: string, 
    fileName?: string
  ): Promise<string> {
    try {
      // Dosya türünü ve boyutunu kontrol et
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları yükleyebilirsiniz');
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const finalFileName = fileName || `${timestamp}_${randomString}.${file.name.split('.').pop()}`;
      
      const storageRef = ref(storage, `${folder}/${finalFileName}`);
      
      // Metadata ile upload - CORS için
      const metadata = {
        contentType: file.type,
        cacheControl: 'public,max-age=3600',
        customMetadata: {
          uploadedAt: new Date().toISOString(),
          originalName: file.name
        }
      };

      const snapshot = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      if (error instanceof Error) {
        throw new Error(`Dosya yüklenemedi: ${error.message}`);
      }
      throw new Error('Bilinmeyen bir hata oluştu');
    }
  }

  // Çoklu dosya yükleme fonksiyonu
  static async uploadMultipleFiles(
    files: File[], 
    folder: string
  ): Promise<ProductImage[]> {
    try {
      const uploadPromises = files.map(async (file, index) => {
        const url = await this.uploadFile(file, folder);
        return {
          id: `img_${Date.now()}_${index}`,
          url,
          alt: file.name,
          isPrimary: index === 0,
          sortOrder: index
        };
      });

      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error) {
      console.error('Çoklu dosya yükleme hatası:', error);
      throw new Error('Dosyalar yüklenirken hata oluştu');
    }
  }

  // Dosya silme fonksiyonu
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      // URL'den dosya yolunu çıkar
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        throw new Error('Geçersiz dosya URL\'si');
      }

      const filePath = decodeURIComponent(pathMatch[1]);
      const fileRef = ref(storage, filePath);
      
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      // Dosya zaten silinmişse veya bulunamıyorsa hata fırlatma
      if (error instanceof Error && error.message.includes('object-not-found')) {
        console.warn('Dosya zaten silinmiş:', fileUrl);
        return;
      }
      throw new Error('Dosya silinemedi');
    }
  }

  // Ürün resmi yükleme
  static async uploadProductImage(file: File): Promise<string> {
    return this.uploadFile(file, this.PRODUCTS_FOLDER);
  }

  // Ürün resim galerisi yükleme
  static async uploadProductImages(files: File[]): Promise<ProductImage[]> {
    return this.uploadMultipleFiles(files, this.PRODUCTS_FOLDER);
  }

  // Restoran resmi yükleme
  static async uploadRestaurantImage(file: File): Promise<string> {
    return this.uploadFile(file, this.RESTAURANTS_FOLDER);
  }

  // Kategori resmi yükleme
  static async uploadCategoryImage(file: File): Promise<string> {
    return this.uploadFile(file, this.CATEGORIES_FOLDER);
  }

  // Dosya validasyonu
  static validateImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Sadece JPEG, PNG ve WebP formatları desteklenir');
    }

    if (file.size > maxSize) {
      throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır');
    }

    return true;
  }

  // Resim boyutlarını optimize etme (client-side)
  static async resizeImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Orijinal boyutları koru, sadece max genişliği aş
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        const newWidth = img.width * ratio;
        const newHeight = img.height * ratio;

        canvas.width = newWidth;
        canvas.height = newHeight;

        ctx?.drawImage(img, 0, 0, newWidth, newHeight);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Resim boyutlandırma başarısız'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Resim yüklenemedi'));
      img.src = URL.createObjectURL(file);
    });
  }

  // Profil resmi yükleme
  static async uploadProfileImage(
    file: File, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const fileName = `profile_${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `users/${userId}/${fileName}`);
    
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            isComplete: false
          });
        },
        (error) => {
          onProgress?.({
            progress: 0,
            isComplete: true,
            error: error.message
          });
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.({
              progress: 100,
              isComplete: true,
              downloadURL
            });
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Basit resim yükleme (progress olmadan)
  static async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  // Resim silme
  static async deleteImage(imagePath: string): Promise<void> {
    const storageRef = ref(storage, imagePath);
    await deleteObject(storageRef);
  }

  // Resim URL'sinden path çıkarma
  static getPathFromURL(url: string): string {
    try {
      const urlParts = url.split('/');
      const pathPart = urlParts[urlParts.length - 1];
      const pathWithoutQuery = pathPart.split('?')[0];
      return decodeURIComponent(pathWithoutQuery);
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return '';
    }
  }

  // Çoklu resim yükleme
  static async uploadMultipleImages(
    files: File[], 
    basePath: string,
    onProgress?: (index: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    const uploadPromises = files.map((file, index) => {
      const fileName = `${Date.now()}_${index}_${file.name}`;
      const storageRef = ref(storage, `${basePath}/${fileName}`);
      
      return new Promise<string>((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(index, {
              progress,
              isComplete: false
            });
          },
          (error) => {
            onProgress?.(index, {
              progress: 0,
              isComplete: true,
              error: error.message
            });
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              onProgress?.(index, {
                progress: 100,
                isComplete: true,
                downloadURL
              });
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    });

    return Promise.all(uploadPromises);
  }

  // Dosya boyutu ve tip kontrolü
  static validateFile(file: File, maxSizeMB: number = 5): { isValid: boolean; error?: string } {
    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Sadece JPEG, PNG ve WebP formatları desteklenir.'
      };
    }

    // Dosya boyutu kontrolü
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `Dosya boyutu ${maxSizeMB}MB'dan büyük olamaz.`
      };
    }

    return { isValid: true };
  }

  // Resim sıkıştırma
  static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = height * (maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = width * (maxHeight / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
} 