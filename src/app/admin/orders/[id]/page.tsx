'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Order, OrderStatus, PaymentMethod } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft,
  Clock, 
  CheckCircle,
  XCircle,
  Truck,
  Package,
  AlertTriangle,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  User,
  ChefHat,
  Timer,
  Edit,
  CreditCard,
  Banknote,
  Globe,
  FileText,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Sipariş verilerini yükle
  useEffect(() => {
    if (user && user.isAdmin && params.id) {
      loadOrder();
    }
  }, [user, params.id]);

  // Sipariş verilerini yükle
  const loadOrder = async () => {
    setIsLoading(true);
    
    try {
      const orderDoc = await getDoc(doc(db, 'orders', params.id as string));
      
      if (orderDoc.exists()) {
        const data = orderDoc.data();
        const orderData: Order = {
          id: orderDoc.id,
          userId: data.userId,
          user: data.user,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          deliveryFee: data.deliveryFee || 0,
          total: data.total || 0,
          status: data.status || OrderStatus.PENDING,
          paymentMethod: data.paymentMethod || PaymentMethod.CASH,
          deliveryAddress: data.deliveryAddress,
          estimatedDeliveryTime: data.estimatedDeliveryTime?.toDate() || new Date(),
          actualDeliveryTime: data.actualDeliveryTime?.toDate(),
          specialInstructions: data.specialInstructions || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
        
        setOrder(orderData);
      } else {
        toast.error('Sipariş bulunamadı');
        router.push('/admin/orders');
      }
    } catch (error) {
      console.error('Sipariş yüklenirken hata:', error);
      toast.error('Sipariş yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Sipariş durumunu güncelle
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!order) return;
    
    setIsUpdating(true);
    
    try {
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };

      // Eğer teslim edildi durumuna geçiyorsa, gerçek teslimat zamanını ekle
      if (newStatus === OrderStatus.DELIVERED) {
        updateData.actualDeliveryTime = new Date();
      }

      await updateDoc(doc(db, 'orders', order.id), updateData);
      
      // Local state'i güncelle
      setOrder(prev => prev ? {
        ...prev,
        status: newStatus,
        actualDeliveryTime: newStatus === OrderStatus.DELIVERED ? new Date() : prev.actualDeliveryTime,
        updatedAt: new Date()
      } : null);
      
      toast.success(`Sipariş durumu "${getStatusText(newStatus)}" olarak güncellendi`);
    } catch (error) {
      console.error('Sipariş durumu güncellenirken hata:', error);
      toast.error('Sipariş durumu güncellenirken bir hata oluştu');
    } finally {
      setIsUpdating(false);
    }
  };

  // Durum metni
  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'Bekliyor';
      case OrderStatus.CONFIRMED: return 'Onaylandı';
      case OrderStatus.PREPARING: return 'Hazırlanıyor';
      case OrderStatus.READY: return 'Hazır';
      case OrderStatus.DELIVERING: return 'Yolda';
      case OrderStatus.DELIVERED: return 'Teslim Edildi';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      default: return status;
    }
  };

  // Durum rengi
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case OrderStatus.CONFIRMED: return 'bg-blue-100 text-blue-800 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-orange-100 text-orange-800 border-orange-200';
      case OrderStatus.READY: return 'bg-purple-100 text-purple-800 border-purple-200';
      case OrderStatus.DELIVERING: return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800 border-green-200';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Durum ikonu
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock className="h-5 w-5" />;
      case OrderStatus.CONFIRMED: return <CheckCircle className="h-5 w-5" />;
      case OrderStatus.PREPARING: return <ChefHat className="h-5 w-5" />;
      case OrderStatus.READY: return <Package className="h-5 w-5" />;
      case OrderStatus.DELIVERING: return <Truck className="h-5 w-5" />;
      case OrderStatus.DELIVERED: return <CheckCircle className="h-5 w-5" />;
      case OrderStatus.CANCELLED: return <XCircle className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  // Ödeme yöntemi metni ve ikonu
  const getPaymentMethodInfo = (method: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.CASH: 
        return { text: 'Kapıda Nakit Ödeme', icon: <Banknote className="h-5 w-5" /> };
      case PaymentMethod.CREDIT_CARD: 
        return { text: 'Kapıda Kart ile Ödeme', icon: <CreditCard className="h-5 w-5" /> };
      case PaymentMethod.ONLINE: 
        return { text: 'Online Ödeme', icon: <Globe className="h-5 w-5" /> };
      default: 
        return { text: method, icon: <DollarSign className="h-5 w-5" /> };
    }
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Sipariş detayları yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Yetkisiz erişim
  if (!user || !user.isAdmin) {
    return null;
  }

  // Sipariş bulunamadı
  if (!order) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sipariş Bulunamadı</h2>
            <p className="text-gray-600 mb-4">Aradığınız sipariş mevcut değil.</p>
            <Link href="/admin/orders" className="btn-primary">
              Siparişlere Dön
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const paymentInfo = getPaymentMethodInfo(order.paymentMethod);

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Sayfa İçeriği */}
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Başlık ve Geri Dön */}
          <div className="flex items-center gap-4 mb-8">
            <Link 
              href="/admin/orders"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sipariş #{order.id.slice(-8).toUpperCase()}
              </h1>
              <p className="text-gray-600">
                {order.createdAt.toLocaleDateString('tr-TR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })} tarihinde verildi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sol Kolon - Sipariş Detayları */}
            <div className="lg:col-span-2 space-y-6">
              {/* Durum ve Aksiyon Kartı */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-medium border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-600">₺{order.total.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">{order.items.length} ürün</p>
                  </div>
                </div>

                {/* Durum Güncelleme Butonları */}
                {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                  <div className="flex flex-wrap gap-3">
                    {order.status === OrderStatus.PENDING && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(OrderStatus.CONFIRMED)}
                          disabled={isUpdating}
                          className="btn-primary flex items-center gap-2"
                        >
                          {isUpdating ? (
                            <div className="spinner-sm"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Siparişi Onayla
                        </button>
                        <button
                          onClick={() => updateOrderStatus(OrderStatus.CANCELLED)}
                          disabled={isUpdating}
                          className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          İptal Et
                        </button>
                      </>
                    )}
                    
                    {order.status === OrderStatus.CONFIRMED && (
                      <button
                        onClick={() => updateOrderStatus(OrderStatus.PREPARING)}
                        disabled={isUpdating}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isUpdating ? (
                          <div className="spinner-sm"></div>
                        ) : (
                          <ChefHat className="h-4 w-4" />
                        )}
                        Hazırlamaya Başla
                      </button>
                    )}
                    
                    {order.status === OrderStatus.PREPARING && (
                      <button
                        onClick={() => updateOrderStatus(OrderStatus.READY)}
                        disabled={isUpdating}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isUpdating ? (
                          <div className="spinner-sm"></div>
                        ) : (
                          <Package className="h-4 w-4" />
                        )}
                        Sipariş Hazır
                      </button>
                    )}
                    
                    {order.status === OrderStatus.READY && (
                      <button
                        onClick={() => updateOrderStatus(OrderStatus.DELIVERING)}
                        disabled={isUpdating}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isUpdating ? (
                          <div className="spinner-sm"></div>
                        ) : (
                          <Truck className="h-4 w-4" />
                        )}
                        Teslimat Başladı
                      </button>
                    )}
                    
                    {order.status === OrderStatus.DELIVERING && (
                      <button
                        onClick={() => updateOrderStatus(OrderStatus.DELIVERED)}
                        disabled={isUpdating}
                        className="btn-primary flex items-center gap-2"
                      >
                        {isUpdating ? (
                          <div className="spinner-sm"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Teslim Edildi
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Sipariş Ürünleri */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Sipariş Ürünleri
                </h2>
                
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      {/* Ürün Resmi */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Ürün Bilgileri */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-600">Boyut: {item.variant.name}</p>
                        )}
                        <p className="text-sm text-gray-600">Adet: {item.quantity}</p>
                        {item.specialInstructions && (
                          <p className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded mt-1">
                            {item.specialInstructions}
                          </p>
                        )}
                      </div>

                      {/* Fiyat */}
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₺{((item.variant?.price || item.product.price) * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">
                          ₺{(item.variant?.price || item.product.price).toFixed(2)} x {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fiyat Özeti */}
                <div className="border-t border-gray-200 mt-6 pt-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam:</span>
                    <span>₺{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Teslimat Ücreti:</span>
                    <span>{order.deliveryFee === 0 ? 'Ücretsiz' : `₺${order.deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-3">
                    <span>Toplam:</span>
                    <span className="text-primary-600">₺{order.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Özel Talimatlar */}
              {order.specialInstructions && (
                <div className="card p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Özel Talimatlar
                  </h2>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800">{order.specialInstructions}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Kolon - Müşteri ve Teslimat Bilgileri */}
            <div className="space-y-6">
              {/* Müşteri Bilgileri */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Müşteri Bilgileri
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{order.user.displayName}</p>
                      <p className="text-sm text-gray-600">{order.user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{order.user.phoneNumber}</p>
                      <p className="text-sm text-gray-600">Telefon numarası</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Teslimat Bilgileri */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Teslimat Bilgileri
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Teslimat Adresi</p>
                      <p className="text-sm text-gray-600">
                        {order.deliveryAddress.street}
                        <br />
                        {order.deliveryAddress.district}, {order.deliveryAddress.city}
                        <br />
                        {order.deliveryAddress.zipCode}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Timer className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Tahmini Teslimat</p>
                      <p className="text-sm text-gray-600">
                        {order.estimatedDeliveryTime.toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {order.actualDeliveryTime && (
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">Gerçek Teslimat</p>
                        <p className="text-sm text-gray-600">
                          {order.actualDeliveryTime.toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ödeme Bilgileri */}
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Ödeme Bilgileri
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {paymentInfo.icon}
                    <div>
                      <p className="font-medium text-gray-900">{paymentInfo.text}</p>
                      <p className="text-sm text-gray-600">Ödeme yöntemi</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Sipariş Tarihi</p>
                      <p className="text-sm text-gray-600">
                        {order.createdAt.toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Edit className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Son Güncelleme</p>
                      <p className="text-sm text-gray-600">
                        {order.updatedAt.toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 