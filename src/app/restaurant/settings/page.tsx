'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Save,
  MapPin,
  Phone,
  Clock,
  Image as ImageIcon,
  Globe,
  Mail,
  Star,
  Upload,
  Camera
} from 'lucide-react';
import Link from 'next/link';

// Gerçek restoran verileri - Firebase'den yüklenecek
const useRestaurantData = () => {
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    openingHours: {
      monday: { open: '10:00', close: '23:00', closed: false },
      tuesday: { open: '10:00', close: '23:00', closed: false },
      wednesday: { open: '10:00', close: '23:00', closed: false },
      thursday: { open: '10:00', close: '23:00', closed: false },
      friday: { open: '10:00', close: '24:00', closed: false },
      saturday: { open: '10:00', close: '24:00', closed: false },
      sunday: { open: '11:00', close: '22:00', closed: false }
    },
    deliveryTime: '25-40',
    minOrder: 30,
    deliveryFee: 5,
    logo: '',
    banner: '',
    categories: [],
    paymentMethods: ['cash', 'credit', 'online'],
    features: ['delivery', 'takeaway']
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurantData();
  }, []);

  const loadRestaurantData = async () => {
    try {
      setLoading(true);
      // Burada gerçek Firebase verilerini yükleyebilirsiniz
      // Şimdilik boş veriler döndürüyoruz
    } catch (error) {
      console.error('Restoran verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return { restaurantData, setRestaurantData, loading };
};

const dayNames = {
  monday: 'Pazartesi',
  tuesday: 'Salı',
  wednesday: 'Çarşamba',
  thursday: 'Perşembe',
  friday: 'Cuma',
  saturday: 'Cumartesi',
  sunday: 'Pazar'
};

export default function RestaurantSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { restaurantData, setRestaurantData, loading: dataLoading } = useRestaurantData();
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'restaurant')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || dataLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Restoran ayarları yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || user.role !== 'restaurant') {
    return null;
  }

  // Input değişiklikleri
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRestaurantData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Çalışma saatleri değişiklikleri
  const handleHoursChange = (day: string, field: 'open' | 'close' | 'closed', value: string | boolean) => {
    setRestaurantData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value
        }
      }
    }));
  };

  // Resim yükleme
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'logo') {
          setRestaurantData(prev => ({
            ...prev,
            logo: reader.result as string
          }));
        } else {
          setRestaurantData(prev => ({
            ...prev,
            banner: reader.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Array değişiklikleri
  const toggleArrayItem = (array: string[], item: string, field: 'categories' | 'paymentMethods' | 'features') => {
    setRestaurantData(prev => ({
      ...prev,
      [field]: array.includes(item) 
        ? array.filter(i => i !== item)
        : [...array, item]
    }));
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // API çağrısı burada yapılacak
      console.log('Restoran bilgileri güncelleniyor:', restaurantData);
      
      // Simülasyon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Restoran bilgileri başarıyla güncellendi!');
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main>
      <Header />
      
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive max-w-6xl">
          {/* Başlık */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/restaurant" 
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Restoran Ayarları
                </h1>
                <p className="text-gray-600 mt-1">
                  Restoran bilgilerinizi güncelleyin
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'general' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Temel Bilgiler
                </button>
                <button
                  onClick={() => setActiveTab('hours')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'hours' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Çalışma Saatleri
                </button>
                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'delivery' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Teslimat Ayarları
                </button>
                <button
                  onClick={() => setActiveTab('media')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === 'media' 
                      ? 'border-primary-500 text-primary-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Medya & Görseller
                </button>
              </nav>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Temel Bilgiler Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Restoran Bilgileri
                  </h2>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Restoran Adı */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Restoran Adı *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={restaurantData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Telefon */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefon *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={restaurantData.phone}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-posta
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={restaurantData.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Website
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          name="website"
                          value={restaurantData.website}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Adres */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adres *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <textarea
                        name="address"
                        value={restaurantData.address}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Açıklama */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Restoran Açıklaması
                    </label>
                    <textarea
                      name="description"
                      value={restaurantData.description}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Restoranınızı tanımlayın..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Kategoriler */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Kategoriler
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Restoranınızın sunduğu yemek kategorilerini seçin
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {['Pizza', 'Burger', 'Döner', 'Pide & Lahmacun', 'Izgara', 'Salata', 'Tatlı', 'İçecek', 'Ana Yemek'].map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => toggleArrayItem(restaurantData.categories, category, 'categories')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                          restaurantData.categories.includes(category)
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Çalışma Saatleri Tab */}
            {activeTab === 'hours' && (
              <div className="card p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Çalışma Saatleri
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(dayNames).map(([day, dayName]) => (
                    <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24">
                        <span className="font-medium text-gray-900">{dayName}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-1">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={restaurantData.openingHours[day as keyof typeof restaurantData.openingHours].closed}
                            onChange={(e) => handleHoursChange(day, 'closed', e.target.checked)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-600">Kapalı</span>
                        </label>
                        
                        {!restaurantData.openingHours[day as keyof typeof restaurantData.openingHours].closed && (
                          <>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Açılış</label>
                              <input
                                type="time"
                                value={restaurantData.openingHours[day as keyof typeof restaurantData.openingHours].open}
                                onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Kapanış</label>
                              <input
                                type="time"
                                value={restaurantData.openingHours[day as keyof typeof restaurantData.openingHours].close}
                                onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Teslimat Ayarları Tab */}
            {activeTab === 'delivery' && (
              <div className="space-y-6">
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Teslimat Bilgileri
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Teslimat Süresi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teslimat Süresi (dk)
                      </label>
                      <input
                        type="text"
                        name="deliveryTime"
                        value={restaurantData.deliveryTime}
                        onChange={handleInputChange}
                        placeholder="25-40"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Minimum Sipariş */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Sipariş (₺)
                      </label>
                      <input
                        type="number"
                        name="minOrder"
                        value={restaurantData.minOrder}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    {/* Teslimat Ücreti */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teslimat Ücreti (₺)
                      </label>
                      <input
                        type="number"
                        name="deliveryFee"
                        value={restaurantData.deliveryFee}
                        onChange={handleInputChange}
                        min="0"
                        step="0.50"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Ödeme Yöntemleri */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Ödeme Yöntemleri
                  </h2>
                  
                  <div className="space-y-3">
                    {[
                      { id: 'cash', label: 'Nakit' },
                      { id: 'credit', label: 'Kredi Kartı' },
                      { id: 'online', label: 'Online Ödeme' }
                    ].map((method) => (
                      <label key={method.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={restaurantData.paymentMethods.includes(method.id)}
                          onChange={() => toggleArrayItem(restaurantData.paymentMethods, method.id, 'paymentMethods')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-gray-700">{method.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Özellikler */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Özellikler
                  </h2>
                  
                  <div className="space-y-3">
                    {[
                      { id: 'delivery', label: 'Teslimat' },
                      { id: 'takeaway', label: 'Gel Al' },
                      { id: 'fastdelivery', label: 'Hızlı Teslimat' }
                    ].map((feature) => (
                      <label key={feature.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={restaurantData.features.includes(feature.id)}
                          onChange={() => toggleArrayItem(restaurantData.features, feature.id, 'features')}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-3 text-gray-700">{feature.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Medya Tab */}
            {activeTab === 'media' && (
              <div className="space-y-6">
                {/* Logo */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Restoran Logosu
                  </h2>
                  
                  <div className="flex items-start gap-6">
                    <div className="flex-1">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        {restaurantData.logo && (
                          <div className="space-y-4">
                            <img
                              src={restaurantData.logo}
                              alt="Logo önizleme"
                              className="mx-auto rounded-lg max-h-32 object-contain"
                            />
                            <div className="flex gap-2 justify-center">
                              <label htmlFor="logo-upload" className="cursor-pointer text-primary-600 hover:text-primary-800 text-sm font-medium">
                                Logoyu Değiştir
                              </label>
                            </div>
                          </div>
                        )}
                        <input
                          id="logo-upload"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(e, 'logo')}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Kapak Fotoğrafı
                  </h2>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {restaurantData.banner && (
                      <div className="space-y-4">
                        <img
                          src={restaurantData.banner}
                          alt="Banner önizleme"
                          className="mx-auto rounded-lg max-h-48 w-full object-cover"
                        />
                        <div className="flex gap-2 justify-center">
                          <label htmlFor="banner-upload" className="cursor-pointer text-primary-600 hover:text-primary-800 text-sm font-medium">
                            Kapak Fotoğrafını Değiştir
                          </label>
                        </div>
                      </div>
                    )}
                    <input
                      id="banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e, 'banner')}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="spinner-sm"></div>
                    Güncelleniyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
              
              <Link 
                href="/restaurant" 
                className="btn-outline flex items-center justify-center gap-2"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
} 