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
  Search,
  Filter,
  Calendar,
  ShoppingCart,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  MapPin,
  Phone,
  CreditCard,
  Banknote,
  Globe,
  FileText
} from 'lucide-react';
import Link from 'next/link';

// Müşteri sipariş geçmişi sayfası komponenti
export default function CustomerOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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

  // Filtreleme
  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter]);

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
    } catch (error) {
      console.error('Müşteri siparişleri yüklenirken hata:', error);
      toast.error('Müşteri siparişleri yüklenirken bir hata oluştu');
    }
  };

  // Siparişleri filtrele
  const filterOrders = () => {
    let filtered = [...orders];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items.some(item => 
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Ödeme filtresi
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter);
    }

    // Tarih filtresi
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();

      switch (dateFilter) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          startDate.setMonth(now.getMonth() - 3);
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(order => order.createdAt >= startDate);
      }
    }

    setFilteredOrders(filtered);
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

  // Ödeme yöntemi ikonu
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH: return <Banknote className="h-4 w-4" />;
      case PaymentMethod.CREDIT_CARD: return <CreditCard className="h-4 w-4" />;
      case PaymentMethod.ONLINE: return <Globe className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  // İstatistikler
  const stats = {
    totalOrders: orders.length,
    completedOrders: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
    cancelledOrders: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    totalSpent: orders.filter(o => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: orders.filter(o => o.status === OrderStatus.DELIVERED).length > 0 
      ? orders.filter(o => o.status === OrderStatus.DELIVERED).reduce((sum, o) => sum + o.total, 0) / orders.filter(o => o.status === OrderStatus.DELIVERED).length
      : 0
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Sipariş geçmişi yükleniyor...</p>
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
  if (!customer) {
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
              href={`/admin/customers/${customer.uid}`}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-semibold text-lg">
                  {customer.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {customer.displayName} - Sipariş Geçmişi
                </h1>
                <p className="text-gray-600">
                  Müşterinin tüm siparişlerini görüntüleyin ve yönetin
                </p>
              </div>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedOrders}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">İptal Edilen</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
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
                <Package className="h-8 w-8 text-secondary-500" />
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Arama */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Sipariş ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Durum Filtresi */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value={OrderStatus.PENDING}>Bekleyen</option>
                  <option value={OrderStatus.CONFIRMED}>Onaylandı</option>
                  <option value={OrderStatus.PREPARING}>Hazırlanıyor</option>
                  <option value={OrderStatus.READY}>Hazır</option>
                  <option value={OrderStatus.DELIVERING}>Yolda</option>
                  <option value={OrderStatus.DELIVERED}>Teslim Edildi</option>
                  <option value={OrderStatus.CANCELLED}>İptal Edildi</option>
                </select>
              </div>

              {/* Ödeme Filtresi */}
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Tüm Ödemeler</option>
                  <option value={PaymentMethod.CASH}>Kapıda Nakit</option>
                  <option value={PaymentMethod.CREDIT_CARD}>Kapıda Kart</option>
                  <option value={PaymentMethod.ONLINE}>Online Ödeme</option>
                </select>
              </div>

              {/* Tarih Filtresi */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Tüm Zamanlar</option>
                  <option value="today">Bugün</option>
                  <option value="week">Son 7 Gün</option>
                  <option value="month">Son 30 Gün</option>
                  <option value="3months">Son 3 Ay</option>
                </select>
              </div>

              {/* Sonuç Sayısı */}
              <div className="flex items-center justify-center">
                <p className="text-sm text-gray-600">
                  {filteredOrders.length} sipariş gösteriliyor
                </p>
              </div>
            </div>
          </div>

          {/* Sipariş Listesi */}
          {filteredOrders.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş Bulunamadı</h3>
              <p className="text-gray-600">
                {orders.length === 0 
                  ? 'Bu müşteri henüz hiç sipariş vermemiş.'
                  : 'Filtrelere uygun sipariş bulunamadı.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Sol Taraf - Sipariş Bilgileri */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {/* Durum */}
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          
                          {/* Temel Bilgiler */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              #{order.id.slice(-8).toUpperCase()}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {order.createdAt.toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                {getPaymentMethodIcon(order.paymentMethod)}
                                {getPaymentMethodText(order.paymentMethod)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Fiyat */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">₺{order.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{order.items.length} ürün</p>
                        </div>
                      </div>

                      {/* Ürünler */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {order.items.slice(0, 3).map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                            >
                              {item.quantity}x {item.product.name}
                              {item.variant && ` (${item.variant.name})`}
                            </span>
                          ))}
                          {order.items.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-md">
                              +{order.items.length - 3} ürün daha
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Teslimat Adresi */}
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-sm text-gray-600">
                          {order.deliveryAddress.street}, {order.deliveryAddress.district}, {order.deliveryAddress.city}
                        </span>
                      </div>

                      {/* Özel Talimatlar */}
                      {order.specialInstructions && (
                        <div className="flex items-start gap-2 mt-2">
                          <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600 italic">
                            "{order.specialInstructions}"
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Sağ Taraf - Aksiyonlar */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Sipariş Detayı
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 