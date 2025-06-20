'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  Shield, 
  Lock, 
  Eye, 
  Database, 
  UserCheck, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Users,
  Settings,
  Trash2,
  Download,
  Share2,
  Bell,
  CreditCard,
  Smartphone,
  Wifi,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface PolicySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  subsections?: {
    title: string;
    content: string[];
  }[];
}

export default function PrivacyPolicyPage() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const policySections: PolicySection[] = [
    {
      id: 'overview',
      title: 'Genel Bakış',
      icon: <Eye className="h-6 w-6" />,
      content: [
        'NeYisek.com olarak, kişisel verilerinizin güvenliği ve gizliliği bizim için en önemli önceliktir.',
        'Bu Gizlilik Politikası, kişisel verilerinizi nasıl topladığımızı, kullandığımızı, sakladığımızı ve koruduğumuzu açıklar.',
        'Hizmetlerimizi kullanarak, bu politikada belirtilen uygulamaları kabul etmiş olursunuz.'
      ]
    },
    {
      id: 'data-collection',
      title: 'Veri Toplama',
      icon: <Database className="h-6 w-6" />,
      content: [
        'Hizmetlerimizi sunabilmek için aşağıdaki kişisel verilerinizi topluyoruz:'
      ],
      subsections: [
        {
          title: 'Hesap Bilgileri',
          content: [
            'Ad, soyad, e-posta adresi, telefon numarası',
            'Doğum tarihi ve cinsiyet (isteğe bağlı)',
            'Profil fotoğrafı (isteğe bağlı)'
          ]
        },
        {
          title: 'Sipariş Bilgileri',
          content: [
            'Teslimat adresi ve fatura bilgileri',
            'Ödeme yöntemi bilgileri (güvenli şekilde şifrelenir)',
            'Sipariş geçmişi ve tercihleri'
          ]
        },
        {
          title: 'Teknik Veriler',
          content: [
            'IP adresi, tarayıcı türü ve sürümü',
            'Cihaz bilgileri ve işletim sistemi',
            'Konum bilgileri (izin verdiğiniz takdirde)'
          ]
        }
      ]
    },
    {
      id: 'data-usage',
      title: 'Veri Kullanımı',
      icon: <Settings className="h-6 w-6" />,
      content: [
        'Topladığımız kişisel verilerinizi aşağıdaki amaçlarla kullanırız:'
      ],
      subsections: [
        {
          title: 'Hizmet Sunumu',
          content: [
            'Sipariş işlemlerini gerçekleştirmek',
            'Teslimat ve müşteri hizmetleri sağlamak',
            'Ödeme işlemlerini güvenli şekilde yönetmek'
          ]
        },
        {
          title: 'İletişim',
          content: [
            'Sipariş durumu hakkında bilgilendirme',
            'Promosyon ve kampanya duyuruları (onay verdiğiniz takdirde)',
            'Müşteri destek hizmetleri'
          ]
        },
        {
          title: 'Geliştirme',
          content: [
            'Hizmet kalitesini artırmak',
            'Kişiselleştirilmiş öneriler sunmak',
            'Güvenlik ve dolandırıcılık önleme'
          ]
        }
      ]
    },
    {
      id: 'data-sharing',
      title: 'Veri Paylaşımı',
      icon: <Share2 className="h-6 w-6" />,
      content: [
        'Kişisel verilerinizi aşağıdaki durumlar dışında üçüncü taraflarla paylaşmayız:'
      ],
      subsections: [
        {
          title: 'Hizmet Ortakları',
          content: [
            'Ödeme işlemcileri (güvenli ödeme için)',
            'Teslimat şirketleri (sipariş teslimatı için)',
            'Teknoloji sağlayıcıları (altyapı hizmetleri için)'
          ]
        },
        {
          title: 'Yasal Yükümlülükler',
          content: [
            'Yasal zorunluluklar gereği',
            'Mahkeme kararları doğrultusunda',
            'Güvenlik ve dolandırıcılık önleme amacıyla'
          ]
        }
      ]
    },
    {
      id: 'data-security',
      title: 'Veri Güvenliği',
      icon: <Lock className="h-6 w-6" />,
      content: [
        'Verilerinizin güvenliği için en üst düzey güvenlik önlemlerini alıyoruz:'
      ],
      subsections: [
        {
          title: 'Teknik Güvenlik',
          content: [
            '256-bit SSL şifreleme ile veri aktarımı',
            'Güvenli sunucu altyapısı ve firewall koruması',
            'Düzenli güvenlik güncellemeleri ve testleri'
          ]
        },
        {
          title: 'Erişim Kontrolü',
          content: [
            'Sınırlı personel erişimi ve yetkilendirme',
            'İki faktörlü kimlik doğrulama',
            'Düzenli erişim denetimleri'
          ]
        },
        {
          title: 'Veri Yedekleme',
          content: [
            'Otomatik veri yedekleme sistemleri',
            'Felaket kurtarma planları',
            'Veri bütünlüğü kontrolleri'
          ]
        }
      ]
    },
    {
      id: 'user-rights',
      title: 'Kullanıcı Hakları',
      icon: <UserCheck className="h-6 w-6" />,
      content: [
        'KVKK ve GDPR kapsamında aşağıdaki haklarınız bulunmaktadır:'
      ],
      subsections: [
        {
          title: 'Erişim Hakkı',
          content: [
            'Hangi kişisel verilerinizin işlendiğini öğrenme',
            'Veri işleme amaçlarını sorgulama',
            'Verilerinizin kopyasını talep etme'
          ]
        },
        {
          title: 'Düzeltme Hakkı',
          content: [
            'Yanlış veya eksik bilgileri düzeltme',
            'Güncel olmayan verileri güncelleme',
            'Profil bilgilerini değiştirme'
          ]
        },
        {
          title: 'Silme Hakkı',
          content: [
            'Hesabınızı tamamen silme',
            'Belirli verilerin silinmesini talep etme',
            'İşleme itiraz etme ve durdurma'
          ]
        }
      ]
    },
    {
      id: 'cookies',
      title: 'Çerez Politikası',
      icon: <Globe className="h-6 w-6" />,
      content: [
        'Web sitemizde kullanıcı deneyimini iyileştirmek için çerezler kullanıyoruz:'
      ],
      subsections: [
        {
          title: 'Zorunlu Çerezler',
          content: [
            'Site işlevselliği için gerekli çerezler',
            'Güvenlik ve kimlik doğrulama çerezleri',
            'Alışveriş sepeti ve oturum çerezleri'
          ]
        },
        {
          title: 'Analitik Çerezler',
          content: [
            'Site kullanım istatistikleri',
            'Performans analizi ve optimizasyon',
            'Kullanıcı davranış analizi'
          ]
        },
        {
          title: 'Pazarlama Çerezleri',
          content: [
            'Kişiselleştirilmiş reklamlar',
            'Sosyal medya entegrasyonu',
            'Kampanya etkinlik ölçümü'
          ]
        }
      ]
    },
    {
      id: 'contact',
      title: 'İletişim',
      icon: <Mail className="h-6 w-6" />,
      content: [
        'Gizlilik politikamız hakkında sorularınız için bizimle iletişime geçebilirsiniz:'
      ],
      subsections: [
        {
          title: 'İletişim Bilgileri',
          content: [
            'E-posta: privacy@neyisek.com',
            'Telefon: 0 236 7684106',
            'Adres: Ahmetli/Manisa/TÜRKİYE'
          ]
        },
        {
          title: 'Veri Koruma Sorumlusu',
          content: [
            'KVKK kapsamında veri koruma sorumlumuza ulaşabilirsiniz',
            'E-posta: dpo@neyisek.com',
            'Yanıt süresi: En geç 30 gün içinde'
          ]
        }
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 via-emerald-700/85 to-teal-800/90"></div>
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-blue-400/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-green-400/15 to-emerald-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <Shield className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Gizlilik ve Güvenlik</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 mb-4">
                Gizlilik
              </span>
              <span className="block text-white">
                Politikası
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-green-100 leading-relaxed max-w-4xl mx-auto mb-12">
              Kişisel verilerinizin güvenliği bizim için en önemli önceliktir. 
              <span className="text-blue-300 font-semibold"> KVKK ve GDPR</span> uyumlu 
              veri koruma politikamızı inceleyin.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  256-bit
                </div>
                <div className="text-green-200 font-medium">SSL Şifreleme</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  KVKK
                </div>
                <div className="text-green-200 font-medium">Uyumlu</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  7/24
                </div>
                <div className="text-green-200 font-medium">Güvenlik</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 lg:py-32">
        <div className="container-responsive">
          {/* Golden Ratio Grid Layout */}
          <div className="grid lg:grid-cols-golden gap-16 lg:gap-20">
            
            {/* Left Column - Navigation (Golden Ratio: 1 part) */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-green-600" />
                  İçindekiler
                </h3>
                
                <nav className="space-y-3">
                  {policySections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 text-left group ${
                        activeSection === section.id
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                          : 'hover:bg-gray-50 text-gray-700 hover:text-green-600'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${
                        activeSection === section.id ? 'text-white' : 'text-green-600'
                      }`}>
                        {section.icon}
                      </div>
                      <span className="font-medium">{section.title}</span>
                      <ArrowRight className={`h-4 w-4 ml-auto transition-transform duration-300 ${
                        activeSection === section.id ? 'translate-x-1' : 'group-hover:translate-x-1'
                      }`} />
                    </button>
                  ))}
                </nav>

                {/* Contact CTA */}
                <div className="mt-12 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Mail className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Sorularınız mı var?</h4>
                    <p className="text-gray-600 mb-4 text-sm">
                      Gizlilik politikamız hakkında detaylı bilgi için iletişime geçin.
                    </p>
                    <Link
                      href="/contact"
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Mail className="h-4 w-4" />
                      İletişim
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Content (Golden Ratio: 1.618 part) */}
            <div className="space-y-12">
              {/* Last Updated Info */}
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-yellow-500 rounded-xl p-3 flex-shrink-0">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Son Güncelleme</h3>
                    <p className="text-gray-700">
                      Bu gizlilik politikası <span className="font-semibold">15 Aralık 2024</span> tarihinde güncellenmiştir.
                      Değişiklikler hakkında e-posta ile bilgilendirileceksiniz.
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Sections */}
              {policySections.map((section, index) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-8 text-left hover:bg-gray-50 transition-colors duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 flex-shrink-0">
                          <div className="text-white">
                            {section.icon}
                          </div>
                        </div>
                        <div>
                          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            {section.title}
                          </h2>
                          <p className="text-gray-600">
                            {section.content[0]}
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
                    </div>
                  </button>

                  {expandedSections.includes(section.id) && (
                    <div className="px-8 pb-8">
                      <div className="border-t border-gray-100 pt-8">
                        {/* Main Content */}
                        <div className="space-y-6">
                          {section.content.slice(1).map((paragraph, idx) => (
                            <p key={idx} className="text-gray-700 leading-relaxed text-lg">
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        {/* Subsections */}
                        {section.subsections && (
                          <div className="mt-10 space-y-8">
                            {section.subsections.map((subsection, idx) => (
                              <div key={idx} className="bg-gray-50 rounded-2xl p-6">
                                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                  {subsection.title}
                                </h4>
                                <ul className="space-y-3">
                                  {subsection.content.map((item, itemIdx) => (
                                    <li key={itemIdx} className="flex items-start gap-3 text-gray-700">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="leading-relaxed">{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Bottom CTA */}
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-12 text-center">
                <div className="max-w-3xl mx-auto">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 w-fit mx-auto mb-8">
                    <Shield className="h-12 w-12 text-white" />
                  </div>
                  
                  <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
                    Verileriniz Güvende
                  </h3>
                  
                  <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    En üst düzey güvenlik önlemleri ile kişisel verilerinizi koruyoruz. 
                    Sorularınız için 7/24 destek ekibimiz hizmetinizde.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/contact"
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
                    >
                      <Mail className="h-5 w-5" />
                      İletişime Geç
                    </Link>
                    
                    <Link
                      href="/account"
                      className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
                    >
                      <Settings className="h-5 w-5" />
                      Hesap Ayarları
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 