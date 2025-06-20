'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  getSalesAnalytics, 
  getCustomerAnalytics, 
  getDashboardStats,
  getProductAnalytics,
  SalesAnalytics,
  CustomerAnalytics,
  DashboardStats,
  ProductAnalytics
} from '@/lib/analytics/analyticsService';
import SalesChart from '@/components/charts/SalesChart';
import RevenueChart from '@/components/charts/RevenueChart';
import CustomPieChart from '@/components/charts/PieChart';
import CustomAreaChart from '@/components/charts/AreaChart';
import StatsCard from '@/components/analytics/StatsCard';
import toast from 'react-hot-toast';
import { 
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Star,
  CreditCard,
  Banknote,
  Globe,
  PieChart,
  AreaChart,
  LineChart
} from 'lucide-react';
import { PaymentMethod, OrderStatus } from '@/types';
import { subDays, format, startOfMonth } from 'date-fns';
import AdvancedFilters, { FilterOptions } from '@/components/analytics/AdvancedFilters';
import MobileAnalyticsDashboard from '@/components/analytics/MobileAnalyticsDashboard';

// Analitik ana sayfası komponenti
export default function AnalyticsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null);
  const [customerData, setCustomerData] = useState<CustomerAnalytics | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [productData, setProductData] = useState<ProductAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date()
  });
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      preset: 'last30days'
    },
    paymentMethods: [],
    orderStatuses: [],
    customerSegments: [],
    categories: [],
    priceRange: {
      min: 0,
      max: 1000
    },
    deliveryAreas: [],
    customFilters: {
      customerType: 'all'
    }
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobil cihaz kontrolü
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Analitik verilerini yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadAnalyticsData();
    }
  }, [user, dateRange]);

  // Analitik verilerini yükle
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    try {
      const [sales, customers, dashboard, product] = await Promise.all([
        getSalesAnalytics(dateRange.startDate, dateRange.endDate),
        getCustomerAnalytics(),
        getDashboardStats(),
        getProductAnalytics()
      ]);

      setSalesData(sales);
      setCustomerData(customers);
      setDashboardData(dashboard);
      setProductData(product);
    } catch (error) {
      console.error('Analitik veriler yüklenirken hata:', error);
      toast.error('Analitik veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Ödeme yöntemi metni
  const getPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH: return 'Kapıda Nakit';
      case PaymentMethod.CREDIT_CARD: return 'Kapıda Kart';
      case PaymentMethod.ONLINE: return 'Online Ödeme';
      default: return method;
    }
  };

  // Durum metni
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Bekliyor';
      case OrderStatus.CONFIRMED: return 'Onaylandı';
      case OrderStatus.PREPARING: return 'Hazırlanıyor';
      case OrderStatus.READY: return 'Hazır';
      case OrderStatus.DELIVERING: return 'Yolda';
      case OrderStatus.DELIVERED: return 'Teslim Edildi';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      default: return status;
    }
  };

  // Filtreleri uygula
  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setDateRange({
      startDate: newFilters.dateRange.startDate,
      endDate: newFilters.dateRange.endDate
    });
    // Veriyi yeniden yükle
    loadAnalyticsData();
  };

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      dateRange: {
        startDate: subDays(new Date(), 30),
        endDate: new Date(),
        preset: 'last30days'
      },
      paymentMethods: [],
      orderStatuses: [],
      customerSegments: [],
      categories: [],
      priceRange: {
        min: 0,
        max: 1000
      },
      deliveryAreas: [],
      customFilters: {
        customerType: 'all'
      }
    };
    setFilters(defaultFilters);
    setDateRange({
      startDate: defaultFilters.dateRange.startDate,
      endDate: defaultFilters.dateRange.endDate
    });
    loadAnalyticsData();
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Analitik veriler yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Yetkisiz erişim
  if (!user || !user.isAdmin) {
    return null;
  }

  // Mobil görünüm
  if (isMobile) {
    return (
      <main>
        <Header />
        <MobileAnalyticsDashboard
          dashboardData={dashboardData}
          isLoading={isLoading}
          onRefresh={() => loadAnalyticsData()}
        />
      </main>
    );
  }

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Sayfa İçeriği */}
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Başlık ve Kontroller */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <BarChart3 className="h-8 w-8 text-primary-600" />
                Analitik ve Raporlar
              </h1>
              <p className="text-gray-600">
                Satış performansı, müşteri davranışları ve iş analizleri
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
              <div className="flex gap-2">
                <button
                  onClick={() => setDateRange({ startDate: subDays(new Date(), 7), endDate: new Date() })}
                  className="btn-outline text-sm"
                >
                  Son 7 Gün
                </button>
                <button
                  onClick={() => setDateRange({ startDate: subDays(new Date(), 30), endDate: new Date() })}
                  className="btn-outline text-sm"
                >
                  Son 30 Gün
                </button>
                <button
                  onClick={() => setDateRange({ startDate: startOfMonth(new Date()), endDate: new Date() })}
                  className="btn-outline text-sm"
                >
                  Bu Ay
                </button>
              </div>
              
              <button
                onClick={() => loadAnalyticsData()}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>

          {/* Gelişmiş Filtreler */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={applyFilters}
            onReset={resetFilters}
            isOpen={isFiltersOpen}
            onToggle={() => setIsFiltersOpen(!isFiltersOpen)}
            availableCategories={['Ana Yemekler', 'Tatlılar', 'İçecekler', 'Atıştırmalıklar']}
            availableDeliveryAreas={['Merkez', 'Kuzey', 'Güney', 'Doğu', 'Batı']}
          />

          {/* Dashboard İstatistikleri */}
          {dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatsCard
                title="Bugünkü Gelir"
                value={`₺${dashboardData.todayRevenue.toFixed(0)}`}
                icon={DollarSign}
                change={dashboardData.revenueGrowth}
                changeLabel="önceki aya göre"
                color="success"
              />
              <StatsCard
                title="Bugünkü Siparişler"
                value={dashboardData.todayOrders}
                icon={ShoppingCart}
                change={dashboardData.orderGrowth}
                changeLabel="önceki aya göre"
                color="info"
              />
              <StatsCard
                title="Bekleyen Siparişler"
                value={dashboardData.pendingOrders}
                icon={Package}
                color="warning"
              />
              <StatsCard
                title="Toplam Müşteri"
                value={dashboardData.totalCustomers}
                icon={Users}
                change={dashboardData.customerGrowth}
                changeLabel="bu ay yeni"
                color="primary"
              />
            </div>
          )}

          {/* Satış Analizleri */}
          {salesData && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Satış Grafiği */}
              <div className="lg:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Satış Trendi
                  </h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Gelir</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Sipariş</span>
                    </div>
                  </div>
                </div>
                <SalesChart 
                  data={salesData.dailySales} 
                  height={400}
                  showComparison={true}
                />
              </div>

              {/* Satış Özeti */}
              <div className="space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Satış Özeti</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toplam Gelir</span>
                      <span className="font-semibold text-primary-600">
                        ₺{salesData.totalRevenue.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Toplam Sipariş</span>
                      <span className="font-semibold text-gray-900">
                        {salesData.totalOrders}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ortalama Sipariş</span>
                      <span className="font-semibold text-secondary-600">
                        ₺{salesData.averageOrderValue.toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tamamlanma Oranı</span>
                      <span className="font-semibold text-green-600">
                        %{salesData.completionRate.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ödeme Yöntemleri */}
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Ödeme Yöntemleri</h3>
                  <div className="space-y-3">
                    {salesData.paymentMethodStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {stat.method === PaymentMethod.CASH && <Banknote className="h-4 w-4 text-green-500" />}
                          {stat.method === PaymentMethod.CREDIT_CARD && <CreditCard className="h-4 w-4 text-blue-500" />}
                          {stat.method === PaymentMethod.ONLINE && <Globe className="h-4 w-4 text-purple-500" />}
                          <span className="text-sm text-gray-600">
                            {getPaymentMethodText(stat.method)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {stat.count} sipariş
                          </div>
                          <div className="text-xs text-gray-500">
                            ₺{stat.revenue.toFixed(0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Müşteri Analizleri */}
          {customerData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Müşteri Büyümesi */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Müşteri Büyümesi
                </h2>
                <CustomAreaChart 
                  data={customerData.customerGrowth.map(item => ({
                    date: item.month,
                    newCustomers: item.newCustomers,
                    totalCustomers: item.totalCustomers
                  }))}
                  height={300}
                />
              </div>

              {/* Müşteri Segmentleri */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-purple-600" />
                  Müşteri Segmentleri
                </h2>
                <CustomPieChart 
                  data={customerData.customerSegments.map(segment => ({
                    name: segment.segment,
                    value: segment.revenue
                  }))}
                  height={300}
                />
              </div>
            </div>
          )}

          {/* En İyi Müşteriler */}
          {customerData && customerData.topCustomers.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-600" />
                En Değerli Müşteriler
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">Müşteri</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900">E-posta</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Toplam Harcama</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Sipariş Sayısı</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900">Ortalama Sipariş</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerData.topCustomers.slice(0, 10).map((customer, index) => (
                      <tr key={customer.customer.uid} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-600 font-semibold text-sm">
                                {customer.customer.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {customer.customer.displayName}
                              </div>
                              {customer.totalSpent >= 500 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  <Star className="h-3 w-3" />
                                  VIP
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {customer.customer.email}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary-600">
                          ₺{customer.totalSpent.toFixed(0)}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900">
                          {customer.orderCount}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          ₺{(customer.totalSpent / customer.orderCount).toFixed(0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sipariş Durumu Dağılımı */}
          {salesData && salesData.statusStats.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                Sipariş Durumu Dağılımı
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {salesData.statusStats.map((stat, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.count}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getStatusText(stat.status)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      %{salesData.totalOrders > 0 ? ((stat.count / salesData.totalOrders) * 100).toFixed(1) : 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ürün Performans Analizleri */}
          {productData && (
            <>
              {/* En Çok Satan Ürünler */}
              {productData.topSellingProducts.length > 0 && (
                <div className="card p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    En Çok Satan Ürünler
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">Ürün</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Satış Adedi</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Toplam Gelir</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Ortalama Fiyat</th>
                          <th className="text-center py-3 px-4 font-semibold text-gray-900">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productData.topSellingProducts.map((item, index) => (
                          <tr key={item.product.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                  <span className="text-orange-600 font-bold text-sm">
                                    #{index + 1}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {item.product.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    ₺{item.product.price.toFixed(0)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-900">
                              {item.soldCount}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-primary-600">
                              ₺{item.revenue.toFixed(0)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-600">
                              ₺{(item.revenue / item.soldCount).toFixed(0)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.product.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.product.isActive ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Kategori Performansı */}
              {productData.categoryPerformance.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  {/* Kategori Gelir Grafiği */}
                  <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Kategori Performansı (Gelir)
                    </h2>
                    <CustomPieChart 
                      data={productData.categoryPerformance.map(cat => ({
                        name: cat.category,
                        value: cat.revenue
                      }))}
                      height={300}
                    />
                  </div>

                  {/* Kategori Satış Adedi */}
                  <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      Kategori Performansı (Adet)
                    </h2>
                    <CustomPieChart 
                      data={productData.categoryPerformance.map(cat => ({
                        name: cat.category,
                        value: cat.soldCount
                      }))}
                      height={300}
                    />
                  </div>
                </div>
              )}

              {/* Ürün Trendleri */}
              {productData.productTrends.length > 0 && (
                <div className="card p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Popüler Ürün Trendleri (Son 30 Gün)
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {productData.productTrends.map((trend, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3 text-center">
                          {trend.product}
                        </h3>
                        <SalesChart 
                          data={trend.sales.map(sale => ({
                            date: sale.date,
                            revenue: sale.count,
                            orders: sale.count
                          }))}
                          height={200}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ürün İstatistikleri Özeti */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card p-6 text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {productData.totalProducts}
                  </div>
                  <div className="text-gray-600">Toplam Ürün</div>
                </div>
                <div className="card p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {productData.activeProducts}
                  </div>
                  <div className="text-gray-600">Aktif Ürün</div>
                </div>
                <div className="card p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {productData.categoryPerformance.length}
                  </div>
                  <div className="text-gray-600">Aktif Kategori</div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
} 