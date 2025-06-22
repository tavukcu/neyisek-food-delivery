'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Loader2, AlertCircle, Navigation, Wifi, WifiOff, Smartphone, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface MobileLocationDetectorProps {
  onLocationDetected: (position: GeolocationPosition, address?: string) => void;
  onError?: (error: string) => void;
  className?: string;
  autoDetect?: boolean;
}

interface LocationAttempt {
  method: string;
  status: 'pending' | 'success' | 'failed';
  error?: string;
  position?: GeolocationPosition;
}

const MobileLocationDetector: React.FC<MobileLocationDetectorProps> = ({
  onLocationDetected,
  onError,
  className = '',
  autoDetect = false
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string>('');
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [attempts, setAttempts] = useState<LocationAttempt[]>([]);
  const [deviceInfo, setDeviceInfo] = useState<any>({});
  const [networkInfo, setNetworkInfo] = useState<any>({});

  // Cihaz ve ağ bilgilerini topla
  useEffect(() => {
    const detectDeviceInfo = () => {
      const userAgent = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isAndroid = /Android/.test(userAgent);
      const isSecure = window.location.protocol === 'https:';
      
      setDeviceInfo({
        isMobile,
        isIOS,
        isAndroid,
        isSecure,
        userAgent: userAgent.substring(0, 100) + '...',
        hasGeolocation: 'geolocation' in navigator,
        hasPermissions: 'permissions' in navigator,
        language: navigator.language,
        platform: navigator.platform
      });

      // Ağ bilgileri (mevcut ise)
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }
    };

    detectDeviceInfo();
  }, []);

  // İzin durumunu kontrol et
  const checkPermissionStatus = useCallback(async () => {
    if (!navigator.permissions) {
      setPermissionStatus('unknown');
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state as any);
      
      // İzin değişikliklerini dinle
      permission.addEventListener('change', () => {
        setPermissionStatus(permission.state as any);
      });
      
      return permission.state;
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
      setPermissionStatus('unknown');
      return 'unknown';
    }
  }, []);

  // Konum alma denemesi kaydet
  const addAttempt = useCallback((method: string, status: 'pending' | 'success' | 'failed', error?: string, position?: GeolocationPosition) => {
    setAttempts(prev => [...prev, { method, status, error, position }]);
  }, []);

  // Yüksek doğruluklu konum alma
  const attemptHighAccuracyLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      addAttempt('High Accuracy GPS', 'pending');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Yüksek doğruluklu konum alındı:', position);
          addAttempt('High Accuracy GPS', 'success', undefined, position);
          resolve(position);
        },
        (error) => {
          console.warn('⚠️ Yüksek doğruluklu konum başarısız:', error);
          addAttempt('High Accuracy GPS', 'failed', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, [addAttempt]);

  // Düşük doğruluklu hızlı konum alma
  const attemptFastLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      addAttempt('Fast Network Location', 'pending');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Hızlı konum alındı:', position);
          addAttempt('Fast Network Location', 'success', undefined, position);
          resolve(position);
        },
        (error) => {
          console.warn('⚠️ Hızlı konum başarısız:', error);
          addAttempt('Fast Network Location', 'failed', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000 // 5 dakika cache
        }
      );
    });
  }, [addAttempt]);

  // Cached konum alma
  const attemptCachedLocation = useCallback((): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      addAttempt('Cached Location', 'pending');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('✅ Cache\'li konum alındı:', position);
          addAttempt('Cached Location', 'success', undefined, position);
          resolve(position);
        },
        (error) => {
          console.warn('⚠️ Cache\'li konum başarısız:', error);
          addAttempt('Cached Location', 'failed', error.message);
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 3000,
          maximumAge: 600000 // 10 dakika cache
        }
      );
    });
  }, [addAttempt]);

  // IP tabanlı konum alma (fallback)
  const attemptIPLocation = useCallback(async (): Promise<GeolocationPosition> => {
    addAttempt('IP-based Location', 'pending');
    
    try {
      // Basit IP geolocation servisi
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const mockPosition: GeolocationPosition = {
          coords: {
            latitude: data.latitude,
            longitude: data.longitude,
            accuracy: 10000, // IP tabanlı konum düşük doğrulukta
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
            toJSON: () => ({
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 10000,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            })
          },
          timestamp: Date.now(),
          toJSON: () => ({
            coords: {
              latitude: data.latitude,
              longitude: data.longitude,
              accuracy: 10000,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null
            },
            timestamp: Date.now()
          })
        };
        
        console.log('✅ IP tabanlı konum alındı:', mockPosition);
        addAttempt('IP-based Location', 'success', undefined, mockPosition);
        return mockPosition;
      } else {
        throw new Error('IP konum servisi yanıt vermedi');
      }
    } catch (error: any) {
      console.error('❌ IP tabanlı konum başarısız:', error);
      addAttempt('IP-based Location', 'failed', error.message);
      throw error;
    }
  }, [addAttempt]);

  // Ana konum tespit fonksiyonu
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const error = 'Bu cihaz konum hizmetlerini desteklemiyor';
      setLocationError(error);
      onError?.(error);
      return;
    }

    setIsDetecting(true);
    setLocationError('');
    setAttempts([]);

    try {
      // 1. İzin durumunu kontrol et
      const permission = await checkPermissionStatus();
      
      if (permission === 'denied') {
        throw new Error('Konum izni reddedildi. Tarayıcı ayarlarından konum iznini açmanız gerekiyor.');
      }

      let position: GeolocationPosition | null = null;

      // 2. Sırayla farklı yöntemleri dene
      const methods = [
        attemptCachedLocation,
        attemptFastLocation,
        attemptHighAccuracyLocation
      ];

      for (const method of methods) {
        try {
          position = await method();
          break; // İlk başarılı yöntemde dur
        } catch (error) {
          console.warn('Konum alma yöntemi başarısız:', error);
          continue; // Sonraki yöntemi dene
        }
      }

      // 3. GPS başarısız olursa IP tabanlı konum dene
      if (!position) {
        try {
          position = await attemptIPLocation();
          toast('GPS konumu alınamadı, yaklaşık konum kullanılıyor', {
            duration: 4000,
            icon: '⚠️'
          });
        } catch (error) {
          throw new Error('Hiçbir yöntemle konum tespit edilemedi');
        }
      }

      // 4. Türkiye sınırları kontrolü
      if (position) {
        const { latitude, longitude } = position.coords;
        
        if (latitude < 35.0 || latitude > 42.5 || longitude < 25.0 || longitude > 45.0) {
          toast('Konum Türkiye dışında tespit edildi', {
            duration: 3000,
            icon: '⚠️'
          });
        }

        // 5. Başarılı konum tespiti
        onLocationDetected(position);
        toast.success('🎯 Konumunuz başarıyla tespit edildi');
        
        // Adres çözümlemesi (opsiyonel)
        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=tr&region=TR`
          );
          const data = await response.json();
          
          if (data.status === 'OK' && data.results?.[0]) {
            const address = data.results[0].formatted_address;
            console.log('🏠 Adres çözümlendi:', address);
          }
        } catch (error) {
          console.warn('Adres çözümlemesi başarısız:', error);
        }
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Konum tespit edilemedi';
      setLocationError(errorMessage);
      onError?.(errorMessage);
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsDetecting(false);
    }
  }, [checkPermissionStatus, attemptCachedLocation, attemptFastLocation, attemptHighAccuracyLocation, attemptIPLocation, onLocationDetected, onError]);

  // Otomatik konum tespiti
  useEffect(() => {
    if (autoDetect) {
      detectLocation();
    }
  }, [autoDetect, detectLocation]);

  // İzin durumu değiştiğinde kontrol et
  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  const getPermissionIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Navigation className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'prompt':
        return <MapPin className="h-5 w-5 text-yellow-500" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPermissionText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Konum izni verildi';
      case 'denied':
        return 'Konum izni reddedildi';
      case 'prompt':
        return 'Konum izni bekleniyor';
      default:
        return 'Konum izni durumu bilinmiyor';
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Ana Başlık */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Smartphone className="h-5 w-5 mr-2 text-blue-500" />
          Mobil Konum Tespiti
        </h3>
        {deviceInfo.isSecure ? (
          <div className="flex items-center text-green-600 text-sm">
            <Wifi className="h-4 w-4 mr-1" />
            Güvenli
          </div>
        ) : (
          <div className="flex items-center text-red-600 text-sm">
            <WifiOff className="h-4 w-4 mr-1" />
            Güvensiz
          </div>
        )}
      </div>

      {/* İzin Durumu */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-4">
        <div className="flex items-center">
          {getPermissionIcon()}
          <span className="ml-2 text-sm font-medium">{getPermissionText()}</span>
        </div>
        {permissionStatus === 'denied' && (
          <button
            onClick={() => {
              toast('Tarayıcı ayarlarından konum iznini açın ve sayfayı yenileyin', {
                duration: 5000,
                icon: '⚙️'
              });
            }}
            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded"
          >
            Nasıl Açılır?
          </button>
        )}
      </div>

      {/* Ana Buton */}
      <button
        onClick={detectLocation}
        disabled={isDetecting || !deviceInfo.hasGeolocation}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
      >
        {isDetecting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Konum Tespit Ediliyor...
          </>
        ) : (
          <>
            <MapPin className="h-5 w-5 mr-2" />
            Konumumu Tespit Et
          </>
        )}
      </button>

      {/* Hata Mesajı */}
      {locationError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{locationError}</p>
          </div>
        </div>
      )}

      {/* Deneme Geçmişi */}
      {attempts.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Deneme Geçmişi:</h4>
          <div className="space-y-2">
            {attempts.map((attempt, index) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="font-medium">{attempt.method}</span>
                <span className={`px-2 py-1 rounded ${
                  attempt.status === 'success' ? 'bg-green-100 text-green-700' :
                  attempt.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {attempt.status === 'success' ? '✅' : attempt.status === 'failed' ? '❌' : '⏳'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cihaz Bilgileri (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4">
          <summary className="text-xs text-gray-500 cursor-pointer">Cihaz Bilgileri (Debug)</summary>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div>Platform: {deviceInfo.platform}</div>
            <div>Mobil: {deviceInfo.isMobile ? 'Evet' : 'Hayır'}</div>
            <div>iOS: {deviceInfo.isIOS ? 'Evet' : 'Hayır'}</div>
            <div>Android: {deviceInfo.isAndroid ? 'Evet' : 'Hayır'}</div>
            <div>HTTPS: {deviceInfo.isSecure ? 'Evet' : 'Hayır'}</div>
            <div>Geolocation: {deviceInfo.hasGeolocation ? 'Destekli' : 'Desteklenmiyor'}</div>
            <div>Permissions API: {deviceInfo.hasPermissions ? 'Destekli' : 'Desteklenmiyor'}</div>
            {networkInfo.effectiveType && (
              <div>Ağ: {networkInfo.effectiveType} ({networkInfo.downlink} Mbps)</div>
            )}
          </div>
        </details>
      )}
    </div>
  );
};

export default MobileLocationDetector; 