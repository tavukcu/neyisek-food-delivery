'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Upload, 
  FileImage,
  Save,
  Eye,
  EyeOff,
  Smile
} from 'lucide-react';
import Link from 'next/link';

// 3D görünümlü kategori ikonları
const CATEGORY_ICONS = [
  { emoji: '🍕', name: 'Pizza', category: 'Ana Yemek' },
  { emoji: '🍔', name: 'Burger', category: 'Ana Yemek' },
  { emoji: '🌮', name: 'Taco', category: 'Ana Yemek' },
  { emoji: '🥙', name: 'Döner', category: 'Ana Yemek' },
  { emoji: '🍖', name: 'Et', category: 'Ana Yemek' },
  { emoji: '🍗', name: 'Tavuk', category: 'Ana Yemek' },
  { emoji: '🍝', name: 'Makarna', category: 'Ana Yemek' },
  { emoji: '🍜', name: 'Çorba', category: 'Ana Yemek' },
  { emoji: '🍱', name: 'Bento', category: 'Ana Yemek' },
  { emoji: '🥗', name: 'Salata', category: 'Sağlıklı' },
  { emoji: '🥪', name: 'Sandviç', category: 'Atıştırmalık' },
  { emoji: '🌭', name: 'Hot Dog', category: 'Atıştırmalık' },
  { emoji: '🥨', name: 'Simit', category: 'Atıştırmalık' },
  { emoji: '🍟', name: 'Patates', category: 'Atıştırmalık' },
  { emoji: '🧀', name: 'Peynir', category: 'Atıştırmalık' },
  { emoji: '🥤', name: 'İçecek', category: 'İçecek' },
  { emoji: '🧃', name: 'Meyve Suyu', category: 'İçecek' },
  { emoji: '☕', name: 'Kahve', category: 'İçecek' },
  { emoji: '🧊', name: 'Soğuk İçecek', category: 'İçecek' },
  { emoji: '🍺', name: 'Bira', category: 'İçecek' },
  { emoji: '🍰', name: 'Pasta', category: 'Tatlı' },
  { emoji: '🧁', name: 'Cupcake', category: 'Tatlı' },
  { emoji: '🍪', name: 'Kurabiye', category: 'Tatlı' },
  { emoji: '🍩', name: 'Donut', category: 'Tatlı' },
  { emoji: '🍨', name: 'Dondurma', category: 'Tatlı' },
  { emoji: '🍫', name: 'Çikolata', category: 'Tatlı' },
  { emoji: '🍭', name: 'Şeker', category: 'Tatlı' },
  { emoji: '🥧', name: 'Turta', category: 'Tatlı' },
  { emoji: '🧇', name: 'Waffle', category: 'Tatlı' },
  { emoji: '🥞', name: 'Pankek', category: 'Kahvaltı' },
  { emoji: '🍳', name: 'Yumurta', category: 'Kahvaltı' },
  { emoji: '🥓', name: 'Pastırma', category: 'Kahvaltı' },
  { emoji: '🥐', name: 'Kruvasan', category: 'Kahvaltı' },
  { emoji: '🍞', name: 'Ekmek', category: 'Kahvaltı' },
  { emoji: '🧈', name: 'Tereyağı', category: 'Kahvaltı' },
  { emoji: '🥯', name: 'Bagel', category: 'Kahvaltı' },
  { emoji: '🍎', name: 'Meyve', category: 'Sağlıklı' },
  { emoji: '🥕', name: 'Sebze', category: 'Sağlıklı' },
  { emoji: '🥑', name: 'Avokado', category: 'Sağlıklı' },
  { emoji: '🍅', name: 'Domates', category: 'Sağlıklı' },
  { emoji: '🥒', name: 'Salatalık', category: 'Sağlıklı' },
  { emoji: '🌽', name: 'Mısır', category: 'Sağlıklı' },
  { emoji: '🍯', name: 'Bal', category: 'Doğal' },
  { emoji: '🥛', name: 'Süt', category: 'Doğal' },
  { emoji: '🧊', name: 'Buzlu', category: 'Soğuk' },
  { emoji: '🔥', name: 'Sıcak', category: 'Sıcak' },
  { emoji: '🌶️', name: 'Acılı', category: 'Baharatlı' },
  { emoji: '🧄', name: 'Sarımsak', category: 'Baharatlı' },
  { emoji: '🥢', name: 'Asya', category: 'Dünya Mutfağı' },
  { emoji: '🍽️', name: 'Yemek', category: 'Genel' },
  { emoji: '⭐', name: 'Özel', category: 'Premium' }
];

// Icon kategorileri
const ICON_CATEGORIES = [
  'Tümü',
  'Ana Yemek',
  'Atıştırmalık', 
  'İçecek',
  'Tatlı',
  'Kahvaltı',
  'Sağlıklı',
  'Doğal',
  'Dünya Mutfağı',
  'Premium'
];

// Kategori ekleme sayfası komponenti
export default function AddCategoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedIcon, setSelectedIcon] = useState('🏷️');
  const [iconFilter, setIconFilter] = useState('Tümü');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sortOrder: 1,
    isActive: true,
    color: '#3B82F6' // Varsayılan mavi renk
  });

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Form verisini güncelleme fonksiyonu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // Checkbox değişikliği
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Resim seçimi
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

  // Icon seçimi
  const handleIconSelect = (emoji: string) => {
    setSelectedIcon(emoji);
    setShowIconPicker(false);
    toast.success(`İkon seçildi: ${emoji}`);
  };

  // Filtrelenmiş ikonlar
  const filteredIcons = iconFilter === 'Tümü' 
    ? CATEGORY_ICONS 
    : CATEGORY_ICONS.filter(icon => icon.category === iconFilter);

  // Resim yükleme fonksiyonu
  const uploadImage = async (file: File): Promise<string> => {
    try {
      const imageRef = ref(storage, `categories/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(imageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      throw new Error('Resim yüklenirken bir hata oluştu');
    }
  };

  // Form gönderme fonksiyonu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Kategori adı zorunludur');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Kategori açıklaması zorunludur');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      
      // Resim varsa yükle
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (uploadError) {
          toast.error('Resim yüklenirken hata oluştu. Kategori resim olmadan ekleniyor.');
          console.error('Image upload error:', uploadError);
          // Resim yüklenemese bile devam et
        }
      }

      // Kategori verisini hazırla
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: selectedIcon, // 3D ikon eklendi
        imageUrl,
        color: formData.color, // Kategori rengi eklendi
        sortOrder: formData.sortOrder,
        isActive: formData.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Firestore'a kaydet
      await addDoc(collection(db, 'categories'), categoryData);

      toast.success('Kategori başarıyla eklendi!');
      router.push('/admin/categories');
    } catch (error) {
      console.error('Kategori ekleme hatası:', error);
      toast.error('Kategori eklenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading durumu
  if (loading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Yetkilendirme kontrol ediliyor...</p>
          </div>
        </div>
      </main>
    );
  }

  // Yetkisiz erişim
  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Sayfa İçeriği */}
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          {/* Geri Dön Butonu */}
          <Link 
            href="/admin/categories" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Kategorilere Dön
          </Link>

          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Yeni Kategori Ekle
            </h1>
            <p className="text-gray-600">
              Yeni bir ürün kategorisi oluşturun
            </p>
          </div>

          {/* Form */}
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="card p-8 space-y-6">
              {/* Kategori Adı */}
              <div>
                <label htmlFor="name" className="form-label">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Örn: Pizza, Burger, Döner"
                  required
                />
              </div>

              {/* Kategori Açıklaması */}
              <div>
                <label htmlFor="description" className="form-label">
                  Kategori Açıklaması *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input h-24"
                  placeholder="Kategori hakkında kısa bir açıklama yazın..."
                  required
                />
              </div>

              {/* 3D İkon Seçici */}
              <div>
                <label className="form-label">
                  Kategori İkonu *
                </label>
                <div className="space-y-4">
                  {/* Seçili İkon Gösterimi */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-3xl border-2 border-gray-200">
                      {selectedIcon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Seçili İkon: {CATEGORY_ICONS.find(icon => icon.emoji === selectedIcon)?.name || 'Varsayılan'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Bu ikon kategori kartlarında görünecektir
                      </p>
                    </div>
                  </div>

                  {/* İkon Seçici Butonu */}
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="btn-outline flex items-center gap-2"
                  >
                    <Smile className="h-4 w-4" />
                    {showIconPicker ? 'İkon Seçiciyi Kapat' : 'İkon Seç'}
                  </button>

                  {/* İkon Seçici Panel */}
                  {showIconPicker && (
                    <div className="border border-gray-200 rounded-lg p-4 bg-white">
                      {/* Kategori Filtreleri */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Kategori:</p>
                        <div className="flex flex-wrap gap-2">
                          {ICON_CATEGORIES.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setIconFilter(category)}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                                iconFilter === category
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* İkon Listesi */}
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto">
                        {filteredIcons.map((icon, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleIconSelect(icon.emoji)}
                            className={`w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all duration-200 ${
                              selectedIcon === icon.emoji
                                ? 'bg-primary-100 border-2 border-primary-500 scale-110'
                                : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                            }`}
                            title={`${icon.name} (${icon.category})`}
                          >
                            {icon.emoji}
                          </button>
                        ))}
                      </div>

                      {/* İkon İstatistikleri */}
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 text-center">
                        {filteredIcons.length} ikon gösteriliyor
                        {iconFilter !== 'Tümü' && ` (${iconFilter} kategorisi)`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kategori Rengi */}
              <div>
                <label className="form-label">
                  Kategori Rengi *
                </label>
                <div className="space-y-4">
                  {/* Seçili Renk Gösterimi */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-16 h-16 rounded-xl border-2 border-gray-200 flex items-center justify-center text-2xl" 
                      style={{ backgroundColor: formData.color }}
                    >
                      {selectedIcon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Seçili Renk: {formData.color}
                      </p>
                      <p className="text-sm text-gray-600">
                        Bu renk kategori kartının arka planında kullanılacaktır
                      </p>
                    </div>
                  </div>

                  {/* Renk Girişi */}
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="form-input w-32"
                      placeholder="#3B82F6"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>

                  {/* Önceden Tanımlı Renkler */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Popüler Renkler:</p>
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        '#3B82F6', // Mavi
                        '#EF4444', // Kırmızı
                        '#10B981', // Yeşil
                        '#F59E0B', // Turuncu
                        '#8B5CF6', // Mor
                        '#EC4899', // Pembe
                        '#06B6D4', // Cyan
                        '#84CC16', // Lime
                        '#F97316', // Orange
                        '#6366F1', // Indigo
                        '#14B8A6', // Teal
                        '#F43F5E', // Rose
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, color }))}
                          className={`w-10 h-10 rounded-lg border-2 transition-all duration-200 ${
                            formData.color === color
                              ? 'border-gray-800 scale-110'
                              : 'border-gray-300 hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sıralama */}
              <div>
                <label htmlFor="sortOrder" className="form-label">
                  Sıralama Numarası
                </label>
                <input
                  type="number"
                  id="sortOrder"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  className="form-input"
                  min="1"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Düşük numara önce görünür
                </p>
              </div>

              {/* Resim Yükleme */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Kategori Resmi</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="image"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {imagePreview ? (
                          <img 
                            src={imagePreview} 
                            alt="Önizleme" 
                            className="w-24 h-24 object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <>
                            <Upload className="w-10 h-10 mb-4 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Resim yüklemek için tıklayın</span>
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG veya JPEG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input 
                        id="image" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  
                  {/* Test butonu - geliştirme için */}
                  {imageFile && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Seçilen dosya:</strong> {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                      <p className="text-xs text-blue-600">
                        Kategori kaydedildiğinde resim otomatik olarak yüklenecektir.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Aktiflik Durumu */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  {formData.isActive ? (
                    <>
                      <Eye className="h-4 w-4 text-green-600" />
                      Kategori aktif (menüde görünür)
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-red-600" />
                      Kategori pasif (menüde görünmez)
                    </>
                  )}
                </label>
              </div>

              {/* Kaydet Butonu */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Kategori Ekleniyor...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Kategori Ekle
                    </>
                  )}
                </button>
                
                <Link
                  href="/admin/categories"
                  className="btn-outline"
                >
                  İptal
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
} 