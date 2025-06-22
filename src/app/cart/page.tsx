'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import SimpleMapPicker from '@/components/SimpleMapPicker';
import MobileOptimizedMap from '@/components/MobileOptimizedMap';
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
  TrendingUp,
  User,
  DollarSign,
  Calculator
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Address, PaymentMethod, RestaurantInfo, OrderStatus } from '@/types';
import GuestCheckoutForm from '@/components/GuestCheckoutForm';
import { useGuestUser, GuestUser } from '@/hooks/useGuestUser';
import MobileLocationDetector from '@/components/MobileLocationDetector';
import AddressBook from '@/components/AddressBook';

// Type guard functions
const isGuestUser = (user: any): user is GuestUser => {
  return user && user.isGuest === true;
};

const isRegularUser = (user: any): user is typeof user => {
  return user && !user.isGuest;
};

// Sepet sayfası komponenti - Altın Oran Tasarımı
export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { guestUser, hasActiveSession } = useGuestUser();
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
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [currentGuestUser, setCurrentGuestUser] = useState<GuestUser | null>(null);

  // Konum durumları
  const [currentLocation, setCurrentLocation] = useState<Address | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [manualAddress, setManualAddress] = useState<Address | null>(null);
  const [useMapLocation, setUseMapLocation] = useState(false);
  const [mapLocation, setMapLocation] = useState<Address | null>(null);
  const [showMap, setShowMap] = useState(false);

  // Varsayılan adres durumları
  const [useSavedAddress, setUseSavedAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState<Address | null>(null);
  const [showAddressBook, setShowAddressBook] = useState(false);

  // Seçilen adres - öncelik sırası: varsayılan adres > harita > mevcut konum > manuel adres
  const selectedAddress = useSavedAddress ? savedAddress :
                         useMapLocation ? mapLocation : 
                         useCurrentLocation ? currentLocation : 
                         manualAddress;

  // Kullanıcı kontrolü - authenticated user veya guest user
  const canProceedWithOrder = user || currentGuestUser || (hasActiveSession && guestUser);
  const currentUserInfo = user || currentGuestUser || guestUser;

  // Helper functions for user info
  const getUserId = (userInfo: typeof currentUserInfo) => {
    if (!userInfo) return `guest_${Date.now()}`;
    if (isGuestUser(userInfo)) {
      return userInfo.id;
    } else if (isRegularUser(userInfo)) {
      return userInfo.uid;
    }
    return `guest_${Date.now()}`;
  };

  const getUserName = (userInfo: typeof currentUserInfo) => {
    if (!userInfo) return 'Misafir Kullanıcı';
    if (isGuestUser(userInfo)) {
      return userInfo.name;
    } else if (isRegularUser(userInfo)) {
      return userInfo.displayName;
    }
    return 'Misafir Kullanıcı';
  };

  const getUserPhone = (userInfo: typeof currentUserInfo) => {
    if (!userInfo) return '';
    if (isGuestUser(userInfo)) {
      return userInfo.phone;
    } else if (isRegularUser(userInfo)) {
      return userInfo.phoneNumber;
    }
    return '';
  };

  const getUserEmail = (userInfo: typeof currentUserInfo) => {
    return userInfo?.email || '';
  };

  // Debug effect
  useEffect(() => {
    console.log('🔍 Button Debug:', {
      isSubmitting,
      canProceedWithOrder,
      selectedAddress: !!selectedAddress,
      selectedAddressDetails: selectedAddress,
      user: !!user,
      currentGuestUser: !!currentGuestUser,
      guestUser: !!guestUser,
      hasActiveSession: !!hasActiveSession,
      useMapLocation,
      useCurrentLocation,
      mapLocation,
      currentLocation,
      manualAddress,
      showGuestForm,
      buttonShouldBeDisabled: isSubmitting || !canProceedWithOrder || (!selectedAddress && canProceedWithOrder)
    });
  }, [canProceedWithOrder, selectedAddress, isSubmitting, user, currentGuestUser, guestUser, hasActiveSession, showGuestForm]);

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

      console.log('📍 Kullanıcı konumu algılanıyor...');

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('✅ Konum başarıyla alındı:', {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
            resolve(position);
          },
          (error) => {
            console.error('❌ Konum alma hatası:', error);
            let errorMessage = 'Konum alınamadı. ';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Konum erişimi reddedildi. Lütfen tarayıcı ayarlarından konum erişimini açın.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Konum bilgisi mevcut değil. GPS\'inizi kontrol edin.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Konum alma zaman aşımına uğradı. Tekrar deneyin.';
                break;
              default:
                errorMessage += 'Bilinmeyen hata oluştu.';
                break;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // 15 saniye
            maximumAge: 60000 // 1 dakika cache
          }
        );
      });

      const { latitude, longitude } = position.coords;
      const address = await LocationService.reverseGeocode(latitude, longitude);
      
      console.log('🏠 Adres bilgisi alındı:', address);
      
      setCurrentLocation(address);
      setUseCurrentLocation(true);
      setUseMapLocation(false); // Diğer seçenekleri deaktive et
      toast.success('✅ Konumunuz başarıyla algılandı!');
    } catch (error) {
      console.error('🔴 Konum algılama hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Konum algılanamadı. Lütfen manuel olarak adres girin.';
      setLocationError(errorMessage);
      toast.error(errorMessage);
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

  // Varsayılan adres seçme
  const handleSavedAddressSelect = (address: Address) => {
    setSavedAddress(address);
    setUseSavedAddress(true);
    setUseMapLocation(false);
    setUseCurrentLocation(false);
    setShowAddressBook(false);
    toast.success('Kayıtlı adres seçildi');
  };

  // Adres defteri göster/gizle
  const toggleAddressBook = () => {
    setShowAddressBook(!showAddressBook);
  };

  // Sipariş oluşturma - guest user desteği ile
  const handleSubmitOrder = async () => {
    if (!canProceedWithOrder) {
      if (!showGuestForm) {
        setShowGuestForm(true);
        return;
      }
      toast.error('Sipariş vermek için bilgilerinizi girin veya giriş yapın');
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
          userId: getUserId(currentUserInfo),
          name: getUserName(currentUserInfo),
          phone: getUserPhone(currentUserInfo),
          email: getUserEmail(currentUserInfo),
          isGuest: !user // Misafir kullanıcı mı?
        },
        deliveryAddress: selectedAddress,
        paymentMethod,
        notes: specialInstructions.trim() || '',
        totalAmount: total
      };

      console.log('📦 Sipariş verisi:', orderData);
      console.log('📦 API URL:', '/api/orders');
      console.log('📦 Request headers:', {
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      console.log('📦 API Response status:', response.status);
      console.log('📦 API Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('📦 API yanıtı:', result);

      if (!response.ok) {
        console.error('📦 API Response not OK:', {
          status: response.status,
          statusText: response.statusText,
          result
        });
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (result.success) {
        clearCart();
        toast.success('🎉 Siparişiniz başarıyla alındı!');
        console.log('📦 Sipariş başarılı, yönlendiriliyor:', `/orders/${result.orderId}`);
        router.push(`/orders/${result.orderId}`);
      } else {
        console.error('📦 API başarısız yanıt:', result);
        throw new Error(result.error || 'Sipariş oluşturulamadı');
      }
      
    } catch (error) {
      console.error('🔴 Sipariş oluşturma hatası:', error);
      
      // Detaylı hata analizi
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('🌐 Ağ bağlantısı hatası. İnternet bağlantınızı kontrol edin.');
      } else if (error instanceof Error) {
        console.error('🔴 Hata detayları:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        toast.error(`❌ Sipariş hatası: ${error.message}`);
      } else {
        console.error('🔴 Bilinmeyen hata:', error);
        toast.error('❌ Bilinmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestInfoSubmit = (guestUser: GuestUser) => {
    console.log('🎯 Guest info submitted:', guestUser);
    setCurrentGuestUser(guestUser);
    setShowGuestForm(false);
    toast.success('✅ Bilgileriniz kaydedildi! Artık siparişinizi tamamlayabilirsiniz!');
  };

  const handleLoginRedirect = () => {
    router.push('/account');
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

  return (
    <div className="min-h-screen bg-gray-50">
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-8 gap-6 lg:gap-8">
            
            {/* Sol Bölüm - Sepet İçeriği (62% - 5 sütun) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Sayfa Başlığı */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Sepetim ({cartItems.length} ürün)
                  </h1>
                  
                  <div className="flex items-center gap-3">
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
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0">
                            {restaurants[restaurantId].coverImageUrl && (
                              <img 
                                src={restaurants[restaurantId].coverImageUrl} 
                                alt={restaurants[restaurantId].name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            )}
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                            {restaurants[restaurantId].name}
                          </h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span>{restaurants[restaurantId].rating}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                            <Clock className="h-4 w-4" />
                            <span>{restaurants[restaurantId].estimatedDeliveryTime} dk</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ürün Listesi */}
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {items.map((item) => (
                      <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex flex-col sm:flex-row gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                        
                        {/* Ürün Resmi */}
                        <div className="w-full sm:w-20 h-48 sm:h-20 bg-gray-200 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">
                          {item.product.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <h4 className="text-lg font-bold text-gray-900 break-words">
                              {item.product.name}
                            </h4>
                            <div className="text-lg sm:text-xl font-bold text-blue-600 flex-shrink-0">
                              ₺{(item.price * item.quantity).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3 text-sm text-gray-500">
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                              <DollarSign className="h-4 w-4" />
                              <span>₺{item.price}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg">
                              <Clock className="h-4 w-4" />
                              <span>{item.product.preparationTime || 15} dk</span>
                            </div>
                          </div>

                          {item.specialInstructions && (
                            <p className="text-sm text-gray-600 mb-3 bg-white p-2 rounded-lg">
                              <strong>Özel Not:</strong> {item.specialInstructions}
                            </p>
                          )}

                          {/* Miktar Kontrolü */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="font-medium text-lg min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 sticky top-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
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
                  selectedAddress={selectedAddress}
                  onAddressSelect={handleMapLocationSelect}
                  onAddressChange={handleMapAddressChange}
                  currentLocation={currentLocation}
                  onDetectLocation={detectCurrentLocation}
                  isDetectingLocation={isDetectingLocation}
                  locationError={locationError}
                  deliveryMethod="delivery"
                />
              </div>

              {/* Authentication/Guest Section */}
              {!canProceedWithOrder && !showGuestForm && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <User className="h-5 w-5 text-yellow-600 mr-2" />
                    <h4 className="font-medium text-yellow-800">Sipariş vermek için</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowGuestForm(true)}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Misafir olarak devam et
                    </button>
                    <button
                      onClick={handleLoginRedirect}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      Giriş yap / Kayıt ol
                    </button>
                  </div>
                </div>
              )}

              {/* Guest Form */}
              {showGuestForm && (
                <div className="mb-6">
                  <GuestCheckoutForm
                    onGuestInfoSubmit={handleGuestInfoSubmit}
                    onLoginRedirect={handleLoginRedirect}
                    currentUser={user}
                  />
                </div>
              )}

              {/* Current User Info */}
              {canProceedWithOrder && !showGuestForm && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <h4 className="font-medium text-green-800">
                      {user ? 'Giriş yapıldı' : 'Misafir kullanıcı'}
                    </h4>
                  </div>
                  <div className="text-sm text-green-700">
                    <p><strong>Ad:</strong> {getUserName(currentUserInfo)}</p>
                    <p><strong>E-posta:</strong> {getUserEmail(currentUserInfo)}</p>
                    {getUserPhone(currentUserInfo) && (
                      <p><strong>Telefon:</strong> {getUserPhone(currentUserInfo)}</p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {!user && (
                      <button
                        onClick={() => setShowGuestForm(true)}
                        className="text-sm text-green-600 hover:text-green-700 underline"
                      >
                        Bilgileri düzenle
                      </button>
                    )}
                    {user && (
                      <button
                        onClick={() => setShowGuestForm(true)}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
                      >
                        <User className="h-3 w-3" />
                        Misafir olarak öde
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Konum Tespit Bölümü */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Teslimat Adresi</span>
                </div>

                {/* Varsayılan Adres Seçeneği - Sadece giriş yapmış kullanıcılar için */}
                {user && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Store className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">Kayıtlı Adreslerim</span>
                      </div>
                      <button
                        onClick={toggleAddressBook}
                        className="text-sm text-blue-600 hover:text-blue-700 underline"
                      >
                        {showAddressBook ? 'Gizle' : 'Göster'}
                      </button>
                    </div>
                    
                    {showAddressBook && (
                      <div className="mt-3">
                        <AddressBook 
                          user={user as any}
                          onAddressSelect={handleSavedAddressSelect}
                          compact={true}
                          selectMode={true}
                        />
                      </div>
                    )}

                    {useSavedAddress && savedAddress && (
                      <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                        <div className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">Seçilen Kayıtlı Adres:</p>
                            <p className="text-sm text-blue-700">{savedAddress.street}</p>
                            <p className="text-xs text-blue-600">{savedAddress.district}, {savedAddress.city}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobil Konum Tespit Bileşeni */}
                <MobileLocationDetector
                  onLocationDetected={(position, address) => {
                    const locationData: Address = {
                      street: address || 'Tespit edilen konum',
                      district: '',
                      city: '',
                      zipCode: '',
                      country: 'Türkiye',
                      coordinates: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                      }
                    };
                    setCurrentLocation(locationData);
                    setUseCurrentLocation(true);
                    setUseMapLocation(false);
                    console.log('🎯 Konum tespit edildi:', position);
                  }}
                  onError={(error) => {
                    setLocationError(error);
                    console.error('❌ Konum tespit hatası:', error);
                  }}
                  className="mb-4"
                />

                {locationError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-red-700 mb-2">{locationError}</p>
                        <div className="text-xs text-red-600 space-y-1">
                          <div>• HTTPS bağlantısı gereklidir</div>
                          <div>• Konum servislerinin açık olması gerekir</div>
                          <div>• Tarayıcıdan konum izni verilmelidir</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Seçilen Adres Bilgisi */}
                {selectedAddress && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">Seçilen Adres:</p>
                        <p className="text-sm text-green-700">{selectedAddress.street}</p>
                        {selectedAddress.district && (
                          <p className="text-xs text-green-600">{selectedAddress.district}, {selectedAddress.city}</p>
                        )}
                        {selectedAddress.coordinates && (
                          <p className="text-xs text-green-600">
                            📍 {selectedAddress.coordinates.lat.toFixed(6)}, {selectedAddress.coordinates.lng.toFixed(6)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Harita Seçeneği */}
                <button
                  onClick={() => setShowMap(!showMap)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  {showMap ? 'Haritayı Gizle' : 'Haritadan Seç'}
                </button>

                {showMap && (
                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <MobileOptimizedMap
                      onLocationSelect={(address, lat, lng) => handleMapLocationSelect(address, lat, lng)}
                      height="250px"
                      showControls={true}
                      allowFullscreen={true}
                    />
                  </div>
                )}
              </div>

              {/* Submit Order Button */}
              <button
                onClick={handleSubmitOrder}
                disabled={Boolean(isSubmitting || (!canProceedWithOrder && !showGuestForm) || (canProceedWithOrder && !selectedAddress))}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                    Sipariş Gönderiliyor...
                  </>
                ) : !canProceedWithOrder && !showGuestForm ? (
                  'Devam Et'
                ) : showGuestForm ? (
                  'Bilgileri Girin'
                ) : !selectedAddress ? (
                  'Teslimat Adresi Seçin'
                ) : (
                  <>
                    Siparişi Tamamla
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
} 