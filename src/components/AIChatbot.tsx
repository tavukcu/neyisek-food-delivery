'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import { GeminiService } from '@/services/geminiService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'order' | 'recommendation';
  data?: any;
}

interface AIChatbotProps {
  menuItems?: any[];
  onOrderCreate?: (orderData: any) => void;
  className?: string;
}

export default function AIChatbot({ menuItems = [], onOrderCreate, className = '' }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Component yüklendiğinde log
  useEffect(() => {
    console.log('🤖 AIChatbot bileşeni yüklendi!', {
      menuItemsCount: menuItems.length,
      hasOnOrderCreate: !!onOrderCreate,
      className
    });
  }, []);

  // GeminiService'i güvenli şekilde initialize et
  useEffect(() => {
    try {
      console.log('🤖 AI Chatbot başlatılıyor...');
      const service = new GeminiService();
      setGeminiService(service);
      console.log('✅ AI Chatbot başarıyla başlatıldı');
    } catch (error) {
      console.error('❌ AI Chatbot başlatma hatası:', error);
      setGeminiService(null);
    }
  }, []);

  // Başlangıç mesajı
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = geminiService ? 
        `Merhaba! 👋 Ben AI sipariş asistanınızım. Size nasıl yardımcı olabilirim?

🍕 Sipariş vermek için: "Bir pizza ve kola istiyorum"
🎯 Öneri almak için: "Bugün ne yesem?"
❓ Sorular için: "Menüde neler var?"

Hadi başlayalım! 🚀` :
        `Merhaba! 👋 AI asistanım şu anda çevrimdışı, ama yine de size yardımcı olmaya çalışacağım.

Menüden seçim yapabilir veya doğrudan sipariş verebilirsiniz. 

⚠️ AI özellikleri geçici olarak kullanılamıyor.`;

      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
          type: 'text'
        }
      ]);
    }
  }, [messages.length, geminiService]);

  // Mesajları scroll et
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Sipariş işleme kontrolü
      const orderKeywords = ['sipariş', 'istiyorum', 'alabilir', 'pizza', 'burger', 'yemek', 'içecek'];
      const isOrderRequest = orderKeywords.some(keyword => 
        userMessage.content.toLowerCase().includes(keyword)
      );

      let aiResponse: string;
      let responseType: 'text' | 'order' | 'recommendation' = 'text';
      let responseData: any = null;

      console.log('🔍 Mesaj analizi:', {
        content: userMessage.content,
        isOrderRequest,
        hasGeminiService: !!geminiService,
        hasMenuItems: menuItems.length > 0
      });

      if (!geminiService) {
        console.warn('⚠️ Gemini servisi kullanılamıyor, çevrimdışı yanıt gönderiliyor');
        
        // Çevrimdışı modda akıllı yanıtlar
        const lowerMessage = userMessage.content.toLowerCase();
        
        if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hi')) {
          aiResponse = `Merhaba! 👋 

AI asistanım şu anda çevrimdışı, ama size yardımcı olmaya devam edebilirim:

🍕 **Menü keşfi:** Lezzetli restoranlarımızı inceleyin
🎯 **Popüler seçimler:** En çok sipariş edilen yemekleri bulun  
⭐ **Değerlendirmeler:** Diğer müşterilerin yorumlarını okuyun
🚀 **Hızlı teslimat:** 30 dakikada kapınızda

Hangi tür yemek arıyorsunuz? Size önerilerde bulunabilirim! 😊`;
        } else if (lowerMessage.includes('ne yesem') || lowerMessage.includes('öneri') || lowerMessage.includes('öner')) {
          aiResponse = `İşte bugün için harika öneriler! 🌟

🍕 **Pizza severler için:** Karışık pizza, sucuklu pizza
🍔 **Hızlı atıştırmalık:** Burger, wrap, sandviç
🥗 **Sağlıklı seçenekler:** Salata, ızgara tavuk
🍜 **Sıcak yemekler:** Köfte, pilav, çorba
🍰 **Tatlı ihtiyacı:** Baklava, dondurma, pasta

Hangi kategoride arama yapmak istersiniz? Menüden istediğinizi seçebilirsiniz! 🎯`;
        } else if (lowerMessage.includes('sipariş') || lowerMessage.includes('pizza') || lowerMessage.includes('burger')) {
          aiResponse = `Sipariş vermek istiyorsunuz! 🛒

Şu an AI asistanım çevrimdışı, ama sipariş vermenin kolay yolları:

1. **Menüye göz atın** - Kategorilere göre düzenlenmiş
2. **Restoran seçin** - Size en yakın olanları bulun
3. **Sepete ekleyin** - Tek tıkla sipariş oluşturun
4. **Güvenli ödeme** - Kredi kartı veya nakit

Hangi tür yemek istiyorsunuz? Size en uygun restoranları gösterebilirim! 🎯`;
        } else if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağol')) {
          aiResponse = `Rica ederim! 😊

AI asistanım çevrimdışı olsa da size yardımcı olmaktan mutluluk duyuyorum. 

Başka bir konuda yardıma ihtiyacınız olursa çekinmeyin! 
Lezzetli yemekler dilerim! 🍽️✨`;
        } else {
          aiResponse = `Anlıyorum! 🤔

AI asistanım şu anda çevrimdışı, ama size yardımcı olabilirim:

📋 **Menü inceleme** - Tüm kategorileri keşfedin
🔍 **Restoran arama** - Konumunuza göre filtreleme  
⭐ **Popüler seçimler** - En beğenilen yemekler
💡 **Öneriler** - Hangi kategoride yardım istiyorsunuz?

Daha spesifik bir soru sorabilir veya menüye göz atabilirsiniz! 😊`;
        }
      } else if (isOrderRequest && menuItems.length > 0) {
        console.log('🍕 Sipariş işleme başlatılıyor...');
        // Sipariş işleme
        const orderResult = await geminiService.processNaturalLanguageOrder(
          userMessage.content,
          menuItems
        );

        console.log('📋 Sipariş sonucu:', orderResult);

        if (orderResult.items.length > 0) {
          responseType = 'order';
          responseData = orderResult;
          aiResponse = orderResult.response || 'Siparişinizi hazırladım! Onaylamak ister misiniz?';
        } else {
          aiResponse = orderResult.response || 'Siparişinizi anlayamadım. Lütfen daha açık belirtir misiniz?';
        }
      } else {
        console.log('💬 Genel sohbet başlatılıyor...');
        // Genel sohbet
        const context = {
          hasMenuItems: menuItems.length > 0,
          userLoggedIn: !!user,
          previousMessages: messages.slice(-3).map(m => ({ role: m.role, content: m.content }))
        };

        aiResponse = await geminiService.chatWithAssistant(userMessage.content, context);
        console.log('💬 AI yanıtı alındı:', aiResponse.substring(0, 100) + '...');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        type: responseType,
        data: responseData
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('AI yanıt hatası:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda bir sorun yaşıyorum. Lütfen tekrar deneyin.',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrderConfirm = (orderData: any) => {
    if (onOrderCreate) {
      onOrderCreate(orderData);
      toast.success('Sipariş sepete eklendi!');
    } else {
      toast.error('Sipariş özelliği şu anda kullanılamıyor.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getQuickActions = () => [
    { text: "Bugün ne yesem?", icon: "🤔" },
    { text: "Popüler yemekleri göster", icon: "⭐" },
    { text: "Hızlı teslimat seçenekleri", icon: "🚀" },
    { text: "Vejetaryen menü", icon: "🥗" }
  ];

  if (!isOpen) {
    console.log('🎯 AI Chatbot butonu render ediliyor');
    return (
      <button
        onClick={() => {
          console.log('🖱️ AI Chatbot butonu tıklandı');
          setIsOpen(true);
        }}
        className={`fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 ${className}`}
      >
        <MessageCircle size={24} />
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          AI
        </div>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-semibold">AI Sipariş Asistanı</h3>
            <p className="text-xs opacity-90">Powered by Gemini AI</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
              <div
                className={`p-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* Sipariş önerisi */}
                {message.type === 'order' && message.data && (
                  <div className="mt-3 space-y-2">
                    {message.data.items.map((item: any, index: number) => (
                      <div key={index} className="bg-white/10 rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm">x{item.quantity}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs opacity-75 mt-1">{item.notes}</p>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => handleOrderConfirm(message.data)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <ShoppingCart size={16} />
                      Sepete Ekle
                    </button>
                  </div>
                )}
              </div>
              
              <div className={`flex items-center gap-2 mt-1 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <Bot size={12} className="text-gray-400" />}
                {message.role === 'user' && <User size={12} className="text-gray-400" />}
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString('tr-TR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md p-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-blue-500" />
              <span className="text-sm text-gray-600">AI düşünüyor...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2">
          <p className="text-xs text-gray-500 mb-2">Hızlı seçenekler:</p>
          <div className="grid grid-cols-2 gap-2">
            {getQuickActions().map((action, index) => (
              <button
                key={index}
                onClick={() => setInput(action.text)}
                className="text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs transition-colors"
              >
                <span className="mr-1">{action.icon}</span>
                {action.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            className="flex-1 p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 