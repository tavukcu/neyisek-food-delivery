'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { 
  createEmailReportSubscription,
  getEmailReportSubscriptions,
  updateEmailReportSubscription,
  deleteEmailReportSubscription,
  sendEmailReport,
  prepareReportData,
  EmailReportSubscription,
  EmailReportType,
  EmailReportFrequency,
  EmailReportStatus
} from '@/lib/analytics/emailReportService';
import toast from 'react-hot-toast';
import { 
  PlusIcon,
  EnvelopeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function EmailReportsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [subscriptions, setSubscriptions] = useState<EmailReportSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<EmailReportSubscription | null>(null);

  // Yetkilendirme kontrolü
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Abonelikleri yükle
  useEffect(() => {
    if (user && user.isAdmin) {
      loadSubscriptions();
    }
  }, [user]);

  const loadSubscriptions = async () => {
    setIsLoading(true);
    try {
      const subscriptionsData = await getEmailReportSubscriptions();
      setSubscriptions(subscriptionsData);
    } catch (error) {
      console.error('Abonelikler yüklenirken hata:', error);
      toast.error('Abonelikler yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubscription = async (subscriptionData: Omit<EmailReportSubscription, 'id' | 'createdAt' | 'updatedAt' | 'lastSent'>) => {
    try {
      await createEmailReportSubscription(subscriptionData);
      toast.success('E-posta rapor aboneliği oluşturuldu');
      setShowCreateModal(false);
      loadSubscriptions();
    } catch (error) {
      console.error('Abonelik oluşturulurken hata:', error);
      toast.error('Abonelik oluşturulurken bir hata oluştu');
    }
  };

  const handleUpdateSubscription = async (id: string, updates: Partial<EmailReportSubscription>) => {
    try {
      await updateEmailReportSubscription(id, updates);
      toast.success('Abonelik güncellendi');
      loadSubscriptions();
    } catch (error) {
      console.error('Abonelik güncellenirken hata:', error);
      toast.error('Abonelik güncellenirken bir hata oluştu');
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Bu aboneliği silmek istediğinizden emin misiniz?')) return;
    
    try {
      await deleteEmailReportSubscription(id);
      toast.success('Abonelik silindi');
      loadSubscriptions();
    } catch (error) {
      console.error('Abonelik silinirken hata:', error);
      toast.error('Abonelik silinirken bir hata oluştu');
    }
  };

  const handleSendTestReport = async (subscription: EmailReportSubscription) => {
    try {
      // Test raporu için veri hazırla
      const testReportData = await prepareReportData(subscription);
      await sendEmailReport(subscription, testReportData);
      toast.success('Test raporu gönderildi');
    } catch (error) {
      console.error('Test raporu gönderilirken hata:', error);
      toast.error('Test raporu gönderilirken bir hata oluştu');
    }
  };

  const getReportTypeText = (type: EmailReportType) => {
    switch (type) {
      case EmailReportType.DAILY_SUMMARY: return 'Günlük Özet';
      case EmailReportType.WEEKLY_SUMMARY: return 'Haftalık Özet';
      case EmailReportType.MONTHLY_SUMMARY: return 'Aylık Özet';
      case EmailReportType.SALES_REPORT: return 'Satış Raporu';
      case EmailReportType.CUSTOMER_REPORT: return 'Müşteri Raporu';
      case EmailReportType.PRODUCT_REPORT: return 'Ürün Raporu';
      case EmailReportType.FINANCIAL_REPORT: return 'Mali Rapor';
      case EmailReportType.CUSTOM_REPORT: return 'Özel Rapor';
      default: return type;
    }
  };

  const getFrequencyText = (frequency: EmailReportFrequency) => {
    switch (frequency) {
      case EmailReportFrequency.DAILY: return 'Günlük';
      case EmailReportFrequency.WEEKLY: return 'Haftalık';
      case EmailReportFrequency.MONTHLY: return 'Aylık';
      default: return frequency;
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? 
      <CheckCircleIcon className="h-5 w-5 text-green-500" /> : 
      <XCircleIcon className="h-5 w-5 text-red-500" />;
  };

  // Loading durumu
  if (loading || isLoading) {
    return (
      <main>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">E-posta raporları yükleniyor...</p>
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
                📧 Otomatik E-posta Raporları
              </h1>
              <p className="text-gray-600">
                Düzenli analitik raporlarınızı e-posta ile otomatik olarak alın
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Yeni Abonelik
              </button>
            </div>
          </div>

          {/* Özet İstatistikler */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Abonelik</p>
                  <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                </div>
                <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Aktif Abonelikler</p>
                  <p className="text-2xl font-bold text-green-900">
                    {subscriptions.filter(s => s.status === EmailReportStatus.ACTIVE).length}
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Günlük Raporlar</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {subscriptions.filter(s => s.frequency === EmailReportFrequency.DAILY).length}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Toplam Alıcı</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {subscriptions.reduce((total, sub) => total + sub.recipients.length, 0)}
                  </p>
                </div>
                <UsersIcon className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Abonelikler Listesi */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">E-posta Abonelikleri</h2>
              <div className="flex items-center gap-2">
                <select className="form-input text-sm">
                  <option value="all">Tüm Abonelikler</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <EnvelopeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz e-posta aboneliği yok</h3>
                <p className="text-gray-600 mb-4">İlk e-posta rapor aboneliğinizi oluşturun</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Abonelik Oluştur
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {subscriptions.map((subscription) => (
                  <div key={subscription.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(subscription.status === EmailReportStatus.ACTIVE)}
                          <h3 className="text-lg font-semibold text-gray-900">{subscription.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {getReportTypeText(subscription.type)}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {getFrequencyText(subscription.frequency)}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{subscription.description}</p>
                        
                        {/* Alıcılar */}
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Alıcılar:</p>
                          <div className="flex flex-wrap gap-1">
                            {subscription.recipients.slice(0, 3).map((email, index) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {email}
                              </span>
                            ))}
                            {subscription.recipients.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{subscription.recipients.length - 3} daha
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Zamanlama */}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Durum: {subscription.status === EmailReportStatus.ACTIVE ? 'Aktif' : 'Pasif'}</span>
                          {subscription.lastSent && (
                            <span>Son Gönderim: {format(subscription.lastSent, 'dd/MM/yyyy HH:mm')}</span>
                          )}
                          <span>Oluşturulma: {format(subscription.createdAt, 'dd/MM/yyyy')}</span>
                        </div>
                      </div>

                      {/* Eylemler */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleSendTestReport(subscription)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Test Raporu Gönder"
                        >
                          <PaperAirplaneIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingSubscription(subscription);
                            setShowCreateModal(true);
                          }}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleUpdateSubscription(subscription.id, { 
                            status: subscription.status === EmailReportStatus.ACTIVE ? EmailReportStatus.PAUSED : EmailReportStatus.ACTIVE 
                          })}
                          className={`p-2 rounded-lg transition-colors ${
                            subscription.status === EmailReportStatus.ACTIVE
                              ? 'text-red-600 hover:bg-red-50' 
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={subscription.status === EmailReportStatus.ACTIVE ? 'Devre Dışı Bırak' : 'Etkinleştir'}
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubscription(subscription.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <TrashIcon className="h-4 w-4" />
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

      {/* Abonelik Oluşturma/Düzenleme Modal'ı */}
      {showCreateModal && (
        <SubscriptionModal
          subscription={editingSubscription}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSubscription(null);
          }}
          onSubmit={editingSubscription ? 
            (data) => handleUpdateSubscription(editingSubscription.id, data) :
            handleCreateSubscription
          }
        />
      )}
    </main>
  );
}

// Abonelik Modal Komponenti
function SubscriptionModal({ 
  subscription,
  onClose, 
  onSubmit 
}: { 
  subscription?: EmailReportSubscription | null;
  onClose: () => void; 
  onSubmit: (data: any) => void; 
}) {
  const [formData, setFormData] = useState({
    name: subscription?.name || '',
    description: subscription?.description || '',
    reportType: subscription?.type || EmailReportType.DAILY_SUMMARY,
    frequency: subscription?.frequency || EmailReportFrequency.DAILY,
    recipients: subscription?.recipients.join(', ') || '',
    isActive: subscription?.status === EmailReportStatus.ACTIVE,
    includeCharts: subscription?.includeCharts || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const recipients = formData.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    if (recipients.length === 0) {
      toast.error('En az bir alıcı e-posta adresi gerekli');
      return;
    }

    // Calculate next send date based on frequency
    const now = new Date();
    let nextSend = new Date(now);
    
    switch (formData.frequency) {
      case EmailReportFrequency.DAILY:
        nextSend.setDate(now.getDate() + 1);
        break;
      case EmailReportFrequency.WEEKLY:
        nextSend.setDate(now.getDate() + 7);
        break;
      case EmailReportFrequency.MONTHLY:
        nextSend.setMonth(now.getMonth() + 1);
        break;
    }

    onSubmit({
      name: formData.name,
      description: formData.description,
      type: formData.reportType,
      frequency: formData.frequency,
      recipients,
      status: formData.isActive ? EmailReportStatus.ACTIVE : EmailReportStatus.PAUSED,
      nextSend,
      includeCharts: formData.includeCharts,
      createdBy: 'admin' // You might want to use actual user ID
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {subscription ? 'Abonelik Düzenle' : 'Yeni E-posta Aboneliği'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abonelik Adı
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
                Rapor Tipi
              </label>
              <select
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value as EmailReportType })}
                className="form-input w-full"
              >
                <option value={EmailReportType.DAILY_SUMMARY}>Günlük Özet</option>
                <option value={EmailReportType.WEEKLY_SUMMARY}>Haftalık Özet</option>
                <option value={EmailReportType.MONTHLY_SUMMARY}>Aylık Özet</option>
                <option value={EmailReportType.SALES_REPORT}>Satış Raporu</option>
                <option value={EmailReportType.CUSTOMER_REPORT}>Müşteri Raporu</option>
                <option value={EmailReportType.PRODUCT_REPORT}>Ürün Raporu</option>
                <option value={EmailReportType.FINANCIAL_REPORT}>Mali Rapor</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sıklık
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as EmailReportFrequency })}
                className="form-input w-full"
              >
                <option value={EmailReportFrequency.DAILY}>Günlük</option>
                <option value={EmailReportFrequency.WEEKLY}>Haftalık</option>
                <option value={EmailReportFrequency.MONTHLY}>Aylık</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alıcı E-posta Adresleri (virgülle ayırın)
            </label>
            <textarea
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              className="form-input w-full"
              rows={3}
              placeholder="admin@neyisek.com, manager@neyisek.com"
              required
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Abonelik aktif
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeCharts"
                checked={formData.includeCharts}
                onChange={(e) => setFormData({ ...formData, includeCharts: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeCharts" className="ml-2 text-sm text-gray-700">
                Grafikleri dahil et
              </label>
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
              {subscription ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 