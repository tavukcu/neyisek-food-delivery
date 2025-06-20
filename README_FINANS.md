# 🏦 NeYisek.com Finans Sistemi

## 💰 Komisyon Yapısı

### Komisyon Oranı
- **%9 sabit komisyon** tüm siparişlerden alınır
- Komisyon sadece **teslim edilen siparişlerden** tahsil edilir
- Her sipariş için otomatik hesaplama yapılır

### Hesaplama Örneği
```
Sipariş Tutarı: 100 TL
Komisyon (%9): 9 TL
Restoran Kazancı: 91 TL
Platform Kazancı: 9 TL
```

## 💳 Ödeme Yöntemleri

Sistemde 2 çeşit ödeme yöntemi bulunmaktadır:

### 1. Kapıda Nakit Ödeme (`CASH_ON_DELIVERY`)
- Müşteri siparişini kapıda nakit olarak öder
- Komisyon tahsil edilir (%9)
- Restoran nakit tahsil eder

### 2. Kapıda Kredi Kartı ile Ödeme (`CARD_ON_DELIVERY`)
- Müşteri siparişini kapıda kredi kartı ile öder
- Komisyon tahsil edilir (%9)
- Restoran POS cihazı ile tahsil eder

## 🏗️ Sistem Mimarisi

### 1. Komisyon Servisi (`CommissionService`)
```typescript
class CommissionService {
  // Komisyon hesaplama
  static calculateCommission(subtotal: number): CommissionCalculation

  // Mali işlem oluşturma
  static createTransaction(orderId, restaurantId, calculation, paymentMethod): Promise<string>

  // İşlem durumu güncelleme
  static updateTransactionStatus(transactionId, status): Promise<void>

  // Restoran mali raporları
  static calculateRestaurantFinancials(restaurantId, startDate, endDate): Promise<RestaurantFinancials>

  // Platform komisyon geliri
  static getPlatformCommissionRevenue(startDate, endDate): Promise<CommissionSummary>
}
```

### 2. Veri Yapıları

#### Komisyon Hesaplama (`CommissionCalculation`)
```typescript
interface CommissionCalculation {
  subtotal: number;           // Alt toplam
  commissionRate: number;     // Komisyon oranı (%9)
  commissionAmount: number;   // Komisyon tutarı
  restaurantEarning: number;  // Restoranın kazancı
  platformEarning: number;    // Platform kazancı
}
```

#### Mali İşlem (`Transaction`)
```typescript
interface Transaction {
  id: string;
  orderId: string;
  restaurantId: string;
  type: 'commission' | 'payment' | 'refund';
  amount: number;             // Toplam tutar
  commissionAmount: number;   // Komisyon tutarı
  platformAmount: number;     // Platform kazancı
  restaurantAmount: number;   // Restoran kazancı
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Restoran Mali Özeti (`RestaurantFinancials`)
```typescript
interface RestaurantFinancials {
  restaurantId: string;
  period: { startDate: Date; endDate: Date };
  totalRevenue: number;        // Toplam gelir
  totalCommission: number;     // Toplam komisyon
  netEarning: number;          // Net kazanç
  totalOrders: number;         // Toplam sipariş sayısı
  averageOrderValue: number;   // Ortalama sipariş değeri
  commissionRate: number;      // Komisyon oranı
  paymentMethodBreakdown: {
    cash: { count: number; amount: number; commission: number };
    card: { count: number; amount: number; commission: number };
  };
  dailyBreakdown: Array<{
    date: Date;
    revenue: number;
    commission: number;
    netEarning: number;
    orderCount: number;
  }>;
}
```

## 📊 Mali Dashboard

### Restoran Mali Dashboard (`/restaurant/finances`)

#### Özellikler:
- **Ana Metrikler**: Toplam gelir, net kazanç, komisyon, sipariş sayısı
- **Grafik Gösterimler**: Günlük gelir trendi, gelir dağılımı
- **Ödeme Yöntemi Analizi**: Nakit vs Kart dağılımı
- **İşlem Listesi**: Detaylı mali işlem geçmişi
- **Tarih Filtreleme**: Belirli dönem analizi

#### Görsel Elemanlar:
- Bar chart için günlük gelir ve net kazanç karşılaştırması
- Donut chart için komisyon dağılımı
- Tablo formatında işlem geçmişi
- KPI kartları ile önemli metriklerin vurgulanması

## 🔄 İş Akışı

### 1. Sipariş İş Akışı
```
1. Sipariş Oluşturma
   ↓
2. Komisyon Hesaplama (otomatik)
   ↓
3. Sipariş İşlemi
   ↓
4. Sipariş Teslimi
   ↓
5. Mali İşlem Oluşturma (otomatik)
   ↓
6. Komisyon Tahsili
```

### 2. Mali İşlem Durumları
- **pending**: İşlem beklemede
- **completed**: İşlem tamamlandı
- **failed**: İşlem başarısız

### 3. Otomatik İşlemler
- Sipariş oluşturulduğunda komisyon hesaplanır
- Sipariş teslim edildiğinde mali işlem otomatik oluşur
- İşlem durumu otomatik güncellenir

## 🔐 Güvenlik ve İzinler

### Firestore Güvenlik Kuralları
```javascript
// Mali İşlemler - Sadece admin ve ilgili restoran erişebilir
match /transactions/{transactionId} {
  allow read, write: if isAdmin();
  allow read: if isRestaurantOwner(resource.data.restaurantId);
}

// Mali Özetler - Sadece admin ve ilgili restoran erişebilir
match /restaurant_financials/{financialId} {
  allow read, write: if isAdmin();
  allow read: if isRestaurantOwner(resource.data.restaurantId);
}
```

### Erişim Kontrolleri
- **Admin**: Tüm mali verilere erişim
- **Restoran**: Sadece kendi mali verilerine erişim
- **Müşteri**: Mali verilere erişim yok

## 📈 Raporlama

### 1. Restoran Raporları
- Günlük, haftalık, aylık gelir raporları
- Ödeme yöntemi bazında analiz
- Komisyon ödemeleri takibi
- Ortalama sipariş değeri analizi

### 2. Platform Raporları (Admin)
- Toplam komisyon geliri
- Restoran bazında komisyon dağılımı
- Ödeme yöntemi performansı
- Platform büyüme metrikleri

### 3. Gerçek Zamanlı Takip
- Anlık gelir durumu
- Güncel komisyon hesaplamaları
- Canlı sipariş takibi
- Mali durum güncellemeleri

## 🔧 Teknik Özellikler

### Database İndeksleri
```json
{
  "transactions": [
    ["restaurantId", "createdAt"],
    ["status", "createdAt"],
    ["paymentMethod", "status", "createdAt"]
  ],
  "restaurant_financials": [
    ["restaurantId", "period.startDate"]
  ]
}
```

### API Endpoints
- `CommissionService.calculateCommission()`: Komisyon hesaplama
- `CommissionService.getRestaurantTransactions()`: İşlem geçmişi
- `CommissionService.calculateRestaurantFinancials()`: Mali özet
- `CommissionService.getPlatformCommissionRevenue()`: Platform geliri

### Performans Optimizasyonları
- Composite indeksler ile hızlı sorgular
- Sayfalama desteği
- Cache edilmiş mali özetler
- Batch işlemler ile verimli güncellemeler

## 📱 Kullanıcı Deneyimi

### Restoran Paneli
- Sade ve anlaşılır mali dashboard
- Interaktif grafikler
- Kolay tarih filtreleme
- Mobil uyumlu tasarım
- Türkçe para birimi formatı

### Admin Paneli
- Kapsamlı mali raporlar
- Platform geneli istatistikler
- Restoran bazında analiz
- Eksport özellikleri

## 🚀 Gelecek Geliştirmeler

### 1. Gelişmiş Raporlama
- PDF/Excel export
- Email ile otomatik raporlar
- Trend analizi
- Tahmin modelleri

### 2. Ödeme Entegrasyonları
- Online ödeme seçenekleri
- Otomatik komisyon kesintisi
- Çoklu ödeme yöntemi desteği

### 3. Mali Araçlar
- Fatura oluşturma
- Vergi hesaplamaları
- Muhasebe entegrasyonu
- Finansal planlama araçları

## ✅ Mevcut Durum

### Tamamlanan Özellikler
- ✅ %9 komisyon sistemi
- ✅ Kapıda ödeme yöntemleri (nakit/kart)
- ✅ Otomatik komisyon hesaplama
- ✅ Mali işlem takibi
- ✅ Restoran mali dashboard'u
- ✅ Güvenlik kuralları
- ✅ Database indeksleri
- ✅ Real-time güncellemeler

### Test Edilecek Özellikler
- ⏳ Mali dashboard grafiklerinin doğruluğu
- ⏳ Komisyon hesaplama testleri
- ⏳ Ödeme yöntemi entegrasyonu
- ⏳ Performans testleri

### Geliştirme Aşamasında
- 🔄 Admin mali dashboard'u
- 🔄 Gelişmiş raporlama
- 🔄 Export özellikleri

Bu finans sistemi, neyisek.com platformunda restoranlar ve platform arasındaki mali ilişkileri şeffaf ve otomatik bir şekilde yönetmek için tasarlanmıştır. Sistem, %9 komisyon oranı ile sürdürülebilir bir iş modeli sunar ve her iki taraf için de adaletli bir gelir paylaşımı sağlar. 