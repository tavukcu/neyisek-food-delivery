'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  HelpCircle, 
  Search, 
  MessageCircle, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  CreditCard,
  Truck,
  UserCheck,
  Shield,
  Settings,
  Zap,
  Award,
  MapPin,
  Calendar,
  ThumbsUp,
  Users,
  Globe,
  Smartphone,
  Headphones,
  BookOpen,
  Target,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);

  const toggleFAQ = (faqId: string) => {
    setExpandedFAQs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const categories: FAQCategory[] = [
    {
      id: 'all',
      title: 'Tüm Kategoriler',
      icon: <Globe className="h-6 w-6" />,
      description: 'Tüm sık sorulan sorular',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'orders',
      title: 'Sipariş İşlemleri',
      icon: <Truck className="h-6 w-6" />,
      description: 'Sipariş verme, takip etme ve iptal',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'payment',
      title: 'Ödeme',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Ödeme yöntemleri ve sorunları',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'delivery',
      title: 'Teslimat',
      icon: <MapPin className="h-6 w-6" />,
      description: 'Teslimat süreleri ve alanları',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'account',
      title: 'Hesap İşlemleri',
      icon: <UserCheck className="h-6 w-6" />,
      description: 'Hesap oluşturma ve yönetimi',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'technical',
      title: 'Teknik Destek',
      icon: <Settings className="h-6 w-6" />,
      description: 'Uygulama ve web sitesi sorunları',
      color: 'from-red-500 to-red-600'
    }
  ];

  const faqData: FAQItem[] = [
    {
      id: 'order-1',
      question: 'Nasıl sipariş verebilirim?',
      answer: 'Sipariş vermek için önce hesabınıza giriş yapın, ardından menüden istediğiniz yemekleri seçin ve sepete ekleyin. Sepet sayfasında teslimat adresinizi ve ödeme yönteminizi seçerek siparişinizi tamamlayabilirsiniz.',
      category: 'orders',
      tags: ['sipariş', 'nasıl', 'başlangıç']
    },
    {
      id: 'order-2',
      question: 'Siparişimi nasıl takip edebilirim?',
      answer: 'Siparişinizi "Siparişlerim" sayfasından takip edebilirsiniz. Ayrıca sipariş durumu değişikliklerinde SMS ve e-posta bildirimleri alacaksınız.',
      category: 'orders',
      tags: ['takip', 'sipariş', 'durum']
    },
    {
      id: 'order-3',
      question: 'Siparişimi iptal edebilir miyim?',
      answer: 'Siparişiniz hazırlanmaya başlamadan önce iptal edebilirsiniz. İptal işlemi için "Siparişlerim" sayfasından iptal butonuna tıklayın veya müşteri hizmetleri ile iletişime geçin.',
      category: 'orders',
      tags: ['iptal', 'sipariş']
    },
    {
      id: 'payment-1',
      question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
      answer: 'Kredi kartı, banka kartı, nakit ödeme ve dijital cüzdan seçeneklerini kabul ediyoruz. Tüm kart ödemeleri güvenli SSL teknolojisi ile korunmaktadır.',
      category: 'payment',
      tags: ['ödeme', 'kart', 'nakit']
    },
    {
      id: 'payment-2',
      question: 'Ödeme güvenli mi?',
      answer: 'Evet, tüm ödeme işlemleri 256-bit SSL şifreleme ile korunmaktadır. Kart bilgileriniz güvenli sunucularda saklanır ve üçüncü taraflarla paylaşılmaz.',
      category: 'payment',
      tags: ['güvenlik', 'ssl', 'kart']
    },
    {
      id: 'delivery-1',
      question: 'Teslimat süresi ne kadar?',
      answer: 'Ortalama teslimat süremiz 30-45 dakikadır. Yoğun saatlerde bu süre 60 dakikaya kadar çıkabilir. Teslimat süresi sipariş verirken size bildirilir.',
      category: 'delivery',
      tags: ['teslimat', 'süre', 'dakika']
    },
    {
      id: 'delivery-2',
      question: 'Hangi bölgelere teslimat yapıyorsunuz?',
      answer: 'Manisa merkez ve çevre ilçelere teslimat yapıyoruz. Teslimat alanlarının detaylı listesini "Teslimat Alanları" sayfasından görebilirsiniz.',
      category: 'delivery',
      tags: ['bölge', 'alan', 'manisa']
    },
    {
      id: 'account-1',
      question: 'Nasıl hesap oluşturabilirim?',
      answer: 'Ana sayfadaki "Kayıt Ol" butonuna tıklayarak e-posta adresiniz ve telefon numaranız ile kolayca hesap oluşturabilirsiniz. Sosyal medya hesaplarınızla da giriş yapabilirsiniz.',
      category: 'account',
      tags: ['kayıt', 'hesap', 'üyelik']
    },
    {
      id: 'account-2',
      question: 'Şifremi unuttum, ne yapmalıyım?',
      answer: 'Giriş sayfasındaki "Şifremi Unuttum" linkine tıklayın. E-posta adresinizi girin, size gönderilen link ile yeni şifre oluşturabilirsiniz.',
      category: 'account',
      tags: ['şifre', 'unutma', 'sıfırlama']
    },
    {
      id: 'technical-1',
      question: 'Uygulama çalışmıyor, ne yapmalıyım?',
      answer: 'Önce uygulamayı kapatıp yeniden açmayı deneyin. Sorun devam ederse uygulamayı güncelleyin. Hala çözülmezse cihazınızı yeniden başlatın.',
      category: 'technical',
      tags: ['uygulama', 'sorun', 'çökme']
    },
    {
      id: 'technical-2',
      question: 'Bildirimler gelmiyor?',
      answer: 'Cihaz ayarlarından NeYisek uygulaması için bildirimlerin açık olduğundan emin olun. Ayrıca hesap ayarlarından bildirim tercihlerinizi kontrol edin.',
      category: 'technical',
      tags: ['bildirim', 'ayar', 'izin']
    }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-purple-700/85 to-indigo-800/90"></div>
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-purple-400/15 to-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <HelpCircle className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Yardım Merkezi</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 mb-4">
                Yardım &
              </span>
              <span className="block text-white">
                Destek
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-4xl mx-auto mb-12">
              Sorularınızın cevaplarını bulun, 
              <span className="text-blue-300 font-semibold"> hızlı çözümler</span> 
              keşfedin ve 
              <span className="text-purple-300 font-semibold"> 7/24 destek</span> 
              alın.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sorunuzu yazın veya anahtar kelime girin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 text-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  50+
                </div>
                <div className="text-blue-200 font-medium">SSS</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  7/24
                </div>
                <div className="text-blue-200 font-medium">Canlı Destek</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  2dk
                </div>
                <div className="text-blue-200 font-medium">Ortalama Yanıt</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                  99%
                </div>
                <div className="text-blue-200 font-medium">Çözüm Oranı</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 lg:py-32">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Kategoriler
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Aradığınız konuyu seçin ve hızlıca cevap bulun
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`text-left p-8 rounded-3xl border transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-xl ring-2 ring-blue-500 ring-opacity-50'
                    : 'bg-white border-gray-200 hover:border-blue-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className={`bg-gradient-to-br ${category.color} rounded-2xl p-4 w-fit mb-6`}>
                  <div className="text-white">
                    {category.icon}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {category.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {category.description}
                </p>
                
                <div className="flex items-center gap-2 mt-6 text-blue-600 font-semibold">
                  <span>Sorulara Bak</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="grid lg:grid-cols-golden gap-16 lg:gap-20">
            {/* Sidebar */}
            <div className="lg:order-1">
              <div className="sticky top-8 space-y-6">
                {/* Contact Support */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Headphones className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Canlı Destek</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Anında yardım alın
                    </p>
                    <Link
                      href="/contact"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Sohbet Başlat
                    </Link>
                  </div>
                </div>

                {/* Phone Support */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Telefon Desteği</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      7/24 arayabilirsiniz
                    </p>
                    <a
                      href="tel:08501234567"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      0850 123 45 67
                    </a>
                  </div>
                </div>

                {/* Email Support */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 border border-orange-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">E-posta Desteği</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      24 saat içinde yanıt
                    </p>
                    <a
                      href="mailto:destek@neyisek.com"
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      E-posta Gönder
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ List */}
            <div className="lg:order-2">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedCategory === 'all' ? 'Tüm Sorular' : categories.find(c => c.id === selectedCategory)?.title}
                </h3>
                <p className="text-gray-600">
                  {filteredFAQs.length} soru bulundu
                  {searchTerm && ` "${searchTerm}" için`}
                </p>
              </div>

              <div className="space-y-6">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-300"
                    >
                      <div className="flex items-center gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-3 flex-shrink-0">
                          <HelpCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">
                            {faq.question}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {faq.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 ml-4">
                        {expandedFAQs.includes(faq.id) ? (
                          <ChevronUp className="h-6 w-6 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {expandedFAQs.includes(faq.id) && (
                      <div className="px-8 pb-8">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-200">
                          <p className="text-gray-700 leading-relaxed text-lg">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-100 to-blue-100 rounded-3xl p-12 max-w-md mx-auto">
                    <Search className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Sonuç Bulunamadı
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Aradığınız kriterlere uygun soru bulunamadı. Farklı anahtar kelimeler deneyin.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                    >
                      Tüm Soruları Göster
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container-responsive">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 w-fit mx-auto mb-8">
              <ThumbsUp className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Sorunuz Çözülmedi mi?
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Uzman destek ekibimiz 
              <span className="text-blue-400 font-semibold"> 7/24 hizmetinizde.</span> 
              Anında yardım almak için iletişime geçin.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <MessageCircle className="h-5 w-5" />
                Canlı Destek
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <a
                href="tel:08501234567"
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <Phone className="h-5 w-5" />
                Hemen Ara
                <ArrowRight className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 