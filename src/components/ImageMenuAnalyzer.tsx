'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Search, Loader2, X, Check, Star } from 'lucide-react';
import { GeminiService } from '@/services/geminiService';
import toast from 'react-hot-toast';

interface AnalyzedItem {
  name: string;
  ingredients: string[];
  calories: number;
  cuisine: string;
  isVegan: boolean;
  isVegetarian: boolean;
  allergens: string[];
  flavor: string;
  confidence: number;
}

interface AnalysisResult {
  items: AnalyzedItem[];
  description: string;
  suggestions: string[];
}

interface ImageMenuAnalyzerProps {
  onAnalysisComplete?: (result: AnalysisResult) => void;
  className?: string;
}

export default function ImageMenuAnalyzer({ onAnalysisComplete, className = '' }: ImageMenuAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [geminiService] = useState(() => new GeminiService());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
      return;
    }

    setSelectedImage(file);
    
    // Preview oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Önceki analizi temizle
    setAnalysisResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      toast.error('Lütfen önce bir fotoğraf seçin');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await geminiService.analyzeMenuImage(selectedImage);
      setAnalysisResult(result);
      
      if (result.items.length > 0) {
        toast.success('Fotoğraf başarıyla analiz edildi!');
        onAnalysisComplete?.(result);
      } else {
        toast.error('Fotoğrafta yemek bulunamadı');
      }
    } catch (error) {
      console.error('Analiz hatası:', error);
      toast.error('Fotoğraf analiz edilirken hata oluştu');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
          <Camera className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI Menü Analizi</h3>
          <p className="text-gray-600">Yemek fotoğrafını analiz et, içeriği keşfet</p>
        </div>
      </div>

      {/* Upload Area */}
      {!imagePreview ? (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Yemek Fotoğrafını Yükle
          </h4>
          <p className="text-gray-600 mb-6">
            Menüdeki yemeği fotoğrafla, AI analiz etsin
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Fotoğraf Seç
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            PNG, JPG, WebP desteklenir • Maksimum 5MB
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-64 object-cover rounded-xl shadow-md"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full btn-primary flex items-center justify-center gap-2 py-3"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI Analiz Ediyor...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                AI ile Analiz Et
              </>
            )}
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-2 text-green-600">
            <Check className="w-5 h-5" />
            <span className="font-medium">Analiz Tamamlandı</span>
          </div>

          {/* General Description */}
          {analysisResult.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-medium text-blue-900 mb-2">Genel Değerlendirme</h4>
              <p className="text-blue-800">{analysisResult.description}</p>
            </div>
          )}

          {/* Detected Items */}
          {analysisResult.items.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4">Tespit Edilen Yemekler</h4>
              <div className="space-y-4">
                {analysisResult.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="text-lg font-bold text-gray-900">{item.name}</h5>
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-medium">
                          {(item.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-gray-500 block">Kalori</span>
                        <span className="text-sm font-medium text-orange-600">
                          {item.calories} kcal
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Mutfak</span>
                        <span className="text-sm font-medium">{item.cuisine}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Lezzet</span>
                        <span className="text-sm font-medium">{item.flavor}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">Diyet</span>
                        <div className="flex gap-1">
                          {item.isVegan && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Vegan
                            </span>
                          )}
                          {item.isVegetarian && !item.isVegan && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Vejetaryen
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ingredients */}
                    {item.ingredients.length > 0 && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block mb-2">Malzemeler</span>
                        <div className="flex flex-wrap gap-1">
                          {item.ingredients.map((ingredient, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Allergens */}
                    {item.allergens.length > 0 && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-2">⚠️ Alerjenler</span>
                        <div className="flex flex-wrap gap-1">
                          {item.allergens.map((allergen, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysisResult.suggestions.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-medium text-yellow-900 mb-2">💡 AI Önerileri</h4>
              <ul className="text-yellow-800 space-y-1">
                {analysisResult.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm">• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 btn-secondary"
            >
              Yeni Fotoğraf
            </button>
            <button
              onClick={() => {
                if (analysisResult.items.length > 0) {
                  // Sepete ekleme işlemi burada yapılabilir
                  toast.success('Yemekler sipariş listesine eklendi!');
                }
              }}
              className="flex-1 btn-primary"
            >
              Sipariş Listesine Ekle
            </button>
          </div>
        </div>
      )}

      {/* AI Badge */}
      <div className="mt-6 text-center">
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
          <Sparkles className="w-3 h-3" />
          Gemini Vision AI ile desteklenmektedir
        </span>
      </div>
    </div>
  );
} 