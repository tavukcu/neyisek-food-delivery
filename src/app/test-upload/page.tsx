'use client';

import { useState } from 'react';
import { uploadRestaurantImage } from '@/services/imageUploadService';
import toast from 'react-hot-toast';

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      
      console.log('🚀 Test yükleme başlatılıyor...');
      
      const url = await uploadRestaurantImage(file, 'test-restaurant', {
        onProgress: (p) => {
          setProgress(p);
          console.log(`Progress: ${p}%`);
        }
      });
      
      setUploadedUrl(url);
      toast.success('✅ Yükleme başarılı!');
      console.log('✅ Yükleme başarılı:', url);
      
    } catch (error) {
      console.error('❌ Yükleme hatası:', error);
      toast.error(`❌ Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🔥 Firebase Storage Test
          </h1>
          
          <div className="space-y-6">
            {/* File Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Görsel Dosyası Seçin:
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Yükleniyor...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Status */}
            <div className="text-center">
              {uploading ? (
                <div className="text-blue-600">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p>Yükleniyor... {progress}%</p>
                </div>
              ) : uploadedUrl ? (
                <div className="text-green-600">
                  <div className="text-2xl mb-2">✅</div>
                  <p>Yükleme başarılı!</p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <div className="text-2xl mb-2">📁</div>
                  <p>Bir görsel dosyası seçin</p>
                </div>
              )}
            </div>

            {/* Uploaded Image Preview */}
            {uploadedUrl && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Yüklenen Görsel:</h3>
                <div className="border border-gray-200 rounded-lg p-4">
                  <img
                    src={uploadedUrl}
                    alt="Yüklenen görsel"
                    className="max-w-full h-auto rounded-lg shadow-sm"
                  />
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <p className="font-medium text-gray-700">URL:</p>
                    <p className="text-gray-600 break-all">{uploadedUrl}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Debug Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Bilgileri:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Firebase Storage Bucket: yem30-halil.firebasestorage.app</p>
                <p>• Project ID: yem30-halil</p>
                <p>• Test Klasörü: restaurants/test-restaurant/</p>
                <p>• Desteklenen Formatlar: JPEG, PNG, WebP</p>
                <p>• Maksimum Boyut: 10MB</p>
              </div>
            </div>

            {/* Console Logs */}
            <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs">
              <p>Console logları için F12 &gt; Console sekmesini açın</p>
              <p>Detaylı debug bilgileri orada görünecek</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 