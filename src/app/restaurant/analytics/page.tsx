'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Star,
  Eye,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';

// Gerçek analitik verileri - Firebase'den yüklenecek
const useAnalyticsData = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalRevenue: 0,
      revenueChange: 0,
      totalOrders: 0,
      ordersChange: 0,
      totalCustomers: 0,
      customersChange: 0,
      avgOrderValue: 0,
      avgOrderChange: 0
    },
    recentOrders: [],
    topProducts: [],
    hourlyStats: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      // Burada gerçek Firebase verilerini yükleyebilirsiniz
      // Şimdilik boş veriler döndürüyoruz
      setAnalytics({
        overview: {
          totalRevenue: 0,
          revenueChange: 0,
          totalOrders: 0,
          ordersChange: 0,
          totalCustomers: 0,
          customersChange: 0,
          avgOrderValue: 0,
          avgOrderChange: 0
        },
        recentOrders: [],
        topProducts: [],
        hourlyStats: []
      });
    } catch (error) {
      console.error('Analitik veriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return { analytics, loading, refreshData: loadAnalyticsData };
};

const statusLabels = {
  pending: 'Bekliyor',
  confirmed: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  ready: 'Hazır',
  delivering: 'Yolda',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi'
};

const statusColors = {
  pending: 'text-yellow-600 bg-yellow-100',
  confirmed: 'text-blue-600 bg-blue-100',
  preparing: 'text-orange-600 bg-orange-100',
  ready: 'text-purple-600 bg-purple-100',
  delivering: 'text-indigo-600 bg-indigo-100',
  delivered: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100'
};

export default function RestaurantAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { analytics, loading: analyticsLoading } = useAnalyticsData();
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'restaurant')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || analyticsLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Analitik veriler yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || user.role !== 'restaurant') {
    return null;
  }

  return (
    <main>
      <Header />
      
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Başlık */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link 
                  href="/restaurant" 
                  className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Analitik & Raporlar
                  </h1>
                  <p className="text-gray-600">
                    Restoran performansınızı takip edin
                  </p>
                </div>
              </div>
              
              {/* Zaman Periyodu Seçimi */}
              <div className="flex gap-2">
                {[
                  { value: 'today', label: 'Bugün' },
                  { value: 'week', label: 'Bu Hafta' },
                  { value: 'month', label: 'Bu Ay' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      selectedPeriod === period.value
                        ? 'bg-primary-100 text-primary-700 border border-primary-300'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Genel Bakış Kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Toplam Gelir */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₺{analytics.overview.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {analytics.overview.revenueChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.overview.revenueChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  %{Math.abs(analytics.overview.revenueChange)}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  önceki döneme göre
                </span>
              </div>
            </div>

            {/* Toplam Sipariş */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.overview.totalOrders}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {analytics.overview.ordersChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.overview.ordersChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  %{Math.abs(analytics.overview.ordersChange)}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  önceki döneme göre
                </span>
              </div>
            </div>

            {/* Toplam Müşteri */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.overview.totalCustomers}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {analytics.overview.customersChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.overview.customersChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  %{Math.abs(analytics.overview.customersChange)}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  önceki döneme göre
                </span>
              </div>
            </div>

            {/* Ortalama Sipariş Tutarı */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ort. Sipariş Tutarı</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₺{analytics.overview.avgOrderValue}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {analytics.overview.avgOrderChange > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  analytics.overview.avgOrderChange > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  %{Math.abs(analytics.overview.avgOrderChange)}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  önceki döneme göre
                </span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Sol Kolon */}
            <div className="lg:col-span-2 space-y-8">
              {/* Saatlik Satış Grafiği */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Saatlik Satış Performansı
                  </h2>
                  <Activity className="h-5 w-5 text-gray-500" />
                </div>
                
                <div className="space-y-4">
                  {analytics.hourlyStats.map((stat, index) => (
                    <div key={stat.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900 w-12">
                          {stat.hour}
                        </span>
                        <div className="flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(stat.orders / Math.max(...analytics.hourlyStats.map(s => s.orders))) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {stat.orders} sipariş
                        </p>
                        <p className="text-xs text-gray-500">
                          ₺{stat.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* En Çok Satan Ürünler */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    En Çok Satan Ürünler
                  </h2>
                  <Star className="h-5 w-5 text-gray-500" />
                </div>
                
                <div className="space-y-4">
                  {analytics.topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {product.sales} adet satıldı
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₺{product.revenue.toFixed(2)}
                        </p>
                        <div className="flex items-center justify-end">
                          {product.change > 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className={`text-xs ${
                            product.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            %{Math.abs(product.change)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sağ Kolon - Son Siparişler */}
            <div className="space-y-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Son Siparişler
                  </h2>
                  <Clock className="h-5 w-5 text-gray-500" />
                </div>
                
                <div className="space-y-4">
                  {analytics.recentOrders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">
                            #{order.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            ₺{order.total}
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[order.status as keyof typeof statusColors]
                        }`}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </span>
                        <Link 
                          href={`/restaurant/orders`}
                          className="text-xs text-primary-600 hover:text-primary-800"
                        >
                          Detay →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <Link 
                    href="/restaurant/orders" 
                    className="block text-center text-sm text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Tüm Siparişleri Görüntüle →
                  </Link>
                </div>
              </div>

              {/* Hızlı İstatistikler */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Hızlı İstatistikler
                </h2>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Bugün Gelen Sipariş</span>
                    <span className="font-semibold text-gray-900">28</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Aktif Menü Sayısı</span>
                    <span className="font-semibold text-gray-900">45</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Ortalama Hazırlık Süresi</span>
                    <span className="font-semibold text-gray-900">18 dk</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Müşteri Memnuniyet Oranı</span>
                    <span className="font-semibold text-gray-900">4.8/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 