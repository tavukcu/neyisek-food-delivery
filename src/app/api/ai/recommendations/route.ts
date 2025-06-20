import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const userPreferences = {
      previousOrders: body.previousOrders || [],
      dietaryRestrictions: body.dietaryRestrictions || [],
      budget: body.budget || null,
      mood: body.mood || 'normal',
      weather: body.weather || 'unknown',
      timeOfDay: body.timeOfDay || new Date().getHours().toString()
    };

    // Gemini AI ile yemek önerileri al
    const recommendations = await geminiService.generateFoodRecommendations(userPreferences);

    if (!recommendations) {
      return NextResponse.json({
        success: false,
        message: 'AI servisi şu anda kullanılamıyor',
        fallbackRecommendations: [
          {
            name: 'Günün Önerisi',
            reason: 'Popüler seçim',
            priceRange: '₺25-50',
            restaurantType: 'Genel'
          }
        ]
      }, { status: 200 });
    }

    // Analytics için kaydet
    console.log('🤖 AI Recommendation Request:', {
      timestamp: new Date().toISOString(),
      userPreferences,
      responseLength: recommendations.length
    });

    return NextResponse.json({
      success: true,
      recommendations: recommendations,
      timestamp: new Date().toISOString(),
      aiProvider: 'Gemini'
    });

  } catch (error) {
    console.error('AI Recommendations API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Öneriler alınırken hata oluştu',
      fallbackRecommendations: [
        {
          name: 'Karışık Izgara',
          reason: 'Popüler ana yemek seçeneği',
          priceRange: '₺40-60',
          restaurantType: 'Türk Mutfağı'
        },
        {
          name: 'Margherita Pizza',
          reason: 'Klasik ve sevilen lezzet',
          priceRange: '₺30-45',
          restaurantType: 'İtalyan'
        }
      ]
    }, { status: 500 });
  }
} 