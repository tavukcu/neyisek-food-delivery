'use client';

import { useState, useEffect } from 'react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { 
  getDetailedSalesReport, 
  getCustomerBehaviorReport, 
  getProductPerformanceReport, 
  getFinancialReport,
  DetailedSalesReport,
  CustomerBehaviorReport,
  ProductPerformanceReport,
  FinancialReport
} from '@/lib/analytics/reportService';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CubeIcon, 
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import SalesChart from '@/components/charts/SalesChart';
import RevenueChart from '@/components/charts/RevenueChart';
import CustomPieChart from '@/components/charts/PieChart';
import CustomAreaChart from '@/components/charts/AreaChart';
import toast from 'react-hot-toast';
import { 
  FileText,
  Download,
  RefreshCw,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  Clock,
  CreditCard,
  MapPin,
  Star,
  AlertTriangle
} from 'lucide-react';

type ReportType = 'sales' | 'customer' | 'product' | 'financial';

interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export default function DetailedReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
    label: 'Son 30 Gün'
  });
  const [loading, setLoading] = useState(false);
  
  // Rapor verileri
  const [salesReport, setSalesReport] = useState<DetailedSalesReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerBehaviorReport | null>(null);
  const [productReport, setProductReport] = useState<ProductPerformanceReport | null>(null);
  const [financialReport, setFinancialReport] = useState<FinancialReport | null>(null);

  const dateRangeOptions: DateRange[] = [
    {
      startDate: subDays(new Date(), 7),
      endDate: new Date(),
      label: 'Son 7 Gün'
    },
    {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      label: 'Son 30 Gün'
    },
    {
      startDate: startOfMonth(new Date()),
      endDate: endOfMonth(new Date()),
      label: 'Bu Ay'
    },
    {
      startDate: startOfWeek(new Date()),
      endDate: endOfWeek(new Date()),
      label: 'Bu Hafta'
    }
  ];

  const reportTypes = [
    {
      id: 'sales' as ReportType,
      name: 'Detaylı Satış Raporu',
      description: 'Satış performansı, ödeme yöntemleri, saatlik analizler',
      icon: ChartBarIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'customer' as ReportType,
      name: 'Müşteri Davranış Raporu',
      description: 'Müşteri segmentasyonu, yaşam boyu değer, coğrafi dağılım',
      icon: UsersIcon,
      color: 'bg-green-500'
    },
    {
      id: 'product' as ReportType,
      name: 'Ürün Performans Raporu',
      description: 'En iyi ürünler, kategori analizi, stok devir hızı',
      icon: CubeIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'financial' as ReportType,
      name: 'Mali Rapor',
      description: 'Gelir-gider analizi, kar marjı, maliyet dağılımı',
      icon: CurrencyDollarIcon,
      color: 'bg-yellow-500'
    }
  ];

  useEffect(() => {
    loadReportData();
  }, [activeReport, dateRange]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      switch (activeReport) {
        case 'sales':
          const salesData = await getDetailedSalesReport(dateRange.startDate, dateRange.endDate);
          setSalesReport(salesData);
          break;
        case 'customer':
          const customerData = await getCustomerBehaviorReport(dateRange.startDate, dateRange.endDate);
          setCustomerReport(customerData);
          break;
        case 'product':
          const productData = await getProductPerformanceReport(dateRange.startDate, dateRange.endDate);
          setProductReport(productData);
          break;
        case 'financial':
          const financialData = await getFinancialReport(dateRange.startDate, dateRange.endDate);
          setFinancialReport(financialData);
          break;
      }
    } catch (error) {
      console.error('Rapor yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    // PDF/Excel export işlemi burada yapılacak
    console.log('Rapor dışa aktarılıyor...');
  };

  const renderSalesReport = () => {
    if (!salesReport) return null;

    return (
      <div className="space-y-6">
        {/* Satış Özeti */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Satış Özeti
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Toplam Gelir</p>
              <p className="text-2xl font-bold text-green-900">₺{salesReport.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Toplam Sipariş</p>
              <p className="text-2xl font-bold text-blue-900">{salesReport.totalOrders}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Ortalama Sipariş</p>
              <p className="text-2xl font-bold text-purple-900">₺{salesReport.averageOrderValue.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Günlük Karşılaştırma</p>
              <p className="text-2xl font-bold text-yellow-900">%{salesReport.dailyComparison.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Günlük Satış Trendi */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Günlük Satış Trendi
          </h3>
          <SalesChart 
            data={salesReport.dailySales.map((day: any) => ({
              date: day.date,
              revenue: day.revenue,
              orders: day.orders
            }))}
            height={350}
            showComparison={true}
          />
        </div>

        {/* Saatlik Analiz ve Ödeme Yöntemleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saatlik Analiz */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Saatlik Satış Analizi
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {salesReport.hourlyAnalysis.map((hour: any, index: number) => (
                <div key={hour.hour} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{hour.hour}:00 - {hour.hour + 1}:00</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₺{hour.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{hour.orders} sipariş</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ödeme Yöntemleri Grafiği */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-600" />
              Ödeme Yöntemleri Dağılımı
            </h3>
            <CustomPieChart 
              data={salesReport.paymentMethodBreakdown.map(method => ({
                name: method.method,
                value: method.revenue
              }))}
              height={300}
            />
          </div>
        </div>

        {/* Teslimat Analizi */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teslimat Performansı</h3>
          {salesReport.deliveryTimeAnalysis.map((delivery, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Ortalama Teslimat Süresi</p>
                <p className="text-2xl font-bold text-green-900">{delivery.averageTime.toFixed(0)} dk</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Zamanında Teslimat</p>
                <p className="text-2xl font-bold text-blue-900">{delivery.onTimeDeliveries}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Geç Teslimat</p>
                <p className="text-2xl font-bold text-red-900">{delivery.lateDeliveries}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Kategori Bazında Gelir Grafiği */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Kategori Bazında Gelir
          </h3>
          <RevenueChart 
            data={salesReport.revenueByCategory.map(category => ({
              category: category.category,
              revenue: category.revenue,
              percentage: category.percentage
            }))}
            height={350}
            color="#10b981"
          />
        </div>
      </div>
    );
  };

  const renderCustomerReport = () => {
    if (!customerReport) return null;

    return (
      <div className="space-y-6">
        {/* Müşteri Özeti */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-blue-600" />
            Müşteri Özeti
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Toplam Müşteri</p>
              <p className="text-2xl font-bold text-blue-900">{customerReport.totalCustomers}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Yeni Müşteriler</p>
              <p className="text-2xl font-bold text-green-900">{customerReport.newCustomers}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Geri Dönen Müşteriler</p>
              <p className="text-2xl font-bold text-purple-900">{customerReport.returningCustomers}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Tutma Oranı</p>
              <p className="text-2xl font-bold text-yellow-900">%{customerReport.customerRetentionRate.toFixed(1)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Yaşam Boyu Değer</p>
              <p className="text-2xl font-bold text-indigo-900">₺{customerReport.customerLifetimeValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Müşteri Segmentleri ve Coğrafi Dağılım */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Müşteri Segmentleri Grafiği */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-600" />
              Müşteri Segmentleri
            </h3>
            <CustomPieChart 
              data={customerReport.topCustomerSegments.map((segment: any) => ({
                name: segment.segment,
                value: segment.revenue
              }))}
              height={300}
            />
          </div>

          {/* Coğrafi Dağılım Grafiği */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Coğrafi Dağılım
            </h3>
            <CustomPieChart 
              data={customerReport.geographicDistribution.map((area: any) => ({
                name: area.area,
                value: area.revenue
              }))}
              height={300}
              colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
            />
          </div>
        </div>

        {/* Sipariş Sıklığı */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sipariş Sıklığı Dağılımı</h3>
          <div className="space-y-3">
            {customerReport.orderFrequencyDistribution.map((freq: any) => (
              <div key={freq.frequency} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{freq.frequency}</span>
                <div className="text-right">
                  <p className="font-semibold">{freq.customerCount} müşteri</p>
                  <p className="text-sm text-gray-500">%{freq.percentage.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProductReport = () => {
    if (!productReport) return null;

    return (
      <div className="space-y-6">
        {/* Ürün Özeti */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Ürün Özeti
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Toplam Ürün</p>
              <p className="text-2xl font-bold text-blue-900">{productReport.totalProducts}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Aktif Ürün</p>
              <p className="text-2xl font-bold text-green-900">{productReport.activeProducts}</p>
            </div>
          </div>
        </div>

        {/* Kategori Analizi ve En İyi Ürünler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kategori Analizi Grafiği */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Kategori Performansı
            </h3>
            <CustomPieChart 
              data={productReport.categoryAnalysis.map((category: any) => ({
                name: category.category,
                value: category.revenue
              }))}
              height={300}
            />
          </div>

          {/* En İyi Performans Gösteren Ürünler */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-600" />
              En İyi Performans Gösteren Ürünler
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {productReport.topPerformingProducts.map((item: any, index: number) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{item.product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₺{item.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{item.quantity} adet (%{item.profitMargin.toFixed(1)} kar)</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Düşük Performanslı Ürünler */}
        {productReport.underperformingProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Düşük Performanslı Ürünler
            </h3>
            <div className="space-y-3">
              {productReport.underperformingProducts.map((item: any, index: number) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                    <span className="font-medium">{item.product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">₺{item.revenue.toLocaleString()}</p>
                    <p className="text-sm text-red-500">{item.daysWithoutSale} gün satış yok</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFinancialReport = () => {
    if (!financialReport) return null;

    return (
      <div className="space-y-6">
        {/* Mali Özet */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Mali Özet</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Toplam Gelir</p>
              <p className="text-2xl font-bold text-blue-900">₺{financialReport.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Toplam Maliyet</p>
              <p className="text-2xl font-bold text-red-900">₺{financialReport.totalCosts.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Brüt Kar</p>
              <p className="text-2xl font-bold text-yellow-900">₺{financialReport.grossProfit.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Net Kar</p>
              <p className="text-2xl font-bold text-green-900">₺{financialReport.netProfit.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Kar Marjı</p>
              <p className="text-2xl font-bold text-purple-900">%{financialReport.profitMargin.toFixed(1)}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 font-medium">Gelir Büyümesi</p>
              <p className="text-2xl font-bold text-indigo-900">%{financialReport.revenueGrowth.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Maliyet Dağılımı */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Maliyet Dağılımı</h3>
          <div className="space-y-3">
            {financialReport.costBreakdown.map((cost) => (
              <div key={cost.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{cost.category}</span>
                <div className="text-right">
                  <p className="font-semibold">₺{cost.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">%{cost.percentage.toFixed(1)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ödeme Yöntemi Maliyetleri */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemi Maliyetleri</h3>
          <div className="space-y-3">
            {financialReport.paymentMethodCosts.map((method) => (
              <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{method.method}</span>
                <div className="text-right">
                  <p className="font-semibold">₺{method.transactionFees.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">%{method.percentage} komisyon</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sales':
        return renderSalesReport();
      case 'customer':
        return renderCustomerReport();
      case 'product':
        return renderProductReport();
      case 'financial':
        return renderFinancialReport();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📊 Detaylı Raporlar</h1>
              <p className="mt-2 text-gray-600">Kapsamlı analiz ve detaylı raporlar</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={exportReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Dışa Aktar
              </button>
              <button
                onClick={loadReportData}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Yenile
              </button>
            </div>
          </div>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Tarih Aralığı:</span>
            </div>
            {dateRangeOptions.map((option) => (
              <button
                key={option.label}
                onClick={() => setDateRange(option)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  dateRange.label === option.label
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
            <div className="text-sm text-gray-500">
              {format(dateRange.startDate, 'dd/MM/yyyy')} - {format(dateRange.endDate, 'dd/MM/yyyy')}
            </div>
          </div>
        </div>

        {/* Rapor Türleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`p-6 rounded-lg border-2 transition-all ${
                  activeReport === report.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${report.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{report.name}</h3>
                </div>
                <p className="text-sm text-gray-600 text-left">{report.description}</p>
              </button>
            );
          })}
        </div>

        {/* Rapor İçeriği */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12">
            <div className="flex items-center justify-center">
              <ArrowPathIcon className="h-8 w-8 text-green-600 animate-spin mr-3" />
              <span className="text-lg text-gray-600">Rapor yükleniyor...</span>
            </div>
          </div>
        ) : (
          renderReportContent()
        )}
      </div>
    </div>
  );
} 