'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BackToHomeButton from './BackToHomeButton';

export default function FloatingHomeButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();

  // Component mount olduğunda set et
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Ana sayfada gösterme - sadece client-side'da kontrol et
  const shouldShow = isMounted && pathname !== '/';

  useEffect(() => {
    if (!shouldShow || !isMounted) {
      setIsVisible(false);
      return;
    }

    const toggleVisibility = () => {
      // Sayfa 300px aşağı kaydırıldığında göster
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    
    // İlk yüklemede kontrol et
    toggleVisibility();

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, [shouldShow, isMounted]);

  // Server-side rendering sırasında hiçbir şey render etme
  if (!isMounted || !shouldShow || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <BackToHomeButton 
        variant="primary" 
        position="static"
        className="shadow-2xl hover:shadow-3xl transition-all duration-300 animate-bounce-subtle"
        showIcon={true}
        text=""
      />
    </div>
  );
} 