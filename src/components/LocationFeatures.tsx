'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import { 
  MapPinIcon, 
  ClockIcon, 
  TruckIcon, 
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { 
  MapPinIcon as MapPinSolidIcon,
  ClockIcon as ClockSolidIcon 
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function LocationFeatures() {
  const {
    position,
    address,
    loading,
    error,
    permissionStatus,
    isWatching,
    nearbyRestaurants,
    getCurrentLocation,
    startWatching,
    stopWatching,
    findNearbyRestaurants,
    estimateDeliveryTime,
    hasLocation,
    coordinates
  } = useLocation();

  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState<any>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mockPosition, setMockPosition] = useState<any>(null);
  const [mockAddress, setMockAddress] = useState<any>(null);

  // Demo modunda konum tespit et
  const handleLocationInDemoMode = async () => {
    try {
      // Önce gerçek GPS koordinatlarını almaya çalış
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation API desteklenmiyor'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // GPS başarısız olursa İstanbul koordinatlarını kullan
            const mockPos = {
              coords: {
                latitude: 41.0082, // İstanbul
                longitude: 28.9784,
                accuracy: 100,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON: () => ({
                  latitude: 41.0082,
                  longitude: 28.9784,
                  accuracy: 100,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                })
              },
              timestamp: Date.now(),
              toJSON: () => ({
                coords: {
                  latitude: 41.0082,
                  longitude: 28.9784,
                  accuracy: 100,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              })
            };
            resolve(mockPos as GeolocationPosition);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 300000
          }
        );
      });

      // Gerçek konuma göre mock adres oluştur
      const isInIstanbul = Math.abs(position.coords.latitude - 41.0082) < 0.1 && 
                          Math.abs(position.coords.longitude - 28.9784) < 0.1;
      
      const mockAddr = isInIstanbul ? {
        street: "Atatürk Caddesi No:123",
        district: "Kadıköy", 
        city: "İstanbul",
        zipCode: "34710",
        country: "Türkiye",
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      } : {
        street: "Çankaya Caddesi No:456",
        district: "Merkez", 
        city: "Ankara",
        zipCode: "06100",
        country: "Türkiye",
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      };

      setMockPosition(position);
      setMockAddress(mockAddr);
      setIsDemoMode(true);
      
      toast.success('🎯 Konumunuz tespit edildi (Demo Modu - Google API kullanılamıyor)');
    } catch (error) {
      toast.error('❌ Konum tespit edilemedi');
    }
  };

  // Yakındaki restoranları bul
  const handleFindNearby = async () => {
    if (!hasLocation && !isDemoMode) {
      toast.error('Önce konumunuzu tespit edin');
      return;
    }

    try {
      // Gerçek Firebase'den restoranları getir
      await findNearbyRestaurants([]);
      if (nearbyRestaurants.length === 0) {
        toast('Yakınınızda restoran bulunamadı', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Nearby restaurants error:', error);
      toast.error('Restoranlar yüklenirken hata oluştu');
    }
  };

  // Teslimat süresi hesapla
  const handleCalculateDelivery = async (restaurant: any) => {
    if (!hasLocation && !isDemoMode) {
      toast.error('Önce konumunuzu tespit edin');
      return;
    }

    try {
      const estimate = await estimateDeliveryTime(
        restaurant.address,
        restaurant.preparationTime || 20
      );
      setDeliveryEstimate(estimate);
      setSelectedRestaurant(restaurant.id);
      toast.success('⏱️ Teslimat süresi hesaplandı');
    } catch (error) {
      console.error('Delivery estimation error:', error);
      // Basit tahmin
      const mockEstimate = {
        total: Math.round(Math.random() * 15 + 20), // 20-35 dk
        preparation: restaurant.preparationTime || 20,
        delivery: Math.round(Math.random() * 15 + 10), // 10-25 dk
        traffic: ['light', 'moderate', 'heavy'][Math.floor(Math.random() * 3)]
      };
      setDeliveryEstimate(mockEstimate);
      setSelectedRestaurant(restaurant.id);
      toast.success('⏱️ Teslimat süresi hesaplandı (tahmini)');
    }
  };

  // Konum alma fonksiyonu
  const handleGetLocation = async () => {
    // Önce gerçek GPS konumunu dene
    try {
      await getCurrentLocation();
      setIsDemoMode(false); // Demo modu kapat
    } catch (error) {
      console.error('GPS failed, trying demo mode:', error);
      // GPS başarısız olursa demo modunu dene
      await handleLocationInDemoMode();
    }
  };

  // Konum durumu ikonu
  const getLocationStatusIcon = () => {
    if (isDemoMode) {
      return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
    }
    
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'denied':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'prompt':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <SignalIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  // Trafik durumu rengi
  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'light': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'heavy': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Görüntülenecek konum verisi
  const displayPosition = isDemoMode ? mockPosition : position;
  const displayAddress = isDemoMode ? mockAddress : address;
  const displayHasLocation = isDemoMode || hasLocation;
  const displayCoordinates = isDemoMode && mockPosition ? {
    lat: mockPosition.coords.latitude,
    lng: mockPosition.coords.longitude
  } : coordinates;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Başlık */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📍 Konum Bazlı Özellikler
        </h1>
        <p className="text-gray-600">
          GPS konumunuzu tespit edin, yakındaki restoranları bulun ve teslimat sürelerini öğrenin
        </p>
      </div>

      {/* Konum Kontrolü */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <MapPinSolidIcon className="w-6 h-6 text-blue-600 mr-2" />
            Konum Durumu
          </h2>
          {getLocationStatusIcon()}
        </div>

        {/* Demo Modu Uyarısı */}
        {isDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-1 mr-3" />
              <div>
                <p className="font-medium text-blue-900">Demo Modu Aktif</p>
                <p className="text-blue-700 text-sm">
                  Google Maps API bağlantısı kurulamadı. Demo verilerle özellikler gösteriliyor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* API Uyarısı */}
        {error && error.includes('API') && !isDemoMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 mt-1 mr-3" />
              <div>
                <p className="font-medium text-blue-900">Demo Modu Aktif</p>
                <p className="text-blue-700 text-sm">
                  Google Maps API bağlantısı kurulamadı. Demo verilerle özellikler gösteriliyor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Konum Bilgisi */}
        {displayHasLocation && displayAddress ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <MapPinIcon className="w-5 h-5 text-blue-600 mt-1 mr-3" />
              <div>
                <p className="font-medium text-blue-900">
                  Mevcut Konumunuz {isDemoMode ? '(Demo)' : ''}:
                </p>
                <p className="text-blue-700">
                  {displayAddress.street}, {displayAddress.district}, {displayAddress.city}
                </p>
                {displayCoordinates && (
                  <p className="text-sm text-blue-600 mt-1">
                    Koordinatlar: {displayCoordinates.lat.toFixed(6)}, {displayCoordinates.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : error && !isDemoMode ? (
          <div className="bg-red-50 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-600">Henüz konum tespit edilmedi</p>
          </div>
        )}

        {/* Konum Butonları */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleGetLocation}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            ) : (
              <MapPinIcon className="w-4 h-4 mr-2" />
            )}
            Konumu Tespit Et
          </button>

          {displayHasLocation && (
            <>
              {!isDemoMode && (
                <button
                  onClick={isWatching ? stopWatching : startWatching}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isWatching
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <SignalIcon className="w-4 h-4 mr-2" />
                  {isWatching ? 'Takibi Durdur' : 'Konum Takibi'}
                </button>
              )}

              <button
                onClick={handleFindNearby}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <BuildingStorefrontIcon className="w-4 h-4 mr-2" />
                Yakın Restoranlar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Teslimat Tahmini */}
      {deliveryEstimate && selectedRestaurant && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ClockSolidIcon className="w-6 h-6 text-orange-600 mr-2" />
            Detaylı Teslimat Tahmini
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-center">
                <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-blue-600">Hazırlık Süresi</p>
                <p className="text-2xl font-bold text-blue-900">{deliveryEstimate.preparation} dk</p>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-center">
                <TruckIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-green-600">Teslimat Süresi</p>
                <p className="text-2xl font-bold text-green-900">{deliveryEstimate.delivery} dk</p>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="text-center">
                <ClockSolidIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-orange-600">Toplam Süre</p>
                <p className="text-2xl font-bold text-orange-900">{deliveryEstimate.total} dk</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrafficColor(deliveryEstimate.traffic)}`}>
              🚦 Trafik Durumu: {
                deliveryEstimate.traffic === 'light' ? 'Hafif' :
                deliveryEstimate.traffic === 'moderate' ? 'Orta' : 'Yoğun'
              }
            </span>
          </div>
        </div>
      )}

      {/* Özellikler Listesi */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🎯 Konum Özelliklerimiz
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start p-4 bg-blue-50 rounded-lg">
            <MapPinIcon className="w-6 h-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900">GPS Konum Tespiti</h3>
              <p className="text-sm text-blue-700">Otomatik adres tespiti ve kaydetme</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-green-50 rounded-lg">
            <BuildingStorefrontIcon className="w-6 h-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900">Yakın Restoranlar</h3>
              <p className="text-sm text-green-700">Mesafe bazlı restoran listesi</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-orange-50 rounded-lg">
            <ClockIcon className="w-6 h-6 text-orange-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-orange-900">Teslimat Tahmini</h3>
              <p className="text-sm text-orange-700">Trafik dahil gerçekçi süreler</p>
            </div>
          </div>

          <div className="flex items-start p-4 bg-purple-50 rounded-lg">
            <TruckIcon className="w-6 h-6 text-purple-600 mr-3 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900">Canlı Takip</h3>
              <p className="text-sm text-purple-700">Gerçek zamanlı konum güncellemeleri</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 