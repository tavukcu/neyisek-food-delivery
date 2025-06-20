import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Firebase Admin SDK'yı güvenli şekilde başlat
if (!admin.apps.length) {
  try {
    // Environment variables'ları kontrol et
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin SDK başlatıldı');
    } else {
      console.warn('Firebase Admin credentials eksik - bildirimler çalışmayacak');
    }
  } catch (error) {
    console.warn('Firebase Admin SDK başlatılamadı:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Firebase Admin SDK kontrolü
    if (!admin.apps.length) {
      return NextResponse.json(
        { error: 'Firebase Admin SDK yapılandırılmamış' },
        { status: 503 }
      );
    }

    const { type, userId, restaurantId, segment, data } = await request.json();

    // Bildirim mesajını oluştur
    let notification: any = {};
    let targetTokens: string[] = [];

    switch (type) {
      case 'order_update':
        notification = {
          title: 'Sipariş Güncellendi',
          body: `${data.restaurantName} restoranından siparişiniz ${getStatusText(data.status)}`,
          icon: '/icons/order-icon.png',
          badge: '/icons/badge-icon.png',
          data: {
            orderId: data.orderId,
            type: 'order_update',
            url: `/orders/${data.orderId}`
          }
        };
        targetTokens = await getUserTokens(userId);
        break;

      case 'new_order':
        notification = {
          title: 'Yeni Sipariş!',
          body: `${data.customerName} tarafından ${data.totalAmount} TL tutarında yeni sipariş`,
          icon: '/icons/restaurant-icon.png',
          badge: '/icons/badge-icon.png',
          data: {
            orderId: data.orderId,
            type: 'new_order',
            url: `/restaurant/orders/${data.orderId}`
          }
        };
        targetTokens = await getRestaurantTokens(restaurantId);
        break;

      case 'promotion':
        notification = {
          title: data.title,
          body: data.message,
          icon: '/icons/promotion-icon.png',
          badge: '/icons/badge-icon.png',
          image: data.imageUrl,
          data: {
            type: 'promotion',
            url: data.actionUrl || '/'
          }
        };
        
        if (data.userIds) {
          targetTokens = await getMultipleUserTokens(data.userIds);
        } else if (segment) {
          targetTokens = await getSegmentTokens(segment);
        }
        break;

      case 'delivery_update':
        notification = {
          title: 'Teslimat Güncellendi',
          body: data.driverName 
            ? `Siparişiniz ${data.driverName} tarafından teslim ediliyor`
            : 'Siparişiniz yola çıktı',
          icon: '/icons/delivery-icon.png',
          badge: '/icons/badge-icon.png',
          data: {
            orderId: data.orderId,
            type: 'delivery_update',
            url: `/orders/${data.orderId}/track`
          }
        };
        targetTokens = await getUserTokens(userId);
        break;

      case 'restaurant_application':
        notification = {
          title: 'Restoran Başvuru Sonucu',
          body: data.status === 'approved' 
            ? `${data.restaurantName} başvurunuz onaylandı!`
            : `${data.restaurantName} başvurunuz reddedildi`,
          icon: '/icons/restaurant-icon.png',
          badge: '/icons/badge-icon.png',
          data: {
            type: 'restaurant_application',
            status: data.status,
            url: data.status === 'approved' ? '/restaurant' : '/restaurant-apply'
          }
        };
        targetTokens = await getUserTokens(userId);
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz bildirim tipi' }, { status: 400 });
    }

    // Bildirimleri gönder
    if (targetTokens.length > 0) {
      // Her token için ayrı ayrı gönder (sendMulticast yerine)
      const promises = targetTokens.map(token => {
        const message = {
          notification,
          token,
          android: {
            notification: {
              sound: 'default',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK'
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default'
              }
            }
          },
          webpush: {
            notification: {
              ...notification,
              requireInteraction: true,
              actions: [
                {
                  action: 'view',
                  title: 'Görüntüle'
                }
              ]
            }
          }
        };

        return admin.messaging().send(message).catch((error: any) => {
          console.error('Token gönderme hatası:', token, error);
          return { success: false, token };
        });
      });

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && typeof result.value === 'string'
      ).length;
      const failureCount = results.length - successCount;

      // Başarısız token'ları temizle
      const failedTokens = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map((_, index) => targetTokens[index]);
      
      if (failedTokens.length > 0) {
        await removeInvalidTokens(failedTokens);
      }

      return NextResponse.json({
        success: true,
        successCount,
        failureCount
      });
    }

    return NextResponse.json({ success: true, message: 'Hedef kullanıcı bulunamadı' });

  } catch (error) {
    console.error('Bildirim gönderme hatası:', error);
    return NextResponse.json(
      { error: 'Bildirim gönderilemedi' },
      { status: 500 }
    );
  }
}

// Yardımcı fonksiyonlar
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'hazırlanıyor',
    'preparing': 'hazırlanıyor',
    'ready': 'hazır',
    'on_the_way': 'yolda',
    'delivered': 'teslim edildi',
    'cancelled': 'iptal edildi'
  };
  return statusMap[status] || status;
}

async function getUserTokens(userId: string): Promise<string[]> {
  try {
    const db = admin.firestore();
    const tokensSnapshot = await db
      .collection('fcm_tokens')
      .where('userId', '==', userId)
      .where('active', '==', true)
      .get();
    
    return tokensSnapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Kullanıcı token alma hatası:', error);
    return [];
  }
}

async function getRestaurantTokens(restaurantId: string): Promise<string[]> {
  try {
    const db = admin.firestore();
    
    // Restoran sahiplerinin user ID'lerini al
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) return [];
    
    const restaurantData = restaurantDoc.data();
    const ownerIds = [restaurantData?.ownerId].filter(Boolean);
    
    if (ownerIds.length === 0) return [];
    
    // Sahiplerin token'larını al
    const tokensSnapshot = await db
      .collection('fcm_tokens')
      .where('userId', 'in', ownerIds)
      .where('active', '==', true)
      .get();
    
    return tokensSnapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Restoran token alma hatası:', error);
    return [];
  }
}

async function getMultipleUserTokens(userIds: string[]): Promise<string[]> {
  try {
    const db = admin.firestore();
    const tokensSnapshot = await db
      .collection('fcm_tokens')
      .where('userId', 'in', userIds)
      .where('active', '==', true)
      .get();
    
    return tokensSnapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Çoklu kullanıcı token alma hatası:', error);
    return [];
  }
}

async function getSegmentTokens(segment: string): Promise<string[]> {
  try {
    const db = admin.firestore();
    
    // Segment'e göre kullanıcıları al
    let userQuery = db.collection('users');
    
    switch (segment) {
      case 'vip':
        userQuery = userQuery.where('totalSpent', '>=', 1000) as admin.firestore.CollectionReference;
        break;
      case 'loyal':
        userQuery = userQuery.where('totalOrders', '>=', 10) as admin.firestore.CollectionReference;
        break;
      case 'inactive':
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        userQuery = userQuery.where('lastOrderDate', '<', thirtyDaysAgo) as admin.firestore.CollectionReference;
        break;
      case 'all':
      default:
        // Tüm kullanıcılar
        break;
    }
    
    const usersSnapshot = await userQuery.get();
    const userIds = usersSnapshot.docs.map(doc => doc.id);
    
    if (userIds.length === 0) return [];
    
    // Kullanıcıların token'larını al
    const tokensSnapshot = await db
      .collection('fcm_tokens')
      .where('userId', 'in', userIds)
      .where('active', '==', true)
      .get();
    
    return tokensSnapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Segment token alma hatası:', error);
    return [];
  }
}

async function removeInvalidTokens(tokens: string[]): Promise<void> {
  try {
    const db = admin.firestore();
    const batch = db.batch();
    
    for (const token of tokens) {
      const tokenQuery = await db
        .collection('fcm_tokens')
        .where('token', '==', token)
        .get();
      
      tokenQuery.docs.forEach(doc => {
        batch.update(doc.ref, { active: false });
      });
    }
    
    await batch.commit();
    console.log('Geçersiz token\'lar temizlendi:', tokens.length);
  } catch (error) {
    console.error('Token temizleme hatası:', error);
  }
} 