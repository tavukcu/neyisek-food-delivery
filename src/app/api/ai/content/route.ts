import { NextRequest, NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, topic, targetAudience } = body;

    if (!type || !topic) {
      return NextResponse.json({
        success: false,
        error: 'Content type ve topic gerekli'
      }, { status: 400 });
    }

    // Valid content types kontrolü
    const validTypes = ['blog', 'social', 'email'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        success: false,
        error: 'Geçerli content type\'ları: blog, social, email'
      }, { status: 400 });
    }

    // Gemini AI ile içerik üretimi
    const generatedContent = await geminiService.generateContent(
      type as 'blog' | 'social' | 'email',
      topic,
      targetAudience
    );

    if (!generatedContent) {
      return NextResponse.json({
        success: false,
        message: 'AI içerik üretimi servisi şu anda kullanılamıyor',
        fallbackContent: {
          type: type,
          topic: topic,
          content: getFallbackContent(type, topic),
          generated: false
        }
      }, { status: 200 });
    }

    // Analytics için kaydet
    console.log('📝 AI Content Generation Request:', {
      timestamp: new Date().toISOString(),
      type: type,
      topic: topic,
      targetAudience: targetAudience || 'Genel',
      contentLength: generatedContent.length,
      userAgent: request.headers.get('user-agent')
    });

    return NextResponse.json({
      success: true,
      content: {
        type: type,
        topic: topic,
        targetAudience: targetAudience || 'Genel',
        generatedContent: generatedContent,
        generated: true,
        timestamp: new Date().toISOString()
      },
      aiProvider: 'Gemini'
    });

  } catch (error) {
    console.error('AI Content Generation API Error:', error);
    
    // body'ye güvenli erişim
    let fallbackType = 'blog';
    let fallbackTopic = 'Genel';
    
    try {
      const errorBody = await request.json();
      fallbackType = errorBody.type || 'blog';
      fallbackTopic = errorBody.topic || 'Genel';
    } catch {
      // JSON parse hatası, varsayılan değerleri kullan
    }
    
    return NextResponse.json({
      success: false,
      error: 'İçerik üretimi sırasında hata oluştu',
      fallbackContent: {
        type: fallbackType,
        topic: fallbackTopic,
        content: 'Üzgünüz, şu anda içerik üretimi yapılamıyor. Lütfen daha sonra tekrar deneyin.',
        generated: false
      }
    }, { status: 500 });
  }
}

// Fallback içerik fonksiyonu
function getFallbackContent(type: string, topic: string): string {
  switch (type) {
    case 'blog':
      return `${topic} Hakkında Blog Yazısı\n\nBu konuda detaylı bir içerik hazırlanacak. AI servisi şu anda kullanılamıyor, ancak editörlerimiz tarafından kaliteli içerik üretilecek.\n\nBlog yazımızda şu konular ele alınacak:\n- ${topic} nedir?\n- Faydaları nelerdir?\n- Nasıl kullanılır?\n- Öneriler ve ipuçları`;
      
    case 'social':
      return `🍽️ ${topic} ile ilgili harika bir paylaşım hazırlıyoruz! \n\n#neyisek #yemek #${topic.toLowerCase()} #lezzet #ankara\n\nTakipte kalın! 👨‍🍳✨`;
      
    case 'email':
      return `Konu: ${topic} - NeYisek'ten Özel Kampanya!\n\nMerhaba,\n\n${topic} konusunda sizin için özel bir kampanya hazırladık. Detaylar için e-postamızı takip edin.\n\nAfiyet olsun!\nNeYisek Ekibi`;
      
    default:
      return `${topic} hakkında içerik üretiliyor...`;
  }
} 