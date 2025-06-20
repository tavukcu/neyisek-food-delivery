'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SimpleMapPicker from '@/components/SimpleMapPicker';
import AdvancedOrderCompletion from '@/components/AdvancedOrderCompletion';
import SmartCartRecommendations from '@/components/SmartCartRecommendations';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { LocationService } from '@/services/locationService';
import { RestaurantService } from '@/services/restaurantService';
import { OrderService } from '@/services/orderService';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  MapPin,
  CreditCard,
  Banknote,
  Navigation,
  Loader,
  CheckCircle,
  AlertCircle,
  Map,
  Store,
  Clock,
  Edit3,
  Flame,
  Sparkles,
  Star,
  ArrowLeft,
  Package,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Address, PaymentMethod, RestaurantInfo, OrderStatus } from '@/types';

// Sepet sayfası komponenti - Altın Oran Tasarımı
export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    subtotal, 
    deliveryFee, 
    total, 
    hasItems,
    forceRefresh
  } = useCart();

  // Client-side rendering kontrolü
  const [isClient, setIsClient] = useState(false);
  const [cartUpdateTrigger, setCartUpdateTrigger] = useState(0);

  useEffect(() => {
    setIsClient(true);
    
    // 🚀 Sepet güncellemelerini dinle
    const handleCartUpdate = (event: CustomEvent) => {
      console.log('🛒 Cart sayfası: Sepet güncelleme eventi alındı:', event.detail);
      
      // 🚀 Sepet state'ini force refresh et
      if (forceRefresh) {
        forceRefresh();
      }
      
      // State'i force update et
      setCartUpdateTrigger(prev => prev + 1);
      
      if (event.detail?.action === 'add') {
        toast.success(`🎉 ${event.detail.productName} sepete eklendi!`);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
    };
  }, []);

  // States
  const [restaurants, setRestaurants] = useState<{[key: string]: RestaurantInfo}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery' as PaymentMethod);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Konum durumları
  const [currentLocation, setCurrentLocation] = useState<Address | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState<Address | null>(null);
  const [useMapLocation, setUseMapLocation] = useState(false);
  const [mapLocation, setMapLocation] = useState<Address | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Seçilen adres - öncelik sırası: harita > mevcut konum > manuel adres
  const selectedAddress = useMapLocation ? mapLocation : 
                         useCurrentLocation ? currentLocation : 
                         manualAddress;

  // Restoran bilgilerini yükle
  useEffect(() => {
    const loadRestaurantData = async () => {
      const restaurantIds = Array.from(new Set(cartItems.map(item => item.product.restaurantId).filter(Boolean)));
      const restaurantData: {[key: string]: RestaurantInfo} = {};
      
      for (const restaurantId of restaurantIds) {
        try {
          const restaurant = await RestaurantService.getRestaurant(restaurantId);
          if (restaurant) {
            restaurantData[restaurantId] = restaurant;
          }
        } catch (error) {
          console.error(`Restoran ${restaurantId} yüklenirken hata:`, error);
        }
      }
      
      setRestaurants(restaurantData);
    };

    if (cartItems.length > 0) {
      loadRestaurantData();
    }
  }, [cartItems, hasItems, total, cartUpdateTrigger]);

  // Konum algılama
  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Konum servisi desteklenmiyor');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const { latitude, longitude } = position.coords;
      const address = await LocationService.reverseGeocode(latitude, longitude);
      
      setCurrentLocation(address);
      setUseCurrentLocation(true);
      toast.success('Konumunuz başarıyla algılandı');
    } catch (error) {
      console.error('Konum algılama hatası:', error);
      setLocationError('Konum algılanamadı. Lütfen manuel olarak adres girin.');
      toast.error('Konum algılanamadı');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Manuel adres değiştirme
  const handleManualAddressChange = (newAddress: Address) => {
    setManualAddress(newAddress);
    setUseCurrentLocation(false);
  };

  // Harita konumu seçildiğinde
  const handleMapLocationSelect = (address: string, lat: number, lng: number, city?: string, district?: string) => {
    const newMapLocation: Address = {
      street: address,
      district: district || '',
      city: city || '',
      zipCode: '',
      country: 'Türkiye',
      coordinates: { lat, lng }
    };
    
    setMapLocation(newMapLocation);
    setUseMapLocation(true);
    setUseCurrentLocation(false);
    toast.success('Harita konumu seçildi');
  };

  // Harita adres değiştiğinde
  const handleMapAddressChange = (address: string) => {
    if (mapLocation) {
      setMapLocation({
        ...mapLocation,
        street: address
      });
    }
  };

  // Sipariş oluşturma
  const handleSubmitOrder = async () => {
    if (!user) {
      toast.error('Sipariş vermek için giriş yapmalısınız');
      router.push('/login');
      return;
    }

    if (!selectedAddress) {
      toast.error('Lütfen teslimat adresi seçin');
      return;
    }

    if (!hasItems) {
      toast.error('Sepetiniz boş');
      return;
    }

    // Farklı restoranlardan ürün kontrolü
    const restaurantIds = Array.from(new Set(cartItems.map(item => item.product.restaurantId).filter(Boolean)));
    
    if (restaurantIds.length > 1) {
      toast.error('Sepetinizde farklı restoranlardan ürünler var. Lütfen tek restorandan sipariş verin.');
      return;
    }

    const restaurantId = restaurantIds[0];
    if (!restaurantId) {
      toast.error('Restoran bilgisi eksik');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('📦 Sipariş gönderiliyor...');
      
      const orderData = {
        restaurantId,
        items: cartItems.map(item => ({
          product: {
            id: item.productId,
            name: item.product.name,
            price: item.price || item.product.price,
            categoryId: item.categoryId,
            imageUrl: item.product.imageUrl
          },
          quantity: item.quantity,
          notes: item.specialInstructions || ''
        })),
        customerInfo: {
          userId: user.uid,
          name: user.displayName || 'Kullanıcı',
          phone: user.phoneNumber || '',
          email: user.email || ''
        },
        deliveryAddress: selectedAddress,
        paymentMethod,
        notes: specialInstructions.trim() || '',
        totalAmount: total
      };

      console.log('📦 Sipariş verisi:', orderData);

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();
      console.log('📦 API yanıtı:', result);

      if (result.success) {
        clearCart();
        toast.success('🎉 Siparişiniz başarıyla alındı!');
        router.push(`/orders/${result.orderId}`);
      } else {
        throw new Error(result.error || 'Sipariş oluşturulamadı');
      }
      
    } catch (error) {
      console.error('🔴 Sipariş oluşturma hatası:', error);
      if (error instanceof Error) {
        toast.error(`Sipariş oluşturulurken bir hata oluştu: ${error.message}`);
      } else {
        toast.error('Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading durumu
  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">
            {!isClient ? 'Sayfa yükleniyor...' : 'Kimlik doğrulama kontrol ediliyor...'}
          </p>
        </div>
      </div>
    );
  }

  // Giriş yapmamış kullanıcı
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Giriş Yapın
            </h2>
            <p className="text-gray-600 mb-8">
              Sipariş vermek için giriş yapmanız gerekiyor.
            </p>
            <div className="space-y-3">
              <Link href="/login" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 block">
                Giriş Yap
              </Link>
              <Link href="/register" className="w-full border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 block">
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      {/* Ana Sayfaya Dön Butonu */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Ana Sayfaya Dön</span>
        </Link>
      </div>

      {!hasItems ? (
        // Boş Sepet - Modern Tasarım
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Sepetiniz Boş
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Lezzetli yemeklerimizi keşfetmek için menüye göz atın.
            </p>
            <Link href="/" className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
              <ShoppingCart className="h-5 w-5" />
              Restoranları Keşfet
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      ) : (
        // Dolu Sepet - Altın Oran Layout (62:38)
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-8 gap-8">
            
            {/* Sol Bölüm - Sepet İçeriği (62% - 5 sütun) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Sayfa Başlığı */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Sepetim
                    </h1>
                    <p className="text-gray-600">
                      {cartItems.length} ürün • Toplam ₺{total.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <button
                      onClick={clearCart}
                      className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sepeti Temizle
                    </button>
                  </div>
                </div>
              </div>

              {/* Restoran Ürünleri */}
              {Object.entries(
                cartItems.reduce((acc, item) => {
                  const restaurantId = item.product.restaurantId || 'unknown';
                  if (!acc[restaurantId]) acc[restaurantId] = [];
                  acc[restaurantId].push(item);
                  return acc;
                }, {} as {[key: string]: typeof cartItems})
              ).map(([restaurantId, items]) => (
                <div key={restaurantId} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  
                  {/* Restoran Başlığı */}
                  {restaurants[restaurantId] && (
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                          <Store className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {restaurants[restaurantId].name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {restaurants[restaurantId].estimatedDeliveryTime} dk
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              4.8
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ürün Listesi */}
                  <div className="p-6 space-y-6">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        
                        {/* Ürün Resmi */}
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                          {item.product.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            '🍽️'
                          )}
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">
                            {item.product.name}
                          </h4>
                          
                          {/* Ürün Özellikleri */}
                          <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                            {item.product.preparationTime > 0 && (
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                                <Clock className="h-3 w-3" />
                                <span>{item.product.preparationTime} dk</span>
                              </div>
                            )}
                            
                            {item.product.calories > 0 && (
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                                <Flame className="h-3 w-3 text-orange-500" />
                                <span>{item.product.calories} kcal</span>
                              </div>
                            )}
                          </div>
                          
                          {item.variant && (
                            <p className="text-sm text-gray-600 mb-2 bg-white px-2 py-1 rounded-lg inline-block">
                              <strong>Seçenek:</strong> {item.variant.name}
                            </p>
                          )}
                          
                          {item.specialInstructions && (
                            <p className="text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg">
                              <strong>Özel Not:</strong> {item.specialInstructions}
                            </p>
                          )}

                          {/* Fiyat ve Miktar Kontrolü */}
                          <div className="flex items-center justify-between">
                            <div className="text-xl font-bold text-blue-600">
                              ₺{(item.price || item.product.price).toFixed(2)}
                            </div>

                            {/* Miktar Kontrolü */}
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-10 h-10 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center transition-all duration-200"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              
                              <span className="text-lg font-bold min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-10 h-10 rounded-xl bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all duration-200"
                              >
                                <Plus className="h-4 w-4" />
                              </button>

                              <button
                                onClick={() => removeFromCart(item.productId)}
                                className="ml-2 w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sağ Bölüm - AI Öneriler ve Sipariş Özeti (38% - 3 sütun) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* AI Akıllı Öneriler */}
              {Object.keys(restaurants).length > 0 && (
                <SmartCartRecommendations 
                  restaurantId={Object.keys(restaurants)[0]}
                />
              )}

              {/* Sipariş Özeti */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Sipariş Özeti
                </h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam</span>
                    <span>₺{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Teslimat Ücreti</span>
                    <span>₺{deliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Toplam</span>
                      <span>₺{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Gelişmiş Sipariş Tamamlama */}
                <AdvancedOrderCompletion 
                  cartItems={cartItems}
                  total={total}
                  onClearCart={clearCart}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 