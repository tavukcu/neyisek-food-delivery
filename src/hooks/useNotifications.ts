import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  limit 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus } from '@/types';
import { toast } from 'react-hot-toast';
import { PushNotificationService } from '@/services/pushNotificationService';
import { useAuth } from '@/hooks/useAuth';

// Bildirim türleri
export interface Notification {
  id: string;
  type: 'new_order' | 'status_update' | 'payment' | 'system';
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

// Hook return tipi
export interface NotificationHook {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

// Admin için tüm sipariş bildirimlerini dinle
export function useAdminNotifications(): NotificationHook {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isInitializedRef = useRef(false);
  const lastOrderTimestampRef = useRef<Date | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    // Kullanıcı admin değilse çalışma
    if (!user?.isAdmin) {
      return;
    }

    // Sadece admin panelinde bildirim göster - güçlendirilmiş kontrol
    const isAdminPage = typeof window !== 'undefined' && 
                       (window.location.pathname.startsWith('/admin') || 
                        window.location.pathname === '/admin');
    
    if (!isAdminPage) {
      return;
    }

    // Push notification izni iste
    PushNotificationService.requestPermission();

    // Yeni siparişleri dinle
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      // İlk yükleme - sadece timestamp'i kaydet, bildirim gösterme
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        
        // En son sipariş zamanını kaydet
        if (!snapshot.empty) {
          const latestOrder = snapshot.docs[0].data();
          lastOrderTimestampRef.current = latestOrder.createdAt?.toDate() || new Date();
        }
        
        return;
      }

      // Sadece yeni eklenen siparişler için bildirim göster
      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...change.doc.data() } as Order & { id: string };
        
        // Firestore Timestamp'i Date'e çevir
        let orderCreatedAt: Date;
        const createdAtField = order.createdAt as any;
        
        if (createdAtField && typeof createdAtField.toDate === 'function') {
          // Firestore Timestamp
          orderCreatedAt = createdAtField.toDate();
        } else if (createdAtField instanceof Date) {
          // Zaten Date
          orderCreatedAt = createdAtField;
        } else {
          // Fallback
          orderCreatedAt = new Date();
        }

        if (change.type === 'added') {
          // Sadece son bilinen sipariş zamanından sonraki siparişleri bildir
          if (lastOrderTimestampRef.current && orderCreatedAt <= lastOrderTimestampRef.current) {
            return; // Eski sipariş, bildirim gösterme
          }
          
          // Yeni sipariş bildirimi
          const notification: Notification = {
            id: `new-order-${order.id}`,
            type: 'new_order',
            title: 'Yeni Sipariş',
            message: `Yeni sipariş alındı: #${order.id.slice(-8)}`,
            orderId: order.id,
            read: false,
            createdAt: new Date(),
            data: order
          };

          setNotifications(prev => [notification, ...prev]);
          
          // Toast bildirimi
          toast.success(`🔔 Yeni sipariş: #${order.id.slice(-8)}`, {
            icon: '🔔',
            duration: 4000
          });

          // Browser push notification
          PushNotificationService.sendAdminNotification({
            title: 'Yeni Sipariş Alındı',
            message: `Sipariş #${order.id.slice(-8)} - ${order.total} TL`,
            type: 'order',
            url: `/admin/orders/${order.id}`
          });

          // Bildirim sesi
          PushNotificationService.playNotificationSound('order');

          // Son sipariş zamanını güncelle
          lastOrderTimestampRef.current = orderCreatedAt;
        }

        if (change.type === 'modified') {
          // Sipariş durumu güncelleme bildirimi (daha az agresif)
          const notification: Notification = {
            id: `status-${order.id}-${Date.now()}`,
            type: 'status_update',
            title: 'Sipariş Durumu Güncellendi',
            message: `Sipariş #${order.id.slice(-8)} durumu güncellendi`,
            orderId: order.id,
            read: false,
            createdAt: new Date(),
            data: order
          };

          setNotifications(prev => [notification, ...prev]);
        }
      });
    });

    return () => unsubscribe();
  }, [user?.isAdmin]); // Sadece admin durumu değiştiğinde yeniden çalıştır

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Bildirimleri temizle
  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}

// Restoran için sipariş bildirimlerini dinle
export function useRestaurantNotifications(restaurantId: string): NotificationHook {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const isInitializedRef = useRef(false);
  const lastOrderTimestampRef = useRef<Date | null>(null);

  useEffect(() => {
    if (!restaurantId) return;

    // Sadece restoran panelinde bildirim göster
    const isRestaurantPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/restaurant');
    
    if (!isRestaurantPage) {
      return;
    }

    // Push notification izni iste
    PushNotificationService.requestPermission();

    // Restoran siparişlerini dinle
    const ordersQuery = query(
      collection(db, 'orders'),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      // İlk yükleme - sadece timestamp'i kaydet, bildirim gösterme
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        
        // En son sipariş zamanını kaydet
        if (!snapshot.empty) {
          const latestOrder = snapshot.docs[0].data();
          const createdAtField = latestOrder.createdAt as any;
          if (createdAtField && typeof createdAtField.toDate === 'function') {
            lastOrderTimestampRef.current = createdAtField.toDate();
          } else {
            lastOrderTimestampRef.current = new Date();
          }
        }
        
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...change.doc.data() } as Order & { id: string };

        if (change.type === 'added') {
          // Firestore Timestamp'i Date'e çevir
          let orderCreatedAt: Date;
          const createdAtField = order.createdAt as any;
          
          if (createdAtField && typeof createdAtField.toDate === 'function') {
            orderCreatedAt = createdAtField.toDate();
          } else if (createdAtField instanceof Date) {
            orderCreatedAt = createdAtField;
          } else {
            orderCreatedAt = new Date();
          }

          // Sadece son bilinen sipariş zamanından sonraki siparişleri bildir
          if (lastOrderTimestampRef.current && orderCreatedAt <= lastOrderTimestampRef.current) {
            return; // Eski sipariş, bildirim gösterme
          }

          // Yeni sipariş bildirimi
          const notification: Notification = {
            id: `new-order-${order.id}`,
            type: 'new_order',
            title: 'Yeni Sipariş Aldınız!',
            message: `Sipariş #${order.id.slice(-8)} - ${order.total} TL`,
            orderId: order.id,
            read: false,
            createdAt: new Date(),
            data: order
          };

          setNotifications(prev => [notification, ...prev]);
          
          // Toast bildirimi
          toast.success(`Yeni sipariş alındı! #${order.id.slice(-8)}`, {
            icon: '🍽️',
            duration: 5000
          });

          // Browser push notification
          PushNotificationService.sendOrderNotification({
            orderId: order.id,
            customerName: order.user?.displayName || 'Müşteri',
            total: order.total,
            items: order.items
          });

          // Bildirim sesi
          PushNotificationService.playNotificationSound('order');

          // Son sipariş zamanını güncelle
          lastOrderTimestampRef.current = orderCreatedAt;
        }

        if (change.type === 'modified') {
          // Sipariş güncelleme bildirimi (daha az agresif)
          const notification: Notification = {
            id: `update-${order.id}-${Date.now()}`,
            type: 'status_update',
            title: 'Sipariş Güncellendi',
            message: `Sipariş #${order.id.slice(-8)} güncellendi`,
            orderId: order.id,
            read: false,
            createdAt: new Date(),
            data: order
          };

          setNotifications(prev => [notification, ...prev]);
        }
      });
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}

// Müşteri için sipariş bildirimlerini dinle
export function useUserNotifications(userId: string): NotificationHook {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Push notification izni iste
    PushNotificationService.requestPermission();

    // Kullanıcının siparişlerini dinle
    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const order = { id: change.doc.id, ...change.doc.data() } as Order & { id: string };

        if (change.type === 'modified') {
          // Sipariş durumu değiştiğinde bildirim
          const statusText = getStatusText(order.status);
          
          const notification: Notification = {
            id: `status-${order.id}-${Date.now()}`,
            type: 'status_update',
            title: 'Sipariş Durumu Güncellendi',
            message: `Siparişiniz: ${statusText}`,
            orderId: order.id,
            read: false,
            createdAt: new Date(),
            data: order
          };

          setNotifications(prev => [notification, ...prev]);
          
          // Toast bildirimi
          toast.success(`Siparişiniz ${statusText.toLowerCase()}`, {
            icon: getStatusIcon(order.status),
            duration: 4000
          });

          // Browser push notification
          PushNotificationService.sendOrderStatusNotification({
            orderId: order.id,
            status: statusText,
            restaurantName: 'NeYisek Restoran'
          });

          // Bildirim sesi
          PushNotificationService.playNotificationSound('status');
        }
      });
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  };
}

// Yardımcı fonksiyonlar
function getStatusText(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return 'Bekliyor';
    case OrderStatus.CONFIRMED: return 'Onaylandı';
    case OrderStatus.PREPARING: return 'Hazırlanıyor';
    case OrderStatus.READY: return 'Hazır';
    case OrderStatus.DELIVERING: return 'Yolda';
    case OrderStatus.DELIVERED: return 'Teslim Edildi';
    case OrderStatus.CANCELLED: return 'İptal Edildi';
    default: return 'Bilinmiyor';
  }
}

function getStatusIcon(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING: return '⏳';
    case OrderStatus.CONFIRMED: return '✅';
    case OrderStatus.PREPARING: return '👨‍🍳';
    case OrderStatus.READY: return '📦';
    case OrderStatus.DELIVERING: return '🚚';
    case OrderStatus.DELIVERED: return '🎉';
    case OrderStatus.CANCELLED: return '❌';
    default: return '📱';
  }
} 