'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadRestaurantImage } from '@/services/imageUploadService';
import toast from 'react-hot-toast';

interface SimpleImageUploadProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  currentImage?: string;
  restaurantId?: string;
  className?: string;
  disabled?: boolean;
}

export default function SimpleImageUpload({
  onUpload,
  onError,
  currentImage,
  restaurantId,
  className = '',
  disabled = false
}: SimpleImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Dosya validasyonu
    if (!file.type.startsWith('image/')) {
      const error = 'Lütfen bir görsel dosyası seçin (PNG, JPG, WebP)';
      onError?.(error);
      toast.error(error);
      setUploadStatus('error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const error = 'Dosya boyutu 10MB\'dan büyük olamaz';
      onError?.(error);
      toast.error(error);
      setUploadStatus('error');
      return;
    }

    try {
      setUploading(true);
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      console.log('🚀 Kapak görseli yükleme başlatılıyor...', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        fileType: file.type,
        restaurantId
      });

      // Progress callback ile yükleme
      const url = await uploadRestaurantImage(file, restaurantId, {
        onProgress: (progress) => {
          setUploadProgress(progress);
          console.log(`📊 Yükleme ilerlemesi: %${progress}`);
        }
      });
      
      console.log('✅ Kapak görseli başarıyla yüklendi:', url);
      setUploadStatus('success');
      setUploadProgress(100);
      onUpload(url);
      toast.success('Kapak görseli başarıyla yüklendi!');
      
      // 2 saniye sonra success durumunu temizle
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 2000);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Kapak görseli yükleme başarısız';
      console.error('❌ Kapak görseli yükleme hatası:', error);
      setUploadStatus('error');
      onError?.(errorMessage);
      toast.error(errorMessage);
      
      // 3 saniye sonra error durumunu temizle
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleClick = () => {
    if (!disabled && !uploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const getStatusColor = () => {
    switch (uploadStatus) {
      case 'uploading': return 'border-blue-500 bg-blue-50';
      case 'success': return 'border-green-500 bg-green-50';
      case 'error': return 'border-red-500 bg-red-50';
      default: return dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading': return <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />;
      case 'success': return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'error': return <AlertCircle className="h-6 w-6 text-red-600" />;
      default: return <Upload className={`h-6 w-6 ${dragOver ? 'text-blue-600' : 'text-gray-600'}`} />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'uploading': return {
        title: 'Yükleniyor...',
        subtitle: `%${uploadProgress} tamamlandı`
      };
      case 'success': return {
        title: 'Başarıyla yüklendi!',
        subtitle: 'Kapak görseli hazır'
      };
      case 'error': return {
        title: 'Yükleme başarısız',
        subtitle: 'Lütfen tekrar deneyin'
      };
      default: return {
        title: dragOver ? 'Dosyayı bırakın' : 'Kapak görseli yükleyin',
        subtitle: 'Sürükleyip bırakın veya seçmek için tıklayın'
      };
    }
  };

  const statusText = getStatusText();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${getStatusColor()}
          ${disabled || uploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="space-y-3">
          {/* Status Icon */}
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
            uploadStatus === 'uploading' ? 'bg-blue-100' :
            uploadStatus === 'success' ? 'bg-green-100' :
            uploadStatus === 'error' ? 'bg-red-100' :
            dragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            {getStatusIcon()}
          </div>

          {/* Status Text */}
          <div>
            <p className={`font-medium ${
              uploadStatus === 'success' ? 'text-green-700' :
              uploadStatus === 'error' ? 'text-red-700' :
              uploadStatus === 'uploading' ? 'text-blue-700' :
              'text-gray-900'
            }`}>
              {statusText.title}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {statusText.subtitle}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              PNG, JPG, WebP (Maks. 10MB)
            </p>
          </div>

          {/* Progress Bar */}
          {uploadStatus === 'uploading' && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Current Image Preview */}
      {currentImage && uploadStatus !== 'success' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Mevcut Kapak Görseli:
          </label>
          <div className="relative inline-block">
            <img
              src={currentImage}
              alt="Mevcut kapak görseli"
              className="w-32 h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
              onError={(e) => {
                console.error('Mevcut görsel yüklenemedi:', currentImage);
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
              <ImageIcon className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (sadece development'ta) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 space-y-1">
          <p>🔧 Debug: Restaurant ID = {restaurantId || 'undefined'}</p>
          <p>📊 Status: {uploadStatus} | Progress: {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
} 