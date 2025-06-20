import { useState, useEffect, useCallback } from 'react';
import { LocationService } from '@/services/locationService';
import { Address } from '@/types';
import toast from 'react-hot-toast';

interface LocationState {
  position: GeolocationPosition | null;
  address: Address | null;
  loading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
}

interface NearbyRestaurant {
  id: string;
  name: string;
  address: Address;
  distance: number;
  estimatedDeliveryTime: number;
  isInRange: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    position: null,
    address: null,
    loading: false,
    error: null,
    permissionStatus: 'unknown'
  });
  
  const [isWatching, setIsWatching] = useState(false);
  const [nearbyRestaurants, setNearbyRestaurants] = useState<NearbyRestaurant[]>([]);

  // Konum izni durumunu kontrol et
  const checkPermission = useCallback(async () => {
    try {
      const status = await LocationService.checkLocationPermission();
      setState(prev => ({ ...prev, permissionStatus: status }));
      return status;
    } catch (error) {
      setState(prev => ({ ...prev, permissionStatus: 'unknown' }));
      return 'unknown';
    }
  }, []);

  // Mevcut konumu al
  const getCurrentLocation = useCallback(async (showToast = true) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // İzin kontrolü
      const permission = await checkPermission();
      if (permission === 'denied') {
        throw new Error('Konum izni reddedildi');
      }

      // Konum al
      const position = await LocationService.getCurrentPosition();
      
      // Adresi çöz
      const address = await LocationService.reverseGeocode(
        position.coords.latitude,
        position.coords.longitude
      );

      // Konumu kaydet
      LocationService.saveUserLocation(position);

      setState(prev => ({
        ...prev,
        position,
        address,
        loading: false,
        error: null,
        permissionStatus: 'granted'
      }));

      if (showToast) {
        toast.success('🎯 Konumunuz başarıyla tespit edildi');
      }

      return { position, address };
    } catch (error: any) {
      const errorMessage = error.message || 'Konum alınamadı';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        permissionStatus: error.message.includes('izin') ? 'denied' : prev.permissionStatus
      }));

      if (showToast) {
        toast.error(`❌ ${errorMessage}`);
      }
      
      throw error;
    }
  }, [checkPermission]);

  // Kaydedilmiş konumu yükle
  const loadSavedLocation = useCallback(async () => {
    const savedPosition = LocationService.getSavedUserLocation();
    if (!savedPosition) return false;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Adresi çöz
      const address = await LocationService.reverseGeocode(
        savedPosition.lat,
        savedPosition.lng
      );

      // GeolocationPosition formatına çevir
      const position: GeolocationPosition = {
        coords: {
          latitude: savedPosition.lat,
          longitude: savedPosition.lng,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({
            latitude: savedPosition.lat,
            longitude: savedPosition.lng,
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
            latitude: savedPosition.lat,
            longitude: savedPosition.lng,
            accuracy: 100,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: Date.now()
        })
      };

      setState(prev => ({
        ...prev,
        position,
        address,
        loading: false,
        error: null
      }));

      return true;
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      return false;
    }
  }, []);

  // Konum izlemeyi başlat
  const startWatching = useCallback(() => {
    if (isWatching) return;

    LocationService.watchPosition(
      (position) => {
        setState(prev => ({ ...prev, position }));
        
        // Adres güncelle (throttle ile)
        LocationService.reverseGeocode(
          position.coords.latitude,
          position.coords.longitude
        ).then(address => {
          setState(prev => ({ ...prev, address }));
        }).catch(() => {
          // Adres çözümleme hatası sessizce geç
        });

        // Konumu kaydet
        LocationService.saveUserLocation(position);
      },
      (error) => {
        console.error('Location watching error:', error);
        setState(prev => ({ 
          ...prev, 
          error: 'Konum izleme hatası: ' + error.message 
        }));
      }
    );

    setIsWatching(true);
    toast.success('📍 Konum takibi başlatıldı');
  }, [isWatching]);

  // Konum izlemeyi durdur
  const stopWatching = useCallback(() => {
    if (!isWatching) return;

    LocationService.stopWatchingPosition();
    setIsWatching(false);
    toast.success('⏹️ Konum takibi durduruldu');
  }, [isWatching]);

  // Yakındaki restoranları bul
  const findNearbyRestaurants = useCallback(async (restaurants: Array<{
    id: string;
    name: string;
    address: Address;
    deliveryRadius: number;
  }>) => {
    if (!state.position) {
      throw new Error('Önce konumunuzu tespit edin');
    }

    try {
      const userPosition = {
        lat: state.position.coords.latitude,
        lng: state.position.coords.longitude
      };

      const nearby = await LocationService.findNearbyRestaurants(
        userPosition,
        restaurants
      );

      setNearbyRestaurants(nearby);
      return nearby;
    } catch (error: any) {
      toast.error('Yakındaki restoranlar bulunamadı: ' + error.message);
      throw error;
    }
  }, [state.position]);

  // Teslimat süresi tahmin et
  const estimateDeliveryTime = useCallback(async (
    restaurantAddress: Address,
    preparationTime: number = 20
  ) => {
    if (!state.position || !restaurantAddress.coordinates) {
      throw new Error('Konum veya restoran koordinatları eksik');
    }

    try {
      const userPosition = {
        lat: state.position.coords.latitude,
        lng: state.position.coords.longitude
      };

      return await LocationService.estimateDeliveryTime(
        restaurantAddress.coordinates,
        userPosition,
        preparationTime
      );
    } catch (error: any) {
      toast.error('Teslimat süresi hesaplanamadı: ' + error.message);
      throw error;
    }
  }, [state.position]);

  // Adres geocode et
  const geocodeAddress = useCallback(async (addressString: string) => {
    try {
      return await LocationService.geocodeAddress(addressString);
    } catch (error: any) {
      toast.error('Adres bulunamadı: ' + error.message);
      throw error;
    }
  }, []);

  // Mesafe hesapla
  const calculateDistance = useCallback(async (targetAddress: Address) => {
    if (!state.position || !targetAddress.coordinates) {
      throw new Error('Konum veya hedef koordinatları eksik');
    }

    try {
      const userPosition = {
        lat: state.position.coords.latitude,
        lng: state.position.coords.longitude
      };

      return await LocationService.calculateDistance(
        userPosition,
        targetAddress.coordinates
      );
    } catch (error: any) {
      toast.error('Mesafe hesaplanamadı: ' + error.message);
      throw error;
    }
  }, [state.position]);

  // Sayfa yüklendiğinde kaydedilmiş konumu kontrol et
  useEffect(() => {
    const initLocation = async () => {
      await checkPermission();
      await loadSavedLocation();
    };

    initLocation();
  }, [checkPermission, loadSavedLocation]);

  // Cleanup - component unmount olduğunda konum izlemeyi durdur
  useEffect(() => {
    return () => {
      if (isWatching) {
        LocationService.stopWatchingPosition();
      }
    };
  }, [isWatching]);

  return {
    // State
    position: state.position,
    address: state.address,
    loading: state.loading,
    error: state.error,
    permissionStatus: state.permissionStatus,
    isWatching,
    nearbyRestaurants,

    // Actions
    getCurrentLocation,
    loadSavedLocation,
    startWatching,
    stopWatching,
    findNearbyRestaurants,
    estimateDeliveryTime,
    geocodeAddress,
    calculateDistance,
    checkPermission,

    // Utils
    hasLocation: !!state.position,
    hasAddress: !!state.address,
    isLocationEnabled: state.permissionStatus === 'granted',
    coordinates: state.position ? {
      lat: state.position.coords.latitude,
      lng: state.position.coords.longitude
    } : null
  };
} 