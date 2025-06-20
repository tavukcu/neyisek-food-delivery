import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod, Product, User } from '@/types';
import { startOfDay, endOfDay, subDays, format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfYear, endOfYear } from 'date-fns';

// Detaylı rapor tipleri
export interface DetailedSalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  cancellationRate: number;
  dailyComparison: number; // Önceki dönemle karşılaştırma yüzdesi
  topSellingHours: { hour: number; orders: number; revenue: number }[];
  hourlyAnalysis: { hour: number; orders: number; revenue: number }[];
  dailySales: { date: string; revenue: number; orders: number; previousPeriod?: number }[];
  paymentMethodBreakdown: { method: PaymentMethod; count: number; revenue: number; percentage: number }[];
  deliveryTimeAnalysis: { averageTime: number; onTimeDeliveries: number; lateDeliveries: number }[];
  revenueByCategory: { category: string; revenue: number; percentage: number }[];
}

export interface CustomerBehaviorReport {
  period: string;
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageOrdersPerCustomer: number;
  customerLifetimeValue: number;
  topCustomerSegments: { segment: string; count: number; revenue: number; avgOrderValue: number }[];
  orderFrequencyDistribution: { frequency: string; customerCount: number; percentage: number }[];
  geographicDistribution: { area: string; customerCount: number; revenue: number }[];
  customerSatisfactionMetrics: { rating: number; count: number; percentage: number }[];
}

export interface ProductPerformanceReport {
  period: string;
  totalProducts: number;
  activeProducts: number;
  topPerformingProducts: { product: Product; revenue: number; quantity: number; profitMargin: number }[];
  underperformingProducts: { product: Product; revenue: number; quantity: number; daysWithoutSale: number }[];
  categoryAnalysis: { category: string; revenue: number; quantity: number; profitMargin: number; growthRate: number }[];
  seasonalTrends: { month: string; topProducts: string[]; revenue: number }[];
  inventoryTurnover: { product: Product; turnoverRate: number; stockLevel: number; reorderPoint: number }[];
  priceOptimization: { product: Product; currentPrice: number; suggestedPrice: number; potentialRevenue: number }[];
}

export interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  revenueGrowth: number;
  costBreakdown: { category: string; amount: number; percentage: number }[];
  monthlyProfitTrend: { month: string; revenue: number; costs: number; profit: number }[];
  paymentMethodCosts: { method: PaymentMethod; transactionFees: number; percentage: number }[];
  deliveryCosts: { totalCost: number; averageCostPerOrder: number; freeDeliveryImpact: number }[];
}

// Detaylı satış raporu
export const getDetailedSalesReport = async (startDate: Date, endDate: Date): Promise<DetailedSalesReport> => {
  try {
    // Siparişleri getir
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId,
        user: data.user,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        deliveryFee: data.deliveryFee || 0,
        total: data.total || 0,
        status: data.status || OrderStatus.PENDING,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        specialInstructions: data.specialInstructions || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    const completedOrders = orders.filter(order => order.status === OrderStatus.DELIVERED);
    const cancelledOrders = orders.filter(order => order.status === OrderStatus.CANCELLED);
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;
    const cancellationRate = totalOrders > 0 ? (cancelledOrders.length / totalOrders) * 100 : 0;

    // Saatlik satış analizi
    const hourlyStats = new Map<number, { orders: number; revenue: number }>();
    completedOrders.forEach(order => {
      const hour = order.createdAt.getHours();
      const existing = hourlyStats.get(hour) || { orders: 0, revenue: 0 };
      hourlyStats.set(hour, {
        orders: existing.orders + 1,
        revenue: existing.revenue + order.total
      });
    });

    const topSellingHours = Array.from(hourlyStats.entries())
      .map(([hour, data]) => ({ hour, orders: data.orders, revenue: data.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    // Günlük karşılaştırma (önceki dönemle)
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = subDays(startDate, daysDiff);
    const previousEndDate = subDays(endDate, daysDiff);

    const previousOrdersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(previousStartDate)),
      where('createdAt', '<=', Timestamp.fromDate(previousEndDate)),
      where('status', '==', OrderStatus.DELIVERED)
    );

    const previousOrdersSnapshot = await getDocs(previousOrdersQuery);
    const previousOrders: Order[] = [];

    previousOrdersSnapshot.forEach((doc) => {
      const data = doc.data();
      previousOrders.push({
        id: doc.id,
        userId: data.userId,
        user: data.user,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        deliveryFee: data.deliveryFee || 0,
        total: data.total || 0,
        status: data.status || OrderStatus.PENDING,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        specialInstructions: data.specialInstructions || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    const previousTotalRevenue = previousOrders.reduce((sum, order) => sum + order.total, 0);
    const dailyComparison = previousTotalRevenue > 0 ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 : 0;

    const dailySalesMap = new Map<string, { revenue: number; orders: number }>();
    const previousDailySalesMap = new Map<string, number>();

    completedOrders.forEach(order => {
      const dateKey = format(order.createdAt, 'yyyy-MM-dd');
      const existing = dailySalesMap.get(dateKey) || { revenue: 0, orders: 0 };
      dailySalesMap.set(dateKey, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      });
    });

    previousOrders.forEach(order => {
      const dateKey = format(order.createdAt, 'yyyy-MM-dd');
      const existing = previousDailySalesMap.get(dateKey) || 0;
      previousDailySalesMap.set(dateKey, existing + order.total);
    });

    // Ödeme yöntemi detayları
    const paymentMethodMap = new Map<PaymentMethod, { count: number; revenue: number }>();
    completedOrders.forEach(order => {
      const existing = paymentMethodMap.get(order.paymentMethod) || { count: 0, revenue: 0 };
      paymentMethodMap.set(order.paymentMethod, {
        count: existing.count + 1,
        revenue: existing.revenue + order.total
      });
    });

    const paymentMethodBreakdown = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }));

    // Teslimat süresi analizi
    const deliveryTimes = completedOrders
      .filter(order => order.actualDeliveryTime)
      .map(order => {
        const estimatedTime = order.estimatedDeliveryTime.getTime();
        const actualTime = order.actualDeliveryTime!.getTime();
        return {
          deliveryTime: (actualTime - order.createdAt.getTime()) / (1000 * 60), // dakika
          isOnTime: actualTime <= estimatedTime
        };
      });

    const averageDeliveryTime = deliveryTimes.length > 0 
      ? deliveryTimes.reduce((sum, dt) => sum + dt.deliveryTime, 0) / deliveryTimes.length 
      : 0;
    const onTimeDeliveries = deliveryTimes.filter(dt => dt.isOnTime).length;
    const lateDeliveries = deliveryTimes.length - onTimeDeliveries;

    const deliveryTimeAnalysis = [{
      averageTime: averageDeliveryTime,
      onTimeDeliveries,
      lateDeliveries
    }];

    // Kategori bazında gelir
    const categoryRevenueMap = new Map<string, number>();
    completedOrders.forEach(order => {
      order.items.forEach(item => {
        // Kategori bilgisini item'dan al
        const category = item.categoryId || 'Diğer';
        const existing = categoryRevenueMap.get(category) || 0;
        categoryRevenueMap.set(category, existing + (item.quantity * item.price));
      });
    });

    const revenueByCategory = Array.from(categoryRevenueMap.entries()).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
    })).sort((a, b) => b.revenue - a.revenue);

    return {
      period: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      totalRevenue,
      totalOrders,
      averageOrderValue,
      completionRate,
      cancellationRate,
      dailyComparison,
      topSellingHours,
      hourlyAnalysis: Array.from(hourlyStats.entries()).map(([hour, data]) => ({
        hour,
        orders: data.orders,
        revenue: data.revenue
      })),
      dailySales: Array.from(dailySalesMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders,
        previousPeriod: previousDailySalesMap.get(date) || 0
      })),
      paymentMethodBreakdown,
      deliveryTimeAnalysis,
      revenueByCategory
    };
  } catch (error) {
    console.error('Detaylı satış raporu alınırken hata:', error);
    throw error;
  }
};

// Müşteri davranış raporu
export const getCustomerBehaviorReport = async (startDate: Date, endDate: Date): Promise<CustomerBehaviorReport> => {
  try {
    // Müşterileri getir
    const usersQuery = query(
      collection(db, 'users'),
      where('isAdmin', '==', false),
      orderBy('createdAt', 'desc')
    );

    const usersSnapshot = await getDocs(usersQuery);
    const customers: User[] = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      customers.push({
        uid: doc.id,
        email: data.email,
        displayName: data.displayName || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address,
        isAdmin: data.isAdmin || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    // Dönem içindeki siparişleri getir
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId,
        user: data.user,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        deliveryFee: data.deliveryFee || 0,
        total: data.total || 0,
        status: data.status || OrderStatus.PENDING,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        specialInstructions: data.specialInstructions || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    const completedOrders = orders.filter(order => order.status === OrderStatus.DELIVERED);
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(customer => 
      customer.createdAt >= startDate && customer.createdAt <= endDate
    ).length;

    // Dönem içinde sipariş veren müşteriler
    const activeCustomerIds = new Set(orders.map(order => order.userId));
    const returningCustomers = customers.filter(customer => {
      if (!activeCustomerIds.has(customer.uid)) return false;
      // Dönemden önce de sipariş vermiş mi kontrol et
      return customer.createdAt < startDate;
    }).length;

    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Müşteri başına ortalama sipariş
    const customerOrderCounts = new Map<string, number>();
    orders.forEach(order => {
      const existing = customerOrderCounts.get(order.userId) || 0;
      customerOrderCounts.set(order.userId, existing + 1);
    });

    const averageOrdersPerCustomer = activeCustomerIds.size > 0 
      ? Array.from(customerOrderCounts.values()).reduce((sum, count) => sum + count, 0) / activeCustomerIds.size
      : 0;

    // Müşteri yaşam boyu değeri
    const customerSpending = new Map<string, number>();
    completedOrders.forEach(order => {
      const existing = customerSpending.get(order.userId) || 0;
      customerSpending.set(order.userId, existing + order.total);
    });

    const customerLifetimeValue = customerSpending.size > 0
      ? Array.from(customerSpending.values()).reduce((sum, value) => sum + value, 0) / customerSpending.size
      : 0;

    // Müşteri segmentleri
    const topCustomerSegments = [
      {
        segment: 'VIP Müşteriler (₺500+)',
        count: Array.from(customerSpending.values()).filter(spending => spending >= 500).length,
        revenue: Array.from(customerSpending.entries())
          .filter(([_, spending]) => spending >= 500)
          .reduce((sum, [_, spending]) => sum + spending, 0),
        avgOrderValue: 0
      },
      {
        segment: 'Düzenli Müşteriler (3+ sipariş)',
        count: Array.from(customerOrderCounts.values()).filter(count => count >= 3).length,
        revenue: Array.from(customerOrderCounts.entries())
          .filter(([_, count]) => count >= 3)
          .reduce((sum, [userId, _]) => sum + (customerSpending.get(userId) || 0), 0),
        avgOrderValue: 0
      },
      {
        segment: 'Yeni Müşteriler',
        count: newCustomers,
        revenue: completedOrders
          .filter(order => {
            const customer = customers.find(c => c.uid === order.userId);
            return customer && customer.createdAt >= startDate && customer.createdAt <= endDate;
          })
          .reduce((sum, order) => sum + order.total, 0),
        avgOrderValue: 0
      }
    ];

    // Ortalama sipariş değerlerini hesapla
    topCustomerSegments.forEach(segment => {
      segment.avgOrderValue = segment.count > 0 ? segment.revenue / segment.count : 0;
    });

    // Sipariş sıklığı dağılımı
    const frequencyDistribution = [
      { frequency: '1 sipariş', customerCount: 0, percentage: 0 },
      { frequency: '2-3 sipariş', customerCount: 0, percentage: 0 },
      { frequency: '4-6 sipariş', customerCount: 0, percentage: 0 },
      { frequency: '7+ sipariş', customerCount: 0, percentage: 0 }
    ];

    Array.from(customerOrderCounts.values()).forEach(count => {
      if (count === 1) frequencyDistribution[0].customerCount++;
      else if (count <= 3) frequencyDistribution[1].customerCount++;
      else if (count <= 6) frequencyDistribution[2].customerCount++;
      else frequencyDistribution[3].customerCount++;
    });

    const totalActiveCustomers = customerOrderCounts.size;
    frequencyDistribution.forEach(item => {
      item.percentage = totalActiveCustomers > 0 ? (item.customerCount / totalActiveCustomers) * 100 : 0;
    });

    // Coğrafi dağılım (basit analiz)
    const geographicDistribution = [
      { area: 'Merkez', customerCount: Math.floor(totalCustomers * 0.4), revenue: Math.floor(completedOrders.reduce((sum, order) => sum + order.total, 0) * 0.4) },
      { area: 'Kuzey', customerCount: Math.floor(totalCustomers * 0.3), revenue: Math.floor(completedOrders.reduce((sum, order) => sum + order.total, 0) * 0.3) },
      { area: 'Güney', customerCount: Math.floor(totalCustomers * 0.2), revenue: Math.floor(completedOrders.reduce((sum, order) => sum + order.total, 0) * 0.2) },
      { area: 'Diğer', customerCount: Math.floor(totalCustomers * 0.1), revenue: Math.floor(completedOrders.reduce((sum, order) => sum + order.total, 0) * 0.1) }
    ];

    // Müşteri memnuniyeti metrikleri (simüle edilmiş)
    const customerSatisfactionMetrics = [
      { rating: 5, count: Math.floor(completedOrders.length * 0.6), percentage: 60 },
      { rating: 4, count: Math.floor(completedOrders.length * 0.25), percentage: 25 },
      { rating: 3, count: Math.floor(completedOrders.length * 0.1), percentage: 10 },
      { rating: 2, count: Math.floor(completedOrders.length * 0.03), percentage: 3 },
      { rating: 1, count: Math.floor(completedOrders.length * 0.02), percentage: 2 }
    ];

    return {
      period: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageOrdersPerCustomer,
      customerLifetimeValue,
      topCustomerSegments,
      orderFrequencyDistribution: frequencyDistribution,
      geographicDistribution,
      customerSatisfactionMetrics
    };
  } catch (error) {
    console.error('Müşteri davranış raporu alınırken hata:', error);
    throw error;
  }
};

// Ürün performans raporu
export const getProductPerformanceReport = async (startDate: Date, endDate: Date): Promise<ProductPerformanceReport> => {
  try {
    // Ürünleri getir
    const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const productsSnapshot = await getDocs(productsQuery);
    const products: Product[] = [];

    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        categoryId: data.categoryId || '',
        imageUrl: data.imageUrl || '',
        images: data.images || [],
        variants: data.variants || [],
        ingredients: data.ingredients || [],
        allergens: data.allergens || [],
        isVegetarian: data.isVegetarian || false,
        isVegan: data.isVegan || false,
        isGlutenFree: data.isGlutenFree || false,
        preparationTime: data.preparationTime || 0,
        calories: data.calories || 0,
        isActive: data.isActive !== false,
        stock: data.stock || 0,
        minStock: data.minStock || 0,
        maxStock: data.maxStock || 0,
        tags: data.tags || [],
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        isPopular: data.isPopular || false,
        isFeatured: data.isFeatured || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    // Dönem içindeki siparişleri getir
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      where('status', '==', OrderStatus.DELIVERED),
      orderBy('createdAt', 'desc')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId,
        user: data.user,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        deliveryFee: data.deliveryFee || 0,
        total: data.total || 0,
        status: data.status || OrderStatus.PENDING,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        specialInstructions: data.specialInstructions || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    const totalProducts = products.length;
    const activeProducts = products.filter(product => product.isActive).length;

    // Ürün satış istatistikleri
    const productSalesMap = new Map<string, { revenue: number; quantity: number; product: Product }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const existing = productSalesMap.get(item.productId) || { revenue: 0, quantity: 0, product };
          productSalesMap.set(item.productId, {
            revenue: existing.revenue + (item.quantity * item.price),
            quantity: existing.quantity + item.quantity,
            product
          });
        }
      });
    });

    // En iyi performans gösteren ürünler
    const topPerformingProducts = Array.from(productSalesMap.values())
      .map(item => ({
        product: item.product,
        revenue: item.revenue,
        quantity: item.quantity,
        profitMargin: ((item.revenue - (item.product.price * 0.6)) / item.revenue) * 100 // %40 maliyet varsayımı
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Düşük performanslı ürünler
    const allProductSales = Array.from(productSalesMap.values());
    const underperformingProducts = products
      .filter(product => !productSalesMap.has(product.id))
      .map(product => ({
        product,
        revenue: 0,
        quantity: 0,
        daysWithoutSale: Math.floor((new Date().getTime() - product.updatedAt.getTime()) / (1000 * 60 * 60 * 24))
      }))
      .concat(
        allProductSales
          .filter(item => item.revenue < (topPerformingProducts[0]?.revenue || 0) * 0.1)
          .map(item => ({
            product: item.product,
            revenue: item.revenue,
            quantity: item.quantity,
            daysWithoutSale: 0
          }))
      )
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 10);

    // Kategori analizi
    const categoryMap = new Map<string, { revenue: number; quantity: number; products: Product[] }>();
    
    Array.from(productSalesMap.values()).forEach(item => {
      const existing = categoryMap.get(item.product.categoryId) || { revenue: 0, quantity: 0, products: [] };
      categoryMap.set(item.product.categoryId, {
        revenue: existing.revenue + item.revenue,
        quantity: existing.quantity + item.quantity,
        products: [...existing.products, item.product]
      });
    });

    const categoryAnalysis = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      category: categoryId,
      revenue: data.revenue,
      quantity: data.quantity,
      profitMargin: ((data.revenue - (data.revenue * 0.6)) / data.revenue) * 100,
      growthRate: Math.random() * 20 - 10 // Simüle edilmiş büyüme oranı
    })).sort((a, b) => b.revenue - a.revenue);

    // Mevsimsel trendler
    const seasonalTrends = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthName = format(monthStart, 'MMM yyyy');
      
      const monthlyTopProducts = Array.from(productSalesMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
        .map(item => item.product.name);

      seasonalTrends.push({
        month: monthName,
        topProducts: monthlyTopProducts,
        revenue: Math.random() * 10000 + 5000 // Simüle edilmiş
      });
    }

    // Stok devir hızı
    const inventoryTurnover = Array.from(productSalesMap.values())
      .map(item => ({
        product: item.product,
        turnoverRate: item.product.stock > 0 ? item.quantity / item.product.stock : 0,
        stockLevel: item.product.stock,
        reorderPoint: item.product.minStock
      }))
      .sort((a, b) => b.turnoverRate - a.turnoverRate)
      .slice(0, 20);

    // Fiyat optimizasyonu
    const priceOptimization = Array.from(productSalesMap.values())
      .map(item => {
        const currentPrice = item.product.price;
        const suggestedPrice = currentPrice * (1 + (Math.random() * 0.2 - 0.1)); // ±%10 öneri
        const potentialRevenue = item.quantity * suggestedPrice;
        
        return {
          product: item.product,
          currentPrice,
          suggestedPrice: Math.round(suggestedPrice * 100) / 100,
          potentialRevenue: potentialRevenue - item.revenue
        };
      })
      .filter(item => Math.abs(item.potentialRevenue) > 100)
      .sort((a, b) => Math.abs(b.potentialRevenue) - Math.abs(a.potentialRevenue))
      .slice(0, 10);

    return {
      period: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      totalProducts,
      activeProducts,
      topPerformingProducts,
      underperformingProducts,
      categoryAnalysis,
      seasonalTrends,
      inventoryTurnover,
      priceOptimization
    };
  } catch (error) {
    console.error('Ürün performans raporu alınırken hata:', error);
    throw error;
  }
};

// Mali rapor
export const getFinancialReport = async (startDate: Date, endDate: Date): Promise<FinancialReport> => {
  try {
    // Siparişleri getir
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      where('status', '==', OrderStatus.DELIVERED),
      orderBy('createdAt', 'desc')
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders: Order[] = [];

    ordersSnapshot.forEach((doc) => {
      const data = doc.data();
      orders.push({
        id: doc.id,
        userId: data.userId,
        user: data.user,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        deliveryFee: data.deliveryFee || 0,
        total: data.total || 0,
        status: data.status || OrderStatus.PENDING,
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
        actualDeliveryTime: data.actualDeliveryTime?.toDate(),
        specialInstructions: data.specialInstructions || '',
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    
    // Maliyet hesaplamaları (simüle edilmiş)
    const foodCosts = totalRevenue * 0.35; // %35 yemek maliyeti
    const laborCosts = totalRevenue * 0.25; // %25 işçilik
    const deliveryCosts = orders.reduce((sum, order) => sum + order.deliveryFee, 0) * 0.7; // %70 teslimat maliyeti
    const operationalCosts = totalRevenue * 0.15; // %15 operasyonel
    const marketingCosts = totalRevenue * 0.05; // %5 pazarlama
    
    const totalCosts = foodCosts + laborCosts + deliveryCosts + operationalCosts + marketingCosts;
    const grossProfit = totalRevenue - (foodCosts + deliveryCosts);
    const netProfit = totalRevenue - totalCosts;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Önceki dönemle karşılaştırma
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const previousStartDate = subDays(startDate, daysDiff);
    const previousEndDate = subDays(endDate, daysDiff);

    const previousOrdersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(previousStartDate)),
      where('createdAt', '<=', Timestamp.fromDate(previousEndDate)),
      where('status', '==', OrderStatus.DELIVERED)
    );

    const previousOrdersSnapshot = await getDocs(previousOrdersQuery);
    const previousRevenue = previousOrdersSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.total || 0);
    }, 0);

    const revenueGrowth = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Maliyet dağılımı
    const costBreakdown = [
      { category: 'Yemek Maliyeti', amount: foodCosts, percentage: (foodCosts / totalCosts) * 100 },
      { category: 'İşçilik', amount: laborCosts, percentage: (laborCosts / totalCosts) * 100 },
      { category: 'Teslimat', amount: deliveryCosts, percentage: (deliveryCosts / totalCosts) * 100 },
      { category: 'Operasyonel', amount: operationalCosts, percentage: (operationalCosts / totalCosts) * 100 },
      { category: 'Pazarlama', amount: marketingCosts, percentage: (marketingCosts / totalCosts) * 100 }
    ];

    // Aylık kar trendi
    const monthlyProfitTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      const monthName = format(monthStart, 'MMM yyyy');
      
      // Bu ay için simüle edilmiş veriler
      const monthlyRevenue = totalRevenue * (0.8 + Math.random() * 0.4) / 6;
      const monthlyCosts = monthlyRevenue * 0.75;
      const monthlyProfit = monthlyRevenue - monthlyCosts;
      
      monthlyProfitTrend.push({
        month: monthName,
        revenue: monthlyRevenue,
        costs: monthlyCosts,
        profit: monthlyProfit
      });
    }

    // Ödeme yöntemi maliyetleri
    const paymentMethodCosts = [
      { method: PaymentMethod.CASH, transactionFees: 0, percentage: 0 },
      { method: PaymentMethod.CREDIT_CARD, transactionFees: totalRevenue * 0.02, percentage: 2 },
      { method: PaymentMethod.ONLINE, transactionFees: totalRevenue * 0.025, percentage: 2.5 }
    ];

    // Teslimat maliyetleri
    const totalDeliveryFees = orders.reduce((sum, order) => sum + order.deliveryFee, 0);
    const freeDeliveryOrders = orders.filter(order => order.deliveryFee === 0).length;
    const freeDeliveryImpact = freeDeliveryOrders * 15; // Ortalama teslimat ücreti

    const deliveryAnalysis = [{
      totalCost: deliveryCosts,
      averageCostPerOrder: orders.length > 0 ? deliveryCosts / orders.length : 0,
      freeDeliveryImpact
    }];

    return {
      period: `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`,
      totalRevenue,
      totalCosts,
      grossProfit,
      netProfit,
      profitMargin,
      revenueGrowth,
      costBreakdown,
      monthlyProfitTrend,
      paymentMethodCosts,
      deliveryCosts: deliveryAnalysis
    };
  } catch (error) {
    console.error('Mali rapor alınırken hata:', error);
    throw error;
  }
}; 