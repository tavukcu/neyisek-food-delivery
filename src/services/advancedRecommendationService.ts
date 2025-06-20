import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { geminiService } from './geminiService';

interface UserBehavior {
  userId: string;
  orderHistory: any[];
  preferences: any;
  demographics?: any;
  sessionData: any;
}

interface RecommendationScore {
  productId: string;
  score: number;
  reasons: string[];
  algorithm: string;
  algorithms?: string[];
  confidence: number;
}

interface AdvancedRecommendation {
  productId: string;
  product: any;
  finalScore: number;
  reasons: string[];
  algorithms: string[];
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
  category: 'complementary' | 'similar' | 'trending' | 'personalized' | 'seasonal';
}

export class AdvancedRecommendationService {
  
  // 🎯 Ana Hibrit Öneri Sistemi
  static async getHybridRecommendations(
    userId: string,
    currentCart: any[],
    restaurantId: string,
    availableProducts: any[],
    contextData?: {
      timeOfDay?: string;
      weather?: string;
      season?: string;
      dayOfWeek?: string;
    }
  ): Promise<AdvancedRecommendation[]> {
    
    console.log('🧠 Hibrit AI Öneri Sistemi Başlatılıyor...');
    
    // Kullanıcı davranış verilerini topla
    const userBehavior = await this.getUserBehavior(userId);
    
    // Farklı algoritmaları paralel çalıştır
    const [
      collaborativeScores,
      contentBasedScores,
      contextualScores,
      trendingScores,
      aiGeneratedScores
    ] = await Promise.all([
      this.collaborativeFiltering(userId, availableProducts, userBehavior),
      this.contentBasedFiltering(currentCart, availableProducts),
      this.contextualRecommendations(contextData, availableProducts),
      this.trendingRecommendations(restaurantId, availableProducts),
      this.aiGeneratedRecommendations(currentCart, availableProducts, restaurantId)
    ]);

    // Skorları birleştir ve ağırlıklandır
    const hybridScores = this.combineScores([
      { scores: collaborativeScores, weight: 0.25 },
      { scores: contentBasedScores, weight: 0.20 },
      { scores: contextualScores, weight: 0.15 },
      { scores: trendingScores, weight: 0.15 },
      { scores: aiGeneratedScores, weight: 0.25 }
    ]);

    // Final önerileri oluştur
    const recommendations: AdvancedRecommendation[] = [];
    const cartProductIds = currentCart.map(item => item.productId);
    
    // Skorları sırala
    const sortedScores = Array.from(hybridScores.values())
      .filter(score => !cartProductIds.includes(score.productId))
      .sort((a, b) => b.score - a.score);
    
    for (const score of sortedScores) {
      const product = availableProducts.find(p => p.id === score.productId);
      if (!product) continue;
      
      // Kategori belirleme
      let category: AdvancedRecommendation['category'] = 'personalized';
      const algorithms = score.algorithms || [score.algorithm];
      if (algorithms.includes('trending')) category = 'trending';
      if (algorithms.includes('contextual')) category = 'seasonal';
      if (algorithms.includes('content-based')) category = 'similar';
      if (algorithms.includes('collaborative')) category = 'complementary';
      
      // Aciliyet belirleme
      let urgency: AdvancedRecommendation['urgency'] = 'low';
      if (score.score > 80) urgency = 'high';
      else if (score.score > 60) urgency = 'medium';
      
      recommendations.push({
        productId: score.productId,
        product,
        finalScore: score.score,
        reasons: [...new Set(score.reasons)], // Duplicate'ları kaldır
        algorithms: algorithms,
        confidence: score.confidence,
        urgency,
        category
      });
    }
    
    console.log('🧠 Hibrit Sistem Sonucu:', recommendations.length, 'öneri');
    return recommendations.slice(0, 10); // Top 10
  }

  // 🤝 Collaborative Filtering
  private static async collaborativeFiltering(
    userId: string,
    availableProducts: any[],
    userBehavior: UserBehavior
  ): Promise<RecommendationScore[]> {
    
    console.log('🤝 Collaborative Filtering çalışıyor...');
    
    try {
      // Benzer kullanıcıları bul
      const similarUsers = await this.findSimilarUsers(userId, userBehavior);
      
      // Benzer kullanıcıların siparişlerini analiz et
      const recommendations: RecommendationScore[] = [];
      
      for (const product of availableProducts) {
        let score = 0;
        let reasons: string[] = [];
        
        // Benzer kullanıcıların bu ürünü sipariş etme oranı
        const orderRate = similarUsers.reduce((acc, user) => {
          const hasOrdered = user.orderHistory.some((order: any) => 
            order.items?.some((item: any) => item.productId === product.id)
          );
          return acc + (hasOrdered ? 1 : 0);
        }, 0) / similarUsers.length;
        
        if (orderRate > 0.3) { // %30'dan fazla benzer kullanıcı sipariş ettiyse
          score = orderRate * 100;
          reasons.push(`Benzer kullanıcıların %${Math.round(orderRate * 100)}'i bu ürünü sipariş etti`);
          
          recommendations.push({
            productId: product.id,
            score,
            reasons,
            algorithm: 'collaborative',
            confidence: orderRate
          });
        }
      }
      
      return recommendations;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  // 📊 Content-Based Filtering
  private static async contentBasedFiltering(
    currentCart: any[],
    availableProducts: any[]
  ): Promise<RecommendationScore[]> {
    
    console.log('📊 Content-Based Filtering çalışıyor...');
    
    const recommendations: RecommendationScore[] = [];
    
    if (currentCart.length === 0) return recommendations;
    
    // Sepetteki ürünlerin özelliklerini analiz et
    const cartFeatures = this.extractProductFeatures(currentCart);
    
    for (const product of availableProducts) {
      // Sepette zaten var mı kontrol et
      const alreadyInCart = currentCart.some(item => item.productId === product.id);
      if (alreadyInCart) continue;
      
      const productFeatures = this.extractProductFeatures([{ product }]);
      const similarity = this.calculateFeatureSimilarity(cartFeatures, productFeatures);
      
      if (similarity > 0.6) { // %60'dan fazla benzerlik
        const reasons = this.generateSimilarityReasons(cartFeatures, productFeatures);
        
        recommendations.push({
          productId: product.id,
          score: similarity * 100,
          reasons,
          algorithm: 'content-based',
          confidence: similarity
        });
      }
    }
    
    return recommendations;
  }

  // 🌍 Contextual Recommendations
  private static async contextualRecommendations(
    contextData: any,
    availableProducts: any[]
  ): Promise<RecommendationScore[]> {
    
    console.log('🌍 Contextual Recommendations çalışıyor...');
    
    const recommendations: RecommendationScore[] = [];
    const currentHour = new Date().getHours();
    const currentMonth = new Date().getMonth();
    
    for (const product of availableProducts) {
      let score = 0;
      let reasons: string[] = [];
      
      // Zaman bazlı öneriler
      if (currentHour >= 6 && currentHour <= 11) { // Sabah
        if (product.name.toLowerCase().includes('kahvaltı') || 
            product.name.toLowerCase().includes('çay') ||
            product.name.toLowerCase().includes('börek')) {
          score += 30;
          reasons.push('Sabah saatleri için ideal');
        }
      } else if (currentHour >= 12 && currentHour <= 15) { // Öğle
        if (product.category?.toLowerCase().includes('ana') ||
            product.name.toLowerCase().includes('kebap') ||
            product.name.toLowerCase().includes('pide')) {
          score += 25;
          reasons.push('Öğle yemeği için uygun');
        }
      } else if (currentHour >= 18 && currentHour <= 22) { // Akşam
        if (product.category?.toLowerCase().includes('ana') ||
            product.name.toLowerCase().includes('çorba')) {
          score += 20;
          reasons.push('Akşam yemeği için ideal');
        }
      }
      
      // Mevsimsel öneriler
      if (currentMonth >= 11 || currentMonth <= 2) { // Kış
        if (product.name.toLowerCase().includes('çorba') ||
            product.name.toLowerCase().includes('sıcak')) {
          score += 15;
          reasons.push('Kış mevsimi için sıcacık');
        }
      } else if (currentMonth >= 6 && currentMonth <= 8) { // Yaz
        if (product.name.toLowerCase().includes('salata') ||
            product.name.toLowerCase().includes('soğuk') ||
            product.name.toLowerCase().includes('dondurma')) {
          score += 15;
          reasons.push('Yaz mevsimi için serinletici');
        }
      }
      
      // Hava durumu bazlı (eğer veri varsa)
      if (contextData?.weather === 'rainy' && 
          product.name.toLowerCase().includes('çorba')) {
        score += 20;
        reasons.push('Yağmurlu havada sıcak bir çorba');
      }
      
      if (score > 0) {
        recommendations.push({
          productId: product.id,
          score,
          reasons,
          algorithm: 'contextual',
          confidence: Math.min(score / 50, 1)
        });
      }
    }
    
    return recommendations;
  }

  // 📈 Trending Recommendations
  private static async trendingRecommendations(
    restaurantId: string,
    availableProducts: any[]
  ): Promise<RecommendationScore[]> {
    
    console.log('📈 Trending Recommendations çalışıyor...');
    
    try {
      // Son 7 günün sipariş verilerini al
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const ordersRef = collection(db, 'orders');
      const q = query(
        ordersRef,
        where('restaurantId', '==', restaurantId),
        where('createdAt', '>=', sevenDaysAgo),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(q);
      const orders = ordersSnapshot.docs.map(doc => doc.data());
      
      // Ürün popülerliğini hesapla
      const productPopularity: { [key: string]: number } = {};
      
      orders.forEach(order => {
        order.items?.forEach((item: any) => {
          productPopularity[item.productId] = (productPopularity[item.productId] || 0) + item.quantity;
        });
      });
      
      // En popüler ürünleri öner
      const recommendations: RecommendationScore[] = [];
      const sortedProducts = Object.entries(productPopularity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Top 5 trending
      
      sortedProducts.forEach(([productId, orderCount], index) => {
        const product = availableProducts.find(p => p.id === productId);
        if (product) {
          const score = Math.max(100 - (index * 15), 40); // 100, 85, 70, 55, 40
          
          recommendations.push({
            productId,
            score,
            reasons: [`Son 7 günde ${orderCount} kez sipariş edildi`, 'Trend olan ürün'],
            algorithm: 'trending',
            confidence: Math.min(orderCount / 50, 1)
          });
        }
      });
      
      return recommendations;
    } catch (error) {
      console.error('Trending recommendations error:', error);
      return [];
    }
  }

  // 🤖 AI Generated Recommendations
  private static async aiGeneratedRecommendations(
    currentCart: any[],
    availableProducts: any[],
    restaurantId: string
  ): Promise<RecommendationScore[]> {
    
    console.log('🤖 AI Generated Recommendations çalışıyor...');
    
    try {
      const aiAnalysis = await geminiService.getSmartCartRecommendations(
        currentCart,
        availableProducts,
        restaurantId
      );
      
      if (!aiAnalysis?.recommendations) return [];
      
      const recommendations: RecommendationScore[] = [];
      
      aiAnalysis.recommendations.forEach((rec: any) => {
        const product = availableProducts.find(p => 
          p.name.toLowerCase().includes(rec.productName.toLowerCase()) ||
          rec.productName.toLowerCase().includes(p.name.toLowerCase())
        );
        
        if (product) {
          recommendations.push({
            productId: product.id,
            score: rec.compatibility || 80,
            reasons: [rec.reason],
            algorithm: 'ai-generated',
            confidence: (rec.compatibility || 80) / 100
          });
        }
      });
      
      return recommendations;
    } catch (error) {
      console.error('AI generated recommendations error:', error);
      return [];
    }
  }

  // 🔄 Score Combination
  private static combineScores(
    algorithmResults: { scores: RecommendationScore[], weight: number }[]
  ): Map<string, RecommendationScore> {
    
    console.log('🔄 Skorlar birleştiriliyor...');
    
    const combinedScores = new Map<string, RecommendationScore>();
    
    algorithmResults.forEach(({ scores, weight }) => {
      scores.forEach(score => {
        const existing = combinedScores.get(score.productId);
        
        if (existing) {
          // Mevcut skoru güncelle
          existing.score += score.score * weight;
          existing.reasons.push(...score.reasons);
          if (!existing.algorithms) existing.algorithms = [];
          existing.algorithms.push(score.algorithm);
          existing.confidence = Math.max(existing.confidence, score.confidence);
        } else {
          // Yeni skor ekle
          combinedScores.set(score.productId, {
            ...score,
            score: score.score * weight,
            algorithms: [score.algorithm]
          });
        }
      });
    });
    
    return combinedScores;
  }

  // 🔍 Helper Methods
  private static async getUserBehavior(userId: string): Promise<UserBehavior> {
    // Kullanıcı davranış verilerini Firebase'den al
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('userId', '==', userId), limit(50));
      const ordersSnapshot = await getDocs(q);
      const orderHistory = ordersSnapshot.docs.map(doc => doc.data());
      
      return {
        userId,
        orderHistory,
        preferences: {},
        sessionData: {}
      };
    } catch (error) {
      console.error('Get user behavior error:', error);
      return {
        userId,
        orderHistory: [],
        preferences: {},
        sessionData: {}
      };
    }
  }

  private static async findSimilarUsers(
    userId: string, 
    userBehavior: UserBehavior
  ): Promise<UserBehavior[]> {
    // Basit benzerlik algoritması - production'da daha gelişmiş olmalı
    try {
      const allUsersRef = collection(db, 'orders');
      const q = query(allUsersRef, limit(100));
      const snapshot = await getDocs(q);
      
      // Benzer kullanıcıları bul (basit implementasyon)
      const similarUsers: UserBehavior[] = [];
      const usersByUserId = new Map<string, any[]>();
      
      snapshot.docs.forEach(doc => {
        const order = doc.data();
        if (order.userId !== userId) {
          if (!usersByUserId.has(order.userId)) {
            usersByUserId.set(order.userId, []);
          }
          usersByUserId.get(order.userId)!.push(order);
        }
      });
      
      // İlk 10 kullanıcıyı benzer kabul et (basit yaklaşım)
      let count = 0;
      const userEntries = Array.from(usersByUserId.entries());
      for (const [otherUserId, orders] of userEntries) {
        if (count >= 10) break;
        similarUsers.push({
          userId: otherUserId,
          orderHistory: orders,
          preferences: {},
          sessionData: {}
        });
        count++;
      }
      
      return similarUsers;
    } catch (error) {
      console.error('Find similar users error:', error);
      return [];
    }
  }

  private static extractProductFeatures(items: any[]): any {
    // Ürün özelliklerini çıkar
    const features = {
      categories: new Set<string>(),
      priceRange: { min: Infinity, max: -Infinity },
      keywords: new Set<string>()
    };
    
    items.forEach(item => {
      const product = item.product || item;
      
      if (product.category) {
        features.categories.add(product.category.toLowerCase());
      }
      
      if (product.price) {
        features.priceRange.min = Math.min(features.priceRange.min, product.price);
        features.priceRange.max = Math.max(features.priceRange.max, product.price);
      }
      
      // İsimden anahtar kelimeler çıkar
      if (product.name) {
        const words = product.name.toLowerCase().split(' ');
        words.forEach((word: string) => {
          if (word.length > 2) {
            features.keywords.add(word);
          }
        });
      }
    });
    
    return features;
  }

  private static calculateFeatureSimilarity(features1: any, features2: any): number {
    // Özellik benzerliği hesapla
    let similarity = 0;
    let totalWeight = 0;
    
    // Kategori benzerliği
    const categoryWeight = 0.4;
    const categories1 = Array.from(features1.categories) as string[];
    const categories2 = Array.from(features2.categories) as string[];
    const commonCategories = categories1.filter(x => features2.categories.has(x));
    const totalCategories = new Set([...categories1, ...categories2]);
    const categorySimilarity = totalCategories.size > 0 ? commonCategories.length / totalCategories.size : 0;
    similarity += categorySimilarity * categoryWeight;
    totalWeight += categoryWeight;
    
    // Fiyat benzerliği
    const priceWeight = 0.3;
    if (features1.priceRange.min !== Infinity && features2.priceRange.min !== Infinity) {
      const avgPrice1 = (features1.priceRange.min + features1.priceRange.max) / 2;
      const avgPrice2 = (features2.priceRange.min + features2.priceRange.max) / 2;
      const priceDiff = Math.abs(avgPrice1 - avgPrice2);
      const maxPrice = Math.max(avgPrice1, avgPrice2);
      const priceSimilarity = maxPrice > 0 ? 1 - (priceDiff / maxPrice) : 1;
      similarity += priceSimilarity * priceWeight;
      totalWeight += priceWeight;
    }
    
    // Anahtar kelime benzerliği
    const keywordWeight = 0.3;
    const keywords1 = Array.from(features1.keywords) as string[];
    const keywords2 = Array.from(features2.keywords) as string[];
    const commonKeywords = keywords1.filter(x => features2.keywords.has(x));
    const totalKeywords = new Set([...keywords1, ...keywords2]);
    const keywordSimilarity = totalKeywords.size > 0 ? commonKeywords.length / totalKeywords.size : 0;
    similarity += keywordSimilarity * keywordWeight;
    totalWeight += keywordWeight;
    
    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  private static generateSimilarityReasons(features1: any, features2: any): string[] {
    const reasons: string[] = [];
    
    // Ortak kategoriler
    const categories1 = Array.from(features1.categories) as string[];
    const commonCategories = categories1.filter(x => features2.categories.has(x));
    if (commonCategories.length > 0) {
      reasons.push(`Benzer kategori: ${commonCategories.join(', ')}`);
    }
    
    // Fiyat aralığı
    if (features1.priceRange.min !== Infinity && features2.priceRange.min !== Infinity) {
      const avgPrice1 = (features1.priceRange.min + features1.priceRange.max) / 2;
      const avgPrice2 = (features2.priceRange.min + features2.priceRange.max) / 2;
      if (Math.abs(avgPrice1 - avgPrice2) < 20) {
        reasons.push('Benzer fiyat aralığında');
      }
    }
    
    // Ortak anahtar kelimeler
    const keywords1 = Array.from(features1.keywords) as string[];
    const commonKeywords = keywords1.filter(x => features2.keywords.has(x));
    if (commonKeywords.length > 0) {
      reasons.push(`Ortak özellikler: ${commonKeywords.slice(0, 3).join(', ')}`);
    }
    
    return reasons;
  }
} 