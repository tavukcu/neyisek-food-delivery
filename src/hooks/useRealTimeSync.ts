import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  doc,
  Unsubscribe,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, Transaction, User } from '@/types';
import { OrderService } from '@/services/orderService';
import { CommissionService } from '@/services/commissionService';
import { toast } from 'react-hot-toast';

// Tüm siparişleri real-time dinleme (Admin için)
export function useAllOrdersRealTime() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    
    const q = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );

    unsubscribeRef.current = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
          actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
        })) as Order[];
        
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Siparişler dinlenirken hata:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return { orders, loading, error };
}

// Restoran siparişlerini real-time dinleme
export function useRestaurantOrdersRealTime(restaurantId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);

  useEffect(() => {
    if (!restaurantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    unsubscribeRef.current = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
          actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
        })) as Order[];
        
        // Yeni siparişleri tespit et
        const previousOrders = previousOrdersRef.current;
        const newOrders = ordersData.filter(order => 
          !previousOrders.find(prev => prev.id === order.id) && 
          order.status === OrderStatus.PENDING
        );

        if (newOrders.length > 0 && previousOrders.length > 0) {
          setNewOrdersCount(prev => prev + newOrders.length);
          newOrders.forEach(order => {
            toast.success(`Yeni sipariş alındı! #${order.id.slice(-6)}`, {
              duration: 5000,
              position: 'top-right',
            });
          });
        }

        // Aktif siparişleri filtrele
        const active = ordersData.filter(order => 
          [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, 
           OrderStatus.READY, OrderStatus.DELIVERING].includes(order.status)
        );

        setOrders(ordersData);
        setActiveOrders(active);
        setLoading(false);
        setError(null);
        previousOrdersRef.current = ordersData;
      },
      (error) => {
        console.error('Restoran siparişleri dinlenirken hata:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [restaurantId]);

  const clearNewOrdersCount = useCallback(() => {
    setNewOrdersCount(0);
  }, []);

  return { 
    orders, 
    activeOrders, 
    newOrdersCount, 
    clearNewOrdersCount,
    loading, 
    error 
  };
}

// Kullanıcı siparişlerini real-time dinleme (bildirimlerle)
export function useUserOrdersRealTime(userId: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const previousOrdersRef = useRef<Order[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    unsubscribeRef.current = onSnapshot(
      q,
      (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
          actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
        })) as Order[];
        
        // Durum değişikliklerini tespit et
        const previousOrders = previousOrdersRef.current;
        ordersData.forEach(order => {
          const previousOrder = previousOrders.find(prev => prev.id === order.id);
          if (previousOrder && previousOrder.status !== order.status) {
            // Durum değişikliği bildirimi
            const statusText = OrderService.getOrderStatusText(order.status);
            toast.success(`Siparişiniz güncellendi: ${statusText}`, {
              duration: 4000,
              position: 'top-right',
            });
          }
        });

        setOrders(ordersData);
        setLoading(false);
        setError(null);
        previousOrdersRef.current = ordersData;
      },
      (error) => {
        console.error('Kullanıcı siparişleri dinlenirken hata:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);

  return { orders, loading, error };
}

// Belirli bir siparişi real-time dinleme
export function useOrderRealTime(orderId: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    const orderDoc = doc(db, 'orders', orderId);

    unsubscribeRef.current = onSnapshot(
      orderDoc,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const orderData = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
            actualDeliveryTime: data.actualDeliveryTime?.toDate()
          } as Order;
          
          setOrder(orderData);
        } else {
          setOrder(null);
        }
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Sipariş dinlenirken hata:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [orderId]);

  return { order, loading, error };
}

// Mali işlemleri real-time dinleme
export function useTransactionsRealTime(restaurantId?: string) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    setLoading(true);
    
    let q = query(
      collection(db, 'transactions'),
      orderBy('createdAt', 'desc')
    );

    if (restaurantId) {
      q = query(
        collection(db, 'transactions'),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
    }

    unsubscribeRef.current = onSnapshot(
      q,
      (querySnapshot) => {
        const transactionsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          processedAt: doc.data().processedAt?.toDate()
        })) as Transaction[];
        
        setTransactions(transactionsData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('İşlemler dinlenirken hata:', error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [restaurantId]);

  return { transactions, loading, error };
}

// Sipariş durumu güncelleme hook'u
export function useOrderStatusUpdate() {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setUpdating(true);
    setError(null);
    
    try {
      await OrderService.updateOrderStatus(orderId, status);
      toast.success(`Sipariş durumu güncellendi: ${OrderService.getOrderStatusText(status)}`);
    } catch (err: any) {
      setError(err.message);
      toast.error('Durum güncellenirken hata oluştu');
    } finally {
      setUpdating(false);
    }
  }, []);

  return { updateStatus, updating, error };
}

// Real-time bildirim sistemi
export function useRealTimeNotifications(userId: string, userRole: 'customer' | 'restaurant' | 'admin') {
  const [notifications, setNotifications] = useState<any[]>([]);
  
  useEffect(() => {
    if (!userId) return;

    // Rol bazında farklı bildirimler
    switch (userRole) {
      case 'customer':
        // Müşteriler kendi siparişlerinin durumunu takip eder
        break;
      case 'restaurant':
        // Restoranlar yeni siparişleri ve ödeme bildirimlerini alır
        break;
      case 'admin':
        // Admin tüm sistemi izler
        break;
    }

    return () => {
      // Cleanup
    };
  }, [userId, userRole]);

  return { notifications };
}

// Otomatik yenileme hook'u
export function useAutoRefresh(intervalMs: number = 30000) {
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return { lastRefresh };
} 