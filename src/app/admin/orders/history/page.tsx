'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, where, orderBy, limit, startAfter, QueryDocumentSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Package,
  User,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import Link from 'next/link';

// Sipariş geçmişi sayfası komponenti
export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const ordersPerPage = 20;

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Siparişleri yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadOrders();
    }
  }, [user]);

  // Filtreleme
  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter]);

  // Siparişleri yükle
  const loadOrders = async (loadMore = false) => {
    setIsLoading(true);
    
    try {
      let q = query(
        collection(db, 'orders'),
        where('status', 'in', [OrderStatus.DELIVERED, OrderStatus.CANCELLED]),
        orderBy('createdAt', 'desc'),
        limit(ordersPerPage)
      );

      if (loadMore && lastDoc) {
        q = query(
          collection(db, 'orders'),
          where('status', 'in', [OrderStatus.DELIVERED, OrderStatus.CANCELLED]),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(ordersPerPage)
        );
      }

      const querySnapshot = await getDocs(q);
      const ordersData: Order[] = [];

      querySnapshot.forEach((doc) => {
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
          paymentMethod: data.paymentMethod || PaymentMethod.CASH,
          deliveryAddress: data.deliveryAddress,
          estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
          actualDeliveryTime: data.actualDeliveryTime?.toDate(),
          specialInstructions: data.specialInstructions || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      if (loadMore) {
        setOrders(prev => [...prev, ...ordersData]);
      } else {
        setOrders(ordersData);
      }

      // Pagination için son dokümanı kaydet
      if (querySnapshot.docs.length > 0) {
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }

      // Daha fazla veri var mı kontrol et
      setHasMore(querySnapshot.docs.length === ordersPerPage);

    } catch (error) {
      console.error('Sipariş geçmişi yüklenirken hata:', error);
      toast.error('Sipariş geçmişi yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Daha fazla sipariş yükle
  const loadMoreOrders = () => {
    if (hasMore && !isLoading) {
      loadOrders(true);
    }
  };

  // Siparişleri filtrele
  const filterOrders = () => {
    let filtered = [...orders];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.phoneNumber.includes(searchTerm)
      );
    }

    // Durum filtresi
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Ödeme yöntemi filtresi
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === paymentFilter);
    }

    // Tarih filtresi
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(order => order.createdAt >= today);
        break;
      case 'yesterday':
        filtered = filtered.filter(order => 
          order.createdAt >= yesterday && order.createdAt < today
        );
        break;
      case 'week':
        filtered = filtered.filter(order => order.createdAt >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(order => order.createdAt >= monthAgo);
        break;
    }

    setFilteredOrders(filtered);
  };

  // Durum metni
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED: return 'Teslim Edildi';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      default: return status;
    }
  };

  // Durum rengi
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
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

  // İstatistikler
  const stats = {
    total: orders.length,
    delivered: orders.filter(o => o.status === OrderStatus.DELIVERED).length,
    cancelled: orders.filter(o => o.status === OrderStatus.CANCELLED).length,
    totalRevenue: orders
      .filter(o => o.status === OrderStatus.DELIVERED)
      .reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: orders.length > 0 
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
              href="/admin/orders"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sipariş Geçmişi
              </h1>
              <p className="text-gray-600">
                Tamamlanmış ve iptal edilmiş siparişler
              </p>
            </div>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Teslim Edildi</p>
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">İptal Edildi</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Ciro</p>
                  <p className="text-2xl font-bold text-primary-600">₺{stats.totalRevenue.toFixed(0)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ort. Sipariş</p>
                  <p className="text-2xl font-bold text-secondary-600">₺{stats.averageOrderValue.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary-500" />
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
                  <option value="yesterday">Dün</option>
                  <option value="week">Son 7 Gün</option>
                  <option value="month">Son 30 Gün</option>
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
                  ? 'Henüz tamamlanmış sipariş yok.'
                  : 'Filtrelere uygun sipariş bulunamadı.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="card p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Sol Taraf - Sipariş Bilgileri */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                #{order.id.slice(-8).toUpperCase()}
                              </h3>
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)}
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {order.createdAt.toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {getPaymentMethodText(order.paymentMethod)}
                              </div>
                              {order.actualDeliveryTime && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-4 w-4" />
                                  Teslim: {order.actualDeliveryTime.toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600">₺{order.total.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">{order.items.length} ürün</p>
                          </div>
                        </div>

                        {/* Müşteri Bilgileri */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{order.user.displayName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{order.user.phoneNumber}</span>
                          </div>
                          <div className="flex items-start gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <span className="text-sm text-gray-900">
                              {order.deliveryAddress.street}, {order.deliveryAddress.district}, {order.deliveryAddress.city}
                            </span>
                          </div>
                        </div>

                        {/* Ürünler Özeti */}
                        <div className="border-t border-gray-200 pt-4">
                          <div className="flex flex-wrap gap-2">
                            {order.items.slice(0, 4).map((item, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {item.quantity}x {item.product.name}
                              </span>
                            ))}
                            {order.items.length > 4 && (
                              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                +{order.items.length - 4} ürün daha
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sağ Taraf - Detay Butonu */}
                      <div className="flex flex-col gap-3 lg:w-48">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="btn-outline w-full text-sm flex items-center justify-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detayları Gör
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Daha Fazla Yükle Butonu */}
              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={loadMoreOrders}
                    disabled={isLoading}
                    className="btn-outline flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <div className="spinner-sm"></div>
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Daha Fazla Yükle
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
} 