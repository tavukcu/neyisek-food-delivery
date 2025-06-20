'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Navigation, AlertCircle } from 'lucide-react';

interface SimpleMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
  useCurrentLocation?: boolean;
}

const SimpleMapPicker: React.FC<SimpleMapPickerProps> = ({
  initialLat = 41.0082, // İstanbul Taksim
  initialLng = 28.9784,
  onLocationSelect,
  className = '',
  useCurrentLocation = true
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [currentAddress, setCurrentAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (useCurrentLocation && !isGettingLocation) {
      getCurrentLocation();
    }
  }, [useCurrentLocation]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum hizmetlerini desteklemiyor');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');
    console.log('📍 Kullanıcı konumu alınıyor...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log('✅ Konum alındı:', { lat, lng });
        
        setCurrentLat(lat);
        setCurrentLng(lng);
        setIsGettingLocation(false);
        
        // Harita yüklenmişse konum güncelle
        if (mapInstanceRef.current) {
          updateMapLocation(lat, lng);
        }
      },
      (error) => {
        console.error('❌ Konum alma hatası:', error);
        setLocationError('Konum alınamadı. Varsayılan konum kullanılıyor.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const loadGoogleMaps = () => {
    console.log('🗺️ Google Maps yükleniyor...');
    
    // API zaten yüklenmişse direkt başlat
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      console.log('✅ Google Maps zaten yüklü');
      initializeMap();
      return;
    }

    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        setLocationError('Google Maps API anahtarı bulunamadı');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      // Global callback
      (window as any).initGoogleMaps = () => {
        console.log('✅ Google Maps API yüklendi');
        initializeMap();
      };
      
      script.onerror = () => {
        setLocationError('Google Maps yüklenemedi');
        console.error('❌ Google Maps yükleme hatası');
      };
      
      document.head.appendChild(script);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current) {
      console.error('❌ Map container bulunamadı');
      return;
    }
    
    if (!(window as any).google?.maps) {
      console.error('❌ Google Maps API hazır değil');
      return;
    }

    try {
      console.log('🎯 Harita oluşturuluyor...', { lat: currentLat, lng: currentLng });
      
      const google = (window as any).google;
      
      // Harita oluştur
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center: { lat: currentLat, lng: currentLng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      // Marker oluştur
      markerRef.current = new google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Teslimat Adresi'
      });

      // Geocoder oluştur
      geocoderRef.current = new google.maps.Geocoder();

      // Marker drag event
      markerRef.current.addListener('dragend', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setCurrentLat(lat);
        setCurrentLng(lng);
        reverseGeocode(lat, lng);
      });

      // Map click event
      mapInstanceRef.current.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateMapLocation(lat, lng);
      });

      setIsMapLoaded(true);
      console.log('✅ Harita başarıyla yüklendi');
      
      // İlk adres bilgisini al
      reverseGeocode(currentLat, currentLng);
      
    } catch (error) {
      console.error('❌ Harita başlatma hatası:', error);
      setLocationError('Harita başlatılamadı');
    }
  };

  const updateMapLocation = (lat: number, lng: number) => {
    if (mapInstanceRef.current && markerRef.current) {
      const position = { lat, lng };
      mapInstanceRef.current.setCenter(position);
      markerRef.current.setPosition(position);
      setCurrentLat(lat);
      setCurrentLng(lng);
      reverseGeocode(lat, lng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) {
      console.log('⚠️ Geocoder hazır değil');
      return;
    }

    try {
      setIsGeocoding(true);
      console.log('🔍 Adres çözümleniyor:', { lat, lng });
      
      geocoderRef.current.geocode(
        { 
          location: { lat, lng },
          language: 'tr',
          region: 'TR'
        },
        (results: any, status: any) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            console.log('✅ Adres bulundu:', address);
            setCurrentAddress(address);
            onLocationSelect(address, lat, lng);
          } else {
            console.warn('⚠️ Adres bulunamadı:', status);
            setCurrentAddress('Adres bulunamadı');
            onLocationSelect('Bilinmeyen adres', lat, lng);
          }
          setIsGeocoding(false);
        }
      );
    } catch (error) {
      console.error('❌ Geocoding hatası:', error);
      setIsGeocoding(false);
    }
  };

  const goToCurrentLocation = () => {
    getCurrentLocation();
  };

  return (
    <div className={`relative ${className}`}>
      {/* Harita Container */}
      <div 
        className="w-full bg-gray-100 rounded-lg border border-gray-300 relative overflow-hidden"
        style={{ height: '400px', minHeight: '400px' }}
      >
        <div
          ref={mapRef}
          className="w-full h-full"
          style={{ height: '400px' }}
        />
        
        {/* Loading Overlay */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Harita yükleniyor...</p>
            </div>
          </div>
        )}
        
        {/* Error Overlay */}
        {locationError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">{locationError}</p>
              <button
                onClick={() => {
                  setLocationError('');
                  loadGoogleMaps();
                }}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex-1">
          {isGeocoding ? (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Adres çözümleniyor...
            </div>
          ) : (
            <p className="text-sm text-gray-700 truncate">
              {currentAddress || 'Haritadan bir konum seçin'}
            </p>
          )}
        </div>
        
        <button
          onClick={goToCurrentLocation}
          disabled={isGettingLocation}
          className="ml-3 flex items-center px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isGettingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="ml-1">Konumum</span>
        </button>
      </div>
    </div>
  );
};

export default SimpleMapPicker; 