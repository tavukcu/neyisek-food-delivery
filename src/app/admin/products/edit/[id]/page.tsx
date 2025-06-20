'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { collection, doc, getDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Category, ProductVariant, ProductImage, Product } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Upload, 
  Save,
  Eye,
  EyeOff,
  Plus,
  X,
  Star,
  Tag,
  ImageIcon,
  Trash2,
  Loader
} from 'lucide-react';
import Link from 'next/link';

// Ürün düzenleme sayfası komponenti
export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [allergenInput, setAllergenInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantInput, setVariantInput] = useState({
    name: '',
    price: 0,
    stock: 0
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    ingredients: [] as string[],
    allergens: [] as string[],
    tags: [] as string[],
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    preparationTime: 15,
    calories: 0,
    stock: 999,
    minStock: 10,
    maxStock: 9999,
    isPopular: false,
    isFeatured: false,
    isActive: true
  });

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Verileri yükle
  useEffect(() => {
    if (user && user.isAdmin && productId) {
      loadData();
    }
  }, [user, productId]);

  // Kategorileri ve ürün verilerini yükle
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadCategories(), loadProduct()]);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      toast.error('Veriler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  // Kategorileri yükle
  const loadCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData: Category[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categoriesData.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          icon: data.icon,
          imageUrl: data.imageUrl || '',
          isActive: data.isActive,
          sortOrder: data.sortOrder || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      });

      categoriesData.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Kategoriler yüklenirken hata:', error);
    }
  };

  // Ürün verilerini yükle
  const loadProduct = async () => {
    try {
      const productDoc = await getDoc(doc(db, 'products', productId));
      
      if (!productDoc.exists()) {
        toast.error('Ürün bulunamadı');
        router.push('/admin/products');
        return;
      }

      const data = productDoc.data();
      const product: Product = {
        id: productDoc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        imageUrl: data.imageUrl || '',
        images: data.images || [],
        variants: data.variants || [],
        ingredients: data.ingredients || [],
        allergens: data.allergens || [],
        tags: data.tags || [],
        isVegetarian: data.isVegetarian || false,
        isVegan: data.isVegan || false,
        isGlutenFree: data.isGlutenFree || false,
        preparationTime: data.preparationTime || 15,
        calories: data.calories || 0,
        stock: data.stock || 0,
        minStock: data.minStock || 10,
        maxStock: data.maxStock || 9999,
        rating: data.rating || 0,
        reviewCount: data.reviewCount || 0,
        isPopular: data.isPopular || false,
        isFeatured: data.isFeatured || false,
        isActive: data.isActive || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };

      // Form verilerini doldur
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.categoryId,
        ingredients: product.ingredients,
        allergens: product.allergens,
        tags: product.tags,
        isVegetarian: product.isVegetarian,
        isVegan: product.isVegan,
        isGlutenFree: product.isGlutenFree,
        preparationTime: product.preparationTime,
        calories: product.calories,
        stock: product.stock,
        minStock: product.minStock,
        maxStock: product.maxStock,
        isPopular: product.isPopular,
        isFeatured: product.isFeatured,
        isActive: product.isActive
      });

      setExistingImages(product.images);
      setVariants(product.variants);

    } catch (error) {
      console.error('Ürün yüklenirken hata:', error);
      toast.error('Ürün yüklenirken bir hata oluştu');
      router.push('/admin/products');
    }
  };

  // Input değişikliklerini handle et
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // Checkbox değişikliklerini handle et
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Resim değişikliklerini handle et
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);

    // Önizlemeleri oluştur
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Yeni resim sil
  const removeNewImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  // Mevcut resim sil
  const removeExistingImage = (imageId: string, imageUrl: string) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  // Malzeme ekleme
  const addIngredient = () => {
    if (ingredientInput.trim() && !formData.ingredients.includes(ingredientInput.trim())) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()]
      }));
      setIngredientInput('');
    }
  };

  // Malzeme silme
  const removeIngredient = (ingredient: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter(i => i !== ingredient)
    }));
  };

  // Alerjen ekleme
  const addAllergen = () => {
    if (allergenInput.trim() && !formData.allergens.includes(allergenInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergenInput.trim()]
      }));
      setAllergenInput('');
    }
  };

  // Alerjen silme
  const removeAllergen = (allergen: string) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  // Tag ekleme
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  // Tag silme
  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Varyant ekleme
  const addVariant = () => {
    if (variantInput.name.trim() && variantInput.price > 0) {
      const newVariant: ProductVariant = {
        id: Date.now().toString(),
        name: variantInput.name.trim(),
        price: variantInput.price,
        stock: variantInput.stock,
        isActive: true
      };
      setVariants(prev => [...prev, newVariant]);
      setVariantInput({ name: '', price: 0, stock: 0 });
    }
  };

  // Varyant silme
  const removeVariant = (variantId: string) => {
    setVariants(prev => prev.filter(v => v.id !== variantId));
  };

  // Resim yükleme fonksiyonu
  const uploadImages = async (files: File[]): Promise<ProductImage[]> => {
    const uploadPromises = files.map(async (file, index) => {
      try {
        const imageRef = ref(storage, `products/${Date.now()}_${index}_${file.name}`);
        const snapshot = await uploadBytes(imageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        return {
          id: `${Date.now()}_${index}`,
          url,
          alt: formData.name,
          isPrimary: existingImages.length === 0 && index === 0, // İlk resim primary (eğer mevcut resim yoksa)
          sortOrder: existingImages.length + index
        };
      } catch (error) {
        console.error('Resim yükleme hatası:', error);
        throw new Error(`Resim ${index + 1} yüklenirken hata oluştu`);
      }
    });

    return Promise.all(uploadPromises);
  };

  // Eski resimleri sil
  const deleteOldImages = async (imageUrls: string[]) => {
    const deletePromises = imageUrls.map(async (url) => {
      try {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      } catch (error) {
        console.error('Resim silinirken hata:', error);
      }
    });

    await Promise.all(deletePromises);
  };

  // Form gönderme fonksiyonu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Ürün adı zorunludur');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Ürün açıklaması zorunludur');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Kategori seçimi zorunludur');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Ürün fiyatı 0\'dan büyük olmalıdır');
      return;
    }

    setIsSubmitting(true);

    try {
      let newImages: ProductImage[] = [];
      
      // Yeni resimleri yükle
      if (imageFiles.length > 0) {
        try {
          newImages = await uploadImages(imageFiles);
        } catch (uploadError) {
          toast.error('Yeni resimler yüklenirken hata oluştu.');
          console.error('Image upload error:', uploadError);
        }
      }

      // Eski resimleri sil
      if (imagesToDelete.length > 0) {
        await deleteOldImages(imagesToDelete);
      }

      // Tüm resimleri birleştir
      const allImages = [...existingImages, ...newImages];
      const primaryImageUrl = allImages.find(img => img.isPrimary)?.url || allImages[0]?.url || '';

      // Ürün verisini hazırla
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: formData.price,
        categoryId: formData.categoryId,
        imageUrl: primaryImageUrl,
        images: allImages,
        variants: variants,
        ingredients: formData.ingredients,
        allergens: formData.allergens,
        tags: formData.tags,
        isVegetarian: formData.isVegetarian,
        isVegan: formData.isVegan,
        isGlutenFree: formData.isGlutenFree,
        preparationTime: formData.preparationTime,
        calories: formData.calories,
        stock: formData.stock,
        minStock: formData.minStock,
        maxStock: formData.maxStock,
        isPopular: formData.isPopular,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        updatedAt: serverTimestamp()
      };

      // Firestore'da güncelle
      await updateDoc(doc(db, 'products', productId), productData);

      toast.success('Ürün başarıyla güncellendi!');
      router.push('/admin/products');
    } catch (error) {
      console.error('Ürün güncelleme hatası:', error);
      toast.error('Ürün güncellenirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Ürün bilgileri yükleniyor...</p>
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
            href="/admin/products" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Ürünlere Dön
          </Link>

          {/* Başlık */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ürün Düzenle
            </h1>
            <p className="text-gray-600">
              Ürün bilgilerini güncelleyin
            </p>
          </div>

          {/* Form */}
          <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Temel Bilgiler */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Temel Bilgiler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ürün Adı */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="form-label">
                      Ürün Adı *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Örn: Margherita Pizza, Cheeseburger"
                      required
                    />
                  </div>

                  {/* Kategori */}
                  <div>
                    <label htmlFor="categoryId" className="form-label">
                      Kategori *
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Kategori Seçin</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Temel Fiyat */}
                  <div>
                    <label htmlFor="price" className="form-label">
                      Temel Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Açıklama */}
                  <div className="md:col-span-2">
                    <label htmlFor="description" className="form-label">
                      Ürün Açıklaması *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="form-input h-24"
                      placeholder="Ürün hakkında detaylı açıklama yazın..."
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Resim Galerisi */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Resim Galerisi</h2>
                
                {/* Mevcut Resimler */}
                {existingImages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Mevcut Resimler</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          {image.isPrimary && (
                            <div className="absolute top-2 left-2 bg-primary-500 text-white text-xs px-2 py-1 rounded">
                              Ana Resim
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.id, image.url)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Yeni Resim Yükleme */}
                <div className="mb-6">
                  <label className="form-label">
                    Yeni Resim Ekle
                  </label>
                  <div className="mt-2">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="images"
                    />
                    <label
                      htmlFor="images"
                      className="btn-outline cursor-pointer inline-flex items-center gap-2"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Yeni Resim Ekle
                    </label>
                    <p className="text-sm text-gray-600 mt-2">
                      Birden fazla resim seçebilirsiniz.
                    </p>
                  </div>
                </div>

                {/* Yeni Resim Önizlemeleri */}
                {imagePreviews.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Yeni Resimler</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`New Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Varyantlar */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Ürün Varyantları</h2>
                <p className="text-gray-600 mb-4">
                  Farklı boyutlar veya seçenekler için varyant ekleyebilirsiniz (Küçük, Orta, Büyük vb.)
                </p>

                {/* Varyant Ekleme */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="form-label">Varyant Adı</label>
                    <input
                      type="text"
                      value={variantInput.name}
                      onChange={(e) => setVariantInput(prev => ({ ...prev, name: e.target.value }))}
                      className="form-input"
                      placeholder="Küçük, Orta, Büyük"
                    />
                  </div>
                  <div>
                    <label className="form-label">Fiyat (₺)</label>
                    <input
                      type="number"
                      value={variantInput.price}
                      onChange={(e) => setVariantInput(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="form-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Stok</label>
                    <input
                      type="number"
                      value={variantInput.stock}
                      onChange={(e) => setVariantInput(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      className="form-input"
                      min="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn-primary w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ekle
                    </button>
                  </div>
                </div>

                {/* Varyant Listesi */}
                {variants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Mevcut Varyantlar:</h3>
                    {variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-4">
                          <span className="font-medium">{variant.name}</span>
                          <span className="text-primary-600">₺{variant.price}</span>
                          <span className="text-gray-600">Stok: {variant.stock}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Malzemeler ve Alerjenler */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Malzemeler ve Alerjenler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Malzemeler */}
                  <div>
                    <label className="form-label">Malzemeler</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={ingredientInput}
                        onChange={(e) => setIngredientInput(e.target.value)}
                        className="form-input flex-1"
                        placeholder="Malzeme adı"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
                      />
                      <button
                        type="button"
                        onClick={addIngredient}
                        className="btn-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.ingredients.map((ingredient, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                        >
                          {ingredient}
                          <button
                            type="button"
                            onClick={() => removeIngredient(ingredient)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Alerjenler */}
                  <div>
                    <label className="form-label">Alerjenler</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={allergenInput}
                        onChange={(e) => setAllergenInput(e.target.value)}
                        className="form-input flex-1"
                        placeholder="Alerjen adı"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergen())}
                      />
                      <button
                        type="button"
                        onClick={addAllergen}
                        className="btn-primary"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.allergens.map((allergen, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                        >
                          {allergen}
                          <button
                            type="button"
                            onClick={() => removeAllergen(allergen)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Arama Etiketleri */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Arama Etiketleri</h2>
                <div className="mb-4">
                  <label className="form-label">Etiketler</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="form-input flex-1"
                      placeholder="Etiket adı (örn: acılı, sıcak, popüler)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="btn-primary"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Beslenme ve Özellikler */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Beslenme ve Özellikler</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Hazırlama Süresi */}
                  <div>
                    <label htmlFor="preparationTime" className="form-label">
                      Hazırlama Süresi (dakika)
                    </label>
                    <input
                      type="number"
                      id="preparationTime"
                      name="preparationTime"
                      value={formData.preparationTime}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                    />
                  </div>

                  {/* Kalori */}
                  <div>
                    <label htmlFor="calories" className="form-label">
                      Kalori
                    </label>
                    <input
                      type="number"
                      id="calories"
                      name="calories"
                      value={formData.calories}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                  </div>

                  {/* Boş alan */}
                  <div></div>

                  {/* Diyet Özellikleri */}
                  <div className="md:col-span-3">
                    <label className="form-label">Diyet Özellikleri</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isVegetarian"
                          checked={formData.isVegetarian}
                          onChange={handleCheckboxChange}
                          className="form-checkbox"
                        />
                        <span>Vejetaryen</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isVegan"
                          checked={formData.isVegan}
                          onChange={handleCheckboxChange}
                          className="form-checkbox"
                        />
                        <span>Vegan</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isGlutenFree"
                          checked={formData.isGlutenFree}
                          onChange={handleCheckboxChange}
                          className="form-checkbox"
                        />
                        <span>Glutensiz</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stok Yönetimi */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Stok Yönetimi</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Mevcut Stok */}
                  <div>
                    <label htmlFor="stock" className="form-label">
                      Mevcut Stok
                    </label>
                    <input
                      type="number"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                  </div>

                  {/* Minimum Stok */}
                  <div>
                    <label htmlFor="minStock" className="form-label">
                      Minimum Stok (Uyarı)
                    </label>
                    <input
                      type="number"
                      id="minStock"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                  </div>

                  {/* Maksimum Stok */}
                  <div>
                    <label htmlFor="maxStock" className="form-label">
                      Maksimum Stok
                    </label>
                    <input
                      type="number"
                      id="maxStock"
                      name="maxStock"
                      value={formData.maxStock}
                      onChange={handleInputChange}
                      className="form-input"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Durum ve Özellikler */}
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Durum ve Özellikler</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Durum Seçenekleri */}
                  <div>
                    <label className="form-label">Durum</label>
                    <div className="space-y-3 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleCheckboxChange}
                          className="form-checkbox"
                        />
                        <span>Aktif (Menüde Görünsün)</span>
                      </label>
                    </div>
                  </div>

                  {/* Özel Özellikler */}
                  <div>
                    <label className="form-label">Özel Özellikler</label>
                    <div className="space-y-3 mt-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isPopular"
                          checked={formData.isPopular}
                          onChange={handleCheckboxChange}
                          className="form-checkbox"
                        />
                        <span>Popüler Ürün</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={formData.isFeatured}
                          onChange={handleCheckboxChange}
                          className="form-checkbox"
                        />
                        <span>Öne Çıkan Ürün</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Butonları */}
              <div className="flex justify-end gap-4">
                <Link
                  href="/admin/products"
                  className="btn-outline"
                >
                  İptal
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex items-center gap-2"
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
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
} 