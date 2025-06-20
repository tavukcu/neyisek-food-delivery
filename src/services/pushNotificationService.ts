interface ExtendedNotificationOptions {
  onClick?: () => void;
  body?: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  vibrate?: number[] | number;
  dir?: NotificationDirection;
  lang?: string;
}

export class PushNotificationService {
  private static isSupported = typeof window !== 'undefined' && 'Notification' in window;
  private static permission: NotificationPermission = 'default';

  // Bildirimi destekleyip desteklemediğini kontrol et
  static isNotificationSupported(): boolean {
    return this.isSupported;
  }

  // Bildirim iznini kontrol et
  static async checkPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    this.permission = Notification.permission;
    return this.permission;
  }

  // Bildirim izni iste
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser bildirimleri desteklenmiyor');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      this.permission = await Notification.requestPermission();
    } else {
      this.permission = Notification.permission;
    }

    return this.permission;
  }

  // Push bildirimi gönder
  static async sendNotification(
    title: string,
    options?: ExtendedNotificationOptions
  ): Promise<Notification | null> {
    // İzin kontrolü
    const permission = await this.checkPermission();
    if (permission !== 'granted') {
      console.warn('Bildirim izni verilmemiş');
      return null;
    }

    try {
      // Bildirim seçenekleri - sadece desteklenen özellikler
      const notificationOptions: NotificationOptions = {
        body: options?.body || '',
        icon: options?.icon || '/icon-192x192.png',
        tag: options?.tag || 'neyisek-notification',
        requireInteraction: options?.requireInteraction || false,
        silent: options?.silent || false,
        data: options?.data || {},
        dir: options?.dir,
        lang: options?.lang
      };

      // Bildirimi oluştur
      const notification = new Notification(title, notificationOptions);

      // Vibration API'sini manuel olarak kullan (destekleniyorsa)
      if (options?.vibrate && 'vibrate' in navigator) {
        navigator.vibrate(options.vibrate);
      }

      // Click event handler
      if (options?.onClick) {
        notification.onclick = (event) => {
          event.preventDefault();
          options.onClick?.();
          notification.close();
          
          // Pencereyi odakla
          if (window) {
            window.focus();
          }
        };
      }

      // Otomatik kapanma
      setTimeout(() => {
        notification.close();
      }, options?.requireInteraction ? 10000 : 5000);

      return notification;

    } catch (error) {
      console.error('Bildirim gönderilirken hata:', error);
      return null;
    }
  }

  // Sipariş bildirimi (Restoran için)
  static async sendOrderNotification(orderData: {
    orderId: string;
    customerName: string;
    total: number;
    items: any[];
  }): Promise<Notification | null> {
    const title = '🍽️ Yeni Sipariş Alındı!';
    const body = `${orderData.customerName} - ${orderData.total} TL\nSipariş #${orderData.orderId.slice(-8)}`;

    return this.sendNotification(title, {
      body,
      icon: '/icon-192x192.png',
      tag: `order-${orderData.orderId}`,
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300],
      data: {
        type: 'new_order',
        orderId: orderData.orderId,
        url: `/restaurant/orders/${orderData.orderId}`
      },
      onClick: () => {
        window.open(`/restaurant/orders/${orderData.orderId}`, '_blank');
      }
    });
  }

  // Sipariş durumu bildirimi (Müşteri için)
  static async sendOrderStatusNotification(orderData: {
    orderId: string;
    status: string;
    restaurantName: string;
  }): Promise<Notification | null> {
    const statusEmoji = this.getStatusEmoji(orderData.status);
    const title = `${statusEmoji} Sipariş Durumu Güncellendi`;
    const body = `${orderData.restaurantName}\nSiparişiniz: ${orderData.status}`;

    return this.sendNotification(title, {
      body,
      icon: '/icon-192x192.png',
      tag: `status-${orderData.orderId}`,
      data: {
        type: 'status_update',
        orderId: orderData.orderId,
        status: orderData.status,
        url: `/account/orders/${orderData.orderId}`
      },
      onClick: () => {
        window.open(`/account/orders/${orderData.orderId}`, '_blank');
      }
    });
  }

  // Admin bildirimi
  static async sendAdminNotification(data: {
    title: string;
    message: string;
    type: 'order' | 'payment' | 'system' | 'alert';
    url?: string;
  }): Promise<Notification | null> {
    const icon = this.getAdminIcon(data.type);
    const title = `${icon} ${data.title}`;

    return this.sendNotification(title, {
      body: data.message,
      icon: '/icon-192x192.png',
      tag: `admin-${data.type}-${Date.now()}`,
      requireInteraction: data.type === 'alert',
      data: {
        type: 'admin',
        subType: data.type,
        url: data.url
      },
      onClick: () => {
        if (data.url) {
          window.open(data.url, '_blank');
        }
      }
    });
  }

  // Bildirim sesini çal
  static playNotificationSound(type: 'order' | 'status' | 'alert' = 'order'): void {
    try {
      const audio = new Audio();
      
      switch (type) {
        case 'order':
          // Yeni sipariş sesi (daha dikkat çekici)
          audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgeACWAz/LZiTYIG2m98+OeUQkSVqnf8bllHgU5j9n02n0qAyiAzPDacj0LGHrF7+WQTQ0PUKZixVLVAuT8k=';
          break;
        case 'status':
          // Durum güncelleme sesi (daha yumuşak)
          audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgLsAAADuAgAEABAAZGF0YQAAAAA=';
          break;
        case 'alert':
          // Uyarı sesi (acil)
          audio.src = 'data:audio/wav;base64,UklGRvwGAABXQVZFZm10IBAAAAABAAEAgLsAAADuAgAEABAAZGF0YeAGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmgeACWAz/LZiTYIG2m98+OeUQkSVqnf8bllHgU5j9n02n0qAyiAzPDacj0LGHrF7+WQTQ0PUKni';
          break;
      }
      
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Ses çalınamadı:', e));
    } catch (error) {
      console.log('Ses desteği yok:', error);
    }
  }

  // Durum emojisi
  private static getStatusEmoji(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳',
      'confirmed': '✅',
      'preparing': '👨‍🍳',
      'ready': '📦',
      'delivering': '🚚',
      'delivered': '🎉',
      'cancelled': '❌'
    };
    return statusMap[status.toLowerCase()] || '📱';
  }

  // Admin ikon
  private static getAdminIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'order': '📋',
      'payment': '💰',
      'system': '⚙️',
      'alert': '🚨'
    };
    return iconMap[type] || '📢';
  }

  // Tüm bildirimleri temizle
  static clearAllNotifications(): void {
    // Mevcut bildirimleri kapat (sadece bizimkileri)
    // Bu API henüz tam desteklenmiyor, gelecekte geliştirilebilir
  }

  // Service Worker ile push notifications (gelecekte geliştirilebilir)
  static async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker kaydedildi:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker kaydedilemedi:', error);
        return null;
      }
    }
    return null;
  }

  // Push subscription (gelecekte geliştirilebilir)
  static async subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
      return subscription;
    } catch (error) {
      console.error('Push subscription oluşturulamadı:', error);
      return null;
    }
  }
} 