'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  createTarget, 
  getTargets, 
  updateTargetProgress,
  generateTargetSuggestions,
  Target,
  TargetType,
  TargetPeriod,
  TargetStatus
} from '@/lib/analytics/targetService';
import toast from 'react-hot-toast';
import { 
  PlusIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PauseIcon,
  PlayIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function TargetsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [targets, setTargets] = useState<Target[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Hedefleri yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadTargets();
      loadSuggestions();
    }
  }, [user]);

  const loadTargets = async () => {
    setIsLoading(true);
    try {
      const targetsData = await getTargets();
      setTargets(targetsData);
    } catch (error) {
      console.error('Hedefler yüklenirken hata:', error);
      toast.error('Hedefler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const suggestionsData = await generateTargetSuggestions();
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Öneriler yüklenirken hata:', error);
    }
  };

  const handleCreateTarget = async (targetData: Omit<Target, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => {
    try {
      await createTarget(targetData);
      toast.success('Hedef başarıyla oluşturuldu');
      setShowCreateModal(false);
      loadTargets();
    } catch (error) {
      console.error('Hedef oluşturulurken hata:', error);
      toast.error('Hedef oluşturulurken bir hata oluştu');
    }
  };

  const handleUpdateProgress = async (targetId: string) => {
    try {
      await updateTargetProgress(targetId);
      toast.success('Hedef ilerlemesi güncellendi');
      loadTargets();
    } catch (error) {
      console.error('İlerleme güncellenirken hata:', error);
      toast.error('İlerleme güncellenirken bir hata oluştu');
    }
  };

  const getTargetTypeText = (type: TargetType) => {
    switch (type) {
      case TargetType.REVENUE: return 'Gelir';
      case TargetType.ORDERS: return 'Sipariş';
      case TargetType.CUSTOMERS: return 'Müşteri';
      case TargetType.AVERAGE_ORDER_VALUE: return 'Ortalama Sipariş';
      case TargetType.CUSTOMER_RETENTION: return 'Müşteri Tutma';
      case TargetType.PRODUCT_SALES: return 'Ürün Satışı';
      default: return type;
    }
  };

  const getPeriodText = (period: TargetPeriod) => {
    switch (period) {
      case TargetPeriod.DAILY: return 'Günlük';
      case TargetPeriod.WEEKLY: return 'Haftalık';
      case TargetPeriod.MONTHLY: return 'Aylık';
      case TargetPeriod.QUARTERLY: return 'Üç Aylık';
      case TargetPeriod.YEARLY: return 'Yıllık';
      default: return period;
    }
  };

  const getStatusIcon = (status: TargetStatus) => {
    switch (status) {
      case TargetStatus.ACTIVE:
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case TargetStatus.COMPLETED:
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case TargetStatus.FAILED:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case TargetStatus.PAUSED:
        return <PauseIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: TargetStatus) => {
    switch (status) {
      case TargetStatus.ACTIVE: return 'Aktif';
      case TargetStatus.COMPLETED: return 'Tamamlandı';
      case TargetStatus.FAILED: return 'Başarısız';
      case TargetStatus.PAUSED: return 'Duraklatıldı';
      default: return status;
    }
  };

  const getProgressColor = (progress: number, status: TargetStatus) => {
    if (status === TargetStatus.COMPLETED) return 'bg-green-500';
    if (status === TargetStatus.FAILED) return 'bg-red-500';
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Hedefler yükleniyor...</p>
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
          {/* Başlık ve Kontroller */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                🎯 Hedef Belirleme ve Takip
              </h1>
              <p className="text-gray-600">
                İş hedeflerinizi belirleyin ve ilerlemelerini takip edin
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Yeni Hedef
              </button>
            </div>
          </div>

          {/* Özet İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Hedef</p>
                  <p className="text-2xl font-bold text-gray-900">{targets.length}</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Hedefler</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {targets.filter(t => t.status === TargetStatus.ACTIVE).length}
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tamamlanan</p>
                  <p className="text-2xl font-bold text-green-900">
                    {targets.filter(t => t.status === TargetStatus.COMPLETED).length}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Başarı Oranı</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {targets.length > 0 
                      ? Math.round((targets.filter(t => t.status === TargetStatus.COMPLETED).length / targets.length) * 100)
                      : 0}%
                  </p>
                </div>
                <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Hedef Önerileri */}
          {suggestions.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                💡 Akıllı Hedef Önerileri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">{suggestion.title}</h3>
                    <p className="text-sm text-blue-700 mb-3">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-blue-900">{suggestion.suggestedValue}</span>
                      <button
                        onClick={() => {
                          // Öneriyi hedef olarak oluştur
                          const targetData = {
                            name: suggestion.title,
                            description: suggestion.description,
                            type: suggestion.type,
                            targetValue: suggestion.suggestedValue,
                            currentValue: 0,
                            period: TargetPeriod.MONTHLY,
                            startDate: new Date(),
                            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün sonra
                            status: TargetStatus.ACTIVE,
                            createdBy: user?.uid || 'admin'
                          };
                          handleCreateTarget(targetData);
                        }}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Hedef Yap
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hedefler Listesi */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Hedefler</h2>
              <div className="flex items-center gap-2">
                <select className="form-input text-sm">
                  <option value="all">Tüm Hedefler</option>
                  <option value="active">Aktif</option>
                  <option value="completed">Tamamlanan</option>
                  <option value="failed">Başarısız</option>
                </select>
              </div>
            </div>

            {targets.length === 0 ? (
              <div className="text-center py-12">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz hedef belirlenmemiş</h3>
                <p className="text-gray-600 mb-4">İlk hedefinizi oluşturarak başlayın</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Hedef Oluştur
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {targets.map((target) => (
                  <div key={target.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(target.status)}
                          <h3 className="text-lg font-semibold text-gray-900">{target.name}</h3>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {getTargetTypeText(target.type)}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {getPeriodText(target.period)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{target.description}</p>
                        
                        {/* İlerleme Çubuğu */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">İlerleme</span>
                            <span className="text-sm font-semibold text-gray-900">
                              {target.currentValue} / {target.targetValue}
                              {target.type === TargetType.REVENUE && ' ₺'}
                              {target.type === TargetType.AVERAGE_ORDER_VALUE && ' ₺'}
                              {target.type === TargetType.CUSTOMER_RETENTION && '%'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(target.progress, target.status)}`}
                              style={{ width: `${Math.min(target.progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-500">
                              %{target.progress.toFixed(1)} tamamlandı
                            </span>
                            <span className="text-xs text-gray-500">
                              {getStatusText(target.status)}
                            </span>
                          </div>
                        </div>

                        {/* Tarih Bilgileri */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Başlangıç: {format(target.startDate, 'dd/MM/yyyy')}</span>
                          <span>Bitiş: {format(target.endDate, 'dd/MM/yyyy')}</span>
                          <span>Son Güncelleme: {format(target.updatedAt, 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </div>

                      {/* Eylemler */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleUpdateProgress(target.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="İlerlemyi Güncelle"
                        >
                          <ArrowTrendingUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setSelectedTarget(target)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Detayları Görüntüle"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Hedef Oluşturma Modal'ı */}
      {showCreateModal && (
        <CreateTargetModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTarget}
          currentUser={user}
        />
      )}

      {/* Hedef Detay Modal'ı */}
      {selectedTarget && (
        <TargetDetailModal
          target={selectedTarget}
          onClose={() => setSelectedTarget(null)}
        />
      )}
    </main>
  );
}

// Hedef Oluşturma Modal Komponenti
function CreateTargetModal({ 
  onClose, 
  onSubmit,
  currentUser
}: { 
  onClose: () => void; 
  onSubmit: (data: any) => void; 
  currentUser: any;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: TargetType.REVENUE,
    targetValue: 0,
    period: TargetPeriod.MONTHLY,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      currentValue: 0,
      startDate: new Date(formData.startDate),
      endDate: new Date(formData.endDate),
      status: TargetStatus.ACTIVE,
      createdBy: currentUser?.uid || 'admin'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Hedef Oluştur</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hedef Başlığı
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input w-full"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hedef Tipi
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as TargetType })}
                className="form-input w-full"
              >
                <option value={TargetType.REVENUE}>Gelir</option>
                <option value={TargetType.ORDERS}>Sipariş</option>
                <option value={TargetType.CUSTOMERS}>Müşteri</option>
                <option value={TargetType.AVERAGE_ORDER_VALUE}>Ortalama Sipariş</option>
                <option value={TargetType.CUSTOMER_RETENTION}>Müşteri Tutma</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dönem
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as TargetPeriod })}
                className="form-input w-full"
              >
                <option value={TargetPeriod.DAILY}>Günlük</option>
                <option value={TargetPeriod.WEEKLY}>Haftalık</option>
                <option value={TargetPeriod.MONTHLY}>Aylık</option>
                <option value={TargetPeriod.QUARTERLY}>Üç Aylık</option>
                <option value={TargetPeriod.YEARLY}>Yıllık</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hedef Değer
            </label>
            <input
              type="number"
              value={formData.targetValue}
              onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
              className="form-input w-full"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Başlangıç Tarihi
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="form-input w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bitiş Tarihi
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="form-input w-full"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-outline"
            >
              İptal
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Hedef Detay Modal Komponenti
function TargetDetailModal({ 
  target, 
  onClose 
}: { 
  target: Target; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Hedef Detayları</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Genel Bilgiler */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{target.name}</h3>
            <p className="text-gray-600 mb-4">{target.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Tip:</span>
                <span className="ml-2 font-medium">{target.type}</span>
              </div>
              <div>
                <span className="text-gray-500">Dönem:</span>
                <span className="ml-2 font-medium">{target.period}</span>
              </div>
              <div>
                <span className="text-gray-500">Başlangıç:</span>
                <span className="ml-2 font-medium">{format(target.startDate, 'dd/MM/yyyy')}</span>
              </div>
              <div>
                <span className="text-gray-500">Bitiş:</span>
                <span className="ml-2 font-medium">{format(target.endDate, 'dd/MM/yyyy')}</span>
              </div>
            </div>
          </div>

          {/* İlerleme */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">İlerleme</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Mevcut / Hedef</span>
                <span className="text-lg font-bold text-gray-900">
                  {target.currentValue} / {target.targetValue}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className="h-3 bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(target.progress, 100)}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600">
                %{target.progress.toFixed(1)} tamamlandı
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
} 