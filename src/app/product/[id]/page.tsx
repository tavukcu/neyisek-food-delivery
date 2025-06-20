'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';
import StarRating from '@/components/StarRating';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import { ProductService } from '@/services/productService';
import { ReviewService } from '@/services/reviewService';
import { RestaurantService } from '@/services/restaurantService';
import { 
  ArrowLeft,
  Plus, 
  Minus,
  Clock,
  Users,
  MessageSquare,
  Star,
  Filter,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ReviewType } from '@/types';
import type { Product, ProductReview, ProductReviewSummary, RestaurantInfo, ReviewFilters } from '@/types';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart, updateQuantity, getItemQuantity } = useCart();
  
  const productId = params.id as string;

  // States
  const [product, setProduct] = useState<Product | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewFilters, setReviewFilters] = useState<ReviewFilters>({
    sortBy: 'newest'
  });

  // Veri yükleme
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 ProductDetail: Ürün verisi yükleniyor...', productId);
        
        const productData = await ProductService.getProduct(productId);
        if (!productData) {
          toast.error('Ürün bulunamadı');
          router.push('/menu');
          return;
        }
        
        setProduct(productData);
        
        // Restoran bilgilerini yükle
        const restaurantData = await RestaurantService.getRestaurant(productData.restaurantId);
        setRestaurant(restaurantData);
        
        // Değerlendirme özetini yükle
        const summary = await ReviewService.getProductReviewSummary(productId);
        setReviewSummary(summary);
        
        console.log('✅ ProductDetail: Ürün verisi yüklendi');
      } catch (error) {
        console.error('❌ ProductDetail: Veri yükleme hatası:', error);
        toast.error('Ürün bilgileri yüklenirken hata oluştu');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      loadProductData();
    }
  }, [productId, router]);

  // Değerlendirmeleri yükle
  useEffect(() => {
    const loadReviews = async () => {
      if (!productId) return;
      
      try {
        setReviewsLoading(true);
        const { reviews: reviewsData } = await ReviewService.getProductReviews(
          productId, 
          reviewFilters,
          20
        );
        setReviews(reviewsData);
      } catch (error) {
        console.error('❌ ProductDetail: Değerlendirmeler yüklenemedi:', error);
      } finally {
        setReviewsLoading(false);
      }
    };

    loadReviews();
  }, [productId, reviewFilters]);

  // Sepete ekleme
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
      toast.success(`${product.name} sepete eklendi`);
    }
  };

  // Değerlendirme formu gönderimi
  const handleReviewSubmit = (reviewId: string) => {
    setShowReviewForm(false);
    toast.success('Değerlendirmeniz başarıyla gönderildi!');
    
    // Değerlendirmeleri yeniden yükle
    const loadReviews = async () => {
      try {
        const { reviews: reviewsData } = await ReviewService.getProductReviews(productId, reviewFilters, 20);
        setReviews(reviewsData);
        
        const summary = await ReviewService.getProductReviewSummary(productId);
        setReviewSummary(summary);
      } catch (error) {
        console.error('❌ Değerlendirmeler yeniden yüklenemedi:', error);
      }
    };
    
    loadReviews();
  };

  // Faydalı bulma
  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      toast.error('Bu işlem için giriş yapmalısınız');
      return;
    }

    try {
      await ReviewService.markReviewHelpful(reviewId, user.uid, isHelpful);
      toast.success(isHelpful ? 'Faydalı olarak işaretlendi' : 'Faydalı değil olarak işaretlendi');
      
      // Değerlendirmeleri yeniden yükle
      const { reviews: reviewsData } = await ReviewService.getProductReviews(productId, reviewFilters, 20);
      setReviews(reviewsData);
    } catch (error) {
      console.error('❌ Faydalı işaretleme hatası:', error);
      toast.error('İşlem gerçekleştirilemedi');
    }
  };

  if (isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Ürün yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ürün Bulunamadı</h2>
            <p className="text-gray-600 mb-6">Aradığınız ürün mevcut değil.</p>
            <Link
              href="/menu"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Menüye Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      
      {/* Geri Dön Butonu */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-responsive py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Geri Dön</span>
          </button>
        </div>
      </div>

      {/* Ürün Detayları */}
      <section className="py-8 bg-white">
        <div className="container-responsive">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ürün Görseli */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-200 rounded-xl overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="h-24 w-24 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            {/* Ürün Bilgileri */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                
                {restaurant && (
                  <Link
                    href={`/restaurant/${restaurant.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {restaurant.name}
                  </Link>
                )}
              </div>

              {/* Puanlama */}
              <div className="flex items-center gap-4">
                <StarRating rating={product.rating || 0} size="lg" showValue />
                <span className="text-gray-600">
                  ({product.reviewCount || 0} değerlendirme)
                </span>
              </div>

              {/* Açıklama */}
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>

              {/* Özellikler */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {product.preparationTime} dakika
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {product.calories} kalori
                </div>
              </div>

              {/* Diyet Etiketleri */}
              {(product.isVegetarian || product.isVegan || product.isGlutenFree) && (
                <div className="flex flex-wrap gap-2">
                  {product.isVegetarian && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      🌱 Vejetaryen
                    </span>
                  )}
                  {product.isVegan && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      🌿 Vegan
                    </span>
                  )}
                  {product.isGlutenFree && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      🌾 Glutensiz
                    </span>
                  )}
                </div>
              )}

              {/* Fiyat ve Sepet */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-bold text-primary-600">
                    ₺{product.price.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {getItemQuantity(product.id) > 0 ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(product.id, getItemQuantity(product.id) - 1)}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="text-xl font-semibold min-w-[40px] text-center">
                        {getItemQuantity(product.id)}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, getItemQuantity(product.id) + 1)}
                        className="p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="h-5 w-5" />
                      Sepete Ekle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Değerlendirmeler Bölümü */}
      <section className="py-8 bg-gray-50">
        <div className="container-responsive">
          <div className="bg-white rounded-xl p-6">
            {/* Başlık ve Değerlendirme Butonu */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Değerlendirmeler ({product.reviewCount || 0})
              </h2>
              
              {user && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Değerlendir
                </button>
              )}
            </div>

            {/* Değerlendirme Özeti */}
            {reviewSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <StarRating rating={reviewSummary.averageRating} size="lg" showValue />
                    <div>
                      <p className="text-sm text-gray-600">
                        {reviewSummary.totalReviews} değerlendirme
                      </p>
                      <p className="text-sm text-gray-600">
                        %{reviewSummary.recommendationRate} tavsiye ediyor
                      </p>
                    </div>
                  </div>
                  
                  {/* Puan Dağılımı */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-8">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{
                              width: `${(reviewSummary.ratingDistribution[rating as keyof typeof reviewSummary.ratingDistribution] / reviewSummary.totalReviews) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8">
                          {reviewSummary.ratingDistribution[rating as keyof typeof reviewSummary.ratingDistribution]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Detaylı Puanlar</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Kalite:</span>
                      <StarRating rating={reviewSummary.averageQualityRating} size="sm" showValue />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lezzet:</span>
                      <StarRating rating={reviewSummary.averageTasteRating} size="sm" showValue />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Porsiyon:</span>
                      <StarRating rating={reviewSummary.averagePortionRating} size="sm" showValue />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fiyat/Performans:</span>
                      <StarRating rating={reviewSummary.averageValueRating} size="sm" showValue />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filtreler */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Sırala:</span>
              </div>
              <select
                value={reviewFilters.sortBy}
                onChange={(e) => setReviewFilters({ ...reviewFilters, sortBy: e.target.value as any })}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="newest">En Yeni</option>
                <option value="oldest">En Eski</option>
                <option value="highest">En Yüksek Puan</option>
                <option value="lowest">En Düşük Puan</option>
                <option value="helpful">En Faydalı</option>
              </select>
            </div>

            {/* Değerlendirmeler Listesi */}
            <div className="space-y-6">
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="spinner mx-auto mb-4"></div>
                  <p className="text-gray-600">Değerlendirmeler yükleniyor...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Henüz değerlendirme yok
                  </h3>
                  <p className="text-gray-500">
                    Bu ürün için ilk değerlendirmeyi siz yapın!
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onHelpful={handleHelpful}
                    className="border-b border-gray-100 last:border-b-0 pb-6 last:pb-0"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Değerlendirme Formu Modal */}
      {showReviewForm && user && product && (
        <ReviewForm
          type={ReviewType.PRODUCT}
          targetId={product.id}
          target={product}
          user={user}
          onClose={() => setShowReviewForm(false)}
          onSubmit={handleReviewSubmit}
        />
      )}
    </main>
  );
} 