import { analytics, performance } from '@/lib/firebase';
import { logEvent, setUserProperties } from 'firebase/analytics';
import { trace } from 'firebase/performance';

// Analytics olayları için tip tanımları
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export class AnalyticsService {
  // Custom event tracking
  static async trackCustomEvent(eventName: string, eventData: any) {
    try {
      // Console log for development
      console.log(`📊 Analytics Event: ${eventName}`, eventData);
      
      // Firebase Analytics (if available)
      if (analytics) {
        await logEvent(analytics, eventName, {
          ...eventData,
          timestamp: new Date().toISOString(),
          platform: 'web'
        });
      }
      
      // Store in local storage for debugging
      if (typeof window !== 'undefined') {
        const existingEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        existingEvents.push({
          eventName,
          eventData,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 events
        if (existingEvents.length > 100) {
          existingEvents.splice(0, existingEvents.length - 100);
        }
        
        localStorage.setItem('analytics_events', JSON.stringify(existingEvents));
      }
      
      return true;
    } catch (error) {
      console.warn('Analytics tracking error:', error);
      return false;
    }
  }

  // Performance tracking
  static async trackPerformance(metricName: string, value: number, additionalData?: any) {
    try {
      if (performance && typeof window !== 'undefined') {
        const performanceTrace = trace(performance, metricName);
        performanceTrace.start();
        
        // Add custom attributes
        if (additionalData) {
          Object.keys(additionalData).forEach(key => {
            performanceTrace.putAttribute(key, String(additionalData[key]));
          });
        }
        
        performanceTrace.putMetric(metricName, value);
        performanceTrace.stop();
      }
      
      // Also track as custom event
      await this.trackCustomEvent('performance_metric', {
        metric: metricName,
        value,
        ...additionalData
      });
      
    } catch (error) {
      console.warn('Performance tracking error:', error);
    }
  }

  // User properties
  static async setUserProperties(properties: Record<string, any>) {
    try {
      if (analytics) {
        await setUserProperties(analytics, properties);
      }
      
      console.log('📊 User Properties Set:', properties);
    } catch (error) {
      console.warn('User properties error:', error);
    }
  }

  // Page view tracking
  static async trackPageView(pageName: string, additionalData?: any) {
    await this.trackCustomEvent('page_view', {
      page_name: pageName,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      ...additionalData
    });
  }

  // E-commerce tracking
  static async trackPurchase(transactionData: any) {
    await this.trackCustomEvent('purchase', {
      transaction_id: transactionData.orderId,
      value: transactionData.total,
      currency: 'TRY',
      items: transactionData.items,
      ...transactionData
    });
  }

  // Error tracking
  static async trackError(error: Error, context?: string) {
    await this.trackCustomEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      context: context || 'unknown',
      timestamp: new Date().toISOString()
    });
  }

  // Get stored analytics events (for debugging)
  static getStoredEvents() {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('analytics_events') || '[]');
    }
    return [];
  }

  // Clear stored events
  static clearStoredEvents() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_events');
    }
  }

  // Kullanıcı oturum açma
  static trackLogin(method: string = 'email') {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'login', {
        method
      });
      
      console.log(`🔐 Kullanıcı girişi: ${method}`);
    } catch (error) {
      console.warn('Analytics login error:', error);
    }
  }

  // Kullanıcı kaydı
  static trackSignUp(method: string = 'email') {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'sign_up', {
        method
      });
      
      console.log(`👤 Yeni kullanıcı kaydı: ${method}`);
    } catch (error) {
      console.warn('Analytics signup error:', error);
    }
  }

  // Restoran görüntüleme
  static trackRestaurantView(restaurantId: string, restaurantName: string) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'view_item', {
        item_id: restaurantId,
        item_name: restaurantName,
        item_category: 'restaurant'
      });
      
      console.log(`🏪 Restoran görüntüleme: ${restaurantName}`);
    } catch (error) {
      console.warn('Analytics restaurant view error:', error);
    }
  }

  // Sepete ekleme
  static trackAddToCart(itemId: string, itemName: string, price: number, quantity: number = 1) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'add_to_cart', {
        currency: 'TRY',
        value: price * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price,
          quantity: quantity
        }]
      });
      
      console.log(`🛒 Sepete eklendi: ${itemName} x${quantity}`);
    } catch (error) {
      console.warn('Analytics add to cart error:', error);
    }
  }

  // Sipariş başlatma
  static trackBeginCheckout(cartValue: number, itemCount: number) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'begin_checkout', {
        currency: 'TRY',
        value: cartValue,
        num_items: itemCount
      });
      
      console.log(`💳 Sipariş başlatıldı: ${cartValue}₺`);
    } catch (error) {
      console.warn('Analytics begin checkout error:', error);
    }
  }

  // Arama
  static trackSearch(searchTerm: string, resultCount?: number) {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'search', {
        search_term: searchTerm,
        ...(resultCount !== undefined && { result_count: resultCount })
      });
      
      console.log(`🔍 Arama yapıldı: "${searchTerm}"`);
    } catch (error) {
      console.warn('Analytics search error:', error);
    }
  }

  // E-ticaret olayları
  static trackViewItemList(items: any[], listName: string = 'search_results') {
    if (!analytics) return;
    
    try {
      logEvent(analytics, 'view_item_list', {
        item_list_name: listName,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price
        }))
      });
      
      console.log(`📋 Liste görüntülendi: ${listName} (${items.length} öğe)`);
    } catch (error) {
      console.warn('Analytics view item list error:', error);
    }
  }
} 