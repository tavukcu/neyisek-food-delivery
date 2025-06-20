import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod, Product, User } from '@/types';
import { startOfDay, endOfDay, subDays, format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// Analitik veri tipleri
export interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  completionRate: number;
  dailySales: { date: string; revenue: number; orders: number }[];
  monthlySales: { month: string; revenue: number; orders: number }[];
  paymentMethodStats: { method: PaymentMethod; count: number; revenue: number }[];
  statusStats: { status: OrderStatus; count: number }[];
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  vipCustomers: number;
  customerGrowth: { month: string; newCustomers: number; totalCustomers: number }[];
  customerSegments: { segment: string; count: number; revenue: number }[];
  topCustomers: { customer: User; totalSpent: number; orderCount: number }[];
}

export interface ProductAnalytics {
  totalProducts: number;
  activeProducts: number;
  topSellingProducts: { product: Product; soldCount: number; revenue: number }[];
  categoryPerformance: { category: string; soldCount: number; revenue: number }[];
  productTrends: { product: string; sales: { date: string; count: number }[] }[];
}

export interface DashboardStats {
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalCustomers: number;
  totalProducts: number;
  revenueGrowth: number;
  orderGrowth: number;
  customerGrowth: number;
}

// Satış analizleri
export const getSalesAnalytics = async (startDate?: Date, endDate?: Date): Promise<SalesAnalytics> => {
  try {
    const start = startDate || subDays(new Date(), 30);
    const end = endDate || new Date();

    // Siparişleri getir
    const ordersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(start)),
      where('createdAt', '<=', Timestamp.fromDate(end)),
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
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
    const completionRate = totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0;

    // Günlük satışlar
    const dailySalesMap = new Map<string, { revenue: number; orders: number }>();
    completedOrders.forEach(order => {
      const dateKey = format(order.createdAt, 'yyyy-MM-dd');
      const existing = dailySalesMap.get(dateKey) || { revenue: 0, orders: 0 };
      dailySalesMap.set(dateKey, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      });
    });

    const dailySales = Array.from(dailySalesMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Aylık satışlar
    const monthlySalesMap = new Map<string, { revenue: number; orders: number }>();
    completedOrders.forEach(order => {
      const monthKey = format(order.createdAt, 'yyyy-MM');
      const existing = monthlySalesMap.get(monthKey) || { revenue: 0, orders: 0 };
      monthlySalesMap.set(monthKey, {
        revenue: existing.revenue + order.total,
        orders: existing.orders + 1
      });
    });

    const monthlySales = Array.from(monthlySalesMap.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders
    })).sort((a, b) => a.month.localeCompare(b.month));

    // Ödeme yöntemi istatistikleri
    const paymentMethodMap = new Map<PaymentMethod, { count: number; revenue: number }>();
    completedOrders.forEach(order => {
      const existing = paymentMethodMap.get(order.paymentMethod) || { count: 0, revenue: 0 };
      paymentMethodMap.set(order.paymentMethod, {
        count: existing.count + 1,
        revenue: existing.revenue + order.total
      });
    });

    const paymentMethodStats = Array.from(paymentMethodMap.entries()).map(([method, data]) => ({
      method,
      count: data.count,
      revenue: data.revenue
    }));

    // Durum istatistikleri
    const statusMap = new Map<OrderStatus, number>();
    orders.forEach(order => {
      const existing = statusMap.get(order.status) || 0;
      statusMap.set(order.status, existing + 1);
    });

    const statusStats = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count
    }));

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      completionRate,
      dailySales,
      monthlySales,
      paymentMethodStats,
      statusStats
    };
  } catch (error) {
    console.error('Satış analizleri alınırken hata:', error);
    throw error;
  }
};

// Müşteri analizleri
export const getCustomerAnalytics = async (): Promise<CustomerAnalytics> => {
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

    // Siparişleri getir
    const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
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
    const activeCustomers = customers.filter(customer => 
      orders.some(order => order.userId === customer.uid)
    ).length;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newCustomers = customers.filter(customer => customer.createdAt >= thirtyDaysAgo).length;

    // VIP müşteriler (₺500+ harcama)
    const customerSpending = new Map<string, number>();
    completedOrders.forEach(order => {
      const existing = customerSpending.get(order.userId) || 0;
      customerSpending.set(order.userId, existing + order.total);
    });

    const vipCustomers = Array.from(customerSpending.values()).filter(spending => spending >= 500).length;

    // Müşteri büyümesi (son 6 ay)
    const customerGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const monthEnd = endOfMonth(subMonths(new Date(), i));
      
      const newCustomersInMonth = customers.filter(customer => 
        customer.createdAt >= monthStart && customer.createdAt <= monthEnd
      ).length;
      
      const totalCustomersUntilMonth = customers.filter(customer => 
        customer.createdAt <= monthEnd
      ).length;

      customerGrowth.push({
        month: format(monthStart, 'MMM yyyy'),
        newCustomers: newCustomersInMonth,
        totalCustomers: totalCustomersUntilMonth
      });
    }

    // Müşteri segmentleri
    const customerSegments = [
      {
        segment: 'Yeni Müşteriler',
        count: newCustomers,
        revenue: completedOrders
          .filter(order => {
            const customer = customers.find(c => c.uid === order.userId);
            return customer && customer.createdAt >= thirtyDaysAgo;
          })
          .reduce((sum, order) => sum + order.total, 0)
      },
      {
        segment: 'VIP Müşteriler',
        count: vipCustomers,
        revenue: Array.from(customerSpending.entries())
          .filter(([_, spending]) => spending >= 500)
          .reduce((sum, [_, spending]) => sum + spending, 0)
      },
      {
        segment: 'Aktif Müşteriler',
        count: activeCustomers,
        revenue: completedOrders.reduce((sum, order) => sum + order.total, 0)
      }
    ];

    // En çok harcama yapan müşteriler
    const topCustomers = Array.from(customerSpending.entries())
      .map(([userId, totalSpent]) => {
        const customer = customers.find(c => c.uid === userId);
        const orderCount = orders.filter(order => order.userId === userId).length;
        return { customer: customer!, totalSpent, orderCount };
      })
      .filter(item => item.customer)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      vipCustomers,
      customerGrowth,
      customerSegments,
      topCustomers
    };
  } catch (error) {
    console.error('Müşteri analizleri alınırken hata:', error);
    throw error;
  }
};

// Dashboard istatistikleri
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const today = new Date();
    const yesterday = subDays(today, 1);
    const lastMonth = subDays(today, 30);

    // Bugünkü siparişler
    const todayOrdersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(startOfDay(today))),
      where('createdAt', '<=', Timestamp.fromDate(endOfDay(today)))
    );

    const todayOrdersSnapshot = await getDocs(todayOrdersQuery);
    const todayOrders: Order[] = [];

    todayOrdersSnapshot.forEach((doc) => {
      const data = doc.data();
      todayOrders.push({
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

    const todayRevenue = todayOrders
      .filter(order => order.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + order.total, 0);

    const pendingOrders = todayOrders.filter(order => 
      order.status === OrderStatus.PENDING || 
      order.status === OrderStatus.CONFIRMED ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY ||
      order.status === OrderStatus.DELIVERING
    ).length;

    const completedOrders = todayOrders.filter(order => 
      order.status === OrderStatus.DELIVERED
    ).length;

    // Genel istatistikler
    const [allOrdersSnapshot, allUsersSnapshot, allProductsSnapshot] = await Promise.all([
      getDocs(collection(db, 'orders')),
      getDocs(query(collection(db, 'users'), where('isAdmin', '==', false))),
      getDocs(collection(db, 'products'))
    ]);

    const totalCustomers = allUsersSnapshot.size;
    const totalProducts = allProductsSnapshot.size;

    // Büyüme oranları (önceki aya göre)
    const lastMonthOrdersQuery = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(lastMonth)),
      where('createdAt', '<', Timestamp.fromDate(yesterday))
    );

    const lastMonthOrdersSnapshot = await getDocs(lastMonthOrdersQuery);
    const lastMonthOrders: Order[] = [];

    lastMonthOrdersSnapshot.forEach((doc) => {
      const data = doc.data();
      lastMonthOrders.push({
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

    const lastMonthRevenue = lastMonthOrders
      .filter(order => order.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + order.total, 0);

    const revenueGrowth = lastMonthRevenue > 0 ? ((todayRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const orderGrowth = lastMonthOrders.length > 0 ? ((todayOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100 : 0;

    // Müşteri büyümesi
    const lastMonthCustomersQuery = query(
      collection(db, 'users'),
      where('isAdmin', '==', false),
      where('createdAt', '>=', Timestamp.fromDate(lastMonth))
    );

    const lastMonthCustomersSnapshot = await getDocs(lastMonthCustomersQuery);
    const customerGrowth = lastMonthCustomersSnapshot.size;

    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalProducts,
      revenueGrowth,
      orderGrowth,
      customerGrowth
    };
  } catch (error) {
    console.error('Dashboard istatistikleri alınırken hata:', error);
    throw error;
  }
};

// Ürün performans analizleri
export const getProductAnalytics = async (): Promise<ProductAnalytics> => {
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

    // Siparişleri getir
    const ordersQuery = query(
      collection(db, 'orders'),
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
    const productSalesMap = new Map<string, { soldCount: number; revenue: number; product: Product }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const existing = productSalesMap.get(item.productId) || { soldCount: 0, revenue: 0, product };
          productSalesMap.set(item.productId, {
            soldCount: existing.soldCount + item.quantity,
            revenue: existing.revenue + (item.quantity * product.price),
            product
          });
        }
      });
    });

    // En çok satan ürünler
    const topSellingProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 10)
      .map(item => ({
        product: item.product,
        soldCount: item.soldCount,
        revenue: item.revenue
      }));

    // Kategori performansı
    const categoryMap = new Map<string, { soldCount: number; revenue: number }>();
    
    Array.from(productSalesMap.values()).forEach(item => {
      const existing = categoryMap.get(item.product.categoryId) || { soldCount: 0, revenue: 0 };
      categoryMap.set(item.product.categoryId, {
        soldCount: existing.soldCount + item.soldCount,
        revenue: existing.revenue + item.revenue
      });
    });

    const categoryPerformance = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
      category: categoryId,
      soldCount: data.soldCount,
      revenue: data.revenue
    })).sort((a, b) => b.revenue - a.revenue);

    // Ürün trendleri (son 30 gün)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentOrders = orders.filter(order => order.createdAt >= thirtyDaysAgo);
    
    const productTrends = topSellingProducts.slice(0, 5).map(item => {
      const dailySales = new Map<string, number>();
      
      recentOrders.forEach(order => {
        const dateKey = format(order.createdAt, 'yyyy-MM-dd');
        const orderItems = order.items.filter(orderItem => orderItem.productId === item.product.id);
        const totalQuantity = orderItems.reduce((sum, orderItem) => sum + orderItem.quantity, 0);
        
        if (totalQuantity > 0) {
          const existing = dailySales.get(dateKey) || 0;
          dailySales.set(dateKey, existing + totalQuantity);
        }
      });

      const sales = Array.from(dailySales.entries()).map(([date, count]) => ({
        date,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        product: item.product.name,
        sales
      };
    });

    return {
      totalProducts,
      activeProducts,
      topSellingProducts,
      categoryPerformance,
      productTrends
    };
  } catch (error) {
    console.error('Ürün analizleri alınırken hata:', error);
    throw error;
  }
}; 