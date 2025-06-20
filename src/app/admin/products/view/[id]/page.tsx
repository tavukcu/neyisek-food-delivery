'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Category, Product } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit,
  Eye,
  EyeOff,
  Star,
  Package,
  Clock,
  Flame,
  Users,
  Tag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader,
  Calendar,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

// Ürün detay görüntüleme sayfası komponenti
export default function ViewProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user, loading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Verileri yükle
  useEffect(() => {
    if (user && user.isAdmin && productId) {
      loadProduct();
    }
  }, [user, productId]);

  // Ürün verilerini yükle
  const loadProduct = async () => {
    setIsLoading(true);
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        toast.error('Ürün bulunamadı');
        router.push('/admin/products');
        return;
      }

      const data = productDoc.data();
      const productData: Product = {
        id: productDoc.id,
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
      };

      setProduct(productData);

      // Kategori bilgisini yükle
      if (data.categoryId) {
        const categoryDoc = await getDoc(doc(db, 'categories', data.categoryId));
        if (categoryDoc.exists()) {
          const categoryData = categoryDoc.data();
          setCategory({
            id: categoryDoc.id,
            name: categoryData.name,
            description: categoryData.description,
            icon: categoryData.icon,
            imageUrl: categoryData.imageUrl || '',
            isActive: categoryData.isActive,
            sortOrder: categoryData.sortOrder || 0,
            createdAt: categoryData.createdAt?.toDate() || new Date(),
            updatedAt: categoryData.updatedAt?.toDate() || new Date(),
          });
        }
      }

    } catch (error) {
      console.error('Ürün yüklenirken hata:', error);
      toast.error('Ürün yüklenirken bir hata oluştu');
      router.push('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  // Stok durumu kontrolü
  const getStockStatus = (product: Product) => {
    if (product.stock === 0) return { status: 'out', color: 'text-red-600', bg: 'bg-red-100', text: 'Stokta Yok' };
    if (product.stock <= product.minStock) return { status: 'low', color: 'text-yellow-600', bg: 'bg-yellow-100', text: 'Düşük Stok' };
    return { status: 'good', color: 'text-green-600', bg: 'bg-green-100', text: 'Stokta Var' };
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Ürün bilgileri yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Yetkisiz erişim
  if (!user || !user.isAdmin) {
    return null;
  }

  // Ürün bulunamadı
  if (!product) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ürün Bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız ürün mevcut değil.</p>
            <Link href="/admin/products" className="btn-primary">
              Ürünlere Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const stockStatus = getStockStatus(product);

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Sayfa İçeriği */}
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Geri Dön ve Düzenle Butonları */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/admin/products" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Ürünlere Dön
            </Link>
            <Link
              href={`/admin/products/edit/${product.id}`}
              className="btn-primary flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Düzenle
            </Link>
          </div>

          {/* Başlık ve Durum */}
          <div className="mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-gray-600 mb-4">
                  {product.description}
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-primary-600">₺{product.price}</span>
                  {category && (
                    <span className="text-gray-600">
                      {category.icon} {category.name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {/* Durum Rozetleri */}
                <div className="flex items-center gap-2">
                  {product.isActive ? (
                    <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <Eye className="h-3 w-3" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      <EyeOff className="h-3 w-3" />
                      Pasif
                    </span>
                  )}
                  {product.isPopular && (
                    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      <TrendingUp className="h-3 w-3" />
                      Popüler
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                      <Star className="h-3 w-3" />
                      Öne Çıkan
                    </span>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${stockStatus.bg} ${stockStatus.color}`}>
                  <Package className="h-3 w-3" />
                  {stockStatus.text}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol Kolon - Ana Bilgiler */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Resim Galerisi */}
              {product.images.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Ürün Resimleri</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.images.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                        {image.isPrimary && (
                          <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                            Ana Resim
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Varyantlar */}
              {product.variants.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Ürün Varyantları</h2>
                  <div className="space-y-3">
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-gray-900">{variant.name}</span>
                          <span className="text-primary-600 font-semibold">₺{variant.price}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-gray-600">Stok: {variant.stock}</span>
                          {variant.isActive ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Malzemeler ve Alerjenler */}
              {(product.ingredients.length > 0 || product.allergens.length > 0) && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Malzemeler ve Alerjenler</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Malzemeler */}
                    {product.ingredients.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Malzemeler</h3>
                        <div className="flex flex-wrap gap-2">
                          {product.ingredients.map((ingredient, index) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Alerjenler */}
                    {product.allergens.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">Alerjenler</h3>
                        <div className="flex flex-wrap gap-2">
                          {product.allergens.map((allergen, index) => (
                            <span
                              key={index}
                              className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                            >
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Arama Etiketleri */}
              {product.tags.length > 0 && (
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Arama Etiketleri</h2>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        <Tag className="h-3 w-3" />
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Kolon - Detay Bilgiler */}
            <div className="space-y-6">
              
              {/* Temel Bilgiler */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Temel Bilgiler</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Hazırlama Süresi</p>
                      <p className="font-medium">{product.preparationTime} dakika</p>
                    </div>
                  </div>
                  
                  {product.calories > 0 && (
                    <div className="flex items-center gap-3">
                      <Flame className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Kalori</p>
                        <p className="font-medium">{product.calories} kcal</p>
                      </div>
                    </div>
                  )}

                  {product.rating > 0 && (
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">Değerlendirme</p>
                        <p className="font-medium">
                          {product.rating.toFixed(1)} / 5.0 ({product.reviewCount} değerlendirme)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Diyet Özellikleri */}
              {(product.isVegetarian || product.isVegan || product.isGlutenFree) && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Diyet Özellikleri</h2>
                  <div className="space-y-3">
                    {product.isVegetarian && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-900">Vejetaryen</span>
                      </div>
                    )}
                    {product.isVegan && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-900">Vegan</span>
                      </div>
                    )}
                    {product.isGlutenFree && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-gray-900">Glutensiz</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stok Bilgileri */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Stok Yönetimi</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Mevcut Stok</p>
                    <p className={`text-2xl font-bold ${stockStatus.color}`}>
                      {product.stock} adet
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Min. Stok</p>
                      <p className="font-medium">{product.minStock}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max. Stok</p>
                      <p className="font-medium">{product.maxStock}</p>
                    </div>
                  </div>
                  {product.stock <= product.minStock && product.stock > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Stok seviyesi düşük!</span>
                      </div>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-800">Ürün stokta yok!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tarih Bilgileri */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tarih Bilgileri</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Oluşturulma</p>
                      <p className="text-sm font-medium">
                        {product.createdAt.toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Son Güncelleme</p>
                      <p className="text-sm font-medium">
                        {product.updatedAt.toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 