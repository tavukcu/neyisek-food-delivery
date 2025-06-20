'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { OrderService } from '@/services/orderService';
import { RestaurantService } from '@/services/restaurantService';
import { 
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck,
  ChefHat,
  PlayCircle,
  Eye,
  ArrowRight,
  Calendar,
  Store,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import type { Order, OrderStatus, RestaurantInfo } from '@/types';

// Siparişlerim sayfası
export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<{[key: string]: RestaurantInfo}>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Sipariş durumu bilgisi
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

  // Siparişleri yükle
  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userOrders = await OrderService.getUserOrders(user.uid);
      setOrders(userOrders);

      // Restoran bilgilerini yükle
      const restaurantIds = Array.from(new Set(userOrders.map(order => order.restaurantId)));
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
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
      toast.error('Siparişler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  // Filtrelenmiş siparişler
  const filteredOrders = orders.filter(order => {
    // Metin filtresi
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = order.id.toLowerCase().includes(searchLower);
      const matchesRestaurant = restaurants[order.restaurantId]?.name?.toLowerCase().includes(searchLower);
      const matchesItems = order.items.some(item => 
        item.product.name.toLowerCase().includes(searchLower)
      );
      
      if (!matchesId && !matchesRestaurant && !matchesItems) {
        return false;
      }
    }

    // Durum filtresi
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    // Tarih filtresi
    if (dateFilter !== 'all') {
      const orderDate = order.createdAt;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          if (orderDate < today) return false;
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < monthAgo) return false;
          break;
      }
    }

    return true;
  });

  // Loading durumu
  if (authLoading || loading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Siparişleriniz yükleniyor...</p>
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
              Siparişlerinizi görmek için giriş yapmanız gerekiyor.
            </p>
            <div className="space-y-3">
              <Link href="/login" className="btn-primary w-full">
                Giriş Yap
              </Link>
              <Link href="/register" className="btn-outline w-full">
                Kayıt Ol
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />

      {/* Sayfa Başlığı */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="container-responsive">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Siparişlerim
            </h1>
            <p className="text-xl text-green-100">
              Tüm siparişlerinizi buradan takip edebilirsiniz
            </p>
          </div>
        </div>
      </section>

      {/* Filtreler */}
      <section className="py-6 bg-white border-b">
        <div className="container-responsive">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Arama */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Sipariş ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Durum Filtresi */}
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Bekleyen</option>
                <option value="confirmed">Onaylandı</option>
                <option value="preparing">Hazırlanıyor</option>
                <option value="ready">Hazır</option>
                <option value="delivering">Yolda</option>
                <option value="delivered">Teslim Edildi</option>
                <option value="cancelled">İptal Edildi</option>
              </select>
            </div>

            {/* Tarih Filtresi */}
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
              >
                <option value="all">Tüm Zamanlar</option>
                <option value="today">Bugün</option>
                <option value="week">Son 7 Gün</option>
                <option value="month">Son 30 Gün</option>
              </select>
            </div>

            {/* Yenile Butonu */}
            <button
              onClick={loadOrders}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </div>
        </div>
      </section>

      {/* Siparişler */}
      <section className="py-8">
        <div className="container-responsive">
          {filteredOrders.length === 0 ? (
            // Boş Durum
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                  ? 'Sonuç Bulunamadı' 
                  : 'Henüz Sipariş Yok'
                }
              </h2>
              <p className="text-gray-600 mb-8">
                {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Arama kriterlerinize uygun sipariş bulunamadı.'
                  : 'İlk siparişinizi vermek için restoranlarımızı keşfedin.'
                }
              </p>
              <div className="space-y-3">
                {(searchTerm || statusFilter !== 'all' || dateFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateFilter('all');
                    }}
                    className="btn-outline mx-auto"
                  >
                    Filtreleri Temizle
                  </button>
                )}
                <Link href="/" className="btn-primary mx-auto">
                  Restoran Keşfet
                </Link>
              </div>
            </div>
          ) : (
            // Sipariş Listesi
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {filteredOrders.length} Sipariş Bulundu
                </h2>
              </div>

              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.status);
                  const restaurant = restaurants[order.restaurantId];

                  return (
                    <div key={order.id} className="card p-6 hover:shadow-md transition-shadow duration-200">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Sol Taraf */}
                        <div className="flex-1">
                          {/* Sipariş Başlığı */}
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Sipariş #{order.id.slice(-8).toUpperCase()}
                            </h3>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs ${statusInfo.color}`}>
                              {statusInfo.icon}
                              <span>{statusInfo.text}</span>
                            </div>
                          </div>

                          {/* Restoran ve Tarih */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 text-sm text-gray-600">
                            {restaurant && (
                              <div className="flex items-center gap-1">
                                <Store className="h-4 w-4" />
                                <span>{restaurant.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {order.createdAt.toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>

                          {/* Ürünler Özeti */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {order.items.slice(0, 3).map((item, index) => (
                              <span key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                                {item.quantity}x {item.product.name}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className="text-sm text-gray-500">
                                +{order.items.length - 3} ürün daha
                              </span>
                            )}
                          </div>

                          {/* Fiyat */}
                          <div className="text-lg font-bold text-primary-600">
                            ₺{order.total.toFixed(2)}
                          </div>
                        </div>

                        {/* Sağ Taraf - Aksiyon Butonları */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            href={`/orders/${order.id}`}
                            className="btn-outline text-sm flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Detayları Gör
                          </Link>
                          
                          {restaurant && (
                            <Link
                              href={`/restaurant/${restaurant.id}`}
                              className="btn-primary text-sm flex items-center gap-2"
                            >
                              Tekrar Sipariş Ver
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 