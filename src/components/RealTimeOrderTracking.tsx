'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone,
  MessageCircle,
  Navigation,
  CheckCircle,
  Package,
  Truck,
  Timer,
  Star,
  Zap,
  Bell,
  Heart,
  Share2,
  Download,
  QrCode,
  Smartphone,
  Wifi,
  Signal,
  Battery,
  CloudSnow,
  AlertTriangle,
  Eye,
  Camera,
  Mic,
  Video
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RealTimeOrderTrackingProps {
  order: Order;
  className?: string;
}

interface CourierInfo {
  id: string;
  name: string;
  phone: string;
  rating: number;
  deliveryCount: number;
  vehicleType: 'bike' | 'motorcycle' | 'car';
  location: {
    lat: number;
    lng: number;
  };
  estimatedArrival: Date;
  photo?: string;
}

interface TrackingUpdate {
  id: string;
  timestamp: Date;
  status: OrderStatus;
  message: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  estimatedTime?: number;
  photo?: string;
}

export default function RealTimeOrderTracking({ order, className = '' }: RealTimeOrderTrackingProps) {
  const router = useRouter();
  
  // State Management
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [courierInfo, setCourierInfo] = useState<CourierInfo | null>(null);
  const [trackingUpdates, setTrackingUpdates] = useState<TrackingUpdate[]>([]);
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [isLive, setIsLive] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [notifications, setNotifications] = useState(true);
  
  // Real-time Features
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Initialize tracking
  useEffect(() => {
    initializeTracking();
    startRealTimeUpdates();
    
    return () => {
      // Cleanup
    };
  }, [order.id]);

  const initializeTracking = async () => {
    try {
      // Simulate courier assignment
      if (currentStatus === OrderStatus.CONFIRMED || currentStatus === OrderStatus.PREPARING) {
        setTimeout(() => {
          assignCourier();
        }, 5000);
      }
      
      // Load initial tracking updates
      loadTrackingHistory();
      
    } catch (error) {
      console.error('Tracking initialization failed:', error);
    }
  };

  const assignCourier = () => {
    const courier: CourierInfo = {
      id: 'courier_001',
      name: 'Mehmet Kaya',
      phone: '+90 555 123 4567',
      rating: 4.8,
      deliveryCount: 2847,
      vehicleType: 'motorcycle',
      location: {
        lat: 38.7312 + (Math.random() - 0.5) * 0.01,
        lng: 27.4288 + (Math.random() - 0.5) * 0.01
      },
      estimatedArrival: new Date(Date.now() + estimatedTime * 60000),
      photo: '👨‍🍳'
    };
    
    setCourierInfo(courier);
    
    addTrackingUpdate({
      id: `update_${Date.now()}`,
      timestamp: new Date(),
      status: OrderStatus.DELIVERING,
      message: 'Kurye atandı ve yola çıktı',
      location: {
        ...courier.location,
        address: 'Restoran çıkışı'
      },
      estimatedTime: estimatedTime
    });
  };

  const startRealTimeUpdates = () => {
    const interval = setInterval(() => {
      if (!isLive) return;
      
      // Simulate real-time updates
      const now = new Date();
      setLastUpdate(now);
      
      // Random status updates
      if (Math.random() > 0.8) {
        simulateStatusUpdate();
      }
      
      // Update courier location
      if (courierInfo && currentStatus === OrderStatus.DELIVERING) {
        updateCourierLocation();
      }
      
      // Update estimated time
      if (estimatedTime > 0) {
        setEstimatedTime(prev => Math.max(0, prev - 0.25));
      }
      
    }, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  };

  const simulateStatusUpdate = () => {
    const updates = [
      'Siparişiniz hazırlanıyor...',
      'Malzemeler taze seçiliyor',
      'Kurye restoranda bekleniyor',
      'Sipariş ambalajlanıyor',
      'Kurye yola çıktı',
      'Kurye size yaklaşıyor'
    ];
    
    const randomUpdate = updates[Math.floor(Math.random() * updates.length)];
    
    addTrackingUpdate({
      id: `update_${Date.now()}`,
      timestamp: new Date(),
      status: currentStatus,
      message: randomUpdate,
      estimatedTime: estimatedTime
    });
  };

  const updateCourierLocation = () => {
    if (!courierInfo) return;
    
    // Simulate movement towards destination
    setCourierInfo(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        location: {
          lat: prev.location.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.location.lng + (Math.random() - 0.5) * 0.001
        }
      };
    });
  };

  const addTrackingUpdate = (update: TrackingUpdate) => {
    setTrackingUpdates(prev => [update, ...prev.slice(0, 9)]);
    
    if (notifications) {
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Sipariş Güncellemes', {
          body: update.message,
          icon: '/icon-192x192.png'
        });
      }
    }
  };

  const loadTrackingHistory = () => {
    const history: TrackingUpdate[] = [
      {
        id: 'update_1',
        timestamp: new Date(Date.now() - 15 * 60000),
        status: OrderStatus.PENDING,
        message: 'Siparişiniz alındı ve restoran bilgilendirildi'
      },
      {
        id: 'update_2',
        timestamp: new Date(Date.now() - 10 * 60000),
        status: OrderStatus.CONFIRMED,
        message: 'Restoran siparişinizi onayladı'
      },
      {
        id: 'update_3',
        timestamp: new Date(Date.now() - 5 * 60000),
        status: OrderStatus.PREPARING,
        message: 'Mutfak ekibi siparişinizi hazırlamaya başladı'
      }
    ];
    
    setTrackingUpdates(history);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'text-yellow-600 bg-yellow-100';
      case OrderStatus.CONFIRMED: return 'text-blue-600 bg-blue-100';
      case OrderStatus.PREPARING: return 'text-orange-600 bg-orange-100';
      case OrderStatus.READY: return 'text-purple-600 bg-purple-100';
      case OrderStatus.DELIVERING: return 'text-green-600 bg-green-100';
      case OrderStatus.DELIVERED: return 'text-emerald-600 bg-emerald-100';
      case OrderStatus.CANCELLED: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock className="h-5 w-5" />;
      case OrderStatus.CONFIRMED: return <CheckCircle className="h-5 w-5" />;
      case OrderStatus.PREPARING: return <Package className="h-5 w-5" />;
      case OrderStatus.READY: return <Bell className="h-5 w-5" />;
      case OrderStatus.DELIVERING: return <Truck className="h-5 w-5" />;
      case OrderStatus.DELIVERED: return <CheckCircle className="h-5 w-5" />;
      case OrderStatus.CANCELLED: return <AlertTriangle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const shareOrder = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sipariş Takibi',
          text: `Siparişim ${order.id} takip ediliyor`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    }
  };

  const callCourier = () => {
    if (courierInfo) {
      window.location.href = `tel:${courierInfo.phone}`;
    }
  };

  const openChat = () => {
    // Open chat interface
    console.log('Opening chat...');
  };

  return (
    <div className={`real-time-tracking ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Sipariş Takibi</h2>
            <p className="text-green-100">#{order.id.slice(-6)}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-400 animate-spin' :
              'bg-red-400'
            }`} />
            <span className="text-sm">
              {connectionStatus === 'connected' ? 'Canlı' :
               connectionStatus === 'connecting' ? 'Bağlanıyor' :
               'Bağlantı Yok'}
            </span>
          </div>
        </div>
        
        {/* Status Progress */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { status: OrderStatus.PENDING, label: 'Alındı' },
            { status: OrderStatus.CONFIRMED, label: 'Onaylandı' },
            { status: OrderStatus.PREPARING, label: 'Hazırlanıyor' },
            { status: OrderStatus.DELIVERING, label: 'Yolda' },
            { status: OrderStatus.DELIVERED, label: 'Teslim' }
          ].map(({ status, label }, index) => (
            <div key={status} className="text-center">
              <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${
                Object.values(OrderStatus).indexOf(currentStatus) >= index
                  ? 'bg-white text-green-500'
                  : 'bg-green-400 text-white'
              }`}>
                {getStatusIcon(status)}
              </div>
              <span className="text-xs">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white p-6 space-y-6">
        {/* Estimated Time */}
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {estimatedTime > 0 ? `${Math.ceil(estimatedTime)} dk` : 'Yakında'}
          </div>
          <p className="text-gray-600">Tahmini Teslimat Süresi</p>
          <div className="mt-2 text-xs text-gray-500">
            Son güncelleme: {lastUpdate.toLocaleTimeString('tr-TR')}
          </div>
        </div>

        {/* Courier Info */}
        {courierInfo && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Kurye Bilgileri</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">
                  {courierInfo.photo || '🏍️'}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{courierInfo.name}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span>{courierInfo.rating}</span>
                    <span>•</span>
                    <span>{courierInfo.deliveryCount} teslimat</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={callCourier}
                  className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </button>
                <button
                  onClick={openChat}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Map Toggle */}
        <button
          onClick={() => setShowMap(!showMap)}
          className="w-full p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <MapPin className="h-4 w-4 text-gray-600" />
          <span>{showMap ? 'Haritayı Gizle' : 'Canlı Haritayı Göster'}</span>
          {courierInfo && (
            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Tracking Updates */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Canlı Güncellemeler</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {trackingUpdates.map((update, index) => (
              <div key={update.id} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {getStatusIcon(update.status)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{update.message}</p>
                  <p className="text-xs text-gray-500">
                    {update.timestamp.toLocaleTimeString('tr-TR')}
                  </p>
                  {update.estimatedTime && (
                    <p className="text-xs text-blue-600">
                      Tahmini süre: {update.estimatedTime} dakika
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={shareOrder}
            className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm">Paylaş</span>
          </button>
          
          <button
            onClick={requestNotificationPermission}
            className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="text-sm">Bildirimler</span>
          </button>
        </div>

        {/* Order Summary */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Sipariş Özeti</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ara Toplam:</span>
              <span>₺{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Teslimat:</span>
              <span>₺{order.deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Toplam:</span>
              <span>₺{order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Acil Durum</span>
          </div>
          <p className="text-xs text-red-700">
            Herhangi bir sorun yaşarsanız: <strong>0850 123 4567</strong>
          </p>
        </div>
      </div>
    </div>
  );
} 