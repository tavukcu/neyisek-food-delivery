'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import CalorieCalculator from '@/components/CalorieCalculator';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Upload,
  Plus,
  X,
  Save,
  Eye,
  DollarSign,
  Clock,
  Tag,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { ProductService } from '@/services/productService';
import { StorageService } from '@/services/storageService';
import { toast } from 'react-hot-toast';

const categories = [
  'Pizza',
  'Burger', 
  'Döner',
  'Pide & Lahmacun',
  'Izgara',
  'Salata',
  'Tatlı',
  'İçecek',
  'Aperatif',
  'Ana Yemek'
];

const dietaryTags = [
  'Vejetaryen',
  'Vegan', 
  'Glutensiz',
  'Laktoz İçermez',
  'Et',
  'Tavuk',
  'Balık',
  'Deniz Ürünleri',
  'Acılı',
  'Sağlıklı',
  'Popüler',
  'Yeni',
  'İndirimde'
];

export default function AddProductPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    ingredients: '',
    tags: [] as string[],
    isActive: true,
    image: null as File | null,
    calories: 0
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [error, setError] = useState('');

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || user.role !== 'restaurant')) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Input değişiklikleri
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Hata temizle
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Resim yükleme
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Preview oluştur
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tag ekleme/çıkarma
  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Handle calorie change from calculator
  const handleCalorieChange = (calories: number) => {
    setFormData(prev => ({
      ...prev,
      calories
    }));
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ürün adı zorunludur';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Ürün açıklaması zorunludur';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Geçerli bir fiyat giriniz';
    }

    if (!formData.category) {
      newErrors.category = 'Kategori seçiniz';
    }

    if (!formData.preparationTime || parseInt(formData.preparationTime) <= 0) {
      newErrors.preparationTime = 'Hazırlık süresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form gönderme
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'restaurant') return;

    console.log('🍕 Form gönderiliyor...');
    console.log('📊 Kalori değeri:', formData.calories);
    console.log('🔢 Form verileri:', formData);

    // Form validasyonu
    if (!validateForm()) {
      console.log('❌ Form validasyon hatası');
      return;
    }

    setUploadLoading(true);
    setError('');

    try {
      // Resim yükleme
      let imageUrl = '';
      if (formData.image) {
        console.log('📸 Resim yükleniyor...');
        const validation = StorageService.validateFile(formData.image);
        if (!validation.isValid) {
          setError(validation.error!);
          setUploadLoading(false);
          return;
        }

        imageUrl = await StorageService.uploadProductImage(formData.image);
        console.log('✅ Resim yüklendi:', imageUrl);
      }

      // Ürün verisini hazırla
      const productData = {
        restaurantId: user.uid,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryId: formData.category,
        imageUrl: imageUrl || '',
        images: imageUrl ? [{ 
          id: '1', 
          url: imageUrl, 
          alt: formData.name, 
          isPrimary: true, 
          sortOrder: 0 
        }] : [],
        variants: [],
        ingredients: formData.ingredients.split(',').map(i => i.trim()).filter(Boolean),
        allergens: [],
        isVegetarian: formData.tags.includes('Vejetaryen'),
        isVegan: formData.tags.includes('Vegan'),
        isGlutenFree: formData.tags.includes('Glutensiz'),
        preparationTime: parseInt(formData.preparationTime),
        calories: formData.calories || 0, // Kalori değerini doğru şekilde kaydet
        isActive: formData.isActive,
        stock: 0,
        minStock: 5,
        maxStock: 100,
        tags: formData.tags.map(tag => tag.toLowerCase()),
        rating: 0,
        reviewCount: 0,
        isPopular: false,
        isFeatured: false
      };

      console.log('📦 Ürün verisi hazırlandı:', productData);
      console.log('🔥 Kalori değeri (final):', productData.calories);

      // Firebase'e kaydet
      const productId = await ProductService.createProduct(productData);
      console.log('✅ Ürün başarıyla eklendi, ID:', productId);
      
      toast.success('Ürün başarıyla eklendi!');
      
      // Formu sıfırla
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        preparationTime: '',
        ingredients: '',
        tags: [],
        isActive: true,
        image: null,
        calories: 0
      });
      setImagePreview(null);
      
    } catch (error: any) {
      console.error('❌ Ürün ekleme hatası:', error);
      setError('Ürün eklenirken bir hata oluştu: ' + error.message);
      toast.error('Ürün eklenirken hata oluştu!');
    } finally {
      setUploadLoading(false);
    }
  };

  // Loading durumu
  if (uploadLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Sayfa yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Header />
      
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive max-w-4xl">
          {/* Başlık */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link 
                href="/restaurant/menu" 
                className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Yeni Ürün Ekle
                </h1>
                <p className="text-gray-600 mt-1">
                  Menünüze yeni bir ürün ekleyin
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Sol Kolon - Ana Bilgiler */}
              <div className="lg:col-span-2 space-y-6">
                {/* Temel Bilgiler */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Temel Bilgiler
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Ürün Adı */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ürün Adı *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Örn: Pizza Margherita"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    {/* Açıklama */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ürün Açıklaması *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Ürününüzü detaylı bir şekilde tanımlayın..."
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                          errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>

                    {/* Malzemeler */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Malzemeler
                      </label>
                      <textarea
                        name="ingredients"
                        value={formData.ingredients}
                        onChange={handleInputChange}
                        rows={2}
                        placeholder="Domates, peynir, fesleğen..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Fiyat ve Süre */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Fiyat ve Süre
                  </h2>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Fiyat */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fiyat (₺) *
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          step="0.50"
                          min="0"
                          placeholder="0.00"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.price ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                      )}
                    </div>

                    {/* Hazırlık Süresi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hazırlık Süresi (dk) *
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          name="preparationTime"
                          value={formData.preparationTime}
                          onChange={handleInputChange}
                          min="1"
                          placeholder="15"
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                            errors.preparationTime ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                      </div>
                      {errors.preparationTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.preparationTime}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Etiketler */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Ürün Etiketleri
                  </h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Ürününüzü daha iyi tanımlamak için etiketler seçin
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {dietaryTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                          formData.tags.includes(tag)
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kalori Hesaplayıcı */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Beslenme Bilgileri
                  </h2>
                  <CalorieCalculator
                    onCalorieChange={handleCalorieChange}
                    initialCalories={formData.calories}
                  />
                </div>
              </div>

              {/* Sağ Kolon - Resim ve Kategori */}
              <div className="space-y-6">
                {/* Kategori */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Kategori
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün Kategorisi *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                    )}
                  </div>
                </div>

                {/* Ürün Resmi */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Ürün Resmi
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Resim Yükleme Alanı */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {imagePreview ? (
                        <div className="space-y-4">
                          <img
                            src={imagePreview}
                            alt="Ürün önizleme"
                            className="mx-auto rounded-lg max-h-48 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData(prev => ({ ...prev, image: null }));
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Resmi Kaldır
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="text-sm text-gray-600">
                            <label htmlFor="image-upload" className="cursor-pointer">
                              <span className="font-medium text-primary-600 hover:text-primary-500">
                                Dosya seçin
                              </span>
                              <span> veya sürükleyip bırakın</span>
                            </label>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG, GIF - Maksimum 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Durum */}
                <div className="card p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Ürün Durumu
                  </h2>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Ürünü Aktif Et
                      </p>
                      <p className="text-sm text-gray-600">
                        Aktif ürünler menüde görünür
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        formData.isActive ? 'bg-primary-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                          formData.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Butonları */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="spinner-sm"></div>
                    Ekleniyor...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Ürünü Kaydet
                  </>
                )}
              </button>
              
              <Link 
                href="/restaurant/menu" 
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