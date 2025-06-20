'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus } from '@/types';
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import BackToHomeButton from '@/components/BackToHomeButton';

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  useEffect(() => {
    if (!user) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
        estimatedDeliveryTime: doc.data().estimatedDeliveryTime.toDate(),
        actualDeliveryTime: doc.data().actualDeliveryTime?.toDate()
      })) as Order[];
      
      setOrders(ordersData);
      setLoadingOrders(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Kullanıcı giriş yapmamışsa yönlendir
  useEffect(() => {
    if (!loading && !user) {
      router.push('/account');
    }
  }, [loading, user, router]);

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter);

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case OrderStatus.CONFIRMED:
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      case OrderStatus.PREPARING:
        return <FireIcon className="h-5 w-5 text-orange-500" />;
      case OrderStatus.READY:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case OrderStatus.DELIVERING:
        return <TruckIcon className="h-5 w-5 text-blue-600" />;
      case OrderStatus.DELIVERED:
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case OrderStatus.CANCELLED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Bekliyor';
      case OrderStatus.CONFIRMED: return 'Onaylandı';
      case OrderStatus.PREPARING: return 'Hazırlanıyor';
      case OrderStatus.READY: return 'Hazır';
      case OrderStatus.DELIVERING: return 'Yolda';
      case OrderStatus.DELIVERED: return 'Teslim Edildi';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      default: return 'Bilinmiyor';
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-800';
      case OrderStatus.READY: return 'bg-green-100 text-green-800';
      case OrderStatus.DELIVERING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-responsive">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Siparişlerim</h1>
                <p className="text-gray-600 mt-2">Geçmiş siparişlerinizi görüntüleyin ve takip edin</p>
              </div>
              <BackToHomeButton variant="minimal" />
            </div>
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü ({orders.length})
              </button>
              
              {Object.values(OrderStatus).map((status) => {
                const count = orders.filter(order => order.status === status).length;
                if (count === 0) return null;
                
                return (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filter === status 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {getStatusText(status)} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Siparişler */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <ClockIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'Henüz sipariş vermediniz' : `${getStatusText(filter as OrderStatus)} sipariş bulunamadı`}
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? 'İlk siparişinizi vermek için menümüze göz atın!' 
                  : 'Bu durumda sipariş bulunmuyor.'}
              </p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/menu')}
                  className="btn-primary"
                >
                  Menüye Git
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Sipariş #{order.id.slice(-8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-2">{getStatusText(order.status)}</span>
                        </span>
                      </div>
                      <p className="text-gray-600">
                        {format(order.createdAt, 'dd MMMM yyyy, HH:mm', { locale: tr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items.length} ürün
                      </p>
                    </div>
                  </div>

                  {/* Sipariş ürünleri */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex-1">
                            <span className="font-medium">{item.product.name}</span>
                            {item.variant && (
                              <span className="text-sm text-gray-500 ml-2">({item.variant.name})</span>
                            )}
                            <span className="text-gray-600 ml-2">x{item.quantity}</span>
                          </div>
                          <span className="font-medium">{formatCurrency((item.price || item.product.price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teslimat bilgisi */}
                  {order.deliveryAddress && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm font-medium text-gray-700">Teslimat Adresi:</p>
                      <p className="text-sm text-gray-600">
                        {order.deliveryAddress.street}, {order.deliveryAddress.district}, {order.deliveryAddress.city}
                      </p>
                    </div>
                  )}

                  {/* Özel talimatlar */}
                  {order.specialInstructions && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <p className="text-sm font-medium text-gray-700">Özel Talimatlar:</p>
                      <p className="text-sm text-gray-600">{order.specialInstructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 