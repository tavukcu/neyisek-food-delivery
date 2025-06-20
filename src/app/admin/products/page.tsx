'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { collection, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Product, Category, RestaurantInfo } from '@/types';
import { RestaurantService } from '@/services/restaurantService';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Package,
  AlertTriangle,
  TrendingUp,
  Grid,
  List,
  ExternalLink,
  Store
} from 'lucide-react';
import Link from 'next/link';

// Ürün listeleme sayfası komponenti
export default function ProductsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Verileri yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadData();
    }
  }, [user]);

  // Filtreleme ve arama
  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory, selectedRestaurant, statusFilter, sortBy]);

  // Kategorileri ve ürünleri yükle
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadCategories(), loadProducts(), loadRestaurants()]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Kategorileri yükle
  const loadCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData: Category[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categoriesData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          icon: data.icon,
          imageUrl: data.imageUrl || '',
          isActive: data.isActive,
          sortOrder: data.sortOrder || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      categoriesData.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    }
  };

  // Restoranları yükle
  const loadRestaurants = async () => {
    try {
      const restaurantsData = await RestaurantService.getAllRestaurants();
      setRestaurants(restaurantsData);
    } catch (error) {
      console.error('Restoranlar yüklenirken hata:', error);
    }
  };

  // Ürünleri yükle
  const loadProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData: Product[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          restaurantId: data.restaurantId || '',
          name: data.name,
          description: data.description,
          price: data.price,
          categoryId: data.categoryId,
          imageUrl: data.imageUrl || '',
          images: data.images || [],
          variants: data.variants || [],
          ingredients: data.ingredients || [],
          allergens: data.allergens || [],
          tags: data.tags || [],
          isVegetarian: data.isVegetarian || false,
          isVegan: data.isVegan || false,
          isGlutenFree: data.isGlutenFree || false,
          preparationTime: data.preparationTime || 15,
          calories: data.calories || 0,
          stock: data.stock || 0,
          minStock: data.minStock || 10,
          maxStock: data.maxStock || 9999,
          rating: data.rating || 0,
          reviewCount: data.reviewCount || 0,
          isPopular: data.isPopular || false,
          isFeatured: data.isFeatured || false,
          isActive: data.isActive || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      setProducts(productsData);
    } catch (error) {
      console.error('Ürünler yüklenirken hata:', error);
    }
  };

  // Ürünleri filtrele
  const filterProducts = () => {
    let filtered = [...products];

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Kategori filtresi
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Restoran filtresi
    if (selectedRestaurant) {
      filtered = filtered.filter(product => product.restaurantId === selectedRestaurant);
    }

    // Durum filtresi
    switch (statusFilter) {
      case 'active':
        filtered = filtered.filter(product => product.isActive);
        break;
      case 'inactive':
        filtered = filtered.filter(product => !product.isActive);
        break;
      case 'popular':
        filtered = filtered.filter(product => product.isPopular);
        break;
      case 'featured':
        filtered = filtered.filter(product => product.isFeatured);
        break;
      case 'low-stock':
        filtered = filtered.filter(product => product.stock <= product.minStock);
        break;
    }

    // Sıralama
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'stock':
        filtered.sort((a, b) => b.stock - a.stock);
        break;
      case 'created':
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredProducts(filtered);
  };

  // Ürün durumunu değiştir
  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'products', productId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });

      setProducts(prev => prev.map(product =>
        product.id === productId
          ? { ...product, isActive: !currentStatus }
          : product
      ));

      toast.success(`Ürün ${!currentStatus ? 'aktif' : 'pasif'} edildi`);
    } catch (error) {
      console.error('Ürün durumu güncellenirken hata:', error);
      toast.error('Ürün durumu güncellenirken bir hata oluştu');
    }
  };

  // Ürün sil
  const deleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success('Ürün başarıyla silindi');
    } catch (error) {
      console.error('Ürün silinirken hata:', error);
      toast.error('Ürün silinirken bir hata oluştu');
    }
  };

  // Kategori adını getir
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Bilinmeyen Kategori';
  };

  // Restoran adını getir
  const getRestaurantName = (restaurantId: string) => {
    const restaurant = restaurants.find(rest => rest.id === restaurantId);
    return restaurant ? restaurant.name : 'Bilinmeyen Restoran';
  };

  // Stok durumu kontrolü
  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100' };
    if (product.stock <= product.minStock) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100' };
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Ürünler yükleniyor...</p>
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
          {/* Başlık ve Yeni Ürün Butonu */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Ürün Yönetimi
              </h1>
              <p className="text-gray-600">
                Menünüzdeki ürünleri yönetin ve düzenleyin
              </p>
            </div>
            <Link
              href="/admin/products/add"
              className="btn-primary flex items-center gap-2 mt-4 md:mt-0"
            >
              <Plus className="h-4 w-4" />
              Yeni Ürün Ekle
            </Link>
          </div>

          {/* İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Ürün</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Ürün</p>
                  <p className="text-2xl font-bold text-green-600">
                    {products.filter(p => p.isActive).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Popüler Ürün</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {products.filter(p => p.isPopular).length}
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Düşük Stok</p>
                  <p className="text-2xl font-bold text-red-600">
                    {products.filter(p => p.stock <= p.minStock).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Filtreler ve Arama */}
          <div className="card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Arama */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>

              {/* Kategori Filtresi */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="form-input"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Restoran Filtresi */}
              <div>
                <select
                  value={selectedRestaurant}
                  onChange={(e) => setSelectedRestaurant(e.target.value)}
                  className="form-input"
                >
                  <option value="">Tüm Restoranlar</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Durum Filtresi */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Tüm Durumlar</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="popular">Popüler</option>
                  <option value="featured">Öne Çıkan</option>
                  <option value="low-stock">Düşük Stok</option>
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
                  <option value="price">Fiyata Göre</option>
                  <option value="stock">Stoka Göre</option>
                  <option value="created">Tarihe Göre</option>
                  <option value="rating">Puana Göre</option>
                </select>
              </div>
            </div>

            {/* Görünüm Modu ve Sonuç Sayısı */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} ürün gösteriliyor
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Ürün Listesi */}
          {filteredProducts.length === 0 ? (
            <div className="card p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ürün Bulunamadı</h3>
              <p className="text-gray-600 mb-6">
                {products.length === 0 
                  ? 'Henüz hiç ürün eklenmemiş.'
                  : 'Arama kriterlerinize uygun ürün bulunamadı.'
                }
              </p>
              {products.length === 0 && (
                <Link href="/admin/products/add" className="btn-primary">
                  İlk Ürününüzü Ekleyin
                </Link>
              )}
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
            }>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                
                if (viewMode === 'grid') {
                  return (
                    <div key={product.id} className="card overflow-hidden">
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
                            <Package className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Durum Rozetleri */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {!product.isActive && (
                            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                              Pasif
                            </span>
                          )}
                          {product.isPopular && (
                            <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              Popüler
                            </span>
                          )}
                          {product.isFeatured && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                              Öne Çıkan
                            </span>
                          )}
                        </div>

                        {/* Stok Durumu */}
                        <div className="absolute top-2 right-2">
                          <span className={`${stockStatus.bg} ${stockStatus.color} text-xs px-2 py-1 rounded`}>
                            {product.stock} adet
                          </span>
                        </div>
                      </div>

                      {/* Ürün Bilgileri */}
                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-primary-600">₺{product.price}</span>
                          <div className="text-right">
                            <span className="text-sm text-gray-500 block">
                              {getCategoryName(product.categoryId)}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Store className="h-3 w-3" />
                              {getRestaurantName(product.restaurantId)}
                            </span>
                          </div>
                        </div>

                        {/* Varyantlar */}
                        {product.variants.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-500 mb-1">{product.variants.length} varyant</p>
                            <div className="flex flex-wrap gap-1">
                              {product.variants.slice(0, 3).map((variant) => (
                                <span key={variant.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {variant.name}: ₺{variant.price}
                                </span>
                              ))}
                              {product.variants.length > 3 && (
                                <span className="text-xs text-gray-500">+{product.variants.length - 3} daha</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Etiketler */}
                        {product.tags.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {product.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Aksiyon Butonları */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleProductStatus(product.id, product.isActive)}
                              className={`p-2 rounded-lg ${product.isActive 
                                ? 'text-green-600 hover:bg-green-100' 
                                : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={product.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                            >
                              {product.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <Link
                              href={`/admin/products/view/${product.id}`}
                              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                              title="Görüntüle"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <Link
                              href={`/admin/products/edit/${product.id}`}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-100"
                              title="Düzenle"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => deleteProduct(product.id, product.name)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-100"
                              title="Sil"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {product.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-current" />
                              <span className="text-sm text-gray-600">
                                {product.rating.toFixed(1)} ({product.reviewCount})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Liste görünümü
                  return (
                    <div key={product.id} className="card p-4">
                      <div className="flex items-center gap-4">
                        {/* Ürün Resmi */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Ürün Bilgileri */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                              <p className="text-sm text-gray-600 truncate">{product.description}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-500">{getCategoryName(product.categoryId)}</span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Store className="h-3 w-3" />
                                  {getRestaurantName(product.restaurantId)}
                                </span>
                                <span className="text-lg font-bold text-primary-600">₺{product.price}</span>
                                <span className={`text-sm px-2 py-1 rounded ${stockStatus.bg} ${stockStatus.color}`}>
                                  {product.stock} adet
                                </span>
                              </div>
                            </div>

                            {/* Durum ve Aksiyon Butonları */}
                            <div className="flex items-center gap-2 ml-4">
                              {/* Durum Rozetleri */}
                              <div className="flex flex-col gap-1">
                                {!product.isActive && (
                                  <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded">Pasif</span>
                                )}
                                {product.isPopular && (
                                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">Popüler</span>
                                )}
                                {product.isFeatured && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">Öne Çıkan</span>
                                )}
                              </div>

                              {/* Aksiyon Butonları */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => toggleProductStatus(product.id, product.isActive)}
                                  className={`p-2 rounded-lg ${product.isActive 
                                    ? 'text-green-600 hover:bg-green-100' 
                                    : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                >
                                  {product.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </button>
                                <Link
                                  href={`/admin/products/view/${product.id}`}
                                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                                  title="Görüntüle"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/admin/products/edit/${product.id}`}
                                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-100"
                                >
                                  <Edit className="h-4 w-4" />
                                </Link>
                                <button
                                  onClick={() => deleteProduct(product.id, product.name)}
                                  className="p-2 rounded-lg text-red-600 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 