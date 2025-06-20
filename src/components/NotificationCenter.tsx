'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminNotifications, useRestaurantNotifications, useUserNotifications } from '@/hooks/useNotifications';
import { 
  BellIcon, 
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';

interface NotificationCenterProps {
  className?: string;
}

export default function NotificationCenter({ className = '' }: NotificationCenterProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  // Kullanıcı rolüne göre bildirimleri al (hooks her zaman çalışmalı)
  const adminNotifications = useAdminNotifications();
  const restaurantNotifications = useRestaurantNotifications(user?.restaurantId || '');
  const userNotifications = useUserNotifications(user?.uid || '');

  // Mevcut bildirimleri belirle
  const currentNotifications = user?.isAdmin 
    ? adminNotifications 
    : user?.restaurantId 
    ? restaurantNotifications 
    : userNotifications;

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = currentNotifications;

  // Dışarı tıklama ile kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Browser bildirimi izni iste
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Filtrelenmiş bildirimler
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  // Bildirim türüne göre ikon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_order':
        return <div className="bg-green-500 text-white rounded-full p-1">🍽️</div>;
      case 'status_update':
        return <div className="bg-blue-500 text-white rounded-full p-1">📦</div>;
      case 'payment':
        return <div className="bg-yellow-500 text-white rounded-full p-1">💰</div>;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  // Bildirim türüne göre renk
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'new_order': return 'border-l-green-500 bg-green-50';
      case 'status_update': return 'border-l-blue-500 bg-blue-50';
      case 'payment': return 'border-l-yellow-500 bg-yellow-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      {/* Bildirim Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Bildirimler"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="h-6 w-6 text-primary-600" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-600" />
        )}
        
        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
      </button>

      {/* Bildirim Paneli */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Bildirimler
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    ({unreadCount} okunmamış)
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Filter & Actions */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'all' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === 'unread' 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Okunmamış
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="Tümünü okundu işaretle"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={clearNotifications}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    title="Tümünü temizle"
                  >
                    <TrashIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bildirimler Listesi */}
          <div className="max-h-64 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Bildirim yok</p>
                <p className="text-sm">
                  {filter === 'unread' ? 'Okunmamış bildirim bulunmuyor.' : 'Henüz bildirim almadınız.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${
                      notification.read ? 'opacity-75' : ''
                    } ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`text-sm font-medium ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              notification.read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </p>
                            
                            {/* Time */}
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <ClockIcon className="h-3 w-3" />
                              {format(notification.createdAt, 'dd MMM, HH:mm', { locale: tr })}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-colors"
                                title="Okundu işaretle"
                              >
                                <EyeIcon className="h-4 w-4 text-gray-400" />
                              </button>
                            )}
                            
                            {/* Sipariş detayına git */}
                            {notification.orderId && (
                              <Link
                                href={
                                  user.isAdmin 
                                    ? `/admin/orders/${notification.orderId}`
                                    : user.restaurantId
                                    ? `/restaurant/orders/${notification.orderId}`
                                    : `/account/orders/${notification.orderId}`
                                }
                                className="p-1 rounded-full hover:bg-white hover:shadow-sm transition-colors"
                                title="Detayları görüntüle"
                                onClick={() => setIsOpen(false)}
                              >
                                <ExclamationCircleIcon className="h-4 w-4 text-blue-500" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <Link
                href={
                  user.isAdmin 
                    ? '/admin/notifications'
                    : user.restaurantId
                    ? '/restaurant/notifications'
                    : '/account/notifications'
                }
                className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Tüm Bildirimleri Görüntüle →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 