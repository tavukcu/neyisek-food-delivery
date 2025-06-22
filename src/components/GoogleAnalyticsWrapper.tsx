'use client';

import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

export default function GoogleAnalyticsWrapper() {
  // Sayfa değişikliklerini takip et
  useGoogleAnalytics();
  
  // Bu bileşen sadece tracking için kullanılıyor, hiçbir görsel element render etmiyor
  return null;
} 