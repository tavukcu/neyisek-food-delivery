import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Arama sorgusu boş olamaz'
      }, { status: 400 });
    }

    // Gemini AI ile doğal dil arama
    const searchResults = await geminiService.processNaturalLanguageSearch(query);

    if (!searchResults) {
      return NextResponse.json({
        success: false,
        message: 'AI arama servisi şu anda kullanılamıyor',
        fallbackSearch: {
          foodType: [query],
          priceRange: 'orta',
          features: [],
          restaurantType: '',
          deliveryPreference: '',
          timePreference: '',
          confidence: 0.5
        }
      }, { status: 200 });
    }

    // Analytics için kaydet
    console.log('🔍 AI Search Request:', {
      timestamp: new Date().toISOString(),
      query: query,
      userAgent: request.headers.get('user-agent'),
      responseAvailable: !!searchResults
    });

    return NextResponse.json({
      success: true,
      query: query,
      searchResults: searchResults,
      timestamp: new Date().toISOString(),
      aiProvider: 'Gemini'
    });

  } catch (error) {
    console.error('AI Search API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Arama işlemi sırasında hata oluştu',
      fallbackSearch: {
        foodType: ['genel'],
        priceRange: 'orta',
        features: [],
        restaurantType: '',
        deliveryPreference: '',
        timePreference: '',
        confidence: 0.3
      }
    }, { status: 500 });
  }
} 