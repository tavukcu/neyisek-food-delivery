'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import StarRating from '@/components/StarRating';
import ReviewForm from '@/components/ReviewForm';
import { ReviewService } from '@/services/reviewService';
import { ProductService } from '@/services/productService';
import { RestaurantService } from '@/services/restaurantService';
import { 
  X, 
  Star, 
  ThumbsUp, 
  MessageSquare,
  Clock,
  CheckCircle,
  Gift,
  Heart,
  Sparkles,
  Trophy,
  Zap,
  PartyPopper
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ReviewType, ReviewStatus } from '@/types';
import type { Order, Product, RestaurantInfo } from '@/types';

interface DeliveryRatingModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function DeliveryRatingModal({ order, isOpen, onClose, onComplete }: DeliveryRatingModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<'welcome' | 'order' | 'products' | 'restaurant' | 'complete'>('welcome');
  const [orderRating, setOrderRating] = useState<number>(0);
  const [productRatings, setProductRatings] = useState<{ [key: string]: number }>({});
  const [restaurantRating, setRestaurantRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailedReview, setShowDetailedReview] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  // Restoran ve ürün bilgilerini yükle
  useEffect(() => {
    if (order && isOpen) {
      loadOrderDetails();
    }
  }, [order, isOpen]);

  // Konfeti efekti
  useEffect(() => {
    if (currentStep === 'complete') {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const loadOrderDetails = async () => {
    try {
      // Restoran bilgilerini yükle
      if (order.restaurantId) {
        const restaurantData = await RestaurantService.getRestaurant(order.restaurantId);
        setRestaurant(restaurantData);
      }

      // Ürün bilgilerini yükle
      const productPromises = order.items.map(item => ProductService.getProduct(item.productId));
      const productResults = await Promise.all(productPromises);
      const validProducts = productResults.filter(p => p !== null) as Product[];
      setProducts(validProducts);
    } catch (error) {
      console.error('❌ Sipariş detayları yüklenirken hata:', error);
    }
  };

  // Hızlı puanlama gönderimi
  const submitQuickRating = async () => {
    if (!user || !orderRating) return;

    setIsSubmitting(true);
    try {
      // Sipariş değerlendirmesi oluştur
      await ReviewService.createReview({
        type: ReviewType.ORDER,
        targetId: order.id,
        userId: user.uid,
        user: user,
        rating: orderRating,
        comment: 'Hızlı değerlendirme',
        isVerifiedPurchase: true,
        isAnonymous: false,
        status: ReviewStatus.APPROVED
      });

      toast.success('🎉 Değerlendirmeniz kaydedildi! Teşekkürler!');
      setCurrentStep('complete');
    } catch (error) {
      console.error('❌ Hızlı puanlama hatası:', error);
      toast.error('Değerlendirme kaydedilirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Detaylı değerlendirme gönderimi
  const submitDetailedRating = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const promises = [];

      // Sipariş değerlendirmesi
      if (orderRating > 0) {
        promises.push(
          ReviewService.createReview({
            type: ReviewType.ORDER,
            targetId: order.id,
            userId: user.uid,
            user: user,
            rating: orderRating,
            comment: 'Detaylı değerlendirme',
            isVerifiedPurchase: true,
            isAnonymous: false,
            status: ReviewStatus.APPROVED
          })
        );
      }

      // Ürün değerlendirmeleri
      Object.entries(productRatings).forEach(([productId, rating]) => {
        if (rating > 0) {
          promises.push(
            ReviewService.createReview({
              type: ReviewType.PRODUCT,
              targetId: productId,
              userId: user.uid,
              user: user,
              rating: rating,
              comment: 'Ürün değerlendirmesi',
              isVerifiedPurchase: true,
              isAnonymous: false,
              status: ReviewStatus.APPROVED
            })
          );
        }
      });

      // Restoran değerlendirmesi
      if (restaurantRating > 0 && restaurant) {
        promises.push(
          ReviewService.createReview({
            type: ReviewType.RESTAURANT,
            targetId: restaurant.id,
            userId: user.uid,
            user: user,
            rating: restaurantRating,
            comment: 'Restoran değerlendirmesi',
            isVerifiedPurchase: true,
            isAnonymous: false,
            status: ReviewStatus.APPROVED
          })
        );
      }

      await Promise.all(promises);
      toast.success('🎉 Tüm değerlendirmeleriniz kaydedildi!');
      setCurrentStep('complete');
    } catch (error) {
      console.error('❌ Detaylı puanlama hatası:', error);
      toast.error('Değerlendirmeler kaydedilirken hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Konfeti Efekti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-[9999]">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute confetti-animation"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${1 + Math.random()}rem`
              }}
            >
              <div className="sparkle-animation">
                {['🎉', '🎊', '⭐', '💫', '🌟', '✨', '🎈', '🎁'][Math.floor(Math.random() * 8)]}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Backdrop */}
      <div className="fixed inset-0 modal-backdrop z-[9998] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative bounce-in rainbow-border">
          
          {/* Kapatma Butonu */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10 hover-lift"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Hoş Geldin Adımı */}
          {currentStep === 'welcome' && (
            <div className="p-8 text-center">
              {/* Büyük Animasyonlu İkon */}
              <div className="relative mb-8">
                <div className="w-32 h-32 mx-auto gradient-shift rounded-full flex items-center justify-center pulse-glow shadow-2xl">
                  <CheckCircle className="w-16 h-16 text-white bounce-in" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center sparkle-animation">
                  <Sparkles className="w-6 h-6 text-white star-twinkle" />
                </div>
              </div>

              {/* Başlık */}
              <h2 className="text-4xl font-bold text-shimmer mb-4 slide-up">
                🎉 Siparişiniz Teslim Edildi!
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 slide-up" style={{ animationDelay: '0.2s' }}>
                Deneyiminizi bizimle paylaşır mısınız?
              </p>

              {/* Sipariş Bilgileri */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 card-hover slide-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 gradient-shift rounded-full flex items-center justify-center pulse-glow">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Sipariş #{order.id.slice(-6)}</h3>
                <p className="text-gray-600">{order.items.length} ürün • ₺{order.total}</p>
                {restaurant && (
                  <p className="text-sm text-gray-500 mt-1">{restaurant.name}</p>
                )}
              </div>

              {/* Devam Butonu */}
              <button
                onClick={() => setCurrentStep('order')}
                className="w-full btn-magical text-white py-4 px-8 rounded-2xl font-semibold text-lg hover-glow"
              >
                <div className="flex items-center justify-center gap-3">
                  <Star className="w-6 h-6 star-twinkle" />
                  Değerlendirmeye Başla
                  <Zap className="w-6 h-6 sparkle-animation" />
                </div>
              </button>
            </div>
          )}

          {/* Sipariş Değerlendirme Adımı */}
          {currentStep === 'order' && (
            <div className="p-8">
              {/* İlerleme Çubuğu */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center progress-step active">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded progress-line"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center progress-step">
                    <span className="text-gray-400 font-bold text-sm">2</span>
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded progress-line"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center progress-step">
                    <span className="text-gray-400 font-bold text-sm">3</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto gradient-shift rounded-full flex items-center justify-center mb-6 pulse-glow">
                  <Trophy className="w-10 h-10 text-white bounce-in" />
                </div>
                <h2 className="text-3xl font-bold text-shimmer mb-4">
                  Siparişinizi Nasıl Buldunuz?
                </h2>
                <p className="text-gray-600 text-lg">
                  Genel deneyiminizi değerlendirin
                </p>
              </div>

              {/* Büyük Yıldız Puanlama */}
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-8 card-hover">
                  <div className="star-rating-enhanced">
                    <StarRating
                      rating={orderRating}
                      onRatingChange={setOrderRating}
                      size="lg"
                      interactive={true}
                      showValue={false}
                    />
                  </div>
                  {orderRating > 0 && (
                    <div className="text-center mt-4 bounce-in">
                      <span className="text-2xl font-bold text-yellow-600">
                        {orderRating === 5 ? '🤩 Mükemmel!' : 
                         orderRating === 4 ? '😊 Çok İyi!' :
                         orderRating === 3 ? '😐 İyi' :
                         orderRating === 2 ? '😕 Fena Değil' : '😞 Kötü'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hızlı Gönder veya Devam Et */}
              <div className="flex gap-4">
                {orderRating > 0 && (
                  <button
                    onClick={submitQuickRating}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover-glow transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 spinner-magical"></div>
                        Gönderiliyor...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5 sparkle-animation" />
                        Hızlı Gönder
                      </div>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => setCurrentStep('products')}
                  className="flex-1 btn-magical text-white py-4 px-6 rounded-2xl font-semibold hover-glow"
                >
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Detaylı Değerlendir
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Ürün Değerlendirme Adımı */}
          {currentStep === 'products' && (
            <div className="p-8">
              {/* İlerleme Çubuğu */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center progress-step">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-16 h-1 bg-green-600 rounded progress-line completed"></div>
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center progress-step active">
                    <span className="text-white font-bold text-sm">2</span>
                  </div>
                  <div className="w-16 h-1 bg-gray-200 rounded progress-line"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center progress-step">
                    <span className="text-gray-400 font-bold text-sm">3</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-shimmer mb-4">
                  Ürünleri Değerlendirin
                </h2>
                <p className="text-gray-600">
                  Her ürün için ayrı puan verebilirsiniz
                </p>
              </div>

              {/* Ürün Listesi */}
              <div className="space-y-6 mb-8">
                {products.map((product, index) => (
                  <div key={product.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 card-hover slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 gradient-shift rounded-xl flex items-center justify-center pulse-glow">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-2xl">🍽️</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">{product.name}</h3>
                        <p className="text-gray-600">₺{product.price}</p>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className="star-rating-enhanced">
                          <StarRating
                            rating={productRatings[product.id] || 0}
                            onRatingChange={(rating) => setProductRatings(prev => ({ ...prev, [product.id]: rating }))}
                            size="md"
                            interactive={true}
                            showValue={false}
                          />
                        </div>
                        {productRatings[product.id] > 0 && (
                          <span className="text-sm font-medium text-yellow-600 bounce-in">
                            {productRatings[product.id]} ⭐
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('order')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors hover-lift"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentStep('restaurant')}
                  className="flex-1 btn-magical text-white py-4 px-6 rounded-2xl font-semibold hover-glow"
                >
                  Devam Et
                </button>
              </div>
            </div>
          )}

          {/* Restoran Değerlendirme Adımı */}
          {currentStep === 'restaurant' && (
            <div className="p-8">
              {/* İlerleme Çubuğu */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center progress-step">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-16 h-1 bg-green-600 rounded progress-line completed"></div>
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center progress-step">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-16 h-1 bg-green-600 rounded progress-line completed"></div>
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center progress-step active">
                    <span className="text-white font-bold text-sm">3</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto gradient-shift rounded-full flex items-center justify-center mb-6 pulse-glow">
                  <Heart className="w-10 h-10 text-white heart-beat" />
                </div>
                <h2 className="text-3xl font-bold text-shimmer mb-4">
                  Restoranı Değerlendirin
                </h2>
                {restaurant && (
                  <p className="text-gray-600 text-lg">
                    {restaurant.name} hakkındaki düşünceleriniz
                  </p>
                )}
              </div>

              {/* Restoran Puanlama */}
              <div className="flex justify-center mb-8">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-3xl p-8 card-hover">
                  <div className="star-rating-enhanced">
                    <StarRating
                      rating={restaurantRating}
                      onRatingChange={setRestaurantRating}
                      size="lg"
                      interactive={true}
                      showValue={false}
                    />
                  </div>
                  {restaurantRating > 0 && (
                    <div className="text-center mt-4 bounce-in">
                      <span className="text-2xl font-bold text-red-600">
                        {restaurantRating === 5 ? '❤️ Harika Restoran!' : 
                         restaurantRating === 4 ? '👍 Çok Beğendim!' :
                         restaurantRating === 3 ? '👌 İyi' :
                         restaurantRating === 2 ? '😐 Orta' : '👎 Kötü'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setCurrentStep('products')}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-colors hover-lift"
                >
                  Geri
                </button>
                <button
                  onClick={submitDetailedRating}
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover-glow transition-all duration-300 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 spinner-magical"></div>
                      Gönderiliyor...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <PartyPopper className="w-5 h-5 sparkle-animation" />
                      Değerlendirmeleri Gönder
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tamamlandı Adımı */}
          {currentStep === 'complete' && (
            <div className="p-8 text-center">
              {/* Büyük Teşekkür Animasyonu */}
              <div className="relative mb-8">
                <div className="w-40 h-40 mx-auto gradient-shift rounded-full flex items-center justify-center pulse-glow shadow-2xl">
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                    <CheckCircle className="w-20 h-20 text-green-500 bounce-in" />
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center sparkle-animation">
                  <Trophy className="w-8 h-8 text-white star-twinkle" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center heart-beat">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Teşekkür Mesajı */}
              <h2 className="text-5xl font-bold text-shimmer mb-6 slide-up">
                🎉 TEŞEKKÜRLER! 🎉
              </h2>
              
              <p className="text-2xl text-gray-700 mb-4 slide-up" style={{ animationDelay: '0.2s' }}>
                Değerlendirmeniz bizim için çok değerli!
              </p>
              
              <p className="text-lg text-gray-600 mb-8 slide-up" style={{ animationDelay: '0.4s' }}>
                Görüşleriniz sayesinde daha iyi hizmet verebiliyoruz ✨
              </p>

              {/* Ödül Mesajı */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-3xl p-6 mb-8 card-hover slide-up" style={{ animationDelay: '0.6s' }}>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 gradient-shift rounded-full flex items-center justify-center pulse-glow">
                    <Gift className="w-8 h-8 text-white sparkle-animation" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">🎁 Sürpriz Hediye!</h3>
                <p className="text-gray-600">Bir sonraki siparişinizde kullanabileceğiniz %10 indirim kuponu hesabınıza tanımlandı!</p>
              </div>

              {/* Sosyal Medya Paylaşım */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 mb-8 card-hover slide-up" style={{ animationDelay: '0.8s' }}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📱 Deneyiminizi Paylaşın</h3>
                <p className="text-gray-600 mb-4">Arkadaşlarınızla bu güzel deneyimi paylaşmak ister misiniz?</p>
                <div className="flex justify-center gap-4">
                  <button className="bg-blue-500 text-white px-6 py-2 rounded-full hover-glow transition-colors">
                    📘 Facebook
                  </button>
                  <button className="bg-pink-500 text-white px-6 py-2 rounded-full hover-glow transition-colors">
                    📷 Instagram
                  </button>
                  <button className="bg-green-500 text-white px-6 py-2 rounded-full hover-glow transition-colors">
                    💬 WhatsApp
                  </button>
                </div>
              </div>

              {/* Kapatma Butonu */}
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="w-full btn-magical text-white py-4 px-8 rounded-2xl font-semibold text-lg hover-glow"
              >
                <div className="flex items-center justify-center gap-3">
                  <Sparkles className="w-6 h-6 sparkle-animation" />
                  Harika! Kapat
                  <Heart className="w-6 h-6 heart-beat" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 