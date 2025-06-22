import { NextResponse } from 'next/server';
import { OrderService } from '@/services/orderService';
import { OrderStatus } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📦 Sipariş API: Yeni sipariş oluşturuluyor:', body);

    const {
      restaurantId,
      items,
      customerInfo,
      deliveryAddress,
      paymentMethod,
      notes,
      totalAmount
    } = body;

    // Gerekli alanları kontrol et
    if (!restaurantId || !items || items.length === 0 || !customerInfo || !totalAmount) {
      console.error('📦 Sipariş API: Eksik bilgiler');
      return NextResponse.json({
        success: false,
        error: 'Eksik sipariş bilgileri'
      }, { status: 400 });
    }

    // Guest user için özel ID oluştur
    const userId = customerInfo.isGuest && !customerInfo.userId.startsWith('guest_') 
      ? `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      : customerInfo.userId;

    // Sipariş verilerini Order tipine uygun şekilde hazırla
    const orderData = {
      userId,
      user: {
        uid: userId,
        displayName: customerInfo.name,
        email: customerInfo.email || '',
        phoneNumber: customerInfo.phone,
        role: 'customer' as const,
        isActive: true,
        createdAt: new Date(),
        // Guest user flag'i ekle
        isGuest: customerInfo.isGuest || false
      },
      restaurantId,
      items: items.map((item: any) => ({
        productId: item.product.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          categoryId: item.product.categoryId,
          imageUrl: item.product.imageUrl,
          restaurantId: restaurantId
        },
        quantity: item.quantity,
        price: item.product.price,
        specialInstructions: item.notes || ''
      })),
      status: OrderStatus.PENDING,
      deliveryAddress: deliveryAddress || {
        street: 'Restoran içi servis',
        city: 'Manisa',
        district: 'Merkez',
        zipCode: '45000',
        country: 'Türkiye',
        coordinates: { lat: 38.7312, lng: 27.4288 }
      },
      paymentMethod: paymentMethod || 'cash_on_delivery',
      specialInstructions: notes || '',
      subtotal: totalAmount,
      deliveryFee: 0,
      total: totalAmount,
      createdAt: new Date(),
      estimatedDeliveryTime: new Date(Date.now() + 30 * 60000), // 30 dakika
      // Guest order metadata
      metadata: customerInfo.isGuest ? {
        orderType: 'guest',
        guestEmail: customerInfo.email,
        guestPhone: customerInfo.phone,
        sessionId: userId.includes('guest_') ? userId : undefined
      } : undefined
    };

    console.log('📦 Sipariş API: Hazırlanan sipariş verisi:', {
      userId,
      isGuest: customerInfo.isGuest,
      customerName: customerInfo.name,
      itemCount: items.length,
      total: totalAmount
    });

    // OrderService ile siparişi oluştur
    const orderId = await OrderService.createOrder(orderData);

    console.log('📦 Sipariş API: Sipariş başarıyla oluşturuldu:', orderId);

    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      orderId,
      message: customerInfo.isGuest 
        ? 'Misafir siparişiniz başarıyla alındı!' 
        : 'Siparişiniz başarıyla alındı!',
      orderData: {
        id: orderId,
        status: OrderStatus.PENDING,
        total: totalAmount,
        isGuest: customerInfo.isGuest || false
      }
    });

  } catch (error) {
    console.error('📦 Sipariş API: Hata:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Sipariş oluşturulurken bir hata oluştu'
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const restaurantId = searchParams.get('restaurantId');

    if (userId) {
      // Kullanıcının siparişlerini getir
      const orders = await OrderService.getUserOrders(userId);
      return NextResponse.json({ success: true, orders });
    } else if (restaurantId) {
      // Restoranın siparişlerini getir
      const orders = await OrderService.getRestaurantOrders(restaurantId);
      return NextResponse.json({ success: true, orders });
    } else {
      return NextResponse.json({
        success: false,
        error: 'userId veya restaurantId gerekli'
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error('📦 Sipariş listeleme hatası:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 