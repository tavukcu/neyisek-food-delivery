import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderItems, 
      restaurantId, 
      restaurantMenu, 
      customerPreferences,
      orderTotal 
    } = body;

    if (!orderItems || !restaurantId || !restaurantMenu) {
      return NextResponse.json({
        success: false,
        error: 'Sipariş bilgileri, restoran ID ve menü gerekli'
      }, { status: 400 });
    }

    // Siparişteki kategorileri analiz et
    const hasMainDish = orderItems.some((item: any) => 
      item.category === 'ana-yemek' || 
      item.category === 'main-dish' ||
      item.category === 'pizza' ||
      item.category === 'burger' ||
      item.category === 'kebab'
    );

    const hasDrink = orderItems.some((item: any) => 
      item.category === 'içecek' || 
      item.category === 'drinks' ||
      item.category === 'beverage'
    );

    const hasDessert = orderItems.some((item: any) => 
      item.category === 'tatlı' || 
      item.category === 'dessert' ||
      item.category === 'sweet'
    );

    // Ana yemek varsa ve içecek/tatlı yoksa öneri yap
    if (hasMainDish && (!hasDrink || !hasDessert)) {
      // Gemini AI ile çapraz satış önerileri
      const crossSellSuggestions = await geminiService.generateCrossSellRecommendations({
        orderItems,
        restaurantMenu,
        missingCategories: {
          needsDrink: !hasDrink,
          needsDessert: !hasDessert
        },
        customerPreferences: customerPreferences || {},
        orderTotal: orderTotal || 0
      });

      if (!crossSellSuggestions) {
        return NextResponse.json({
          success: false,
          message: 'AI çapraz satış servisi şu anda kullanılamıyor',
          fallbackSuggestions: getFallbackSuggestions(restaurantMenu, !hasDrink, !hasDessert)
        }, { status: 200 });
      }

      // Analytics için kaydet
      console.log('🛒 AI Cross-Sell Recommendation:', {
        timestamp: new Date().toISOString(),
        restaurantId: restaurantId,
        orderItemsCount: orderItems.length,
        hasMainDish,
        hasDrink,
        hasDessert,
        orderTotal: orderTotal || 0,
        userAgent: request.headers.get('user-agent')
      });

      return NextResponse.json({
        success: true,
        shouldSuggest: true,
        suggestions: crossSellSuggestions,
        orderAnalysis: {
          hasMainDish,
          hasDrink,
          hasDessert,
          missingCategories: {
            needsDrink: !hasDrink,
            needsDessert: !hasDessert
          }
        },
        timestamp: new Date().toISOString(),
        aiProvider: 'Gemini'
      });

    } else {
      // Çapraz satış önerisi gerekmez
      return NextResponse.json({
        success: true,
        shouldSuggest: false,
        message: 'Sipariş tamamlanmış görünüyor, ek öneri gerekmiyor',
        orderAnalysis: {
          hasMainDish,
          hasDrink,
          hasDessert
        }
      });
    }

  } catch (error) {
    console.error('AI Cross-Sell API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Çapraz satış önerileri oluşturulamadı',
      fallbackSuggestions: {
        drinks: ['Su', 'Kola', 'Ayran'],
        desserts: ['Sütlaç', 'Baklava', 'Dondurma'],
        message: 'Siparişinizi tamamlamak için içecek ve tatlı eklemeyi unutmayın!'
      }
    }, { status: 500 });
  }
}

// Fallback öneriler fonksiyonu
function getFallbackSuggestions(restaurantMenu: any, needsDrink: boolean, needsDessert: boolean) {
  const suggestions: any = {
    message: 'Siparişinizi bu lezzetlerle tamamlayın!',
    drinks: [],
    desserts: []
  };

  if (needsDrink && restaurantMenu.drinks) {
    suggestions.drinks = restaurantMenu.drinks.slice(0, 3).map((drink: any) => ({
      name: drink.name,
      price: drink.price,
      description: drink.description || 'Ferahlatıcı içecek'
    }));
  }

  if (needsDessert && restaurantMenu.desserts) {
    suggestions.desserts = restaurantMenu.desserts.slice(0, 3).map((dessert: any) => ({
      name: dessert.name,
      price: dessert.price,
      description: dessert.description || 'Lezzetli tatlı'
    }));
  }

  return suggestions;
} 