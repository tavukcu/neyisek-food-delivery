'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  ChefHat, 
  User, 
  Mail, 
  Phone, 
  Store, 
  Calendar,
  CheckCircle, 
  XCircle, 
  Eye,
  AlertCircle,
  Search,
  Filter,
  Clock,
  UserCheck,
  UserX,
  ArrowLeft,
  Settings,
  Star,
  MapPin,
  Package,
  Edit,
  Trash2,
  Activity,
  DollarSign,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

// Restoran detay arayüzü
interface RestaurantDetail {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  restaurantName: string;
  role: 'customer' | 'restaurant' | 'admin';
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'inactive' | 'suspended';
  // Ekstra alanlar
  address?: string;
  description?: string;
  category?: string;
  rating?: number;
  totalOrders?: number;
  totalRevenue?: number;
}

// Admin restoran detay sayfası
export default function AdminRestaurantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading, updateUserRole } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  const restaurantId = params?.id as string;

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Restoran detaylarını getir
  useEffect(() => {
    if (user && user.isAdmin && restaurantId) {
      fetchRestaurantDetail();
    }
  }, [user, restaurantId]);

  // Restoran detaylarını Firebase'den getir
  const fetchRestaurantDetail = async () => {
    try {
      setIsLoading(true);
      
      const userRef = doc(db, 'users', restaurantId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        toast.error('Restoran bulunamadı');
        router.push('/admin/restaurants');
        return;
      }

      const data = userSnap.data();
      const restaurantData: RestaurantDetail = {
        id: userSnap.id,
        email: data.email,
        displayName: data.displayName,
        phoneNumber: data.phoneNumber || 'Belirtilmemiş',
        restaurantName: data.restaurantName || data.displayName + ' Restaurant',
        role: data.role,
        isAdmin: data.isAdmin || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        status: data.status || 'active',
        address: data.address || 'Belirtilmemiş',
        description: data.description || 'Açıklama eklenmemiş',
        category: data.category || 'Genel',
        rating: data.rating || 0,
        totalOrders: data.totalOrders || 0,
        totalRevenue: data.totalRevenue || 0
      };
      
      setRestaurant(restaurantData);
    } catch (error) {
      console.error('Restoran detayları yüklenirken hata:', error);
      toast.error('Restoran detayları yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Restoran durumunu değiştir
  const toggleRestaurantStatus = async () => {
    if (!restaurant) return;
    
    const newStatus = restaurant.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'etkinleştir' : 'pasif hale getir';
    
    if (!confirm(`${restaurant.restaurantName} restoranını ${action}mek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      
      const userRef = doc(db, 'users', restaurantId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      
      setRestaurant(prev => prev ? { ...prev, status: newStatus as any, updatedAt: new Date() } : null);
      toast.success(`${restaurant.restaurantName} restoranı ${newStatus === 'active' ? 'etkinleştirildi' : 'pasif hale getirildi'}`);
      
    } catch (error) {
      console.error('Restoran durumu değiştirme hatası:', error);
      toast.error('Durum değiştirme sırasında hata oluştu');
    } finally {
      setIsProcessing(false);
    }
  };

  // Restoran rolünü kaldır (müşteri yap)
  const revokeRestaurantRole = async () => {
    if (!restaurant) return;
    
    if (!confirm(`${restaurant.restaurantName} restoranının yetkilerini kaldırıp normal müşteri yapmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setIsProcessing(true);
      
      const result = await updateUserRole(restaurantId, 'customer');
      
      if (result.success) {
        toast.success('Restoran yetkileri başarıyla kaldırıldı');
        router.push('/admin/restaurants');
      } else {
        toast.error(result.error || 'Yetki kaldırma sırasında hata oluştu');
      }
    } catch (error) {
      console.error('Restoran yetkisi kaldırma hatası:', error);
      toast.error('Beklenmeyen bir hata oluştu');
    } finally {
      setIsProcessing(false);
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
            <p className="text-gray-600">Restoran detayları yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Yetkisiz erişim
  if (!user || !user.isAdmin) {
    return null;
  }

  // Restoran bulunamadı
  if (!restaurant) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Restoran bulunamadı</h3>
            <p className="text-gray-600 mb-6">Belirtilen restoran mevcut değil veya silinmiş olabilir.</p>
            <Link href="/admin/restaurants" className="btn-primary">
              Restoran Listesine Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Başlık ve Geri Dön */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Link 
                href="/admin/restaurants" 
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Restoran Detayları
              </h1>
            </div>

            {/* Restoran Başlık Bilgileri */}
            <div className="card p-6 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={`rounded-2xl p-4 ${
                    restaurant.status === 'active' 
                      ? 'bg-gradient-to-r from-green-500 to-green-600' 
                      : restaurant.status === 'inactive'
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                      : 'bg-gradient-to-r from-red-500 to-red-600'
                  }`}>
                    <Store className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {restaurant.restaurantName}
                    </h2>
                    <div className="flex items-center gap-4 mb-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        restaurant.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : restaurant.status === 'inactive'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {restaurant.status === 'active' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aktif
                          </>
                        ) : restaurant.status === 'inactive' ? (
                          <>
                            <Clock className="h-4 w-4 mr-1" />
                            Pasif
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Askıya Alınmış
                          </>
                        )}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        restaurant.role === 'restaurant' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {restaurant.role === 'restaurant' ? 'Restoran Sahibi' : 'Müşteri'}
                      </span>
                    </div>
                    <p className="text-gray-600">
                      Katılım: {restaurant.createdAt.toLocaleDateString('tr-TR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                {/* Eylem Butonları */}
                <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                  <button
                    onClick={toggleRestaurantStatus}
                    disabled={isProcessing}
                    className={`btn-outline flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      restaurant.status === 'active'
                        ? 'border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white'
                        : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="spinner h-4 w-4"></div>
                    ) : restaurant.status === 'active' ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    {restaurant.status === 'active' ? 'Pasif Yap' : 'Aktif Yap'}
                  </button>

                  {restaurant.role === 'restaurant' && (
                    <button
                      onClick={revokeRestaurantRole}
                      disabled={isProcessing}
                      className="btn-outline border-red-600 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <div className="spinner h-4 w-4"></div>
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                      Yetkileri Kaldır
                    </button>
                  )}

                  <Link
                    href="/restaurant"
                    target="_blank"
                    className="btn-primary flex items-center justify-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Panel
                  </Link>
                </div>
              </div>
            </div>

            {/* Tab Navigasyonu */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <User className="h-4 w-4 mr-2 inline" />
                  Temel Bilgiler
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'activity'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2 inline" />
                  Aktivite
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'stats'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <DollarSign className="h-4 w-4 mr-2 inline" />
                  İstatistikler
                </button>
              </nav>
            </div>
          </div>

          {/* Tab İçerikleri */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* İletişim Bilgileri */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary-600" />
                  İletişim Bilgileri
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yetkili Kişi
                    </label>
                    <p className="text-gray-900">{restaurant.displayName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-posta Adresi
                    </label>
                    <p className="text-gray-900">{restaurant.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon Numarası
                    </label>
                    <p className="text-gray-900">{restaurant.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adres
                    </label>
                    <p className="text-gray-900">{restaurant.address}</p>
                  </div>
                </div>
              </div>

              {/* Restoran Bilgileri */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary-600" />
                  Restoran Bilgileri
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restoran Adı
                    </label>
                    <p className="text-gray-900">{restaurant.restaurantName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <p className="text-gray-900">{restaurant.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <p className="text-gray-900">{restaurant.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Değerlendirme
                    </label>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span className="text-gray-900">{(restaurant.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hesap Bilgileri */}
              <div className="card p-6 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary-600" />
                  Hesap Bilgileri
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kayıt Tarihi
                    </label>
                    <p className="text-gray-900">
                      {restaurant.createdAt.toLocaleDateString('tr-TR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Son Güncelleme
                    </label>
                    <p className="text-gray-900">
                      {restaurant.updatedAt.toLocaleDateString('tr-TR', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kullanıcı ID
                    </label>
                    <p className="text-gray-900 font-mono text-sm">{restaurant.id}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary-600" />
                Son Aktiviteler
              </h3>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aktivite geçmişi özelliği geliştirme aşamasında...</p>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* İstatistik Kartları */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Toplam Sipariş</p>
                    <p className="text-2xl font-bold text-gray-900">{restaurant.totalOrders}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Toplam Gelir</p>
                    <p className="text-2xl font-bold text-gray-900">₺{restaurant.totalRevenue}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Değerlendirme</p>
                    <p className="text-2xl font-bold text-gray-900">{(restaurant.rating || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-3">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Grafik Alanı */}
              <div className="card p-6 lg:col-span-3">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Satış Analizi</h4>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Detaylı analiz özellikleri geliştirme aşamasında...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 