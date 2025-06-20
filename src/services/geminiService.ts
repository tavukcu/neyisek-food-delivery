import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini AI Service for NeYisek Platform
export class GeminiService {
  private genAI?: GoogleGenerativeAI;
  private model?: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || 
                   process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
                   'AIzaSyAwNEtdGnL4_Z1hKOxpZ8hMv6mMnDunNcU'; // Fallback API key
    
    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
      console.warn('Gemini API key not found. AI features will be disabled.');
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  // Akıllı yemek önerileri
  async generateFoodRecommendations(userPreferences: {
    previousOrders?: string[];
    dietaryRestrictions?: string[];
    budget?: number;
    mood?: string;
    weather?: string;
    timeOfDay?: string;
  }) {
    if (!this.model) return null;

    const prompt = `
    Bir yemek sipariş platformu için kişiselleştirilmiş yemek önerileri oluştur.
    
    Kullanıcı Bilgileri:
    - Önceki siparişler: ${userPreferences.previousOrders?.join(', ') || 'Yok'}
    - Diyet kısıtlamaları: ${userPreferences.dietaryRestrictions?.join(', ') || 'Yok'}
    - Bütçe: ${userPreferences.budget || 'Belirtilmemiş'}₺
    - Ruh hali: ${userPreferences.mood || 'Normal'}
    - Hava durumu: ${userPreferences.weather || 'Bilinmiyor'}
    - Günün saati: ${userPreferences.timeOfDay || 'Bilinmiyor'}
    
    Lütfen 3-5 yemek önerisi ver. Her öneri için:
    1. Yemek adı
    2. Neden önerildiği
    3. Tahmini fiyat aralığı
    4. Uygun restoran türü
    
    JSON formatında yanıt ver.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini food recommendation error:', error);
      return null;
    }
  }

  // Doğal dil ile arama
  async processNaturalLanguageSearch(query: string) {
    if (!this.model) return null;

    const prompt = `
    Kullanıcının doğal dil arama sorgusunu analiz et ve yapılandırılmış arama parametrelerine çevir.
    
    Kullanıcı sorgusu: "${query}"
    
    Aşağıdaki kategorileri analiz et:
    - Yemek türü (pizza, burger, döner, vb.)
    - Fiyat aralığı (ucuz, orta, pahalı)
    - Özellikler (acılı, vejeteryan, vegan, glutensiz, vb.)
    - Restoran türü
    - Teslimat tercihi
    - Zaman tercihi
    
    JSON formatında yapılandırılmış sonuç döndür:
    {
      "foodType": [],
      "priceRange": "",
      "features": [],
      "restaurantType": "",
      "deliveryPreference": "",
      "timePreference": "",
      "confidence": 0.0-1.0
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini natural language search error:', error);
      return null;
    }
  }

  // Akıllı chatbot yanıtları
  async generateChatbotResponse(userMessage: string, context?: {
    orderHistory?: any[];
    currentOrder?: any;
    userProfile?: any;
  }) {
    if (!this.model) return null;

    const prompt = `
    Sen NeYisek yemek sipariş platformunun müşteri hizmetleri asistanısın. 
    Türkçe, samimi ve yardımsever bir şekilde yanıt ver.
    
    Kullanıcı mesajı: "${userMessage}"
    
    ${context ? `
    Kullanıcı Bağlamı:
    - Sipariş geçmişi: ${JSON.stringify(context.orderHistory) || 'Yok'}
    - Mevcut sipariş: ${JSON.stringify(context.currentOrder) || 'Yok'}
    - Kullanıcı profili: ${JSON.stringify(context.userProfile) || 'Yok'}
    ` : ''}
    
    Yanıtın şunları içerebilir:
    - Sipariş durumu bilgisi
    - Menü önerileri
    - Teknik destek
    - Genel bilgiler
    - Şikayet çözümü
    
    Kısa, net ve yardımcı bir yanıt ver.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chatbot error:', error);
      return null;
    }
  }

  // Menü açıklaması oluşturma
  async generateMenuDescription(menuItem: {
    name: string;
    ingredients?: string[];
    category: string;
    price: number;
  }) {
    if (!this.model) return null;

    const prompt = `
    Bir yemek menü öğesi için çekici ve bilgilendirici açıklama oluştur.
    
    Yemek Bilgileri:
    - İsim: ${menuItem.name}
    - Malzemeler: ${menuItem.ingredients?.join(', ') || 'Belirtilmemiş'}
    - Kategori: ${menuItem.category}
    - Fiyat: ${menuItem.price}₺
    
    Açıklama şunları içermeli:
    - Çekici ve iştah açıcı dil
    - Malzeme vurguları
    - Lezzet profili
    - Özel özellikler (varsa)
    - 2-3 cümle uzunluğunda
    
    Sadece açıklamayı döndür, başka bir şey ekleme.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini menu description error:', error);
      return null;
    }
  }

  // Dinamik fiyat önerisi
  async generatePricingStrategy(data: {
    currentDemand: number;
    timeOfDay: string;
    weather: string;
    competitorPrices: number[];
    historicalData: any[];
  }) {
    if (!this.model) return null;

    const prompt = `
    Yemek sipariş platformu için dinamik fiyatlandırma stratejisi öner.
    
    Mevcut Durum:
    - Talep seviyesi: ${data.currentDemand}/10
    - Günün saati: ${data.timeOfDay}
    - Hava durumu: ${data.weather}
    - Rakip fiyatları: ${data.competitorPrices.join(', ')}₺
    - Geçmiş veriler mevcut: ${data.historicalData.length > 0 ? 'Evet' : 'Hayır'}
    
    Şunları öner:
    1. Fiyat ayarlama yüzdesi (-20% ile +20% arası)
    2. Kampanya önerileri
    3. Zaman bazlı indirimler
    4. Gerekçeler
    
    JSON formatında yanıt ver.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini pricing strategy error:', error);
      return null;
    }
  }

  // İçerik üretimi (blog, sosyal medya)
  async generateContent(type: 'blog' | 'social' | 'email', topic: string, targetAudience?: string) {
    if (!this.model) return null;

    const prompt = `
    NeYisek yemek sipariş platformu için ${type} içeriği oluştur.
    
    Konu: ${topic}
    Hedef kitle: ${targetAudience || 'Genel'}
    
    ${type === 'blog' ? 'Blog yazısı için başlık, giriş paragrafı ve ana noktaları içeren taslak oluştur.' : ''}
    ${type === 'social' ? 'Sosyal medya paylaşımı için kısa, çekici ve hashtag içeren içerik oluştur.' : ''}
    ${type === 'email' ? 'E-posta kampanyası için konu başlığı ve içerik taslağı oluştur.' : ''}
    
    Türkçe, samimi ve marka kimliğine uygun bir ton kullan.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini content generation error:', error);
      return null;
    }
  }

  // Kullanıcı davranış analizi
  async analyzeUserBehavior(userData: {
    orderHistory: any[];
    searchHistory: string[];
    preferences: any;
    demographics?: any;
  }) {
    if (!this.model) return null;

    const prompt = `
    Kullanıcı davranış verilerini analiz et ve içgörüler sağla.
    
    Kullanıcı Verileri:
    - Sipariş sayısı: ${userData.orderHistory.length}
    - Arama geçmişi: ${userData.searchHistory.slice(0, 10).join(', ')}
    - Tercihler: ${JSON.stringify(userData.preferences)}
    
    Analiz et:
    1. Kullanıcı segmenti
    2. Satın alma kalıpları
    3. Tercih edilen yemek türleri
    4. Sipariş zamanlaması
    5. Fiyat hassasiyeti
    6. Kişiselleştirme önerileri
    
    JSON formatında detaylı analiz döndür.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini user behavior analysis error:', error);
      return null;
    }
  }

  // Çapraz satış önerileri (içecek ve tatlı önerileri)
  async generateCrossSellRecommendations(data: {
    orderItems: any[];
    restaurantMenu: any;
    missingCategories: {
      needsDrink: boolean;
      needsDessert: boolean;
    };
    customerPreferences: any;
    orderTotal: number;
  }) {
    if (!this.model) return null;

    const prompt = `
    Bir yemek sipariş platformunda çapraz satış önerileri oluştur.
    
    Mevcut Sipariş:
    ${data.orderItems.map(item => `- ${item.name} (${item.category}) - ${item.price}₺`).join('\n')}
    
    Eksik Kategoriler:
    - İçecek gerekli: ${data.missingCategories.needsDrink ? 'Evet' : 'Hayır'}
    - Tatlı gerekli: ${data.missingCategories.needsDessert ? 'Evet' : 'Hayır'}
    
    Restoran Menüsü:
    ${JSON.stringify(data.restaurantMenu, null, 2)}
    
    Müşteri Tercihleri: ${JSON.stringify(data.customerPreferences)}
    Sipariş Toplamı: ${data.orderTotal}₺
    
    Lütfen şunları yap:
    1. Mevcut ana yemeklerle uyumlu içecek önerileri (eğer gerekiyorsa)
    2. Yemeği tamamlayacak tatlı önerileri (eğer gerekiyorsa)
    3. Her öneri için neden uyumlu olduğunu açıkla
    4. Fiyat/performans dengesi göz önünde bulundur
    
    Sadece restoran menüsünde mevcut olan ürünleri öner!
    
    JSON formatında yanıt ver:
    {
      "message": "Kişiselleştirilmiş mesaj",
      "drinks": [
        {
          "name": "İçecek adı",
          "price": fiyat,
          "reason": "Neden önerildiği",
          "compatibility": "Ana yemekle uyumu"
        }
      ],
      "desserts": [
        {
          "name": "Tatlı adı", 
          "price": fiyat,
          "reason": "Neden önerildiği",
          "compatibility": "Yemekle uyumu"
        }
      ],
      "totalSavings": "Kampanya varsa indirim bilgisi",
      "urgency": "Aciliyet mesajı (varsa)"
    }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini cross-sell recommendations error:', error);
      return null;
    }
  }

  // Akıllı sepet analizi ve önerileri
  async getSmartCartRecommendations(cartItems: any[], availableProducts: any[], restaurantId: string) {
    if (!this.model) return null;

    // Sepetteki ürünleri kategorilere ayır
    const cartCategories = cartItems.map(item => item.product?.category || item.category || 'bilinmiyor');
    const cartProductNames = cartItems.map(item => item.product?.name || item.name);
    
    // Mevcut ürünleri kategorilere göre grupla
    const productsByCategory = availableProducts.reduce((acc, product) => {
      const category = product.category || 'diğer';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {} as {[key: string]: any[]});

    const prompt = `
    Bir Türk yemek sipariş platformunda sepet analizi yap ve restoranın menüsünden akıllı öneriler sun.
    
    MEVCUT SEPET:
    ${cartItems.map(item => `- ${item.product?.name || item.name} (${item.product?.category || item.category || 'kategori yok'}) - ${item.product?.price || item.price}₺ x${item.quantity || 1}`).join('\n')}
    
    RESTORAN MENÜSÜ (Kategorilere Göre):
    ${Object.entries(productsByCategory).map(([category, products]) => 
      `\n${category.toUpperCase()}:\n${(products as any[]).map((p: any) => `  - ${p.name} - ${p.price}₺${p.description ? ` (${p.description.substring(0, 50)}...)` : ''}`).join('\n')}`
    ).join('\n')}
    
    ANALIZ KURALLARI:
    1. Sepetteki ürünlerle uyumlu kategorilerden öner (ana yemek varsa içecek/tatlı öner)
    2. Türk mutfağı uyumu göz önünde bulundur (kebap-ayran, pilav-cacık gibi)
    3. Fiyat dengesi koru (çok pahalı önerme)
    4. Sepette OLMAYAN ürünleri öner
    5. Aynı kategoriden farklı çeşitler önerebilirsin
    6. Lezzet uyumunu düşün (acılı yemek-soğuk içecek gibi)
    
    ÇIKTI FORMATI (JSON):
    {
      "missingCategories": [
        {
          "categoryName": "Eksik kategori adı",
          "reason": "Neden bu kategori gerekli",
          "importance": 1-5
        }
      ],
      "recommendations": [
        {
          "productName": "Menüden gerçek ürün adı",
          "category": "Ürün kategorisi", 
          "reason": "Neden önerildiği (Türk mutfağı uyumu dahil)",
          "price": "Fiyat₺",
          "compatibility": 1-100,
          "urgency": "düşük/orta/yüksek"
        }
      ],
      "perfectCombos": [
        {
          "title": "Kombinasyon adı",
          "items": ["sepetteki ürün", "önerilen ürün"],
          "why": "Neden mükemmel kombinasyon"
        }
      ],
      "estimatedSatisfaction": 1-100,
      "budgetOptimization": "Bütçe ve sipariş optimizasyon önerisi",
      "reasoning": "Genel analiz ve önerilerin mantığı"
    }
    
    ÖNEMLİ: Sadece restoranın menüsünde bulunan gerçek ürünleri öner!
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // JSON parse işlemi
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          
          // Önerilen ürünlerin gerçekten menüde olup olmadığını kontrol et
          if (analysis.recommendations) {
            analysis.recommendations = analysis.recommendations.filter((rec: any) => {
              const productExists = availableProducts.some(product => 
                product.name.toLowerCase().includes(rec.productName.toLowerCase()) ||
                rec.productName.toLowerCase().includes(product.name.toLowerCase())
              );
              return productExists;
            });
          }
          
          return analysis;
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
      }
      
      // Fallback: Basit kategori analizi
      const hasMainDish = cartCategories.some(cat => 
        cat.includes('ana') || cat.includes('yemek') || cat.includes('kebap') || cat.includes('pide')
      );
      const hasDrink = cartCategories.some(cat => 
        cat.includes('içecek') || cat.includes('drink') || cat.includes('ayran') || cat.includes('su')
      );
      const hasDessert = cartCategories.some(cat => 
        cat.includes('tatlı') || cat.includes('dessert')
      );
      
      const fallbackRecommendations = [];
      
      // İçecek önerisi
      if (hasMainDish && !hasDrink) {
        const drinks = availableProducts.filter(p => 
          p.category?.toLowerCase().includes('içecek') || 
          p.name.toLowerCase().includes('ayran') ||
          p.name.toLowerCase().includes('su') ||
          p.name.toLowerCase().includes('cola')
        );
        if (drinks.length > 0) {
          const drink = drinks[0];
          fallbackRecommendations.push({
            productName: drink.name,
            category: drink.category || 'içecek',
            price: `${drink.price}₺`,
            reason: 'Ana yemeğinizle birlikte içecek siparişinizi tamamlar',
            compatibility: 85,
            urgency: 'orta'
          });
        }
      }
      
      // Tatlı önerisi
      if (hasMainDish && !hasDessert) {
        const desserts = availableProducts.filter(p => 
          p.category?.toLowerCase().includes('tatlı') ||
          p.name.toLowerCase().includes('baklava') ||
          p.name.toLowerCase().includes('sütlaç')
        );
        if (desserts.length > 0) {
          const dessert = desserts[0];
          fallbackRecommendations.push({
            productName: dessert.name,
            category: dessert.category || 'tatlı',
            price: `${dessert.price}₺`,
            reason: 'Yemeğinizi tatlı bir şekilde tamamlayın',
            compatibility: 80,
            urgency: 'düşük'
          });
        }
      }
      
      return {
        missingCategories: [
          ...(!hasDrink && hasMainDish ? [{
            categoryName: "İçecek",
            reason: "Ana yemeğinizle birlikte bir içecek siparişinizi tamamlayabilir",
            importance: 3
          }] : []),
          ...(!hasDessert && hasMainDish ? [{
            categoryName: "Tatlı",
            reason: "Yemeğinizi tatlı bir şekilde tamamlayın",
            importance: 2
          }] : [])
        ],
        recommendations: fallbackRecommendations,
        perfectCombos: [],
        estimatedSatisfaction: 75,
        budgetOptimization: "Restoranın menüsünden uyumlu ürünler önerildi",
        reasoning: "Sepetinizdeki ürünlere göre aynı restorandan tamamlayıcı öneriler sunuldu."
      };
    } catch (error) {
      console.error('Gemini smart cart recommendations error:', error);
      return null;
    }
  }
}

// Singleton instance
export const geminiService = new GeminiService(); 