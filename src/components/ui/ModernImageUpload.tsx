'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, Eye, Download } from 'lucide-react';
import { RestaurantImageService, UploadProgress, ImageMetadata } from '@/services/imageUploadService';
import { toast } from 'react-hot-toast';

interface ModernImageUploadProps {
  onUpload: (url: string) => void;
  onError?: (error: string) => void;
  currentImage?: string;
  restaurantId?: string;
  maxFiles?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showMetadata?: boolean;
  allowMultiple?: boolean;
}

interface UploadingFile {
  file: File;
  progress: UploadProgress;
  preview: string;
  metadata?: ImageMetadata;
  url?: string;
  error?: string;
}

export default function ModernImageUpload({
  onUpload,
  onError,
  currentImage,
  restaurantId,
  maxFiles = 1,
  accept = 'image/*',
  className = '',
  disabled = false,
  showPreview = true,
  showMetadata = true,
  allowMultiple = false
}: ModernImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya seçme
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || disabled) return;

    const fileArray = Array.from(files);
    
    // Dosya sayısı kontrolü
    if (fileArray.length > maxFiles) {
      toast.error(`En fazla ${maxFiles} dosya seçebilirsiniz`);
      return;
    }

    // Mevcut yüklemeler + yeni dosyalar kontrolü
    if (uploadingFiles.length + fileArray.length > maxFiles) {
      toast.error(`Toplam dosya sayısı ${maxFiles}'ı geçemez`);
      return;
    }

    processFiles(fileArray);
  }, [disabled, maxFiles, uploadingFiles.length]);

  // Dosyaları işleme
  const processFiles = useCallback(async (files: File[]) => {
    const newUploadingFiles: UploadingFile[] = [];

    // Dosya önizlemelerini oluştur
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      newUploadingFiles.push({
        file,
        preview,
        progress: {
          progress: 0,
          bytesTransferred: 0,
          totalBytes: file.size,
          state: 'running'
        }
      });
    }

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Dosyaları tek tek yükle
    for (let i = 0; i < newUploadingFiles.length; i++) {
      const uploadingFile = newUploadingFiles[i];
      
      try {
        await uploadFile(uploadingFile, uploadingFiles.length + i);
      } catch (error) {
        console.error('Dosya yükleme hatası:', error);
      }
    }
  }, [uploadingFiles.length]);

  // Tek dosya yükleme
  const uploadFile = useCallback(async (uploadingFile: UploadingFile, index: number) => {
    try {
      const url = await RestaurantImageService.uploadRestaurantImage(
        uploadingFile.file,
        restaurantId,
        (progress) => {
          setUploadingFiles(prev => 
            prev.map((file, i) => 
              i === index 
                ? { ...file, progress }
                : file
            )
          );
        }
      );

      // Başarılı yükleme
      setUploadingFiles(prev => 
        prev.map((file, i) => 
          i === index 
            ? { 
                ...file, 
                url,
                progress: { ...file.progress, state: 'success', progress: 100 }
              }
            : file
        )
      );

      setCompletedUploads(prev => [...prev, url]);
      onUpload(url);
      toast.success('Görsel başarıyla yüklendi!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Yükleme başarısız';
      
      setUploadingFiles(prev => 
        prev.map((file, i) => 
          i === index 
            ? { 
                ...file, 
                error: errorMessage,
                progress: { ...file.progress, state: 'error' }
              }
            : file
        )
      );

      onError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [restaurantId, onUpload, onError]);

  // Dosya kaldırma
  const removeFile = useCallback((index: number) => {
    setUploadingFiles(prev => {
      const file = prev[index];
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [disabled, handleFileSelect]);

  // Dosya input click
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Progress bar rengi
  const getProgressColor = (state: string) => {
    switch (state) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  // Dosya boyutu formatlama
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Ana Upload Alanı */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={allowMultiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`h-8 w-8 ${isDragOver ? 'text-blue-600' : 'text-gray-600'}`} />
          </div>

          {/* Upload Text */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Dosyaları bırakın' : 'Görsel yükleyin'}
            </h3>
            <p className="text-gray-600 mb-2">
              Dosyaları sürükleyip bırakın veya seçmek için tıklayın
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, WebP formatları desteklenir (Maks. 10MB)
            </p>
          </div>

          {/* Current Image Preview */}
          {currentImage && !uploadingFiles.length && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Mevcut görsel:</p>
              <div className="relative inline-block">
                <img
                  src={currentImage}
                  alt="Mevcut görsel"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yüklenen Dosyalar */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Yüklenen Dosyalar</h4>
          
          {uploadingFiles.map((uploadingFile, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Önizleme */}
                {showPreview && (
                  <div className="relative flex-shrink-0">
                    <img
                      src={uploadingFile.preview}
                      alt={uploadingFile.file.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    {uploadingFile.progress.state === 'success' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                    {uploadingFile.error && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <AlertCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                )}

                {/* Dosya Bilgileri */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 truncate">
                      {uploadingFile.file.name}
                    </h5>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>
                        {uploadingFile.progress.state === 'success' ? 'Tamamlandı' :
                         uploadingFile.error ? 'Hata' :
                         `%${uploadingFile.progress.progress}`}
                      </span>
                      <span>{formatFileSize(uploadingFile.file.size)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(uploadingFile.progress.state)}`}
                        style={{ width: `${uploadingFile.progress.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Hata Mesajı */}
                  {uploadingFile.error && (
                    <p className="text-sm text-red-600 mb-2">
                      {uploadingFile.error}
                    </p>
                  )}

                  {/* Metadata */}
                  {showMetadata && uploadingFile.metadata && (
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Boyut: {uploadingFile.metadata.width} × {uploadingFile.metadata.height}</p>
                      <p>Format: {uploadingFile.metadata.format}</p>
                      <p>Oran: {uploadingFile.metadata.aspectRatio.toFixed(2)}</p>
                    </div>
                  )}

                  {/* Başarılı Yükleme - URL */}
                  {uploadingFile.url && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Başarıyla yüklendi</span>
                      <button
                        onClick={() => window.open(uploadingFile.url, '_blank')}
                        className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="Görseli aç"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yükleme İstatistikleri */}
      {(uploadingFiles.length > 0 || completedUploads.length > 0) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{uploadingFiles.length}</p>
              <p className="text-sm text-gray-600">Yükleniyor</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedUploads.length}</p>
              <p className="text-sm text-gray-600">Tamamlandı</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {uploadingFiles.filter(f => f.error).length}
              </p>
              <p className="text-sm text-gray-600">Hata</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 