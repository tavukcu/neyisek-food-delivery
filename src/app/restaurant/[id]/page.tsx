'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { RestaurantService } from '@/services/restaurantService';
import { ProductService } from '@/services/productService';
import { CategoryService } from '@/services/categoryService';
import { useCart } from '@/hooks/useCart';
import { 
  MapPin, 
  Clock, 
  Star, 
  Phone, 
  Mail, 
  Search, 
  Filter, 
  Plus, 
  Minus, 
  ShoppingCart,
  ChefHat,
  Users,
  Award,
  DollarSign,
  Package,
  Truck,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { RestaurantInfo, Product, Category } from '@/types';
import { toast } from 'react-hot-toast';
import RestaurantStatusBadge from '@/components/RestaurantStatusBadge';
import OrderButton from '@/components/OrderButton';

export default function RestaurantDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // States
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');

  const restaurantId = params?.id as string;

  const { 
    cartItems,
    addToCart: addToCartGlobal, 
    updateQuantity, 
    getItemQuantity,
    total: cartTotal,
    totalItems: cartItemCount
  } = useCart();

  // Restaurant ve menü verilerini yükle
  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  const loadRestaurantData = async () => {
    try {
      setIsLoading(true);
      
      // Restaurant bilgilerini yükle
      const restaurantData = await RestaurantService.getRestaurant(restaurantId);
      
      if (!restaurantData) {
        toast.error('Restoran bulunamadı');
        router.push('/');
        return;
      }

      setRestaurant(restaurantData);

      // Menü ürünlerini yükle
      const productsData = await ProductService.getProductsByRestaurant(restaurantId);
      setProducts(productsData.filter(product => product.isActive));

      // Kategorileri yükle
      const categoriesData = await CategoryService.getAllCategories();
      setCategories(categoriesData.filter(cat => cat.isActive));

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Sepete ürün ekle
  const addToCart = (product: Product) => {
    // Global sepet hook'unu kullan
    addToCartGlobal(product, 1);
    toast.success(`${product.name} sepete eklendi`);
  };

  // Sepetten ürün çıkar
  const removeFromCart = (productId: string) => {
    const currentQuantity = getItemQuantity(productId);
    if (currentQuantity > 0) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  // Filtrelenmiş ürünler
  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Restoran yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!restaurant) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Restoran Bulunamadı</h1>
            <p className="text-gray-600 mb-6">Aradığınız restoran mevcut değil.</p>
            <Link href="/" className="btn-primary">
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      
      {/* Restaurant Header */}
      <section className="bg-white border-b">
        <div className="container-responsive py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Restaurant Info */}
            <div className="lg:col-span-2">
              <div className="flex items-start gap-6">
                {/* Logo */}
                <div className="w-24 h-24 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ChefHat className="h-8 w-8 text-gray-400" />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {restaurant.name}
                  </h1>
                  
                  <p className="text-gray-600 mb-4">
                    {restaurant.description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{restaurant.rating}</span>
                      <span className="text-gray-600">({restaurant.reviewCount} değerlendirme)</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{restaurant.estimatedDeliveryTime} dk</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{restaurant.address.district}, {restaurant.address.city}</span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-600">
                      <Truck className="h-4 w-4" />
                      <span>Min. ₺{restaurant.minimumOrderAmount}</span>
                    </div>
                  </div>

                  {/* Restaurant Status and Features */}
                  <div className="flex flex-wrap gap-3 mt-4">
                    <RestaurantStatusBadge 
                      restaurant={restaurant} 
                      variant="default"
                    />
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium border border-blue-200">
                      Online Sipariş
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sipariş Bilgileri
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Teslimat Ücreti:</span>
                  <span className="font-medium">₺{restaurant.deliveryFee}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Min. Sipariş:</span>
                  <span className="font-medium">₺{restaurant.minimumOrderAmount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Teslimat Süresi:</span>
                  <span className="font-medium">{restaurant.estimatedDeliveryTime} dk</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Ödeme Yöntemleri
                </h4>
                <div className="flex gap-2">
                  <div className="p-2 bg-gray-100 rounded">
                    <CreditCard className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="p-2 bg-gray-100 rounded">
                    <span className="text-xs font-medium text-gray-600">Nakit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white border-b sticky top-0 z-10">
        <div className="container-responsive">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'menu'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Menü
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Bilgiler
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Değerlendirmeler
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {activeTab === 'menu' && (
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
              {/* Menu Content */}
              <div className="xl:col-span-3">
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Ürün ara..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Category Filter */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="pl-10 pr-8 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                      >
                        <option value="">Tüm Kategoriler</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Category Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                        selectedCategory === ''
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Tümü
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                          selectedCategory === category.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                {filteredProducts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="card p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          {/* Product Image */}
                          <div className="w-full sm:w-32 h-48 sm:h-32 bg-gray-200 rounded-lg flex-shrink-0">
                            {product.images && product.images.length > 0 ? (
                              <img 
                                src={product.images[0].url} 
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                                {product.name}
                              </h3>
                              <span className="text-xl sm:text-2xl font-bold text-primary-600 flex-shrink-0">
                                ₺{product.price}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base break-words">
                              {product.description}
                            </p>

                            {/* Tags */}
                            {product.tags && product.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                                {product.tags.map((tag, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs sm:text-sm"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Add to Cart */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                <span>{product.preparationTime || 15} dk</span>
                              </div>

                              {getItemQuantity(product.id) > 0 ? (
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => removeFromCart(product.id)}
                                    className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="font-medium text-lg min-w-[2rem] text-center">
                                    {getItemQuantity(product.id)}
                                  </span>
                                  <button
                                    onClick={() => addToCart(product)}
                                    className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(product)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
                                >
                                  <Plus className="h-4 w-4" />
                                  Sepete Ekle
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Ürün Bulunamadı
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || selectedCategory 
                        ? 'Arama kriterlerine uygun ürün bulunamadı.'
                        : 'Bu restoran henüz menüsünü eklemiyor.'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Cart Sidebar */}
              {cartItemCount > 0 && (
                <div className="xl:col-span-1">
                  <div className="card p-6 sticky top-24">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Sepetim ({cartItemCount})
                    </h3>

                    <div className="space-y-3 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {item.product.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              ₺{item.product.price} x {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="font-medium text-sm min-w-[1.5rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => addToCart(item.product)}
                              className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center hover:bg-primary-200 transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-medium text-gray-900">Toplam:</span>
                        <span className="text-lg font-bold text-gray-900">₺{cartTotal.toFixed(2)}</span>
                      </div>
                      
                      <Link href="/cart" className="btn-primary w-full block text-center">
                        Siparişi Tamamla
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Restaurant Info Tab */}
          {activeTab === 'info' && (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    İletişim Bilgileri
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Adres</p>
                        <p className="text-gray-600">
                          {restaurant.address.street}, {restaurant.address.district}, {restaurant.address.city}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">Telefon</p>
                        <p className="text-gray-600">{restaurant.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Çalışma Saatleri
                  </h3>
                  <div className="space-y-2">
                    {restaurant.workingHours && Object.entries(restaurant.workingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{day}</span>
                        <span className="font-medium text-gray-900">
                          {hours.isOpen ? `${hours.open} - ${hours.close}` : 'Kapalı'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className="max-w-4xl">
              <div className="text-center py-16">
                <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Henüz Değerlendirme Yok
                </h3>
                <p className="text-gray-600">
                  Bu restoran için henüz değerlendirme bulunmuyor.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Cart Button (Mobile) */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-4 right-4 xl:hidden z-50">
          <button className="bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            </div>
          </button>
        </div>
      )}
    </main>
  );
} 