# 📧 NeYisek.com E-posta Bildirim Sistemi Rehberi

## 📋 İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [E-posta Türleri](#e-posta-türleri)
3. [Teknik Altyapı](#teknik-altyapı)
4. [Kurulum](#kurulum)
5. [Mevcut Entegrasyonlar](#mevcut-entegrasyonlar)
6. [Kullanım Örnekleri](#kullanım-örnekleri)
7. [Sorun Giderme](#sorun-giderme)

## 🎯 Genel Bakış

NeYisek.com e-posta bildirim sistemi, kullanıcılara ve restoran sahiplerine önemli olaylar hakkında otomatik e-posta bildirimleri gönderen kapsamlı bir sistemdir.

## 📬 E-posta Türleri

### 1. 🎉 Hoş Geldin E-postası (WELCOME)
- **Tetiklenme:** Yeni kullanıcı kaydında otomatik
- **Hedef:** Yeni kayıt olan kullanıcılar
- **İçerik:** Hoş geldin mesajı, platform tanıtımı

### 2. 📦 Sipariş Onay E-postası (ORDER_CONFIRMATION)  
- **Tetiklenme:** Sipariş oluşturulduğunda otomatik
- **Hedef:** Sipariş veren müşteriler
- **İçerik:** Sipariş detayları, toplam tutar, tahmini teslimat süresi

### 3. 🚚 Sipariş Durumu Güncelleme (ORDER_STATUS_UPDATE)
- **Tetiklenme:** Sipariş durumu değiştiğinde otomatik
- **Hedef:** Sipariş sahibi müşteriler  
- **İçerik:** Güncel sipariş durumu, restoran bilgileri

### 4. 🏪 Restoran Başvuru Durumu (RESTAURANT_APPLICATION)
- **Tetiklenme:** Admin başvuru durumunu güncellediğinde
- **Hedef:** Başvuru yapan restoran sahipleri
- **İçerik:** Onay/Red durumu, admin mesajı

### 5. 💰 Mali Rapor E-postası (FINANCIAL_REPORT)
- **Tetiklenme:** Restoran panelinden manuel gönderim
- **Hedef:** Restoran sahipleri
- **İçerik:** Aylık gelir, komisyon, net kazanç detayları

### 6. 🔑 Şifre Sıfırlama (PASSWORD_RESET)
- **Tetiklenme:** Şifre sıfırlama talebinde
- **Hedef:** Şifresini unutmuş kullanıcılar
- **İçerik:** Şifre sıfırlama bağlantısı

## 🏗️ Teknik Altyapı

### Kullanılan Teknolojiler
- **Backend:** Node.js + Next.js API Routes
- **E-posta Servisi:** Nodemailer + Gmail SMTP
- **Template Engine:** React Email + HTML/CSS
- **TypeScript:** Tam tip güvenliği
- **Client Hook:** React useEmailService hook

### Dosya Yapısı
```
src/
├── services/
│   └── emailService.ts          # Ana e-posta servisi
├── hooks/
│   ├── useEmailService.ts       # Client-side hook
│   └── useAuth.ts              # Hoş geldin e-postası entegrasyonu
├── app/api/
│   └── send-email/route.ts     # API endpoint
├── types/
│   └── index.ts                # E-posta türleri ve interface'ler
└── services/
    ├── orderService.ts         # Sipariş e-posta entegrasyonları
    └── restaurantService.ts    # Restoran başvuru entegrasyonları
```

## ⚙️ Kurulum

### 1. Environment Variables (.env.local)
```bash
# Gmail SMTP Ayarları
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password

# Site Bilgileri  
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EMAIL_FROM_NAME=NeYisek.com
EMAIL_REPLY_TO=support@neyisek.com
```

### 2. Gmail 2FA Kurulumu
1. Gmail hesabında 2FA'yı etkinleştirin
2. Uygulama şifresi oluşturun
3. Bu şifreyi `EMAIL_PASSWORD` olarak kullanın

## 🔗 Mevcut Entegrasyonlar

### ✅ Tamamlanmış Entegrasyonlar

#### 1. 🎉 Kullanıcı Kaydı (useAuth.ts)
```typescript
// Otomatik hoş geldin e-postası
const signUp = async (email, password, displayName, phoneNumber) => {
  // Kullanıcı oluşturuldu
  // Hoş geldin e-postası API üzerinden gönderiliyor
};
```

#### 2. 📦 Sipariş Sistemi (orderService.ts)
```typescript
// Sipariş onay e-postası
static async createOrder(orderData) {
  // Sipariş oluşturuldu
  // Otomatik onay e-postası gönderiliyor
}

// Sipariş durumu güncelleme e-postası  
static async updateOrderStatus(orderId, status) {
  // Durum güncellendi
  // Müşteriye bildirim e-postası gönderiliyor
}
```

#### 3. 🏪 Restoran Başvuru Sistemi (restaurantService.ts)
```typescript
// Başvuru durumu e-postası
static async updateApplicationStatus(applicationId, status, adminId, adminNotes) {
  // Başvuru durumu güncellendi (onay/red)
  // Başvuru sahibine e-posta gönderiliyor
}
```

#### 4. 💰 Mali Rapor (restaurant/finances/page.tsx)
```typescript
// Manuel mali rapor gönderimi
const sendFinancialReportByEmail = async () => {
  // "E-posta ile Gönder" butonuna tıklanınca
  // Mali rapor e-postası gönderiliyor
};
```

#### 5. 🎛️ Admin Panel (admin/restaurants/page.tsx)
- Restoran başvurularını görüntüleme
- Başvuruları onaylama/reddetme
- Otomatik e-posta bildirimi ile durum güncelleme

## 🚀 Kullanım Örnekleri

### Server-Side Kullanım (API Route)
```typescript
import { EmailService } from '@/services/emailService';
import { EmailType } from '@/types';

// API route içinde
const emailData = {
  orderId: "12345",
  customerName: "Ahmet Yılmaz", 
  customerEmail: "ahmet@example.com",
  // ... diğer veriler
};

await EmailService.sendOrderConfirmationEmail(emailData);
```

### Client-Side Kullanım (React Hook)
```typescript
import { useEmailService } from '@/hooks/useEmailService';

const MyComponent = () => {
  const { sendOrderConfirmationEmail, loading } = useEmailService();
  
  const handleSendEmail = async () => {
    await sendOrderConfirmationEmail({
      orderId: "12345",
      // ... diğer veriler
    });
  };
};
```

### API Endpoint Kullanımı
```typescript
const response = await fetch('/api/send-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    emailType: EmailType.ORDER_CONFIRMATION,
    data: emailData
  })
});
```

## 🎨 E-posta Tasarım Özellikleri

### Modern ve Responsive Tasarım
- Mobil uyumlu responsive layout
- NeYisek.com marka renkleri ve logosu
- Profesyonel CSS styling
- Türkçe yerelleştirme

### Template Örnekleri
- **Hoş Geldin:** Karşılama mesajı + platform tanıtımı
- **Sipariş Onayı:** Sipariş detayları + teslimat bilgileri  
- **Durum Güncelleme:** Mevcut durum + takip bilgileri
- **Restoran Başvuru:** Onay/Red durumu + admin mesajı
- **Mali Rapor:** Gelir tablosu + komisyon detayları

## 🔧 Sorun Giderme

### Yaygın Hatalar ve Çözümleri

#### 1. "Module not found: Can't resolve 'fs'" Hatası
**Sebep:** Nodemailer client-side'da import ediliyor
**Çözüm:** EmailService'i sadece server-side kullanın, client-side'da API endpoint'i kullanın

#### 2. Gmail Authentication Hatası
**Sebep:** Yanlış uygulama şifresi veya 2FA etkin değil
**Çözüm:** 
- Gmail 2FA'yı etkinleştirin
- Yeni uygulama şifresi oluşturun
- .env.local dosyasını güncelleyin

#### 3. E-posta Gönderilmiyor
**Sebep:** Çevre değişkenleri eksik
**Çözüm:**
```bash
# .env.local kontrol edin
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### 4. Çok Fazla İstek Hatası
**Sebep:** Gmail günlük limiti aşıldı
**Çözüm:** 
- Production'da professional e-posta servisi kullanın
- SendGrid, AWS SES, Mailgun gibi alternatifler

## 📊 Performans ve Limitler

### Gmail SMTP Limitleri
- **Günlük:** 500 e-posta
- **Dakikalık:** 100 e-posta
- **Eş zamanlı:** 10 bağlantı

### Öneriler
- Production'da professional servis kullanın
- E-posta kuyruğu sistemi implement edin
- Retry mekanizması ekleyin
- Rate limiting uygulayın

## 🔮 Gelecek Roadmap

### Planlanan Özellikler
1. **SMS Bildirimleri** - Twilio entegrasyonu
2. **Push Notifications** - Web push API
3. **E-posta Analytics** - Açılma/tıklama oranları
4. **Template Editor** - Dinamik e-posta tasarımı
5. **Çok Dilli Destek** - İngilizce/Türkçe templates
6. **Advanced Personalization** - Kullanıcı tercihli içerik
7. **A/B Testing** - Template performans testleri

### Teknik İyileştirmeler
- Queue sistem (Bull/BullMQ)
- Redis cache entegrasyonu  
- Webhook notifications
- Real-time status tracking
- Advanced error handling

## 📞 Destek ve İletişim

### Geliştirici Desteği
- **E-posta:** dev@neyisek.com
- **Dokumentasyon:** `/docs/email-system`
- **GitHub Issues:** Repository issues bölümü

### Sistem Durumu
- **Health Check:** `/api/health/email`
- **Monitoring:** Application logs
- **Metrics:** E-posta başarı oranları

---

**Son Güncellenme:** Aralık 2024  
**Versiyon:** v2.0.0  
**Durum:** ✅ Production Ready

## 🎯 Özet - Tamamlanan E-posta Entegrasyonları

✅ **Hoş Geldin E-postası** - Kullanıcı kaydında otomatik  
✅ **Sipariş Onay E-postası** - Sipariş oluşturulduğunda  
✅ **Sipariş Durumu Güncelleme** - Durum değiştiğinde  
✅ **Restoran Başvuru Durumu** - Admin panel entegrasyonu  
✅ **Mali Rapor E-postası** - Restoran panelinden manuel  
✅ **Admin Panel** - Başvuru yönetimi ile e-posta entegrasyonu

Sistem tamamen hazır ve test edilmeye hazır! 🚀 