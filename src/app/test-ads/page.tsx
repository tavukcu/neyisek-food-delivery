'use client';

import AdvertisementBanner from '@/components/AdvertisementBanner';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function TestAdsPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Reklam Test Sayfası</h1>
          <BackToHomeButton variant="primary" />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Hero Reklamları</h2>
          <AdvertisementBanner position="hero" />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Banner Reklamları</h2>
          <AdvertisementBanner position="banner" />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Sidebar Reklamları</h2>
          <AdvertisementBanner position="sidebar" />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Console Logları</h2>
          <p className="text-gray-600">
            Browser console'unu açın (F12) ve debug mesajlarını kontrol edin.
          </p>
        </div>
      </div>
    </div>
  );
} 