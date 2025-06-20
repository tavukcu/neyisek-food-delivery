'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { 
  MapPin, 
  Clock, 
  Truck, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Star,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Phone,
  Mail,
  Calendar,
  Users,
  Globe,
  Navigation,
  Target,
  Zap,
  Award,
  Shield,
  TrendingUp,
  Building,
  Home,
  MapIcon,
  Compass,
  Route,
  Timer
} from 'lucide-react';
import Link from 'next/link';

interface DeliveryArea {
  id: string;
  name: string;
  district: string;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  status: 'active' | 'limited' | 'inactive';
  neighborhoods: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface District {
  id: string;
  name: string;
  areas: DeliveryArea[];
  totalAreas: number;
  averageDeliveryTime: string;
  color: string;
}

export default function DeliveryAreasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [expandedAreas, setExpandedAreas] = useState<string[]>([]);

  const toggleArea = (areaId: string) => {
    setExpandedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const deliveryAreas: DeliveryArea[] = [
    {
      id: 'merkez-1',
      name: 'Merkez',
      district: 'Merkez',
      deliveryTime: '25-35 dk',
      deliveryFee: 0,
      minOrder: 50,
      status: 'active',
      neighborhoods: ['Cumhuriyet', 'Mimar Sinan', 'Uncubozköy', 'Yarhasanlar', 'Muradiye']
    },
    {
      id: 'merkez-2',
      name: 'Şehzadeler',
      district: 'Şehzadeler',
      deliveryTime: '30-40 dk',
      deliveryFee: 5,
      minOrder: 60,
      status: 'active',
      neighborhoods: ['Şehzadeler', 'Anafartalar', 'Tevfikiye', 'Barbaros', 'Zafer']
    },
    {
      id: 'yunusemre-1',
      name: 'Yunusemre',
      district: 'Yunusemre',
      deliveryTime: '35-45 dk',
      deliveryFee: 8,
      minOrder: 70,
      status: 'active',
      neighborhoods: ['Yunusemre', 'Emek', 'Güzelyurt', 'Organize Sanayi', 'Teknokent']
    },
    {
      id: 'turgutlu-1',
      name: 'Turgutlu Merkez',
      district: 'Turgutlu',
      deliveryTime: '45-60 dk',
      deliveryFee: 12,
      minOrder: 80,
      status: 'active',
      neighborhoods: ['Turgutlu Merkez', 'Adala', 'Urganlı', 'Çamlık', 'Yenişehir']
    },
    {
      id: 'akhisar-1',
      name: 'Akhisar Merkez',
      district: 'Akhisar',
      deliveryTime: '50-70 dk',
      deliveryFee: 15,
      minOrder: 100,
      status: 'limited',
      neighborhoods: ['Akhisar Merkez', 'Gökeyüp', 'Zeytinliova', 'Kayacık', 'Çobanisa']
    },
    {
      id: 'salihli-1',
      name: 'Salihli Merkez',
      district: 'Salihli',
      deliveryTime: '60-80 dk',
      deliveryFee: 18,
      minOrder: 120,
      status: 'limited',
      neighborhoods: ['Salihli Merkez', 'Durasıllı', 'Sart', 'Gökeyüp', 'Taytan']
    },
    {
      id: 'soma-1',
      name: 'Soma Merkez',
      district: 'Soma',
      deliveryTime: '70-90 dk',
      deliveryFee: 20,
      minOrder: 150,
      status: 'limited',
      neighborhoods: ['Soma Merkez', 'Deniş', 'Işıklar', 'Evciler', 'Çukurköy']
    }
  ];

  const districts: District[] = [
    {
      id: 'all',
      name: 'Tüm Bölgeler',
      areas: deliveryAreas,
      totalAreas: deliveryAreas.length,
      averageDeliveryTime: '25-90 dk',
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'merkez',
      name: 'Merkez',
      areas: deliveryAreas.filter(area => area.district === 'Merkez'),
      totalAreas: 1,
      averageDeliveryTime: '25-35 dk',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'sehzadeler',
      name: 'Şehzadeler',
      areas: deliveryAreas.filter(area => area.district === 'Şehzadeler'),
      totalAreas: 1,
      averageDeliveryTime: '30-40 dk',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'yunusemre',
      name: 'Yunusemre',
      areas: deliveryAreas.filter(area => area.district === 'Yunusemre'),
      totalAreas: 1,
      averageDeliveryTime: '35-45 dk',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'turgutlu',
      name: 'Turgutlu',
      areas: deliveryAreas.filter(area => area.district === 'Turgutlu'),
      totalAreas: 1,
      averageDeliveryTime: '45-60 dk',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'akhisar',
      name: 'Akhisar',
      areas: deliveryAreas.filter(area => area.district === 'Akhisar'),
      totalAreas: 1,
      averageDeliveryTime: '50-70 dk',
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'salihli',
      name: 'Salihli',
      areas: deliveryAreas.filter(area => area.district === 'Salihli'),
      totalAreas: 1,
      averageDeliveryTime: '60-80 dk',
      color: 'from-pink-500 to-pink-600'
    },
    {
      id: 'soma',
      name: 'Soma',
      areas: deliveryAreas.filter(area => area.district === 'Soma'),
      totalAreas: 1,
      averageDeliveryTime: '70-90 dk',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const filteredAreas = deliveryAreas.filter(area => {
    const matchesDistrict = selectedDistrict === 'all' || area.district.toLowerCase() === selectedDistrict.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.neighborhoods.some(neighborhood => neighborhood.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesDistrict && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktif';
      case 'limited':
        return 'Sınırlı';
      case 'inactive':
        return 'Pasif';
      default:
        return 'Bilinmiyor';
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-teal-900 py-20 lg:py-32">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 via-emerald-700/85 to-teal-800/90"></div>
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-green-400/20 to-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-emerald-400/15 to-green-500/15 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <MapPin className="h-5 w-5 text-green-400" />
              <span className="text-white font-medium">Teslimat Haritası</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-tight mb-8">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 mb-4">
                Teslimat
              </span>
              <span className="block text-white">
                Alanları
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-green-100 leading-relaxed max-w-4xl mx-auto mb-12">
              Manisa ve çevre ilçelerde 
              <span className="text-green-300 font-semibold"> hızlı teslimat</span> 
              hizmeti veriyoruz. Bölgenizi kontrol edin ve 
              <span className="text-emerald-300 font-semibold"> lezzetli yemeklerin</span> 
              tadını çıkarın.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Bölge, mahalle veya ilçe adı girin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 text-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-2">
                  7
                </div>
                <div className="text-green-200 font-medium">İlçe</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 mb-2">
                  35+
                </div>
                <div className="text-green-200 font-medium">Mahalle</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  25dk
                </div>
                <div className="text-green-200 font-medium">Min. Teslimat</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center">
                <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-2">
                  7/24
                </div>
                <div className="text-green-200 font-medium">Hizmet</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Districts Section */}
      <section className="py-20 lg:py-32">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              İlçeler
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hizmet verdiğimiz ilçeleri seçin ve teslimat detaylarını görün
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {districts.map((district) => (
              <button
                key={district.id}
                onClick={() => setSelectedDistrict(district.id)}
                className={`text-left p-6 rounded-3xl border transition-all duration-300 transform hover:scale-105 ${
                  selectedDistrict === district.id
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-xl ring-2 ring-green-500 ring-opacity-50'
                    : 'bg-white border-gray-200 hover:border-green-300 shadow-lg hover:shadow-xl'
                }`}
              >
                <div className={`bg-gradient-to-br ${district.color} rounded-2xl p-3 w-fit mb-4`}>
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {district.name}
                </h3>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{district.totalAreas} bölge</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{district.averageDeliveryTime}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Delivery Areas */}
          <div className="grid lg:grid-cols-golden gap-16 lg:gap-20">
            {/* Sidebar */}
            <div className="lg:order-1">
              <div className="sticky top-8 space-y-6">
                {/* Delivery Info */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Hızlı Teslimat</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      25 dakikadan itibaren kapınızda
                    </p>
                    <div className="bg-white rounded-xl p-4 border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">₺0</div>
                      <div className="text-sm text-gray-600">Merkez teslimat ücreti</div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-200">
                  <div className="text-center">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-4 w-fit mx-auto mb-4">
                      <Phone className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Teslimat Desteği</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Teslimat ile ilgili sorularınız için
                    </p>
                    <a
                      href="tel:08501234567"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 text-sm inline-flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      0850 123 45 67
                    </a>
                  </div>
                </div>

                {/* Legend */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                  <h4 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <Info className="h-5 w-5 text-blue-600" />
                    Durum Açıklaması
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold text-gray-900">Aktif</div>
                        <div className="text-sm text-gray-600">Normal teslimat hizmeti</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold text-gray-900">Sınırlı</div>
                        <div className="text-sm text-gray-600">Belirli saatlerde teslimat</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      <div>
                        <div className="font-semibold text-gray-900">Pasif</div>
                        <div className="text-sm text-gray-600">Şu anda teslimat yok</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Areas List */}
            <div className="lg:order-2">
              <div className="mb-8">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {selectedDistrict === 'all' ? 'Tüm Teslimat Alanları' : districts.find(d => d.id === selectedDistrict)?.name + ' Teslimat Alanları'}
                </h3>
                <p className="text-gray-600">
                  {filteredAreas.length} teslimat alanı bulundu
                  {searchTerm && ` "${searchTerm}" için`}
                </p>
              </div>

              <div className="space-y-6">
                {filteredAreas.map((area) => (
                  <div
                    key={area.id}
                    className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    <div className="p-8">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-6">
                          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 flex-shrink-0">
                            <MapPin className="h-8 w-8 text-white" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold text-gray-900 mb-2">
                              {area.name}
                            </h4>
                            <p className="text-gray-600 mb-3">{area.district} İlçesi</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(area.status)}`}>
                              <div className={`w-2 h-2 rounded-full ${
                                area.status === 'active' ? 'bg-green-500' :
                                area.status === 'limited' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}></div>
                              {getStatusText(area.status)}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleArea(area.id)}
                          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-xl transition-colors duration-300"
                        >
                          {expandedAreas.includes(area.id) ? (
                            <ChevronUp className="h-6 w-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-6 w-6 text-gray-400" />
                          )}
                        </button>
                      </div>

                      {/* Quick Info */}
                      <div className="grid md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                          <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                          <div className="text-lg font-bold text-gray-900">{area.deliveryTime}</div>
                          <div className="text-sm text-gray-600">Teslimat Süresi</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                          <Truck className="h-6 w-6 text-green-600 mx-auto mb-2" />
                          <div className="text-lg font-bold text-gray-900">₺{area.deliveryFee}</div>
                          <div className="text-sm text-gray-600">Teslimat Ücreti</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center">
                          <Target className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                          <div className="text-lg font-bold text-gray-900">₺{area.minOrder}</div>
                          <div className="text-sm text-gray-600">Min. Sipariş</div>
                        </div>
                      </div>

                      {expandedAreas.includes(area.id) && (
                        <div className="bg-gradient-to-br from-gray-50 to-green-50/30 rounded-2xl p-6 border border-gray-200">
                          <h5 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-3">
                            <Home className="h-5 w-5 text-green-600" />
                            Hizmet Verilen Mahalleler
                          </h5>
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {area.neighborhoods.map((neighborhood, index) => (
                              <div
                                key={index}
                                className="bg-white rounded-xl p-3 border border-gray-200 flex items-center gap-3"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                <span className="text-gray-700 font-medium">{neighborhood}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredAreas.length === 0 && (
                <div className="text-center py-16">
                  <div className="bg-gradient-to-br from-gray-100 to-green-100 rounded-3xl p-12 max-w-md mx-auto">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      Teslimat Alanı Bulunamadı
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Aradığınız kriterlere uygun teslimat alanı bulunamadı. Farklı anahtar kelimeler deneyin.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedDistrict('all');
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                    >
                      Tüm Alanları Göster
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
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 w-fit mx-auto mb-8">
              <Truck className="h-12 w-12 text-white" />
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Bölgeniz Listede Yok mu?
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Yeni teslimat alanları için 
              <span className="text-green-400 font-semibold"> talebinizi iletin.</span> 
              En kısa sürede hizmet alanımızı genişletmeye çalışıyoruz.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-3"
              >
                <Mail className="h-5 w-5" />
                Talep Gönder
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