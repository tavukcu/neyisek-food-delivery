'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CommissionService } from '@/services/commissionService';
import { OrderService } from '@/services/orderService';
import { ReportService, RestaurantReportData } from '@/services/reportService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  RestaurantFinancials, 
  Transaction, 
  PaymentMethod,
  Order 
} from '@/types';
import { toast } from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Download, FileText } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function RestaurantFinancesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Bu ayın başı
    endDate: new Date() // Bugün
  });
  const [financials, setFinancials] = useState<RestaurantFinancials | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Tarihleri format etme
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  // Verileri yükleme
  const loadFinancialData = async () => {
    if (!user?.restaurantId) return;
    
    setLoading(true);
    try {
      // Mali verileri hesapla
      const financialData = await CommissionService.calculateRestaurantFinancials(
        user.restaurantId,
        dateRange.startDate,
        dateRange.endDate
      );
      setFinancials(financialData);

      // İşlemleri getir
      const transactionData = await CommissionService.getRestaurantTransactions(
        user.restaurantId,
        dateRange.startDate,
        dateRange.endDate
      );
      setTransactions(transactionData);

      // Son siparişleri getir
      const orders = await OrderService.getRestaurantOrders(user.restaurantId);
      setRecentOrders(orders.slice(0, 10)); // Son 10 sipariş

    } catch (error) {
      console.error('Mali veriler yüklenirken hata:', error);
      toast.error('Mali veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user, dateRange]);

  // PDF rapor oluşturma fonksiyonu
  const generateFinancialReport = () => {
    if (!financials || !user?.restaurantId) {
      toast.error('Rapor oluşturmak için veriler eksik');
      return;
    }

    try {
      const reportData: RestaurantReportData = {
        totalRevenue: financials.totalRevenue,
        totalOrders: financials.totalOrders,
        averageOrderValue: financials.averageOrderValue,
        commission: financials.totalCommission,
        netEarnings: financials.netEarning,
        orders: recentOrders.map(order => ({
          id: order.id,
          date: format(order.createdAt, 'dd MMM yyyy HH:mm', { locale: tr }),
          total: formatCurrency(order.total),
          status: order.status,
          paymentMethod: order.paymentMethod
        })),
        dailyStats: financials.dailyBreakdown.map(day => ({
          date: format(day.date, 'dd MMM yyyy', { locale: tr }),
          orders: day.orderCount,
          revenue: day.revenue
        }))
      };

      // Restoran ismini al (user'dan veya başka bir kaynaktan)
      const restaurantName = user.displayName || 'Restoran';

      ReportService.generateRestaurantFinancialReport(
        restaurantName,
        reportData,
        {
          start: dateRange.startDate,
          end: dateRange.endDate
        }
      );
      
      toast.success('Mali rapor PDF olarak indirildi!');
    } catch (error) {
      console.error('Rapor oluşturma hatası:', error);
      toast.error('Rapor oluşturulurken bir hata oluştu');
    }
  };

  // E-posta ile mali rapor gönderme fonksiyonu
  const sendFinancialReportByEmail = async () => {
    if (!financials || !user?.restaurantId || !user?.email) {
      toast.error('Rapor göndermek için veriler eksik');
      return;
    }

    try {
      const restaurantName = user.displayName || 'Restoran';
      
      const emailData = {
        restaurantName,
        ownerEmail: user.email,
        reportPeriod: {
          start: dateRange.startDate,
          end: dateRange.endDate
        },
        totalRevenue: financials.totalRevenue,
        totalOrders: financials.totalOrders,
        commission: financials.totalCommission,
        netEarnings: financials.netEarning
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: 'financial_report',
          data: emailData
        })
      });

      if (response.ok) {
        toast.success('Mali rapor e-posta adresinize gönderildi!');
      } else {
        toast.error('E-posta gönderilirken bir hata oluştu');
      }
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      toast.error('E-posta gönderilirken bir hata oluştu');
    }
  };

  // Günlük gelir grafiği verisi
  const dailyRevenueData = {
    labels: financials?.dailyBreakdown.map(day => 
      day.date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
    ) || [],
    datasets: [
      {
        label: 'Toplam Gelir',
        data: financials?.dailyBreakdown.map(day => day.revenue) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
      {
        label: 'Net Kazanç',
        data: financials?.dailyBreakdown.map(day => day.netEarning) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      }
    ]
  };

  // Komisyon oranı grafiği
  const commissionData = {
    labels: ['Net Kazanç', 'Komisyon'],
    datasets: [
      {
        data: [
          financials?.netEarning || 0,
          financials?.totalCommission || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 2,
      }
    ]
  };

  if (!user?.restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Yetkisiz Erişim</h2>
          <p className="text-gray-600">Bu sayfaya erişim için restoran hesabı gerekli.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mali Durum</h1>
              <p className="text-gray-600">Restoran gelirinizi ve komisyon ödemelerinizi takip edin</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={generateFinancialReport}
                disabled={loading || !financials}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Mali Rapor İndir (PDF)
              </button>
              <button
                onClick={sendFinancialReportByEmail}
                disabled={loading || !financials}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                E-posta ile Gönder
              </button>
            </div>
          </div>
        </div>

        {/* Tarih Filtresi */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  startDate: new Date(e.target.value)
                }))}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  endDate: new Date(e.target.value)
                }))}
                className="border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <button
              onClick={loadFinancialData}
              className="mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Güncelle
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Mali veriler yükleniyor...</p>
          </div>
        ) : (
          <>
            {/* Ana Metrikler */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financials?.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Kazanç</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financials?.netEarning || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Komisyon (%9)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(financials?.totalCommission || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {financials?.totalOrders || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Günlük Gelir Grafiği */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Günlük Gelir Trendi</h3>
                <Bar data={dailyRevenueData} options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value: string | number) {
                          return formatCurrency(Number(value));
                        }
                      }
                    }
                  }
                }} />
              </div>

              {/* Komisyon Dağılımı */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gelir Dağılımı</h3>
                <div className="h-64 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      %{((financials?.netEarning || 0) / (financials?.totalRevenue || 1) * 100).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">Net Kazanç Oranı</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ödeme Yöntemi Dağılımı */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Yöntemi Dağılımı</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Kapıda Nakit</span>
                    <span className="text-sm text-green-600">
                      {financials?.paymentMethodBreakdown.cash.count || 0} sipariş
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {formatCurrency(financials?.paymentMethodBreakdown.cash.amount || 0)}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisyon: {formatCurrency(financials?.paymentMethodBreakdown.cash.commission || 0)}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Kapıda Kart</span>
                    <span className="text-sm text-green-600">
                      {financials?.paymentMethodBreakdown.card.count || 0} sipariş
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {formatCurrency(financials?.paymentMethodBreakdown.card.amount || 0)}
                  </div>
                  <div className="text-sm text-red-600">
                    Komisyon: {formatCurrency(financials?.paymentMethodBreakdown.card.commission || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Son İşlemler */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Mali İşlemler</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tarih
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sipariş ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ödeme Yöntemi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tutar
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Komisyon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net Kazanç
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.slice(0, 10).map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          #{transaction.orderId.slice(-8)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {CommissionService.getPaymentMethodText(transaction.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{formatCurrency(transaction.commissionAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(transaction.restaurantAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            transaction.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status === 'completed' ? 'Tamamlandı' : 
                             transaction.status === 'pending' ? 'Bekliyor' : 'Başarısız'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 