'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { ProductService } from '@/services/productService';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Upload,
  Star,
  ToggleLeft,
  ToggleRight,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { Product } from '@/types';
import { toast } from 'react-hot-toast';

// Gerçek menü ürünleri - Firebase'den yüklenecek
const useMenuProducts = (restaurantId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (restaurantId) {
      loadMenuProducts();
    } else {
      console.log('⚠️ Restaurant ID bulunamadı:', { restaurantId });
      setLoading(false);
      setProducts([]);
    }
  }, [restaurantId]);

  const loadMenuProducts = async () => {
    try {
      setLoading(true);
      
      if (!restaurantId) {
        console.warn('Restaurant ID not provided');
        setProducts([]);
        return;
      }

      console.log('🔄 Restoran ürünleri yükleniyor, Restaurant ID:', restaurantId);
      
      // Firebase'den tüm ürünleri yükle (aktif + pasif)
      const allProducts = await ProductService.getAllProductsByRestaurant(restaurantId);
      console.log('📦 Yüklenen ürünler:', allProducts);
      
      setProducts(allProducts || []);
      
    } catch (error) {
      console.error('❌ Menü ürünleri yüklenirken hata:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, loadMenuProducts };
};

const categories = ['Tümü', 'Pizza', 'Döner', 'Burger', 'Pide & Lahmacun', 'Izgara'];

export default function RestaurantMenuPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { products, loading: productsLoading, loadMenuProducts } = useMenuProducts(user?.restaurantId);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Tümü');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debug logging
  useEffect(() => {
    console.log('🔍 RestaurantMenuPage - User data:', {
      userId: user?.uid,
      userRole: user?.role,
      restaurantId: user?.restaurantId,
      authLoading,
      productsLoading,
      hasUser: !!user
    });
  }, [user, authLoading, productsLoading]);

  // Yetkilendirme kontrolü (daha esnek)
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        console.log('🚫 No user found - redirecting to account');
        router.push('/account');
      } else if (user.role !== 'restaurant') {
        console.log('🚫 User is not restaurant - redirecting to home');
        router.push('/');
      }
    }
  }, [user, authLoading, router]);

  // Loading durumu - sadece auth yükleniyorsa göster
  if (authLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Kimlik doğrulanıyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // User kontrolü
  if (!user) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Giriş Yapmanız Gerekiyor
            </h3>
            <p className="text-gray-600 mb-6">
              Bu sayfaya erişmek için giriş yapmanız gerekiyor.
            </p>
            <button 
              onClick={() => router.push('/account')}
              className="btn-primary"
            >
              Giriş Yap
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (user.role !== 'restaurant') {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Yetkisiz Erişim
            </h3>
            <p className="text-gray-600 mb-6">
              Bu sayfa sadece restoran sahipleri için erişilebilir.
            </p>
            <button 
              onClick={() => router.push('/')}
              className="btn-primary"
            >
              Ana Sayfaya Dön
            </button>
          </div>
        </div>
      </main>
    );
  }

  // RestaurantId yoksa uyarı göster ama sayfayı render et
  if (!user.restaurantId) {
    console.log('⚠️ Restaurant ID not found for user:', user.uid);
    // RestaurantId yoksa boş menü göster
  }

  // Ürün durumu değiştirme
  const toggleProductStatus = async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newStatus = !product.isActive;
      await ProductService.updateProduct(productId, { isActive: newStatus });
      
      toast.success(`Ürün ${newStatus ? 'aktif' : 'pasif'} hale getirildi`);
      loadMenuProducts();
    } catch (error) {
      console.error('Ürün durumu güncellenirken hata:', error);
      toast.error('Ürün durumu güncellenemedi');
    }
  };

  // Ürün silme
  const deleteProduct = async (productId: string) => {
    if (!window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await ProductService.deleteProduct(productId);
      toast.success('Ürün başarıyla silindi');
      loadMenuProducts();
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
      toast.error('Ürün silinemedi');
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesCategory = categoryFilter === 'Tümü' || product.categoryId === categoryFilter;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    return matchesCategory && matchesSearch && matchesStatus;
  });

  return (
    <main>
      <Header />
      
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Başlık ve Eylemler */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Menü Yönetimi
                </h1>
                <p className="text-gray-600">
                  Ürünlerinizi ekleyin, düzenleyin ve yönetin
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link 
                  href="/restaurant" 
                  className="btn-outline flex items-center gap-2"
                >
                  Panele Dön
                </Link>
                <Link 
                  href="/restaurant/menu/add" 
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Ürün Ekle
                </Link>
              </div>
            </div>

            {/* Arama ve Filtreler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Arama */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Ürün adı veya açıklama..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Kategori Filtresi */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Kategori Butonları */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    categoryFilter === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Ürünler Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  {/* Ürün Resmi */}
                  <div className="relative h-48 bg-gray-200">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Durum Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>

                    {/* Fiyat Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-bold">
                        ₺{product.price}
                      </span>
                    </div>
                  </div>

                  {/* Ürün Bilgileri */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {product.description}
                      </p>
                    </div>

                    {/* Kategori ve Hazırlık Süresi */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {product.categoryId}
                      </span>
                      <span className="text-xs text-gray-600">
                        {product.preparationTime} dk
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">
                          {product.rating}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600">
                        ({product.reviewCount} değerlendirme)
                      </span>
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {product.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Eylemler */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleProductStatus(product.id)}
                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                          product.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        {product.isActive ? (
                          <ToggleRight className="h-4 w-4" />
                        ) : (
                          <ToggleLeft className="h-4 w-4" />
                        )}
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </button>

                      <Link
                        href={`/restaurant/menu/edit/${product.id}`}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                        Düzenle
                      </Link>

                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                        Sil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ürün bulunamadı
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || categoryFilter !== 'Tümü' 
                  ? 'Arama kriterleri ile eşleşen ürün bulunamadı.'
                  : 'Henüz ürün eklenmemiş.'
                }
              </p>
              <Link 
                href="/restaurant/menu/add" 
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                İlk Ürününüzü Ekleyin
              </Link>
            </div>
          )}

          {/* İstatistikler */}
          {filteredProducts.length > 0 && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6 text-center">
                <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-primary-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                <p className="text-sm text-gray-600">Toplam Ürün</p>
              </div>

              <div className="card p-6 text-center">
                <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <ToggleRight className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => p.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Aktif Ürün</p>
              </div>

              <div className="card p-6 text-center">
                <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {(products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1)}
                </p>
                <p className="text-sm text-gray-600">Ortalama Puan</p>
              </div>

              <div className="card p-6 text-center">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ₺{(products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(0)}
                </p>
                <p className="text-sm text-gray-600">Ortalama Fiyat</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 