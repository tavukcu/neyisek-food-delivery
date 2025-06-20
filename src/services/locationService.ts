import { Address } from '@/types';

// Google Maps API interface tanımları
interface GoogleMapsPosition {
  lat: number;
  lng: number;
}

interface GoogleGeocodingResult {
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  formatted_address: string;
  geometry: {
    location: GoogleMapsPosition;
  };
}

interface GoogleDistanceMatrixResult {
  rows: Array<{
    elements: Array<{
      distance: {
        text: string;
        value: number; // meters
      };
      duration: {
        text: string;
        value: number; // seconds
      };
      status: string;
    }>;
  }>;
}

export class LocationService {
  private static getApiKey(): string {
    // Browser ortamında environment variable'ı kontrol et
    if (typeof window !== 'undefined') {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDi1mpSI-0uvm-Bngr9pegN2vi2xBvQXsU';
      return key;
    }
    // Server-side için fallback
    return 'AIzaSyDi1mpSI-0uvm-Bngr9pegN2vi2xBvQXsU';
  }

  private static watchId: number | null = null;

  // Kullanıcının mevcut konumunu al
  static async getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation API desteklenmiyor'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          let errorMessage = 'Konum alınamadı';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Konum izni reddedildi. Lütfen tarayıcı ayarlarından konum iznini açın.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Konum bilgisi kullanılamıyor.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Konum alma işlemi zaman aşımına uğradı.';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 dakika cache
        }
      );
    });
  }

  // Konum değişikliklerini dinle
  static watchPosition(
    onSuccess: (position: GeolocationPosition) => void,
    onError?: (error: GeolocationPositionError) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.(new Error('Geolocation API desteklenmiyor') as any);
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 60000 // 1 dakika cache
      }
    );
  }

  // Konum izlemeyi durdur
  static stopWatchingPosition(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Koordinatları adrese çevir (Reverse Geocoding)
  static async reverseGeocode(lat: number, lng: number): Promise<Address> {
    const apiKey = this.getApiKey();
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      throw new Error('Google Maps API key tanımlanmamış');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=tr&region=TR`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API isteği reddedildi. API key kontrol edin.');
      }
      
      if (data.status !== 'OK' || !data.results.length) {
        throw new Error('Bu koordinatlarda adres bulunamadı');
      }

      const result: GoogleGeocodingResult = data.results[0];
      return this.parseGoogleAddress(result);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Adres çözümlemesi başarısız');
    }
  }

  // Adresi koordinatlara çevir (Geocoding)
  static async geocodeAddress(address: string): Promise<GoogleMapsPosition> {
    const apiKey = this.getApiKey();
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      throw new Error('Google Maps API key tanımlanmamış');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=tr&region=TR`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === 'REQUEST_DENIED') {
        throw new Error('Google Maps API isteği reddedildi. API key kontrol edin.');
      }
      
      if (data.status !== 'OK' || !data.results.length) {
        throw new Error('Adres bulunamadı');
      }

      const result: GoogleGeocodingResult = data.results[0];
      return result.geometry.location;
    } catch (error) {
      console.error('Geocoding error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Koordinat çözümlemesi başarısız');
    }
  }

  // İki nokta arası mesafe ve süre hesapla
  static async calculateDistance(
    origin: GoogleMapsPosition,
    destination: GoogleMapsPosition
  ): Promise<{
    distance: { text: string; value: number };
    duration: { text: string; value: number };
  }> {
    const apiKey = this.getApiKey();
    
    if (!apiKey || apiKey === 'your-api-key-here') {
      throw new Error('Google Maps API key tanımlanmamış');
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${apiKey}&language=tr&units=metric&mode=driving`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: GoogleDistanceMatrixResult = await response.json();
      
      if (!data.rows.length || !data.rows[0].elements.length) {
        throw new Error('Mesafe hesaplanamadı');
      }

      const element = data.rows[0].elements[0];
      
      if (element.status !== 'OK') {
        throw new Error('Rota bulunamadı');
      }

      return {
        distance: element.distance,
        duration: element.duration
      };
    } catch (error) {
      console.error('Distance calculation error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Mesafe hesaplama başarısız');
    }
  }

  // Yakındaki restoranları bul
  static async findNearbyRestaurants(
    userPosition: GoogleMapsPosition,
    restaurants: Array<{
      id: string;
      name: string;
      address: Address;
      deliveryRadius: number; // km
    }>
  ): Promise<Array<{
    id: string;
    name: string;
    address: Address;
    distance: number; // km
    estimatedDeliveryTime: number; // dakika
    isInRange: boolean;
  }>> {
    const results = [];

    for (const restaurant of restaurants) {
      try {
        if (!restaurant.address.coordinates) {
          // Restoran koordinatları yoksa geocode et
          const coords = await this.geocodeAddress(
            `${restaurant.address.street}, ${restaurant.address.district}, ${restaurant.address.city}`
          );
          restaurant.address.coordinates = coords;
        }

        const distanceData = await this.calculateDistance(
          userPosition,
          restaurant.address.coordinates
        );

        const distanceKm = distanceData.distance.value / 1000;
        const isInRange = distanceKm <= restaurant.deliveryRadius;
        const estimatedDeliveryTime = Math.ceil(distanceData.duration.value / 60) + 15; // +15dk hazırlık

        results.push({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          distance: Math.round(distanceKm * 10) / 10, // 1 ondalık
          estimatedDeliveryTime,
          isInRange
        });
      } catch (error) {
        console.error(`Restaurant ${restaurant.name} distance calculation failed:`, error);
        // Hata durumunda varsayılan değerler
        results.push({
          id: restaurant.id,
          name: restaurant.name,
          address: restaurant.address,
          distance: 0,
          estimatedDeliveryTime: 30,
          isInRange: false
        });
      }
    }

    // Mesafeye göre sırala
    return results.sort((a, b) => a.distance - b.distance);
  }

  // Google adres formatını Address tipine çevir
  private static parseGoogleAddress(result: GoogleGeocodingResult): Address {
    const components = result.address_components;
    
    const getComponent = (types: string[]) => {
      const component = components.find(comp => 
        comp.types.some(type => types.includes(type))
      );
      return component?.long_name || '';
    };

    return {
      street: getComponent(['route']) || 
              getComponent(['street_number']) + ' ' + getComponent(['route']),
      district: getComponent(['sublocality', 'sublocality_level_1', 'administrative_area_level_2']),
      city: getComponent(['administrative_area_level_1', 'locality']),
      zipCode: getComponent(['postal_code']),
      country: getComponent(['country']) || 'Türkiye',
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng
      }
    };
  }

  // Kullanıcının konumunu localStorage'a kaydet
  static saveUserLocation(position: GeolocationPosition): void {
    const locationData = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy
    };
    
    localStorage.setItem('userLocation', JSON.stringify(locationData));
  }

  // Kaydedilmiş kullanıcı konumunu al
  static getSavedUserLocation(): GoogleMapsPosition | null {
    try {
      const saved = localStorage.getItem('userLocation');
      if (!saved) return null;
      
      const data = JSON.parse(saved);
      
      // 1 saatten eski konumları kabul etme
      if (Date.now() - data.timestamp > 3600000) {
        localStorage.removeItem('userLocation');
        return null;
      }
      
      return { lat: data.lat, lng: data.lng };
    } catch {
      return null;
    }
  }

  // Konum izni kontrol et
  static async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) {
      return 'prompt';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch {
      return 'prompt';
    }
  }

  // Teslimat zamanı tahmin et (trafik dahil)
  static async estimateDeliveryTime(
    restaurantPosition: GoogleMapsPosition,
    userPosition: GoogleMapsPosition,
    preparationTime: number = 20 // dakika
  ): Promise<{
    total: number; // toplam dakika
    preparation: number; // hazırlık dakika
    delivery: number; // teslimat dakika
    traffic: 'light' | 'moderate' | 'heavy';
  }> {
    try {
      const distanceData = await this.calculateDistance(restaurantPosition, userPosition);
      const deliveryMinutes = Math.ceil(distanceData.duration.value / 60);
      
      // Trafik yoğunluğu tahmini (basit algorithm)
      let traffic: 'light' | 'moderate' | 'heavy' = 'light';
      const now = new Date();
      const hour = now.getHours();
      
      if ((hour >= 12 && hour <= 14) || (hour >= 19 && hour <= 21)) {
        traffic = 'heavy';
      } else if ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19)) {
        traffic = 'moderate';
      }

      // Trafik çarpanı
      const trafficMultiplier = traffic === 'heavy' ? 1.5 : traffic === 'moderate' ? 1.2 : 1;
      const adjustedDeliveryTime = Math.ceil(deliveryMinutes * trafficMultiplier);

      return {
        total: preparationTime + adjustedDeliveryTime,
        preparation: preparationTime,
        delivery: adjustedDeliveryTime,
        traffic
      };
    } catch (error) {
      console.error('Delivery time estimation failed:', error);
      return {
        total: preparationTime + 30,
        preparation: preparationTime,
        delivery: 30,
        traffic: 'moderate'
      };
    }
  }

  // Türkiye illeri listesi
  static getTurkishCities(): string[] {
    return [
      'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya',
      'Artvin', 'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu',
      'Burdur', 'Bursa', 'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır',
      'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun',
      'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta', 'Mersin', 'İstanbul', 'İzmir',
      'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya',
      'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla', 'Muş',
      'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop',
      'Sivas', 'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak',
      'Van', 'Yozgat', 'Zonguldak', 'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale',
      'Batman', 'Şırnak', 'Bartın', 'Ardahan', 'Iğdır', 'Yalova', 'Karabük', 'Kilis',
      'Osmaniye', 'Düzce'
    ];
  }
} 