'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User, Order, OrderStatus } from '@/types';
import toast from 'react-hot-toast';
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Star,
  Package,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

// Müşteri istatistikleri tipi
interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  averageOrderValue: number;
  favoriteCategory?: string;
}

// Genişletilmiş müşteri tipi
interface CustomerWithStats extends User {
  stats: CustomerStats;
}

// Müşteri yönetimi sayfası komponenti
export default function CustomersPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Müşterileri yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadCustomers();
    }
  }, [user]);

  // Filtreleme ve arama
  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, sortBy, filterBy]);

  // Müşterileri yükle
  const loadCustomers = async () => {
    setIsLoading(true);
    
    try {
      // Tüm kullanıcıları getir (admin olmayanlar)
      const usersQuery = query(
        collection(db, 'users'),
        where('isAdmin', '==', false),
        orderBy('createdAt', 'desc')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: User[] = [];

      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          uid: doc.id,
          email: data.email,
          displayName: data.displayName || '',
          phoneNumber: data.phoneNumber || '',
          address: data.address,
          isAdmin: data.isAdmin || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      // Her müşteri için sipariş istatistiklerini hesapla
      const customersWithStats: CustomerWithStats[] = [];
      
      for (const customer of usersData) {
        const stats = await calculateCustomerStats(customer.uid);
        customersWithStats.push({
          ...customer,
          stats
        });
      }

      setCustomers(customersWithStats);
    } catch (error) {
      console.error('Müşteriler yüklenirken hata:', error);
      toast.error('Müşteriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Müşteri istatistiklerini hesapla
  const calculateCustomerStats = async (userId: string): Promise<CustomerStats> => {
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders: Order[] = [];

      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
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

      const completedOrders = orders.filter(order => order.status === OrderStatus.DELIVERED);
      const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);
      const lastOrder = orders.length > 0 ? orders[0] : null;

      return {
        totalOrders: orders.length,
        totalSpent,
        lastOrderDate: lastOrder?.createdAt,
        averageOrderValue: completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
      };
    } catch (error) {
      console.error('Müşteri istatistikleri hesaplanırken hata:', error);
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0,
      };
    }
  };

  // Müşterileri filtrele
  const filterCustomers = () => {
    let filtered = [...customers];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
      );
    }

    // Kategori filtresi
    switch (filterBy) {
      case 'active':
        filtered = filtered.filter(customer => customer.stats.totalOrders > 0);
        break;
      case 'inactive':
        filtered = filtered.filter(customer => customer.stats.totalOrders === 0);
        break;
      case 'vip':
        filtered = filtered.filter(customer => customer.stats.totalSpent > 500);
        break;
      case 'recent':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filtered = filtered.filter(customer => 
          customer.stats.lastOrderDate && customer.stats.lastOrderDate >= thirtyDaysAgo
        );
        break;
    }

    // Sıralama
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.displayName.localeCompare(b.displayName));
        break;
      case 'orders':
        filtered.sort((a, b) => b.stats.totalOrders - a.stats.totalOrders);
        break;
      case 'spent':
        filtered.sort((a, b) => b.stats.totalSpent - a.stats.totalSpent);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          if (!a.stats.lastOrderDate && !b.stats.lastOrderDate) return 0;
          if (!a.stats.lastOrderDate) return 1;
          if (!b.stats.lastOrderDate) return -1;
          return b.stats.lastOrderDate.getTime() - a.stats.lastOrderDate.getTime();
        });
        break;
      case 'joined':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    setFilteredCustomers(filtered);
  };

  // Genel istatistikler
  const generalStats = {
    totalCustomers: customers.length,
    activeCustomers: customers.filter(c => c.stats.totalOrders > 0).length,
    vipCustomers: customers.filter(c => c.stats.totalSpent > 500).length,
    totalRevenue: customers.reduce((sum, c) => sum + c.stats.totalSpent, 0),
    averageOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.stats.averageOrderValue, 0) / customers.filter(c => c.stats.totalOrders > 0).length || 0
      : 0,
    newCustomersThisMonth: customers.filter(c => {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      return c.createdAt >= thisMonth;
    }).length
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Müşteriler yükleniyor...</p>
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
          {/* Başlık */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Müşteri Yönetimi
              </h1>
              <p className="text-gray-600">
                Müşteri profillerini ve sipariş geçmişlerini yönetin
              </p>
            </div>
            <button
              onClick={loadCustomers}
              className="btn-outline flex items-center gap-2 mt-4 md:mt-0"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Müşteri</p>
                  <p className="text-2xl font-bold text-gray-900">{generalStats.totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Müşteri</p>
                  <p className="text-2xl font-bold text-green-600">{generalStats.activeCustomers}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">VIP Müşteri</p>
                  <p className="text-2xl font-bold text-purple-600">{generalStats.vipCustomers}</p>
                </div>
                <Star className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Ciro</p>
                  <p className="text-2xl font-bold text-primary-600">₺{generalStats.totalRevenue.toFixed(0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ort. Sipariş</p>
                  <p className="text-2xl font-bold text-secondary-600">₺{generalStats.averageOrderValue.toFixed(0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-secondary-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Bu Ay Yeni</p>
                  <p className="text-2xl font-bold text-indigo-600">{generalStats.newCustomersThisMonth}</p>
                </div>
                <UserCheck className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Filtreler */}
          <div className="card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Arama */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Müşteri ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Kategori Filtresi */}
              <div>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Tüm Müşteriler</option>
                  <option value="active">Aktif Müşteriler</option>
                  <option value="inactive">Pasif Müşteriler</option>
                  <option value="vip">VIP Müşteriler (₺500+)</option>
                  <option value="recent">Son 30 Gün Aktif</option>
                </select>
              </div>

              {/* Sıralama */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="form-input"
                >
                  <option value="name">İsme Göre</option>
                  <option value="orders">Sipariş Sayısına Göre</option>
                  <option value="spent">Harcama Miktarına Göre</option>
                  <option value="recent">Son Siparişe Göre</option>
                  <option value="joined">Katılım Tarihine Göre</option>
                </select>
              </div>

              {/* Sonuç Sayısı */}
              <div className="flex items-center justify-center">
                <p className="text-sm text-gray-600">
                  {filteredCustomers.length} müşteri gösteriliyor
                </p>
              </div>
            </div>
          </div>

          {/* Müşteri Listesi */}
          {filteredCustomers.length === 0 ? (
            <div className="card p-12 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Müşteri Bulunamadı</h3>
              <p className="text-gray-600">
                {customers.length === 0 
                  ? 'Henüz hiç müşteri kaydı yok.'
                  : 'Filtrelere uygun müşteri bulunamadı.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div key={customer.uid} className="card p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Sol Taraf - Müşteri Bilgileri */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-lg">
                              {customer.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Temel Bilgiler */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {customer.displayName}
                              </h3>
                              {customer.stats.totalSpent > 500 && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  <Star className="h-3 w-3" />
                                  VIP
                                </span>
                              )}
                              {customer.stats.totalOrders === 0 && (
                                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  Yeni Müşteri
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {customer.email}
                              </div>
                              {customer.phoneNumber && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-4 w-4" />
                                  {customer.phoneNumber}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Üye: {customer.createdAt.toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* İstatistikler */}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary-600">
                            ₺{customer.stats.totalSpent.toFixed(0)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {customer.stats.totalOrders} sipariş
                          </p>
                        </div>
                      </div>

                      {/* Detaylı İstatistikler */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.stats.totalOrders} Sipariş
                            </p>
                            <p className="text-xs text-gray-600">Toplam</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              ₺{customer.stats.averageOrderValue.toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-600">Ortalama</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {customer.stats.lastOrderDate 
                                ? customer.stats.lastOrderDate.toLocaleDateString('tr-TR')
                                : 'Hiç sipariş yok'
                              }
                            </p>
                            <p className="text-xs text-gray-600">Son Sipariş</p>
                          </div>
                        </div>
                        {customer.address && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {customer.address.district}, {customer.address.city}
                              </p>
                              <p className="text-xs text-gray-600">Adres</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sağ Taraf - Aksiyonlar */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <Link
                        href={`/admin/customers/${customer.uid}`}
                        className="btn-primary w-full text-sm flex items-center justify-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Detayları Gör
                      </Link>
                      <Link
                        href={`/admin/customers/${customer.uid}/orders`}
                        className="btn-outline w-full text-sm flex items-center justify-center gap-2"
                      >
                        <Package className="h-4 w-4" />
                        Siparişleri ({customer.stats.totalOrders})
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