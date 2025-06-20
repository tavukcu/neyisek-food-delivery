'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  BarChart3,
  Users,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Package,
  ChefHat,
  AlertTriangle,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Calendar,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail,
  Activity,
  Zap,
  Target,
  Award,
  Briefcase,
  FileText,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Filter,
  Search,
  Bell,
  Shield,
  Database,
  Server,
  Wifi,
  HardDrive,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import BackToHomeButton from '@/components/BackToHomeButton';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Gerçek zamanlı veri hook'u - Firebase'den gerçek veriler
const useRealTimeStats = () => {
  const [stats, setStats] = useState({
    // Temel İstatistikler
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    
    // Günlük İstatistikler
    todayUsers: 0,
    todayOrders: 0,
    todayRevenue: 0,
    todayNewRestaurants: 0,
    
    // Bekleyen İşlemler
    pendingOrders: 0,
    pendingRestaurants: 0,
    pendingReviews: 0,
    pendingPayments: 0,
    
    // Performans Metrikleri
    averageOrderValue: 0,
    customerSatisfaction: 0,
    deliveryTime: 0,
    conversionRate: 0,
    
    // Sistem Durumu
    systemHealth: 100,
    serverLoad: 0,
    databaseSize: 0,
    activeConnections: 0,
    
    // Trend Verileri
    userGrowth: 0,
    revenueGrowth: 0,
    orderGrowth: 0,
    restaurantGrowth: 0
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadRealTimeStats();
  }, []);

  const loadRealTimeStats = async () => {
    try {
      setLoading(true);
      
      // Gerçek Firebase verilerini yükle
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Kullanıcıları say
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      const todayUsers = usersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        return userData.createdAt?.toDate() >= today;
      }).length;

      // Siparişleri say
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const orders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status || 'pending',
          total: data.total || 0
        };
      });
      
      const totalOrders = orders.length;
      const todayOrders = orders.filter(order => order.createdAt >= today).length;
      const totalRevenue = orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.total, 0);
      const todayRevenue = orders
        .filter(order => order.createdAt >= today && order.status === 'delivered')
        .reduce((sum, order) => sum + order.total, 0);

      // Restoranları say
      const restaurantsSnapshot = await getDocs(collection(db, 'restaurants'));
      const totalRestaurants = restaurantsSnapshot.size;
      const todayNewRestaurants = restaurantsSnapshot.docs.filter(doc => {
        const restaurantData = doc.data();
        return restaurantData.createdAt?.toDate() >= today;
      }).length;

      // Bekleyen işlemleri say
      const pendingOrders = orders.filter(order => 
        ['pending', 'confirmed', 'preparing'].includes(order.status)
      ).length;

      // Performans metrikleri hesapla
      const completedOrders = orders.filter(order => order.status === 'delivered');
      const averageOrderValue = completedOrders.length > 0 
        ? totalRevenue / completedOrders.length 
        : 0;

      setStats({
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue,
        todayUsers,
        todayOrders,
        todayRevenue,
        todayNewRestaurants,
        pendingOrders,
        pendingRestaurants: 0, // Bu veri için ayrı sorgu gerekebilir
        pendingReviews: 0, // Bu veri için ayrı sorgu gerekebilir
        pendingPayments: 0, // Bu veri için ayrı sorgu gerekebilir
        averageOrderValue,
        customerSatisfaction: 0, // Bu veri için ayrı hesaplama gerekebilir
        deliveryTime: 0, // Bu veri için ayrı hesaplama gerekebilir
        conversionRate: 0, // Bu veri için ayrı hesaplama gerekebilir
        systemHealth: 100,
        serverLoad: Math.floor(Math.random() * 50), // Simüle edilmiş değer
        databaseSize: 0, // Bu veri için ayrı sorgu gerekebilir
        activeConnections: Math.floor(Math.random() * 100) + 50, // Simüle edilmiş değer
        userGrowth: 0, // Bu veri için trend hesaplaması gerekebilir
        revenueGrowth: 0, // Bu veri için trend hesaplaması gerekebilir
        orderGrowth: 0, // Bu veri için trend hesaplaması gerekebilir
        restaurantGrowth: 0 // Bu veri için trend hesaplaması gerekebilir
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading, lastUpdate, refreshStats: loadRealTimeStats };
};

// Hızlı Eylemler Bileşeni
const QuickActions = () => {
  const actions = [
    { icon: Plus, label: 'Yeni Restoran', href: '/admin/restaurants/add', color: 'bg-blue-500' },
    { icon: Package, label: 'Ürün Ekle', href: '/admin/products/add', color: 'bg-green-500' },
    { icon: Settings, label: 'Kategori Yönet', href: '/admin/categories', color: 'bg-indigo-500' },
    { icon: Bell, label: 'Reklam Yönet', href: '/admin/advertisements', color: 'bg-yellow-500' },
    { icon: Users, label: 'Kullanıcı Yönet', href: '/admin/users', color: 'bg-purple-500' },
    { icon: BarChart3, label: 'Raporlar', href: '/admin/analytics', color: 'bg-orange-500' },
    { icon: MessageSquare, label: 'Şikayet Yönet', href: '/admin/complaints', color: 'bg-pink-500' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {actions.map((action, index) => (
        <Link
          key={index}
          href={action.href}
          className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-gray-200"
        >
          <div className={`${action.color} rounded-lg p-3 mb-3 group-hover:scale-110 transition-transform duration-200`}>
            <action.icon className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
            {action.label}
          </p>
        </Link>
      ))}
    </div>
  );
};

// Sistem Durumu Bileşeni
const SystemStatus = ({ stats }: { stats: any }) => {
  const statusItems = [
    { 
      label: 'Sistem Sağlığı', 
      value: `${stats.systemHealth.toFixed(1)}%`, 
      icon: Shield,
      color: stats.systemHealth > 95 ? 'text-green-600' : stats.systemHealth > 90 ? 'text-yellow-600' : 'text-red-600',
      bg: stats.systemHealth > 95 ? 'bg-green-100' : stats.systemHealth > 90 ? 'bg-yellow-100' : 'bg-red-100'
    },
    { 
      label: 'Sunucu Yükü', 
      value: `${stats.serverLoad}%`, 
      icon: Server,
      color: stats.serverLoad < 50 ? 'text-green-600' : stats.serverLoad < 80 ? 'text-yellow-600' : 'text-red-600',
      bg: stats.serverLoad < 50 ? 'bg-green-100' : stats.serverLoad < 80 ? 'bg-yellow-100' : 'bg-red-100'
    },
    { 
      label: 'Veritabanı', 
      value: `${stats.databaseSize} GB`, 
      icon: Database,
      color: 'text-blue-600',
      bg: 'bg-blue-100'
    },
    { 
      label: 'Aktif Bağlantı', 
      value: stats.activeConnections, 
      icon: Wifi,
      color: 'text-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-blue-600" />
        Sistem Durumu
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className="text-center">
            <div className={`${item.bg} rounded-lg p-3 mb-2 mx-auto w-fit`}>
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
            <p className="text-sm text-gray-600 mb-1">{item.label}</p>
            <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Son Aktiviteler Bileşeni
const RecentActivity = () => {
  const activities = [
    { type: 'order', message: 'Yeni sipariş alındı', user: 'Ahmet Yılmaz', time: '2 dk önce', icon: ShoppingCart, color: 'text-green-600' },
    { type: 'restaurant', message: 'Restoran başvurusu', user: 'Pizza Palace', time: '5 dk önce', icon: ChefHat, color: 'text-blue-600' },
    { type: 'user', message: 'Yeni kullanıcı kaydı', user: 'Fatma Demir', time: '8 dk önce', icon: Users, color: 'text-purple-600' },
    { type: 'payment', message: 'Ödeme tamamlandı', user: 'Mehmet Kaya', time: '12 dk önce', icon: DollarSign, color: 'text-yellow-600' },
    { type: 'review', message: 'Yeni değerlendirme', user: 'Ayşe Öz', time: '15 dk önce', icon: Star, color: 'text-orange-600' }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        Son Aktiviteler
      </h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className={`p-2 rounded-lg bg-gray-100`}>
              <activity.icon className={`h-4 w-4 ${activity.color}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{activity.message}</p>
              <p className="text-xs text-gray-500">{activity.user}</p>
            </div>
            <span className="text-xs text-gray-400">{activity.time}</span>
          </div>
        ))}
      </div>
      <Link 
        href="/admin/activity" 
        className="block text-center text-sm text-blue-600 hover:text-blue-700 mt-4 font-medium"
      >
        Tüm aktiviteleri görüntüle
      </Link>
    </div>
  );
};

// Ana Admin Bileşeni
export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { stats, loading: statsLoading, lastUpdate, refreshStats } = useRealTimeStats();

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Verileri yenile
  const refreshData = () => {
    toast.success('Veriler yenilendi!');
    refreshStats();
  };

  // Loading durumu
  if (authLoading || statsLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Admin paneli yükleniyor...</p>
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
        {/* Başlık ve Kontroller */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Hoş geldiniz, <span className="font-medium text-blue-600">{user.displayName}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Yenile
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              Rapor İndir
            </button>
            <BackToHomeButton variant="secondary" />
          </div>
        </div>

        {/* Hızlı Eylemler */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Eylemler</h2>
          <QuickActions />
        </div>

        {/* Ana İstatistikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Toplam Kullanıcılar */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{stats.userGrowth}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Toplam Kullanıcı</p>
            <p className="text-xs text-gray-500 mt-1">Bugün +{stats.todayUsers} yeni</p>
          </div>

          {/* Toplam Gelir */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{stats.revenueGrowth}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">₺{stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Toplam Gelir</p>
            <p className="text-xs text-gray-500 mt-1">Bugün ₺{stats.todayRevenue.toLocaleString()}</p>
          </div>

          {/* Toplam Siparişler */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{stats.orderGrowth}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Toplam Sipariş</p>
            <p className="text-xs text-gray-500 mt-1">Bugün {stats.todayOrders} sipariş</p>
          </div>

          {/* Toplam Restoranlar */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <ChefHat className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <ArrowUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{stats.restaurantGrowth}%</span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalRestaurants}</h3>
            <p className="text-gray-600 text-sm">Aktif Restoran</p>
            <p className="text-xs text-gray-500 mt-1">{stats.pendingRestaurants} onay bekliyor</p>
          </div>
        </div>

        {/* Performans Metrikleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="bg-yellow-100 rounded-lg p-3 w-fit mx-auto mb-3">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">₺{stats.averageOrderValue}</h3>
            <p className="text-gray-600 text-sm">Ortalama Sipariş</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="bg-pink-100 rounded-lg p-3 w-fit mx-auto mb-3">
              <Star className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stats.customerSatisfaction}/5</h3>
            <p className="text-gray-600 text-sm">Müşteri Memnuniyeti</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="bg-indigo-100 rounded-lg p-3 w-fit mx-auto mb-3">
              <Clock className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stats.deliveryTime} dk</h3>
            <p className="text-gray-600 text-sm">Ortalama Teslimat</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
            <div className="bg-teal-100 rounded-lg p-3 w-fit mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">{stats.conversionRate}%</h3>
            <p className="text-gray-600 text-sm">Dönüşüm Oranı</p>
          </div>
        </div>

        {/* Bekleyen İşlemler */}
        {(stats.pendingOrders > 0 || stats.pendingRestaurants > 0 || stats.pendingReviews > 0 || stats.pendingPayments > 0) && (
          <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 mb-8 text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Acil Dikkat Gereken İşlemler
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.pendingOrders > 0 && (
                <Link href="/admin/orders?status=pending" className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="h-6 w-6" />
                    <div>
                      <p className="font-bold">{stats.pendingOrders}</p>
                      <p className="text-sm opacity-90">Bekleyen Sipariş</p>
                    </div>
                  </div>
                </Link>
              )}
              {stats.pendingRestaurants > 0 && (
                <Link href="/admin/restaurants?status=pending" className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <ChefHat className="h-6 w-6" />
                    <div>
                      <p className="font-bold">{stats.pendingRestaurants}</p>
                      <p className="text-sm opacity-90">Restoran Başvurusu</p>
                    </div>
                  </div>
                </Link>
              )}
              {stats.pendingReviews > 0 && (
                <Link href="/admin/reviews?status=pending" className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Star className="h-6 w-6" />
                    <div>
                      <p className="font-bold">{stats.pendingReviews}</p>
                      <p className="text-sm opacity-90">Bekleyen Değerlendirme</p>
                    </div>
                  </div>
                </Link>
              )}
              {stats.pendingPayments > 0 && (
                <Link href="/admin/payments?status=pending" className="bg-white/20 rounded-lg p-4 hover:bg-white/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6" />
                    <div>
                      <p className="font-bold">{stats.pendingPayments}</p>
                      <p className="text-sm opacity-90">Bekleyen Ödeme</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Alt Bölüm - Sistem Durumu ve Son Aktiviteler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <SystemStatus stats={stats} />
          <RecentActivity />
        </div>

        {/* Yönetim Modülleri */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Yönetim Modülleri</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Kullanıcı Yönetimi', href: '/admin/users', desc: 'Kullanıcıları görüntüle ve yönet' },
              { icon: ChefHat, label: 'Restoran Yönetimi', href: '/admin/restaurants', desc: 'Restoranları ve başvuruları yönet' },
              { icon: Package, label: 'Ürün Yönetimi', href: '/admin/products', desc: 'Ürünleri ve kategorileri yönet' },
              { icon: ShoppingCart, label: 'Sipariş Yönetimi', href: '/admin/orders', desc: 'Siparişleri takip et ve yönet' },
              { icon: Bell, label: 'Reklam Yönetimi', href: '/admin/advertisements', desc: 'Reklamları ekle, düzenle ve yönet' },
              { icon: BarChart3, label: 'Analitik & Raporlar', href: '/admin/analytics', desc: 'Detaylı raporlar ve analizler' },
              { icon: Settings, label: 'Sistem Ayarları', href: '/admin/settings', desc: 'Uygulama ayarlarını yapılandır' }
            ].map((module, index) => (
              <Link
                key={index}
                href={module.href}
                className="group p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 group-hover:bg-blue-200 rounded-lg p-2 transition-colors">
                    <module.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {module.label}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{module.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 