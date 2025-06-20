'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { User } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

interface ProfileImageUploadProps {
  user: User | null;
  currentImageUrl?: string;
  onImageUpdate?: (newImageUrl: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function ProfileImageUpload({ 
  user, 
  currentImageUrl, 
  onImageUpdate,
  size = 'md' 
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin.');
      return;
    }

    setUploading(true);

    try {
      // Eski resmi sil (eğer varsa)
      if (imageUrl && imageUrl.includes('firebase')) {
        try {
          const oldImageRef = ref(storage, imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn('Eski resim silinirken hata:', error);
        }
      }

      // Yeni resmi yükle
      const timestamp = Date.now();
      const fileName = `profile-images/${user.uid}/${timestamp}-${file.name}`;
      const imageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Firestore'da kullanıcı profilini güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profileImage: downloadURL,
        updatedAt: new Date()
      });

      setImageUrl(downloadURL);
      onImageUpdate?.(downloadURL);

      console.log('✅ Profil fotoğrafı başarıyla yüklendi');
    } catch (error) {
      console.error('❌ Profil fotoğrafı yükleme hatası:', error);
      alert('Profil fotoğrafı yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user || !imageUrl) return;

    const confirmDelete = window.confirm('Profil fotoğrafınızı silmek istediğinizden emin misiniz?');
    if (!confirmDelete) return;

    setUploading(true);

    try {
      // Firebase Storage'dan sil
      if (imageUrl.includes('firebase')) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      // Firestore'da güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        profileImage: '',
        updatedAt: new Date()
      });

      setImageUrl('');
      onImageUpdate?.('');

      console.log('✅ Profil fotoğrafı başarıyla silindi');
    } catch (error) {
      console.error('❌ Profil fotoğrafı silme hatası:', error);
      alert('Profil fotoğrafı silinirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative group">
        <div 
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-gray-200 cursor-pointer transition-all duration-300 hover:border-green-400 ${uploading ? 'opacity-50' : ''}`}
          onClick={handleImageClick}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="Profil Fotoğrafı"
              width={size === 'sm' ? 64 : size === 'md' ? 96 : 128}
              height={size === 'sm' ? 64 : size === 'md' ? 96 : 128}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </div>

        {/* Yükleme göstergesi */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all duration-300 flex items-center justify-center">
          <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex space-x-2">
        <button
          onClick={handleImageClick}
          disabled={uploading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
        >
          {imageUrl ? 'Değiştir' : 'Fotoğraf Ekle'}
        </button>
        
        {imageUrl && (
          <button
            onClick={handleRemoveImage}
            disabled={uploading}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm"
          >
            Sil
          </button>
        )}
      </div>

      {/* Gizli file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Bilgi metni */}
      <p className="text-xs text-gray-500 text-center max-w-xs">
        JPG, PNG veya GIF formatında, maksimum 5MB boyutunda resim yükleyebilirsiniz.
      </p>
    </div>
  );
} 