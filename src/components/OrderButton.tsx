'use client';

import { RestaurantInfo } from '@/types';
import { canPlaceOrder } from '@/utils/restaurantUtils';
import { ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface OrderButtonProps {
  restaurant: RestaurantInfo;
  onOrderClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export default function OrderButton({
  restaurant,
  onOrderClick,
  className = '',
  children,
  variant = 'primary',
  size = 'md',
  disabled = false
}: OrderButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const orderStatus = canPlaceOrder(restaurant);

  const handleClick = async () => {
    if (disabled || isLoading) return;

    if (!orderStatus.canOrder) {
      toast.error(orderStatus.reason || 'Sipariş verilemez');
      return;
    }

    if (orderStatus.reason) {
      // Kapanmaya yakın uyarısı
      toast(orderStatus.reason, {
        icon: '⚠️',
        duration: 4000,
      });
    }

    setIsLoading(true);
    try {
      if (onOrderClick) {
        await onOrderClick();
      }
    } catch (error) {
      console.error('Sipariş hatası:', error);
      toast.error('Sipariş işlemi sırasında bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const getVariantStyles = () => {
    if (!orderStatus.canOrder) {
      return {
        bg: 'bg-gray-300',
        text: 'text-gray-500',
        border: 'border-gray-300',
        hover: 'cursor-not-allowed'
      };
    }

    switch (variant) {
      case 'primary':
        return {
          bg: 'bg-primary-600 hover:bg-primary-700',
          text: 'text-white',
          border: 'border-primary-600',
          hover: 'hover:shadow-lg transform hover:scale-105'
        };
      case 'secondary':
        return {
          bg: 'bg-gray-600 hover:bg-gray-700',
          text: 'text-white',
          border: 'border-gray-600',
          hover: 'hover:shadow-lg transform hover:scale-105'
        };
      case 'outline':
        return {
          bg: 'bg-white hover:bg-primary-50',
          text: 'text-primary-600 hover:text-primary-700',
          border: 'border-primary-600',
          hover: 'hover:shadow-md'
        };
      default:
        return {
          bg: 'bg-primary-600 hover:bg-primary-700',
          text: 'text-white',
          border: 'border-primary-600',
          hover: 'hover:shadow-lg transform hover:scale-105'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const styles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const buttonContent = children || (
    <div className="flex items-center gap-2">
      {orderStatus.canOrder ? (
        <ShoppingCart className="h-4 w-4" />
      ) : (
        <Clock className="h-4 w-4" />
      )}
      <span>
        {orderStatus.canOrder ? 'Sipariş Ver' : 'Kapalı'}
      </span>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={disabled || isLoading || !orderStatus.canOrder}
        className={`
          inline-flex items-center justify-center
          ${sizeStyles}
          ${styles.bg} ${styles.text} ${styles.border}
          border rounded-lg font-medium
          transition-all duration-200
          ${orderStatus.canOrder ? styles.hover : styles.hover}
          ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Yükleniyor...</span>
          </div>
        ) : (
          buttonContent
        )}
      </button>

      {/* Tooltip for closed restaurants */}
      {!orderStatus.canOrder && orderStatus.reason && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3 w-3" />
            <span>{orderStatus.reason}</span>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
} 