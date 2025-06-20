'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AdvertisementService } from '@/services/advertisementService';
import { Advertisement } from '@/types';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar,
  BarChart3,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  Target,
  TrendingUp,
  MousePointer
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdvertisementsPage() {
  const { user, loading: authLoading } = useAuth();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadAdvertisements();
    }
  }, [authLoading, user]);

  const loadAdvertisements = async () => {
    try {
      setLoading(true);
      const ads = await AdvertisementService.getAllAdvertisements();
      setAdvertisements(ads);
    } catch (error) {
      console.error('Reklamları yükleme hatası:', error);
      toast.error('Reklamlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await AdvertisementService.updateAdvertisement(id, {
        isActive: !currentStatus
      });
      
      setAdvertisements(prev => 
        prev.map(ad => 
          ad.id === id ? { ...ad, isActive: !currentStatus } : ad
        )
      );
      
      toast.success(`Reklam ${!currentStatus ? 'aktif' : 'pasif'} edildi`);
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  const handleDelete = async () => {
    if (!selectedAd) return;

    try {
      await AdvertisementService.deleteAdvertisement(selectedAd.id);
      setAdvertisements(prev => prev.filter(ad => ad.id !== selectedAd.id));
      setShowDeleteModal(false);
      setSelectedAd(null);
      toast.success('Reklam silindi');
    } catch (error) {
      console.error('Silme hatası:', error);
      toast.error('Reklam silinemedi');
    }
  };

  const getPositionText = (position: string) => {
    switch (position) {
      case 'hero': return 'Ana Banner';
      case 'banner': return 'Sayfa İçi Banner';
      case 'sidebar': return 'Kenar Çubuğu';
      case 'popup': return 'Popup';
      default: return position;
    }
  };

  const getStatusColor = (ad: Advertisement) => {
    const now = new Date();
    if (!ad.isActive) return 'bg-gray-100 text-gray-600';
    if (now < ad.startDate) return 'bg-yellow-100 text-yellow-600';
    if (now > ad.endDate) return 'bg-red-100 text-red-600';
    return 'bg-green-100 text-green-600';
  };

  const getStatusText = (ad: Advertisement) => {
    const now = new Date();
    if (!ad.isActive) return 'Pasif';
    if (now < ad.startDate) return 'Beklemede';
    if (now > ad.endDate) return 'Süresi Dolmuş';
    return 'Aktif';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reklam Yönetimi</h1>
            <p className="text-gray-600 mt-2">
              Kampanyalarınızı oluşturun ve yönetin
            </p>
          </div>
          <Link
            href="/admin/advertisements/create"
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Yeni Reklam
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Reklam</p>
                <p className="text-2xl font-bold text-gray-900">{advertisements.length}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <ImageIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktif Reklam</p>
                <p className="text-2xl font-bold text-green-600">
                  {advertisements.filter(ad => {
                    const now = new Date();
                    return ad.isActive && now >= ad.startDate && now <= ad.endDate;
                  }).length}
                </p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Görüntüleme</p>
                <p className="text-2xl font-bold text-purple-600">
                  {advertisements.reduce((sum, ad) => sum + ad.viewCount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam Tıklama</p>
                <p className="text-2xl font-bold text-orange-600">
                  {advertisements.reduce((sum, ad) => sum + ad.clickCount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-orange-100 rounded-lg p-3">
                <MousePointer className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Advertisements List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tüm Reklamlar</h2>
          </div>

          {advertisements.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Henüz reklam bulunmuyor
              </h3>
              <p className="text-gray-600 mb-6">
                İlk reklamınızı oluşturmak için başlayın
              </p>
              <Link
                href="/admin/advertisements/create"
                className="btn-primary"
              >
                Reklam Oluştur
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reklam
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pozisyon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarih Aralığı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İstatistikler
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      İşlemler
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {advertisements.map((ad) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <img
                              className="h-16 w-16 rounded-lg object-cover"
                              src={ad.imageUrl}
                              alt={ad.title}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {ad.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ad.description?.substring(0, 50)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {getPositionText(ad.position)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {ad.startDate.toLocaleDateString('tr-TR')} - {ad.endDate.toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ad)}`}>
                          {getStatusText(ad)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-gray-400" />
                            <span>{ad.viewCount.toLocaleString()} görüntüleme</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MousePointer className="h-4 w-4 text-gray-400" />
                            <span>{ad.clickCount.toLocaleString()} tıklama</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleStatus(ad.id, ad.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              ad.isActive 
                                ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                                : 'bg-green-100 text-green-600 hover:bg-green-200'
                            }`}
                            title={ad.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                          >
                            {ad.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          
                          <Link
                            href={`/admin/advertisements/${ad.id}/edit`}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          
                          <Link
                            href={`/admin/advertisements/${ad.id}/stats`}
                            className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                            title="İstatistikler"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Link>
                          
                          <button
                            onClick={() => {
                              setSelectedAd(ad);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedAd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reklamı Sil
            </h3>
            <p className="text-gray-600 mb-6">
              "{selectedAd.title}" adlı reklamı silmek istediğinizden emin misiniz? 
              Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAd(null);
                }}
                className="btn-outline"
              >
                İptal
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 