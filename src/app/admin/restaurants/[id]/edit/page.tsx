'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RestaurantService } from '@/services/restaurantService';
import { CategoryService } from '@/services/categoryService';
import { RestaurantInfo, Category } from '@/types';
import { 
  Save, 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  DollarSign,
  Truck,
  Star,
  Tag,
  AlertCircle,
  X
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export default function EditRestaurantPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryIds: [] as string[],
    phone: '',
    email: '',
    website: '',
    address: {
      street: '',
      city: '',
      district: '',
      zipCode: '',
      country: 'Türkiye',
      coordinates: { lat: 0, lng: 0 }
    },
    workingHours: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '22:00', isOpen: true },
      saturday: { open: '09:00', close: '22:00', isOpen: true },
      sunday: { open: '09:00', close: '22:00', isOpen: true }
    },
    deliveryRadius: 5,
    minimumOrderAmount: 50,
    deliveryFee: 10,
    estimatedDeliveryTime: 30,
    isOpen: true,
    commissionRate: 9,
    coverImageUrl: ''
  });

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push('/');
      return;
    }
  }, [user, authLoading, router]);

  // Veri yükleme
  useEffect(() => {
    if (user && user.isAdmin && params.id) {
      loadData();
    }
  }, [user, params.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [restaurantData, categoriesData] = await Promise.all([
        RestaurantService.getRestaurantById(params.id as string),
        CategoryService.getActiveCategories()
      ]);

      if (!restaurantData) {
        toast.error('Restoran bulunamadı');
        router.push('/admin/restaurants/list');
        return;
      }

      setRestaurant(restaurantData);
      setCategories(categoriesData);
      
      // Form verilerini doldur
      setFormData({
        name: restaurantData.name || '',
        description: restaurantData.description || '',
        categoryIds: restaurantData.categoryIds || [],
        phone: restaurantData.phone || '',
        email: restaurantData.email || '',
        website: restaurantData.website || '',
        address: {
          street: restaurantData.address?.street || '',
          city: restaurantData.address?.city || '',
          district: restaurantData.address?.district || '',
          zipCode: restaurantData.address?.zipCode || '',
          country: restaurantData.address?.country || 'Türkiye',
          coordinates: restaurantData.address?.coordinates || { lat: 0, lng: 0 }
        },
        workingHours: restaurantData.workingHours || {
          monday: { open: '09:00', close: '22:00', isOpen: true },
          tuesday: { open: '09:00', close: '22:00', isOpen: true },
          wednesday: { open: '09:00', close: '22:00', isOpen: true },
          thursday: { open: '09:00', close: '22:00', isOpen: true },
          friday: { open: '09:00', close: '22:00', isOpen: true },
          saturday: { open: '09:00', close: '22:00', isOpen: true },
          sunday: { open: '09:00', close: '22:00', isOpen: true }
        },
        deliveryRadius: restaurantData.deliveryRadius || 5,
        minimumOrderAmount: restaurantData.minimumOrderAmount || 50,
        deliveryFee: restaurantData.deliveryFee || 10,
        estimatedDeliveryTime: restaurantData.estimatedDeliveryTime || 30,
        isOpen: restaurantData.isOpen !== undefined ? restaurantData.isOpen : true,
        commissionRate: restaurantData.commissionRate || 9,
        coverImageUrl: restaurantData.coverImageUrl || ''
      });
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Restoran bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: type === 'number' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleWorkingHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day as keyof typeof prev.workingHours],
          [field]: value
        }
      }
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId]
    }));
  };

  // Kapak görseli yükleme
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      toast.error('Sadece resim dosyaları yüklenebilir');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Eski görseli sil (varsa)
      if (formData.coverImageUrl) {
        try {
          const oldImageRef = ref(storage, formData.coverImageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.log('Eski görsel silinirken hata (normal):', error);
        }
      }

      // Yeni görseli yükle
      const fileName = `restaurants/${params.id}/cover-${Date.now()}.${file.name.split('.').pop()}`;
      const imageRef = ref(storage, fileName);
      
      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);
      
      setFormData(prev => ({ ...prev, coverImageUrl: downloadURL }));
      toast.success('Kapak görseli başarıyla yüklendi!');
      
    } catch (error) {
      console.error('Görsel yükleme hatası:', error);
      toast.error('Görsel yüklenirken hata oluştu');
    } finally {
      setUploadingImage(false);
    }
  };

  // Kapak görselini kaldır
  const removeImage = async () => {
    if (!formData.coverImageUrl) return;

    try {
      const imageRef = ref(storage, formData.coverImageUrl);
      await deleteObject(imageRef);
      setFormData(prev => ({ ...prev, coverImageUrl: '' }));
      toast.success('Kapak görseli kaldırıldı');
    } catch (error) {
      console.error('Görsel silme hatası:', error);
      toast.error('Görsel silinirken hata oluştu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant) return;

    try {
      setSaving(true);

      // Restoran bilgilerini güncelle
      const restaurantRef = doc(db, 'restaurants', restaurant.id);
      await updateDoc(restaurantRef, {
        name: formData.name,
        description: formData.description,
        categoryIds: formData.categoryIds,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        address: formData.address,
        workingHours: formData.workingHours,
        deliveryRadius: formData.deliveryRadius,
        minimumOrderAmount: formData.minimumOrderAmount,
        deliveryFee: formData.deliveryFee,
        estimatedDeliveryTime: formData.estimatedDeliveryTime,
        isOpen: formData.isOpen,
        commissionRate: formData.commissionRate,
        coverImageUrl: formData.coverImageUrl,
        updatedAt: new Date()
      });

      toast.success('Restoran bilgileri başarıyla güncellendi!');
      router.push('/admin/restaurants/list');
      
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      toast.error('Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Restoran Bulunamadı</h2>
          <Link href="/admin/restaurants/list" className="btn-primary">
            Geri Dön
          </Link>
        </div>
      </div>
    );
  }

  const dayNames = {
    monday: 'Pazartesi',
    tuesday: 'Salı',
    wednesday: 'Çarşamba',
    thursday: 'Perşembe',
    friday: 'Cuma',
    saturday: 'Cumartesi',
    sunday: 'Pazar'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/restaurants/list"
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restoran Düzenle</h1>
              <p className="text-gray-600 mt-1">{restaurant.name}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Ana Bilgiler */}
            <div className="lg:col-span-2 space-y-6">
              {/* Temel Bilgiler */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-primary-600" />
                  Temel Bilgiler
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Restoran Adı *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Durum</label>
                    <select
                      name="isOpen"
                      value={formData.isOpen.toString()}
                      onChange={(e) => setFormData(prev => ({ ...prev, isOpen: e.target.value === 'true' }))}
                      className="form-input"
                    >
                      <option value="true">Açık</option>
                      <option value="false">Kapalı</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="form-label">Açıklama *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary-600" />
                  İletişim Bilgileri
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Telefon</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">E-posta</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="form-label">Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://example.com"
                  />
                </div>
              </div>

              {/* Adres Bilgileri */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary-600" />
                  Adres Bilgileri
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Sokak/Mahalle</label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="form-label">İl</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">İlçe</label>
                      <input
                        type="text"
                        name="address.district"
                        value={formData.address.district}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Posta Kodu</label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Teslimat Ayarları */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary-600" />
                  Teslimat Ayarları
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Teslimat Yarıçapı (km)</label>
                    <input
                      type="number"
                      name="deliveryRadius"
                      value={formData.deliveryRadius}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                      max="50"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Minimum Sipariş Tutarı (₺)</label>
                    <input
                      type="number"
                      name="minimumOrderAmount"
                      value={formData.minimumOrderAmount}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Teslimat Ücreti (₺)</label>
                    <input
                      type="number"
                      name="deliveryFee"
                      value={formData.deliveryFee}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Tahmini Teslimat Süresi (dk)</label>
                    <input
                      type="number"
                      name="estimatedDeliveryTime"
                      value={formData.estimatedDeliveryTime}
                      onChange={handleInputChange}
                      className="form-input"
                      min="10"
                      max="120"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="form-label">Komisyon Oranı (%)</label>
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    max="50"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-600" />
                  Çalışma Saatleri
                </h2>
                
                <div className="space-y-4">
                  {Object.entries(dayNames).map(([day, dayName]) => (
                    <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.workingHours[day as keyof typeof formData.workingHours].isOpen}
                            onChange={(e) => handleWorkingHoursChange(day, 'isOpen', e.target.checked)}
                            className="form-checkbox"
                          />
                          <span className="font-medium text-gray-700">{dayName}</span>
                        </label>
                      </div>
                      
                      {formData.workingHours[day as keyof typeof formData.workingHours].isOpen && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={formData.workingHours[day as keyof typeof formData.workingHours].open}
                            onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                            className="form-input w-32"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="time"
                            value={formData.workingHours[day as keyof typeof formData.workingHours].close}
                            onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                            className="form-input w-32"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Yan Panel */}
            <div className="space-y-6">
              {/* Kapak Görseli */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary-600" />
                  Kapak Görseli
                </h2>
                
                {formData.coverImageUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Image
                        src={formData.coverImageUrl}
                        alt="Kapak görseli"
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <label className="btn-outline w-full cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      Görseli Değiştir
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Kapak görseli yükleyin</p>
                    <label className="btn-primary cursor-pointer flex items-center justify-center gap-2 mx-auto w-fit">
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Yükleniyor...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Görsel Seç
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Maksimum 5MB, JPG, PNG, WebP
                    </p>
                  </div>
                )}
              </div>

              {/* Kategoriler */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Kategoriler</h2>
                
                <div className="space-y-3">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categoryIds.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="form-checkbox"
                      />
                      <span className="text-xl">{category.icon || '🍽️'}</span>
                      <span className="font-medium text-gray-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kaydet Butonu */}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 