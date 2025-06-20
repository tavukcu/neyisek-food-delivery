'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { RestaurantService } from '@/services/restaurantService';
import { RestaurantInfo } from '@/types';
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
  Edit
} from 'lucide-react';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

// Admin restoran listesi sayfası
export default function AdminRestaurantListPage() {
  const router = useRouter();
  const { user, loading, updateUserRole } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantInfo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Restoranları getir
  useEffect(() => {
    if (user && user.isAdmin) {
      fetchRestaurants();
    }
  }, [user]);

  // Tüm restoranları Firebase'den getir - restaurants koleksiyonundan
  const fetchRestaurants = async () => {
    try {
      setIsLoading(true);
      
      // RestaurantService kullanarak tüm restoranları getir
      const restaurantList = await RestaurantService.getAllRestaurants();
      
      console.log('🏪 Admin: Toplam restoran sayısı:', restaurantList.length);
      restaurantList.forEach(restaurant => {
        console.log('🏪 Restoran:', {
          id: restaurant.id,
          name: restaurant.name,
          isOpen: restaurant.isOpen,
          categoryIds: restaurant.categoryIds?.length || 0
        });
      });

      // En yeni oluşturulan restoranları üstte göster
      restaurantList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setRestaurants(restaurantList);
      setFilteredRestaurants(restaurantList);
    } catch (error) {
      console.error('Restoranlar yüklenirken hata:', error);
      toast.error('Restoranlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = restaurants;

    // Arama
    if (searchTerm) {
      filtered = filtered.filter(restaurant => 
        restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        restaurant.address.district.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Durum filtresi
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(restaurant => restaurant.isOpen === true);
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(restaurant => restaurant.isOpen === false);
      }
    }

    setFilteredRestaurants(filtered);
  }, [searchTerm, filterStatus, restaurants]);

  // Restoran durumunu değiştir
  const toggleRestaurantStatus = async (restaurantId: string, currentStatus: boolean, restaurantName: string) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'açık hale getir' : 'kapat';
    
    if (!confirm(`${restaurantName} restoranını ${action}mek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setProcessingIds(prev => [...prev, restaurantId]);
      
      // RestaurantService kullanarak güncelle
      await RestaurantService.updateRestaurant(restaurantId, {
        isOpen: newStatus
      });
      
      toast.success(`${restaurantName} restoranı ${newStatus ? 'açıldı' : 'kapatıldı'}`);
      await fetchRestaurants(); // Listeyi güncelle
      
    } catch (error) {
      console.error('Restoran durumu değiştirme hatası:', error);
      toast.error('Durum değiştirme sırasında hata oluştu');
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== restaurantId));
    }
  };

  // Restoran sayıları
  const activeCount = restaurants.filter(r => r.isOpen === true).length;
  const inactiveCount = restaurants.filter(r => r.isOpen === false).length;

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Restoranlar yükleniyor...</p>
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
      <Header />
      
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Başlık ve Geri Dön */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Link 
                    href="/admin/restaurants" 
                    className="btn-outline flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Geri Dön
                  </Link>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Store className="h-8 w-8 text-primary-600" />
                  Restoran Listesi
                </h1>
                <p className="text-gray-600 mt-2">
                  Sistemdeki tüm restoranları görüntüleyin ve yönetin
                </p>
              </div>
              
              {/* İstatistikler */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                  <div className="text-sm text-green-600">Açık Restoran</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
                  <div className="text-sm text-red-600">Kapalı Restoran</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center col-span-2 lg:col-span-1">
                  <div className="text-2xl font-bold text-blue-600">{restaurants.length}</div>
                  <div className="text-sm text-blue-600">Toplam Restoran</div>
                </div>
              </div>
            </div>

            {/* Arama ve Filtreler */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Arama */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Restoran adı, e-posta veya şehir ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>

                {/* Durum Filtresi */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="form-select pl-10"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="active">Açık Restoranlar</option>
                    <option value="inactive">Kapalı Restoranlar</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Restoran Listesi */}
          <div className="space-y-4">
            {filteredRestaurants.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'Aradığınız kriterlere uygun restoran bulunamadı' : 'Henüz onaylanmış restoran yok'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' ? 'Farklı filtreler deneyebilirsiniz.' : 'Onaylandıkça restoranlar burada görünecektir.'}
                </p>
              </div>
            ) : (
              filteredRestaurants.map((restaurant) => (
                <div
                  key={restaurant.id}
                  className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Restoran Bilgileri */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="bg-primary-50 rounded-lg p-3 flex-shrink-0">
                        <Store className="h-6 w-6 text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {restaurant.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {restaurant.description}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {restaurant.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {restaurant.phone}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {restaurant.address.district}, {restaurant.address.city}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4" />
                                {restaurant.rating} ({restaurant.reviewCount} değerlendirme)
                              </div>
                            </div>
                          </div>
                          
                          {/* Durum Badge */}
                          <div className="flex-shrink-0">
                            {restaurant.isOpen ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                Açık
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                <XCircle className="h-4 w-4" />
                                Kapalı
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Kategoriler */}
                        {restaurant.categoryIds && restaurant.categoryIds.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Package className="h-4 w-4" />
                              <span>{restaurant.categoryIds.length} kategori</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Tarihler */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Oluşturuldu: {restaurant.createdAt.toLocaleDateString('tr-TR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Güncellendi: {restaurant.updatedAt.toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Eylemler */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Düzenle */}
                      <Link
                        href={`/admin/restaurants/${restaurant.id}/edit`}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </Link>

                      {/* Durum Değiştir */}
                      <button
                        onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.isOpen, restaurant.name)}
                        disabled={processingIds.includes(restaurant.id)}
                        className={`
                          px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
                          ${restaurant.isOpen
                            ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                          }
                          ${processingIds.includes(restaurant.id) ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {processingIds.includes(restaurant.id) ? (
                          <div className="spinner w-4 h-4"></div>
                        ) : restaurant.isOpen ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        {restaurant.isOpen ? 'Kapat' : 'Aç'}
                      </button>

                      {/* Detay Görüntüle */}
                      <Link
                        href={`/admin/restaurants/${restaurant.id}`}
                        className="btn-outline flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Detay
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sayfalama (gelecekte kullanım için) */}
          {filteredRestaurants.length > 0 && (
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Toplam {filteredRestaurants.length} restoran gösteriliyor
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 