'use client';

import React, { useState } from 'react';
import { ComplaintService } from '@/services/complaintService';
import { ComplaintType, ComplaintPriority, ComplaintStatus } from '@/types';

export default function TestComplaintPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testComplaintSubmission = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('🧪 Test şikayet gönderimi başlıyor...');
      
      // Test kullanıcısı oluştur
      const testUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test Kullanıcı',
        phoneNumber: '+90 555 123 4567',
        role: 'customer' as const,
        isActive: true,
        createdAt: new Date()
      };

      const testComplaintData = {
        userId: testUser.uid,
        user: testUser,
        type: ComplaintType.SERVICE,
        title: 'Test Şikayet',
        description: 'Bu bir test şikayetidir.',
        priority: ComplaintPriority.MEDIUM,
        isAnonymous: false,
        status: ComplaintStatus.PENDING,
        images: []
      };

      console.log('📋 Test verisi:', testComplaintData);
      
      const complaintId = await ComplaintService.createComplaint(testComplaintData);
      
      console.log('✅ Test başarılı! Şikayet ID:', complaintId);
      setResult(`✅ Başarılı! Şikayet ID: ${complaintId}`);
      
    } catch (error) {
      console.error('❌ Test hatası:', error);
      
      if (error instanceof Error) {
        setResult(`❌ Hata: ${error.message}\n\nDetaylar:\n${error.stack}`);
      } else {
        setResult(`❌ Bilinmeyen hata: ${JSON.stringify(error, null, 2)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      console.log('🔥 Firebase bağlantısı test ediliyor...');
      
      // Firebase bağlantısını test et
      const { db } = await import('@/lib/firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      
      console.log('📊 Firestore bağlantısı kontrol ediliyor...');
      
      // Complaints koleksiyonunu kontrol et
      const complaintsRef = collection(db, 'complaints');
      const snapshot = await getDocs(complaintsRef);
      
      console.log('✅ Firebase bağlantısı başarılı!');
      setResult(`✅ Firebase bağlantısı başarılı!\n\nMevcut şikayet sayısı: ${snapshot.size}`);
      
    } catch (error) {
      console.error('❌ Firebase bağlantı hatası:', error);
      
      if (error instanceof Error) {
        setResult(`❌ Firebase Hatası: ${error.message}\n\nDetaylar:\n${error.stack}`);
      } else {
        setResult(`❌ Bilinmeyen Firebase hatası: ${JSON.stringify(error, null, 2)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🧪 Şikayet Sistemi Test Sayfası
          </h1>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <button
                onClick={testFirebaseConnection}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isLoading ? '⏳ Test Ediliyor...' : '🔥 Firebase Bağlantısını Test Et'}
              </button>
              
              <button
                onClick={testComplaintSubmission}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isLoading ? '⏳ Test Ediliyor...' : '📝 Şikayet Gönderimini Test Et'}
              </button>
            </div>
            
            {result && (
              <div className="bg-gray-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Test Sonucu:</h3>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 bg-white p-4 rounded border overflow-auto max-h-96">
                  {result}
                </pre>
              </div>
            )}
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                ℹ️ Test Talimatları
              </h3>
              <ul className="text-yellow-700 space-y-2">
                <li>1. Önce "Firebase Bağlantısını Test Et" butonuna tıklayın</li>
                <li>2. Ardından "Şikayet Gönderimini Test Et" butonuna tıklayın</li>
                <li>3. Browser console'u açık tutun (F12)</li>
                <li>4. Hata mesajlarını kontrol edin</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 