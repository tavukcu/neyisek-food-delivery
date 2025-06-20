'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RestaurantService, RestaurantApplication } from '@/services/restaurantService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Building2,
  FileText,
  List,
  Store
} from 'lucide-react';
import Link from 'next/link';

export default function AdminRestaurantsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<RestaurantApplication | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Başvuruları yükleme
  const loadApplications = async () => {
    setLoading(true);
    try {
      const allApplications = await RestaurantService.getAllApplications();
      setApplications(allApplications);
    } catch (error) {
      console.error('Başvurular yüklenirken hata:', error);
      toast.error('Başvurular yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadApplications();
    }
  }, [user]);

  // Başvuru durumunu güncelleme
  const updateApplicationStatus = async (
    applicationId: string, 
    status: 'approved' | 'rejected'
  ) => {
    if (!user?.uid) return;

    setProcessingId(applicationId);
    try {
      await RestaurantService.updateApplicationStatus(
        applicationId, 
        status, 
        user.uid, 
        adminNotes
      );
      
      toast.success(
        status === 'approved' 
          ? '✅ Başvuru onaylandı ve e-posta gönderildi!' 
          : '❌ Başvuru reddedildi ve e-posta gönderildi!'
      );
      
      // Listeyi yenile
      await loadApplications();
      setSelectedApplication(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Başvuru güncellenirken hata:', error);
      toast.error('Başvuru güncellenirken bir hata oluştu');
    } finally {
      setProcessingId(null);
    }
  };

  // Duruma göre renk ve ikon
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle };
      case 'rejected':
        return { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle };
      default:
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock };
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Onaylandı';
      case 'rejected': return 'Reddedildi';
      default: return 'Bekliyor';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Giriş Gerekli</h2>
          <p className="text-gray-600">Bu sayfaya erişim için giriş yapmalısınız.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restoran Başvuruları</h1>
              <p className="text-gray-600">Restoran başvurularını inceleyin ve onaylayın</p>
            </div>
            
            {/* Restoran Listesi Butonu */}
            <Link
              href="/admin/restaurants/list"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Store className="h-5 w-5" />
              Onaylanmış Restoranlar
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Başvurular yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Başvuru Listesi */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Başvurular ({applications.length})
                  </h2>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {applications.map((application) => {
                    const statusStyle = getStatusStyle(application.status);
                    const StatusIcon = statusStyle.icon;
                    
                    return (
                      <div
                        key={application.id}
                        className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedApplication?.id === application.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedApplication(application)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Building2 className="h-5 w-5 text-gray-400" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {application.restaurantName}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {getStatusText(application.status)}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                {application.ownerName} - {application.email}
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {application.phone}
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {application.address}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right text-sm text-gray-500">
                            <p>{format(application.appliedAt, 'dd MMM yyyy', { locale: tr })}</p>
                            <p>{format(application.appliedAt, 'HH:mm', { locale: tr })}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {applications.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Henüz restoran başvurusu bulunmuyor.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detay Paneli */}
            <div className="lg:col-span-1">
              {selectedApplication ? (
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-gray-400" />
                      <h2 className="text-lg font-semibold text-gray-900">Başvuru Detayı</h2>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {/* Restoran Bilgileri */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Restoran Bilgileri</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Restoran Adı:</span>
                          <span className="ml-2 font-medium">{selectedApplication.restaurantName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Sahip:</span>
                          <span className="ml-2">{selectedApplication.ownerName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">E-posta:</span>
                          <span className="ml-2">{selectedApplication.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Telefon:</span>
                          <span className="ml-2">{selectedApplication.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Adres:</span>
                          <span className="ml-2">{selectedApplication.address}</span>
                        </div>
                        {selectedApplication.latitude && selectedApplication.longitude && (
                          <div className="space-y-2">
                            <div>
                              <span className="text-gray-500">Koordinatlar:</span>
                              <span className="ml-2 text-xs font-mono">
                                {selectedApplication.latitude.toFixed(6)}, {selectedApplication.longitude.toFixed(6)}
                              </span>
                            </div>
                            <div>
                              <a
                                href={`https://www.google.com/maps?q=${selectedApplication.latitude},${selectedApplication.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100 transition-colors"
                              >
                                <MapPin className="h-3 w-3" />
                                Google Maps'te Gör
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* İş Bilgileri */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">İş Bilgileri</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">İş Ruhsatı:</span>
                          <span className="ml-2">{selectedApplication.businessLicense}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Vergi No:</span>
                          <span className="ml-2">{selectedApplication.taxNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Durum */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Durum</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Başvuru Tarihi:</span>
                          <span className="ml-2">{format(selectedApplication.appliedAt, 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                        </div>
                        {selectedApplication.reviewedAt && (
                          <div>
                            <span className="text-gray-500">İnceleme Tarihi:</span>
                            <span className="ml-2">{format(selectedApplication.reviewedAt, 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                          </div>
                        )}
                        {selectedApplication.adminNotes && (
                          <div>
                            <span className="text-gray-500">Admin Notları:</span>
                            <p className="ml-2 mt-1 p-2 bg-gray-50 rounded text-sm">{selectedApplication.adminNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Aksiyon Paneli (Sadece bekleyen başvurular için) */}
                    {selectedApplication.status === 'pending' && (
                      <div className="border-t pt-6">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Notları (İsteğe bağlı)
                          </label>
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Başvuru hakkında notlarınızı yazın..."
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                            rows={3}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                            disabled={processingId === selectedApplication.id}
                            className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Reddet
                          </button>
                          
                          <button
                            onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                            disabled={processingId === selectedApplication.id}
                            className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Onayla
                          </button>
                        </div>
                        
                        {processingId === selectedApplication.id && (
                          <div className="mt-3 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">İşleniyor ve e-posta gönderiliyor...</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Detayları görmek için bir başvuru seçin.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 