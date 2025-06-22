import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod, CommissionCalculation, EmailType } from '@/types';
import { CommissionService } from './commissionService';

export class OrderService {
  private static readonly COLLECTION_NAME = 'orders';

  // Sipariş oluşturma (komisyon hesaplama ve e-posta bildirimi ile)
  static async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'commissionCalculation'>): Promise<string> {
    try {
      console.log('🟦 OrderService Debug - Input orderData:', {
        userId: orderData.userId,
        restaurantId: orderData.restaurantId,
        itemCount: orderData.items?.length,
        userEmail: orderData.user?.email,
        isGuest: orderData.metadata?.orderType === 'guest',
        total: orderData.total,
        hasDeliveryAddress: !!orderData.deliveryAddress
      });

      // Validasyon kontrolleri
      if (!orderData.userId) {
        throw new Error('userId eksik');
      }
      if (!orderData.restaurantId) {
        throw new Error('restaurantId eksik');
      }
      if (!orderData.items || orderData.items.length === 0) {
        throw new Error('items eksik veya boş');
      }
      if (!orderData.user) {
        throw new Error('user bilgisi eksik');
      }

      // Komisyon hesaplama
      const commissionCalculation = CommissionService.calculateCommission(orderData.subtotal);
      console.log('🟦 OrderService Debug - Commission calculation:', commissionCalculation);
      
      const orderRef = doc(collection(db, this.COLLECTION_NAME));
      console.log('🟦 OrderService Debug - Order reference created:', orderRef.id);

      const firestoreData = {
        ...orderData,
        commissionCalculation,
        status: OrderStatus.PENDING,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('🟦 OrderService Debug - Data to be sent to Firestore:', {
        id: orderRef.id,
        userId: firestoreData.userId,
        restaurantId: firestoreData.restaurantId,
        itemCount: firestoreData.items.length,
        status: firestoreData.status,
        total: firestoreData.total,
        isGuest: firestoreData.metadata?.orderType === 'guest',
        hasDeliveryAddress: !!firestoreData.deliveryAddress,
        createdAt: '[ServerTimestamp]',
        updatedAt: '[ServerTimestamp]'
      });

      // Debug: Firestore güvenlik kuralı ile eşleşme kontrolü
      console.log('🟦 OrderService Debug - Security rule check:', {
        hasUserId: !!firestoreData.userId,
        userIdValue: firestoreData.userId,
        isUserIdString: typeof firestoreData.userId === 'string',
        userIdLength: firestoreData.userId?.length
      });

      console.log('🟦 OrderService Debug - Attempting Firestore write...');
      await setDoc(orderRef, firestoreData);
      console.log('🟢 OrderService Debug - Firestore write successful!');

      // Sipariş onay e-postası gönder (sadece e-posta varsa)
      if (orderData.user?.email) {
        try {
          console.log('🟦 OrderService Debug - Attempting to send confirmation email...');
          await this.sendOrderConfirmationEmail(orderRef.id, orderData);
          console.log('🟢 OrderService Debug - Confirmation email sent successfully!');
        } catch (emailError) {
          console.error('🟡 OrderService Debug - Email error (non-blocking):', emailError);
          // E-posta hatası sipariş oluşturmayı etkilemesin
        }
      } else {
        console.log('🟡 OrderService Debug - No email provided, skipping confirmation email');
      }

      console.log('🟢 OrderService Debug - Order creation completed successfully with ID:', orderRef.id);
      return orderRef.id;

    } catch (error) {
      console.error('🔴 OrderService Debug - Order creation failed:', error);
      
      if (error instanceof Error) {
        console.error('🔴 OrderService Debug - Error details:', {
          name: error.name,
          message: error.message,
          code: (error as any).code,
          stack: error.stack?.split('\n').slice(0, 5).join('\n') // İlk 5 satır
        });
      }
      
      // Firebase hatalarını daha anlaşılır hale getir
      if ((error as any)?.code) {
        const firebaseError = error as any;
        switch (firebaseError.code) {
          case 'permission-denied':
            throw new Error('Firestore izin hatası: Sipariş oluşturma yetkisi yok');
          case 'unavailable':
            throw new Error('Firestore geçici olarak kullanılamıyor, lütfen tekrar deneyin');
          case 'deadline-exceeded':
            throw new Error('Firestore zaman aşımı, lütfen tekrar deneyin');
          default:
            throw new Error(`Firestore hatası: ${firebaseError.message}`);
        }
      }
      
      throw error;
    }
  }

  // Sipariş onay e-postası gönderme
  private static async sendOrderConfirmationEmail(
    orderId: string, 
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'commissionCalculation'>
  ) {
    try {
      // Restoran bilgilerini al (gerçek implementasyonda RestaurantService'den gelecek)
      const restaurantName = 'Restoran'; // Şimdilik sabit

      const emailData = {
        orderId,
        customerName: orderData.user.displayName,
        customerEmail: orderData.user.email,
        restaurantName,
        orderItems: orderData.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: orderData.total,
        status: 'confirmed',
        estimatedDelivery: orderData.estimatedDeliveryTime.toLocaleString('tr-TR')
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: EmailType.ORDER_CONFIRMATION,
          data: emailData
        })
      });

      if (!response.ok) {
        throw new Error('E-posta API hatası');
      }
    } catch (error) {
      console.error('Sipariş onay e-postası gönderme hatası:', error);
      throw error;
    }
  }

  // Sipariş getirme
  static async getOrder(id: string): Promise<Order | null> {
    const orderRef = doc(db, this.COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      const data = orderSnap.data();
      return {
        id: orderSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate()
      } as Order;
    }
    
    return null;
  }

  // Kullanıcının siparişlerini getirme
  static async getUserOrders(userId: string): Promise<Order[]> {
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
      actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
    })) as Order[];
  }

  // Restoran siparişlerini getirme
  static async getRestaurantOrders(restaurantId: string): Promise<Order[]> {
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
      actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
    })) as Order[];
  }

  // Sipariş durumunu güncelleme (komisyon işlemi ve e-posta bildirimi ile)
  static async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const orderRef = doc(db, this.COLLECTION_NAME, orderId);
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === OrderStatus.DELIVERED) {
      updates.actualDeliveryTime = serverTimestamp();
    }

    await updateDoc(orderRef, updates);

    // Sipariş durumu güncelleme e-postası gönder
    try {
      await this.sendOrderStatusUpdateEmail(orderId, status);
    } catch (emailError) {
      console.error('Sipariş durumu güncelleme e-postası gönderilirken hata:', emailError);
      // E-posta hatası sipariş güncellemeyi etkilemesin
    }

    // Eğer sipariş teslim edildiyse, mali işlem oluştur
    if (status === OrderStatus.DELIVERED) {
      try {
        const order = await this.getOrder(orderId);
        if (order) {
          await CommissionService.processOrderCompletion(order);
        }
      } catch (error) {
        console.error('Mali işlem oluşturulurken hata:', error);
        // Sipariş durumu güncellendi ama mali işlem başarısız oldu
        // Bu durumda manuel müdahale gerekebilir
      }
    }
  }

  // Sipariş durumu güncelleme e-postası gönderme
  private static async sendOrderStatusUpdateEmail(orderId: string, status: OrderStatus) {
    try {
      const order = await this.getOrder(orderId);
      if (!order) return;

      // Restoran bilgilerini al (gerçek implementasyonda RestaurantService'den gelecek)
      const restaurantName = 'Restoran'; // Şimdilik sabit

      const emailData = {
        orderId,
        customerName: order.user.displayName,
        customerEmail: order.user.email,
        restaurantName,
        orderItems: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        status: this.getOrderStatusText(status)
      };

      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailType: EmailType.ORDER_STATUS_UPDATE,
          data: emailData
        })
      });

      if (!response.ok) {
        throw new Error('E-posta API hatası');
      }
    } catch (error) {
      console.error('Sipariş durumu güncelleme e-postası gönderme hatası:', error);
      throw error;
    }
  }

  // Aktif siparişleri getirme
  static async getActiveOrders(): Promise<Order[]> {
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('status', 'in', [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.DELIVERING
      ]),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
      actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
    })) as Order[];
  }

  // Restoran aktif siparişlerini getirme
  static async getRestaurantActiveOrders(restaurantId: string): Promise<Order[]> {
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      where('status', 'in', [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
        OrderStatus.DELIVERING
      ]),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
      actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
    })) as Order[];
  }

  // Real-time sipariş dinleme
  static subscribeToUserOrders(
    userId: string,
    callback: (orders: Order[]) => void
  ): Unsubscribe {
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
      })) as Order[];
      
      callback(orders);
    });
  }

  // Restoran siparişlerini real-time dinleme
  static subscribeToRestaurantOrders(
    restaurantId: string,
    callback: (orders: Order[]) => void
  ): Unsubscribe {
    const ordersRef = collection(db, this.COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
      })) as Order[];
      
      callback(orders);
    });
  }

  // Ödeme yöntemi metinleri
  static getPaymentMethodText(method: PaymentMethod): string {
    return CommissionService.getPaymentMethodText(method);
  }

  // Sipariş durumu metinleri
  static getOrderStatusText(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Bekliyor';
      case OrderStatus.CONFIRMED:
        return 'Onaylandı';
      case OrderStatus.PREPARING:
        return 'Hazırlanıyor';
      case OrderStatus.READY:
        return 'Hazır';
      case OrderStatus.DELIVERING:
        return 'Yolda';
      case OrderStatus.DELIVERED:
        return 'Teslim Edildi';
      case OrderStatus.CANCELLED:
        return 'İptal Edildi';
      default:
        return 'Bilinmeyen';
    }
  }
} 