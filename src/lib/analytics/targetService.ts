import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

// Hedef tipleri
export enum TargetType {
  REVENUE = 'revenue',
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  AVERAGE_ORDER_VALUE = 'average_order_value',
  CUSTOMER_RETENTION = 'customer_retention',
  PRODUCT_SALES = 'product_sales'
}

export enum TargetPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum TargetStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused'
}

export interface Target {
  id: string;
  name: string;
  description: string;
  type: TargetType;
  period: TargetPeriod;
  targetValue: number;
  currentValue: number;
  progress: number; // Yüzde olarak
  status: TargetStatus;
  startDate: Date;
  endDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TargetProgress {
  targetId: string;
  date: Date;
  value: number;
  progress: number;
  notes?: string;
}

// Hedef oluştur
export const createTarget = async (targetData: Omit<Target, 'id' | 'currentValue' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'targets'), {
      ...targetData,
      currentValue: 0,
      progress: 0,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      startDate: Timestamp.fromDate(targetData.startDate),
      endDate: Timestamp.fromDate(targetData.endDate)
    });
    return docRef.id;
  } catch (error) {
    console.error('Hedef oluşturulurken hata:', error);
    throw error;
  }
};

// Hedefleri getir
export const getTargets = async (status?: TargetStatus): Promise<Target[]> => {
  try {
    let targetsQuery = query(collection(db, 'targets'), orderBy('createdAt', 'desc'));
    
    if (status) {
      targetsQuery = query(
        collection(db, 'targets'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const targetsSnapshot = await getDocs(targetsQuery);
    const targets: Target[] = [];

    targetsSnapshot.forEach((doc) => {
      const data = doc.data();
      targets.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        type: data.type,
        period: data.period,
        targetValue: data.targetValue,
        currentValue: data.currentValue || 0,
        progress: data.progress || 0,
        status: data.status,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return targets;
  } catch (error) {
    console.error('Hedefler getirilirken hata:', error);
    throw error;
  }
};

// Hedef güncelle
export const updateTarget = async (targetId: string, updates: Partial<Target>): Promise<void> => {
  try {
    const targetRef = doc(db, 'targets', targetId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };

    if (updates.startDate) {
      updateData.startDate = Timestamp.fromDate(updates.startDate);
    }
    if (updates.endDate) {
      updateData.endDate = Timestamp.fromDate(updates.endDate);
    }

    await updateDoc(targetRef, updateData);
  } catch (error) {
    console.error('Hedef güncellenirken hata:', error);
    throw error;
  }
};

// Hedef sil
export const deleteTarget = async (targetId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'targets', targetId));
  } catch (error) {
    console.error('Hedef silinirken hata:', error);
    throw error;
  }
};

// Hedef ilerlemesini güncelle
export const updateTargetProgress = async (targetId: string): Promise<void> => {
  try {
    // Hedefi getir
    const targets = await getTargets();
    const target = targets.find(t => t.id === targetId);
    
    if (!target) {
      throw new Error('Hedef bulunamadı');
    }

    let currentValue = 0;
    const now = new Date();
    
    // Hedef tipine göre mevcut değeri hesapla
    switch (target.type) {
      case TargetType.REVENUE:
        currentValue = await calculateRevenueProgress(target.startDate, now);
        break;
      case TargetType.ORDERS:
        currentValue = await calculateOrdersProgress(target.startDate, now);
        break;
      case TargetType.CUSTOMERS:
        currentValue = await calculateCustomersProgress(target.startDate, now);
        break;
      case TargetType.AVERAGE_ORDER_VALUE:
        currentValue = await calculateAverageOrderValueProgress(target.startDate, now);
        break;
      default:
        currentValue = target.currentValue;
    }

    const progress = target.targetValue > 0 ? (currentValue / target.targetValue) * 100 : 0;
    
    // Durumu güncelle
    let status = target.status;
    if (now > target.endDate) {
      status = progress >= 100 ? TargetStatus.COMPLETED : TargetStatus.FAILED;
    }

    await updateTarget(targetId, {
      currentValue,
      progress: Math.min(progress, 100),
      status
    });

    // İlerleme kaydı oluştur
    await addDoc(collection(db, 'target_progress'), {
      targetId,
      date: Timestamp.fromDate(now),
      value: currentValue,
      progress,
      createdAt: Timestamp.fromDate(now)
    });

  } catch (error) {
    console.error('Hedef ilerlemesi güncellenirken hata:', error);
    throw error;
  }
};

// Gelir ilerlemesini hesapla
const calculateRevenueProgress = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      where('status', '==', 'delivered')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    let totalRevenue = 0;

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalRevenue += data.total || 0;
    });

    return totalRevenue;
  } catch (error) {
    console.error('Gelir ilerlemesi hesaplanırken hata:', error);
    return 0;
  }
};

// Sipariş ilerlemesini hesapla
const calculateOrdersProgress = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate))
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    return ordersSnapshot.size;
  } catch (error) {
    console.error('Sipariş ilerlemesi hesaplanırken hata:', error);
    return 0;
  }
};

// Müşteri ilerlemesini hesapla
const calculateCustomersProgress = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const usersQuery = query(
      collection(db, 'users'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      where('isAdmin', '==', false)
    );

    const usersSnapshot = await getDocs(usersQuery);
    return usersSnapshot.size;
  } catch (error) {
    console.error('Müşteri ilerlemesi hesaplanırken hata:', error);
    return 0;
  }
};

// Ortalama sipariş değeri ilerlemesini hesapla
const calculateAverageOrderValueProgress = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      where('status', '==', 'delivered')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    let totalRevenue = 0;
    let orderCount = 0;

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      totalRevenue += data.total || 0;
      orderCount++;
    });

    return orderCount > 0 ? totalRevenue / orderCount : 0;
  } catch (error) {
    console.error('Ortalama sipariş değeri hesaplanırken hata:', error);
    return 0;
  }
};

// Hedef ilerleme geçmişini getir
export const getTargetProgressHistory = async (targetId: string): Promise<TargetProgress[]> => {
  try {
    const progressQuery = query(
      collection(db, 'target_progress'),
      where('targetId', '==', targetId),
      orderBy('date', 'desc')
    );

    const progressSnapshot = await getDocs(progressQuery);
    const progressHistory: TargetProgress[] = [];

    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      progressHistory.push({
        targetId: data.targetId,
        date: data.date?.toDate() || new Date(),
        value: data.value || 0,
        progress: data.progress || 0,
        notes: data.notes
      });
    });

    return progressHistory;
  } catch (error) {
    console.error('Hedef ilerleme geçmişi getirilirken hata:', error);
    throw error;
  }
};

// Tüm aktif hedeflerin ilerlemesini güncelle
export const updateAllTargetsProgress = async (): Promise<void> => {
  try {
    const activeTargets = await getTargets(TargetStatus.ACTIVE);
    
    for (const target of activeTargets) {
      await updateTargetProgress(target.id);
    }
  } catch (error) {
    console.error('Tüm hedeflerin ilerlemesi güncellenirken hata:', error);
    throw error;
  }
};

// Hedef önerileri oluştur
export const generateTargetSuggestions = async (): Promise<Partial<Target>[]> => {
  try {
    // Son 3 ayın verilerini analiz et
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const currentRevenue = await calculateRevenueProgress(threeMonthsAgo, new Date());
    const currentOrders = await calculateOrdersProgress(threeMonthsAgo, new Date());
    const currentCustomers = await calculateCustomersProgress(threeMonthsAgo, new Date());
    const currentAOV = await calculateAverageOrderValueProgress(threeMonthsAgo, new Date());

    const suggestions: Partial<Target>[] = [
      {
        name: 'Aylık Gelir Hedefi',
        description: 'Geçmiş performansa dayalı aylık gelir hedefi',
        type: TargetType.REVENUE,
        period: TargetPeriod.MONTHLY,
        targetValue: Math.round(currentRevenue * 1.15), // %15 artış
      },
      {
        name: 'Aylık Sipariş Hedefi',
        description: 'Geçmiş performansa dayalı aylık sipariş hedefi',
        type: TargetType.ORDERS,
        period: TargetPeriod.MONTHLY,
        targetValue: Math.round(currentOrders * 1.2), // %20 artış
      },
      {
        name: 'Yeni Müşteri Hedefi',
        description: 'Aylık yeni müşteri kazanım hedefi',
        type: TargetType.CUSTOMERS,
        period: TargetPeriod.MONTHLY,
        targetValue: Math.round(currentCustomers * 1.25), // %25 artış
      },
      {
        name: 'Ortalama Sipariş Değeri Hedefi',
        description: 'Ortalama sipariş değerini artırma hedefi',
        type: TargetType.AVERAGE_ORDER_VALUE,
        period: TargetPeriod.MONTHLY,
        targetValue: Math.round(currentAOV * 1.1), // %10 artış
      }
    ];

    return suggestions;
  } catch (error) {
    console.error('Hedef önerileri oluşturulurken hata:', error);
    return [];
  }
}; 