import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { OrderStatus } from '@/types';
import type { Order } from '@/types';

interface DeliveryRatingModalState {
  isOpen: boolean;
  order: Order | null;
  showModal: (order: Order) => void;
  hideModal: () => void;
  completeRating: () => void;
}

export function useDeliveryRatingModal(): DeliveryRatingModalState {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const previousOrdersRef = useRef<{ [key: string]: OrderStatus }>({});
  const ratedOrdersRef = useRef<Set<string>>(new Set());

  // Kullanıcının siparişlerini dinle
  useEffect(() => {
    if (!user) return;

    // Önceki listener'ı temizle
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Kullanıcının son 24 saatteki siparişlerini dinle
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      where('createdAt', '>=', yesterday),
      orderBy('createdAt', 'desc')
    );

    unsubscribeRef.current = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const orderData = {
            id: change.doc.id,
            ...change.doc.data(),
            createdAt: change.doc.data().createdAt?.toDate() || new Date(),
            updatedAt: change.doc.data().updatedAt?.toDate() || new Date(),
            estimatedDeliveryTime: change.doc.data().estimatedDeliveryTime?.toDate() || new Date(),
            actualDeliveryTime: change.doc.data().actualDeliveryTime?.toDate()
          } as Order;

          const previousStatus = previousOrdersRef.current[orderData.id];
          const currentStatus = orderData.status;

          // Sipariş teslim edildi ve daha önce puanlanmadı
          if (
            previousStatus && 
            previousStatus !== OrderStatus.DELIVERED && 
            currentStatus === OrderStatus.DELIVERED &&
            !ratedOrdersRef.current.has(orderData.id)
          ) {
            console.log('🎉 Sipariş teslim edildi, puanlama modal\'ı gösteriliyor:', orderData.id);
            
            // 2 saniye bekle, sonra modal'ı göster
            setTimeout(() => {
              showModal(orderData);
            }, 2000);
          }

          // Sipariş durumunu güncelle
          previousOrdersRef.current[orderData.id] = currentStatus;
        }

        // İlk yükleme için mevcut durumları kaydet
        if (change.type === 'added') {
          const orderData = {
            id: change.doc.id,
            ...change.doc.data()
          } as Order;
          
          previousOrdersRef.current[orderData.id] = orderData.status;
        }
      });
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  // Modal'ı göster
  const showModal = (orderData: Order) => {
    setOrder(orderData);
    setIsOpen(true);
  };

  // Modal'ı gizle
  const hideModal = () => {
    setIsOpen(false);
    setOrder(null);
  };

  // Puanlama tamamlandı
  const completeRating = () => {
    if (order) {
      // Bu siparişi puanlandı olarak işaretle
      ratedOrdersRef.current.add(order.id);
      
      // Local storage'a kaydet (sayfa yenilenmelerinde hatırlamak için)
      const ratedOrders = Array.from(ratedOrdersRef.current);
      localStorage.setItem('ratedOrders', JSON.stringify(ratedOrders));
    }
    
    hideModal();
  };

  // Sayfa yüklendiğinde daha önce puanlanan siparişleri yükle
  useEffect(() => {
    try {
      const savedRatedOrders = localStorage.getItem('ratedOrders');
      if (savedRatedOrders) {
        const ratedOrders = JSON.parse(savedRatedOrders) as string[];
        ratedOrdersRef.current = new Set(ratedOrders);
      }
    } catch (error) {
      console.error('Puanlanan siparişler yüklenirken hata:', error);
    }
  }, []);

  return {
    isOpen,
    order,
    showModal,
    hideModal,
    completeRating
  };
} 