import { performance as firebasePerformance } from '@/lib/firebase';
import { trace } from 'firebase/performance';

export class PerformanceService {
  private static traces: Map<string, any> = new Map();

  // Sayfa yükleme süresini başlat
  static startPageLoadTrace(pageName: string): string {
    if (!firebasePerformance) return '';
    
    try {
      const traceId = `page_load_${pageName}_${Date.now()}`;
      const pageTrace = trace(firebasePerformance, traceId);
      pageTrace.start();
      
      this.traces.set(traceId, pageTrace);
      console.log(`⏱️ Sayfa yükleme takibi başlatıldı: ${pageName}`);
      
      return traceId;
    } catch (error) {
      console.warn('Performance trace start error:', error);
      return '';
    }
  }

  // Sayfa yükleme süresini sonlandır
  static stopPageLoadTrace(traceId: string, additionalMetrics?: Record<string, number>) {
    if (!firebasePerformance || !traceId) return;
    
    try {
      const pageTrace = this.traces.get(traceId);
      if (!pageTrace) return;

      // Ek metrikler varsa ekle
      if (additionalMetrics) {
        Object.entries(additionalMetrics).forEach(([key, value]) => {
          pageTrace.putMetric(key, value);
        });
      }

      pageTrace.stop();
      this.traces.delete(traceId);
      
      console.log(`✅ Sayfa yükleme takibi tamamlandı: ${traceId}`);
    } catch (error) {
      console.warn('Performance trace stop error:', error);
    }
  }

  // API çağrısı takibi
  static startApiTrace(apiEndpoint: string): string {
    if (!firebasePerformance) return '';
    
    try {
      const traceId = `api_call_${apiEndpoint.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
      const apiTrace = trace(firebasePerformance, traceId);
      apiTrace.start();
      
      this.traces.set(traceId, apiTrace);
      console.log(`🌐 API çağrısı takibi başlatıldı: ${apiEndpoint}`);
      
      return traceId;
    } catch (error) {
      console.warn('API trace start error:', error);
      return '';
    }
  }

  // API çağrısı takibini sonlandır
  static stopApiTrace(traceId: string, statusCode?: number, responseSize?: number) {
    if (!firebasePerformance || !traceId) return;
    
    try {
      const apiTrace = this.traces.get(traceId);
      if (!apiTrace) return;

      // HTTP status code'u ekle
      if (statusCode) {
        apiTrace.putAttribute('http_response_code', statusCode.toString());
        apiTrace.putMetric('response_code', statusCode);
      }

      // Response boyutu ekle
      if (responseSize) {
        apiTrace.putMetric('response_size_bytes', responseSize);
      }

      apiTrace.stop();
      this.traces.delete(traceId);
      
      console.log(`✅ API çağrısı takibi tamamlandı: ${traceId}`);
    } catch (error) {
      console.warn('API trace stop error:', error);
    }
  }

  // Özel işlem takibi
  static startCustomTrace(traceName: string, attributes?: Record<string, string>): string {
    if (!firebasePerformance) return '';
    
    try {
      const traceId = `${traceName}_${Date.now()}`;
      const customTrace = trace(firebasePerformance, traceName);
      
      // Özel attributeler varsa ekle
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          customTrace.putAttribute(key, value);
        });
      }
      
      customTrace.start();
      this.traces.set(traceId, customTrace);
      
      console.log(`🎯 Özel takip başlatıldı: ${traceName}`);
      
      return traceId;
    } catch (error) {
      console.warn('Custom trace start error:', error);
      return '';
    }
  }

  // Özel işlem takibini sonlandır
  static stopCustomTrace(traceId: string, metrics?: Record<string, number>) {
    if (!firebasePerformance || !traceId) return;
    
    try {
      const customTrace = this.traces.get(traceId);
      if (!customTrace) return;

      // Metrikler varsa ekle
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          customTrace.putMetric(key, value);
        });
      }

      customTrace.stop();
      this.traces.delete(traceId);
      
      console.log(`✅ Özel takip tamamlandı: ${traceId}`);
    } catch (error) {
      console.warn('Custom trace stop error:', error);
    }
  }

  // Dosya yükleme takibi
  static trackFileUpload(fileName: string, fileSize: number): string {
    return this.startCustomTrace('file_upload', {
      file_name: fileName,
      file_size: fileSize.toString()
    });
  }

  // Arama performansı takibi
  static trackSearchPerformance(searchTerm: string, resultCount: number): string {
    return this.startCustomTrace('search_performance', {
      search_term: searchTerm,
      result_count: resultCount.toString()
    });
  }

  // Sepet işlemleri takibi
  static trackCartOperation(operation: string, itemCount: number): string {
    return this.startCustomTrace('cart_operation', {
      operation: operation,
      item_count: itemCount.toString()
    });
  }

  // Sayfa yüklenme süresini otomatik takip
  static trackPageLoadTime(pageName: string) {
    if (typeof window === 'undefined') return;

    try {
      // Browser'ın native Performance API'sini kullan
      const navigationEntries = window.performance.getEntriesByType('navigation');
      const navigationEntry = navigationEntries[0] as PerformanceNavigationTiming;
      
      if (navigationEntry) {
        const loadTime = navigationEntry.loadEventEnd - navigationEntry.loadEventStart;
        const domContentLoaded = navigationEntry.domContentLoadedEventEnd - navigationEntry.domContentLoadedEventStart;
        const firstPaint = navigationEntry.responseEnd - navigationEntry.requestStart;

        console.log(`📊 Sayfa performansı - ${pageName}:`, {
          loadTime: `${loadTime}ms`,
          domContentLoaded: `${domContentLoaded}ms`,
          firstPaint: `${firstPaint}ms`
        });

        // Firebase Custom trace ile kaydet
        const traceId = this.startCustomTrace(`page_performance_${pageName}`, {
          page_name: pageName
        });

        setTimeout(() => {
          this.stopCustomTrace(traceId, {
            load_time: Math.round(loadTime),
            dom_content_loaded: Math.round(domContentLoaded),
            first_paint: Math.round(firstPaint)
          });
        }, 100);
      }
    } catch (error) {
      console.warn('Page load time tracking error:', error);
    }
  }

  // Memory kullanımı takibi (eğer destekleniyorsa)
  static trackMemoryUsage() {
    if (typeof window === 'undefined') return;

    try {
      // Memory API için type definition
      interface MemoryInfo {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
      }

      interface PerformanceWithMemory extends Performance {
        memory?: MemoryInfo;
      }

      const performanceWithMemory = window.performance as PerformanceWithMemory;
      
      if (performanceWithMemory.memory) {
        const memInfo = performanceWithMemory.memory;
        
        console.log('💾 Memory kullanımı:', {
          used: `${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          limit: `${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        });

        // Firebase Custom trace ile kaydet
        const traceId = this.startCustomTrace('memory_usage');
        
        setTimeout(() => {
          this.stopCustomTrace(traceId, {
            used_heap_size_mb: Math.round(memInfo.usedJSHeapSize / 1024 / 1024),
            total_heap_size_mb: Math.round(memInfo.totalJSHeapSize / 1024 / 1024),
            heap_size_limit_mb: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)
          });
        }, 100);
      }
    } catch (error) {
      console.warn('Memory usage tracking error:', error);
    }
  }

  // Web Vitals metrikleri takibi
  static trackWebVitals() {
    if (typeof window === 'undefined') return;

    try {
      // First Contentful Paint (FCP)
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        console.log(`🎨 First Contentful Paint: ${fcpEntry.startTime.toFixed(2)}ms`);
        
        const traceId = this.startCustomTrace('web_vitals_fcp');
        setTimeout(() => {
          this.stopCustomTrace(traceId, {
            fcp_time: Math.round(fcpEntry.startTime)
          });
        }, 100);
      }

      // Largest Contentful Paint (LCP) - Observer ile
      if ('PerformanceObserver' in window) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          console.log(`🖼️ Largest Contentful Paint: ${lastEntry.startTime.toFixed(2)}ms`);
          
          const traceId = this.startCustomTrace('web_vitals_lcp');
          setTimeout(() => {
            this.stopCustomTrace(traceId, {
              lcp_time: Math.round(lastEntry.startTime)
            });
          }, 100);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }
    } catch (error) {
      console.warn('Web Vitals tracking error:', error);
    }
  }
} 