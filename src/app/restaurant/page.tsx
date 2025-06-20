'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { RestaurantService } from '@/services/restaurantService';
import { OrderService } from '@/services/orderService';
import { ProductService } from '@/services/productService';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Star,
  Package,
  Clock,
  Eye,
  AlertCircle,
  Plus,
  Calendar,
  Bell,
  Truck,
  ChefHat
} from 'lucide-react';
import Link from 'next/link';
import { RestaurantInfo, Order, Product } from '@/types';
import { OrderStatus } from '@/types';
import toast from 'react-hot-toast';

interface DashboardStats {
  todayRevenue: number;
  monthlyRevenue: number;
  currentMonthRevenue: number;
  monthlyGoal: number;
  pendingOrders: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  totalReviews: number;
}

// Restoran ana dashboard sayfası
export default function RestaurantPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'restaurant')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Dashboard verilerini yükle
  useEffect(() => {
    if (user && user.role === 'restaurant' && user.restaurantId) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.restaurantId) return;

    try {
      setLoading(true);
      
      // Paralel veri yüklemeleri
      const [restaurantData, allOrders, products] = await Promise.all([
        RestaurantService.getRestaurant(user.restaurantId),
        OrderService.getRestaurantOrders(user.restaurantId),
        ProductService.getProductsByRestaurant(user.restaurantId)
      ]);

      if (restaurantData) {
        setRestaurant(restaurantData);
      }

      // İstatistikleri hesapla
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Bugünkü siparişler
      const todayOrders = allOrders.filter(order => 
        order.createdAt >= startOfDay && 
        order.status !== OrderStatus.CANCELLED
      );

      // Bu ayki siparişler
      const monthlyOrders = allOrders.filter(order => 
        order.createdAt >= startOfMonth && 
        order.status !== OrderStatus.CANCELLED
      );

      // Bekleyen siparişler
      const pendingOrders = allOrders.filter(order => 
        order.status === OrderStatus.PENDING || 
        order.status === OrderStatus.CONFIRMED
      ).length;

      // İstatistikleri set et
      const calculatedStats: DashboardStats = {
        todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
        monthlyRevenue: monthlyOrders.reduce((sum, order) => sum + order.total, 0),
        currentMonthRevenue: monthlyOrders.reduce((sum, order) => sum + order.total, 0),
        monthlyGoal: 50000, // Varsayılan aylık hedef
        pendingOrders,
        totalOrders: allOrders.length,
        totalProducts: products?.length || 0,
        averageRating: restaurantData?.rating || 4.5,
        totalReviews: restaurantData?.reviewCount || 0
      };

      setStats(calculatedStats);

      // Son 5 siparişi al
      const recent = allOrders
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);
      setRecentOrders(recent);

    } catch (error) {
      console.error('Dashboard verileri yüklenirken hata:', error);
      toast.error('Dashboard verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARING:
        return 'bg-orange-100 text-orange-800';
      case OrderStatus.READY:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERING:
        return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Bekliyor';
      case OrderStatus.CONFIRMED:
        return 'Onaylandı';
      case OrderStatus.PREPARING:
        return 'Hazırlanıyor';
      case OrderStatus.READY:
        return 'Hazır';
      case OrderStatus.DELIVERING:
        return 'Yolda';
      case OrderStatus.DELIVERED:
        return 'Teslim Edildi';
      case OrderStatus.CANCELLED:
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} gün önce`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Yetkisiz Erişim</h2>
            <p className="text-gray-600">Bu sayfaya erişim için restoran hesabı gerekli.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Restoran Bulunamadı</h2>
            <p className="text-gray-600">Restoran bilgileriniz yüklenemiyor.</p>
          </div>
        </div>
      </div>
    );
  }

  const goalPercentage = (stats.currentMonthRevenue / stats.monthlyGoal) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Merhaba, {restaurant.name} 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Restoran yönetim panelinize hoş geldiniz. İşinizi kolayca yönetin.
            </p>
          </div>

          {/* İstatistik Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bugünkü Gelir</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bekleyen Siparişler</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ortalama Puan</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Aylık Hedef Göstergesi */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Aylık Hedef İlerlemesi</h2>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Hedef: {formatCurrency(stats.monthlyGoal)}</span>
              <span className="text-gray-900 font-semibold">Mevcut: {formatCurrency(stats.currentMonthRevenue)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(goalPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-gray-600 mt-2">
              Aylık hedefinize ulaşmak için <span className="font-semibold text-primary-600">
                {formatCurrency(Math.max(0, stats.monthlyGoal - stats.currentMonthRevenue))}
              </span> daha kazanmanız gerekiyor.
            </p>
          </div>

          {/* Hızlı Eylemler */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Sipariş Yönetimi */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Sipariş Yönetimi
              </h2>
              <p className="text-gray-600 mb-6">
                Yeni siparişleri görüntüleyin ve durum güncellemeleri yapın.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/restaurant/orders" 
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Bekleyen Siparişler ({stats.pendingOrders})
                </Link>
                <Link 
                  href="/restaurant/orders" 
                  className="btn-outline w-full flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Tüm Siparişler
                </Link>
              </div>
            </div>

            {/* Menü Yönetimi */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary-600" />
                Menü Yönetimi
              </h2>
              <p className="text-gray-600 mb-6">
                Ürünlerinizi ekleyin, düzenleyin ve fiyatlarını güncelleyin.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/restaurant/menu/add" 
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Ürün Ekle
                </Link>
                <Link 
                  href="/restaurant/menu" 
                  className="btn-outline w-full flex items-center justify-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Menüyü Düzenle
                </Link>
              </div>
            </div>

            {/* Raporlar & Analiz */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Raporlar & Analiz
              </h2>
              <p className="text-gray-600 mb-6">
                Satış verilerinizi analiz edin ve performansınızı takip edin.
              </p>
              <div className="space-y-3">
                <Link 
                  href="/restaurant/analytics" 
                  className="btn-outline w-full flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                >
                  <TrendingUp className="h-4 w-4" />
                  Analitik Rapor
                </Link>
                <Link 
                  href="/restaurant/finances" 
                  className="btn-outline w-full flex items-center justify-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Mali Raporlar
                </Link>
              </div>
            </div>
          </div>

          {/* Son Siparişler ve Bildirimler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Son Siparişler */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                Son Siparişler
              </h2>
              <div className="space-y-4">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">#{order.id.slice(-8)} - {order.user.displayName}</p>
                        <p className="text-sm text-gray-600">
                          {order.items.length} ürün - {order.items.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
                        </p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Henüz sipariş bulunmuyor</p>
                  </div>
                )}
              </div>
              <Link 
                href="/restaurant/orders" 
                className="block text-center mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Tüm Siparişleri Görüntüle →
              </Link>
            </div>

            {/* Önemli Bildirimler */}
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Önemli Bildirimler
              </h2>
              <div className="space-y-4">
                {stats.pendingOrders > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <div className="bg-orange-500 rounded-full p-1">
                      <ShoppingCart className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">Bekleyen siparişleriniz var!</p>
                      <p className="text-sm text-orange-700">{stats.pendingOrders} sipariş onay bekliyor.</p>
                      <Link 
                        href="/restaurant/orders" 
                        className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Siparişleri Görüntüle →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="bg-green-500 rounded-full p-1">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">Ortalama puanınız: {stats.averageRating.toFixed(1)}</p>
                    <p className="text-sm text-green-700">{stats.totalReviews} değerlendirme aldınız.</p>
                  </div>
                </div>

                {stats.totalProducts < 5 && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="bg-blue-500 rounded-full p-1">
                      <Package className="h-3 w-3 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-900">Menünüzü genişletin</p>
                      <p className="text-sm text-blue-700">Daha fazla ürün ekleyerek satışlarınızı artırın.</p>
                      <Link 
                        href="/restaurant/menu/add" 
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Ürün Ekle →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 