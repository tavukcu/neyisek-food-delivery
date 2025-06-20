'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShoppingCart, 
  Plus, 
  TrendingUp, 
  Star, 
  Coffee,
  Heart,
  Zap,
  Target,
  Award,
  ArrowRight,
  Brain,
  ChefHat,
  Lightbulb,
  Wand2,
  Gift,
  Crown,
  Gem
} from 'lucide-react';
import { geminiService } from '@/services/geminiService';
import { ProductService } from '@/services/productService';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

interface SmartRecommendation {
  productName: string;
  category: string;
  reason: string;
  price: string;
  compatibility: number;
  urgency: string;
}

interface MissingCategory {
  categoryName: string;
  reason: string;
  importance: number;
}

interface PerfectCombo {
  title: string;
  items: string[];
  why: string;
}

interface RecommendationData {
  missingCategories: MissingCategory[];
  recommendations: SmartRecommendation[];
  perfectCombos: PerfectCombo[];
  estimatedSatisfaction: number;
  budgetOptimization: string;
  reasoning: string;
}

interface EnhancedRecommendation {
  productId: string;
  product: any;
  score: number;
  reasons: string[];
  category: 'trending' | 'similar' | 'complementary' | 'contextual' | 'ai-powered';
  urgency: 'low' | 'medium' | 'high';
  confidence: number;
}

interface Props {
  restaurantId: string;
  className?: string;
}

const SmartCartRecommendations: React.FC<Props> = ({ restaurantId, className = '' }) => {
  const { cartItems, addToCart } = useCart();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [enhancedRecommendations, setEnhancedRecommendations] = useState<EnhancedRecommendation[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAddedProductId, setLastAddedProductId] = useState<string | null>(null);

  // Restoran ürünlerini yükle
  useEffect(() => {
    const loadProducts = async () => {
      console.log('🛒 STEP 1: loadProducts çağrıldı, restaurantId:', restaurantId);
      
      if (!restaurantId) {
        console.log('🛒 Restaurant ID bulunamadı, analiz durduruldu');
        return;
      }
      
      try {
        console.log('🛒 STEP 2: ProductService.getProductsByRestaurant çağrılıyor...');
        const products = await ProductService.getProductsByRestaurant(restaurantId);
        console.log('🛒 STEP 3: Ürünler yüklendi:', products?.length || 0, 'adet ürün');
        console.log('🛒 STEP 3: Ürün listesi:', products);
        
        // Ürün isimlerini detaylı logla
        if (products && products.length > 0) {
          console.log('🛒 DETAY: Mevcut ürün isimleri:');
          products.forEach((product, index) => {
            console.log(`🛒   ${index + 1}. "${product.name}" (${product.categoryId || 'kategori yok'}) - ${product.price}₺`);
          });
        }
        
        setAvailableProducts(products || []);
      } catch (error) {
        console.error('🛒 HATA: Ürünler yüklenirken hata:', error);
        setAvailableProducts([]);
      }
    };

    loadProducts();
  }, [restaurantId]);

  // Sepet değiştiğinde analiz yap
  useEffect(() => {
    console.log('🛒 STEP A: Sepet değişikliği tespit edildi');
    console.log('🛒 STEP A: cartItems.length:', cartItems.length);
    console.log('🛒 STEP A: availableProducts.length:', availableProducts.length);
    
    if (cartItems.length > 0 && availableProducts.length > 0) {
      console.log('🛒 STEP B: Koşullar sağlandı, analiz başlatılıyor...');
      analyzeCart();
    } else {
      console.log('🛒 STEP B: Koşullar sağlanmadı, analiz başlatılmıyor');
      console.log('🛒   - Sepet boş mu?', cartItems.length === 0);
      console.log('🛒   - Ürünler yüklenmemiş mi?', availableProducts.length === 0);
    }
  }, [cartItems, availableProducts]);

  // 🎯 Sepet değişimini dinle ve başarı mesajı göster
  useEffect(() => {
    if (lastAddedProductId) {
      const productInCart = cartItems.find(item => item.productId === lastAddedProductId);
      if (productInCart) {
        console.log('✅ Ürün sepete başarıyla eklendi!', productInCart.product.name);
        toast.success(`🎉 ${productInCart.product.name} sepete eklendi!`);
        setLastAddedProductId(null);
      }
    }
  }, [cartItems, lastAddedProductId]);

  const analyzeCart = async () => {
    console.log('🛒 SmartCartRecommendations: analyzeCart çağrıldı');
    console.log('🛒 cartItems:', cartItems);
    console.log('🛒 availableProducts:', availableProducts);
    console.log('🛒 restaurantId:', restaurantId);

    if (cartItems.length === 0 || availableProducts.length === 0) {
      console.log('🛒 Sepet boş veya ürün yok, analiz yapılmıyor');
      return;
    }

    setIsAnalyzing(true);
    try {
      console.log('🛒 Gemini AI analizi başlatılıyor...');
      const analysis = await geminiService.getSmartCartRecommendations(
        cartItems,
        availableProducts,
        restaurantId
      );
      
      console.log('🛒 AI analiz sonucu:', analysis);
      
      if (analysis) {
        console.log('🛒 AI ANALİZ SONUCU DETAY:');
        console.log('🛒 Önerilen ürünler:');
        if (analysis.recommendations) {
          analysis.recommendations.forEach((rec: any, index: number) => {
            console.log(`🛒   ${index + 1}. AI Önerisi: "${rec.productName}" (${rec.category}) - ${rec.price}`);
          });
        }
        
        setRecommendations(analysis);
        toast.success('AI sepet analizi tamamlandı!');
      } else {
        console.log('🛒 AI analizi başarısız, öneri gösterilmiyor');
        toast.error('AI analizi yapılamadı');
      }
    } catch (error) {
      console.error('🛒 Sepet analiz hatası:', error);
      toast.error('AI analizi yapılamadı');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🎯 Gelişmiş Ürün Ekleme Fonksiyonu (Hibrit Sistem Uyumlu)
  const handleAddRecommendation = (productNameOrId: string, productData?: any) => {
    console.log('🛒 AKILLI ÜRÜN EKLEME: Aranan:', productNameOrId);
    console.log('🛒 Ürün verisi:', productData);
    console.log('🛒 Mevcut ürün sayısı:', availableProducts.length);
    console.log('🛒 Mevcut sepet durumu:', cartItems.length, 'ürün');
    
    let product = null;
    
    // 🚀 Önce productData varsa direkt kullan (Hibrit sistem için)
    if (productData) {
      product = productData;
      console.log('🎯 Hibrit sistemden gelen ürün kullanılıyor:', product.name);
      console.log('🎯 Ürün detayları:', { id: product.id, name: product.name, price: product.price });
    } else {
      // 🔍 Ürün ID ile arama (Hibrit sistem için)
      product = availableProducts.find(p => p.id === productNameOrId);
      
      if (!product) {
        // 🔍 Ürün ismi ile arama (Eski sistem için)
        // 1. Tam eşleşme
        product = availableProducts.find(p => 
          p.name.toLowerCase() === productNameOrId.toLowerCase()
        );
      }
      
      if (!product) {
        // 2. İçerik eşleşmesi (her iki yönde)
        product = availableProducts.find(p => 
          p.name.toLowerCase().includes(productNameOrId.toLowerCase()) || 
          productNameOrId.toLowerCase().includes(p.name.toLowerCase())
        );
      }
      
      if (!product) {
        // 3. Kelime bazlı eşleşme
        const searchWords = productNameOrId.toLowerCase().split(' ');
        product = availableProducts.find(p => {
          const productWords = p.name.toLowerCase().split(' ');
          return searchWords.some((searchWord: string) => 
            productWords.some((productWord: string) => 
              productWord.includes(searchWord) || searchWord.includes(productWord)
            )
          );
        });
      }
      
      if (!product) {
        // 4. Kategori bazlı eşleşme (ayran, cola, su gibi genel terimler için)
        const categoryMatches = {
          'ayran': ['ayran', 'buttermilk'],
          'su': ['su', 'water'],
          'cola': ['cola', 'kola', 'pepsi', 'coca'],
          'çay': ['çay', 'tea'],
          'kahve': ['kahve', 'coffee'],
          'baklava': ['baklava'],
          'sütlaç': ['sütlaç', 'rice pudding'],
          'künefe': ['künefe'],
          'döner': ['döner', 'doner'],
          'kebap': ['kebap', 'kebab'],
          'pide': ['pide'],
          'lahmacun': ['lahmacun']
        };
        
        const searchTerm = productNameOrId.toLowerCase();
        for (const [category, keywords] of Object.entries(categoryMatches)) {
          if (keywords.some(keyword => searchTerm.includes(keyword))) {
            product = availableProducts.find(p => 
              keywords.some(keyword => p.name.toLowerCase().includes(keyword))
            );
            if (product) break;
          }
        }
      }
    }
    
    console.log('🛒 BULUNAN ÜRÜN:', product);
    
    if (product) {
      // Sepette zaten var mı kontrol et
      const alreadyInCart = cartItems.some(item => item.productId === product.id);
      console.log('🛒 Sepette zaten var mı?', alreadyInCart);
      
      if (alreadyInCart) {
        toast(`"${product.name}" zaten sepetinizde var!`, { icon: 'ℹ️' });
        return;
      }
      
      console.log('🛒 addToCart çağrılıyor...', { product: product.name, id: product.id });
      
      try {
        addToCart(product, 1);
        console.log('🛒 addToCart başarılı!');
        
        // 🚀 localStorage'ı manuel olarak güncelle (double-check)
        setTimeout(() => {
          const currentCart = JSON.parse(localStorage.getItem('neyisek-cart') || '[]');
          console.log('🛒 localStorage kontrol - mevcut sepet:', currentCart.length);
          
          // Ürün gerçekten eklendi mi kontrol et
          const productExists = currentCart.some((item: any) => item.productId === product.id);
          console.log('🛒 Ürün localStorage\'da var mı?', productExists);
          
          if (productExists) {
            // 🚀 Sepet güncellemesini tüm sayfalara bildir (güçlü event)
            window.dispatchEvent(new CustomEvent('cartUpdated', {
              detail: { 
                action: 'add',
                productId: product.id,
                productName: product.name,
                timestamp: Date.now(),
                cartLength: currentCart.length
              }
            }));
            
            // Storage event'i de tetikle
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'neyisek-cart',
              newValue: JSON.stringify(currentCart),
              oldValue: null,
              storageArea: localStorage
            }));
            
            console.log('🛒 Güçlü senkronizasyon event\'leri gönderildi');
          }
        }, 100);
        
        // State ile sepet değişimini dinle
        setLastAddedProductId(product.id);
        
        // Analizi yenile
        setTimeout(() => {
          if (cartItems.length > 0) {
            getEnhancedRecommendations();
          }
        }, 500);
        
      } catch (error) {
        console.error('🛒 addToCart hatası:', error);
        toast.error(`❌ Ürün sepete eklenirken hata oluştu: ${error}`);
      }
      
    } else {
      console.log('🛒 ÜRÜN BULUNAMADI! Aranan:', productNameOrId);
      console.log('🛒 Mevcut ürün isimleri:', availableProducts.slice(0, 5).map(p => `${p.name} (${p.id})`));
      toast.error(`"${productNameOrId}" ürünü bulunamadı. Lütfen manuel olarak ekleyin.`);
    }
  };

  // 🎯 Hibrit Sistem için Özel Ürün Ekleme
  const handleAddEnhancedRecommendation = (recommendation: EnhancedRecommendation) => {
    console.log('🧠 HİBRİT SİSTEM: Ürün ekleniyor:', recommendation);
    handleAddRecommendation(recommendation.productId, recommendation.product);
  };

  const getSatisfactionColor = (satisfaction: number) => {
    if (satisfaction >= 85) return 'text-green-600 bg-green-50';
    if (satisfaction >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'yüksek':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'orta':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  // Gelişmiş öneri sistemi
  useEffect(() => {
    if (cartItems.length > 0 && availableProducts.length > 0) {
      getEnhancedRecommendations();
    }
  }, [cartItems, availableProducts]);

  const getEnhancedRecommendations = async () => {
    if (!restaurantId || cartItems.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('🧠 Gelişmiş AI Öneri Sistemi başlatılıyor...');
      
      // 1. Mevcut AI analizi
      const aiAnalysis = await geminiService.getSmartCartRecommendations(
        cartItems,
        availableProducts,
        restaurantId
      );

      // 2. Trend analizi (son 7 günün popüler ürünleri)
      const trendingProducts = await getTrendingProducts(restaurantId);
      
      // 3. Benzerlik analizi (sepetteki ürünlere benzer olanlar)
      const similarProducts = getSimilarProducts(cartItems, availableProducts);
      
      // 4. Bağlamsal öneriler (zaman, mevsim bazlı)
      const contextualProducts = getContextualRecommendations(availableProducts);
      
      // 5. Tamamlayıcı ürünler (Türk mutfağı kombinasyonları)
      const complementaryProducts = getComplementaryProducts(cartItems, availableProducts);

      // Tüm önerileri birleştir ve skorla
      const allRecommendations: EnhancedRecommendation[] = [];

      // AI önerilerini ekle (ağırlık: %30)
      if (aiAnalysis?.recommendations) {
        aiAnalysis.recommendations.forEach((rec: any) => {
          const product = findProductByName(rec.productName, availableProducts);
          if (product && !cartItems.some(item => item.productId === product.id)) {
            allRecommendations.push({
              productId: product.id,
              product,
              score: (rec.compatibility || 80) * 0.3,
              reasons: [rec.reason],
              category: 'ai-powered',
              urgency: rec.compatibility > 85 ? 'high' : rec.compatibility > 70 ? 'medium' : 'low',
              confidence: (rec.compatibility || 80) / 100
            });
          }
        });
      }

      // Trend önerilerini ekle (ağırlık: %20)
      trendingProducts.forEach(({ product, orderCount }) => {
        if (!cartItems.some(item => item.productId === product.id)) {
          const score = Math.min(orderCount * 2, 100) * 0.2;
          allRecommendations.push({
            productId: product.id,
            product,
            score,
            reasons: [`Son 7 günde ${orderCount} kez sipariş edildi`, 'Popüler ürün'],
            category: 'trending',
            urgency: orderCount > 20 ? 'high' : orderCount > 10 ? 'medium' : 'low',
            confidence: Math.min(orderCount / 30, 1)
          });
        }
      });

      // Benzer ürünleri ekle (ağırlık: %20)
      similarProducts.forEach(({ product, similarity }) => {
        if (!cartItems.some(item => item.productId === product.id)) {
          const score = similarity * 100 * 0.2;
          allRecommendations.push({
            productId: product.id,
            product,
            score,
            reasons: ['Sepetinizdeki ürünlere benzer', 'Aynı kategoriden'],
            category: 'similar',
            urgency: similarity > 0.8 ? 'high' : similarity > 0.6 ? 'medium' : 'low',
            confidence: similarity
          });
        }
      });

      // Bağlamsal önerileri ekle (ağırlık: %15)
      contextualProducts.forEach(({ product, contextScore, reason }) => {
        if (!cartItems.some(item => item.productId === product.id)) {
          const score = contextScore * 0.15;
          allRecommendations.push({
            productId: product.id,
            product,
            score,
            reasons: [reason],
            category: 'contextual',
            urgency: contextScore > 80 ? 'high' : contextScore > 60 ? 'medium' : 'low',
            confidence: contextScore / 100
          });
        }
      });

      // Tamamlayıcı ürünleri ekle (ağırlık: %15)
      complementaryProducts.forEach(({ product, complementScore, reason }) => {
        if (!cartItems.some(item => item.productId === product.id)) {
          const score = complementScore * 0.15;
          allRecommendations.push({
            productId: product.id,
            product,
            score,
            reasons: [reason],
            category: 'complementary',
            urgency: complementScore > 85 ? 'high' : complementScore > 70 ? 'medium' : 'low',
            confidence: complementScore / 100
          });
        }
      });

      // Skorları birleştir (aynı ürün için birden fazla öneri varsa)
      const combinedRecommendations = new Map<string, EnhancedRecommendation>();
      
      allRecommendations.forEach(rec => {
        const existing = combinedRecommendations.get(rec.productId);
        if (existing) {
          existing.score += rec.score;
          existing.reasons.push(...rec.reasons);
          existing.confidence = Math.max(existing.confidence, rec.confidence);
          if (rec.urgency === 'high') existing.urgency = 'high';
          else if (rec.urgency === 'medium' && existing.urgency === 'low') existing.urgency = 'medium';
        } else {
          combinedRecommendations.set(rec.productId, rec);
        }
      });

      // En iyi 8 öneriyi seç ve eski formata dönüştür
      const finalRecommendations = Array.from(combinedRecommendations.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      console.log('🧠 Hibrit sistem sonucu:', finalRecommendations.length, 'öneri');
      
      // 🚀 Hibrit sistem önerilerini kaydet
      setEnhancedRecommendations(finalRecommendations);
      
      // Eski RecommendationData formatına dönüştür
      const recommendationData: RecommendationData = {
        missingCategories: finalRecommendations
          .filter(r => r.category === 'complementary')
          .map(r => ({
            categoryName: r.category,
            reason: r.reasons[0] || 'Tamamlayıcı ürün',
            importance: Math.round(r.score)
          })),
        recommendations: finalRecommendations.map(r => ({
          productName: r.product.name,
          category: r.category,
          reason: r.reasons.join(' • '),
          price: `${r.product.price}₺`,
          compatibility: Math.round(r.score),
          urgency: r.urgency
        })),
        perfectCombos: [],
        estimatedSatisfaction: Math.round(
          finalRecommendations.reduce((sum, r) => sum + r.score, 0) / finalRecommendations.length
        ),
        budgetOptimization: `${finalRecommendations.length} akıllı öneri mevcut`,
        reasoning: `Hibrit AI sistemi ile ${finalRecommendations.length} öneri analiz edildi`
      };

      setRecommendations(recommendationData);

    } catch (error) {
      console.error('Enhanced recommendations error:', error);
      setError('Akıllı öneriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Ürün bulma fonksiyonu
  const findProductByName = (productName: string, products: any[]) => {
    return products.find(p => 
      p.name.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().split(' ').some((word: string) => 
        productName.toLowerCase().includes(word) && word.length > 2
      )
    );
  };

  // Trend analizi fonksiyonu
  const getTrendingProducts = async (restaurantId: string) => {
    try {
      // Basit trend analizi - gerçek uygulamada Firebase'den veri çekilir
      const trendingData = [
        { product: availableProducts.find(p => p.name.toLowerCase().includes('kebap')), orderCount: 25 },
        { product: availableProducts.find(p => p.name.toLowerCase().includes('pide')), orderCount: 20 },
        { product: availableProducts.find(p => p.name.toLowerCase().includes('ayran')), orderCount: 30 },
        { product: availableProducts.find(p => p.name.toLowerCase().includes('baklava')), orderCount: 15 },
        { product: availableProducts.find(p => p.name.toLowerCase().includes('çorba')), orderCount: 18 }
      ].filter(item => item.product);

      return trendingData;
    } catch (error) {
      console.error('Trending products error:', error);
      return [];
    }
  };

  // Benzerlik analizi
  const getSimilarProducts = (cartItems: any[], availableProducts: any[]) => {
    const cartCategories = new Set(cartItems.map(item => item.product?.category).filter(Boolean));
    const cartKeywords = new Set(
      cartItems.flatMap(item => 
        item.product?.name?.toLowerCase().split(' ').filter((word: string) => word.length > 2) || []
      )
    );

    return availableProducts
      .map(product => {
        let similarity = 0;
        
        // Kategori benzerliği
        if (product.category && cartCategories.has(product.category)) {
          similarity += 0.4;
        }
        
        // İsim benzerliği
        const productWords = product.name?.toLowerCase().split(' ') || [];
        const commonWords = productWords.filter((word: string) => cartKeywords.has(word));
        if (commonWords.length > 0) {
          similarity += (commonWords.length / productWords.length) * 0.6;
        }

        return { product, similarity };
      })
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);
  };

  // Bağlamsal öneriler
  const getContextualRecommendations = (availableProducts: any[]) => {
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();
    const recommendations: { product: any; contextScore: number; reason: string }[] = [];

    availableProducts.forEach(product => {
      let contextScore = 0;
      let reason = '';

      // Zaman bazlı öneriler
      if (currentHour >= 6 && currentHour <= 11) { // Sabah
        if (product.name?.toLowerCase().includes('kahvaltı') || 
            product.name?.toLowerCase().includes('çay') ||
            product.name?.toLowerCase().includes('börek')) {
          contextScore = 90;
          reason = 'Sabah saatleri için ideal';
        }
      } else if (currentHour >= 12 && currentHour <= 15) { // Öğle
        if (product.category?.toLowerCase().includes('ana') ||
            product.name?.toLowerCase().includes('kebap') ||
            product.name?.toLowerCase().includes('pide')) {
          contextScore = 85;
          reason = 'Öğle yemeği için mükemmel';
        }
      } else if (currentHour >= 18 && currentHour <= 22) { // Akşam
        if (product.category?.toLowerCase().includes('ana') ||
            product.name?.toLowerCase().includes('çorba')) {
          contextScore = 80;
          reason = 'Akşam yemeği için ideal';
        }
      }

      // Mevsimsel öneriler
      if (currentMonth >= 11 || currentMonth <= 2) { // Kış
        if (product.name?.toLowerCase().includes('çorba') ||
            product.name?.toLowerCase().includes('sıcak')) {
          contextScore += 20;
          reason += (reason ? ' • ' : '') + 'Kış mevsimi için sıcacık';
        }
      } else if (currentMonth >= 6 && currentMonth <= 8) { // Yaz
        if (product.name?.toLowerCase().includes('salata') ||
            product.name?.toLowerCase().includes('soğuk') ||
            product.name?.toLowerCase().includes('dondurma')) {
          contextScore += 20;
          reason += (reason ? ' • ' : '') + 'Yaz mevsimi için serinletici';
        }
      }

      if (contextScore > 0) {
        recommendations.push({ product, contextScore, reason });
      }
    });

    return recommendations
      .sort((a, b) => b.contextScore - a.contextScore)
      .slice(0, 5);
  };

  // Tamamlayıcı ürünler (Türk mutfağı kombinasyonları)
  const getComplementaryProducts = (cartItems: any[], availableProducts: any[]) => {
    const recommendations: { product: any; complementScore: number; reason: string }[] = [];
    
    // Türk mutfağı kombinasyon kuralları
    const complementaryRules = [
      {
        trigger: ['kebap', 'köfte', 'et'],
        suggest: ['ayran', 'bulgur', 'salata', 'turşu'],
        score: 95,
        reason: 'Et yemekleri ile mükemmel uyum'
      },
      {
        trigger: ['pide', 'lahmacun'],
        suggest: ['ayran', 'salata', 'turşu'],
        score: 90,
        reason: 'Hamur işleri ile klasik ikili'
      },
      {
        trigger: ['çorba'],
        suggest: ['ekmek', 'salata'],
        score: 85,
        reason: 'Çorba ile tamamlayıcı'
      },
      {
        trigger: ['baklava', 'künefe', 'tatlı'],
        suggest: ['çay', 'türk kahvesi'],
        score: 100,
        reason: 'Tatlı sonrası klasik ikram'
      },
      {
        trigger: ['balık'],
        suggest: ['salata', 'pilav', 'ayran'],
        score: 88,
        reason: 'Balık yemekleri ile uyumlu'
      }
    ];

    // Sepetteki ürünleri kontrol et
    const cartProductNames = cartItems.map(item => 
      item.product?.name?.toLowerCase() || ''
    ).join(' ');

    complementaryRules.forEach(rule => {
      const hasTriggger = rule.trigger.some(trigger => 
        cartProductNames.includes(trigger)
      );

      if (hasTriggger) {
        rule.suggest.forEach(suggestion => {
          const product = availableProducts.find(p => 
            p.name?.toLowerCase().includes(suggestion)
          );
          
          if (product) {
            recommendations.push({
              product,
              complementScore: rule.score,
              reason: rule.reason
            });
          }
        });
      }
    });

    return recommendations
      .sort((a, b) => b.complementScore - a.complementScore)
      .slice(0, 5);
  };

  if (cartItems.length === 0) return null;

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Başlık */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                AI Akıllı Öneriler
              </h3>
              <p className="text-purple-100 text-sm">
                Siparişinizi tamamlayalım
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
          >
            <Sparkles className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {isAnalyzing ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">
                AI siparişinizi analiz ediyor...
              </p>
            </div>
          ) : recommendations ? (
            <div className="space-y-6">
              
              {/* 🧠 Hibrit AI Önerileri (Yeni Sistem) */}
              {enhancedRecommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-500" />
                    <h4 className="font-bold text-gray-900">
                      🚀 Hibrit AI Önerileri
                    </h4>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                      YENİ
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {enhancedRecommendations.slice(0, 5).map((rec, index) => (
                      <div key={rec.productId} className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-3 h-3 rounded-full ${
                                rec.category === 'ai-powered' ? 'bg-purple-500' :
                                rec.category === 'trending' ? 'bg-red-500' :
                                rec.category === 'similar' ? 'bg-blue-500' :
                                rec.category === 'contextual' ? 'bg-green-500' :
                                'bg-orange-500'
                              }`}></div>
                              <span className="font-bold text-gray-900">
                                {rec.product.name}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full border ${
                                rec.urgency === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                                rec.urgency === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {rec.urgency === 'high' ? 'Yüksek' : rec.urgency === 'medium' ? 'Orta' : 'Düşük'}
                              </span>
                            </div>
                            <div className="mb-2">
                              {rec.reasons.slice(0, 2).map((reason, reasonIndex) => (
                                <p key={reasonIndex} className="text-sm text-gray-600 mb-1">
                                  • {reason}
                                </p>
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-purple-600">
                                {rec.product.price}₺
                              </span>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm text-gray-600">
                                  {Math.round(rec.score)} puan
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Zap className="w-4 h-4 text-green-500" />
                                <span className="text-sm text-gray-600">
                                  %{Math.round(rec.confidence * 100)} güven
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddEnhancedRecommendation(rec)}
                            className="ml-4 w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="capitalize">{rec.category.replace('-', ' ')}</span>
                          <span>•</span>
                          <span>Algoritma skoru: {Math.round(rec.score)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Memnuniyet Skoru */}
              <div className={`p-4 rounded-xl border ${getSatisfactionColor(recommendations.estimatedSatisfaction)}`}>
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-5 h-5" />
                  <span className="font-bold">
                    Sipariş Memnuniyet Skoru: %{recommendations.estimatedSatisfaction}
                  </span>
                </div>
                <p className="text-sm">
                  {recommendations.budgetOptimization}
                </p>
              </div>

              {/* Eksik Kategoriler */}
              {recommendations.missingCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-red-500" />
                    <h4 className="font-bold text-gray-900">
                      Eksik Kategoriler
                    </h4>
                  </div>
                  <div className="grid gap-3">
                    {recommendations.missingCategories.map((category, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-red-800">
                            {category.categoryName}
                          </span>
                          <div className="flex gap-1">
                            {Array.from({ length: category.importance }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-red-500 fill-current" />
                            ))}
                          </div>
                        </div>
                        <p className="text-red-700 text-sm">
                          {category.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Akıllı Öneriler */}
              {recommendations.recommendations.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-bold text-gray-900">
                      Önerilen Ürünler
                    </h4>
                  </div>
                  <div className="grid gap-4">
                    {recommendations.recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <ChefHat className="w-4 h-4 text-blue-500" />
                              <span className="font-bold text-gray-900">
                                {rec.productName}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getUrgencyStyle(rec.urgency)}`}>
                                {rec.urgency}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              {rec.reason}
                            </p>
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold text-blue-600">
                                {rec.price}
                              </span>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4 text-pink-500" />
                                <span className="text-sm text-gray-600">
                                  %{rec.compatibility} uyum
                                </span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddRecommendation(rec.productName)}
                            className="ml-4 w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all duration-200"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mükemmel Kombinasyonlar */}
              {recommendations.perfectCombos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <h4 className="font-bold text-gray-900">
                      Mükemmel Kombinasyonlar
                    </h4>
                  </div>
                  <div className="grid gap-4">
                    {recommendations.perfectCombos.map((combo, index) => (
                      <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Gem className="w-5 h-5 text-yellow-600" />
                          <span className="font-bold text-yellow-800">
                            {combo.title}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {combo.items.map((item, itemIndex) => (
                              <span key={itemIndex} className="bg-white px-3 py-1 rounded-lg text-sm font-medium text-gray-700 border border-yellow-200">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-yellow-800 text-sm mb-3">
                          {combo.why}
                        </p>
                        <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-2 px-4 rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-200">
                          <Gift className="w-4 h-4 inline mr-2" />
                          Kombinasyonu Ekle
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analiz Açıklaması */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Wand2 className="w-4 h-4 text-purple-500" />
                  <span className="font-medium text-gray-800">AI Analizi</span>
                </div>
                <p className="text-sm text-gray-600">
                  {recommendations.reasoning}
                </p>
              </div>

              {/* Tekrar Analiz Et Butonu */}
              <button
                onClick={analyzeCart}
                disabled={isAnalyzing}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Brain className="w-5 h-5" />
                {isAnalyzing ? 'Analiz Ediliyor...' : 'Yeniden Analiz Et'}
              </button>

              {/* Debug Bilgileri - Sadece Development Modunda */}
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-4 rounded-xl text-sm">
                  <h4 className="font-bold mb-2">🔍 Debug Bilgileri:</h4>
                  <div className="space-y-1 text-gray-600">
                    <div>Restaurant ID: {restaurantId || 'Bulunamadı'}</div>
                    <div>Sepet öğe sayısı: {cartItems.length}</div>
                    <div>Mevcut ürün sayısı: {availableProducts.length}</div>
                    <div>Analiz durumu: {isAnalyzing ? 'Yapılıyor' : 'Beklemede'}</div>
                    <div>Öneri durumu: {recommendations ? 'Var' : 'Yok'}</div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
              <p className="text-gray-600 mb-4">
                Henüz analiz yapılmadı
              </p>
              <button
                onClick={analyzeCart}
                className="bg-gradient-to-r from-purple-500 to-blue-600 text-white py-2 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-700 transition-all duration-200"
              >
                Sepeti Analiz Et
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartCartRecommendations; 