# 🗄️ NeYisek.com Veri Depolama Yapısı

## 📋 Genel Bakış

NeYisek.com restoran yönetim sisteminin veri depolama mimari yapısı ve stratejileri.

## 🔥 Firebase Firestore - Ana Veritabanı

### Koleksiyonlar ve Veri Yapıları

#### 1. 👥 **users** - Kullanıcı Verileri
```javascript
/users/{userId}
{
  uid: string,
  email: string,
  displayName: string,
  phoneNumber: string,
  address: {
    street: string,
    city: string,
    district: string,
    postalCode: string,
    coordinates: { lat: number, lng: number }
  },
  role: 'customer' | 'restaurant' | 'admin',
  isAdmin: boolean,
  restaurantId?: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. 🌐 **userPresence** - Kullanıcı Online Durumu
```javascript
/userPresence/{userId}
{
  userId: string,
  isOnline: boolean,
  lastSeen: Timestamp,
  userInfo: {
    displayName: string,
    email: string,
    role: string,
    isAdmin: boolean
  },
  updatedAt: Timestamp
}
```

#### 3. 🏪 **restaurants** - Restoran Bilgileri
```javascript
/restaurants/{restaurantId}
{
  id: string,
  name: string,
  description: string,
  address: Address,
  phone: string,
  email: string,
  workingHours: {
    monday: { open: "09:00", close: "22:00", isOpen: true },
    tuesday: { open: "09:00", close: "22:00", isOpen: true },
    // ... diğer günler
  },
  deliveryRadius: number, // km
  minimumOrderAmount: number,
  deliveryFee: number,
  isOpen: boolean,
  rating: number,
  reviewCount: number,
  logoUrl: string,
  bannerUrl: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 4. 🍕 **products** - Ürün Kataloğu
```javascript
/products/{productId}
{
  id: string,
  name: string,
  description: string,
  price: number,
  categoryId: string,
  restaurantId: string,
  imageUrl: string,
  images: ProductImage[],
  variants: ProductVariant[],
  ingredients: string[],
  allergens: string[],
  nutritionalInfo: {
    calories: number,
    protein: number,
    carbs: number,
    fat: number
  },
  isVegetarian: boolean,
  isVegan: boolean,
  isGlutenFree: boolean,
  preparationTime: number, // dakika
  isActive: boolean,
  stock: number,
  rating: number,
  reviewCount: number,
  isPopular: boolean,
  isFeatured: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 5. 📦 **orders** - Sipariş Verileri
```javascript
/orders/{orderId}
{
  id: string,
  userId: string,
  restaurantId: string,
  items: OrderItem[],
  subtotal: number,
  deliveryFee: number,
  total: number,
  commissionCalculation: {
    subtotal: number,
    commissionRate: number,
    commissionAmount: number,
    restaurantEarning: number,
    platformEarning: number
  },
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled',
  paymentMethod: 'cash' | 'card' | 'online',
  paymentStatus: 'pending' | 'paid' | 'failed',
  deliveryAddress: Address,
  customerNotes: string,
  estimatedDeliveryTime: Timestamp,
  actualDeliveryTime?: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 6. 💰 **transactions** - Mali İşlemler
```javascript
/transactions/{transactionId}
{
  id: string,
  orderId: string,
  restaurantId: string,
  type: 'commission' | 'payment' | 'refund',
  amount: number,
  commissionAmount: number,
  restaurantEarning: number,
  status: 'pending' | 'completed' | 'failed',
  paymentMethod: string,
  description: string,
  createdAt: Timestamp,
  processedAt?: Timestamp
}
```

#### 7. 📊 **restaurant_financials** - Mali Özetler
```javascript
/restaurant_financials/{financialId}
{
  restaurantId: string,
  period: {
    startDate: Timestamp,
    endDate: Timestamp,
    type: 'daily' | 'weekly' | 'monthly'
  },
  metrics: {
    totalOrders: number,
    totalRevenue: number,
    totalCommission: number,
    netEarnings: number,
    averageOrderValue: number
  },
  paymentBreakdown: {
    cash: number,
    card: number,
    online: number
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 8. 🏷️ **categories** - Ürün Kategorileri
```javascript
/categories/{categoryId}
{
  id: string,
  name: string,
  description: string,
  iconUrl: string,
  isActive: boolean,
  sortOrder: number,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 9. ⭐ **reviews** - Değerlendirmeler
```javascript
/reviews/{reviewId}
{
  id: string,
  userId: string,
  restaurantId: string,
  productId?: string,
  orderId: string,
  rating: number, // 1-5
  comment: string,
  images?: string[],
  response?: {
    text: string,
    respondedAt: Timestamp,
    respondedBy: string
  },
  isVerified: boolean,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 10. 📈 **analytics** - Analitik Verileri
```javascript
/analytics/{date}/{metric}
{
  date: string, // YYYY-MM-DD
  restaurantId?: string,
  metric: string,
  value: number,
  data: any,
  createdAt: Timestamp
}
```

## 🗂️ Firebase Storage - Dosya Depolama

### Klasör Yapısı:
```
/storage/
├── users/
│   └── {userId}/
│       ├── profile.jpg
│       └── documents/
├── restaurants/
│   └── {restaurantId}/
│       ├── logo.jpg
│       ├── banner.jpg
│       └── gallery/
├── products/
│   └── {productId}/
│       ├── main.jpg
│       └── variants/
└── categories/
    └── {categoryId}/
        └── icon.png
```

## ⚡ Performans Optimizasyonları

### 1. Firestore İndeksleri
```json
{
  "indexes": [
    {
      "collectionGroup": "products",
      "fields": [
        { "fieldPath": "categoryId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "orders",
      "fields": [
        { "fieldPath": "restaurantId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "userPresence",
      "fields": [
        { "fieldPath": "isOnline", "order": "ASCENDING" },
        { "fieldPath": "lastSeen", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### 2. Caching Stratejisi
- **Client-side caching**: React Query / SWR
- **Firebase offline**: Otomatik offline sync
- **CDN**: Firebase Hosting ile static dosyalar

## 🔐 Güvenlik Kuralları

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar - Kendi verilerine erişim
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if isAdmin();
    }
    
    // Siparişler - Kullanıcı/Restoran/Admin erişimi
    match /orders/{orderId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
      allow read, write: if isAdmin();
      allow read, update: if isRestaurantOwner(resource.data.restaurantId);
    }
    
    // Mali işlemler - Sadece admin ve ilgili restoran
    match /transactions/{transactionId} {
      allow read, write: if isAdmin();
      allow read: if isRestaurantOwner(resource.data.restaurantId);
    }
  }
}
```

## 📊 Veri Yönetimi Servisleri

### Servis Sınıfları:
- **UserService**: Kullanıcı işlemleri
- **UserPresenceService**: Online durum yönetimi
- **RestaurantService**: Restoran işlemleri
- **ProductService**: Ürün kataloğu yönetimi
- **OrderService**: Sipariş işlemleri
- **CommissionService**: Komisyon ve mali işlemler
- **AnalyticsService**: Analitik veri toplama

## 🚀 Gelecek Planları

### 1. Veri Büyümesi için Hazırlık
- **Partitioning**: Büyük koleksiyonlar için bölümleme
- **Archiving**: Eski verilerin arşivlenmesi
- **Data Warehouse**: BigQuery entegrasyonu

### 2. Performans İyileştirmeleri
- **Read Replicas**: Okuma performansı
- **Batch Operations**: Toplu işlemler
- **Background Jobs**: Arka plan görevleri

### 3. Backup ve Disaster Recovery
- **Automated Backups**: Otomatik yedekleme
- **Cross-region Replication**: Çapraz bölge replikasyonu
- **Data Export**: Veri dışa aktarma araçları

## 💾 Veri Saklama Maliyetleri

### Firebase Firestore Fiyatlandırması:
- **Okuma**: $0.06 per 100K reads
- **Yazma**: $0.18 per 100K writes
- **Silme**: $0.02 per 100K deletes
- **Depolama**: $0.18 per GB/month

### Tahmini Aylık Maliyetler:
- **Küçük işletme** (10K sipariş/ay): ~$50-100
- **Orta işletme** (100K sipariş/ay): ~$200-500
- **Büyük işletme** (1M sipariş/ay): ~$1000-2000

## 🔧 Yönetim Araçları

### 1. Firebase Console
- Gerçek zamanlı veri görüntüleme
- Güvenlik kuralları yönetimi
- Performans monitoring

### 2. Admin Paneli
- Veri analitikleri
- Kullanıcı yönetimi
- Sipariş takibi
- Mali raporlar

### 3. Geliştirici Araçları
- Firebase Emulator Suite
- Local development environment
- Testing utilities

Bu veri yapısı sisteminizin tüm ihtiyaçlarını karşılayacak şekilde tasarlanmıştır ve kolayca ölçeklenebilir! 🚀 