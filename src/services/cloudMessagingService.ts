import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from '@/lib/firebase';

// Firebase Cloud Messaging yapılandırması
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export class CloudMessagingService {
  private static vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  // FCM token al
  static async getToken(): Promise<string | null> {
    if (!messaging || !this.vapidKey) {
      console.warn('Firebase Messaging veya VAPID key yapılandırılmamış');
      return null;
    }

    try {
      // Bildirim izni iste
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Bildirim izni reddedildi');
        return null;
      }

      // FCM token al
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey
      });

      if (token) {
        console.log('FCM Token alındı:', token);
        return token;
      } else {
        console.log('FCM Token alınamadı');
        return null;
      }
    } catch (error) {
      console.error('FCM Token alma hatası:', error);
      return null;
    }
  }

  // Foreground mesajları dinle
  static onForegroundMessage(callback: (payload: any) => void) {
    if (!messaging) return;

    return onMessage(messaging, (payload) => {
      console.log('Foreground mesaj alındı:', payload);
      callback(payload);
    });
  }

  // Kullanıcıya sipariş bildirimi gönder
  static async sendOrderNotification(data: {
    userId: string;
    orderId: string;
    status: string;
    restaurantName: string;
    estimatedTime?: number;
  }) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'order_update',
          userId: data.userId,
          data: {
            orderId: data.orderId,
            status: data.status,
            restaurantName: data.restaurantName,
            estimatedTime: data.estimatedTime
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Bildirim gönderme hatası');
      }

      console.log('Sipariş bildirimi gönderildi:', data.orderId);
    } catch (error) {
      console.error('Sipariş bildirimi gönderme hatası:', error);
    }
  }

  // Restorana yeni sipariş bildirimi gönder
  static async sendNewOrderNotification(data: {
    restaurantId: string;
    orderId: string;
    customerName: string;
    totalAmount: number;
    items: any[];
  }) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'new_order',
          restaurantId: data.restaurantId,
          data: {
            orderId: data.orderId,
            customerName: data.customerName,
            totalAmount: data.totalAmount,
            itemCount: data.items.length
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Restoran bildirimi gönderme hatası');
      }

      console.log('Yeni sipariş bildirimi gönderildi:', data.orderId);
    } catch (error) {
      console.error('Restoran bildirimi gönderme hatası:', error);
    }
  }

  // Promosyon bildirimi gönder
  static async sendPromotionNotification(data: {
    userIds?: string[];
    segment?: string; // 'all', 'vip', 'loyal', 'inactive'
    title: string;
    message: string;
    imageUrl?: string;
    actionUrl?: string;
  }) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'promotion',
          userIds: data.userIds,
          segment: data.segment,
          data: {
            title: data.title,
            message: data.message,
            imageUrl: data.imageUrl,
            actionUrl: data.actionUrl
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Promosyon bildirimi gönderme hatası');
      }

      console.log('Promosyon bildirimi gönderildi');
    } catch (error) {
      console.error('Promosyon bildirimi gönderme hatası:', error);
    }
  }

  // Teslimat bildirimi gönder
  static async sendDeliveryNotification(data: {
    userId: string;
    orderId: string;
    driverName?: string;
    driverPhone?: string;
    estimatedArrival?: number;
    trackingUrl?: string;
  }) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'delivery_update',
          userId: data.userId,
          data: {
            orderId: data.orderId,
            driverName: data.driverName,
            driverPhone: data.driverPhone,
            estimatedArrival: data.estimatedArrival,
            trackingUrl: data.trackingUrl
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Teslimat bildirimi gönderme hatası');
      }

      console.log('Teslimat bildirimi gönderildi:', data.orderId);
    } catch (error) {
      console.error('Teslimat bildirimi gönderme hatası:', error);
    }
  }

  // Restoran başvuru durumu bildirimi
  static async sendRestaurantApplicationNotification(data: {
    userId: string;
    restaurantName: string;
    status: 'approved' | 'rejected';
    adminNotes?: string;
  }) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'restaurant_application',
          userId: data.userId,
          data: {
            restaurantName: data.restaurantName,
            status: data.status,
            adminNotes: data.adminNotes
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Başvuru bildirimi gönderme hatası');
      }

      console.log('Restoran başvuru bildirimi gönderildi:', data.restaurantName);
    } catch (error) {
      console.error('Restoran başvuru bildirimi gönderme hatası:', error);
    }
  }

  // Toplu bildirim gönder
  static async sendBulkNotification(data: {
    userIds: string[];
    title: string;
    message: string;
    data?: any;
    imageUrl?: string;
  }) {
    try {
      const response = await fetch('/api/notifications/bulk-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: data.userIds,
          notification: {
            title: data.title,
            body: data.message,
            image: data.imageUrl
          },
          data: data.data
        }),
      });

      if (!response.ok) {
        throw new Error('Toplu bildirim gönderme hatası');
      }

      console.log('Toplu bildirim gönderildi:', data.userIds.length, 'kullanıcı');
    } catch (error) {
      console.error('Toplu bildirim gönderme hatası:', error);
    }
  }

  // Bildirim geçmişini al
  static async getNotificationHistory(userId: string, limit: number = 20) {
    try {
      const response = await fetch(`/api/notifications/history?userId=${userId}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Bildirim geçmişi alma hatası');
      }

      return await response.json();
    } catch (error) {
      console.error('Bildirim geçmişi alma hatası:', error);
      return [];
    }
  }

  // Bildirim ayarlarını güncelle
  static async updateNotificationSettings(userId: string, settings: {
    orderUpdates: boolean;
    promotions: boolean;
    deliveryUpdates: boolean;
    restaurantNews: boolean;
  }) {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          settings
        }),
      });

      if (!response.ok) {
        throw new Error('Bildirim ayarları güncelleme hatası');
      }

      console.log('Bildirim ayarları güncellendi:', userId);
    } catch (error) {
      console.error('Bildirim ayarları güncelleme hatası:', error);
    }
  }

  // Bildirim istatistikleri al
  static async getNotificationStats(restaurantId?: string) {
    try {
      const url = restaurantId 
        ? `/api/notifications/stats?restaurantId=${restaurantId}`
        : '/api/notifications/stats';
        
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Bildirim istatistikleri alma hatası');
      }

      return await response.json();
    } catch (error) {
      console.error('Bildirim istatistikleri alma hatası:', error);
      return null;
    }
  }

  // Anlık bildirim gönder (WebSocket ile)
  static async sendRealTimeNotification(data: {
    userId: string;
    type: string;
    message: string;
    data?: any;
  }) {
    try {
      // WebSocket bağlantısı varsa kullan
      if (typeof window !== 'undefined' && (window as any).wsConnection) {
        (window as any).wsConnection.send(JSON.stringify({
          type: 'notification',
          userId: data.userId,
          notification: {
            type: data.type,
            message: data.message,
            data: data.data,
            timestamp: new Date().toISOString()
          }
        }));
      }

      // Fallback olarak HTTP endpoint kullan
      const response = await fetch('/api/notifications/realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Anlık bildirim gönderme hatası');
      }

      console.log('Anlık bildirim gönderildi:', data.type);
    } catch (error) {
      console.error('Anlık bildirim gönderme hatası:', error);
    }
  }

  // Bildirim token'ını sunucuya kaydet
  static async saveTokenToServer(userId: string, token: string) {
    try {
      const response = await fetch('/api/notifications/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          platform: 'web',
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Token kaydetme hatası');
      }

      console.log('FCM Token sunucuya kaydedildi:', userId);
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
    }
  }

  // Service Worker'ı kaydet
  static async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker kaydedildi:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker kaydetme hatası:', error);
        return null;
      }
    }
    return null;
  }
} 