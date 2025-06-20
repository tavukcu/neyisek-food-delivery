'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  Heart, 
  Target, 
  Eye, 
  Users, 
  Award, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  ChefHat,
  Truck,
  Shield,
  Star,
  TrendingUp,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Calendar,
  Building,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<'story' | 'mission' | 'team' | 'timeline'>('story');

  const teamMembers: TeamMember[] = [
    {
      name: 'Ahmet Yılmaz',
      role: 'Kurucu & CEO',
      image: '/images/team/ceo.jpg',
      description: 'Gıda sektöründe 15 yıllık deneyime sahip, teknoloji ve lezzeti buluşturan vizyon sahibi.'
    },
    {
      name: 'Fatma Demir',
      role: 'CTO',
      image: '/images/team/cto.jpg',
      description: 'Yazılım geliştirme alanında uzman, kullanıcı deneyimini ön planda tutan teknoloji lideri.'
    },
    {
      name: 'Mehmet Kaya',
      role: 'Operasyon Müdürü',
      image: '/images/team/operations.jpg',
      description: 'Lojistik ve operasyon yönetiminde deneyimli, müşteri memnuniyetini garanti eden profesyonel.'
    },
    {
      name: 'Ayşe Özkan',
      role: 'Pazarlama Müdürü',
      image: '/images/team/marketing.jpg',
      description: 'Dijital pazarlama stratejileri ile markaları büyüten, yaratıcı kampanyaların mimarı.'
    }
  ];

  const milestones: Milestone[] = [
    {
      year: '2020',
      title: 'Kuruluş',
      description: 'NeYisek.com, Manisa\'da küçük bir ekiple yolculuğuna başladı.',
      icon: <Building className="h-6 w-6" />
    },
    {
      year: '2021',
      title: 'İlk 100 Restoran',
      description: 'Platform büyüdü ve 100 restoran ortağımıza ulaştık.',
      icon: <ChefHat className="h-6 w-6" />
    },
    {
      year: '2022',
      title: 'Mobil Uygulama',
      description: 'iOS ve Android uygulamalarımızı kullanıcılarımızla buluşturduk.',
      icon: <Zap className="h-6 w-6" />
    },
    {
      year: '2023',
      title: 'AI Entegrasyonu',
      description: 'Yapay zeka destekli öneri sistemi ve akıllı analitikler devreye girdi.',
      icon: <Target className="h-6 w-6" />
    },
    {
      year: '2024',
      title: 'Bölgesel Lider',
      description: 'Ege Bölgesi\'nin en büyük yemek sipariş platformu olduk.',
      icon: <Award className="h-6 w-6" />
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
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-green-400/15 to-emerald-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <Heart className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-medium">Hikayemiz</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-4">
                Hakkımızda
              </span>
              <span className="block text-white">
                NeYisek.com
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-green-100 leading-relaxed max-w-4xl mx-auto mb-12">
              2020 yılından bu yana 
              <span className="text-yellow-300 font-semibold"> lezzeti teknoloji ile buluşturan</span>, 
              müşteri memnuniyetini ön planda tutan 
              <span className="text-green-300 font-semibold"> güvenilir adresiniz.</span>
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                  500+
                </div>
                <div className="text-green-200 font-medium">Restoran Ortağı</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  50K+
                </div>
                <div className="text-green-200 font-medium">Mutlu Müşteri</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  4.8
                </div>
                <div className="text-green-200 font-medium">Ortalama Puan</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  4
                </div>
                <div className="text-green-200 font-medium">Yıllık Deneyim</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 lg:py-32">
        <div className="container-responsive">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {[
              { id: 'story', label: 'Hikayemiz', icon: <Heart className="h-5 w-5" /> },
              { id: 'mission', label: 'Misyon & Vizyon', icon: <Target className="h-5 w-5" /> },
              { id: 'team', label: 'Ekibimiz', icon: <Users className="h-5 w-5" /> },
              { id: 'timeline', label: 'Tarihçe', icon: <Calendar className="h-5 w-5" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl'
                    : 'bg-white hover:bg-gray-50 text-gray-700 hover:text-green-600 shadow-lg border border-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-w-6xl mx-auto">
            {/* Story Tab */}
            {activeTab === 'story' && (
              <div className="grid lg:grid-cols-golden gap-16 lg:gap-20 items-center">
                <div className="space-y-8">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
                    <div className="flex items-start gap-6 mb-8">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 flex-shrink-0">
                        <Heart className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Başlangıç Hikayemiz</h2>
                        <p className="text-gray-600 leading-relaxed text-lg">
                          2020 yılında Manisa'da küçük bir ekiple başladığımız yolculuğumuzda, 
                          yerel lezzetleri teknoloji ile buluşturma hayali vardı.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-6 text-gray-700 leading-relaxed">
                      <p className="text-lg">
                        Pandemi döneminde restoranların dijital dönüşüm ihtiyacını gören ekibimiz, 
                        hem işletmelere hem de müşterilere değer katacak bir platform yaratmaya karar verdi.
                      </p>
                      
                      <p className="text-lg">
                        İlk günden itibaren <span className="text-green-600 font-semibold">kalite, güvenilirlik ve müşteri memnuniyeti</span> 
                        ilkelerimizle hareket ettik. Bugün 500'den fazla restoran ortağımız ve 50.000'den fazla 
                        mutlu müşterimizle Ege Bölgesi'nin en büyük yemek sipariş platformuyuz.
                      </p>
                      
                      <p className="text-lg">
                        Teknolojiye yaptığımız yatırımlar, AI destekli öneri sistemimiz ve 
                        <span className="text-green-600 font-semibold"> 7/24 müşteri desteğimiz</span> ile 
                        sektörde fark yaratmaya devam ediyoruz.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 border border-yellow-200">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 w-fit mx-auto mb-6">
                        <Award className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Değerlerimiz</h3>
                      <div className="space-y-4">
                        {[
                          'Müşteri Odaklılık',
                          'Kalite ve Güvenilirlik',
                          'Sürekli İnovasyon',
                          'Sosyal Sorumluluk'
                        ].map((value, index) => (
                          <div key={index} className="flex items-center gap-3 justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-gray-700 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 w-fit mx-auto mb-6">
                        <TrendingUp className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Başarılarımız</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">98%</div>
                          <div className="text-sm text-gray-600">Müşteri Memnuniyeti</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">25dk</div>
                          <div className="text-sm text-gray-600">Ortalama Teslimat</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">24/7</div>
                          <div className="text-sm text-gray-600">Müşteri Desteği</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">100%</div>
                          <div className="text-sm text-gray-600">Güvenli Ödeme</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mission & Vision Tab */}
            {activeTab === 'mission' && (
              <div className="grid md:grid-cols-2 gap-12">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 w-fit mx-auto mb-6">
                      <Target className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Misyonumuz</h2>
                  </div>
                  
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <p className="text-lg text-center">
                      <span className="text-green-600 font-semibold">Teknoloji ve lezzeti buluşturarak</span>, 
                      müşterilerimize en kaliteli yemek deneyimini sunmak ve restoran ortaklarımızın 
                      dijital dönüşümüne öncülük etmek.
                    </p>
                    
                    <div className="space-y-4 mt-8">
                      {[
                        'Müşteri memnuniyetini her şeyin üstünde tutmak',
                        'Restoran ortaklarımızın büyümesine katkı sağlamak',
                        'Sürdürülebilir ve çevre dostu hizmet anlayışı',
                        'Yerel ekonomiye değer katmak'
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 w-fit mx-auto mb-6">
                      <Eye className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Vizyonumuz</h2>
                  </div>
                  
                  <div className="space-y-6 text-gray-700 leading-relaxed">
                    <p className="text-lg text-center">
                      <span className="text-blue-600 font-semibold">Türkiye'nin en güvenilir ve yenilikçi</span> 
                      yemek sipariş platformu olarak, gıda teknolojilerinde öncü rol oynamak ve 
                      global pazarda söz sahibi olmak.
                    </p>
                    
                    <div className="space-y-4 mt-8">
                      {[
                        'AI ve makine öğrenmesi ile kişiselleştirilmiş deneyim',
                        'Sürdürülebilir ambalaj ve çevre dostu teslimat',
                        'Blockchain teknolojisi ile şeffaf ödeme sistemi',
                        'Uluslararası pazarlarda Türk mutfağını tanıtmak'
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <Star className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="space-y-16">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">Ekibimiz</h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    Deneyimli ve tutkulu ekibimizle, her gün daha iyi hizmet sunmak için çalışıyoruz.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {teamMembers.map((member, index) => (
                    <div key={index} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center transform hover:scale-105 transition-all duration-300">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <Users className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                      <p className="text-green-600 font-semibold mb-4">{member.role}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{member.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-16">
                <div className="text-center">
                  <h2 className="text-4xl font-bold text-gray-900 mb-6">Yolculuğumuz</h2>
                  <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                    2020'den bugüne kadar geçirdiğimiz önemli kilometre taşları.
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  
                  <div className="space-y-12">
                    {milestones.map((milestone, index) => (
                      <div key={index} className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-3">
                                <div className="text-white">
                                  {milestone.icon}
                                </div>
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-green-600">{milestone.year}</div>
                                <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                              </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                          </div>
                        </div>
                        
                        <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full border-4 border-white shadow-lg z-10"></div>
                        
                        <div className="flex-1"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container-responsive">
          <div className="text-center max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 w-fit mx-auto mb-8">
              <UserCheck className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Bizimle İletişime Geçin
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Sorularınız, önerileriniz veya iş birliği teklifleriniz için 
              <span className="text-green-400 font-semibold"> 7/24 hizmetinizdeyiz.</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <Mail className="h-5 w-5" />
                İletişime Geç
                <ArrowRight className="h-5 w-5" />
              </Link>
              
              <Link
                href="/restaurant-apply"
                className="bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <ChefHat className="h-5 w-5" />
                Restoran Ortağı Ol
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 