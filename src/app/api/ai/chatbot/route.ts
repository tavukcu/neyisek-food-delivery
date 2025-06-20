import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Mesaj boş olamaz'
      }, { status: 400 });
    }

    // Gemini AI ile chatbot yanıtı
    const chatbotResponse = await geminiService.generateChatbotResponse(message, context);

    if (!chatbotResponse) {
      return NextResponse.json({
        success: true,
        response: 'Merhaba! Size nasıl yardımcı olabilirim? Menümüzü inceleyebilir, sipariş verebilir veya sorularınızı sorabilirsiniz.',
        aiAvailable: false,
        timestamp: new Date().toISOString()
      });
    }

    // Analytics için kaydet
    console.log('💬 AI Chatbot Request:', {
      timestamp: new Date().toISOString(),
      messageLength: message.length,
      hasContext: !!context,
      userAgent: request.headers.get('user-agent')
    });

    return NextResponse.json({
      success: true,
      response: chatbotResponse,
      aiAvailable: true,
      timestamp: new Date().toISOString(),
      aiProvider: 'Gemini'
    });

  } catch (error) {
    console.error('AI Chatbot API Error:', error);
    
    return NextResponse.json({
      success: true,
      response: 'Üzgünüm, şu anda size tam olarak yardımcı olamıyorum. Ancak menümüzü inceleyebilir, sipariş verebilir veya müşteri hizmetlerimizle iletişime geçebilirsiniz.',
      aiAvailable: false,
      error: 'AI servisi geçici olarak kullanılamıyor',
      timestamp: new Date().toISOString()
    });
  }
} 