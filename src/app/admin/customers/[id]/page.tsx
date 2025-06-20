'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Order, OrderStatus, PaymentMethod } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Star,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import Link from 'next/link';

// Müşteri istatistikleri tipi
interface CustomerStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderDate?: Date;
  firstOrderDate?: Date;
  favoritePaymentMethod?: PaymentMethod;
  monthlySpending: { month: string; amount: number }[];
  ordersByStatus: { status: OrderStatus; count: number }[];
}

// Müşteri detay sayfası komponenti
export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Müşteri verilerini yükle
  useEffect(() => {
    if (user && user.isAdmin && params.id) {
      loadCustomerData();
    }
  }, [user, params.id]);

  // Müşteri verilerini yükle
  const loadCustomerData = async () => {
    setIsLoading(true);
    
    try {
      const customerId = params.id as string;
      
      // Müşteri bilgilerini getir
      const customerDoc = await getDoc(doc(db, 'users', customerId));
      
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        const customerInfo: User = {
          uid: customerDoc.id,
          email: customerData.email,
          displayName: customerData.displayName || '',
          phoneNumber: customerData.phoneNumber || '',
          address: customerData.address,
          isAdmin: customerData.isAdmin || false,
          createdAt: customerData.createdAt?.toDate() || new Date(),
          updatedAt: customerData.updatedAt?.toDate() || new Date(),
        };
        
        setCustomer(customerInfo);
        
        // Müşterinin siparişlerini getir
        await loadCustomerOrders(customerId);
      } else {
        toast.error('Müşteri bulunamadı');
        router.push('/admin/customers');
      }
    } catch (error) {
      console.error('Müşteri verileri yüklenirken hata:', error);
      toast.error('Müşteri verileri yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Müşteri siparişlerini yükle
  const loadCustomerOrders = async (customerId: string) => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', customerId),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData: Order[] = [];

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          userId: data.userId,
          user: data.user,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          deliveryFee: data.deliveryFee || 0,
          total: data.total || 0,
          status: data.status || OrderStatus.PENDING,
          paymentMethod: data.paymentMethod,
          deliveryAddress: data.deliveryAddress,
          estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
          actualDeliveryTime: data.actualDeliveryTime?.toDate(),
          specialInstructions: data.specialInstructions || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      setOrders(ordersData);
      calculateStats(ordersData);
    } catch (error) {
      console.error('Müşteri siparişleri yüklenirken hata:', error);
      toast.error('Müşteri siparişleri yüklenirken bir hata oluştu');
    }
  };

  // İstatistikleri hesapla
  const calculateStats = (ordersData: Order[]) => {
    const completedOrders = ordersData.filter(order => order.status === OrderStatus.DELIVERED);
    const cancelledOrders = ordersData.filter(order => order.status === OrderStatus.CANCELLED);
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);

    // Aylık harcama hesapla
    const monthlySpending: { month: string; amount: number }[] = [];
    const monthlyData: { [key: string]: number } = {};

    completedOrders.forEach(order => {
      const monthKey = order.createdAt.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' });
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + order.total;
    });

    Object.entries(monthlyData).forEach(([month, amount]) => {
      monthlySpending.push({ month, amount });
    });

    // Durum bazında sipariş sayıları
    const ordersByStatus: { status: OrderStatus; count: number }[] = [];
    const statusCounts: { [key in OrderStatus]?: number } = {};

    ordersData.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      ordersByStatus.push({ status: status as OrderStatus, count });
    });

    // En çok kullanılan ödeme yöntemi
    const paymentMethods: { [key in PaymentMethod]?: number } = {};
    ordersData.forEach(order => {
      paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
    });

    const favoritePaymentMethod = Object.entries(paymentMethods).reduce((a, b) => 
      paymentMethods[a[0] as PaymentMethod]! > paymentMethods[b[0] as PaymentMethod]! ? a : b
    )?.[0] as PaymentMethod;

    const calculatedStats: CustomerStats = {
      totalOrders: ordersData.length,
      completedOrders: completedOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalSpent,
      averageOrderValue: completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
      lastOrderDate: ordersData.length > 0 ? ordersData[0].createdAt : undefined,
      firstOrderDate: ordersData.length > 0 ? ordersData[ordersData.length - 1].createdAt : undefined,
      favoritePaymentMethod,
      monthlySpending: monthlySpending.slice(0, 6), // Son 6 ay
      ordersByStatus
    };

    setStats(calculatedStats);
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

  // Durum rengi
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-800';
      case OrderStatus.READY: return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERING: return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock className="h-4 w-4" />;
      case OrderStatus.CONFIRMED: return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.PREPARING: return <Package className="h-4 w-4" />;
      case OrderStatus.READY: return <Package className="h-4 w-4" />;
      case OrderStatus.DELIVERING: return <Truck className="h-4 w-4" />;
      case OrderStatus.DELIVERED: return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED: return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
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

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Müşteri detayları yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Yetkisiz erişim
  if (!user || !user.isAdmin) {
    return null;
  }

  // Müşteri bulunamadı
  if (!customer || !stats) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız müşteri mevcut değil.</p>
            <Link href="/admin/customers" className="btn-primary">
              Müşterilere Dön
            </Link>
          </div>
        </div>
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
          {/* Başlık ve Geri Dön */}
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/admin/customers"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-2xl">
                  {customer.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  {customer.displayName}
                  {stats.totalSpent > 500 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      <Star className="h-4 w-4" />
                      VIP Müşteri
                    </span>
                  )}
                </h1>
                <p className="text-gray-600">
                  {customer.createdAt.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })} tarihinden beri müşteri
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol Kolon - Müşteri Bilgileri */}
            <div className="space-y-6">
              {/* Temel Bilgiler */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Müşteri Bilgileri
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{customer.email}</p>
                      <p className="text-sm text-gray-600">E-posta adresi</p>
                    </div>
                  </div>
                  
                  {customer.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{customer.phoneNumber}</p>
                        <p className="text-sm text-gray-600">Telefon numarası</p>
                      </div>
                    </div>
                  )}

                  {customer.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">Kayıtlı Adres</p>
                        <p className="text-sm text-gray-600">
                          {customer.address.street}
                          <br />
                          {customer.address.district}, {customer.address.city}
                          <br />
                          {customer.address.zipCode}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Üyelik Tarihi</p>
                      <p className="text-sm text-gray-600">
                        {customer.createdAt.toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hızlı İstatistikler */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Özet İstatistikler
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Toplam Sipariş</span>
                    <span className="font-semibold text-gray-900">{stats.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tamamlanan</span>
                    <span className="font-semibold text-green-600">{stats.completedOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">İptal Edilen</span>
                    <span className="font-semibold text-red-600">{stats.cancelledOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Toplam Harcama</span>
                    <span className="font-semibold text-primary-600">₺{stats.totalSpent.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Ortalama Sipariş</span>
                    <span className="font-semibold text-secondary-600">₺{stats.averageOrderValue.toFixed(0)}</span>
                  </div>
                  {stats.favoritePaymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tercih Edilen Ödeme</span>
                      <span className="font-semibold text-gray-900">
                        {getPaymentMethodText(stats.favoritePaymentMethod)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ Kolon - Sipariş Geçmişi ve Analizler */}
            <div className="lg:col-span-2 space-y-6">
              {/* Genel İstatistikler */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Toplam Harcama</p>
                      <p className="text-2xl font-bold text-primary-600">₺{stats.totalSpent.toFixed(0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary-500" />
                  </div>
                </div>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ortalama Sipariş</p>
                      <p className="text-2xl font-bold text-secondary-600">₺{stats.averageOrderValue.toFixed(0)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-secondary-500" />
                  </div>
                </div>
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Başarı Oranı</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Son Siparişler */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Son Siparişler
                  </h2>
                  <Link
                    href={`/admin/customers/${customer.uid}/orders`}
                    className="btn-outline text-sm flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Tümünü Gör
                  </Link>
                </div>
                
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">Henüz sipariş vermiş değil</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              #{order.id.slice(-8).toUpperCase()}
                            </p>
                            <p className="text-sm text-gray-600">
                              {order.createdAt.toLocaleDateString('tr-TR')} - {order.items.length} ürün
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₺{order.total.toFixed(2)}</p>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm text-primary-600 hover:text-primary-700"
                          >
                            Detay
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 