# NeYisek.com - AI Destekli Yemek Sipariş Platformu

🚀 **Google Gemini AI** ile desteklenen modern yemek sipariş platformu

## 🤖 AI Özellikler

### 🔥 **YENİ! Gelişmiş Gemini AI Entegrasyonu**

#### 📸 **Görsel Menü Tanıma**
- **Gemini Vision API** ile yemek fotoğrafı analizi
- Malzeme, kalori ve beslenme bilgisi tespiti
- Alerjen uyarıları ve diyet uygunluğu
- Mutfak türü ve lezzet profili analizi

#### 💝 **Ruh Hali Bazlı Öneriler**
- Kullanıcının ruh haline göre AI önerileri
- Hava durumu ve zaman faktörlü analiz
- Psikoloji destekli yemek eşleştirme
- Aromaterapi ve renk terapisi önerileri

#### 🧠 **Akıllı Chatbot**
- Doğal dil ile sipariş alma
- Gerçek zamanlı menü önerileri
- Beslenme danışmanlığı
- 7/24 AI müşteri desteği

#### 🍽️ **Gelişmiş Beslenme Analizi**
- Kişiselleştirilmiş diyet planları
- Sağlık hedeflerine göre öneriler
- Besin değeri optimizasyonu
- Alerjik madde kontrolleri

#### 👨‍🍳 **Gastronomi Uzmanı AI**
- Yemek eşleştirme önerileri
- Şarap eşleştirme tavsiyeleri
- Chef ipuçları ve pişirme teknikleri
- Tarif önerileri ve modifikasyonlar

---

## 🚀 Özellikler

### 🍕 **Temel Platform**
- ✅ Modern ve responsive tasarım
- ✅ Gerçek zamanlı sipariş takibi
- ✅ Çoklu ödeme seçenekleri
- ✅ Restoran yönetim paneli

### 🧮 **Akıllı Kalori Sistemi**
- ✅ Otomatik kalori hesaplama
- ✅ Beslenme bilgileri
- ✅ Porsiyon bazlı analiz
- ✅ Diyet takibi

### 🤖 **AI Destekli Özellikler**
- ✅ **Görsel menü tanıma (YENİ!)**
- ✅ **Ruh hali bazlı öneriler (YENİ!)**
- ✅ **Gelişmiş beslenme analizi (YENİ!)**
- ✅ **Gastronomi uzmanı AI (YENİ!)**
- ✅ Akıllı sipariş önerileri
- ✅ Doğal dil sipariş işleme
- ✅ Kişiselleştirilmiş menü

### 📱 **Kullanıcı Deneyimi**
- ✅ Sezgisel kullanıcı arayüzü
- ✅ Hızlı sipariş sistemi
- ✅ Favori ürün yönetimi
- ✅ Sipariş geçmişi

---

## 🛠️ Teknoloji Stack

### **Frontend**
- **Next.js 14** - React Framework
- **TypeScript** - Tip güvenliği
- **Tailwind CSS** - Styling
- **Lucide Icons** - İkonlar

### **AI & Analytics**
- **Google Gemini Pro** - Doğal dil işleme
- **Gemini Vision** - Görsel analiz
- **AI Chatbot** - Müşteri desteği
- **Smart Recommendations** - Öneri sistemi

### **Backend & Database**
- **Firebase** - Backend as a Service
- **Firestore** - NoSQL Database
- **Firebase Auth** - Kimlik doğrulama
- **Firebase Storage** - Dosya depolama

---

## 🎯 AI Kullanım Örnekleri

### 1. **Görsel Menü Analizi**
```bash
# Kullanıcı yemek fotoğrafı yükler
→ AI analiz eder: "Bu bir Margherita Pizza"
→ Malzemeler: Domates, mozzarella, fesleğen
→ Kalori: ~290 kcal/dilim
→ Alerjiler: Gluten, süt ürünleri
```

### 2. **Ruh Hali Önerileri**
```bash
# Kullanıcı: "Yorgunum ve soğuk hava var"
→ AI önerir: Sıcak çorba, bitki çayı
→ Renk terapisi: Turuncu ve sarı tonlar
→ Aromaterapi: Tarçın ve zencefil
```

### 3. **Doğal Dil Sipariş**
```bash
# Kullanıcı: "Acıkmışım, hafif bir şeyler"
→ AI analiz eder ve önerir
→ Sepete otomatik ekler
→ Kişiselleştirilmiş alternatifler sunar
```

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Firebase projesi
- **Google AI Studio API Key** (Gemini için)

### 1. Projeyi Klonlayın
```bash
git clone https://github.com/your-username/neyisek.git
cd neyisek
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Variables
`.env.local` dosyası oluşturun:

```env
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Google AI (Gemini) API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

# Email Service
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
```

### 4. Firebase Setup
```bash
# Firebase CLI kurulumu
npm install -g firebase-tools

# Firebase'e giriş
firebase login

# Firestore index'lerini deploy et
firebase deploy --only firestore:indexes
```

### 5. Gemini AI Setup
1. [Google AI Studio](https://makersuite.google.com/app/apikey)'da API key oluşturun
2. API key'i `.env.local` dosyasına ekleyin
3. Gemini Pro ve Gemini Vision modelleri aktif olduğundan emin olun

### 6. Uygulamayı Başlatın
```bash
npm run dev
```

Uygulama http://localhost:3000 adresinde çalışacaktır.

---

## 🎨 AI Özellikleri Kullanımı

### **Görsel Analiz**
1. Menü sayfasına gidin
2. Sol panelden "AI Menü Analizi"ni açın
3. Yemek fotoğrafı yükleyin
4. AI analiz sonuçlarını inceleyin

### **Ruh Hali Önerileri**
1. "Ruh Haline Göre Öneriler" bölümünü açın
2. Mevcut ruh halinizi seçin
3. Hava durumu ve zaman bilgilerini güncelleyin
4. AI önerilerini inceleyin

### **Chatbot**
1. Sağ alt köşedeki chat butonuna tıklayın
2. Doğal dille sipariş verin
3. AI ile sohbet edin

---

## 🏗️ Proje Yapısı

```
src/
├── app/                 # Next.js App Router
├── components/          # React bileşenleri
│   ├── AIChatbot.tsx       # AI Chatbot
│   ├── ImageMenuAnalyzer.tsx # Görsel analiz
│   └── MoodBasedRecommendations.tsx # Ruh hali önerileri
├── services/            # API servisleri
│   ├── geminiService.ts    # Gemini AI servisi
│   ├── productService.ts   # Ürün servisleri
│   └── aiOrderService.ts   # AI sipariş servisleri
├── hooks/               # Custom React hooks
├── types/               # TypeScript tip tanımları
└── utils/               # Yardımcı fonksiyonlar
```

---

## 🔮 Gelecek Planları

### **Kısa Vadeli (1-2 Ay)**
- [ ] Sesli sipariş alma
- [ ] AR menü görüntüleme
- [ ] Akıllı fiyatlandırma
- [ ] Sosyal medya entegrasyonu

### **Orta Vadeli (3-6 Ay)**
- [ ] Machine Learning öneri sistemi
- [ ] IoT cihaz entegrasyonu
- [ ] Blockchain ödeme sistemi
- [ ] Multi-language AI support

### **Uzun Vadeli (6+ Ay)**
- [ ] AI chef asistanı
- [ ] Sanal restoran deneyimi
- [ ] Drone teslimat sistemi
- [ ] Global expansion

---

## 🤝 Katkıda Bulunun

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyin.

---

## 📞 İletişim

- **Website**: [NeYisek.com](https://neyisek.com)
- **Email**: info@neyisek.com
- **GitHub**: [@your-username](https://github.com/your-username)

---

## 🙏 Teşekkürler

- **Google Gemini AI** - Güçlü AI özellikleri için
- **Firebase** - Backend altyapısı için
- **Next.js** - Modern React framework için
- **Tailwind CSS** - Güzel tasarım sistemi için

---

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!** 