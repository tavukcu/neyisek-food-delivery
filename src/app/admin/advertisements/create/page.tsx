'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AdvertisementService } from '@/services/advertisementService';
import { 
  ArrowLeft, 
  Upload, 
  Calendar,
  Target,
  Palette,
  Link as LinkIcon,
  Eye,
  Save
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CreateAdvertisementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    linkUrl: '',
    buttonText: '',
    startDate: '',
    endDate: '',
    position: 'banner' as 'hero' | 'banner' | 'sidebar' | 'popup',
    priority: 1,
    targetAudience: 'all' as 'all' | 'customers' | 'restaurants',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    isActive: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageFile) {
      toast.error('Lütfen bir görsel seçin');
      return;
    }

    if (!user) {
      toast.error('Oturum açmanız gerekiyor');
      return;
    }

    try {
      setLoading(true);

      // Görsel yükle
      const imageUrl = await AdvertisementService.uploadImage(imageFile);

      // Reklam oluştur
      const advertisementData = {
        ...formData,
        imageUrl,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        createdBy: user.uid
      };

      await AdvertisementService.createAdvertisement(advertisementData);
      
      toast.success('Reklam başarıyla oluşturuldu');
      router.push('/admin/advertisements');
    } catch (error) {
      console.error('Reklam oluşturma hatası:', error);
      toast.error('Reklam oluşturulamadı');
    } finally {
      setLoading(false);
    }
  };

  const getPositionDescription = (position: string) => {
    switch (position) {
      case 'hero': return 'Ana sayfanın en üstünde büyük banner olarak gösterilir';
      case 'banner': return 'Sayfa içeriği arasında banner olarak gösterilir';
      case 'sidebar': return 'Sayfanın kenar çubuğunda gösterilir';
      case 'popup': return 'Popup pencere olarak gösterilir';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/advertisements"
            className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Yeni Reklam Oluştur</h1>
            <p className="text-gray-600 mt-2">
              Kampanyanızı oluşturun ve yayınlayın
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
          {/* Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Temel Bilgiler
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reklam Başlığı *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Örn: Yaz Kampanyası %50 İndirim"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Reklam açıklaması..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Link URL
                    </label>
                    <input
                      type="url"
                      name="linkUrl"
                      value={formData.linkUrl}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buton Metni
                    </label>
                    <input
                      type="text"
                      name="buttonText"
                      value={formData.buttonText}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Örn: Hemen Al, Detaylar"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reklam Görseli *
              </h2>
              
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Görseli Kaldır
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <label className="cursor-pointer">
                          <span className="text-primary-600 hover:text-primary-700 font-medium">
                            Görsel yüklemek için tıklayın
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-gray-500 text-sm mt-1">
                          PNG, JPG, GIF (Max 5MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Display Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Görüntüleme Ayarları
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pozisyon *
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="hero">Ana Banner</option>
                    <option value="banner">Sayfa İçi Banner</option>
                    <option value="sidebar">Kenar Çubuğu</option>
                    <option value="popup">Popup</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {getPositionDescription(formData.position)}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Öncelik
                    </label>
                    <input
                      type="number"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Yüksek öncelik üstte gösterilir (1-10)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hedef Kitle
                    </label>
                    <select
                      name="targetAudience"
                      value={formData.targetAudience}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="all">Herkese</option>
                      <option value="customers">Sadece Müşterilere</option>
                      <option value="restaurants">Sadece Restoranlara</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Arka Plan Rengi
                    </label>
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metin Rengi
                    </label>
                    <input
                      type="color"
                      name="textColor"
                      value={formData.textColor}
                      onChange={handleInputChange}
                      className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Yayın Programı
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bitiş Tarihi *
                  </label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Actions */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Önizleme
              </h2>
              
              <div className="space-y-4">
                {imagePreview && (
                  <div 
                    className="rounded-lg p-4 border-2 border-dashed border-gray-200"
                    style={{ 
                      backgroundColor: formData.backgroundColor,
                      color: formData.textColor 
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full rounded-lg mb-3"
                    />
                    {formData.title && (
                      <h3 className="font-bold text-lg mb-2">
                        {formData.title}
                      </h3>
                    )}
                    {formData.description && (
                      <p className="text-sm mb-3">
                        {formData.description}
                      </p>
                    )}
                    {formData.buttonText && (
                      <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm">
                        {formData.buttonText}
                      </button>
                    )}
                  </div>
                )}
                
                {!imagePreview && (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Görsel seçtikten sonra önizleme görünecek</p>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Durum
              </h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Reklamı hemen aktif et
                  </span>
                </label>
                
                <p className="text-sm text-gray-500">
                  Pasif reklamlar belirlenen tarih aralığında bile gösterilmez.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Reklamı Oluştur
                    </>
                  )}
                </button>
                
                <Link
                  href="/admin/advertisements"
                  className="w-full btn-outline text-center block"
                >
                  İptal
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 