'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminNotifications, useRestaurantNotifications, useUserNotifications } from '@/hooks/useNotifications';
import { 
  WifiIcon, 
  SignalIcon,
  BellIcon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  WifiIcon as WifiSolidIcon,
  SignalIcon as SignalSolidIcon 
} from '@heroicons/react/24/solid';

interface RealTimeStatusBarProps {
  className?: string;
}

export default function RealTimeStatusBar({ className = '' }: RealTimeStatusBarProps) {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activityCount, setActivityCount] = useState(0);

  // Kullanıcı rolüne göre bildirimleri al (hooks her zaman çalışmalı)
  const adminNotifications = useAdminNotifications();
  const restaurantNotifications = useRestaurantNotifications(user?.restaurantId || '');
  const userNotifications = useUserNotifications(user?.uid || '');

  // Kullanıcı rolüne göre doğru bildirimleri seç
  const currentNotifications = user?.isAdmin 
    ? adminNotifications 
    : user?.restaurantId 
    ? restaurantNotifications 
    : userNotifications;

  const { unreadCount } = currentNotifications;

  // Bağlantı durumunu izle
  useEffect(() => {
    const checkConnection = () => {
      if (navigator.onLine) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    };

    checkConnection();
    window.addEventListener('online', checkConnection);
    window.addEventListener('offline', checkConnection);

    return () => {
      window.removeEventListener('online', checkConnection);
      window.removeEventListener('offline', checkConnection);
    };
  }, []);

  // Aktivite sayısını güncelle
  useEffect(() => {
    setLastUpdate(new Date());
    setActivityCount(prev => prev + 1);
  }, [unreadCount]);

  // Heartbeat animasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // 30 saniyede bir güncelle

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Bağlı';
      case 'connecting': return 'Bağlanıyor...';
      case 'disconnected': return 'Bağlantı Kesildi';
      default: return 'Bilinmiyor';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className={`bg-gray-50 border-t border-gray-200 px-4 py-2 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-600">
        {/* Sol taraf - Bağlantı durumu */}
        <div className="flex items-center gap-4">
          {/* Real-time bağlantı */}
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <SignalSolidIcon className="h-4 w-4 text-green-500" />
            ) : (
              <SignalIcon className="h-4 w-4 text-red-500" />
            )}
            <span className={`font-medium ${
              connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
            }`}>
              {getStatusText()}
            </span>
            
            {/* Pulse indicator */}
            {connectionStatus === 'connected' && (
              <div className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
            )}
          </div>

          {/* Bildirim sayısı */}
          {unreadCount > 0 && (
            <div className="flex items-center gap-1">
              <BellIcon className="h-4 w-4 text-orange-500" />
              <span className="text-orange-600 font-medium">
                {unreadCount} yeni bildirim
              </span>
            </div>
          )}

          {/* Kullanıcı rolü */}
          <div className="flex items-center gap-1">
            {user.isAdmin ? (
              <>
                <UsersIcon className="h-4 w-4 text-purple-500" />
                <span className="text-purple-600">Admin Panel</span>
              </>
            ) : user.restaurantId ? (
              <>
                <ShoppingCartIcon className="h-4 w-4 text-blue-500" />
                <span className="text-blue-600">Restoran Panel</span>
              </>
            ) : (
              <>
                <UsersIcon className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Müşteri</span>
              </>
            )}
          </div>
        </div>

        {/* Orta - Aktivite göstergesi */}
        <div className="hidden md:flex items-center gap-4">
          {/* Aktivite sayısı */}
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Canlı İzleme</span>
          </div>

          {/* Son güncelleme */}
          <div className="flex items-center gap-1">
            <ClockIcon className="h-4 w-4" />
            <span>Son güncelleme: {formatTime(lastUpdate)}</span>
          </div>
        </div>

        {/* Sağ taraf - Sistem bilgileri */}
        <div className="flex items-center gap-4">
          {/* Browser notification durumu */}
          <div className="flex items-center gap-1">
            {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' ? (
              <>
                <WifiSolidIcon className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Bildirimler Aktif</span>
              </>
            ) : (
              <>
                <WifiIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Bildirimler Kapalı</span>
              </>
            )}
          </div>

          {/* Performans göstergesi */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="flex gap-1">
              <div className="h-3 w-1 bg-green-500 rounded"></div>
              <div className="h-3 w-1 bg-green-500 rounded"></div>
              <div className="h-3 w-1 bg-green-500 rounded"></div>
              <div className="h-3 w-1 bg-yellow-500 rounded"></div>
              <div className="h-3 w-1 bg-gray-300 rounded"></div>
            </div>
            <span>Performans: İyi</span>
          </div>

          {/* Veri kullanımı */}
          <div className="hidden xl:block">
            <span>Veri: Real-time sync aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
} 