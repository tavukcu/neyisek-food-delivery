import { analytics, performance } from '@/lib/firebase';
import { logEvent, setUserProperties } from 'firebase/analytics';
import { trace } from 'firebase/performance';

// Google Analytics gtag fonksiyonu için tip tanımı
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Analytics olayları için tip tanımları
export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export class AnalyticsService {
  // Google Analytics gtag tracking helper
  private static gtag(...args: any[]) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag(...args);
    }
  }

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

      // Google Analytics gtag tracking
      this.gtag('event', eventName, {
        ...eventData,
        timestamp: new Date().toISOString(),
        platform: 'web'
      });
      
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

      // Google Analytics performance tracking
      this.gtag('event', 'page_timing', {
        name: metricName,
        value: Math.round(value),
        ...additionalData
      });
      
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

      // Google Analytics user properties
      this.gtag('config', 'G-ZQ6NF2K07L', {
        user_properties: properties
      });
      
      console.log('📊 User Properties Set:', properties);
    } catch (error) {
      console.warn('User properties error:', error);
    }
  }

  // Page view tracking
  static async trackPageView(pageName: string, additionalData?: any) {
    // Google Analytics page view
    this.gtag('config', 'G-ZQ6NF2K07L', {
      page_title: pageName,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      ...additionalData
    });

    await this.trackCustomEvent('page_view', {
      page_name: pageName,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      ...additionalData
    });
  }

  // E-commerce tracking
  static async trackPurchase(transactionData: any) {
    // Google Analytics e-commerce tracking
    this.gtag('event', 'purchase', {
      transaction_id: transactionData.orderId,
      value: transactionData.total,
      currency: 'TRY',
      items: transactionData.items?.map((item: any) => ({
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price
      }))
    });

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
    // Google Analytics exception tracking
    this.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      context: context || 'unknown'
    });

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
    try {
      // Google Analytics login event
      this.gtag('event', 'login', {
        method
      });

      if (analytics) {
        logEvent(analytics, 'login', {
          method
        });
      }
      
      console.log(`🔐 Kullanıcı girişi: ${method}`);
    } catch (error) {
      console.warn('Analytics login error:', error);
    }
  }

  // Kullanıcı kaydı
  static trackSignUp(method: string = 'email') {
    try {
      // Google Analytics sign up event
      this.gtag('event', 'sign_up', {
        method
      });

      if (analytics) {
        logEvent(analytics, 'sign_up', {
          method
        });
      }
      
      console.log(`👤 Yeni kullanıcı kaydı: ${method}`);
    } catch (error) {
      console.warn('Analytics signup error:', error);
    }
  }

  // Restoran görüntüleme
  static trackRestaurantView(restaurantId: string, restaurantName: string) {
    try {
      // Google Analytics view item event
      this.gtag('event', 'view_item', {
        item_id: restaurantId,
        item_name: restaurantName,
        item_category: 'restaurant'
      });

      if (analytics) {
        logEvent(analytics, 'view_item', {
          item_id: restaurantId,
          item_name: restaurantName,
          item_category: 'restaurant'
        });
      }
      
      console.log(`🏪 Restoran görüntüleme: ${restaurantName}`);
    } catch (error) {
      console.warn('Analytics restaurant view error:', error);
    }
  }

  // Sepete ekleme
  static trackAddToCart(itemId: string, itemName: string, price: number, quantity: number = 1) {
    try {
      // Google Analytics add to cart event
      this.gtag('event', 'add_to_cart', {
        currency: 'TRY',
        value: price * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price,
          quantity: quantity
        }]
      });

      if (analytics) {
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
      }
      
      console.log(`🛒 Sepete ekleme: ${itemName} x${quantity}`);
    } catch (error) {
      console.warn('Analytics add to cart error:', error);
    }
  }

  // Sipariş başlatma
  static trackBeginCheckout(cartValue: number, itemCount: number) {
    try {
      // Google Analytics begin checkout event
      this.gtag('event', 'begin_checkout', {
        currency: 'TRY',
        value: cartValue,
        num_items: itemCount
      });

      if (analytics) {
        logEvent(analytics, 'begin_checkout', {
          currency: 'TRY',
          value: cartValue,
          num_items: itemCount
        });
      }
      
      console.log(`💳 Sipariş başlatıldı: ${cartValue}₺`);
    } catch (error) {
      console.warn('Analytics begin checkout error:', error);
    }
  }

  // Arama
  static trackSearch(searchTerm: string, resultCount?: number) {
    try {
      // Google Analytics search event
      this.gtag('event', 'search', {
        search_term: searchTerm,
        ...(resultCount !== undefined && { result_count: resultCount })
      });

      if (analytics) {
        logEvent(analytics, 'search', {
          search_term: searchTerm,
          ...(resultCount !== undefined && { result_count: resultCount })
        });
      }
      
      console.log(`🔍 Arama yapıldı: "${searchTerm}"`);
    } catch (error) {
      console.warn('Analytics search error:', error);
    }
  }

  // E-ticaret olayları
  static trackViewItemList(items: any[], listName: string = 'search_results') {
    try {
      const mappedItems = items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price
      }));

      // Google Analytics view item list event
      this.gtag('event', 'view_item_list', {
        item_list_name: listName,
        items: mappedItems
      });

      if (analytics) {
        logEvent(analytics, 'view_item_list', {
          item_list_name: listName,
          items: mappedItems
        });
      }
      
      console.log(`📋 Liste görüntülendi: ${listName} (${items.length} öğe)`);
    } catch (error) {
      console.warn('Analytics view item list error:', error);
    }
  }

  // Sepetten çıkarma
  static trackRemoveFromCart(itemId: string, itemName: string, price: number, quantity: number = 1) {
    try {
      // Google Analytics remove from cart event
      this.gtag('event', 'remove_from_cart', {
        currency: 'TRY',
        value: price * quantity,
        items: [{
          item_id: itemId,
          item_name: itemName,
          price: price,
          quantity: quantity
        }]
      });

      if (analytics) {
        logEvent(analytics, 'remove_from_cart', {
          currency: 'TRY',
          value: price * quantity,
          items: [{
            item_id: itemId,
            item_name: itemName,
            price: price,
            quantity: quantity
          }]
        });
      }
      
      console.log(`🗑️ Sepetten çıkarıldı: ${itemName} x${quantity}`);
    } catch (error) {
      console.warn('Analytics remove from cart error:', error);
    }
  }

  // Ödeme bilgilerini ekleme
  static trackAddPaymentInfo(paymentType: string) {
    try {
      // Google Analytics add payment info event
      this.gtag('event', 'add_payment_info', {
        payment_type: paymentType
      });

      if (analytics) {
        logEvent(analytics, 'add_payment_info', {
          payment_type: paymentType
        });
      }
      
      console.log(`💳 Ödeme bilgisi eklendi: ${paymentType}`);
    } catch (error) {
      console.warn('Analytics add payment info error:', error);
    }
  }

  // Teslimat bilgilerini ekleme
  static trackAddShippingInfo(shippingTier: string) {
    try {
      // Google Analytics add shipping info event
      this.gtag('event', 'add_shipping_info', {
        shipping_tier: shippingTier
      });

      if (analytics) {
        logEvent(analytics, 'add_shipping_info', {
          shipping_tier: shippingTier
        });
      }
      
      console.log(`🚚 Teslimat bilgisi eklendi: ${shippingTier}`);
    } catch (error) {
      console.warn('Analytics add shipping info error:', error);
    }
  }

  // Özel conversion tracking
  static trackConversion(conversionType: string, value?: number, currency: string = 'TRY') {
    try {
      // Google Analytics conversion event
      this.gtag('event', 'conversion', {
        conversion_type: conversionType,
        ...(value && { value, currency })
      });

      console.log(`🎯 Conversion: ${conversionType}${value ? ` (${value} ${currency})` : ''}`);
    } catch (error) {
      console.warn('Analytics conversion error:', error);
    }
  }

  // Engagement tracking
  static trackEngagement(engagementType: string, details?: any) {
    try {
      // Google Analytics engagement event
      this.gtag('event', 'engagement', {
        engagement_type: engagementType,
        ...details
      });

      console.log(`📈 Engagement: ${engagementType}`, details);
    } catch (error) {
      console.warn('Analytics engagement error:', error);
    }
  }
} 