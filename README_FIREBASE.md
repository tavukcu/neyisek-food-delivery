# 🔥 Firebase Backend Entegrasyonu

## 📋 Genel Bakış

Bu dokümantasyon, NeYisek.com restoran yönetim sistemi için Firebase backend entegrasyonunu açıklamaktadır.

## 🏗️ Mimari Yapı

### Firebase Servisleri
- **Authentication**: Kullanıcı kimlik doğrulama
- **Firestore**: NoSQL veritabanı
- **Storage**: Dosya depolama (resimler)
- **Analytics**: Kullanım analitikleri

### Koleksiyonlar

#### 1. Users (`/users/{userId}`)
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  address?: Address;
  role: 'customer' | 'restaurant' | 'admin';
  isAdmin: boolean;
  restaurantId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Restaurants (`/restaurants/{restaurantId}`)
```typescript
interface RestaurantInfo {
  id: string;
  name: string;
  description: string;
  address: Address;
  phone: string;
  email: string;
  workingHours: { [key: string]: { open: string; close: string; isOpen: boolean } };
  deliveryRadius: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  isOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3. Products (`/products/{productId}`)
```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  images: ProductImage[];
  variants: ProductVariant[];
  ingredients: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  preparationTime: number;
  isActive: boolean;
  stock: number;
  rating: number;
  reviewCount: number;
  isPopular: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4. Orders (`/orders/{orderId}`)
```typescript
interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🔧 Servis Sınıfları

### UserService
```typescript
// Kullanıcı oluşturma
await UserService.createUser(uid, userData);

// Kullanıcı getirme
const user = await UserService.getUser(uid);

// Kullanıcı güncelleme
await UserService.updateUser(uid, updates);

// Rol bazında kullanıcı getirme
const restaurants = await UserService.getUsersByRole('restaurant');
```

### ProductService
```typescript
// Ürün oluşturma
const productId = await ProductService.createProduct(productData);

// Kategoriye göre ürün getirme
const products = await ProductService.getProductsByCategory(categoryId);

// Ürün güncelleme
await ProductService.updateProduct(productId, updates);

// Real-time ürün dinleme
const unsubscribe = ProductService.subscribeToProducts(categoryId, callback);
```

### OrderService
```typescript
// Sipariş oluşturma
const orderId = await OrderService.createOrder(orderData);

// Sipariş durumu güncelleme
await OrderService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

// Real-time sipariş dinleme
const unsubscribe = OrderService.subscribeToUserOrders(userId, callback);
```

### StorageService
```typescript
// Ürün resmi yükleme
const imageUrl = await StorageService.uploadProductImage(
  file, 
  productId,
  (progress) => console.log(progress.progress)
);

// Restoran resmi yükleme
const logoUrl = await StorageService.uploadRestaurantImage(
  file, 
  restaurantId, 
  'logo'
);

// Dosya doğrulama
const validation = StorageService.validateFile(file, 5); // 5MB max
```

## 🎣 React Hook'ları

### useProducts
```typescript
const { products, loading, error } = useProducts(categoryId);
```

### useUserOrders
```typescript
const { orders, loading, error } = useUserOrders(userId);
```

### useCategories
```typescript
const { categories, loading, error } = useCategories();
```

### useFirebaseConnection
```typescript
const { isConnected, isOnline } = useFirebaseConnection();
```

## 🔐 Güvenlik Kuralları

### Firestore Rules
- Kullanıcılar kendi verilerini yönetebilir
- Admin tüm verilere erişebilir
- Restoran sahipleri kendi restoran verilerini yönetebilir
- Ürünler herkese açık (aktif olanlar)
- Siparişler sadece ilgili kullanıcılar tarafından görülebilir

### Storage Rules
- Kullanıcılar kendi resimlerini yükleyebilir
- Ürün resimleri herkese açık
- Dosya boyutu: 5MB (ürün), 10MB (restoran)
- Sadece resim formatları kabul edilir

## 🚀 Deployment

### 1. Firebase CLI Kurulumu
```bash
npm install -g firebase-tools
firebase login
```

### 2. Firebase Projesi Başlatma
```bash
firebase init
```

### 3. Güvenlik Kurallarını Deploy Etme
```bash
firebase deploy --only firestore:rules,storage:rules
```

### 4. Index'leri Deploy Etme
```bash
firebase deploy --only firestore:indexes
```

## 📊 Performans Optimizasyonları

### 1. Firestore
- Composite index'ler kullanılıyor
- Sayfalama (pagination) implementasyonu
- Real-time dinleme için optimize edilmiş query'ler
- Batch işlemler için özel hook'lar

### 2. Storage
- Resim sıkıştırma
- Progress tracking
- Paralel yükleme
- Otomatik format doğrulama

### 3. Caching
- React Query ile cache yönetimi (eklenebilir)
- Service Worker ile offline support (eklenebilir)

## 🔍 Monitoring ve Analytics

### Firebase Analytics Events
```typescript
// Ürün görüntüleme
analytics.logEvent('view_item', {
  item_id: productId,
  item_name: productName,
  item_category: categoryName
});

// Sipariş tamamlama
analytics.logEvent('purchase', {
  transaction_id: orderId,
  value: orderTotal,
  currency: 'TRY'
});
```

### Error Monitoring
```typescript
// Hata loglama
console.error('Firebase error:', error);
analytics.logEvent('exception', {
  description: error.message,
  fatal: false
});
```

## 🧪 Test Stratejisi

### Unit Tests
- Service sınıfları için mock Firebase
- Hook'lar için React Testing Library
- Utility fonksiyonları için Jest

### Integration Tests
- Firebase Emulator kullanımı
- E2E testler için Cypress

### Emulator Kullanımı
```bash
firebase emulators:start --only firestore,auth,storage
```

## 📈 Ölçeklenebilirlik

### Horizontal Scaling
- Firestore otomatik ölçeklenir
- Storage otomatik ölçeklenir
- Cloud Functions eklenebilir

### Vertical Scaling
- Index optimizasyonları
- Query optimizasyonları
- Batch operations

## 🔧 Geliştirme Ortamı

### Environment Variables
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
```

### Development vs Production
- Farklı Firebase projeleri
- Farklı güvenlik kuralları
- Test verileri için seed scripts

## 🐛 Debugging

### Firestore Debug
```typescript
// Debug mode
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Network durumunu kontrol et
await disableNetwork(db);
await enableNetwork(db);
```

### Storage Debug
```typescript
// Upload durumunu izle
uploadTask.on('state_changed', 
  (snapshot) => {
    console.log('Progress:', snapshot.bytesTransferred / snapshot.totalBytes);
  },
  (error) => {
    console.error('Upload error:', error);
  }
);
```

## 📚 Kaynaklar

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Firebase Analytics](https://firebase.google.com/docs/analytics)

## 🆘 Sorun Giderme

### Yaygın Hatalar

1. **Permission Denied**
   - Güvenlik kurallarını kontrol edin
   - Kullanıcı authentication durumunu kontrol edin

2. **Network Error**
   - İnternet bağlantısını kontrol edin
   - Firebase servis durumunu kontrol edin

3. **Storage Upload Failed**
   - Dosya boyutunu kontrol edin
   - Dosya formatını kontrol edin
   - Güvenlik kurallarını kontrol edin

### Support
Firebase Console'da logs bölümünden detaylı hata mesajları görülebilir. 