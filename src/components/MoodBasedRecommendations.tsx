'use client';

import { useState, useEffect } from 'react';
import { Heart, Sun, Cloud, Snowflake, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { GeminiService } from '@/services/geminiService';

interface MoodRecommendation {
  category: string;
  items: string[];
  reason: string;
  moodBoost: number;
}

interface MoodData {
  recommendations: MoodRecommendation[];
  reasoning: string;
  colors: string[];
  textures: string[];
  aromatherapy: string;
}

export default function MoodBasedRecommendations() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MoodData | null>(null);
  const [geminiService] = useState(() => new GeminiService());

  // Hava durumu algılama (basit)
  const [weather, setWeather] = useState<string>('güneşli');
  const [timeOfDay, setTimeOfDay] = useState<string>('');

  useEffect(() => {
    // Zamanı otomatik belirle
    const hour = new Date().getHours();
    if (hour < 11) setTimeOfDay('sabah');
    else if (hour < 17) setTimeOfDay('öğle');
    else setTimeOfDay('akşam');
  }, []);

  const moods = [
    { id: 'mutlu', name: 'Mutlu 😊', color: 'bg-yellow-100 text-yellow-800', icon: '😊' },
    { id: 'üzgün', name: 'Üzgün 😢', color: 'bg-blue-100 text-blue-800', icon: '😢' },
    { id: 'stresli', name: 'Stresli 😰', color: 'bg-red-100 text-red-800', icon: '😰' },
    { id: 'yorgun', name: 'Yorgun 😴', color: 'bg-purple-100 text-purple-800', icon: '😴' },
    { id: 'heyecanlı', name: 'Heyecanlı 🤩', color: 'bg-orange-100 text-orange-800', icon: '🤩' },
    { id: 'romantik', name: 'Romantik 💕', color: 'bg-pink-100 text-pink-800', icon: '💕' },
    { id: 'nostaljik', name: 'Nostaljik 🤔', color: 'bg-indigo-100 text-indigo-800', icon: '🤔' },
    { id: 'enerjik', name: 'Enerjik ⚡', color: 'bg-green-100 text-green-800', icon: '⚡' }
  ];

  const weathers = [
    { id: 'güneşli', name: 'Güneşli', icon: Sun },
    { id: 'bulutlu', name: 'Bulutlu', icon: Cloud },
    { id: 'yağmurlu', name: 'Yağmurlu', icon: Cloud },
    { id: 'soğuk', name: 'Soğuk', icon: Snowflake }
  ];

  const handleGetRecommendations = async () => {
    if (!selectedMood) return;

    setLoading(true);
    try {
      const result = await geminiService.getMoodBasedRecommendations(
        selectedMood,
        weather,
        timeOfDay
      );
      setRecommendations(result);
    } catch (error) {
      console.error('Mood recommendations error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMood) {
      handleGetRecommendations();
    }
  }, [selectedMood, weather, timeOfDay]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ruh Haline Göre Öneriler</h3>
          <p className="text-gray-600">Nasıl hissediyorsun? Sana özel yemekler önerelim</p>
        </div>
      </div>

      {/* Context Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Weather */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hava Durumu
          </label>
          <div className="grid grid-cols-2 gap-2">
            {weathers.map((w) => {
              const IconComponent = w.icon;
              return (
                <button
                  key={w.id}
                  onClick={() => setWeather(w.id)}
                  className={`p-2 rounded-lg border transition-all ${
                    weather === w.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-xs">{w.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time of Day */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zaman ({timeOfDay})
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['sabah', 'öğle', 'akşam'].map((time) => (
              <button
                key={time}
                onClick={() => setTimeOfDay(time)}
                className={`p-2 rounded-lg border transition-all ${
                  timeOfDay === time
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Clock className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs capitalize">{time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mood Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Şu anda nasıl hissediyorsun?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {moods.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`p-3 rounded-xl border-2 transition-all hover:scale-105 ${
                selectedMood === mood.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{mood.icon}</div>
              <div className="text-sm font-medium">{mood.name.split(' ')[0]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-indigo-600">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>AI sana özel öneriler hazırlıyor...</span>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && !loading && (
        <div className="space-y-6">
          {/* AI Reasoning */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
            <h4 className="font-medium text-indigo-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Değerlendirmesi
            </h4>
            <p className="text-indigo-800 text-sm">{recommendations.reasoning}</p>
          </div>

          {/* Mood Boost Items */}
          {recommendations.recommendations.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Ruh Halini İyileştirecek Yemekler
              </h4>
              <div className="space-y-4">
                {recommendations.recommendations.map((rec, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{rec.category}</h5>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">
                          +{rec.moodBoost}/10
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-2">
                        {rec.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sensory Experience */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Colors */}
            {recommendations.colors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h5 className="font-medium text-yellow-900 mb-2">🎨 Renkler</h5>
                <div className="flex flex-wrap gap-1">
                  {recommendations.colors.map((color, idx) => (
                    <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Textures */}
            {recommendations.textures.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h5 className="font-medium text-green-900 mb-2">🤏 Dokular</h5>
                <div className="flex flex-wrap gap-1">
                  {recommendations.textures.map((texture, idx) => (
                    <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {texture}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Aromatherapy */}
            {recommendations.aromatherapy && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <h5 className="font-medium text-purple-900 mb-2">🌸 Aromaterapi</h5>
                <p className="text-xs text-purple-800">{recommendations.aromatherapy}</p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={() => setSelectedMood('')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Yeni Ruh Hali Seç
            </button>
          </div>
        </div>
      )}

      {/* AI Badge */}
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs rounded-full">
          <Sparkles className="w-3 h-3" />
          Gemini AI Psikoloji Uzmanı
        </span>
      </div>
    </div>
  );
} 