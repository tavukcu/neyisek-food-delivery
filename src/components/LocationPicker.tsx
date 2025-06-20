'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, AlertCircle, Map, Navigation, Loader2 } from 'lucide-react';
import { TURKISH_CITIES, POPULAR_CITIES, getCityById, getDistrictsByCity, City, District } from '@/data/cities';

interface LocationPickerProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  initialCity?: string;
  initialDistrict?: string;
  onLocationSelect: (address: string, lat: number, lng: number, city?: string, district?: string) => void;
  onAddressChange: (address: string) => void;
  onCityChange?: (cityId: string, cityName: string) => void;
  onDistrictChange?: (districtId: string, districtName: string) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialAddress = '',
  initialLat,
  initialLng,
  initialCity = '',
  initialDistrict = '',
  onLocationSelect,
  onAddressChange,
  onCityChange,
  onDistrictChange
}) => {
  const [address, setAddress] = useState(initialAddress);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [currentLat, setCurrentLat] = useState<number>(initialLat || 38.7312); // Manisa koordinatları
  const [currentLng, setCurrentLng] = useState<number>(initialLng || 27.4288);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  // Google Maps yükleme
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        // Fallback API key kullan
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyDi1mpSI-0uvm-Bngr9pegN2vi2xBvQXsU';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        script.onerror = () => {
          console.error('Google Maps yüklenemedi - API key kontrol edin');
        };
        document.head.appendChild(script);
      } else if (window.google) {
        initializeMap();
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return;

      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: currentLat, lng: currentLng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        const marker = new window.google.maps.Marker({
          position: { lat: currentLat, lng: currentLng },
          map: map,
          draggable: true,
          title: 'Restoran Konumu'
        });

        // Marker sürüklendiğinde konum güncelle
        marker.addListener('dragend', () => {
          const position = marker.getPosition();
          if (position) {
            const lat = position.lat();
            const lng = position.lng();
            setCurrentLat(lat);
            setCurrentLng(lng);
            onLocationSelect(address, lat, lng, selectedCity, selectedDistrict);
            
            // Reverse geocoding ile adres al
            reverseGeocode(lat, lng);
          }
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        geocoderRef.current = new window.google.maps.Geocoder();
        setIsMapLoaded(true);

      } catch (error) {
        console.error('Harita oluşturma hatası:', error);
      }
    };

    loadGoogleMaps();
  }, []);

  // Harita konumunu güncelle
  const updateMapLocation = useCallback((lat: number, lng: number) => {
    if (mapInstanceRef.current && markerRef.current) {
      const newPosition = { lat, lng };
      mapInstanceRef.current.setCenter(newPosition);
      markerRef.current.setPosition(newPosition);
      setCurrentLat(lat);
      setCurrentLng(lng);
    }
  }, []);

  // Reverse geocoding
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    try {
      setIsGeocoding(true);
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { location: { lat, lng } },
          (results, status) => {
            if (status === 'OK') {
              resolve({ results: results || [] } as google.maps.GeocoderResponse);
            } else {
              reject(new Error(status));
            }
          }
        );
      });

      if (response.results && response.results[0]) {
        const result = response.results[0];
        const formattedAddress = result.formatted_address;
        setAddress(formattedAddress);
        onAddressChange(formattedAddress);
      }
    } catch (error) {
      console.error('Reverse geocoding hatası:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [onAddressChange]);

  // Adres geocoding
  const geocodeAddress = useCallback(async (fullAddress: string) => {
    if (!geocoderRef.current || !fullAddress.trim()) return;

    try {
      setIsGeocoding(true);
      const response = await new Promise<google.maps.GeocoderResponse>((resolve, reject) => {
        geocoderRef.current!.geocode(
          { address: fullAddress },
          (results, status) => {
            if (status === 'OK') {
              resolve({ results: results || [] } as google.maps.GeocoderResponse);
            } else {
              reject(new Error(status));
            }
          }
        );
      });

      if (response.results && response.results[0]) {
        const result = response.results[0];
        const location = result.geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        
        updateMapLocation(lat, lng);
        onLocationSelect(fullAddress, lat, lng, selectedCity, selectedDistrict);
      }
    } catch (error) {
      console.error('Geocoding hatası:', error);
    } finally {
      setIsGeocoding(false);
    }
  }, [updateMapLocation, onLocationSelect, selectedCity, selectedDistrict]);

  // İl değiştiğinde ilçeleri güncelle
  useEffect(() => {
    if (selectedCity) {
      const districts = getDistrictsByCity(selectedCity);
      setAvailableDistricts(districts);
      
      // Eğer seçili ilçe yeni ilde yoksa temizle
      if (selectedDistrict && !districts.find(d => d.id === selectedDistrict)) {
        setSelectedDistrict('');
        onDistrictChange?.('', '');
      }
    } else {
      setAvailableDistricts([]);
      setSelectedDistrict('');
      onDistrictChange?.('', '');
    }
  }, [selectedCity, selectedDistrict, onDistrictChange]);

  // Adres değişikliği
  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
    onAddressChange(newAddress);
  };

  // Adresi haritada ara
  const handleSearchAddress = () => {
    const selectedCityData = selectedCity ? getCityById(selectedCity) : null;
    const selectedDistrictData = selectedDistrict ? availableDistricts.find(d => d.id === selectedDistrict) : null;
    
    let fullAddress = address.trim();
    if (selectedDistrictData) {
      fullAddress += `, ${selectedDistrictData.name}`;
    }
    if (selectedCityData) {
      fullAddress += `, ${selectedCityData.name}, Türkiye`;
    }
    
    if (fullAddress.trim()) {
      geocodeAddress(fullAddress);
    }
  };

  // İl seçimi
  const handleCitySelect = (cityId: string) => {
    const city = getCityById(cityId);
    if (city) {
      setSelectedCity(cityId);
      onCityChange?.(cityId, city.name);
      
      // Manisa koordinatları
      const cityCoordinates = getCityCoordinates(cityId);
      updateMapLocation(cityCoordinates.lat, cityCoordinates.lng);
      onLocationSelect(address, cityCoordinates.lat, cityCoordinates.lng, cityId, selectedDistrict);
    }
  };

  // İlçe seçimi
  const handleDistrictSelect = (districtId: string) => {
    const district = availableDistricts.find(d => d.id === districtId);
    if (district) {
      setSelectedDistrict(districtId);
      onDistrictChange?.(districtId, district.name);
      
      // Mevcut adresle geocoding yap
      const selectedCityData = selectedCity ? getCityById(selectedCity) : null;
      if (selectedCityData && address.trim()) {
        const fullAddress = `${address.trim()}, ${district.name}, ${selectedCityData.name}, Türkiye`;
        geocodeAddress(fullAddress);
      }
    }
  };

  // Popüler şehir seçimi
  const handlePopularCityClick = (cityId: string) => {
    handleCitySelect(cityId);
  };

  // Şehir koordinatları - Manisa için güncellenmiş
  const getCityCoordinates = (cityId: string): { lat: number; lng: number } => {
    const coordinates: { [key: string]: { lat: number; lng: number } } = {
      '45': { lat: 38.7312, lng: 27.4288 }, // Manisa merkez koordinatları
    };
    return coordinates[cityId] || { lat: 38.7312, lng: 27.4288 }; // Varsayılan Manisa
  };

  const selectedCityData = selectedCity ? getCityById(selectedCity) : null;
  const selectedDistrictData = selectedDistrict ? availableDistricts.find(d => d.id === selectedDistrict) : null;

  return (
    <div className="space-y-4">
      <label className="form-label">
        Restoran Konumu *
      </label>

      {/* İl Seçimi */}
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
          İl Seçiniz *
        </label>
        
        {/* Popüler Şehirler */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-2">Popüler şehirler:</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_CITIES.map(cityId => {
              const city = getCityById(cityId);
              return city ? (
                <button
                  key={cityId}
                  type="button"
                  onClick={() => handlePopularCityClick(cityId)}
                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                    selectedCity === cityId
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {city.name}
                </button>
              ) : null;
            })}
          </div>
        </div>

        {/* İl Dropdown */}
        <select
          id="city"
          value={selectedCity}
          onChange={(e) => handleCitySelect(e.target.value)}
          className="form-select"
          required
        >
          <option value="">İl seçiniz</option>
          {TURKISH_CITIES.map(city => (
            <option key={city.id} value={city.id}>
              {city.plateCode} - {city.name}
            </option>
          ))}
        </select>
      </div>

      {/* İlçe Seçimi */}
      {selectedCity && (
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
            İlçe Seçiniz *
          </label>
          <select
            id="district"
            value={selectedDistrict}
            onChange={(e) => handleDistrictSelect(e.target.value)}
            className="form-select"
            required
          >
            <option value="">İlçe seçiniz</option>
            {availableDistricts.map(district => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Detaylı Adres */}
      <div>
        <label htmlFor="detailedAddress" className="block text-sm font-medium text-gray-700 mb-2">
          Detaylı Adres *
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
          <textarea
            id="detailedAddress"
            value={address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="form-textarea pl-10 pr-12"
            rows={3}
            placeholder="Mahalle, sokak, cadde, bina no, kat/daire bilgilerini girin..."
            required
          />
          <button
            type="button"
            onClick={handleSearchAddress}
            disabled={!address.trim() || isGeocoding}
            className="absolute right-2 top-2 p-2 text-primary-600 hover:text-primary-700 disabled:opacity-50"
            title="Adresi haritada göster"
          >
            {isGeocoding ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Adres girdikten sonra arama butonuna tıklayarak haritada konumu görüntüleyebilirsiniz.
        </p>
      </div>

      {/* Google Maps */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Harita Konumu
        </label>
        <div className="relative">
          <div
            ref={mapRef}
            className="w-full h-64 rounded-lg border border-gray-300 bg-gray-100"
            style={{ minHeight: '256px' }}
          />
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary-600" />
                <p className="text-sm text-gray-600">Harita yükleniyor...</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500">
          📍 Marker'ı sürükleyerek konumu hassas olarak ayarlayabilirsiniz.
        </p>
      </div>

      {/* Seçilen Konum Özeti */}
      {selectedCityData && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center text-sm text-blue-800">
            <MapPin className="h-4 w-4 mr-2" />
            <span>
              <strong>Seçilen Konum:</strong> {selectedCityData.name}
              {selectedDistrictData && `, ${selectedDistrictData.name}`}
            </span>
          </div>
          {currentLat && currentLng && (
            <div className="mt-2 text-xs text-blue-600">
              <strong>Koordinatlar:</strong> {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
            </div>
          )}
        </div>
      )}

      {/* Adres Önizlemesi */}
      {(selectedCityData || address.trim()) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Navigation className="h-4 w-4 mr-2" />
            Tam Adres
          </h4>
          <p className="text-sm text-gray-700">
            {address.trim() && `${address.trim()}, `}
            {selectedDistrictData && `${selectedDistrictData.name}, `}
            {selectedCityData && selectedCityData.name}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationPicker; 