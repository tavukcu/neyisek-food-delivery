# 📄 PDF Rapor Sistemi Kullanım Kılavuzu

## 🎯 Genel Bakış

NeYisek.com platformunda admin ve restoranlar için kapsamlı PDF rapor sistemi eklendi. Bu sistem, işletme verilerini profesyonel PDF formatında indirmenizi sağlar.

## 📋 Mevcut Rapor Türleri

### 1. 👥 **Kullanıcı Yönetimi Raporu** (Admin)
**Lokasyon:** `/admin/users`
**Butonu:** "PDF Rapor İndir"

**İçerik:**
- ✅ Toplam kullanıcı sayısı
- ✅ Online kullanıcı sayısı  
- ✅ Bu ay yeni kullanıcılar
- ✅ Rol bazı dağılım (Müşteri, Restoran, Admin)
- ✅ Detaylı kullanıcı listesi
- ✅ Online/offline durumları
- ✅ Son görülme zamanları
- ✅ Kayıt tarihleri

**Dosya Adı:** `kullanici-raporu-YYYY-MM-DD.pdf`

### 2. 💰 **Mali Rapor** (Restoran)
**Lokasyon:** `/restaurant/finances`
**Butonu:** "Mali Rapor İndir (PDF)"

**İçerik:**
- ✅ Toplam gelir
- ✅ Sipariş sayısı
- ✅ Ortalama sipariş değeri
- ✅ Platform komisyonu
- ✅ Net kazanç
- ✅ Sipariş detayları
- ✅ Günlük istatistikler
- ✅ Tarih aralığı bazında filtreleme

**Dosya Adı:** `[restoran-adi]-mali-rapor-YYYY-MM-DD.pdf`

### 3. 📊 **Admin Dashboard Raporu** (Admin)
**Lokasyon:** `/admin`
**Butonu:** "Dashboard Raporu (PDF)"

**İçerik:**
- ✅ Platform geneli istatistikler
- ✅ Toplam kullanıcı, restoran, sipariş
- ✅ Toplam gelir ve komisyon
- ✅ En iyi performans gösteren restoranlar
- ✅ Aylık büyüme istatistikleri

**Dosya Adı:** `admin-dashboard-raporu-YYYY-MM-DD.pdf`

## 🚀 Kullanım Talimatları

### Admin Kullanıcıları İçin:

1. **Kullanıcı Raporu:**
   - Admin paneline giriş yapın
   - "Kullanıcı Yönetimi" sayfasına gidin
   - Filtreleri ayarlayın (rol, durum, arama)
   - "PDF Rapor İndir" butonuna tıklayın
   - PDF otomatik olarak bilgisayarınıza indirilir

2. **Dashboard Raporu:**
   - Admin ana sayfasında
   - Sağ üst köşedeki "Dashboard Raporu (PDF)" butonuna tıklayın
   - Platform geneli rapor otomatik indirilir

### Restoran Sahipleri İçin:

1. **Mali Rapor:**
   - Restoran paneline giriş yapın
   - "Mali Durum" sayfasına gidin
   - Tarih aralığını seçin
   - "Mali Rapor İndir (PDF)" butonuna tıklayın
   - Seçilen döneme ait mali rapor indirilir

## 🎨 PDF Rapor Özellikleri

### Tasarım ve Format:
- ✅ **Professional Layout** - Temiz ve profesyonel tasarım
- ✅ **Türkçe Dil Desteği** - Tam Türkçe tarih ve metinler
- ✅ **NeYisek.com Markası** - Logo ve marka kimliği
- ✅ **Renk Kodlamalı Tablolar** - Kolay okuma için renkli başlıklar
- ✅ **Otomatik Sayfa Numaralandırma** - Çok sayfalı raporlar için

### Veri Özellikleri:
- ✅ **Real-time Veriler** - Anlık güncel veriler
- ✅ **Filtrelenmiş Sonuçlar** - Sadece seçilen filtreler dahil
- ✅ **Tarih Bazlı Filtreleme** - Belirli tarih aralıkları
- ✅ **Türkçe Para Formatı** - ₺ sembolü ile TL formatında
- ✅ **Lokalize Tarihler** - Türkçe tarih formatları

## 🔧 Teknik Detaylar

### Kullanılan Teknolojiler:
- **jsPDF** - PDF oluşturma engine
- **jsPDF-autotable** - Profesyonel tablo formatları
- **date-fns** - Tarih formatları ve Türkçe yerelleştirme
- **React/TypeScript** - Type-safe geliştirme

### Dosya Boyutları:
- Kullanıcı Raporu: ~200-500 KB (kullanıcı sayısına bağlı)
- Mali Rapor: ~150-300 KB (sipariş sayısına bağlı)
- Dashboard Raporu: ~100-200 KB

### Browser Uyumluluğu:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📈 Gelecek Özellikler (Roadmap)

### Planlanan Ek Raporlar:
- 📊 **Sipariş Detay Raporu** - Tüm siparişlerin detaylı analizi
- 📈 **Müşteri Analiz Raporu** - Müşteri davranış analizi
- 🍕 **Ürün Performans Raporu** - En çok satan ürünler
- 📅 **Haftalık/Aylık Özet Raporları** - Otomatik periyodik raporlar
- 📧 **Email ile Otomatik Gönderim** - Belirli aralıklarla email

### Gelişmiş Özellikler:
- 📊 **Grafik ve Çizelgeler** - PDF içinde görsel grafikler
- 🎨 **Özelleştirilebilir Temalar** - Farklı rapor tasarımları
- 📱 **Excel/CSV Export** - Alternatif format seçenekleri
- 🔒 **Şifreli PDF** - Güvenlik için şifre koruması

## 🆘 Sorun Giderme

### Yaygın Sorunlar:

1. **"Rapor oluşturulurken hata oluştu" Hatası:**
   - Sayfayı yenileyin ve tekrar deneyin
   - İnternet bağlantınızı kontrol edin
   - Tarayıcı cache'ini temizleyin

2. **PDF İndirilmiyor:**
   - Pop-up blocker'ı devre dışı bırakın
   - Tarayıcı indirme ayarlarını kontrol edin
   - Farklı tarayıcı deneyin

3. **Veriler Eksik Görünüyor:**
   - Sayfa tamamen yüklenene kadar bekleyin
   - Filtreleri kontrol edin
   - Veriler gerçekten mevcut mu kontrol edin

### Destek:
❓ Sorunlarınız için: [Teknik Destek]
📧 Email: support@neyisek.com
📱 Telefon: +90 XXX XXX XX XX

## ✅ Sonuç

PDF rapor sistemi, NeYisek.com platformunda işletme zekası ve veri analizi ihtiyaçlarınızı karşılamak için tasarlanmıştır. Profesyonel raporlar oluşturarak işletmenizi daha iyi analiz edebilir ve stratejik kararlar alabilirsiniz.

---
**Son Güncelleme:** {{ tarih }}
**Versiyon:** 1.0
**Geliştirici:** NeYisek.com Teknik Ekibi 