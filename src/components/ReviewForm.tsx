'use client';

import { useState } from 'react';
import { X, Camera, Plus, Minus } from 'lucide-react';
import StarRating from './StarRating';
import toast from 'react-hot-toast';
import { ReviewService } from '@/services/reviewService';
import { ReviewType } from '@/types';
import type { ProductReview, RestaurantReview, User, Product, RestaurantInfo } from '@/types';

interface ReviewFormProps {
  type: ReviewType;
  targetId: string;
  target: Product | RestaurantInfo;
  user: User;
  orderId?: string;
  onClose: () => void;
  onSubmit: (reviewId: string) => void;
  className?: string;
}

export default function ReviewForm({
  type,
  targetId,
  target,
  user,
  orderId,
  onClose,
  onSubmit,
  className = ''
}: ReviewFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Temel form state
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState<string[]>(['']);
  const [cons, setCons] = useState<string[]>(['']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  
  // Ürün değerlendirmesi için detaylı puanlar
  const [qualityRating, setQualityRating] = useState(0);
  const [tasteRating, setTasteRating] = useState(0);
  const [portionRating, setPortionRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  
  // Restoran değerlendirmesi için detaylı puanlar
  const [foodQualityRating, setFoodQualityRating] = useState(0);
  const [serviceRating, setServiceRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [restaurantValueRating, setRestaurantValueRating] = useState(0);
  const [wouldOrderAgain, setWouldOrderAgain] = useState<boolean | null>(null);

  const handleAddPro = () => {
    setPros([...pros, '']);
  };

  const handleRemovePro = (index: number) => {
    setPros(pros.filter((_, i) => i !== index));
  };

  const handleProChange = (index: number, value: string) => {
    const newPros = [...pros];
    newPros[index] = value;
    setPros(newPros);
  };

  const handleAddCon = () => {
    setCons([...cons, '']);
  };

  const handleRemoveCon = (index: number) => {
    setCons(cons.filter((_, i) => i !== index));
  };

  const handleConChange = (index: number, value: string) => {
    const newCons = [...cons];
    newCons[index] = value;
    setCons(newCons);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Lütfen bir puan verin');
      return;
    }

    if (comment.trim().length < 10) {
      toast.error('Yorum en az 10 karakter olmalıdır');
      return;
    }

    setLoading(true);

    try {
      let reviewId: string;

      const baseReviewData = {
        userId: user.uid,
        user,
        targetId,
        orderId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        pros: pros.filter(p => p.trim()).length > 0 ? pros.filter(p => p.trim()) : undefined,
        cons: cons.filter(c => c.trim()).length > 0 ? cons.filter(c => c.trim()) : undefined,
        isVerifiedPurchase: !!orderId,
        isAnonymous
      };

      if (type === ReviewType.PRODUCT) {
        const productReviewData: Omit<ProductReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'reportCount'> = {
          ...baseReviewData,
          type: ReviewType.PRODUCT,
          productId: targetId,
          product: target as Product,
          restaurantId: (target as Product).restaurantId,
          qualityRating: qualityRating || rating,
          tasteRating: tasteRating || rating,
          portionRating: portionRating || rating,
          valueRating: valueRating || rating,
          wouldRecommend: wouldRecommend ?? true
        };

        reviewId = await ReviewService.createProductReview(productReviewData);
      } else {
        const restaurantReviewData: Omit<RestaurantReview, 'id' | 'createdAt' | 'updatedAt' | 'helpfulCount' | 'reportCount'> = {
          ...baseReviewData,
          type: ReviewType.RESTAURANT,
          restaurantId: targetId,
          restaurant: target as RestaurantInfo,
          foodQualityRating: foodQualityRating || rating,
          serviceRating: serviceRating || rating,
          deliveryRating: deliveryRating || rating,
          valueRating: restaurantValueRating || rating,
          wouldOrderAgain: wouldOrderAgain ?? true
        };

        reviewId = await ReviewService.createRestaurantReview(restaurantReviewData);
      }

      toast.success('Değerlendirmeniz başarıyla gönderildi!');
      onSubmit(reviewId);
    } catch (error) {
      console.error('Review submission error:', error);
      toast.error('Değerlendirme gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const isProduct = type === ReviewType.PRODUCT;
  const targetName = isProduct ? (target as Product).name : (target as RestaurantInfo).name;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isProduct ? 'Ürün Değerlendirmesi' : 'Restoran Değerlendirmesi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Hedef Bilgisi */}
          <div className="text-center">
            <h3 className="font-medium text-gray-900 mb-2">{targetName}</h3>
            <p className="text-sm text-gray-600">
              {isProduct ? 'Bu ürün hakkında deneyiminizi paylaşın' : 'Bu restoran hakkında deneyiminizi paylaşın'}
            </p>
          </div>

          {/* Genel Puan */}
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Genel Puan *
            </label>
            <StarRating
              rating={rating}
              interactive
              size="lg"
              onRatingChange={setRating}
              className="justify-center"
            />
          </div>

          {/* Detaylı Puanlar - Ürün */}
          {isProduct && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Detaylı Değerlendirme</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kalite
                  </label>
                  <StarRating
                    rating={qualityRating}
                    interactive
                    onRatingChange={setQualityRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lezzet
                  </label>
                  <StarRating
                    rating={tasteRating}
                    interactive
                    onRatingChange={setTasteRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Porsiyon
                  </label>
                  <StarRating
                    rating={portionRating}
                    interactive
                    onRatingChange={setPortionRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat/Performans
                  </label>
                  <StarRating
                    rating={valueRating}
                    interactive
                    onRatingChange={setValueRating}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Detaylı Puanlar - Restoran */}
          {!isProduct && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Detaylı Değerlendirme</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Yemek Kalitesi
                  </label>
                  <StarRating
                    rating={foodQualityRating}
                    interactive
                    onRatingChange={setFoodQualityRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hizmet
                  </label>
                  <StarRating
                    rating={serviceRating}
                    interactive
                    onRatingChange={setServiceRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teslimat
                  </label>
                  <StarRating
                    rating={deliveryRating}
                    interactive
                    onRatingChange={setDeliveryRating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fiyat/Performans
                  </label>
                  <StarRating
                    rating={restaurantValueRating}
                    interactive
                    onRatingChange={setRestaurantValueRating}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Başlık */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Başlık (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Değerlendirmeniz için kısa bir başlık"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          {/* Yorum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yorumunuz *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Deneyiminizi detaylı olarak paylaşın..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              minLength={10}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 karakter (minimum 10)
            </p>
          </div>

          {/* Artılar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Artıları (İsteğe bağlı)
            </label>
            {pros.map((pro, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={pro}
                  onChange={(e) => handleProChange(index, e.target.value)}
                  placeholder="Beğendiğiniz bir özellik"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  maxLength={100}
                />
                {pros.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePro(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPro}
              className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Artı ekle</span>
            </button>
          </div>

          {/* Eksiler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Eksileri (İsteğe bağlı)
            </label>
            {cons.map((con, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={con}
                  onChange={(e) => handleConChange(index, e.target.value)}
                  placeholder="Geliştirilmesi gereken bir özellik"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  maxLength={100}
                />
                {cons.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCon(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddCon}
              className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Eksi ekle</span>
            </button>
          </div>

          {/* Tavsiye Sorusu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {isProduct ? 'Bu ürünü tavsiye eder misiniz?' : 'Bu restorandan tekrar sipariş verir misiniz?'}
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => isProduct ? setWouldRecommend(true) : setWouldOrderAgain(true)}
                className={`px-4 py-2 rounded-md border ${
                  (isProduct ? wouldRecommend : wouldOrderAgain) === true
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ✅ Evet
              </button>
              <button
                type="button"
                onClick={() => isProduct ? setWouldRecommend(false) : setWouldOrderAgain(false)}
                className={`px-4 py-2 rounded-md border ${
                  (isProduct ? wouldRecommend : wouldOrderAgain) === false
                    ? 'bg-red-100 border-red-500 text-red-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                ❌ Hayır
              </button>
            </div>
          </div>

          {/* Anonim Seçeneği */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Anonim olarak değerlendir
            </label>
          </div>

          {/* Butonlar */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0 || comment.trim().length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Gönderiliyor...' : 'Değerlendirmeyi Gönder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 