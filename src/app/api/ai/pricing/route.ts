import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const pricingData = {
      currentDemand: body.currentDemand || 5, // 1-10 arası
      timeOfDay: body.timeOfDay || new Date().getHours().toString(),
      weather: body.weather || 'normal',
      competitorPrices: body.competitorPrices || [25, 30, 35],
      historicalData: body.historicalData || []
    };

    // Gemini AI ile dinamik fiyatlandırma stratejisi
    const pricingStrategy = await geminiService.generatePricingStrategy(pricingData);

    if (!pricingStrategy) {
      return NextResponse.json({
        success: false,
        message: 'AI fiyatlandırma servisi şu anda kullanılamıyor',
        fallbackStrategy: {
          priceAdjustment: 0,
          campaigns: ['Standart fiyatlandırma aktif'],
          timeBasedDiscounts: [],
          reasoning: 'AI servisi kullanılamıyor, varsayılan fiyatlar uygulanıyor'
        }
      }, { status: 200 });
    }

    // Analytics için kaydet
    console.log('💰 AI Pricing Strategy Request:', {
      timestamp: new Date().toISOString(),
      currentDemand: pricingData.currentDemand,
      timeOfDay: pricingData.timeOfDay,
      userAgent: request.headers.get('user-agent')
    });

    return NextResponse.json({
      success: true,
      pricingData: pricingData,
      strategy: pricingStrategy,
      timestamp: new Date().toISOString(),
      aiProvider: 'Gemini'
    });

  } catch (error) {
    console.error('AI Pricing Strategy API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Fiyatlandırma stratejisi oluşturulamadı',
      fallbackStrategy: {
        priceAdjustment: 0,
        campaigns: ['Standart kampanyalar'],
        timeBasedDiscounts: [
          { time: '12:00-14:00', discount: 10, reason: 'Öğle yemeği kampanyası' },
          { time: '18:00-20:00', discount: 15, reason: 'Akşam yemeği kampanyası' }
        ],
        reasoning: 'Sistem hatası, varsayılan kampanyalar uygulandı'
      }
    }, { status: 500 });
  }
} 