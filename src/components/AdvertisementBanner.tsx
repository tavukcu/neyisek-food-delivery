'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Advertisement } from '@/types';
import { AdvertisementService } from '@/services/advertisementService';
import { X, ExternalLink } from 'lucide-react';

interface AdvertisementBannerProps {
  position: 'hero' | 'banner' | 'sidebar' | 'popup';
  className?: string;
  maxItems?: number;
}

export default function AdvertisementBanner({ 
  position, 
  className = '', 
  maxItems = 1 
}: AdvertisementBannerProps) {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Component mount kontrolü
  useEffect(() => {
    setMounted(true);
  }, []);

  const loadAdvertisements = async () => {
    try {
      const ads = await AdvertisementService.getActiveAdvertisements(position);
      setAdvertisements(ads.slice(0, maxItems));
      
      // Görüntüleme sayılarını artır
      ads.slice(0, maxItems).forEach(ad => {
        AdvertisementService.incrementViewCount(ad.id);
      });
    } catch (error: any) {
      console.error('Reklamları yükleme hatası:', error);
      
      // Firebase connection sorunu varsa development modunda mock data göster
      if (process.env.NODE_ENV === 'development') {
        const mockAd: Advertisement = {
          id: 'mock-ad-1',
          title: 'NeYisek.com\'da Yemek Siparişi',
          description: 'Lezzetli yemekler kapınızda! Hemen sipariş verin.',
          imageUrl: '/images/restaurant-placeholder.jpg',
          linkUrl: '/menu',
          position: position,
          isActive: true,
          priority: 1,
          targetAudience: 'all',
          startDate: new Date(Date.now() - 86400000), // 1 gün önce
          endDate: new Date(Date.now() + 86400000), // 1 gün sonra
          clickCount: 0,
          viewCount: 0,
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Sadece hero ve banner pozisyonları için mock data göster
        if (position === 'hero' || position === 'banner') {
          setAdvertisements([mockAd]);
        } else {
          setAdvertisements([]);
        }
      } else {
        // Production'da hata durumunda boş array set et
        setAdvertisements([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Reklamları yükle
  useEffect(() => {
    if (mounted) {
    loadAdvertisements();
    }
  }, [position, mounted]);

  // Popup reklamlar için zamanlayıcı
  useEffect(() => {
    if (position === 'popup' && advertisements.length > 0 && mounted) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 3000); // 3 saniye sonra popup göster

      return () => clearTimeout(timer);
    }
  }, [position, advertisements, mounted]);

  useEffect(() => {
    // Çoklu reklam için otomatik geçiş
    if (advertisements.length > 1 && position !== 'popup' && mounted) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % advertisements.length);
      }, 5000); // 5 saniyede bir değiştir

      return () => clearInterval(interval);
    }
  }, [advertisements.length, position, mounted]);

  const handleClick = async (ad: Advertisement) => {
    try {
      await AdvertisementService.incrementClickCount(ad.id);
      
      if (ad.linkUrl) {
        if (ad.linkUrl.startsWith('http')) {
          window.open(ad.linkUrl, '_blank');
        } else {
          window.location.href = ad.linkUrl;
        }
      }
    } catch (error) {
      console.error('Reklam tıklama hatası:', error);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  // Server-side render'da veya mount olmadan hiçbir şey render etme
  if (!mounted || loading || advertisements.length === 0) {
    return null;
  }

  const currentAd = advertisements[currentIndex];

  // Popup reklam
  if (position === 'popup') {
    if (!showPopup) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="relative bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
          <button
            onClick={closePopup}
            className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
          
          <div 
            className="cursor-pointer"
            onClick={() => handleClick(currentAd)}
          >
            <div className="relative h-64">
              <Image
                src={currentAd.imageUrl}
                alt={currentAd.title}
                fill
                className="object-cover"
              />
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {currentAd.title}
              </h3>
              {currentAd.description && (
                <p className="text-gray-600 text-sm mb-3">
                  {currentAd.description}
                </p>
              )}
              
              {currentAd.linkUrl && (
                <div className="flex items-center text-green-600 text-sm font-medium">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Detaylı bilgi için tıklayın
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal banner türleri
  const getContainerClasses = () => {
    const baseClasses = "relative overflow-hidden rounded-lg shadow-lg";
    
    switch (position) {
      case 'hero':
        return `${baseClasses} h-48 md:h-64 ${className}`;
      case 'banner':
        return `${baseClasses} h-32 md:h-40 ${className}`;
      case 'sidebar':
        return `${baseClasses} h-40 md:h-48 ${className}`;
      default:
        return `${baseClasses} ${className}`;
    }
  };

    return (
    <div className={getContainerClasses()}>
        <div 
        className="cursor-pointer h-full"
          onClick={() => handleClick(currentAd)}
        >
        <div className="relative h-full">
          <Image
            src={currentAd.imageUrl}
            alt={currentAd.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Content */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="text-lg md:text-xl font-bold mb-2">
                {currentAd.title}
            </h3>
              {currentAd.description && (
              <p className="text-sm md:text-base opacity-90 line-clamp-2">
                  {currentAd.description}
                </p>
              )}
          </div>
          
          {/* Link indicator */}
          {currentAd.linkUrl && (
            <div className="absolute top-4 right-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                <ExternalLink className="h-4 w-4 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Multiple ads indicator */}
      {advertisements.length > 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {advertisements.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      )}
      </div>
    );
} 