'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GeminiService } from '@/services/geminiService';
import { Sparkles, Clock, TrendingUp, Heart, Star, ChefHat } from 'lucide-react';

interface Recommendation {
  name: string;
  reason: string;
  priceRange: string;
  score: number;
  category: string;
}

interface RecommendationData {
  recommendations: Recommendation[];
  personalizedMessage: string;
}

export default function SmartRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kullanıcı tercihlerini al ve önerileri getir
  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Kullanıcının geçmiş siparişlerini ve tercihlerini simüle et
      // Gerçek uygulamada bu veriler Firestore'dan gelecek
      const userPreferences = {
        previousOrders: ['Pizza Margherita', 'Köfte', 'Tavuk Döner'],
        favoriteCategories: ['Pizza', 'Türk Mutfağı', 'Fast Food'],
        dietaryRestrictions: [], // Kullanıcının diyet kısıtlamaları
        budget: 50, // TL
        mood: 'mutlu', // Kullanıcının ruh hali
        weather: 'soğuk', // Hava durumu
        timeOfDay: new Date().getHours() < 12 ? 'sabah' : 
                   new Date().getHours() < 18 ? 'öğle' : 'akşam'
      };

      const result = await GeminiService.getFoodRecommendations(userPreferences);
      setRecommendations(result);
    } catch (err) {
      setError('Öneriler yüklenirken bir hata oluştu');
      console.error('Öneri alma hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/20">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Akıllı Öneriler
          </h3>
          <p className="text-gray-600">
            Kişiselleştirilmiş yemek önerileri için giriş yapın
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/20">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            AI Öneriler Hazırlanıyor...
          </h3>
          <p className="text-gray-600">
            Size özel yemek önerileri oluşturuluyor
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-2xl p-6 border border-red-200/20">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Öneriler Yüklenemedi
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRecommendations}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-2xl p-6 border border-gray-200/20">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Henüz Öneri Yok
          </h3>
          <p className="text-gray-600">
            Daha fazla sipariş vererek kişiselleştirilmiş öneriler alabilirsiniz
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-200/20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">
            AI Akıllı Öneriler
          </h3>
          <p className="text-sm text-gray-600">
            Size özel hazırlanmış yemek önerileri
          </p>
        </div>
      </div>

      {/* Kişiselleştirilmiş Mesaj */}
      {recommendations.personalizedMessage && (
        <div className="bg-white/50 rounded-xl p-4 mb-6 border border-purple-200/30">
          <p className="text-gray-700 italic">
            "{recommendations.personalizedMessage}"
          </p>
        </div>
      )}

      {/* Öneriler */}
      <div className="space-y-4">
        {recommendations.recommendations.map((rec, index) => (
          <div
            key={index}
            className="bg-white/70 rounded-xl p-4 border border-purple-200/30 hover:bg-white/90 transition-all duration-300 hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 text-lg mb-1">
                  {rec.name}
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {rec.category}
                  </span>
                  <span className="text-sm text-gray-600">
                    {rec.priceRange}
                  </span>
                </div>
              </div>
              
              {/* Skor */}
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full">
                <Star className="w-4 h-4" />
                <span className="font-bold text-sm">
                  {rec.score.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Öneri Sebebi */}
            <p className="text-gray-600 text-sm mb-3">
              {rec.reason}
            </p>

            {/* Aksiyon Butonları */}
            <div className="flex gap-2">
              <button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 text-sm font-medium">
                Sipariş Ver
              </button>
              <button className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm">
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Yenile Butonu */}
      <div className="mt-6 text-center">
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50"
        >
          <TrendingUp className="w-4 h-4" />
          Yeni Öneriler Al
        </button>
      </div>

      {/* AI Badge */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs rounded-full">
          <Sparkles className="w-3 h-3" />
          Gemini AI ile desteklenmektedir
        </span>
      </div>
    </div>
  );
} 