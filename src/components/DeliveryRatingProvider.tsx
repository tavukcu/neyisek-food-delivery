'use client';

import React from 'react';
import DeliveryRatingModal from './DeliveryRatingModal';
import { useDeliveryRatingModal } from '@/hooks/useDeliveryRatingModal';

interface DeliveryRatingProviderProps {
  children: React.ReactNode;
}

export default function DeliveryRatingProvider({ children }: DeliveryRatingProviderProps) {
  const { 
    isOpen, 
    order, 
    hideModal,
    completeRating
  } = useDeliveryRatingModal();

  return (
    <>
      {children}
      {isOpen && order && (
        <DeliveryRatingModal
          isOpen={isOpen}
          onClose={hideModal}
          order={order}
          onComplete={completeRating}
        />
      )}
    </>
  );
} 