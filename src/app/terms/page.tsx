'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  Scale, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe, 
  CreditCard, 
  Truck, 
  UserCheck,
  Lock,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Gavel,
  BookOpen,
  Users,
  Settings,
  Bell,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  AlertCircle,
  Star
} from 'lucide-react';
import Link from 'next/link';

interface TermsSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  subsections?: {
    title: string;
    content: string[];
  }[];
}

export default function TermsPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const termsData: TermsSection[] = [
    {
      id: 'overview',
      title: 'Genel Hükümler',
      icon: <BookOpen className="h-6 w-6" />,
      content: [
        'Bu Kullanım Şartları, NeYisek.com platformunu kullanırken uymanız gereken kuralları belirler.',
        'Platformumuzu kullanarak bu şartları kabul etmiş sayılırsınız.',
        'Şartlarımız zaman zaman güncellenebilir ve değişiklikler derhal yürürlüğe girer.',
        'Güncel şartları düzenli olarak kontrol etmeniz önerilir.'
      ]
    },
    {
      id: 'definitions',
      title: 'Tanımlar',
      icon: <Info className="h-6 w-6" />,
      content: [
        'Platform: NeYisek.com web sitesi ve mobil uygulamaları',
        'Kullanıcı: Platformu kullanan gerçek veya tüzel kişiler',
        'Restoran Ortağı: Platformda hizmet veren işletmeler',
        'Sipariş: Platform üzerinden verilen yemek siparişleri',
        'Hizmet: Platform tarafından sunulan tüm hizmetler'
      ]
    },
    {
      id: 'user-obligations',
      title: 'Kullanıcı Yükümlülükleri',
      icon: <UserCheck className="h-6 w-6" />,
      content: [
        'Doğru ve güncel bilgiler sağlamak',
        'Hesap güvenliğini korumak',
        'Platform kurallarına uymak',
        'Yasalara aykırı davranışlarda bulunmamak'
      ],
      subsections: [
        {
          title: 'Hesap Güvenliği',
          content: [
            'Şifrenizi güvenli tutmak sizin sorumluluğunuzdadır',
            'Hesabınızın yetkisiz kullanımını derhal bildirmelisiniz',
            'Hesap bilgilerinizi üçüncü kişilerle paylaşmamalısınız'
          ]
        },
        {
          title: 'Yasaklı Davranışlar',
          content: [
            'Sahte bilgi vermek',
            'Sistemi manipüle etmeye çalışmak',
            'Diğer kullanıcıları rahatsız etmek',
            'Telif haklarını ihlal etmek'
          ]
        }
      ]
    },
    {
      id: 'orders',
      title: 'Sipariş Koşulları',
      icon: <Truck className="h-6 w-6" />,
      content: [
        'Siparişler onaylandıktan sonra bağlayıcıdır',
        'Ödeme işlemi tamamlanmadan sipariş kesinleşmez',
        'Teslimat süreleri tahminidir ve değişebilir',
        'Sipariş iptali belirli koşullarda mümkündür'
      ],
      subsections: [
        {
          title: 'Sipariş İptali',
          content: [
            'Hazırlık başlamadan önce iptal edilebilir',
            'İptal işlemi için müşteri hizmetleri ile iletişime geçin',
            'İade süreci 3-5 iş günü sürebilir'
          ]
        },
        {
          title: 'Teslimat',
          content: [
            'Teslimat adresi doğru ve eksiksiz olmalıdır',
            'Teslimat sırasında hazır bulunmalısınız',
            'Geç teslimat durumunda bilgilendirileceksiniz'
          ]
        }
      ]
    },
    {
      id: 'payment',
      title: 'Ödeme Koşulları',
      icon: <CreditCard className="h-6 w-6" />,
      content: [
        'Tüm ödemeler güvenli SSL teknolojisi ile korunur',
        'Kredi kartı, banka kartı ve nakit ödeme seçenekleri mevcuttur',
        'Ödeme bilgileriniz şifrelenerek saklanır',
        'Hatalı ödemeler için müşteri hizmetleri ile iletişime geçin'
      ]
    },
    {
      id: 'privacy',
      title: 'Gizlilik ve Veri Koruma',
      icon: <Shield className="h-6 w-6" />,
      content: [
        'Kişisel verileriniz KVKK kapsamında korunur',
        'Verileriniz sadece hizmet sunumu için kullanılır',
        'Üçüncü taraflarla paylaşım sınırlıdır',
        'Veri silme talebinde bulunabilirsiniz'
      ]
    },
    {
      id: 'liability',
      title: 'Sorumluluk Sınırları',
      icon: <Scale className="h-6 w-6" />,
      content: [
        'Platform aracılık hizmeti sunar',
        'Yemek kalitesi restoran ortağının sorumluluğundadır',
        'Teknik arızalar için en kısa sürede çözüm sağlanır',
        'Mücbir sebep durumlarında sorumluluk sınırlıdır'
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Fikri Mülkiyet',
      icon: <Lock className="h-6 w-6" />,
      content: [
        'Platform içeriği telif hakları ile korunur',
        'İzinsiz kullanım yasaktır',
        'Kullanıcı içerikleri için lisans verilir',
        'İhlal durumunda yasal işlem başlatılır'
      ]
    },
    {
      id: 'termination',
      title: 'Hesap Kapatma',
      icon: <AlertTriangle className="h-6 w-6" />,
      content: [
        'Hesabınızı istediğiniz zaman kapatabilirsiniz',
        'Kural ihlali durumunda hesap askıya alınabilir',
        'Kapatılan hesaplar için veri silme işlemi yapılır',
        'Bekleyen siparişler tamamlandıktan sonra kapatma gerçekleşir'
      ]
    },
    {
      id: 'changes',
      title: 'Değişiklikler',
      icon: <Settings className="h-6 w-6" />,
      content: [
        'Kullanım şartları güncellenebilir',
        'Önemli değişiklikler e-posta ile bildirilir',
        'Güncel şartlar web sitesinde yayınlanır',
        'Değişikliklere itiraz durumunda hesap kapatabilirsiniz'
      ]
    },
    {
      id: 'contact',
      title: 'İletişim',
      icon: <Mail className="h-6 w-6" />,
      content: [
        'Sorularınız için müşteri hizmetleri ile iletişime geçin',
        'E-posta: info@neyisek.com',
        'Telefon: 0850 123 45 67',
        'Adres: Manisa Merkez, Türkiye'
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-indigo-800 to-purple-900 py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-indigo-700/85 to-purple-800/90"></div>
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-indigo-400/15 to-blue-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <Scale className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Yasal Belgeler</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 mb-4">
                Kullanım
              </span>
              <span className="block text-white">
                Şartları
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-blue-100 leading-relaxed max-w-4xl mx-auto mb-12">
              NeYisek.com platformunu kullanırken uymanız gereken 
              <span className="text-blue-300 font-semibold"> kurallar ve koşullar</span>, 
              haklarınız ve sorumluluklarınız hakkında 
              <span className="text-purple-300 font-semibold"> detaylı bilgiler.</span>
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  11
                </div>
                <div className="text-blue-200 font-medium">Ana Bölüm</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  KVKK
                </div>
                <div className="text-blue-200 font-medium">Uyumlu</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  7/24
                </div>
                <div className="text-blue-200 font-medium">Hukuki Destek</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                  2024
                </div>
                <div className="text-blue-200 font-medium">Son Güncelleme</div>
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
                    <FileText className="h-6 w-6 text-blue-600" />
                    İçindekiler
                  </h3>
                  
                  <nav className="space-y-2">
                    {termsData.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${
                          activeSection === section.id ? 'text-white' : 'text-blue-600'
                        }`}>
                          {section.icon}
                        </div>
                        <span className="font-medium text-sm">{section.title}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Quick Contact */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Hukuki Destek</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Kullanım şartları hakkında sorularınız için
                    </p>
                    <Link
                      href="/contact"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      İletişime Geç
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:order-2 space-y-8">
              {termsData.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={`bg-white rounded-3xl shadow-xl border border-gray-100 transition-all duration-500 ${
                    activeSection === section.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 rounded-t-3xl transition-colors duration-300"
                  >
                    <div className="flex items-center gap-6">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 flex-shrink-0">
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
                            <div key={index} className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-2xl p-6 border border-gray-200">
                              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                {subsection.title}
                              </h4>
                              <div className="space-y-3">
                                {subsection.content.map((item, itemIndex) => (
                                  <div key={itemIndex} className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-3 flex-shrink-0"></div>
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

      {/* Important Notice */}
      <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50 border-t border-amber-200">
        <div className="container-responsive">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 w-fit mx-auto mb-8">
              <AlertCircle className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              Önemli Uyarı
            </h2>
            
            <div className="bg-white rounded-3xl shadow-xl border border-amber-200 p-8 text-left">
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p className="text-lg">
                  <strong className="text-amber-600">Son Güncelleme:</strong> 15 Aralık 2024
                </p>
                <p>
                  Bu kullanım şartları, NeYisek.com platformunu kullanımınızı düzenler. 
                  Platformu kullanmaya devam ederek bu şartları kabul etmiş sayılırsınız.
                </p>
                <p>
                  Şartlarımızda yapılan değişiklikler derhal yürürlüğe girer ve 
                  e-posta yoluyla bilgilendirilirsiniz.
                </p>
                <p className="font-semibold text-amber-700">
                  Herhangi bir sorunuz varsa, lütfen müşteri hizmetlerimiz ile iletişime geçin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container-responsive">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 w-fit mx-auto mb-8">
              <Gavel className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Sorularınız mı Var?
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Kullanım şartları hakkında detaylı bilgi almak için 
              <span className="text-blue-400 font-semibold"> hukuk ekibimizle iletişime geçin.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <Mail className="h-5 w-5" />
                Hukuki Destek
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                href="/privacy"
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <Shield className="h-5 w-5" />
                Gizlilik Politikası
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 