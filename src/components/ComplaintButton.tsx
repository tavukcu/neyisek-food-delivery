'use client';

import { useState } from 'react';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import ComplaintForm from './ComplaintForm';
import { ComplaintType } from '@/types';

interface ComplaintButtonProps {
  orderId?: string;
  productId?: string;
  restaurantId?: string;
  preSelectedType?: ComplaintType;
  variant?: 'floating' | 'button' | 'link';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ComplaintButton({
  orderId,
  productId,
  restaurantId,
  preSelectedType,
  variant = 'button',
  size = 'md',
  className = ''
}: ComplaintButtonProps) {
  const [isComplaintFormOpen, setIsComplaintFormOpen] = useState(false);

  // Boyut sınıfları
  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-14 h-14 text-lg'
  };

  // Variant stilleri
  const getVariantClasses = () => {
    switch (variant) {
      case 'floating':
        return `fixed bottom-6 right-6 z-40 ${sizeClasses[size]} bg-red-500 hover:bg-red-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 pulse-glow`;
      
      case 'button':
        return `${sizeClasses[size]} bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-xl transition-all duration-200 hover-lift`;
      
      case 'link':
        return 'text-red-600 hover:text-red-700 underline text-sm font-medium transition-colors duration-200';
      
      default:
        return '';
    }
  };

  return (
    <>
      {variant === 'link' ? (
        <button
          onClick={() => setIsComplaintFormOpen(true)}
          className={`${getVariantClasses()} ${className}`}
        >
          <MessageSquare className="w-4 h-4 inline mr-1" />
          Şikayet Et
        </button>
      ) : (
        <button
          onClick={() => setIsComplaintFormOpen(true)}
          className={`${getVariantClasses()} ${className} flex items-center justify-center group`}
          title="Şikayet Et"
        >
          <AlertTriangle className={`${variant === 'floating' ? 'w-6 h-6' : 'w-5 h-5'} group-hover:rotate-12 transition-transform duration-200`} />
          {variant === 'button' && size === 'lg' && (
            <span className="ml-2 text-sm font-medium">Şikayet</span>
          )}
        </button>
      )}

      {/* Şikayet Formu */}
      <ComplaintForm
        isOpen={isComplaintFormOpen}
        onClose={() => setIsComplaintFormOpen(false)}
        orderId={orderId}
        productId={productId}
        restaurantId={restaurantId}
        preSelectedType={preSelectedType}
      />
    </>
  );
} 