# 🤖 AI Destekli Sipariş Sistemi Geliştirme Planı

## 📋 Mevcut Durum Analizi
- ✅ Firebase tabanlı sipariş sistemi mevcut
- ✅ Restoran yönetim paneli aktif
- ✅ Kullanıcı kimlik doğrulama sistemi çalışıyor
- 🔄 AI entegrasyonu için hazır altyapı

## 🚀 Google Cloud AI Entegrasyonu

### Faz 1: Temel AI Özellikleri (1-2 Hafta)

#### 1.1 Gemini AI Entegrasyonu
```typescript
// services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  }

  // Akıllı sipariş önerileri
  async getOrderRecommendations(userId: string, orderHistory: any[]) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Kullanıcı geçmiş siparişleri: ${JSON.stringify(orderHistory)}
    Saat: ${new Date().getHours()}
    Gün: ${new Date().toLocaleDateString('tr-TR', { weekday: 'long' })}
    
    Bu kullanıcı için 3 akıllı sipariş önerisi ver. Türkçe yanıtla.
    `;
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // Doğal dil sipariş işleme
  async processNaturalLanguageOrder(orderText: string, menuItems: any[]) {
    const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Müşteri siparişi: "${orderText}"
    Mevcut menü: ${JSON.stringify(menuItems)}
    
    Bu siparişi analiz et ve JSON formatında döndür:
    {
      "items": [{"name": "ürün adı", "quantity": sayı, "notes": "özel notlar"}],
      "confidence": 0.95,
      "clarifications": ["belirsiz olan noktalar"]
    }
    `;
    
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  }
}
```

#### 1.2 Akıllı Chatbot Entegrasyonu
```typescript
// components/AIChatbot.tsx
'use client';

import { useState } from 'react';
import { GeminiService } from '@/services/geminiService';

export default function AIChatbot() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const geminiService = new GeminiService();

  const handleSendMessage = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);

    // AI yanıtı al
    const aiResponse = await geminiService.processNaturalLanguageOrder(
      input, 
      menuItems
    );

    const botMessage = { role: 'assistant', content: aiResponse };
    setMessages(prev => [...prev, botMessage]);
    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-xl">
      <div className="p-4 bg-blue-600 text-white rounded-t-lg">
        🤖 AI Sipariş Asistanı
      </div>
      
      <div className="h-64 overflow-y-auto p-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Siparişinizi yazın..."
            className="flex-1 p-2 border rounded-l"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded-r"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Faz 2: Gelişmiş AI Özellikleri (2-3 Hafta)

#### 2.1 Vertex AI Recommendations
```typescript
// services/recommendationService.ts
export class RecommendationService {
  async getPersonalizedRecommendations(userId: string) {
    // Vertex AI Recommendations API kullanımı
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    return response.json();
  }

  async trackUserInteraction(userId: string, itemId: string, action: string) {
    // Kullanıcı etkileşimlerini izle
    await fetch('/api/track-interaction', {
      method: 'POST',
      body: JSON.stringify({ userId, itemId, action, timestamp: Date.now() })
    });
  }
}
```

#### 2.2 Akıllı Fiyatlandırma
```typescript
// services/dynamicPricingService.ts
export class DynamicPricingService {
  async calculateOptimalPrice(itemId: string, factors: any) {
    const model = new GeminiService();
    
    const prompt = `
    Ürün: ${itemId}
    Faktörler: ${JSON.stringify(factors)}
    - Talep yoğunluğu
    - Stok durumu
    - Rekabet fiyatları
    - Hava durumu
    - Saat dilimi
    
    Optimal fiyat önerisi ver ve gerekçesini açıkla.
    `;
    
    return await model.generateContent(prompt);
  }
}
```

### Faz 3: Sesli Sipariş Sistemi (3-4 Hafta)

#### 3.1 Speech-to-Text Entegrasyonu
```typescript
// services/speechService.ts
export class SpeechService {
  async transcribeAudio(audioBlob: Blob): Promise<string> {
    const formData = new FormData();
    formData.append('audio', audioBlob);
    
    const response = await fetch('/api/speech-to-text', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    return result.transcript;
  }

  async processVoiceOrder(transcript: string) {
    const geminiService = new GeminiService();
    return await geminiService.processNaturalLanguageOrder(transcript, menuItems);
  }
}
```

#### 3.2 Sesli Sipariş Bileşeni
```typescript
// components/VoiceOrderButton.tsx
'use client';

import { useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

export default function VoiceOrderButton() {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    
    recorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        const speechService = new SpeechService();
        const transcript = await speechService.transcribeAudio(event.data);
        const order = await speechService.processVoiceOrder(transcript);
        
        // Siparişi işle
        console.log('Sesli sipariş:', order);
      }
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`p-4 rounded-full ${
        isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
      } text-white`}
    >
      {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
      <span className="ml-2">
        {isRecording ? 'Dinleniyor...' : 'Sesli Sipariş'}
      </span>
    </button>
  );
}
```

## 🔧 Teknik Gereksinimler

### Environment Variables
```env
# .env.local
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id
VERTEX_AI_LOCATION=us-central1
SPEECH_TO_TEXT_API_KEY=your_speech_api_key
```

### Package Dependencies
```json
{
  "dependencies": {
    "@google/generative-ai": "^0.2.1",
    "@google-cloud/aiplatform": "^3.0.0",
    "@google-cloud/speech": "^6.0.0",
    "@google-cloud/translate": "^8.0.0"
  }
}
```

## 📊 Beklenen Faydalar

### Müşteri Deneyimi
- ⚡ %40 daha hızlı sipariş süreci
- 🎯 %60 daha doğru öneriler
- 🗣️ Doğal dil ile sipariş verme
- 🌍 Çok dilli destek

### İş Operasyonları
- 📈 %25 satış artışı (upselling)
- 🎯 %30 daha iyi stok yönetimi
- ⏰ %50 daha az sipariş hatası
- 💰 %20 operasyonel maliyet azalması

### Analitik ve İçgörüler
- 📊 Gerçek zamanlı müşteri analizi
- 🔮 Talep tahmini
- 🎨 Kişiselleştirilmiş menü önerileri
- 📱 Müşteri davranış analizi

## 🚀 Başlangıç Adımları

1. **Google Cloud Console'da proje oluştur**
2. **Gerekli API'leri etkinleştir**
3. **API anahtarlarını al**
4. **Temel Gemini entegrasyonunu test et**
5. **Adım adım özellikleri ekle**

Bu plan ile sipariş sisteminizi modern AI teknolojileri ile güçlendirebilir, müşteri deneyimini dramatik şekilde iyileştirebilirsiniz! 