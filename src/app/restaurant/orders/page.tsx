'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { 
  useRestaurantOrdersRealTime, 
  useOrderStatusUpdate 
} from '@/hooks/useRealTimeSync';
import { Order, OrderStatus } from '@/types';
import { toast } from 'react-hot-toast';
import {
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Bell,
  BellOff,
  Truck,
  ChefHat,
  Package
} from 'lucide-react';

export default function RestaurantOrdersPage() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'active' | 'all'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showNewOrdersBadge, setShowNewOrdersBadge] = useState(true);

  // Real-time siparişler
  const { 
    orders, 
    activeOrders, 
    newOrdersCount, 
    clearNewOrdersCount, 
    loading, 
    error 
  } = useRestaurantOrdersRealTime(user?.restaurantId || '');

  // Sipariş durumu güncelleme
  const { updateStatus, updating } = useOrderStatusUpdate();

  useEffect(() => {
    // Sayfa açıldığında yeni sipariş sayacını temizle
    if (newOrdersCount > 0) {
      const timer = setTimeout(() => {
        clearNewOrdersCount();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newOrdersCount, clearNewOrdersCount]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.PREPARING:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case OrderStatus.READY:
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStatus.DELIVERING:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case OrderStatus.CONFIRMED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.PREPARING:
        return <ChefHat className="h-4 w-4" />;
      case OrderStatus.READY:
        return <Package className="h-4 w-4" />;
      case OrderStatus.DELIVERING:
        return <Truck className="h-4 w-4" />;
      case OrderStatus.DELIVERED:
        return <CheckCircle className="h-4 w-4" />;
      case OrderStatus.CANCELLED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'Bekliyor';
      case OrderStatus.CONFIRMED:
        return 'Onaylandı';
      case OrderStatus.PREPARING:
        return 'Hazırlanıyor';
      case OrderStatus.READY:
        return 'Hazır';
      case OrderStatus.DELIVERING:
        return 'Yolda';
      case OrderStatus.DELIVERED:
        return 'Teslim Edildi';
      case OrderStatus.CANCELLED:
        return 'İptal Edildi';
      default:
        return 'Bilinmiyor';
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    await updateStatus(orderId, newStatus);
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case OrderStatus.PENDING:
        return OrderStatus.CONFIRMED;
      case OrderStatus.CONFIRMED:
        return OrderStatus.PREPARING;
      case OrderStatus.PREPARING:
        return OrderStatus.READY;
      case OrderStatus.READY:
        return OrderStatus.DELIVERING;
      case OrderStatus.DELIVERING:
        return OrderStatus.DELIVERED;
      default:
        return null;
    }
  };

  const getNextStatusText = (currentStatus: OrderStatus): string => {
    const nextStatus = getNextStatus(currentStatus);
    return nextStatus ? getStatusText(nextStatus) : '';
  };

  if (!user?.restaurantId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Yetkisiz Erişim</h2>
          <p className="text-gray-600">Bu sayfaya erişim için restoran hesabı gerekli.</p>
        </div>
      </div>
    );
  }

  const displayOrders = selectedTab === 'active' ? activeOrders : orders;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              Siparişler
              {newOrdersCount > 0 && showNewOrdersBadge && (
                <span className="relative">
                  <Bell className="h-6 w-6 text-orange-500 animate-bounce" />
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {newOrdersCount}
                  </span>
                </span>
              )}
            </h1>
            <p className="text-gray-600">
              Real-time sipariş takibi ve yönetimi
            </p>
          </div>
          
          {/* Bildirim Durumu */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              Canlı Bağlantı
            </div>
            {newOrdersCount > 0 && (
              <button
                onClick={() => {
                  setShowNewOrdersBadge(false);
                  clearNewOrdersCount();
                }}
                className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm hover:bg-orange-200 transition-colors"
              >
                {newOrdersCount} Yeni Sipariş
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setSelectedTab('active')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                selectedTab === 'active'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Aktif Siparişler ({activeOrders.length})
            </button>
            <button
              onClick={() => setSelectedTab('all')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                selectedTab === 'all'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Tüm Siparişler ({orders.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Siparişler yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Hata: {error}</p>
          </div>
        ) : (
          <>
            {/* Siparişler Listesi */}
            <div className="grid gap-4">
              {displayOrders.length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {selectedTab === 'active' ? 'Aktif sipariş yok' : 'Henüz sipariş yok'}
                  </h3>
                  <p className="text-gray-600">
                    {selectedTab === 'active' 
                      ? 'Şu anda işlem bekleyen sipariş bulunmuyor.' 
                      : 'İlk siparişiniz geldiğinde burada görünecek.'}
                  </p>
                </div>
              ) : (
                displayOrders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              Sipariş #{order.id.slice(-8)}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatCurrency(order.total)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {order.items.length} ürün
                          </div>
                        </div>
                      </div>

                      {/* Sipariş Detayları */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Müşteri Bilgileri</h4>
                          <p className="text-sm text-gray-600">{order.user?.displayName}</p>
                          <p className="text-sm text-gray-600">{order.user?.phoneNumber}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Teslimat Adresi</h4>
                          <p className="text-sm text-gray-600">
                            {order.deliveryAddress.street}, {order.deliveryAddress.district}
                          </p>
                        </div>
                      </div>

                      {/* Ürünler */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Sipariş Detayları</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span className="text-gray-600 truncate">
                                {item.quantity}x {item.product.name}
                              </span>
                              <span className="font-medium">
                                {formatCurrency((item.price || item.product.price) * item.quantity)}
                              </span>
                            </div>
                          ))}
                          {order.specialInstructions && (
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                              <strong>Özel Not:</strong> {order.specialInstructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ödeme ve Komisyon Bilgileri */}
                      <div className="grid md:grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-600">Alt Toplam:</span>
                          <div className="font-medium">{formatCurrency(order.subtotal)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Komisyon (%9):</span>
                          <div className="font-medium text-red-600">
                            -{formatCurrency(order.commissionCalculation.commissionAmount)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Net Kazancınız:</span>
                          <div className="font-medium text-green-600">
                            {formatCurrency(order.commissionCalculation.restaurantEarning)}
                          </div>
                        </div>
                      </div>

                      {/* Aksiyon Butonları */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          {order.status !== OrderStatus.DELIVERED && 
                           order.status !== OrderStatus.CANCELLED && (
                            <>
                              {getNextStatus(order.status) && (
                                <button
                                  onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)}
                                  disabled={updating}
                                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                  {updating ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  ) : (
                                    getStatusIcon(getNextStatus(order.status)!)
                                  )}
                                  {getNextStatusText(order.status)}
                                </button>
                              )}
                              
                              {order.status === OrderStatus.PENDING && (
                                <button
                                  onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                                  disabled={updating}
                                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                  <XCircle className="h-4 w-4" />
                                  İptal Et
                                </button>
                              )}
                            </>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Detaylar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Sipariş Detay Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    Sipariş #{selectedOrder.id.slice(-8)}
                  </h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
                
                {/* Modal içeriği buraya gelecek */}
                <div className="space-y-4">
                  <div>
                    <strong>Durum:</strong>
                    <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusIcon(selectedOrder.status)}
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <strong>Toplam:</strong> {formatCurrency(selectedOrder.total)}
                  </div>
                  <div>
                    <strong>Ödeme Yöntemi:</strong> {
                      selectedOrder.paymentMethod === 'cash_on_delivery' ? 'Kapıda Nakit' : 'Kapıda Kart'
                    }
                  </div>
                  {/* Diğer detaylar */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 