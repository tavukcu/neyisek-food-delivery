import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnalyticsService } from '@/services/analyticsService';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export const useGoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      
      // Google Analytics sayfa görüntüleme
      window.gtag('config', 'G-ZQ6NF2K07L', {
        page_path: url,
        page_title: document.title,
        page_location: window.location.href,
      });

      // Kendi analytics servisimize de bildir
      AnalyticsService.trackPageView(pathname, {
        search_params: searchParams.toString(),
        full_url: url
      });

      console.log('📊 Google Analytics - Sayfa görüntüleme:', url);
    }
  }, [pathname, searchParams]);
};

// Özel event tracking hook'u
export const useAnalyticsEvent = () => {
  const trackEvent = (eventName: string, eventData?: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, eventData);
      console.log('📊 Google Analytics - Event:', eventName, eventData);
    }
  };

  const trackConversion = (conversionId: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: conversionId,
        value: value,
        currency: 'TRY'
      });
      console.log('📊 Google Analytics - Conversion:', conversionId, value);
    }
  };

  const trackPurchase = (transactionId: string, value: number, items: any[]) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        value: value,
        currency: 'TRY',
        items: items
      });
      console.log('📊 Google Analytics - Purchase:', transactionId, value);
    }
  };

  return {
    trackEvent,
    trackConversion,
    trackPurchase
  };
}; 