'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, orderBy, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod } from '@/types';
import toast from 'react-hot-toast';
import { 
  Clock, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  AlertTriangle,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  User,
  ChefHat,
  Timer,
  RefreshCw,
  ShoppingCart,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { 
  useAllOrdersRealTime,
  useOrderStatusUpdate,
  useTransactionsRealTime 
} from '@/hooks/useRealTimeSync';
import BackToHomeButton from '@/components/BackToHomeButton';

// Sipariş yönetimi sayfası komponenti
export default function OrdersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'orders' | 'transactions'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Real-time veriler
  const { orders: realTimeOrders, loading: ordersLoading, error: ordersError } = useAllOrdersRealTime();
  const { transactions, loading: transactionsLoading } = useTransactionsRealTime();
  const { updateStatus, updating } = useOrderStatusUpdate();

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Siparişleri yükle ve real-time dinle
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
  const loadOrders = () => {
    setIsLoading(true);
    
    try {
      // Real-time listener
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
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

        setOrders(ordersData);
        setIsLoading(false);
      });

      // Cleanup function
      return () => unsubscribe();
    } catch (error) {
      console.error('Siparişler yüklenirken hata:', error);
      toast.error('Siparişler yüklenirken bir hata oluştu');
      setIsLoading(false);
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
    }

    setFilteredOrders(filtered);
  };

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      // Eğer teslim edildi durumuna geçiyorsa, gerçek teslimat zamanını ekle
      if (newStatus === OrderStatus.DELIVERED) {
        updateData.actualDeliveryTime = new Date();
      }

      await updateDoc(doc(db, 'orders', orderId), updateData);
      
      toast.success(`Sipariş durumu "${getStatusText(newStatus)}" olarak güncellendi`);
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error);
      toast.error('Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(null);
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
      case OrderStatus.PREPARING: return <ChefHat className="h-4 w-4" />;
      case OrderStatus.READY: return <Package className="h-4 w-4" />;
      case OrderStatus.DELIVERING: return <Truck className="h-4 w-4" />;
      case OrderStatus.DELIVERED: return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED: return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
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
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    preparing: orders.filter(o => o.status === OrderStatus.PREPARING).length,
    ready: orders.filter(o => o.status === OrderStatus.READY).length,
    delivering: orders.filter(o => o.status === OrderStatus.DELIVERING).length,
    todayRevenue: orders
      .filter(o => o.createdAt >= new Date(new Date().setHours(0, 0, 0, 0)))
      .filter(o => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + o.total, 0)
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Siparişler yükleniyor...</p>
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
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container-responsive py-6">
        {/* Başlık */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/admin" className="text-gray-400 hover:text-gray-600">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Sipariş Yönetimi</h1>
            </div>
            <p className="text-gray-600">Tüm siparişleri görüntüleyin ve yönetin</p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ShoppingCart className="h-4 w-4" />
              Rapor İndir
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
            <BackToHomeButton variant="secondary" />
          </div>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-lg p-3">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Toplam Sipariş</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-600">Bekleyen</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 rounded-lg p-3">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.preparing}</p>
                <p className="text-sm text-gray-600">Hazırlanıyor</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.delivering}</p>
                <p className="text-sm text-gray-600">Yolda</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">₺{stats.todayRevenue.toFixed(0)}</p>
                <p className="text-sm text-gray-600">Bugün Ciro</p>
              </div>
            </div>
          </div>
        </div>

        {/* Arama ve Filtreler */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Sipariş ara (numara, müşteri, restoran)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Ödemeler</option>
              <option value={PaymentMethod.CASH}>Kapıda Nakit</option>
              <option value={PaymentMethod.CREDIT_CARD}>Kapıda Kart</option>
              <option value={PaymentMethod.ONLINE}>Online Ödeme</option>
            </select>
          </div>
        </div>

        {/* Sipariş Listesi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={setSelectedOrder}
              onUpdateStatus={updateOrderStatus}
            />
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş bulunamadı</h3>
            <p className="text-gray-600">Arama kriterlerinizi değiştirmeyi deneyin.</p>
          </div>
        )}
      </div>

      {/* Sipariş Detay Modal */}
      <OrderDetailModal 
        order={selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
      />
    </main>
  );
}

// Sipariş Kartı Bileşeni
const OrderCard = ({ order, onViewDetails, onUpdateStatus }: {
  order: Order;
  onViewDetails: (order: Order) => void;
  onUpdateStatus: (order: Order, newStatus: Order['status']) => void;
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Bekliyor';
      case 'confirmed': return 'Onaylandı';
      case 'preparing': return 'Hazırlanıyor';
      case 'ready': return 'Hazır';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Ödendi';
      case 'pending': return 'Bekliyor';
      case 'failed': return 'Başarısız';
      case 'refunded': return 'İade Edildi';
      default: return status;
    }
  };

  const getNextStatus = (currentStatus: string): Order['status'] | null => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'delivered';
      default: return null;
    }
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{order.id.slice(-8).toUpperCase()}</h3>
          <p className="text-sm text-gray-600">{order.user.displayName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
            {getStatusText(order.status)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
            {getPaymentStatusText(order.paymentStatus)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Toplam Tutar</p>
          <p className="text-lg font-bold text-gray-900">₺{order.total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Sipariş Zamanı</p>
          <p className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-1">Ürünler</p>
        <div className="space-y-1">
          {order.items.slice(0, 2).map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.quantity}x {item.product.name}</span>
              <span className="text-gray-900">₺{((item.variant?.price || item.product.price) * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          {order.items.length > 2 && (
            <p className="text-xs text-gray-500">+{order.items.length - 2} ürün daha</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(order)}
          className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Detaylar
        </button>
        {nextStatus && (
          <button
            onClick={() => onUpdateStatus(order, nextStatus)}
            className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            {getStatusText(nextStatus)}
          </button>
        )}
        {order.status !== 'cancelled' && order.status !== 'delivered' && (
          <button
            onClick={() => onUpdateStatus(order, 'cancelled')}
            className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" />
            İptal
          </button>
        )}
      </div>
    </div>
  );
};

// Sipariş Detay Modal Bileşeni
const OrderDetailModal = ({ order, onClose }: { order: Order | null; onClose: () => void }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Sipariş Detayları</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Sipariş Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sipariş Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Sipariş Numarası</label>
                <p className="text-gray-900">{order.id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Restoran</label>
                <p className="text-gray-900">{order.user.displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Sipariş Tarihi</label>
                <p className="text-gray-900">{new Date(order.createdAt).toLocaleString('tr-TR')}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Toplam Tutar</label>
                <p className="text-gray-900 font-bold">₺{order.total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Müşteri Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Müşteri Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Ad Soyad</label>
                <p className="text-gray-900">{order.user.displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">E-posta</label>
                <p className="text-gray-900">{order.user.email}</p>
              </div>
              {order.user.phoneNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Telefon</label>
                  <p className="text-gray-900">{order.user.phoneNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Teslimat Adresi */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Teslimat Adresi</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-gray-900">{order.deliveryAddress.street}, {order.deliveryAddress.district}, {order.deliveryAddress.city}</p>
                  {order.deliveryAddress.postalCode && (
                    <p className="text-gray-500">{order.deliveryAddress.postalCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sipariş Ürünleri */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Sipariş Ürünleri</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₺{((item.variant?.price || item.product.price) * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">₺{item.product.price}/adet</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Durum ve Zaman Bilgileri */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Durum Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Sipariş Durumu</label>
                <p className="text-gray-900">{order.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Ödeme Durumu</label>
                <p className="text-gray-900">{order.paymentStatus}</p>
              </div>
              {order.estimatedDeliveryTime && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Tahmini Teslimat</label>
                  <p className="text-gray-900">{new Date(order.estimatedDeliveryTime).toLocaleString('tr-TR')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}; 