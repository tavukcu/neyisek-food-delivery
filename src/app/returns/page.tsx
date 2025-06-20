'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  RotateCcw, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Phone, 
  Mail, 
  FileText,
  DollarSign,
  Calendar,
  Truck,
  UserCheck,
  AlertCircle,
  Info,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Ban,
  ThumbsUp,
  MessageCircle,
  Zap,
  Award
} from 'lucide-react';
import Link from 'next/link';

interface ReturnSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  subsections?: {
    title: string;
    content: string[];
  }[];
}

export default function ReturnsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const returnsData: ReturnSection[] = [
    {
      id: 'overview',
      title: 'İade ve Değişim Genel Bilgileri',
      icon: <RotateCcw className="h-6 w-6" />,
      content: [
        'NeYisek.com olarak müşteri memnuniyetini ön planda tutuyoruz.',
        'Siparişinizden memnun kalmamanız durumunda iade ve değişim hakkınız bulunmaktadır.',
        'İade süreçlerimiz hızlı, kolay ve müşteri dostu olarak tasarlanmıştır.',
        'Tüm iade talepleri 24 saat içinde değerlendirilir.'
      ]
    },
    {
      id: 'conditions',
      title: 'İade Koşulları',
      icon: <CheckCircle className="h-6 w-6" />,
      content: [
        'Sipariş teslim alındıktan sonra 2 saat içinde iade talebi oluşturulabilir.',
        'Yemekler orijinal ambalajında ve tüketilmemiş olmalıdır.',
        'İade sebebi geçerli ve makul olmalıdır.',
        'Fotoğraf kanıtı gerekli durumlarda talep edilebilir.'
      ],
      subsections: [
        {
          title: 'Geçerli İade Sebepleri',
          content: [
            'Yanlış sipariş teslimi',
            'Yemek kalitesi problemi',
            'Eksik ürün teslimatı',
            'Geç teslimat (60 dakikadan fazla)',
            'Hijyen problemi',
            'Soğuk yemek teslimatı'
          ]
        },
        {
          title: 'İade Edilemeyen Durumlar',
          content: [
            'Kişisel beğeni farklılıkları',
            '2 saatten sonra yapılan talepler',
            'Tüketilmiş yemekler',
            'Özel indirimli siparişler (belirli koşullarda)',
            'Promosyon kodlu siparişler (belirli koşullarda)'
          ]
        }
      ]
    },
    {
      id: 'process',
      title: 'İade Süreci',
      icon: <RefreshCw className="h-6 w-6" />,
      content: [
        'İade talebinizi mobil uygulama veya web sitesi üzerinden oluşturun.',
        'Müşteri hizmetleri ekibimiz talebinizi 30 dakika içinde inceler.',
        'Onaylanan iadeler için ödeme iadesi işlemi başlatılır.',
        'İade tutarı 3-5 iş günü içinde hesabınıza yansır.'
      ],
      subsections: [
        {
          title: 'Adım Adım İade Süreci',
          content: [
            '1. Hesabınıza giriş yapın',
            '2. "Siparişlerim" bölümüne gidin',
            '3. İade etmek istediğiniz siparişi seçin',
            '4. "İade Talebi Oluştur" butonuna tıklayın',
            '5. İade sebebini seçin ve açıklama yazın',
            '6. Gerekirse fotoğraf ekleyin',
            '7. Talebinizi gönderin'
          ]
        }
      ]
    },
    {
      id: 'refund-methods',
      title: 'İade Yöntemleri',
      icon: <CreditCard className="h-6 w-6" />,
      content: [
        'Kredi kartı ile yapılan ödemeler aynı karta iade edilir.',
        'Nakit ödemeler için hesap bilgileriniz talep edilir.',
        'Dijital cüzdan ödemeleri aynı platforma iade edilir.',
        'İade işlemleri bankaya göre 3-7 iş günü sürebilir.'
      ]
    },
    {
      id: 'partial-refund',
      title: 'Kısmi İade',
      icon: <DollarSign className="h-6 w-6" />,
      content: [
        'Siparişin sadece bir kısmında problem varsa kısmi iade yapılabilir.',
        'Problemli ürünlerin tutarı hesaplanarak iade edilir.',
        'Teslimat ücreti duruma göre iade edilir.',
        'Kısmi iade durumunda da aynı süreçler geçerlidir.'
      ]
    },
    {
      id: 'compensation',
      title: 'Tazminat ve Kompanzasyon',
      icon: <Award className="h-6 w-6" />,
      content: [
        'Ciddi kalite problemlerinde ek tazminat sağlanabilir.',
        'Müşteri memnuniyetsizliği durumunda indirim kuponu verilebilir.',
        'Tekrarlayan problemlerde özel çözümler sunulur.',
        'VIP müşterilerimiz için öncelikli çözüm hizmeti.'
      ]
    },
    {
      id: 'timeframes',
      title: 'Zaman Çerçeveleri',
      icon: <Clock className="h-6 w-6" />,
      content: [
        'İade talebi: Teslimat sonrası 2 saat',
        'Talep inceleme: 30 dakika',
        'İade onayı: 2 saat',
        'Ödeme iadesi: 3-5 iş günü',
        'Müşteri bilgilendirme: Anlık SMS/E-posta'
      ]
    },
    {
      id: 'special-cases',
      title: 'Özel Durumlar',
      icon: <Star className="h-6 w-6" />,
      content: [
        'Alerjik reaksiyon durumunda acil iade işlemi.',
        'Hijyen problemi tespit edilirse tam iade + tazminat.',
        'Teknik arıza nedeniyle geç teslimat durumunda otomatik iade.',
        'Hava koşulları nedeniyle iptal edilen siparişler için tam iade.'
      ]
    },
    {
      id: 'prevention',
      title: 'Sorun Önleme',
      icon: <Shield className="h-6 w-6" />,
      content: [
        'Kalite kontrol sistemimiz sürekli geliştirilmektedir.',
        'Restoran ortaklarımız düzenli olarak denetlenmektedir.',
        'Müşteri geri bildirimları analiz edilerek iyileştirmeler yapılır.',
        'Teslimat süreçleri GPS ile takip edilmektedir.'
      ]
    },
    {
      id: 'contact',
      title: 'İletişim ve Destek',
      icon: <MessageCircle className="h-6 w-6" />,
      content: [
        'Müşteri hizmetleri: 7/24 hizmetinizde',
        'Canlı destek: Web sitesi ve mobil uygulama',
        'WhatsApp hattı: 0850 123 45 67',
        'E-posta: iade@neyisek.com'
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50/30">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-900 via-red-800 to-pink-900 py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-600/90 via-red-700/85 to-pink-800/90"></div>
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-orange-400/20 to-red-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-red-400/15 to-orange-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <RotateCcw className="h-5 w-5 text-orange-400" />
              <span className="text-white font-medium">Müşteri Hakları</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 mb-4">
                İade &
              </span>
              <span className="block text-white">
                Değişim
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-orange-100 leading-relaxed max-w-4xl mx-auto mb-12">
              Siparişinizden memnun kalmamanız durumunda 
              <span className="text-orange-300 font-semibold"> hızlı ve kolay iade</span> 
              sürecimizle 
              <span className="text-red-300 font-semibold"> müşteri memnuniyetinizi</span> 
              garanti altına alıyoruz.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400 mb-2">
                  2 Saat
                </div>
                <div className="text-orange-200 font-medium">İade Süresi</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-400 mb-2">
                  30dk
                </div>
                <div className="text-orange-200 font-medium">İnceleme Süresi</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  7/24
                </div>
                <div className="text-orange-200 font-medium">Müşteri Desteği</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  98%
                </div>
                <div className="text-orange-200 font-medium">Çözüm Oranı</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 lg:py-32">
        <div className="container-responsive">
          <div className="grid lg:grid-cols-golden gap-16 lg:gap-20">
            {/* Sidebar Navigation */}
            <div className="lg:order-1">
              <div className="sticky top-8 space-y-4">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <FileText className="h-6 w-6 text-orange-600" />
                    İçindekiler
                  </h3>
                  
                  <nav className="space-y-2">
                    {returnsData.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                            : 'hover:bg-gray-50 text-gray-700 hover:text-orange-600'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${
                          activeSection === section.id ? 'text-white' : 'text-orange-600'
                        }`}>
                          {section.icon}
                        </div>
                        <span className="font-medium text-sm">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 border border-orange-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Zap className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Hızlı İade</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Anında iade talebi oluşturun
                    </p>
                    <Link
                      href="/orders"
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      İade Talebi
                    </Link>
                  </div>
                </div>

                {/* Contact Support */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Canlı Destek</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      7/24 müşteri hizmetleri
                    </p>
                    <Link
                      href="/contact"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Destek Al
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:order-2 space-y-8">
              {returnsData.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={`bg-white rounded-3xl shadow-xl border border-gray-100 transition-all duration-500 ${
                    activeSection === section.id ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-3xl transition-colors duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-4 flex-shrink-0">
                        <div className="text-white">
                          {section.icon}
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                          {section.title}
                        </h2>
                        <p className="text-gray-600">
                          {section.content[0].substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      {expandedSections.includes(section.id) ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedSections.includes(section.id) && (
                    <div className="px-8 pb-8 space-y-6">
                      <div className="space-y-4">
                        {section.content.map((paragraph, index) => (
                          <p key={index} className="text-gray-700 leading-relaxed text-lg">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.subsections && (
                        <div className="space-y-6 mt-8">
                          {section.subsections.map((subsection, index) => (
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-orange-50/30 rounded-2xl p-6 border border-gray-200">
                              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-orange-600" />
                                {subsection.title}
                              </h4>
                              <div className="space-y-3">
                                {subsection.content.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-orange-600 rounded-full mt-3 flex-shrink-0"></div>
                                    <p className="text-gray-700 leading-relaxed">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-orange-50/30">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              İade Süreci Nasıl İşler?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Basit 4 adımda iade sürecinizi tamamlayın
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '1',
                  title: 'Talep Oluştur',
                  description: 'Siparişlerim sayfasından iade talebi oluşturun',
                  icon: <FileText className="h-8 w-8" />,
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  step: '2',
                  title: 'İnceleme',
                  description: 'Talebiniz 30 dakika içinde incelenir',
                  icon: <UserCheck className="h-8 w-8" />,
                  color: 'from-orange-500 to-orange-600'
                },
                {
                  step: '3',
                  title: 'Onay',
                  description: 'Uygun talepler anında onaylanır',
                  icon: <CheckCircle className="h-8 w-8" />,
                  color: 'from-green-500 to-green-600'
                },
                {
                  step: '4',
                  title: 'İade',
                  description: 'Ödemeniz 3-5 iş günü içinde iade edilir',
                  icon: <CreditCard className="h-8 w-8" />,
                  color: 'from-purple-500 to-purple-600'
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`bg-gradient-to-br ${item.color} rounded-3xl p-8 mb-6 mx-auto w-fit`}>
                    <div className="text-white">
                      {item.icon}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                    <div className={`bg-gradient-to-br ${item.color} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-lg mx-auto mb-4`}>
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container-responsive">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 w-fit mx-auto mb-8">
              <ThumbsUp className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Memnuniyetiniz Garantimizdir
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Herhangi bir sorun yaşadığınızda 
              <span className="text-orange-400 font-semibold"> 7/24 müşteri hizmetlerimiz</span> 
              size yardımcı olmaya hazır.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/orders"
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <RotateCcw className="h-5 w-5" />
                İade Talebi Oluştur
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                href="/contact"
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <MessageCircle className="h-5 w-5" />
                Canlı Destek
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 