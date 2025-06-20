'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LocationPicker from '@/components/LocationPicker';
import { useAuth } from '@/hooks/useAuth';
import { RestaurantService } from '@/services/restaurantService';
import { CategoryService } from '@/services/categoryService';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Building2,
  Send,
  CheckCircle,
  Loader2,
  AlertCircle,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import BackToHomeButton from '@/components/BackToHomeButton';

// Restoran başvuru sayfası komponenti
export default function RestaurantApplyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    email: '',
    phone: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    city: '',
    district: '',
    businessLicense: '',
    taxNumber: '',
    categoryIds: [] as string[]
  });

  // Kategorileri yükleme
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await CategoryService.getActiveCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Kategoriler yüklenirken hata:', error);
        toast.error('Kategoriler yüklenemedi');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Kullanıcının mevcut başvurusunu kontrol et
  const checkExistingApplication = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      const application = await RestaurantService.getUserApplication(user.uid);
      if (application) {
        setExistingApplication(application);
        setApplicationStatus(application.status);
        setFormData({
          restaurantName: application.restaurantName,
          ownerName: application.ownerName,
          email: application.email,
          phone: application.phone,
          address: application.address,
          latitude: application.latitude,
          longitude: application.longitude,
          city: application.city || '',
          district: application.district || '',
          businessLicense: application.businessLicense,
          taxNumber: application.taxNumber,
          categoryIds: application.categoryIds || []
        });
      }
    } catch (error) {
      console.error('Başvuru kontrol hatası:', error);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!authLoading && user) {
      checkExistingApplication();
    }
  }, [authLoading, user, checkExistingApplication]);

  // Form verisini güncelleme fonksiyonu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Harita konum seçimi
  const handleLocationSelect = (address: string, lat: number, lng: number, city?: string, district?: string) => {
    setFormData(prev => ({
      ...prev,
      address,
      latitude: lat,
      longitude: lng,
      city: city || prev.city,
      district: district || prev.district
    }));
  };

  // Adres değişimi
  const handleAddressChange = (address: string) => {
    setFormData(prev => ({
      ...prev,
      address
    }));
  };

  // İl değişimi
  const handleCityChange = (cityId: string, cityName: string) => {
    setFormData(prev => ({
      ...prev,
      city: cityId,
      district: '' // İl değişince ilçeyi sıfırla
    }));
  };

  // İlçe değişimi
  const handleDistrictChange = (districtId: string, districtName: string) => {
    setFormData(prev => ({
      ...prev,
      district: districtId
    }));
  };

  // Kategori seçimi/kaldırma fonksiyonu
  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  // Form gönderme fonksiyonu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Başvuru yapmak için giriş yapmalısınız');
      router.push('/register');
      return;
    }

    // Form validasyonu
    if (!formData.restaurantName.trim()) {
      toast.error('Restoran adı zorunludur');
      return;
    }

    if (!formData.ownerName.trim()) {
      toast.error('Yetkili adı soyadı zorunludur');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('E-posta adresi zorunludur');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Telefon numarası zorunludur');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('Adres bilgisi zorunludur');
      return;
    }

    if (!formData.city.trim()) {
      toast.error('İl seçimi zorunludur');
      return;
    }

    if (!formData.district.trim()) {
      toast.error('İlçe seçimi zorunludur');
      return;
    }

    if (!formData.businessLicense.trim()) {
      toast.error('İş ruhsatı numarası zorunludur');
      return;
    }

    if (!formData.taxNumber.trim()) {
      toast.error('Vergi numarası zorunludur');
      return;
    }

    if (formData.categoryIds.length === 0) {
      toast.error('En az bir kategori seçmelisiniz');
      return;
    }

    setIsSubmitting(true);

    try {
      const applicationData = {
        userId: user.uid,
        restaurantName: formData.restaurantName.trim(),
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude,
        longitude: formData.longitude,
        city: formData.city,
        district: formData.district,
        businessLicense: formData.businessLicense.trim(),
        taxNumber: formData.taxNumber.trim(),
        categoryIds: formData.categoryIds
      };

      // Doğrudan RestaurantService kullanarak başvuru gönder
      const applicationId = await RestaurantService.createApplication(applicationData);

      toast.success('🎉 Restoran başvurunuz başarıyla alındı. İnceleme süreci 1-3 iş günü sürmektedir.');
      setApplicationStatus('pending');
      
      // Başvuru detaylarını güncelle
      const updatedApplication = await RestaurantService.getUserApplication(user.uid);
      setExistingApplication(updatedApplication);

    } catch (error) {
      console.error('Başvuru gönderme hatası:', error);
      const errorMessage = error instanceof Error ? error.message : 'Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading durumu
  if (authLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Giriş yapmamış kullanıcı
  if (!user) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center">
            <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Giriş Yapın
            </h2>
            <p className="text-gray-600 mb-6">
              Restoran başvurusu yapmak için giriş yapmanız gerekiyor.
            </p>
            <div className="space-y-3">
              <Link href="/register" className="btn-primary w-full">
                Kayıt Ol
              </Link>
              <Link href="/restaurant-login" className="btn-outline w-full">
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Başvuru durumu gösterimi
  const getStatusDisplay = () => {
    switch (applicationStatus) {
      case 'pending':
        return {
          icon: <Loader2 className="h-16 w-16 text-yellow-500 animate-spin mx-auto mb-4" />,
          title: 'Başvurunuz İnceleniyor',
          message: 'Restoran başvurunuz titizlikle değerlendiriliyor. Sonuç hakkında e-posta ile bilgilendirileceksiniz.',
          color: 'text-yellow-600'
        };
      case 'approved':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />,
          title: 'Başvurunuz Onaylandı!',
          message: 'Tebrikler! Restoran başvurunuz onaylandı. Artık restoran panelinize erişebilirsiniz.',
          color: 'text-green-600',
          action: (
            <Link href="/restaurant" className="btn-primary">
              Restoran Paneline Git
            </Link>
          )
        };
      case 'rejected':
        return {
          icon: <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />,
          title: 'Başvurunuz Reddedildi',
          message: existingApplication?.adminNotes || 'Başvurunuz bu sefer onaylanamadı. Eksiklikleri giderdikten sonra tekrar başvuru yapabilirsiniz.',
          color: 'text-red-600',
          action: (
            <button
              onClick={() => {
                setApplicationStatus('none');
                setExistingApplication(null);
              }}
              className="btn-primary"
            >
              Yeni Başvuru Yap
            </button>
          )
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Ana Sayfaya Dön Butonu */}
      <div className="container-responsive pt-4">
        <BackToHomeButton variant="minimal" />
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container-responsive text-center">
          <Store className="h-16 w-16 mx-auto mb-6 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">
            Restoran Başvurusu
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            NeYisek.com platformuna katılın ve müşterilerinize ulaşın
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 bg-gray-50">
        <div className="container-responsive">
          <div className="max-w-2xl mx-auto">
            {statusDisplay ? (
              // Başvuru durumu gösterimi
              <div className="card text-center p-8">
                {statusDisplay.icon}
                <h2 className={`text-2xl font-bold mb-4 ${statusDisplay.color}`}>
                  {statusDisplay.title}
                </h2>
                <p className="text-gray-600 mb-6">
                  {statusDisplay.message}
                </p>
                {statusDisplay.action}
                
                {existingApplication && (
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Başvuru Detayları:</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Restoran:</strong> {existingApplication.restaurantName}</p>
                      <p><strong>Yetkili:</strong> {existingApplication.ownerName}</p>
                      <p><strong>Başvuru Tarihi:</strong> {new Date(existingApplication.appliedAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Başvuru formu
              <div className="card p-8">
                <div className="text-center mb-8">
                  <Building2 className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Restoran Bilgilerinizi Girin
                  </h2>
                  <p className="text-gray-600">
                    Başvurunuzun hızlı değerlendirilmesi için tüm alanları eksiksiz doldurun
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Restoran Adı */}
                  <div>
                    <label htmlFor="restaurantName" className="form-label">
                      Restoran Adı *
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        id="restaurantName"
                        name="restaurantName"
                        value={formData.restaurantName}
                        onChange={handleInputChange}
                        className="form-input pl-10"
                        placeholder="Restoranınızın adı"
                        required
                      />
                    </div>
                  </div>

                  {/* Yetkili Adı */}
                  <div>
                    <label htmlFor="ownerName" className="form-label">
                      Yetkili Adı Soyadı *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        id="ownerName"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        className="form-input pl-10"
                        placeholder="Adınız ve soyadınız"
                        required
                      />
                    </div>
                  </div>

                  {/* E-posta */}
                  <div>
                    <label htmlFor="email" className="form-label">
                      E-posta Adresi *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input pl-10"
                        placeholder="restoran@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Telefon */}
                  <div>
                    <label htmlFor="phone" className="form-label">
                      Telefon Numarası *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input pl-10"
                        placeholder="0555 123 45 67"
                        required
                      />
                    </div>
                  </div>

                  {/* Konum ve Adres Seçimi */}
                  <LocationPicker
                    initialAddress={formData.address}
                    initialLat={formData.latitude}
                    initialLng={formData.longitude}
                    initialCity={formData.city}
                    initialDistrict={formData.district}
                    onLocationSelect={handleLocationSelect}
                    onAddressChange={handleAddressChange}
                    onCityChange={handleCityChange}
                    onDistrictChange={handleDistrictChange}
                  />

                  {/* İş Ruhsatı */}
                  <div>
                    <label htmlFor="businessLicense" className="form-label">
                      İş Ruhsatı Numarası *
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        id="businessLicense"
                        name="businessLicense"
                        value={formData.businessLicense}
                        onChange={handleInputChange}
                        className="form-input pl-10"
                        placeholder="İş ruhsatı numaranız"
                        required
                      />
                    </div>
                  </div>

                  {/* Vergi Numarası */}
                  <div>
                    <label htmlFor="taxNumber" className="form-label">
                      Vergi Numarası *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <input
                        type="text"
                        id="taxNumber"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        className="form-input pl-10"
                        placeholder="Vergi numaranız"
                        required
                      />
                    </div>
                  </div>

                  {/* Kategori Seçimi */}
                  <div>
                    <label className="form-label">
                      Restoran Kategorileri *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      Restoranınızın sunduğu yemek kategorilerini seçin (birden fazla seçebilirsiniz)
                    </p>
                    
                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                        <span className="ml-2 text-gray-600">Kategoriler yükleniyor...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            onClick={() => handleCategoryToggle(category.id)}
                            className={`
                              cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 
                              ${formData.categoryIds.includes(category.id)
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                              }
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={formData.categoryIds.includes(category.id)}
                                onChange={() => handleCategoryToggle(category.id)}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                              <div className="flex items-center space-x-2">
                                <span className="text-xl">{category.icon || '🍽️'}</span>
                                <span className="font-medium text-sm">{category.name}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Seçilen kategoriler özeti */}
                    {formData.categoryIds.length > 0 && (
                      <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>Seçilen kategoriler:</strong> {
                            formData.categoryIds.map(id => {
                              const category = categories.find(cat => cat.id === id);
                              return category?.name;
                            }).join(', ')
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bilgilendirme */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Başvuru Süreci Hakkında:</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Başvurunuz 1-3 iş günü içinde değerlendirilir</li>
                          <li>Sonuç e-posta ile bildirilir</li>
                          <li>Onay sonrası hemen satışa başlayabilirsiniz</li>
                          <li>Komisyon oranı %9'dur</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Başvuru Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Başvuru Gönder
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white py-12">
        <div className="container-responsive text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sorularınız mı var?
          </h2>
          <p className="text-gray-600 mb-6">
            Restoran başvuru süreci hakkında detaylı bilgi almak isterseniz
          </p>
          <Link href="/contact" className="btn-outline">
            İletişime Geçin
          </Link>
        </div>
      </section>
    </main>
  );
} 