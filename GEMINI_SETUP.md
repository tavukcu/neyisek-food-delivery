# Gemini AI Kurulumu

Bu uygulamada AI Chatbot özelliği için Google Gemini AI kullanılmaktadır.

## API Anahtarı Alma

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Google hesabınızla giriş yapın
3. "Create API Key" butonuna tıklayın
4. API anahtarınızı kopyalayın

## Kurulum

1. Proje kök dizininde `.env.local` dosyası oluşturun
2. Aşağıdaki satırı ekleyin:

```bash
NEXT_PUBLIC_GEMINI_API_KEY=buraya_api_anahtarinizi_yapistiirin
```

3. Uygulamayı yeniden başlatın:

```bash
npm run dev
```

## Test Etme

1. Uygulamayı açın (`http://localhost:3000`)
2. Sağ alt köşedeki AI Chatbot butonuna tıklayın
3. "Merhaba" yazarak test edin

## Sorun Giderme

Eğer AI cevap vermiyorsa:

1. **Konsol loglarını kontrol edin:**
   - Tarayıcıda F12 ile Developer Tools açın
   - Console sekmesinde hata mesajları var mı bakın

2. **API anahtarını kontrol edin:**
   - `.env.local` dosyasında doğru yazıldığından emin olun
   - Anahtarın başında/sonunda boşluk olmadığından emin olun

3. **API limitlerini kontrol edin:**
   - Google AI Studio'da kullanım limitinizi kontrol edin
   - Günlük/aylık limit aşılmış olabilir

## Ücretsiz Kullanım

Google Gemini API'nin ücretsiz kotası vardır:
- Günde 60 istek
- Dakikada 2 istek
- Aylık limit: Değişkenlik gösterebilir

Daha fazla bilgi için [Google AI Studio](https://makersuite.google.com/) sayfasını ziyaret edin. 