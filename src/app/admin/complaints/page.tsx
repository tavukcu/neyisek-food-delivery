'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ComplaintService } from '@/services/complaintService';
import { 
  Complaint, 
  ComplaintType, 
  ComplaintStatus, 
  ComplaintPriority,
  ComplaintStats,
  ComplaintFilters 
} from '@/types';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Filter,
  Search,
  Calendar,
  User,
  Package,
  Store,
  Truck,
  CreditCard,
  Headphones,
  Settings,
  HelpCircle,
  Eye,
  MessageCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Users,
  Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminComplaintsPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<ComplaintStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [filters, setFilters] = useState<ComplaintFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Şikayet türü ikonları
  const getTypeIcon = (type: ComplaintType) => {
    const icons = {
      [ComplaintType.ORDER]: Package,
      [ComplaintType.PRODUCT]: Package,
      [ComplaintType.RESTAURANT]: Store,
      [ComplaintType.DELIVERY]: Truck,
      [ComplaintType.PAYMENT]: CreditCard,
      [ComplaintType.SERVICE]: Headphones,
      [ComplaintType.TECHNICAL]: Settings,
      [ComplaintType.OTHER]: HelpCircle
    };
    return icons[type] || HelpCircle;
  };

  // Durum renkleri
  const getStatusColor = (status: ComplaintStatus) => {
    const colors = {
      [ComplaintStatus.PENDING]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      [ComplaintStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-50 border-blue-200',
      [ComplaintStatus.RESOLVED]: 'text-green-600 bg-green-50 border-green-200',
      [ComplaintStatus.CLOSED]: 'text-gray-600 bg-gray-50 border-gray-200',
      [ComplaintStatus.REJECTED]: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[status];
  };

  // Öncelik renkleri
  const getPriorityColor = (priority: ComplaintPriority) => {
    const colors = {
      [ComplaintPriority.LOW]: 'text-green-600 bg-green-50',
      [ComplaintPriority.MEDIUM]: 'text-yellow-600 bg-yellow-50',
      [ComplaintPriority.HIGH]: 'text-orange-600 bg-orange-50',
      [ComplaintPriority.URGENT]: 'text-red-600 bg-red-50'
    };
    return colors[priority];
  };

  // Şikayetleri yükle
  const loadComplaints = async () => {
    try {
      setLoading(true);
      console.log('🔍 Admin: Şikayetler yükleniyor...');
      console.log('📋 Filtreler:', {
        ...filters,
        searchTerm: searchTerm || undefined
      });
      
      const result = await ComplaintService.getComplaints(
        {
          ...filters,
          searchTerm: searchTerm || undefined
        },
        20,
        undefined,
        false // Cache kullanma, fresh data al
      );
      
      console.log('✅ Admin: Şikayetler yüklendi:', {
        count: result.complaints.length,
        complaints: result.complaints.map(c => ({
          id: c.id,
          title: c.title,
          status: c.status,
          createdAt: c.createdAt
        }))
      });
      
      setComplaints(result.complaints);
      setTotalPages(Math.ceil(result.complaints.length / 20)); // Approximate pagination
    } catch (error) {
      console.error('❌ Şikayetler yüklenirken hata:', error);
      toast.error('Şikayetler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // İstatistikleri yükle
  const loadStats = async () => {
    try {
      const statsData = await ComplaintService.getComplaintStats();
      setStats(statsData);
    } catch (error) {
      console.error('❌ İstatistikler yüklenirken hata:', error);
    }
  };

  // Sayfa yüklendiğinde
  useEffect(() => {
    console.log('🔍 Admin sayfası useEffect çalıştı');
    console.log('👤 Kullanıcı bilgileri:', {
      user: !!user,
      uid: user?.uid,
      role: user?.role,
      email: user?.email,
      displayName: user?.displayName
    });
    
    if (user) { // Geçici olarak sadece user varlığını kontrol et
      console.log('✅ Kullanıcı var, şikayetler yükleniyor... (DEBUG MODE)');
      loadComplaints();
      loadStats();
    } else {
      console.log('❌ Kullanıcı yok');
    }
  }, [user, filters, searchTerm, currentPage]);

  // Şikayet durumunu güncelle
  const updateComplaintStatus = async (complaintId: string, status: ComplaintStatus) => {
    try {
      await ComplaintService.updateComplaint(complaintId, { status }, user?.uid || '');
      toast.success('Şikayet durumu güncellendi');
      loadComplaints();
      loadStats();
    } catch (error) {
      console.error('❌ Durum güncellenirken hata:', error);
      toast.error('Durum güncellenemedi');
    }
  };

  // Şikayete yanıt ver
  const respondToComplaint = async () => {
    if (!selectedComplaint || !responseMessage.trim()) return;

    try {
      setIsResponding(true);
      await ComplaintService.addComplaintResponse(
        selectedComplaint.id,
        user?.uid || '',
        user?.displayName || 'Admin',
        responseMessage.trim(),
        true
      );
      
      toast.success('Yanıt gönderildi');
      setResponseMessage('');
      setSelectedComplaint(null);
      loadComplaints();
    } catch (error) {
      console.error('❌ Yanıt gönderilirken hata:', error);
      toast.error('Yanıt gönderilemedi');
    } finally {
      setIsResponding(false);
    }
  };

  // Helper function for status text
  const getStatusText = (status: ComplaintStatus): string => {
    const statusTexts = {
      [ComplaintStatus.PENDING]: 'Bekleyen',
      [ComplaintStatus.IN_PROGRESS]: 'İşlemde',
      [ComplaintStatus.RESOLVED]: 'Çözümlenen',
      [ComplaintStatus.CLOSED]: 'Kapatılan',
      [ComplaintStatus.REJECTED]: 'Reddedilen'
    };
    return statusTexts[status] || status;
  };

  // Admin kontrolü
  if (user && user.role !== 'admin') {
    // Geçici olarak admin kontrolünü bypass et - DEBUG AMAÇLI
    console.log('⚠️ DEBUG: Admin kontrolü geçici olarak bypass edildi');
    // return (
    //   <div className="min-h-screen flex items-center justify-center">
    //     <div className="text-center">
    //       <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
    //       <h1 className="text-2xl font-bold text-gray-800 mb-2">Yetkisiz Erişim</h1>
    //       <p className="text-gray-600">Bu sayfaya erişim yetkiniz bulunmamaktadır.</p>
    //     </div>
    //   </div>
    // );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-shimmer mb-4">
            📋 Şikayet Yönetimi
          </h1>
          <p className="text-gray-600 text-lg">
            Müşteri şikayetlerini yönetin ve çözüm üretin
          </p>
        </div>

        {/* İstatistik Kartları */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
              </div>
              <h3 className="font-semibold text-gray-800">Toplam Şikayet</h3>
              <p className="text-sm text-gray-600">Tüm zamanlar</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-2xl font-bold text-yellow-600">{stats.pending}</span>
              </div>
              <h3 className="font-semibold text-gray-800">Bekleyen</h3>
              <p className="text-sm text-gray-600">İnceleme bekliyor</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.resolved}</span>
              </div>
              <h3 className="font-semibold text-gray-800">Çözümlenen</h3>
              <p className="text-sm text-gray-600">Başarıyla çözüldü</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg card-hover">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Timer className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.averageResponseTime / 60)}h
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">Ort. Yanıt Süresi</h3>
              <p className="text-sm text-gray-600">Saat cinsinden</p>
            </div>
          </div>
        )}

        {/* Filtreler ve Arama */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Arama */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Şikayet başlığı veya açıklamasında ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Durum Filtresi */}
            <select
              value={filters.status?.[0] || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                status: e.target.value ? [e.target.value as ComplaintStatus] : undefined 
              }))}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              <option value={ComplaintStatus.PENDING}>Bekleyen</option>
              <option value={ComplaintStatus.IN_PROGRESS}>İşlemde</option>
              <option value={ComplaintStatus.RESOLVED}>Çözümlenen</option>
              <option value={ComplaintStatus.CLOSED}>Kapatılan</option>
              <option value={ComplaintStatus.REJECTED}>Reddedilen</option>
            </select>

            {/* Tür Filtresi */}
            <select
              value={filters.type?.[0] || ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                type: e.target.value ? [e.target.value as ComplaintType] : undefined 
              }))}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Tüm Türler</option>
              <option value={ComplaintType.ORDER}>Sipariş</option>
              <option value={ComplaintType.PRODUCT}>Ürün</option>
              <option value={ComplaintType.RESTAURANT}>Restoran</option>
              <option value={ComplaintType.DELIVERY}>Teslimat</option>
              <option value={ComplaintType.PAYMENT}>Ödeme</option>
              <option value={ComplaintType.SERVICE}>Hizmet</option>
              <option value={ComplaintType.TECHNICAL}>Teknik</option>
              <option value={ComplaintType.OTHER}>Diğer</option>
            </select>
          </div>
        </div>

        {/* Şikayet Listesi */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 spinner-magical mx-auto mb-4"></div>
              <p className="text-gray-600">Şikayetler yükleniyor...</p>
            </div>
          ) : complaints.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Şikayet Bulunamadı</h3>
              <p className="text-gray-600">Arama kriterlerinize uygun şikayet bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {complaints.map((complaint) => {
                const TypeIcon = getTypeIcon(complaint.type);
                
                return (
                  <div key={complaint.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Tür İkonu */}
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <TypeIcon className="w-6 h-6 text-gray-600" />
                        </div>

                        {/* İçerik */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-800 truncate">
                              {complaint.title}
                            </h3>
                            
                            {/* Durum */}
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                              {getStatusText(complaint.status)}
                            </span>
                            
                            {/* Öncelik */}
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                              {ComplaintService.getPriorityText(complaint.priority)}
                            </span>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {complaint.description}
                          </p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {complaint.isAnonymous ? 'Anonim' : complaint.user.displayName}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(complaint.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                            {complaint.responseTime && (
                              <div className="flex items-center gap-1">
                                <Timer className="w-4 h-4" />
                                {Math.round(complaint.responseTime / 60)} saat
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Aksiyonlar */}
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Detayları Görüntüle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {complaint.status === ComplaintStatus.PENDING && (
                          <>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.IN_PROGRESS)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="İşleme Al"
                            >
                              <Clock className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.RESOLVED)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Çözümle"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {complaint.status === ComplaintStatus.IN_PROGRESS && (
                          <button
                            onClick={() => updateComplaintStatus(complaint.id, ComplaintStatus.RESOLVED)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Çözümle"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sayfalama */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Sayfa {currentPage} / {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Önceki
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Şikayet Detay Modalı */}
      {selectedComplaint && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Başlığı */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Şikayet Detayları</h2>
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal İçeriği */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sol Kolon - Şikayet Bilgileri */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Şikayet Bilgileri</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Başlık</label>
                        <p className="text-gray-800 font-medium">{selectedComplaint.title}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Açıklama</label>
                        <p className="text-gray-800 whitespace-pre-wrap">{selectedComplaint.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Tür</label>
                          <p className="text-gray-800">{ComplaintService.getTypeText(selectedComplaint.type)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Öncelik</label>
                          <p className="text-gray-800">{ComplaintService.getPriorityText(selectedComplaint.priority)}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Müşteri</label>
                        <p className="text-gray-800">
                          {selectedComplaint.isAnonymous ? 'Anonim Kullanıcı' : selectedComplaint.user.displayName}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tarih</label>
                        <p className="text-gray-800">
                          {new Date(selectedComplaint.createdAt).toLocaleString('tr-TR')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ Kolon - Yanıt Formu */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Yanıtı</h3>
                    
                    <div className="space-y-4">
                      <textarea
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        placeholder="Müşteriye yanıtınızı yazın..."
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      />
                      
                      <button
                        onClick={respondToComplaint}
                        disabled={isResponding || !responseMessage.trim()}
                        className="w-full btn-magical text-white py-3 px-6 rounded-xl font-semibold hover-glow disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResponding ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 spinner-magical"></div>
                            Gönderiliyor...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <MessageCircle className="w-5 h-5" />
                            Yanıt Gönder
                          </div>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Durum Güncelleme */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Durum Güncelle</h3>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {selectedComplaint.status === ComplaintStatus.PENDING && (
                        <button
                          onClick={() => {
                            updateComplaintStatus(selectedComplaint.id, ComplaintStatus.IN_PROGRESS);
                            setSelectedComplaint(null);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors"
                        >
                          <Clock className="w-5 h-5" />
                          İşleme Al
                        </button>
                      )}
                      
                      {(selectedComplaint.status === ComplaintStatus.PENDING || selectedComplaint.status === ComplaintStatus.IN_PROGRESS) && (
                        <button
                          onClick={() => {
                            updateComplaintStatus(selectedComplaint.id, ComplaintStatus.RESOLVED);
                            setSelectedComplaint(null);
                          }}
                          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Çözümle
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 