'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, Navigation, Maximize2 } from 'lucide-react';

interface MobileOptimizedMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (address: string, lat: number, lng: number) => void;
  className?: string;
  height?: string;
  showControls?: boolean;
  allowFullscreen?: boolean;
}

const MobileOptimizedMap: React.FC<MobileOptimizedMapProps> = ({
  initialLat = 38.6191,
  initialLng = 27.4289,
  onLocationSelect,
  className = '',
  height = '250px',
  showControls = true,
  allowFullscreen = false
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [currentAddress, setCurrentAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapError, setMapError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);

  // Mobil cihaz kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Google Maps yükleme
  const loadGoogleMaps = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).google?.maps) {
      initializeMap();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=tr&region=TR`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps API yüklendi');
      initializeMap();
    };
    
    script.onerror = () => {
      console.error('❌ Google Maps API yüklenemedi');
      setMapError('Harita servisi yüklenemedi');
    };
    
    document.head.appendChild(script);
  }, []);

  // Harita başlatma
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !(window as any).google?.maps) {
      setMapError('Harita başlatılamadı');
      return;
    }

    try {
      const google = (window as any).google;
      
      // Mobil optimized ayarlar
      const mapOptions = {
        center: { lat: currentLat, lng: currentLng },
        zoom: isMobile ? 15 : 16,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: allowFullscreen,
        zoomControl: showControls,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        gestureHandling: 'greedy',
        disableDefaultUI: !showControls,
        clickableIcons: false,
        draggable: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        keyboardShortcuts: false,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      mapInstanceRef.current = new google.maps.Map(mapRef.current, mapOptions);

      // Marker oluştur
      markerRef.current = new google.maps.Marker({
        position: { lat: currentLat, lng: currentLng },
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Konum',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12)
        }
      });

      geocoderRef.current = new google.maps.Geocoder();

      // Event listeners
      markerRef.current.addListener('dragend', handleMarkerDrag);
      mapInstanceRef.current.addListener('click', handleMapClick);

      setIsMapLoaded(true);
      setMapError('');
      
      // İlk adres çözümlemesi
      reverseGeocode(currentLat, currentLng);

    } catch (error) {
      console.error('❌ Harita başlatma hatası:', error);
      setMapError('Harita başlatılamadı');
    }
  }, [currentLat, currentLng, isMobile, showControls, allowFullscreen]);

  // Marker sürükleme
  const handleMarkerDrag = useCallback((e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCurrentLat(lat);
    setCurrentLng(lng);
    reverseGeocode(lat, lng);
  }, []);

  // Harita tıklama
  const handleMapClick = useCallback((e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    updateMapLocation(lat, lng);
  }, []);

  // Konum güncelleme
  const updateMapLocation = useCallback((lat: number, lng: number) => {
    if (mapInstanceRef.current && markerRef.current) {
      const position = { lat, lng };
      mapInstanceRef.current.setCenter(position);
      markerRef.current.setPosition(position);
      setCurrentLat(lat);
      setCurrentLng(lng);
      reverseGeocode(lat, lng);
    }
  }, []);

  // Adres çözümleme
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      setIsGeocoding(true);
      
      geocoderRef.current.geocode(
        { 
          location: { lat, lng },
          language: 'tr',
          region: 'TR'
        },
        (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            const address = results[0].formatted_address;
            setCurrentAddress(address);
            onLocationSelect(address, lat, lng);
          } else {
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
  }, [onLocationSelect]);

  // Mevcut konuma git
  const goToCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setMapError('Konum hizmetleri desteklenmiyor');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (lat >= 35.0 && lat <= 42.5 && lng >= 25.0 && lng <= 45.0) {
          updateMapLocation(lat, lng);
        } else {
          setMapError('Konum Türkiye dışında');
        }
      },
      (error) => {
        setMapError('Konum alınamadı');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [updateMapLocation]);

  // Tam ekran toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  useEffect(() => {
    loadGoogleMaps();
  }, [loadGoogleMaps]);

  const containerHeight = isFullscreen ? '100vh' : height;
  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white' 
    : `relative ${className}`;

  return (
    <div className={containerClass}>
      {/* Harita Container */}
      <div 
        className="w-full bg-gray-100 rounded-lg border border-gray-300 relative overflow-hidden touch-manipulation"
        style={{ 
          height: containerHeight,
          minHeight: containerHeight,
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div
          ref={mapRef}
          className="w-full h-full touch-manipulation"
          style={{ 
            height: containerHeight,
            display: isMapLoaded && !mapError ? 'block' : 'none',
            touchAction: 'manipulation'
          }}
        />
        
        {/* Loading */}
        {!isMapLoaded && !mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Harita yükleniyor...</p>
            </div>
          </div>
        )}
        
        {/* Error */}
        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50">
            <div className="text-center p-4">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-sm text-red-600 mb-2">{mapError}</p>
              <button
                onClick={() => {
                  setMapError('');
                  loadGoogleMaps();
                }}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
              >
                Tekrar Dene
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        {isMapLoaded && showControls && (
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            <button
              onClick={goToCurrentLocation}
              className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
              title="Mevcut konuma git"
            >
              <Navigation className="h-4 w-4 text-blue-600" />
            </button>
            
            {allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
              >
                <Maximize2 className="h-4 w-4 text-blue-600" />
              </button>
            )}
          </div>
        )}

        {/* Geocoding indicator */}
        {isGeocoding && (
          <div className="absolute top-2 right-2 p-2 bg-white rounded-lg shadow-md">
            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          </div>
        )}
      </div>

      {/* Address info */}
      {currentAddress && !isFullscreen && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="flex items-center text-blue-800">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">{currentAddress}</span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
          </div>
        </div>
      )}

      {/* Fullscreen close button */}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 p-2 bg-white rounded-lg shadow-lg z-10"
        >
          <span className="text-lg">×</span>
        </button>
      )}
    </div>
  );
};

export default MobileOptimizedMap; 