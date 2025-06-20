'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Save,
  DollarSign,
  Clock,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

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

// Gerçek ürün verileri - Firebase'den yüklenecek
const useProductData = (productId: string) => {
  const [product, setProduct] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    category: '',
    image: '',
    isActive: true,
    preparationTime: 15,
    ingredients: '',
    tags: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productId) {
      loadProductData(productId);
    }
  }, [productId]);

  const loadProductData = async (id: string) => {
    try {
      setLoading(true);
      // Burada gerçek Firebase verilerini yükleyebilirsiniz
      // Şimdilik boş veriler döndürüyoruz
    } catch (error) {
      console.error('Ürün verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return { product, setProduct, loading };
};

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const productId = params?.id as string;
  const { product, setProduct, loading: productLoading } = useProductData(productId);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    preparationTime: '',
    ingredients: '',
    tags: [] as string[],
    isActive: true,
    image: null as File | null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'restaurant')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Ürün verilerini yükle
  useEffect(() => {
    if (params.id) {
      // Gerçek uygulamada API çağrısı yapılacak
      setTimeout(() => {
        setFormData({
          name: product.name,
          description: product.description,
          price: product.price.toString(),
          category: product.category,
          preparationTime: product.preparationTime.toString(),
          ingredients: product.ingredients,
          tags: product.tags,
          isActive: product.isActive,
          image: null
        });
        setImagePreview(product.image);
      }, 500);
    }
  }, [params.id, product]);

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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // API çağrısı burada yapılacak
      console.log('Güncellenen ürün verileri:', formData);
      
      // Simülasyon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Başarı mesajı göster
      alert('Ürün başarıyla güncellendi!');
      
      // Menü sayfasına yönlendir
      router.push('/restaurant/menu');
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      alert('Ürün güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ürün silme
  const handleDelete = async () => {
    if (!confirm('Bu ürünü kalıcı olarak silmek istediğinizden emin misiniz?')) {
      return;
    }

    setIsDeleting(true);

    try {
      // API çağrısı burada yapılacak
      console.log('Ürün siliniyor:', params.id);
      
      // Simülasyon
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Başarı mesajı göster
      alert('Ürün başarıyla silindi!');
      
      // Menü sayfasına yönlendir
      router.push('/restaurant/menu');
    } catch (error) {
      console.error('Ürün silme hatası:', error);
      alert('Ürün silinirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || productLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ürün bilgileri yükleniyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || user.role !== 'restaurant') {
    return null;
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
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  Ürün Düzenle
                </h1>
                <p className="text-gray-600 mt-1">
                  {formData.name} ürününü düzenleyin
                </p>
              </div>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="btn-danger flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="spinner-sm"></div>
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Ürünü Sil
                  </>
                )}
              </button>
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
                          <div className="flex gap-2 justify-center">
                            <label htmlFor="image-upload" className="cursor-pointer text-primary-600 hover:text-primary-800 text-sm font-medium">
                              Resmi Değiştir
                            </label>
                            <span className="text-gray-300">|</span>
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
                          <input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
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