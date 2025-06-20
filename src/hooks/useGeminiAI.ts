import { useState, useCallback } from 'react';

interface FoodRecommendationRequest {
  previousOrders?: string[];
  dietaryRestrictions?: string[];
  budget?: number;
  mood?: string;
  weather?: string;
  timeOfDay?: string;
}

interface SearchRequest {
  query: string;
}

interface ChatbotRequest {
  message: string;
  context?: {
    orderHistory?: any[];
    currentOrder?: any;
    userProfile?: any;
  };
}

interface PricingRequest {
  currentDemand?: number;
  timeOfDay?: string;
  weather?: string;
  competitorPrices?: number[];
  historicalData?: any[];
}

interface ContentRequest {
  type: 'blog' | 'social' | 'email';
  topic: string;
  targetAudience?: string;
}

interface CrossSellRequest {
  orderItems: any[];
  restaurantId: string;
  restaurantMenu: any;
  customerPreferences?: any;
  orderTotal?: number;
}

export const useGeminiAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Akıllı yemek önerileri
  const getFoodRecommendations = useCallback(async (request: FoodRecommendationRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Öneriler alınamadı');
      }

      return {
        recommendations: data.recommendations,
        fallbackRecommendations: data.fallbackRecommendations,
        aiAvailable: data.aiProvider === 'Gemini',
        timestamp: data.timestamp
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Doğal dil arama
  const searchWithNaturalLanguage = useCallback(async (request: SearchRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Arama yapılamadı');
      }

      return {
        searchResults: data.searchResults,
        fallbackSearch: data.fallbackSearch,
        query: data.query,
        aiAvailable: data.aiProvider === 'Gemini',
        timestamp: data.timestamp
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // AI Chatbot
  const chatWithAI = useCallback(async (request: ChatbotRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      return {
        response: data.response,
        aiAvailable: data.aiAvailable,
        timestamp: data.timestamp,
        error: data.error
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      return {
        response: 'Üzgünüm, şu anda size yardımcı olamıyorum. Lütfen tekrar deneyin.',
        aiAvailable: false,
        timestamp: new Date().toISOString(),
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Dinamik fiyatlandırma stratejisi
  const getDynamicPricingStrategy = useCallback(async (request: PricingRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Fiyatlandırma stratejisi alınamadı');
      }

      return {
        pricingData: data.pricingData,
        strategy: data.strategy,
        fallbackStrategy: data.fallbackStrategy,
        aiAvailable: data.aiProvider === 'Gemini',
        timestamp: data.timestamp
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // İçerik üretimi (blog, sosyal medya, email)
  const generateContent = useCallback(async (request: ContentRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'İçerik üretilemedi');
      }

      return {
        content: data.content,
        fallbackContent: data.fallbackContent,
        aiAvailable: data.aiProvider === 'Gemini',
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Hızlı öneriler (kullanıcı profili bazlı)
  const getQuickRecommendations = useCallback(async (userProfile?: any) => {
    const currentHour = new Date().getHours();
    let mood = 'normal';
    let timeOfDay = 'öğle';

    // Saate göre ruh hali ve zaman belirleme
    if (currentHour >= 6 && currentHour < 12) {
      timeOfDay = 'sabah';
      mood = 'enerjik';
    } else if (currentHour >= 12 && currentHour < 17) {
      timeOfDay = 'öğle';
      mood = 'normal';
    } else if (currentHour >= 17 && currentHour < 21) {
      timeOfDay = 'akşam';
      mood = 'rahat';
    } else {
      timeOfDay = 'gece';
      mood = 'sakin';
    }

    return getFoodRecommendations({
      previousOrders: userProfile?.recentOrders || [],
      dietaryRestrictions: userProfile?.dietaryRestrictions || [],
      budget: userProfile?.averageBudget || 50,
      mood,
      timeOfDay,
      weather: 'normal' // Bu daha sonra gerçek hava durumu API'si ile güncellenebilir
    });
  }, [getFoodRecommendations]);

  // Akıllı arama önerileri
  const getSearchSuggestions = useCallback(async (partialQuery: string) => {
    if (partialQuery.length < 3) return [];

    try {
      const result = await searchWithNaturalLanguage({ query: partialQuery });
      
      // AI sonucunu arama önerilerine çevir
      if (result.searchResults) {
        try {
          const parsed = JSON.parse(result.searchResults.replace('```json\n', '').replace('\n```', ''));
          return [
            ...parsed.foodType.map((food: string) => `${food} ara`),
            ...(parsed.features.length > 0 ? [`${parsed.features.join(' ')} yemekler`] : []),
            ...(parsed.priceRange ? [`${parsed.priceRange} fiyatlı yemekler`] : [])
          ].slice(0, 5);
        } catch {
          return [partialQuery];
        }
      }
      
      return [partialQuery];
    } catch {
      return [partialQuery];
    }
  }, [searchWithNaturalLanguage]);

  // Otomatik fiyat optimizasyonu (mevcut veriler bazlı)
  const getAutoPricingOptimization = useCallback(async () => {
    const currentHour = new Date().getHours();
    let demand = 5; // Varsayılan orta seviye talep

    // Saate göre talep tahmini
    if (currentHour >= 11 && currentHour <= 14) {
      demand = 8; // Öğle yemeği yoğunluğu
    } else if (currentHour >= 18 && currentHour <= 21) {
      demand = 9; // Akşam yemeği yoğunluğu
    } else if (currentHour >= 22 || currentHour <= 6) {
      demand = 3; // Gece düşük talep
    }

    return getDynamicPricingStrategy({
      currentDemand: demand,
      timeOfDay: currentHour.toString(),
      weather: 'normal',
      competitorPrices: [25, 30, 35, 40], // Örnek rakip fiyatları
      historicalData: [] // Gerçek uygulamada geçmiş veriler
    });
  }, [getDynamicPricingStrategy]);

  // Çapraz satış önerileri (içecek ve tatlı)
  const getCrossSellRecommendations = useCallback(async (request: CrossSellRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/cross-sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Çapraz satış önerileri alınamadı');
      }

      return {
        shouldSuggest: data.shouldSuggest,
        suggestions: data.suggestions,
        fallbackSuggestions: data.fallbackSuggestions,
        orderAnalysis: data.orderAnalysis,
        aiAvailable: data.aiProvider === 'Gemini',
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getFoodRecommendations,
    searchWithNaturalLanguage,
    chatWithAI,
    getDynamicPricingStrategy,
    generateContent,
    getCrossSellRecommendations,
    getQuickRecommendations,
    getSearchSuggestions,
    getAutoPricingOptimization,
    clearError: () => setError(null)
  };
}; 