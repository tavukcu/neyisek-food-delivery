import { Order, OrderStatus, Address, User, CartItem, Product } from '@/types';
import { OrderService } from './orderService';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// AI Model Interfaces
interface DeliveryPrediction {
  estimatedTime: number; // minutes
  confidence: number; // 0-1
  factors: string[];
  weatherImpact: number;
  trafficImpact: number;
  restaurantLoadImpact: number;
}

interface CustomerInsights {
  preferredOrderTime: string[];
  favoriteCategories: string[];
  averageOrderValue: number;
  loyaltyScore: number; // 0-100
  dietaryPreferences: string[];
  orderFrequency: 'low' | 'medium' | 'high';
  pricePreference: 'budget' | 'standard' | 'premium';
}

interface SmartRecommendation {
  productId: string;
  reason: string;
  confidence: number;
  type: 'complementary' | 'alternative' | 'upgrade' | 'dietary' | 'seasonal';
}

interface OptimizedRoute {
  distance: number;
  duration: number;
  waypoints: Address[];
  optimizationSavings: number; // minutes saved
}

export class AIOrderService {
  private static readonly CUSTOMER_INSIGHTS_COLLECTION = 'customer-insights';
  private static readonly ORDER_ANALYTICS_COLLECTION = 'order-analytics';
  private static readonly DELIVERY_PREDICTIONS_COLLECTION = 'delivery-predictions';

  // 🧠 AI-Powered Delivery Time Prediction
  static async predictDeliveryTime(
    restaurantId: string,
    deliveryAddress: Address,
    orderItems: CartItem[],
    currentTime: Date = new Date()
  ): Promise<DeliveryPrediction> {
    try {
      // Historical data analysis
      const historicalOrders = await this.getHistoricalOrders(restaurantId, 30); // Last 30 days
      
      // Base time calculation factors
      const basePreparationTime = this.calculatePreparationTime(orderItems);
      const distanceTime = await this.calculateDistanceTime(restaurantId, deliveryAddress);
      
      // AI factors
      const timeOfDayFactor = this.getTimeOfDayFactor(currentTime);
      const weatherFactor = this.getWeatherFactor(deliveryAddress);
      const restaurantLoadFactor = await this.getRestaurantLoadFactor(restaurantId, currentTime);
      const historicalFactor = this.getHistoricalFactor(historicalOrders, currentTime);
      
      // Machine learning prediction
      const basePrediction = basePreparationTime + distanceTime;
      const adjustedPrediction = basePrediction * 
        timeOfDayFactor * 
        weatherFactor * 
        restaurantLoadFactor * 
        historicalFactor;
      
      // Confidence calculation
      const confidence = this.calculatePredictionConfidence(
        historicalOrders.length,
        weatherFactor,
        restaurantLoadFactor
      );
      
      return {
        estimatedTime: Math.round(adjustedPrediction),
        confidence,
        factors: [
          `Hazırlık: ${basePreparationTime} dk`,
          `Mesafe: ${Math.round(distanceTime)} dk`,
          `Zaman dilimi etkisi: ${Math.round((timeOfDayFactor - 1) * 100)}%`,
          `Hava durumu etkisi: ${Math.round((weatherFactor - 1) * 100)}%`,
          `Restoran yoğunluğu: ${Math.round((restaurantLoadFactor - 1) * 100)}%`
        ],
        weatherImpact: weatherFactor,
        trafficImpact: timeOfDayFactor,
        restaurantLoadImpact: restaurantLoadFactor
      };
    } catch (error) {
      console.error('AI delivery prediction error:', error);
      // Fallback to simple calculation
      return {
        estimatedTime: 45,
        confidence: 0.7,
        factors: ['Standart tahmin'],
        weatherImpact: 1,
        trafficImpact: 1,
        restaurantLoadImpact: 1
      };
    }
  }

  // 🎯 Customer Behavior Analysis
  static async analyzeCustomer(userId: string): Promise<CustomerInsights> {
    try {
      const userOrders = await OrderService.getUserOrders(userId);
      
      if (userOrders.length === 0) {
        return this.getDefaultCustomerInsights();
      }

      // Analyze order patterns
      const orderTimes = userOrders.map(order => order.createdAt.getHours());
      const categories = userOrders.flatMap(order => 
        order.items.map(item => item.product.categoryId)
      );
      const orderValues = userOrders.map(order => order.total);
      
      // Calculate insights
      const preferredOrderTime = this.calculatePreferredOrderTimes(orderTimes);
      const favoriteCategories = this.calculateFavoriteCategories(categories);
      const averageOrderValue = orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length;
      const loyaltyScore = this.calculateLoyaltyScore(userOrders);
      const dietaryPreferences = this.extractDietaryPreferences(userOrders);
      const orderFrequency = this.calculateOrderFrequency(userOrders);
      const pricePreference = this.calculatePricePreference(orderValues);

      const insights: CustomerInsights = {
        preferredOrderTime,
        favoriteCategories,
        averageOrderValue,
        loyaltyScore,
        dietaryPreferences,
        orderFrequency,
        pricePreference
      };

      // Save insights for future use
      await this.saveCustomerInsights(userId, insights);
      
      return insights;
    } catch (error) {
      console.error('Customer analysis error:', error);
      return this.getDefaultCustomerInsights();
    }
  }

  // 🤖 Smart Product Recommendations
  static async getSmartRecommendations(
    userId: string,
    currentCart: CartItem[],
    restaurantId: string
  ): Promise<SmartRecommendation[]> {
    try {
      const customerInsights = await this.analyzeCustomer(userId);
      const recommendations: SmartRecommendation[] = [];

      // Get restaurant products
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true)
      );
      const productsSnapshot = await getDocs(q);
      const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // 1. Complementary items (frequently ordered together)
      const complementaryItems = await this.findComplementaryItems(currentCart, products);
      recommendations.push(...complementaryItems);

      // 2. Customer preference based recommendations
      const preferenceItems = this.findPreferenceBasedItems(customerInsights, products, currentCart);
      recommendations.push(...preferenceItems);

      // 3. Seasonal and trending recommendations
      const seasonalItems = await this.findSeasonalItems(products);
      recommendations.push(...seasonalItems);

      // 4. Dietary preference matches
      const dietaryItems = this.findDietaryMatches(customerInsights.dietaryPreferences, products, currentCart);
      recommendations.push(...dietaryItems);

      // 5. Price-based recommendations
      const priceItems = this.findPriceBasedItems(customerInsights, products, currentCart);
      recommendations.push(...priceItems);

      // Sort by confidence and return top 10
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);

    } catch (error) {
      console.error('Smart recommendations error:', error);
      return [];
    }
  }

  // 🗺️ Route Optimization for Delivery
  static async optimizeDeliveryRoute(
    restaurantLocation: Address,
    deliveryAddresses: Address[]
  ): Promise<OptimizedRoute> {
    try {
      // Simple implementation - in production, use Google Maps Optimization API
      const distances = await Promise.all(
        deliveryAddresses.map(addr => this.calculateDistance(restaurantLocation, addr))
      );

      // Basic nearest neighbor algorithm
      const optimizedOrder = this.nearestNeighborTSP(restaurantLocation, deliveryAddresses, distances);
      const totalDistance = this.calculateTotalDistance(optimizedOrder, distances);
      const totalDuration = this.calculateTotalDuration(totalDistance);
      
      // Calculate savings compared to non-optimized route
      const nonOptimizedDuration = distances.reduce((sum, dist) => sum + dist * 2, 0); // Round trip for each
      const optimizationSavings = Math.max(0, nonOptimizedDuration - totalDuration);

      return {
        distance: totalDistance,
        duration: totalDuration,
        waypoints: optimizedOrder,
        optimizationSavings
      };
    } catch (error) {
      console.error('Route optimization error:', error);
      return {
        distance: 0,
        duration: 45,
        waypoints: deliveryAddresses,
        optimizationSavings: 0
      };
    }
  }

  // 🎯 Enhanced Order Creation with AI
  static async createEnhancedOrder(
    orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'commissionCalculation'>,
    enableAI: boolean = true
  ): Promise<{ orderId: string; aiInsights: any }> {
    try {
      let aiInsights = {};

      if (enableAI) {
        // AI-powered delivery time prediction
        const deliveryPrediction = await this.predictDeliveryTime(
          orderData.restaurantId,
          orderData.deliveryAddress,
          orderData.items
        );

        // Update order with AI prediction
        orderData.estimatedDeliveryTime = new Date(
          Date.now() + deliveryPrediction.estimatedTime * 60 * 1000
        );

        // Customer behavior analysis
        const customerInsights = await this.analyzeCustomer(orderData.userId);

        // Smart recommendations for next time
        const recommendations = await this.getSmartRecommendations(
          orderData.userId,
          orderData.items,
          orderData.restaurantId
        );

        aiInsights = {
          deliveryPrediction,
          customerInsights,
          recommendations: recommendations.slice(0, 5) // Top 5 for next order
        };

        // Save AI analytics
        await this.saveOrderAnalytics(orderData, aiInsights);
      }

      // Create the order using existing service
      const orderId = await OrderService.createOrder(orderData);

      return { orderId, aiInsights };
    } catch (error) {
      console.error('Enhanced order creation error:', error);
      // Fallback to normal order creation
      const orderId = await OrderService.createOrder(orderData);
      return { orderId, aiInsights: {} };
    }
  }

  // 📊 Real-time Order Tracking with AI Predictions
  static async getEnhancedOrderTracking(orderId: string): Promise<{
    order: Order | null;
    realTimePrediction: DeliveryPrediction | null;
    nextStatusPrediction: { status: OrderStatus; estimatedTime: Date } | null;
  }> {
    try {
      const order = await OrderService.getOrder(orderId);
      if (!order) return { order: null, realTimePrediction: null, nextStatusPrediction: null };

      // Real-time delivery prediction update
      const realTimePrediction = await this.predictDeliveryTime(
        order.restaurantId,
        order.deliveryAddress,
        order.items,
        new Date()
      );

      // Predict next status change
      const nextStatusPrediction = await this.predictNextStatusChange(order);

      return {
        order,
        realTimePrediction,
        nextStatusPrediction
      };
    } catch (error) {
      console.error('Enhanced order tracking error:', error);
      const order = await OrderService.getOrder(orderId);
      return { order, realTimePrediction: null, nextStatusPrediction: null };
    }
  }

  // Helper Methods
  private static async getHistoricalOrders(restaurantId: string, days: number): Promise<Order[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      where('createdAt', '>=', cutoffDate),
      where('status', '==', OrderStatus.DELIVERED),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      estimatedDeliveryTime: doc.data().estimatedDeliveryTime?.toDate() || new Date(),
      actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
    })) as Order[];
  }

  private static calculatePreparationTime(items: CartItem[]): number {
    // Base time + complexity factor
    const baseTime = 15; // 15 minutes base
    const itemComplexity = items.reduce((total, item) => {
      const complexity = item.specialInstructions ? 2 : 1;
      return total + (item.quantity * complexity);
    }, 0);
    return baseTime + Math.min(itemComplexity * 2, 20); // Max 20 minutes for complexity
  }

  private static async calculateDistanceTime(restaurantId: string, deliveryAddress: Address): Promise<number> {
    // In production, use Google Maps Distance Matrix API
    // For now, simple calculation based on coordinates
    const avgSpeed = 30; // km/h in city
    const distance = Math.random() * 10 + 2; // 2-12 km estimate
    return (distance / avgSpeed) * 60; // Convert to minutes
  }

  private static getTimeOfDayFactor(time: Date): number {
    const hour = time.getHours();
    if (hour >= 11 && hour <= 14) return 1.3; // Lunch rush
    if (hour >= 18 && hour <= 21) return 1.4; // Dinner rush
    if (hour >= 22 || hour <= 6) return 0.9; // Late night/early morning
    return 1.0; // Normal hours
  }

  private static getWeatherFactor(address: Address): number {
    // In production, integrate with weather API
    // For now, return random factor between 0.9-1.2
    return 0.9 + Math.random() * 0.3;
  }

  private static async getRestaurantLoadFactor(restaurantId: string, time: Date): number {
    // Check current active orders for this restaurant
    const activeOrders = await this.getActiveOrdersCount(restaurantId);
    if (activeOrders > 10) return 1.5;
    if (activeOrders > 5) return 1.2;
    return 1.0;
  }

  private static getHistoricalFactor(orders: Order[], currentTime: Date): number {
    if (orders.length < 5) return 1.0;
    
    const currentHour = currentTime.getHours();
    const sameHourOrders = orders.filter(order => 
      order.createdAt.getHours() === currentHour
    );
    
    if (sameHourOrders.length === 0) return 1.0;
    
    const avgDeliveryTime = sameHourOrders.reduce((sum, order) => {
      if (order.actualDeliveryTime) {
        return sum + (order.actualDeliveryTime.getTime() - order.createdAt.getTime()) / (1000 * 60);
      }
      return sum;
    }, 0) / sameHourOrders.length;
    
    return Math.max(0.8, Math.min(1.5, avgDeliveryTime / 45)); // Normalize around 45 minutes
  }

  private static calculatePredictionConfidence(
    historicalDataPoints: number,
    weatherFactor: number,
    loadFactor: number
  ): number {
    let confidence = 0.7; // Base confidence
    
    // More historical data = higher confidence
    confidence += Math.min(0.2, historicalDataPoints * 0.01);
    
    // Extreme weather = lower confidence
    if (Math.abs(weatherFactor - 1) > 0.1) confidence -= 0.1;
    
    // High load = lower confidence
    if (loadFactor > 1.2) confidence -= 0.1;
    
    return Math.max(0.5, Math.min(0.95, confidence));
  }

  private static async getActiveOrdersCount(restaurantId: string): Promise<number> {
    const ordersRef = collection(db, 'orders');
    const q = query(
      ordersRef,
      where('restaurantId', '==', restaurantId),
      where('status', 'in', [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING])
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  }

  private static getDefaultCustomerInsights(): CustomerInsights {
    return {
      preferredOrderTime: ['12:00-13:00', '19:00-20:00'],
      favoriteCategories: [],
      averageOrderValue: 0,
      loyaltyScore: 50,
      dietaryPreferences: [],
      orderFrequency: 'low',
      pricePreference: 'standard'
    };
  }

  private static calculatePreferredOrderTimes(orderTimes: number[]): string[] {
    const timeSlots: { [key: string]: number } = {};
    
    orderTimes.forEach(hour => {
      const slot = `${hour}:00-${hour + 1}:00`;
      timeSlots[slot] = (timeSlots[slot] || 0) + 1;
    });
    
    return Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([slot]) => slot);
  }

  private static calculateFavoriteCategories(categories: string[]): string[] {
    const categoryCount: { [key: string]: number } = {};
    
    categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([cat]) => cat);
  }

  private static calculateLoyaltyScore(orders: Order[]): number {
    const daysSinceFirst = orders.length > 0 ? 
      (Date.now() - orders[orders.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24) : 0;
    const frequency = orders.length / Math.max(daysSinceFirst / 30, 1); // Orders per month
    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    
    let score = 50; // Base score
    score += Math.min(30, frequency * 10); // Frequency bonus
    score += Math.min(20, totalSpent / 100); // Spending bonus
    
    return Math.min(100, Math.max(0, score));
  }

  private static extractDietaryPreferences(orders: Order[]): string[] {
    // Analyze product names and categories for dietary patterns
    const allItems = orders.flatMap(order => order.items);
    const preferences: string[] = [];
    
    // Simple keyword matching - in production, use NLP
    const keywords = {
      'vegetarian': ['sebze', 'salata', 'vegetaryen'],
      'vegan': ['vegan'],
      'gluten-free': ['glutensiz'],
      'healthy': ['fit', 'light', 'salata'],
      'spicy': ['acı', 'baharatlı']
    };
    
    Object.entries(keywords).forEach(([pref, words]) => {
      const hasPreference = allItems.some(item => 
        words.some(word => 
          item.product.name.toLowerCase().includes(word) ||
          item.product.description?.toLowerCase().includes(word)
        )
      );
      if (hasPreference) preferences.push(pref);
    });
    
    return preferences;
  }

  private static calculateOrderFrequency(orders: Order[]): 'low' | 'medium' | 'high' {
    if (orders.length === 0) return 'low';
    
    const daysSinceFirst = (Date.now() - orders[orders.length - 1].createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const frequency = orders.length / Math.max(daysSinceFirst / 30, 1); // Orders per month
    
    if (frequency >= 4) return 'high';
    if (frequency >= 2) return 'medium';
    return 'low';
  }

  private static calculatePricePreference(orderValues: number[]): 'budget' | 'standard' | 'premium' {
    if (orderValues.length === 0) return 'standard';
    
    const avgValue = orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length;
    
    if (avgValue >= 200) return 'premium';
    if (avgValue >= 100) return 'standard';
    return 'budget';
  }

  private static async saveCustomerInsights(userId: string, insights: CustomerInsights): Promise<void> {
    const insightsRef = doc(db, this.CUSTOMER_INSIGHTS_COLLECTION, userId);
    await setDoc(insightsRef, {
      ...insights,
      updatedAt: serverTimestamp()
    }, { merge: true });
  }

  private static async findComplementaryItems(
    currentCart: CartItem[],
    products: Product[]
  ): Promise<SmartRecommendation[]> {
    // Find items commonly ordered together
    // This would use collaborative filtering in production
    const recommendations: SmartRecommendation[] = [];
    
    // Simple rule-based complementary suggestions
    const hasMainDish = currentCart.some(item => 
      item.product.categoryId === 'ana-yemek' || 
      item.product.name.toLowerCase().includes('kebap') ||
      item.product.name.toLowerCase().includes('döner')
    );
    
    if (hasMainDish) {
      const drinks = products.filter(p => 
        p.categoryId === 'icecek' || 
        p.name.toLowerCase().includes('cola') ||
        p.name.toLowerCase().includes('ayran')
      );
      
      drinks.slice(0, 2).forEach(drink => {
        recommendations.push({
          productId: drink.id,
          reason: 'Ana yemeğinizle harika gider',
          confidence: 0.8,
          type: 'complementary'
        });
      });
    }
    
    return recommendations;
  }

  private static findPreferenceBasedItems(
    insights: CustomerInsights,
    products: Product[],
    currentCart: CartItem[]
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const currentProductIds = currentCart.map(item => item.productId);
    
    // Recommend from favorite categories
    insights.favoriteCategories.forEach(categoryId => {
      const categoryProducts = products.filter(p => 
        p.categoryId === categoryId && 
        !currentProductIds.includes(p.id)
      );
      
      categoryProducts.slice(0, 1).forEach(product => {
        recommendations.push({
          productId: product.id,
          reason: 'Sevdiğiniz kategoriden',
          confidence: 0.7,
          type: 'complementary'
        });
      });
    });
    
    return recommendations;
  }

  private static async findSeasonalItems(products: Product[]): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = [];
    const currentMonth = new Date().getMonth();
    
    // Seasonal suggestions
    let seasonalKeywords: string[] = [];
    if (currentMonth >= 11 || currentMonth <= 2) { // Winter
      seasonalKeywords = ['çorba', 'sıcak', 'kış'];
    } else if (currentMonth >= 6 && currentMonth <= 8) { // Summer
      seasonalKeywords = ['salata', 'soğuk', 'dondurma'];
    }
    
    seasonalKeywords.forEach(keyword => {
      const seasonalProducts = products.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword)
      );
      
      seasonalProducts.slice(0, 1).forEach(product => {
        recommendations.push({
          productId: product.id,
          reason: 'Mevsimlik özel',
          confidence: 0.6,
          type: 'seasonal'
        });
      });
    });
    
    return recommendations;
  }

  private static findDietaryMatches(
    dietaryPreferences: string[],
    products: Product[],
    currentCart: CartItem[]
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const currentProductIds = currentCart.map(item => item.productId);
    
    dietaryPreferences.forEach(preference => {
      const matchingProducts = products.filter(p => {
        if (currentProductIds.includes(p.id)) return false;
        
        const text = (p.name + ' ' + (p.description || '')).toLowerCase();
        switch (preference) {
          case 'vegetarian':
            return text.includes('sebze') || text.includes('vegetaryen');
          case 'healthy':
            return text.includes('fit') || text.includes('light') || text.includes('salata');
          case 'vegan':
            return text.includes('vegan');
          default:
            return false;
        }
      });
      
      matchingProducts.slice(0, 1).forEach(product => {
        recommendations.push({
          productId: product.id,
          reason: `${preference} tercihlerinize uygun`,
          confidence: 0.8,
          type: 'dietary'
        });
      });
    });
    
    return recommendations;
  }

  private static findPriceBasedItems(
    insights: CustomerInsights,
    products: Product[],
    currentCart: CartItem[]
  ): SmartRecommendation[] {
    const recommendations: SmartRecommendation[] = [];
    const currentProductIds = currentCart.map(item => item.productId);
    
    // Price range based on customer preference
    let priceRange: [number, number];
    switch (insights.pricePreference) {
      case 'budget':
        priceRange = [0, 50];
        break;
      case 'premium':
        priceRange = [100, Infinity];
        break;
      default:
        priceRange = [50, 100];
    }
    
    const suitableProducts = products.filter(p => 
      !currentProductIds.includes(p.id) &&
      p.price >= priceRange[0] && 
      p.price <= priceRange[1]
    );
    
    suitableProducts.slice(0, 2).forEach(product => {
      recommendations.push({
        productId: product.id,
        reason: 'Bütçenize uygun',
        confidence: 0.6,
        type: 'upgrade'
      });
    });
    
    return recommendations;
  }

  private static nearestNeighborTSP(
    start: Address,
    addresses: Address[],
    distances: number[]
  ): Address[] {
    if (addresses.length <= 1) return addresses;
    
    const result = [start];
    let currentIndex = -1; // Start point
    const unvisited = addresses.map((_, i) => i);
    
    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;
      
      unvisited.forEach((index, i) => {
        const distance = currentIndex === -1 ? distances[index] : distances[index];
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
        }
      });
      
      const nextIndex = unvisited[nearestIndex];
      result.push(addresses[nextIndex]);
      currentIndex = nextIndex;
      unvisited.splice(nearestIndex, 1);
    }
    
    return result.slice(1); // Remove start point
  }

  private static calculateDistance(addr1: Address, addr2: Address): Promise<number> {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    
    // Check if coordinates exist
    if (!addr1.coordinates || !addr2.coordinates) {
      // Return a default distance if coordinates are missing
      return Promise.resolve(5); // 5km default
    }
    
    const dLat = this.toRadians(addr2.coordinates.lat - addr1.coordinates.lat);
    const dLon = this.toRadians(addr2.coordinates.lng - addr1.coordinates.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(addr1.coordinates.lat)) * Math.cos(this.toRadians(addr2.coordinates.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Promise.resolve(R * c);
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static calculateTotalDistance(route: Address[], distances: number[]): number {
    return distances.reduce((sum, dist) => sum + dist, 0);
  }

  private static calculateTotalDuration(distance: number): number {
    const avgSpeed = 30; // km/h
    return (distance / avgSpeed) * 60; // minutes
  }

  private static async saveOrderAnalytics(
    orderData: any,
    aiInsights: any
  ): Promise<void> {
    const analyticsRef = doc(collection(db, this.ORDER_ANALYTICS_COLLECTION));
    await setDoc(analyticsRef, {
      orderId: analyticsRef.id,
      userId: orderData.userId,
      restaurantId: orderData.restaurantId,
      aiInsights,
      createdAt: serverTimestamp()
    });
  }

  private static async predictNextStatusChange(order: Order): Promise<{
    status: OrderStatus;
    estimatedTime: Date;
  } | null> {
    const now = new Date();
    const currentStatus = order.status;
    
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return {
          status: OrderStatus.CONFIRMED,
          estimatedTime: new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
        };
      case OrderStatus.CONFIRMED:
        return {
          status: OrderStatus.PREPARING,
          estimatedTime: new Date(now.getTime() + 2 * 60 * 1000) // 2 minutes
        };
      case OrderStatus.PREPARING:
        return {
          status: OrderStatus.READY,
          estimatedTime: new Date(now.getTime() + 20 * 60 * 1000) // 20 minutes
        };
      case OrderStatus.READY:
        return {
          status: OrderStatus.DELIVERING,
          estimatedTime: new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes
        };
      case OrderStatus.DELIVERING:
        return {
          status: OrderStatus.DELIVERED,
          estimatedTime: order.estimatedDeliveryTime
        };
      default:
        return null;
    }
  }
} 