'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ComplaintService } from '@/services/complaintService';
import { 
  ComplaintType, 
  ComplaintPriority, 
  ComplaintStatus,
  type Order,
  type Product,
  type RestaurantInfo 
} from '@/types';
import { 
  X, 
  AlertTriangle, 
  MessageSquare, 
  Upload, 
  Send,
  CheckCircle,
  Clock,
  User,
  Package,
  Store,
  Truck,
  CreditCard,
  Headphones,
  Settings,
  HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ComplaintFormProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  productId?: string;
  restaurantId?: string;
  preSelectedType?: ComplaintType;
}

export default function ComplaintForm({ 
  isOpen, 
  onClose, 
  orderId, 
  productId, 
  restaurantId,
  preSelectedType 
}: ComplaintFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: preSelectedType || ComplaintType.OTHER,
    title: '',
    description: '',
    priority: ComplaintPriority.MEDIUM,
    isAnonymous: false,
    images: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'form' | 'success'>('form');

  // Form sıfırlama
  useEffect(() => {
    if (isOpen) {
      setFormData({
        type: preSelectedType || ComplaintType.OTHER,
        title: '',
        description: '',
        priority: ComplaintPriority.MEDIUM,
        isAnonymous: false,
        images: []
      });
      setCurrentStep('form');
    }
  }, [isOpen, preSelectedType]);

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

  // Şikayet türü renkleri
  const getTypeColor = (type: ComplaintType) => {
    const colors = {
      [ComplaintType.ORDER]: 'text-blue-600 bg-blue-50',
      [ComplaintType.PRODUCT]: 'text-green-600 bg-green-50',
      [ComplaintType.RESTAURANT]: 'text-purple-600 bg-purple-50',
      [ComplaintType.DELIVERY]: 'text-orange-600 bg-orange-50',
      [ComplaintType.PAYMENT]: 'text-red-600 bg-red-50',
      [ComplaintType.SERVICE]: 'text-indigo-600 bg-indigo-50',
      [ComplaintType.TECHNICAL]: 'text-gray-600 bg-gray-50',
      [ComplaintType.OTHER]: 'text-yellow-600 bg-yellow-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  // Öncelik renkleri
  const getPriorityColor = (priority: ComplaintPriority) => {
    const colors = {
      [ComplaintPriority.LOW]: 'text-green-600 bg-green-50 border-green-200',
      [ComplaintPriority.MEDIUM]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      [ComplaintPriority.HIGH]: 'text-orange-600 bg-orange-50 border-orange-200',
      [ComplaintPriority.URGENT]: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[priority];
  };

  // Form gönderimi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 Şikayet gönderme başladı:', { 
      user: !!user, 
      userDetails: user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null,
      formData: {
        type: formData.type,
        title: formData.title.length,
        description: formData.description.length,
        priority: formData.priority
      }
    });
    
    if (!user) {
      console.error('❌ Kullanıcı giriş yapmamış');
      toast.error('Şikayet göndermek için giriş yapmalısınız');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      console.error('❌ Form verileri eksik:', { title: formData.title, description: formData.description });
      toast.error('Lütfen başlık ve açıklama alanlarını doldurun');
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📝 Şikayet verisi hazırlanıyor...');

      // Kullanıcı verisini kontrol et ve temizle
      const cleanUser = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonim Kullanıcı',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'customer' as const,
        isActive: user.isActive !== false,
        createdAt: user.createdAt || new Date()
      };

      const complaintData = {
        userId: user.uid,
        user: cleanUser,
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        isAnonymous: formData.isAnonymous,
        orderId,
        productId,
        restaurantId,
        images: formData.images,
        status: ComplaintStatus.PENDING
      };

      console.log('🚀 ComplaintService.createComplaint çağrılıyor...');
      console.log('📋 Gönderilecek veri:', {
        userId: complaintData.userId,
        userEmail: complaintData.user.email,
        type: complaintData.type,
        title: complaintData.title,
        priority: complaintData.priority,
        status: complaintData.status
      });
      
      const complaintId = await ComplaintService.createComplaint(complaintData);
      
      console.log('✅ Şikayet başarıyla oluşturuldu:', complaintId);
      toast.success('🎉 Şikayetiniz başarıyla gönderildi!');
      setCurrentStep('success');
      
      // 3 saniye sonra modalı kapat
      setTimeout(() => {
        onClose();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Şikayet gönderme hatası:', error);
      
      // Hata türüne göre daha detaylı mesaj
      if (error instanceof Error) {
        console.error('❌ Hata detayları:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        if (error.message.includes('permission') || error.message.includes('Permission')) {
          toast.error('Yetki hatası: Şikayet gönderme izniniz yok');
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          toast.error('Bağlantı hatası: İnternet bağlantınızı kontrol edin');
        } else if (error.message.includes('auth') || error.message.includes('Auth')) {
          toast.error('Kimlik doğrulama hatası: Lütfen tekrar giriş yapın');
        } else if (error.message.includes('Firebase') || error.message.includes('firestore')) {
          toast.error('Veritabanı hatası: Lütfen daha sonra tekrar deneyin');
        } else {
          toast.error(`Hata: ${error.message}`);
        }
      } else {
        console.error('❌ Bilinmeyen hata türü:', typeof error, error);
        toast.error('Şikayet gönderilirken bilinmeyen bir hata oluştu');
      }
      
      // Fallback: Kullanıcıya alternatif yöntem öner
      toast.error('Alternatif: Lütfen contact@neyisek.com adresine e-posta gönderin', {
        duration: 8000
      });
      
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative bounce-in">
        
        {/* Kapatma Butonu */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10 hover-lift"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Form Adımı */}
        {currentStep === 'form' && (
          <div className="p-8">
            {/* Başlık */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto gradient-shift rounded-full flex items-center justify-center mb-6 pulse-glow">
                <AlertTriangle className="w-10 h-10 text-white bounce-in" />
              </div>
              <h2 className="text-3xl font-bold text-shimmer mb-4">
                Şikayet Bildirin
              </h2>
              <p className="text-gray-600 text-lg">
                Yaşadığınız sorunu detaylı bir şekilde bildirin, en kısa sürede çözüm bulalım.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Şikayet Türü */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Şikayet Türü *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(ComplaintType).map((type) => {
                    const Icon = getTypeIcon(type);
                    const isSelected = formData.type === type;
                    
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type }))}
                        className={`p-4 rounded-2xl border-2 transition-all duration-200 hover-lift ${
                          isSelected 
                            ? `${getTypeColor(type)} border-current shadow-lg` 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-current' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-current' : 'text-gray-600'}`}>
                          {ComplaintService.getTypeText(type)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Başlık */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Şikayet Başlığı *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Kısa ve açıklayıcı bir başlık yazın"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  maxLength={100}
                  required
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.title.length}/100
                </div>
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Detaylı Açıklama *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Yaşadığınız sorunu detaylı bir şekilde açıklayın. Ne oldu? Ne zaman oldu? Nasıl etkilendiniz?"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                  maxLength={1000}
                  required
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formData.description.length}/1000
                </div>
              </div>

              {/* Öncelik */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Öncelik Seviyesi
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.values(ComplaintPriority).map((priority) => {
                    const isSelected = formData.priority === priority;
                    
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, priority }))}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 hover-lift ${
                          isSelected 
                            ? `${getPriorityColor(priority)} shadow-lg` 
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <span className={`text-sm font-medium ${isSelected ? 'text-current' : 'text-gray-600'}`}>
                          {ComplaintService.getPriorityText(priority)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Anonim Seçeneği */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                    className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Anonim olarak gönder
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Kimliğiniz gizli tutulacak, sadece admin görebilecek
                    </p>
                  </div>
                </label>
              </div>

              {/* Bilgilendirme */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">
                      Yanıt Süreci
                    </h4>
                    <p className="text-sm text-blue-700">
                      Şikayetiniz 24 saat içinde değerlendirilecek ve size geri dönüş yapılacaktır. 
                      Acil durumlar için öncelik seviyesini "Acil" olarak seçebilirsiniz.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gönder Butonu */}
              <button
                type="submit"
                disabled={isSubmitting || !formData.title.trim() || !formData.description.trim()}
                className="w-full btn-magical text-white py-4 px-8 rounded-2xl font-semibold text-lg hover-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 spinner-magical"></div>
                    Gönderiliyor...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <Send className="w-5 h-5" />
                    Şikayeti Gönder
                  </div>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Başarı Adımı */}
        {currentStep === 'success' && (
          <div className="p-8 text-center">
            {/* Başarı Animasyonu */}
            <div className="relative mb-8">
              <div className="w-32 h-32 mx-auto gradient-shift rounded-full flex items-center justify-center pulse-glow shadow-2xl">
                <CheckCircle className="w-16 h-16 text-white bounce-in" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-green-400 rounded-full flex items-center justify-center sparkle-animation">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Başarı Mesajı */}
            <h2 className="text-4xl font-bold text-shimmer mb-6 slide-up">
              🎉 Şikayetiniz Alındı!
            </h2>
            
            <p className="text-xl text-gray-700 mb-4 slide-up" style={{ animationDelay: '0.2s' }}>
              Şikayetiniz başarıyla kaydedildi
            </p>
            
            <p className="text-lg text-gray-600 mb-8 slide-up" style={{ animationDelay: '0.4s' }}>
              En kısa sürede değerlendirip size geri dönüş yapacağız ✨
            </p>

            {/* Bilgilendirme Kartı */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-6 mb-8 card-hover slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 gradient-shift rounded-full flex items-center justify-center pulse-glow">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">📧 Bildirim Alacaksınız</h3>
              <p className="text-gray-600">
                Şikayetinizin durumu değiştiğinde e-posta ve uygulama bildirimi alacaksınız.
              </p>
            </div>

            {/* Otomatik Kapanma Bildirimi */}
            <p className="text-sm text-gray-500 slide-up" style={{ animationDelay: '0.8s' }}>
              Bu pencere 3 saniye sonra otomatik olarak kapanacak...
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 