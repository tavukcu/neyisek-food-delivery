'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { OrderService } from '@/services/orderService';
import { RestaurantService } from '@/services/restaurantService';
import { 
  ArrowLeft,
  Package,
  Clock,
  MapPin,
  Store,
  CheckCircle,
  AlertCircle,
  Truck,
  CreditCard,
  Banknote,
  Phone,
  Mail,
  Star,
  MessageSquare,
  Calendar,
  ChefHat,
  PlayCircle,
  PauseCircle,
  Timer
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, PaymentMethod, RestaurantInfo } from '@/types';

// Sipariş detay sayfası
export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.id as string;

  // Sipariş detaylarını yükle
  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId) return;

      try {
        setLoading(true);
        const orderData = await OrderService.getOrder(orderId);
        
        if (!orderData) {
          setError('Sipariş bulunamadı');
          return;
        }

        // Kullanıcı yetkisi kontrolü - sadece sipariş sahibi görebilir
        if (user && orderData.userId !== user.uid) {
          setError('Bu siparişi görüntüleme yetkiniz bulunmuyor');
          return;
        }

        setOrder(orderData);

        // Restoran bilgilerini yükle
        if (orderData.restaurantId) {
          const restaurantData = await RestaurantService.getRestaurant(orderData.restaurantId);
          setRestaurant(restaurantData);
        }

      } catch (error) {
        console.error('Sipariş detayları yüklenirken hata:', error);
        setError('Sipariş detayları yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadOrderDetails();
    }
  }, [orderId, user]);

  // Sipariş durumu stil ve metin
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Bekleyen',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="h-4 w-4" />
        };
      case 'confirmed':
        return {
          text: 'Onaylandı',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'preparing':
        return {
          text: 'Hazırlanıyor',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: <ChefHat className="h-4 w-4" />
        };
      case 'ready':
        return {
          text: 'Hazır',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <PlayCircle className="h-4 w-4" />
        };
      case 'delivering':
        return {
          text: 'Yolda',
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <Truck className="h-4 w-4" />
        };
      case 'delivered':
        return {
          text: 'Teslim Edildi',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="h-4 w-4" />
        };
      case 'cancelled':
        return {
          text: 'İptal Edildi',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <AlertCircle className="h-4 w-4" />
        };
      default:
        return {
          text: status,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Package className="h-4 w-4" />
        };
    }
  };

  // Ödeme yöntemi bilgisi
  const getPaymentMethodInfo = (method: PaymentMethod) => {
    switch (method) {
      case 'cash_on_delivery':
        return {
          text: 'Kapıda Nakit Ödeme',
          icon: <Banknote className="h-5 w-5" />
        };
      case 'card_on_delivery':
        return {
          text: 'Kapıda Kart ile Ödeme',
          icon: <CreditCard className="h-5 w-5" />
        };
      default:
        return {
          text: method,
          icon: <CreditCard className="h-5 w-5" />
        };
    }
  };

  // Tahmini teslimat süresi hesaplama
  const getDeliveryTimeInfo = () => {
    if (!order) return null;

    const now = new Date();
    const estimatedTime = new Date(order.estimatedDeliveryTime);
    const diffMs = estimatedTime.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (order.status === 'delivered' && order.actualDeliveryTime) {
      return {
        text: 'Teslim Edildi',
        time: order.actualDeliveryTime.toLocaleString('tr-TR'),
        isCompleted: true
      };
    }

    if (diffMinutes <= 0) {
      return {
        text: 'Teslimat zamanı geldi',
        time: estimatedTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        isOverdue: true
      };
    }

    return {
      text: `Tahmini ${diffMinutes} dakika`,
      time: estimatedTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isActive: true
    };
  };

  // Loading durumu
  if (authLoading || loading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Sipariş detayları yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Giriş yapmamış kullanıcı
  if (!user) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Giriş Yapın
            </h2>
            <p className="text-gray-600 mb-6">
              Sipariş detaylarını görmek için giriş yapmanız gerekiyor.
            </p>
            <Link href="/login" className="btn-primary">
              Giriş Yap
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Hata durumu
  if (error || !order) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Sipariş Bulunamadı'}
            </h2>
            <p className="text-gray-600 mb-6">
              Aradığınız sipariş mevcut değil veya erişim yetkiniz bulunmuyor.
            </p>
            <div className="space-y-3">
              <Link href="/account/orders" className="btn-primary w-full">
                Siparişlerime Dön
              </Link>
              <Link href="/" className="btn-outline w-full">
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const paymentInfo = getPaymentMethodInfo(order.paymentMethod);
  const deliveryInfo = getDeliveryTimeInfo();

  return (
    <main>
      <Header />

      {/* Sayfa Başlığı */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-8">
        <div className="container-responsive">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Sipariş Detayları
              </h1>
              <p className="text-green-100">
                #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* İçerik */}
      <section className="py-8">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sol Taraf - Sipariş Detayları */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sipariş Durumu */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Sipariş Durumu
                  </h2>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${statusInfo.color}`}>
                    {statusInfo.icon}
                    <span className="font-medium text-sm">{statusInfo.text}</span>
                  </div>
                </div>

                {/* Teslimat Bilgisi */}
                {deliveryInfo && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        deliveryInfo.isCompleted ? 'bg-green-100' : 
                        deliveryInfo.isOverdue ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Timer className={`h-4 w-4 ${
                          deliveryInfo.isCompleted ? 'text-green-600' : 
                          deliveryInfo.isOverdue ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{deliveryInfo.text}</p>
                        <p className="text-sm text-gray-600">{deliveryInfo.time}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sipariş Tarihi */}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Sipariş Tarihi</p>
                    <p className="text-sm">
                      {order.createdAt.toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Restoran Bilgileri */}
              {restaurant && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Restoran Bilgileri
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-gray-600">{restaurant.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{restaurant.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{restaurant.email}</span>
                      </div>
                      {restaurant.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span>{restaurant.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sipariş Ürünleri */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sipariş Detayları ({order.items.length} ürün)
                </h2>
                
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      {/* Ürün Resmi */}
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img 
                            src={item.product.imageUrl} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          '🍽️'
                        )}
                      </div>

                      {/* Ürün Bilgileri */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        
                        {item.variant && (
                          <p className="text-sm text-gray-600">Seçenek: {item.variant.name}</p>
                        )}
                        
                        {item.specialInstructions && (
                          <p className="text-sm text-gray-600">
                            <strong>Özel Not:</strong> {item.specialInstructions}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>
                            {item.quantity} x ₺{(item.price || item.product.price).toFixed(2)}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₺{(item.quantity * (item.price || item.product.price)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Özel Talimatlar */}
              {order.specialInstructions && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Özel Talimatlar
                  </h2>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Sağ Taraf - Özet ve Adres */}
            <div className="space-y-6">
              {/* Sipariş Özeti */}
              <div className="card p-6 sticky top-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Sipariş Özeti
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span>₺{order.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Teslimat Ücreti:</span>
                    <span>{order.deliveryFee === 0 ? 'Ücretsiz' : `₺${order.deliveryFee.toFixed(2)}`}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Toplam:</span>
                      <span className="text-primary-600">₺{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Ödeme Yöntemi */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {paymentInfo.icon}
                    <span className="font-medium text-gray-900">Ödeme Yöntemi</span>
                  </div>
                  <p className="text-sm text-gray-600">{paymentInfo.text}</p>
                </div>

                {/* Teslimat Adresi */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Teslimat Adresi</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {order.deliveryAddress.street}
                    <br />
                    {order.deliveryAddress.district}, {order.deliveryAddress.city}
                  </p>
                </div>

                {/* Aksiyon Butonları */}
                <div className="mt-6 space-y-3">
                  <Link 
                    href="/account/orders" 
                    className="btn-outline w-full"
                  >
                    Tüm Siparişlerim
                  </Link>
                  
                  {order.status === 'delivered' && (
                    <button className="btn-primary w-full">
                      <Star className="h-4 w-4" />
                      Değerlendir
                    </button>
                  )}
                  
                  {restaurant && (
                    <Link 
                      href={`/restaurant/${restaurant.id}`}
                      className="btn-outline w-full"
                    >
                      Tekrar Sipariş Ver
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 