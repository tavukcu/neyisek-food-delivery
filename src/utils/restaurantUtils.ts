import { RestaurantInfo } from '@/types';

// Türkçe gün isimleri
export const TURKISH_DAYS = {
  monday: 'Pazartesi',
  tuesday: 'Salı', 
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar'
} as const;

// İngilizce gün isimleri (JavaScript Date objesi için)
export const ENGLISH_DAYS = [
  'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'
] as const;

/**
 * Restoranın şu anda açık olup olmadığını kontrol eder
 */
export function isRestaurantOpen(restaurant: RestaurantInfo): boolean {
  if (!restaurant.isOpen) return false;
  
  const now = new Date();
  const currentDay = ENGLISH_DAYS[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Dakika cinsinden
  
  const daySchedule = restaurant.workingHours?.[currentDay];
  if (!daySchedule || !daySchedule.isOpen) return false;
  
  const openTime = timeStringToMinutes(daySchedule.open);
  const closeTime = timeStringToMinutes(daySchedule.close);
  
  // Gece yarısını geçen saatler için (örn: 23:00 - 02:00)
  if (closeTime < openTime) {
    return currentTime >= openTime || currentTime <= closeTime;
  }
  
  return currentTime >= openTime && currentTime <= closeTime;
}

/**
 * Restoranın ne zaman açılacağını hesaplar
 */
export function getNextOpeningTime(restaurant: RestaurantInfo): { day: string; time: string } | null {
  if (!restaurant.workingHours) return null;
  
  const now = new Date();
  const currentDay = now.getDay();
  
  // Önce bugünün kalan saatlerini kontrol et
  for (let i = 0; i < 7; i++) {
    const checkDay = (currentDay + i) % 7;
    const dayKey = ENGLISH_DAYS[checkDay];
    const daySchedule = restaurant.workingHours[dayKey];
    
    if (daySchedule && daySchedule.isOpen) {
      const openTime = timeStringToMinutes(daySchedule.open);
      const currentTime = now.getHours() * 60 + now.getMinutes();
      
      // Bugün ise ve henüz açılma saati gelmemişse
      if (i === 0 && currentTime < openTime) {
        return {
          day: i === 0 ? 'Bugün' : TURKISH_DAYS[dayKey as keyof typeof TURKISH_DAYS],
          time: daySchedule.open
        };
      }
      
      // Gelecek günler için
      if (i > 0) {
        return {
          day: i === 1 ? 'Yarın' : TURKISH_DAYS[dayKey as keyof typeof TURKISH_DAYS],
          time: daySchedule.open
        };
      }
    }
  }
  
  return null;
}

/**
 * Restoranın ne zaman kapanacağını hesaplar
 */
export function getClosingTime(restaurant: RestaurantInfo): string | null {
  if (!restaurant.isOpen || !isRestaurantOpen(restaurant)) return null;
  
  const now = new Date();
  const currentDay = ENGLISH_DAYS[now.getDay()];
  const daySchedule = restaurant.workingHours?.[currentDay];
  
  if (!daySchedule || !daySchedule.isOpen) return null;
  
  return daySchedule.close;
}

/**
 * Restoranın durumunu döndürür
 */
export function getRestaurantStatus(restaurant: RestaurantInfo): {
  isOpen: boolean;
  status: 'open' | 'closed' | 'closing_soon';
  message: string;
  nextOpening?: { day: string; time: string };
} {
  if (!restaurant.isOpen) {
    return {
      isOpen: false,
      status: 'closed',
      message: 'Restoran geçici olarak kapalı'
    };
  }
  
  const isOpen = isRestaurantOpen(restaurant);
  
  if (isOpen) {
    const closingTime = getClosingTime(restaurant);
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const closeTimeMinutes = closingTime ? timeStringToMinutes(closingTime) : 0;
    
    // Kapanmaya 30 dakika kala uyarı
    const timeUntilClose = closeTimeMinutes > currentTime 
      ? closeTimeMinutes - currentTime 
      : (24 * 60) - currentTime + closeTimeMinutes; // Gece yarısını geçen durumlar için
    
    if (timeUntilClose <= 30 && timeUntilClose > 0) {
      return {
        isOpen: true,
        status: 'closing_soon',
        message: `${Math.floor(timeUntilClose)} dakika sonra kapanıyor`
      };
    }
    
    return {
      isOpen: true,
      status: 'open',
      message: closingTime ? `${closingTime}'e kadar açık` : 'Açık'
    };
  }
  
  const nextOpening = getNextOpeningTime(restaurant);
  return {
    isOpen: false,
    status: 'closed',
    message: 'Kapalı',
    nextOpening: nextOpening || undefined
  };
}

/**
 * Sipariş verilebilir mi kontrol eder
 */
export function canPlaceOrder(restaurant: RestaurantInfo): {
  canOrder: boolean;
  reason?: string;
} {
  if (!restaurant.isOpen) {
    return {
      canOrder: false,
      reason: 'Restoran geçici olarak hizmet vermiyor'
    };
  }
  
  const status = getRestaurantStatus(restaurant);
  
  if (!status.isOpen) {
    const nextOpening = status.nextOpening;
    const reason = nextOpening 
      ? `Restoran kapalı. ${nextOpening.day} ${nextOpening.time}'de açılacak`
      : 'Restoran şu anda kapalı';
    
    return {
      canOrder: false,
      reason
    };
  }
  
  if (status.status === 'closing_soon') {
    return {
      canOrder: true,
      reason: `Dikkat: ${status.message}`
    };
  }
  
  return { canOrder: true };
}

/**
 * Zaman string'ini dakikaya çevirir (örn: "14:30" -> 870)
 */
function timeStringToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Dakikayı zaman string'ine çevirir (örn: 870 -> "14:30")
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Bugünün çalışma saatlerini döndürür
 */
export function getTodayWorkingHours(restaurant: RestaurantInfo): {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
} {
  const now = new Date();
  const currentDay = ENGLISH_DAYS[now.getDay()];
  const daySchedule = restaurant.workingHours?.[currentDay];
  
  if (!daySchedule || !daySchedule.isOpen) {
    return { isOpen: false };
  }
  
  return {
    isOpen: true,
    openTime: daySchedule.open,
    closeTime: daySchedule.close
  };
}

/**
 * Haftalık çalışma saatlerini formatlar
 */
export function formatWorkingHours(restaurant: RestaurantInfo): Array<{
  day: string;
  isOpen: boolean;
  hours?: string;
  isToday: boolean;
}> {
  if (!restaurant.workingHours) return [];
  
  const today = new Date().getDay();
  
  return ENGLISH_DAYS.map((dayKey, index) => {
    const daySchedule = restaurant.workingHours[dayKey];
    const turkishDay = TURKISH_DAYS[dayKey as keyof typeof TURKISH_DAYS];
    
    return {
      day: turkishDay,
      isOpen: daySchedule?.isOpen || false,
      hours: daySchedule?.isOpen ? `${daySchedule.open} - ${daySchedule.close}` : undefined,
      isToday: index === today
    };
  });
} 