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
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CommissionCalculation, 
  Transaction, 
  RestaurantFinancials, 
  PaymentMethod,
  Order 
} from '@/types';

export class CommissionService {
  private static readonly TRANSACTIONS_COLLECTION = 'transactions';
  private static readonly FINANCIALS_COLLECTION = 'restaurant_financials';
  private static readonly DEFAULT_COMMISSION_RATE = 0.09; // %9 komisyon

  // Komisyon hesaplama
  static calculateCommission(
    subtotal: number, 
    commissionRate: number = this.DEFAULT_COMMISSION_RATE
  ): CommissionCalculation {
    const commissionAmount = subtotal * commissionRate;
    const restaurantEarning = subtotal - commissionAmount;
    
    return {
      subtotal,
      commissionRate,
      commissionAmount,
      restaurantEarning,
      platformEarning: commissionAmount
    };
  }

  // Mali işlem oluşturma
  static async createTransaction(
    orderId: string,
    restaurantId: string,
    commissionCalculation: CommissionCalculation,
    paymentMethod: PaymentMethod
  ): Promise<string> {
    const transactionRef = doc(collection(db, this.TRANSACTIONS_COLLECTION));
    
    const transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
      orderId,
      restaurantId,
      type: 'commission',
      amount: commissionCalculation.subtotal,
      commissionAmount: commissionCalculation.commissionAmount,
      platformAmount: commissionCalculation.platformEarning,
      restaurantAmount: commissionCalculation.restaurantEarning,
      paymentMethod,
      status: 'pending'
    };

    await setDoc(transactionRef, {
      ...transactionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return transactionRef.id;
  }

  // Mali işlem durumunu güncelleme
  static async updateTransactionStatus(
    transactionId: string, 
    status: 'completed' | 'failed'
  ): Promise<void> {
    const transactionRef = doc(db, this.TRANSACTIONS_COLLECTION, transactionId);
    
    const updates: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (status === 'completed') {
      updates.processedAt = serverTimestamp();
    }

    await updateDoc(transactionRef, updates);
  }

  // Restoran mali işlemlerini getirme
  static async getRestaurantTransactions(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Transaction[]> {
    let q = query(
      collection(db, this.TRANSACTIONS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );

    if (startDate) {
      q = query(q, where('createdAt', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      q = query(q, where('createdAt', '<=', Timestamp.fromDate(endDate)));
    }

    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      processedAt: doc.data().processedAt?.toDate()
    })) as Transaction[];
  }

  // Restoran mali özetini hesaplama
  static async calculateRestaurantFinancials(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<RestaurantFinancials> {
    // İşlemleri getir
    const transactions = await this.getRestaurantTransactions(restaurantId, startDate, endDate);
    const completedTransactions = transactions.filter(t => t.status === 'completed');

    // Toplam hesaplamalar
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = completedTransactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const netEarning = completedTransactions.reduce((sum, t) => sum + t.restaurantAmount, 0);
    const totalOrders = completedTransactions.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Ödeme yöntemi dağılımı
    const cashTransactions = completedTransactions.filter(t => t.paymentMethod === PaymentMethod.CASH_ON_DELIVERY);
    const cardTransactions = completedTransactions.filter(t => t.paymentMethod === PaymentMethod.CARD_ON_DELIVERY);

    const paymentMethodBreakdown = {
      cash: {
        count: cashTransactions.length,
        amount: cashTransactions.reduce((sum, t) => sum + t.amount, 0),
        commission: cashTransactions.reduce((sum, t) => sum + t.commissionAmount, 0)
      },
      card: {
        count: cardTransactions.length,
        amount: cardTransactions.reduce((sum, t) => sum + t.amount, 0),
        commission: cardTransactions.reduce((sum, t) => sum + t.commissionAmount, 0)
      }
    };

    // Günlük dağılım hesaplama
    const dailyMap = new Map<string, {
      revenue: number;
      commission: number;
      netEarning: number;
      orderCount: number;
    }>();

    completedTransactions.forEach(transaction => {
      const dateKey = transaction.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(dateKey) || {
        revenue: 0,
        commission: 0,
        netEarning: 0,
        orderCount: 0
      };

      dailyMap.set(dateKey, {
        revenue: existing.revenue + transaction.amount,
        commission: existing.commission + transaction.commissionAmount,
        netEarning: existing.netEarning + transaction.restaurantAmount,
        orderCount: existing.orderCount + 1
      });
    });

    const dailyBreakdown = Array.from(dailyMap.entries()).map(([dateStr, data]) => ({
      date: new Date(dateStr),
      revenue: data.revenue,
      commission: data.commission,
      netEarning: data.netEarning,
      orderCount: data.orderCount
    })).sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      restaurantId,
      period: { startDate, endDate },
      totalRevenue,
      totalCommission,
      netEarning,
      totalOrders,
      averageOrderValue,
      commissionRate: this.DEFAULT_COMMISSION_RATE,
      paymentMethodBreakdown,
      dailyBreakdown,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Mali özeti kaydetme
  static async saveRestaurantFinancials(
    financials: RestaurantFinancials
  ): Promise<void> {
    const periodKey = `${financials.restaurantId}_${financials.period.startDate.toISOString().split('T')[0]}_${financials.period.endDate.toISOString().split('T')[0]}`;
    const financialsRef = doc(db, this.FINANCIALS_COLLECTION, periodKey);

    await setDoc(financialsRef, {
      ...financials,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  // Platform toplam komisyon geliri
  static async getPlatformCommissionRevenue(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalCommission: number;
    totalTransactions: number;
    byPaymentMethod: {
      cash: number;
      card: number;
    };
  }> {
    const q = query(
      collection(db, this.TRANSACTIONS_COLLECTION),
      where('status', '==', 'completed'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    })) as Transaction[];

    const totalCommission = transactions.reduce((sum, t) => sum + t.commissionAmount, 0);
    const totalTransactions = transactions.length;

    const cashCommission = transactions
      .filter(t => t.paymentMethod === PaymentMethod.CASH_ON_DELIVERY)
      .reduce((sum, t) => sum + t.commissionAmount, 0);

    const cardCommission = transactions
      .filter(t => t.paymentMethod === PaymentMethod.CARD_ON_DELIVERY)
      .reduce((sum, t) => sum + t.commissionAmount, 0);

    return {
      totalCommission,
      totalTransactions,
      byPaymentMethod: {
        cash: cashCommission,
        card: cardCommission
      }
    };
  }

  // Sipariş tamamlandığında mali işlem otomatik oluşturma
  static async processOrderCompletion(order: Order): Promise<void> {
    if (order.status !== 'delivered') {
      throw new Error('Sadece teslim edilmiş siparişler için mali işlem oluşturulabilir');
    }

    // Transaction ID zaten varsa işlem yapma
    if (order.transactionId) {
      return;
    }

    const batch = writeBatch(db);

    try {
      // Mali işlem oluştur
      const transactionId = await this.createTransaction(
        order.id,
        order.restaurantId,
        order.commissionCalculation,
        order.paymentMethod
      );

      // Mali işlemi completed olarak işaretle
      await this.updateTransactionStatus(transactionId, 'completed');

      // Sipariş'e transaction ID'yi ekle
      const orderRef = doc(db, 'orders', order.id);
      batch.update(orderRef, {
        transactionId,
        updatedAt: serverTimestamp()
      });

      await batch.commit();

    } catch (error) {
      console.error('Mali işlem oluşturulurken hata:', error);
      throw error;
    }
  }

  // Ödeme yöntemi metinlerini getirme
  static getPaymentMethodText(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CASH_ON_DELIVERY:
        return 'Kapıda Nakit';
      case PaymentMethod.CARD_ON_DELIVERY:
        return 'Kapıda Kart';
      default:
        return 'Bilinmeyen';
    }
  }
} 