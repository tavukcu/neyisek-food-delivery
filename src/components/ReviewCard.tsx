'use client';

import { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Flag, 
  MessageCircle, 
  Calendar,
  CheckCircle,
  User,
  Camera
} from 'lucide-react';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { Review, ProductReview, RestaurantReview } from '@/types';

interface ReviewCardProps {
  review: Review | ProductReview | RestaurantReview;
  onHelpful?: (reviewId: string, isHelpful: boolean) => void;
  onReport?: (reviewId: string) => void;
  onReply?: (reviewId: string) => void;
  showProductInfo?: boolean;
  showRestaurantInfo?: boolean;
  className?: string;
}

export default function ReviewCard({
  review,
  onHelpful,
  onReport,
  onReply,
  showProductInfo = false,
  showRestaurantInfo = false,
  className = ''
}: ReviewCardProps) {
  const [showFullComment, setShowFullComment] = useState(false);
  const [helpfulClicked, setHelpfulClicked] = useState(false);
  const [reportClicked, setReportClicked] = useState(false);

  const handleHelpful = (isHelpful: boolean) => {
    if (onHelpful && !helpfulClicked) {
      onHelpful(review.id, isHelpful);
      setHelpfulClicked(true);
    }
  };

  const handleReport = () => {
    if (onReport && !reportClicked) {
      onReport(review.id);
      setReportClicked(true);
    }
  };

  const isLongComment = review.comment.length > 200;
  const displayComment = showFullComment || !isLongComment 
    ? review.comment 
    : review.comment.substring(0, 200) + '...';

  // Ürün değerlendirmesi için ek bilgiler
  const productReview = review as ProductReview;
  const restaurantReview = review as RestaurantReview;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Kullanıcı Bilgileri */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {review.isAnonymous ? (
              <User className="w-5 h-5 text-gray-500" />
            ) : (
              <span className="text-sm font-medium text-gray-700">
                {review.user.displayName?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-medium text-gray-900">
                {review.isAnonymous ? 'Anonim Kullanıcı' : review.user.displayName || 'Kullanıcı'}
              </h4>
              {review.isVerifiedPurchase && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>
                {formatDistanceToNow(review.createdAt, { 
                  addSuffix: true, 
                  locale: tr 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Genel Puan */}
        <div className="text-right">
          <StarRating rating={review.rating} size="md" showValue />
        </div>
      </div>

      {/* Başlık */}
      {review.title && (
        <h3 className="font-semibold text-gray-900 mb-2">
          {review.title}
        </h3>
      )}

      {/* Detaylı Puanlar - Ürün Değerlendirmesi */}
      {productReview.qualityRating && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Kalite:</span>
            <StarRating rating={productReview.qualityRating} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Lezzet:</span>
            <StarRating rating={productReview.tasteRating} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Porsiyon:</span>
            <StarRating rating={productReview.portionRating} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Fiyat/Performans:</span>
            <StarRating rating={productReview.valueRating} size="sm" />
          </div>
        </div>
      )}

      {/* Detaylı Puanlar - Restoran Değerlendirmesi */}
      {restaurantReview.foodQualityRating && (
        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Yemek Kalitesi:</span>
            <StarRating rating={restaurantReview.foodQualityRating} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Hizmet:</span>
            <StarRating rating={restaurantReview.serviceRating} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Teslimat:</span>
            <StarRating rating={restaurantReview.deliveryRating} size="sm" />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Fiyat/Performans:</span>
            <StarRating rating={restaurantReview.valueRating} size="sm" />
          </div>
        </div>
      )}

      {/* Artılar ve Eksiler */}
      {(review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {review.pros && review.pros.length > 0 && (
            <div>
              <h5 className="font-medium text-green-700 mb-2">👍 Artıları:</h5>
              <ul className="space-y-1">
                {review.pros.map((pro, index) => (
                  <li key={index} className="text-sm text-gray-600">• {pro}</li>
                ))}
              </ul>
            </div>
          )}
          {review.cons && review.cons.length > 0 && (
            <div>
              <h5 className="font-medium text-red-700 mb-2">👎 Eksileri:</h5>
              <ul className="space-y-1">
                {review.cons.map((con, index) => (
                  <li key={index} className="text-sm text-gray-600">• {con}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {/* Yorum */}
      {review.comment && (
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">
            {displayComment}
          </p>
          {isLongComment && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 font-medium"
            >
              {showFullComment ? 'Daha az göster' : 'Devamını oku'}
            </button>
          )}
        </div>
      )}

      {/* Fotoğraflar */}
      {review.images && review.images.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Camera className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {review.images.length} fotoğraf
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {review.images.slice(0, 3).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Değerlendirme fotoğrafı ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
            ))}
            {review.images.length > 3 && (
              <div className="w-full h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-sm text-gray-500">
                  +{review.images.length - 3} daha
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tavsiye Durumu */}
      {(productReview.wouldRecommend !== undefined || restaurantReview.wouldOrderAgain !== undefined) && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {productReview.wouldRecommend !== undefined ? (
              productReview.wouldRecommend ? 
                '✅ Bu ürünü tavsiye ediyor' : 
                '❌ Bu ürünü tavsiye etmiyor'
            ) : (
              restaurantReview.wouldOrderAgain ? 
                '✅ Bu restorandan tekrar sipariş verir' : 
                '❌ Bu restorandan tekrar sipariş vermez'
            )}
          </p>
        </div>
      )}

      {/* Aksiyonlar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4">
          {/* Faydalı Butonları */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleHelpful(true)}
              disabled={helpfulClicked}
              className={`
                flex items-center space-x-1 px-3 py-1 rounded-full text-sm
                ${helpfulClicked 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'hover:bg-green-50 text-gray-600 hover:text-green-600'
                }
              `}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>Faydalı ({review.helpfulCount})</span>
            </button>
            
            <button
              onClick={() => handleHelpful(false)}
              disabled={helpfulClicked}
              className={`
                flex items-center space-x-1 px-3 py-1 rounded-full text-sm
                ${helpfulClicked 
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                  : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                }
              `}
            >
              <ThumbsDown className="w-4 h-4" />
              <span>Faydalı değil</span>
            </button>
          </div>

          {/* Yanıtla Butonu */}
          {onReply && (
            <button
              onClick={() => onReply(review.id)}
              className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm hover:bg-blue-50 text-gray-600 hover:text-blue-600"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Yanıtla</span>
            </button>
          )}
        </div>

        {/* Şikayet Butonu */}
        <button
          onClick={handleReport}
          disabled={reportClicked}
          className={`
            flex items-center space-x-1 px-3 py-1 rounded-full text-sm
            ${reportClicked 
              ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
            }
          `}
        >
          <Flag className="w-4 h-4" />
          <span>Şikayet Et</span>
        </button>
      </div>
    </div>
  );
} 