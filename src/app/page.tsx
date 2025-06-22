'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AdvertisementBanner from '@/components/AdvertisementBanner';
import { AnalyticsService } from '@/services/analyticsService';
import { PerformanceService } from '@/services/performanceService';
import { RemoteConfigService } from '@/services/remoteConfigService';
import { 
  Clock, 
  ShieldCheck, 
  Truck,
  Star,
  ArrowRight,
  ChefHat,
  Heart,
  Users,
  TrendingUp,
  Award,
  MapPin,
  Phone,
  CreditCard,
  BarChart3,
  UserPlus,
  Zap,
  Store,
  RefreshCw,
  Tag,
  Brain,
  UtensilsCrossed
} from 'lucide-react';
import Link from 'next/link';
import { CategoryService } from '@/services/categoryService';
import { RestaurantService } from '@/services/restaurantService';
import type { Category, RestaurantInfo } from '@/types';
import toast from 'react-hot-toast';
import SmartRecommendations from '@/components/SmartRecommendations';
import RestaurantStatusBadge from '@/components/RestaurantStatusBadge';
import OrderButton from '@/components/OrderButton';

// Ana sayfa komponenti
export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<RestaurantInfo[]>([]);
  const [allRestaurants, setAllRestaurants] = useState<RestaurantInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceTraceId, setPerformanceTraceId] = useState<string>('');

  // Firebase Analytics ve Performance Monitoring
  useEffect(() => {
    // Performance monitoring başlat
    const traceId = PerformanceService.startPageLoadTrace('home_page');
    setPerformanceTraceId(traceId);

    // Remote Config'i başlat
    RemoteConfigService.initialize().then((success) => {
      if (success) {
        console.log('🔧 Remote Config başlatıldı');
        
        // Maintenance mode kontrolü
        if (RemoteConfigService.isMaintenanceMode()) {
          toast.error('Site bakımda. Lütfen daha sonra tekrar deneyin.');
        }
        
        // Welcome message göster
        const welcomeMessage = RemoteConfigService.getWelcomeMessage();
        if (welcomeMessage !== 'Hoş geldiniz!') {
          toast.success(welcomeMessage);
        }
      }
    });

    // Analytics sayfa görüntüleme
    AnalyticsService.trackPageView('home_page', 'Ana Sayfa');

    // Cleanup function
    return () => {
      if (traceId) {
        PerformanceService.stopPageLoadTrace(traceId, {
          categories_count: categories.length,
          restaurants_count: restaurants.length
        });
      }
    };
  }, []);

  // Sayfa tamamen yüklendiğinde performance tracking'i tamamla
  useEffect(() => {
    if (!loading && performanceTraceId) {
      setTimeout(() => {
        PerformanceService.stopPageLoadTrace(performanceTraceId, {
          categories_loaded: categories.length,
          restaurants_loaded: restaurants.length,
          load_time_ms: Math.round(performance.now())
        });
        
        // Sayfa performance metrikleri
        PerformanceService.trackPageLoadTime('home_page');
        
        // Memory usage takibi
        PerformanceService.trackMemoryUsage();
      }, 1000);
    }
  }, [loading, performanceTraceId, categories.length, restaurants.length]);

  useEffect(() => {
    loadData(true);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading && !refreshing) {
        handleRefresh();
      }
    };

    const handleWindowFocus = () => {
      if (!loading && !refreshing) {
        handleRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [loading, refreshing]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && !loading && !refreshing) {
        handleRefresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      
      // Performance tracking başlat
      const loadTraceId = PerformanceService.startCustomTrace('load_homepage_data', {
        force_refresh: forceRefresh.toString()
      });
      
      const categoriesPromise = CategoryService.getActiveCategories();
      const restaurantsPromise = RestaurantService.getActiveRestaurants();

      const [categoriesData, restaurantsData] = await Promise.all([
        categoriesPromise,
        restaurantsPromise
      ]);

      setCategories(categoriesData);
      setRestaurants(restaurantsData);
      setAllRestaurants(restaurantsData);

      // Performance tracking tamamla
      PerformanceService.stopCustomTrace(loadTraceId, {
        categories_loaded: categoriesData.length,
        restaurants_loaded: restaurantsData.length
      });

      // Analytics: Data loading event
      AnalyticsService.trackCustomEvent('homepage_data_loaded', {
        categories_count: categoriesData.length,
        restaurants_count: restaurantsData.length,
        force_refresh: forceRefresh
      });

    } catch (error) {
      console.error('Data loading error:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
      
      // Analytics: Error tracking
      AnalyticsService.trackCustomEvent('homepage_data_load_error', {
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
      setLoadingRestaurants(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Analytics: Refresh action
      AnalyticsService.trackCustomEvent('homepage_refresh', {
        trigger: 'manual_refresh'
      });
      
      await loadData(true);
    } catch (error) {
      console.error('Yenileme hatası:', error);
      toast.error('Kategoriler yenileme hatası');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Hero Advertisement Banner */}
      <AdvertisementBanner position="hero" className="relative z-20" />

      {/* Hero Section - Golden Ratio Design */}
      <section className="hero-section relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-green-600/90 via-emerald-700/85 to-teal-800/90"></div>
          <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-gradient-to-r from-yellow-400/20 to-amber-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[15%] right-[8%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-gradient-to-r from-green-400/15 to-emerald-500/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-[50%] left-[30%] w-[30vw] h-[30vw] max-w-[300px] max-h-[300px] bg-gradient-to-r from-yellow-300/10 to-green-400/10 rounded-full blur-2xl animate-pulse"></div>
        </div>

        <div className="container-responsive relative z-10">
          {/* Golden Ratio Grid: 1.618 ratio for main content areas */}
          <div className="grid grid-cols-1 lg:grid-cols-golden gap-2 sm:gap-4 lg:gap-8 items-center min-h-[50vh] sm:min-h-[80vh] lg:min-h-[100vh] py-4 sm:py-8 lg:py-0">
            
            {/* Left Column - Main Content (Golden Ratio: 1.618 part) */}
            <div className="space-y-2 sm:space-y-4 lg:space-y-8 text-center lg:text-left order-1 lg:order-1">
              
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-1 sm:gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-2 sm:px-4 py-1 sm:py-2 shadow-2xl">
                <div className="w-1 h-1 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <ChefHat className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                <span className="text-white font-medium bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent text-xs sm:text-sm">
                  Premium Lezzet
                </span>
              </div>

              {/* Main Heading - Golden Ratio Typography */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-black leading-tight">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 mb-1 sm:mb-2">
                  Lezzet
                </span>
                <span className="block text-white">
                  Kapınızda!
                </span>
              </h1>

              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-green-100 leading-relaxed max-w-4xl mx-auto lg:mx-0 mt-2 sm:mt-4">
                Türkiye'nin en büyük 
                <span className="text-yellow-300 font-semibold"> yemek sipariş platformu</span> ile 
                binlerce restorandan 
                <span className="text-green-300 font-semibold"> hızlı teslimat</span> hizmetini keşfedin.
              </p>

              {/* Stats Grid */}
              <div className="stats-grid grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 lg:gap-6 mt-3 sm:mt-6">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 mb-1">
                    1000+
                  </div>
                  <div className="text-white text-xs font-medium">Restoran</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-1">
                    50K+
                  </div>
                  <div className="text-white text-xs font-medium">Müşteri</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center">
                  <div className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-400 mb-1">
                    30dk
                  </div>
                  <div className="text-white text-xs font-medium">Teslimat</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 mt-3 sm:mt-6">
                <Link 
                  href="/menu" 
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg font-bold text-xs shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2"
                >
                  <UtensilsCrossed className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Sipariş Ver</span>
                </Link>
                <Link 
                  href="/restaurants" 
                  className="w-full sm:w-auto bg-white/20 backdrop-blur-xl border border-white/30 text-white hover:bg-white/30 px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg font-bold text-xs shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2"
                >
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">Restoranlar</span>
                </Link>
              </div>
            </div>

            {/* Right Column - Visual Content (Golden Ratio: 1 part) */}
            <div className="order-2 lg:order-2 relative">
              <div className="space-y-2 sm:space-y-4">
                {/* AI Analytics Card */}
                <div className="feature-card bg-white/10 backdrop-blur-2xl border border-white/20 rounded-lg sm:rounded-2xl p-3 sm:p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 sm:p-3 flex-shrink-0">
                      <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 break-words">
                        AI Analitikler
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-xs sm:text-sm break-words">
                        Yapay zeka ile satış analizi ve 
                        <span className="text-blue-300 font-semibold"> %60 daha etkili</span> pazarlama.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-time Management Card */}
                <div className="feature-card bg-white/10 backdrop-blur-2xl border border-white/20 rounded-lg sm:rounded-2xl p-3 sm:p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-2 sm:p-3 flex-shrink-0">
                      <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 break-words">
                        Gerçek Zamanlı Yönetim
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-xs sm:text-sm break-words">
                        Siparişleri ve stoku 
                        <span className="text-green-300 font-semibold"> anlık</span> takip edin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Smart Payment Card */}
                <div className="feature-card bg-white/10 backdrop-blur-2xl border border-white/20 rounded-lg sm:rounded-2xl p-3 sm:p-6 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start gap-2 sm:gap-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-2 sm:p-3 flex-shrink-0">
                      <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-white mb-1 sm:mb-2 break-words">
                        Güvenli Ödeme
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-xs sm:text-sm break-words">
                        Hızlı ödeme ile 
                        <span className="text-purple-300 font-semibold"> sorunsuz</span> alışveriş.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Recommendations Section */}
      <SmartRecommendations />

      {/* Categories Section - Golden Ratio Layout */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="container-responsive">
          {/* Section Header - Golden Ratio spacing */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Kategoriler</span>
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                Her Damak Zevkine
              </span>
              <br />
              <span className="text-gray-900">Uygun Lezzetler</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Geleneksel tatlardan modern füzyona, her kategoride özenle seçilmiş restoranlar
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl p-8 text-center animate-pulse shadow-lg">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
                  <div className="h-5 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 lg:gap-8">
              {/* All Categories Button */}
              <Link
                href="/menu"
                className={`group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 border-2 transform hover:scale-105 border-gray-200 hover:border-gray-300`}
              >
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🍽️</div>
                <h3 className="font-bold text-gray-900 mb-2 text-lg">Tümü</h3>
                <p className="text-sm text-gray-700 font-medium">{restaurants.length} restoran</p>
              </Link>

              {categories.map((category, index) => {
                // İştah açıcı gradient renk paleti
                const colorPalettes = [
                  'bg-gradient-to-br from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600', // Kırmızı-Pembe (Et, Pizza)
                  'bg-gradient-to-br from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600', // Turuncu-Kırmızı (Fast Food)
                  'bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600', // Sarı-Turuncu (Kahvaltı, Tatlı)
                  'bg-gradient-to-br from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600', // Yeşil (Salata, Vegan)
                  'bg-gradient-to-br from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600', // Mavi (Deniz Ürünleri)
                  'bg-gradient-to-br from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600', // Mor-Pembe (Tatlı, İçecek)
                  'bg-gradient-to-br from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600', // İndigo-Mor (Kahve)
                  'bg-gradient-to-br from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600', // Pembe-Gül (Dondurma)
                  'bg-gradient-to-br from-teal-400 to-green-500 hover:from-teal-500 hover:to-green-600', // Teal-Yeşil (Sağlıklı)
                  'bg-gradient-to-br from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600', // Amber-Sarı (Türk Mutfağı)
                  'bg-gradient-to-br from-lime-400 to-green-500 hover:from-lime-500 hover:to-green-600', // Lime-Yeşil (Meyve)
                  'bg-gradient-to-br from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600' // Gül-Pembe (Romantik)
                ];
                
                const colorClass = colorPalettes[index % colorPalettes.length];
                
                return (
                  <Link
                    key={category.id}
                    href={`/menu?category=${category.id}`}
                    className={`group ${colorClass} rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-500 border-2 transform hover:scale-105 border-white/20 hover:border-white/40`}
                  >
                    <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                      {category.icon || '🍽️'}
                    </div>
                    <h3 className="font-bold text-white mb-2 text-lg drop-shadow-md">{category.name}</h3>
                    <p className="text-sm text-white/90 font-medium drop-shadow-sm">{category.description}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Restaurants Section - Golden Ratio Layout */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-green-50/30">
        <div className="container-responsive">
          {/* Section Header with Refresh Button */}
          <div className="flex flex-col lg:flex-row items-center justify-between mb-20 gap-8">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-200 rounded-full px-6 py-3 mb-8">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-700 font-medium">Popüler Restoranlar</span>
              </div>
              
              <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600">
                  En Çok Tercih Edilen
                </span>
                <br />
                <span className="text-gray-900">Lezzet Noktaları</span>
              </h2>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl leading-relaxed">
                Müşterilerimizin favorisi olan, kaliteli ve lezzetli yemekler sunan restoranlar
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-green-300 text-gray-700 hover:text-green-700 font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`h-6 w-6 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-lg">Yenile</span>
            </button>
          </div>

          {loadingRestaurants ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-3xl shadow-xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200"></div>
                  <div className="p-8">
                    <div className="h-7 bg-gray-200 rounded mb-4"></div>
                    <div className="h-5 bg-gray-200 rounded mb-6 w-2/3"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : restaurants.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              {restaurants.slice(0, 6).map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurant/${restaurant.id}`}
                  className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-green-200 transform hover:scale-105"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={restaurant.coverImageUrl || '/images/restaurant-placeholder.svg'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-6 left-6">
                      <RestaurantStatusBadge 
                        restaurant={restaurant} 
                        variant="compact"
                        className="shadow-lg"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
                      {restaurant.name}
                    </h3>
                    <p className="text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                      {restaurant.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < Math.floor(restaurant.rating || 0) ? 'fill-current' : ''
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-700 font-semibold">
                          {restaurant.rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-2 rounded-full">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">{restaurant.estimatedDeliveryTime || 30} dk</span>
                      </div>
                    </div>

                    {/* Order Button */}
                    <OrderButton
                      restaurant={restaurant}
                      onOrderClick={() => {
                        // Restoran sayfasına yönlendir
                        window.location.href = `/restaurant/${restaurant.id}`;
                      }}
                      className="w-full"
                      size="md"
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-8xl mb-8">🍽️</div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Henüz restoran bulunmuyor
              </h3>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Yakında yeni restoranlar eklenecek.
              </p>
            </div>
          )}

          {restaurants.length > 6 && (
            <div className="text-center mt-16">
              <Link 
                href="/restaurants" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 px-12 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl inline-flex items-center gap-4 text-xl"
              >
                <span>Tüm Restoranları Görüntüle</span>
                <ArrowRight className="h-6 w-6" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Golden Ratio Design */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="container-responsive">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-full px-6 py-3 mb-8">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-medium">Neden NeYisek?</span>
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Modern Teknoloji ile
              </span>
              <br />
              <span className="text-gray-900">Geleneksel Lezzetler</span>
            </h2>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Yenilikçi çözümlerle mükemmel yemek deneyimi sunan platform
            </p>
          </div>

          {/* Features Grid - Golden Ratio Layout */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Fast Delivery Feature */}
            <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 border border-green-100 transform hover:scale-105">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 w-fit mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Hızlı Teslimat</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Ortalama 25 dakikada kapınızda. GPS takip sistemi ile siparişinizi anlık olarak takip edin.
                <span className="block mt-4 text-green-600 font-semibold">
                  ⚡ Ekspres teslimat seçeneği ile 15 dakikada!
                </span>
              </p>
            </div>

            {/* Secure Payment Feature */}
            <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 border border-blue-100 transform hover:scale-105">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 w-fit mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <ShieldCheck className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">Güvenli Ödeme</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                256-bit SSL şifreleme ile güvenli ödeme. Kredi kartı, banka kartı ve dijital cüzdan desteği.
                <span className="block mt-4 text-blue-600 font-semibold">
                  🔒 Blockchain tabanlı güvenlik
                </span>
              </p>
            </div>

            {/* 24/7 Support Feature */}
            <div className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 border border-purple-100 transform hover:scale-105">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 w-fit mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6">7/24 Destek</h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                Her zaman yanınızdayız. Canlı destek, telefon ve e-posta ile 7/24 müşteri hizmetleri.
                <span className="block mt-4 text-purple-600 font-semibold">
                  💬 AI destekli anlık yanıt
                </span>
              </p>
            </div>
          </div>

          {/* Additional Features Row */}
          <div className="grid md:grid-cols-2 gap-8 lg:gap-10 mt-10">
            {/* Quality Assurance */}
            <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 border border-yellow-100 transform hover:scale-105">
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Award className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Kalite Garantisi</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    Tüm restoranlarımız düzenli kalite kontrolünden geçer. 
                    <span className="text-yellow-600 font-semibold"> %100 memnuniyet garantisi</span> ile 
                    her siparişinizde kaliteli hizmet alırsınız.
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Recommendations */}
            <div className="group bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl p-10 hover:shadow-2xl transition-all duration-500 border border-teal-100 transform hover:scale-105">
              <div className="flex items-start gap-6">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <Brain className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Akıllı Öneriler</h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    AI destekli öneri sistemi ile damak zevkinize uygun yemekleri keşfedin. 
                    <span className="text-teal-600 font-semibold"> Kişiselleştirilmiş menü</span> deneyimi yaşayın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Advertisement */}
      <div className="container-responsive">
        <AdvertisementBanner position="banner" />
      </div>

      {/* Restaurant CTA Section - Golden Ratio Design */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="container-responsive">
          {/* Golden Ratio Grid: 1.618 ratio for content areas */}
          <div className="grid lg:grid-cols-golden gap-16 lg:gap-20 items-center">
            
            {/* Left Column - Main Content (Golden Ratio: 1.618 part) */}
            <div className="space-y-10 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-6 py-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 font-medium">Restoran Ortaklığı</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-8">
                <h2 className="text-5xl lg:text-7xl xl:text-8xl font-black leading-tight">
                  <span className="block text-white mb-2">
                  Restoranınızı
                  </span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                    Büyütün!
                  </span>
                </h2>
                
                <p className="text-xl lg:text-2xl xl:text-3xl text-gray-300 leading-relaxed max-w-4xl mx-auto lg:mx-0">
                  NeYisek.com ile dijital dönüşümünüzü tamamlayın. 
                  <span className="text-green-400 font-semibold"> Binlerce müşteriye</span> ulaşın, 
                  satışlarınızı artırın ve işinizi büyütün.
                </p>
              </div>

              {/* Stats Grid - Golden Ratio proportions */}
              <div className="grid grid-cols-3 gap-8 pt-8">
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-3">
                    +250%
                  </div>
                  <div className="text-gray-300 font-medium text-lg">Satış Artışı</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-3">
                    15K+
                  </div>
                  <div className="text-gray-300 font-medium text-lg">Aylık Sipariş</div>
                </div>
                
                <div className="text-center">
                  <div className="text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400 mb-3">
                    98%
                  </div>
                  <div className="text-gray-300 font-medium text-lg">Memnuniyet</div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8">
                <Link 
                  href="/restaurant-apply" 
                  className="group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 px-12 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl inline-flex items-center justify-center gap-4 text-xl"
                >
                  <Store className="h-7 w-7" />
                  <span>Başvuru Yap</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
                
                <Link 
                  href="/restaurant-login" 
                  className="group bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 text-white font-bold py-6 px-12 rounded-2xl transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-4 text-xl"
                >
                  <UserPlus className="h-7 w-7" />
                  <span>Panel Girişi</span>
                  <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                </Link>
              </div>
            </div>

            {/* Right Column - Feature Cards (Golden Ratio: 1 part) */}
            <div className="space-y-8">
              <div className="grid gap-8">
                {/* AI Analytics Card */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-5 flex-shrink-0">
                      <BarChart3 className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                        AI Destekli Analitikler
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Yapay zeka ile satış trendlerinizi analiz edin, gelecek tahminleri yapın ve 
                        <span className="text-blue-300 font-semibold"> %60 daha etkili</span> pazarlama stratejileri geliştirin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Real-time Management Card */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start gap-6">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 flex-shrink-0">
                      <Zap className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                        Gerçek Zamanlı Yönetim
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Siparişlerinizi, stok durumunuzu ve müşteri geri bildirimlerini 
                        <span className="text-green-300 font-semibold"> anlık olarak</span> takip edin ve yönetin.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Smart Payment Card */}
                <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-10 transform hover:scale-105 transition-all duration-300">
                  <div className="flex items-start gap-6">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 flex-shrink-0">
                      <CreditCard className="h-10 w-10 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                        Akıllı Ödeme Sistemi
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-lg">
                        Blockchain tabanlı güvenli ödemeler, 
                        <span className="text-purple-300 font-semibold"> anında transfer</span> ve 
                        düşük komisyon oranları ile kazancınızı maksimize edin.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container-responsive">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">NeYisek.com</h3>
              <p className="text-gray-400 mb-4">
                Lezzetli yemekleri kapınıza getiren güvenilir adresiniz.
              </p>
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <span className="text-gray-400 text-sm">4.8/5</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Hızlı Linkler</h4>
              <ul className="space-y-2">
                <li><Link href="/menu" className="text-gray-400 hover:text-white transition-colors duration-200">Menü</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-200">Hakkımızda</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">İletişim</Link></li>
                <li><Link href="/delivery-areas" className="text-gray-400 hover:text-white transition-colors duration-200">Teslimat Alanları</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Müşteri Hizmetleri</h4>
              <ul className="space-y-2">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-200">Yardım</Link></li>
                <li><Link href="/privacy" className="text-gray-400 hover:text-white transition-colors duration-200">Gizlilik Politikası</Link></li>
                <li><Link href="/terms" className="text-gray-400 hover:text-white transition-colors duration-200">Kullanım Şartları</Link></li>
                <li><Link href="/returns" className="text-gray-400 hover:text-white transition-colors duration-200">İade ve Değişim</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">İletişim</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📞 0 236 7684106</li>
                <li>📧 info@neyisek.com</li>
                <li>📍 Ahmetli/Manisa/TÜRKİYE</li>
                <li>🕒 7/24 Hizmet</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 NeYisek.com. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>

      {/* Popup Advertisement */}
      <AdvertisementBanner position="popup" />
    </main>
  );
} 