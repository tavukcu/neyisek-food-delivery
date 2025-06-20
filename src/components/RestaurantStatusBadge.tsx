'use client';

import { RestaurantInfo } from '@/types';
import { getRestaurantStatus } from '@/utils/restaurantUtils';
import { Clock, AlertCircle } from 'lucide-react';

interface RestaurantStatusBadgeProps {
  restaurant: RestaurantInfo;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export default function RestaurantStatusBadge({ 
  restaurant, 
  variant = 'default',
  className = '' 
}: RestaurantStatusBadgeProps) {
  const status = getRestaurantStatus(restaurant);

  const getStatusStyles = () => {
    switch (status.status) {
      case 'open':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: '🟢'
        };
      case 'closing_soon':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: '🟡'
        };
      case 'closed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: '🔴'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: '⚪'
        };
    }
  };

  const styles = getStatusStyles();

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles.bg} ${styles.text} ${styles.border} ${className}`}>
        <span className="text-xs">{styles.icon}</span>
        <span>{status.isOpen ? 'Açık' : 'Kapalı'}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`p-3 rounded-lg border ${styles.bg} ${styles.border} ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm">{styles.icon}</span>
          <span className={`font-semibold text-sm ${styles.text}`}>
            {status.isOpen ? 'Açık' : 'Kapalı'}
          </span>
        </div>
        
        <p className={`text-sm ${styles.text} mb-2`}>
          {status.message}
        </p>
        
        {status.nextOpening && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-3 w-3" />
            <span>
              {status.nextOpening.day} {status.nextOpening.time}'de açılacak
            </span>
          </div>
        )}
        
        {status.status === 'closing_soon' && (
          <div className="flex items-center gap-1 text-xs text-yellow-700 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>Yakında kapanıyor</span>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${styles.bg} ${styles.text} ${styles.border} ${className}`}>
      <span className="text-sm">{styles.icon}</span>
      <div className="flex flex-col">
        <span className="font-semibold">
          {status.isOpen ? 'Açık' : 'Kapalı'}
        </span>
        {status.message && (
          <span className="text-xs opacity-80">
            {status.message}
          </span>
        )}
      </div>
      
      {status.nextOpening && (
        <div className="flex items-center gap-1 text-xs opacity-70">
          <Clock className="h-3 w-3" />
          <span>
            {status.nextOpening.day} {status.nextOpening.time}
          </span>
        </div>
      )}
    </div>
  );
} 