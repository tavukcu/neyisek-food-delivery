'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { CategoryService } from '@/services/categoryService';
import { Category } from '@/types';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Kategorileri yükleme
  useEffect(() => {
    if (user && user.isAdmin) {
      loadCategories();
    }
  }, [user]);

  // Filtreleme ve arama
  useEffect(() => {
    let filtered = categories;

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterActive !== 'all') {
      filtered = filtered.filter(category =>
        filterActive === 'active' ? category.isActive : !category.isActive
      );
    }

    setFilteredCategories(filtered);
  }, [categories, searchTerm, filterActive]);

  const loadCategories = async (forceRefresh: boolean = false) => {
    try {
      setIsLoading(true);
      console.log('🚀 Admin kategoriler yükleniyor...', { forceRefresh });
      
      const allCategories = await CategoryService.getAllCategories();

      console.log('✅ Admin kategoriler yüklendi:', {
        toplam: allCategories.length,
        aktif: allCategories.filter(cat => cat.isActive).length,
        pasif: allCategories.filter(cat => !cat.isActive).length
      });

      setCategories(allCategories);
      setFilteredCategories(allCategories);
      
      if (forceRefresh) {
        toast.success('Kategoriler yenilendi!');
      }
      
    } catch (error) {
      console.error('❌ Kategoriler yüklenirken hata:', error);
      toast.error('Kategoriler yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadCategories(true);
    } catch (error) {
      console.error('❌ Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleCategoryActive = async (categoryId: string, isActive: boolean) => {
    try {
      await CategoryService.toggleCategoryStatus(categoryId);

      setCategories(prev =>
        prev.map(cat =>
          cat.id === categoryId ? { ...cat, isActive: !isActive } : cat
        )
      );

      toast.success(`Kategori ${!isActive ? 'aktif' : 'pasif'} hale getirildi`);
    } catch (error) {
      console.error('Kategori güncellenirken hata:', error);
      toast.error('Kategori güncellenirken bir hata oluştu');
    }
  };

  const deleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await CategoryService.deleteCategory(categoryId);
      
      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
      
      toast.success('Kategori başarıyla silindi');
    } catch (error) {
      console.error('Kategori silinirken hata:', error);
      toast.error('Kategori silinirken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
            <p className="text-gray-600">Yetkilendirme kontrol ediliyor...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <main>
      <Header />
      <section className="py-8 min-h-screen bg-gray-50">
        <div className="container-responsive">
          <Link 
            href="/admin" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Admin Paneline Dön
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Kategoriler
              </h1>
              <p className="text-gray-600">
                Ürün kategorilerini yönetin
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  refreshing 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title="Kategorileri yenile"
              >
                <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link 
                href="/admin/categories/add"
                className="btn-primary flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Yeni Kategori Ekle
              </Link>
            </div>
          </div>

          <div className="card p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Kategori ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input pl-10"
                  />
                </div>
              </div>
              <div className="lg:w-48">
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="form-input"
                >
                  <option value="all">Tüm Kategoriler</option>
                  <option value="active">Aktif Kategoriler</option>
                  <option value="inactive">Pasif Kategoriler</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="card p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
              <p className="text-gray-600">Kategoriler yükleniyor...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-gray-600 mb-4">
                {searchTerm || filterActive !== 'all' 
                  ? 'Arama kriterlerinize uygun kategori bulunamadı' 
                  : 'Henüz kategori eklenmemiş'
                }
              </p>
              {(!searchTerm && filterActive === 'all') && (
                <Link 
                  href="/admin/categories/add"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  İlk Kategoriyi Ekle
                </Link>
              )}
              <div className="mt-4 text-xs text-gray-500">
                Debug: {categories.length} kategori yüklendi, {filteredCategories.length} gösteriliyor
              </div>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="card p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-32 lg:h-32 w-full h-48">
                      {category.imageUrl ? (
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-4xl">
                            {(category as any).icon || '🏷️'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {category.name}
                            </h3>
                            {(category as any).icon && (
                              <span className="text-2xl" title="Kategori İkonu">
                                {(category as any).icon}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">
                            {category.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Sıralama: {category.sortOrder}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              category.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {category.isActive ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCategoryActive(category.id, category.isActive)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              category.isActive
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={category.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {category.isActive ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                          <Link
                            href={`/admin/categories/edit/${category.id}`}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                            title="Düzenle"
                          >
                            <Edit className="h-5 w-5" />
                          </Link>
                          <button
                            onClick={() => deleteCategory(category.id, category.name)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Sil"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
} 