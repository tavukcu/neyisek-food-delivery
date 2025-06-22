'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { User } from 'firebase/auth';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  HeartIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import BackToHomeButton from '@/components/BackToHomeButton';
import ProfileImageUpload from '@/components/ProfileImageUpload';
import AddressBook from '@/components/AddressBook';
import FavoritesList from '@/components/FavoritesList';

export default function ProfilePage() {
  const { user, loading, updateUserProfile, signOut } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [editData, setEditData] = useState({
    displayName: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      district: '',
      zipCode: '',
      country: 'Türkiye'
    }
  });

  // Kullanıcı giriş yapmamışsa yönlendir
  if (!loading && !user) {
    router.push('/account');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleEditStart = () => {
    setEditData({
      displayName: user.displayName || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || {
        street: '',
        city: '',
        district: '',
        zipCode: '',
        country: 'Türkiye'
      }
    });
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditData({
      displayName: '',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        district: '',
        zipCode: '',
        country: 'Türkiye'
      }
    });
  };

  const handleEditSave = async () => {
    const loadingToast = toast.loading('Profil güncelleniyor...');
    
    try {
      await updateUserProfile(editData);
      toast.success('Profil başarıyla güncellendi!', { id: loadingToast });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Profil güncellenirken hata oluştu', { id: loadingToast });
    }
  };

  const handleLogout = async () => {
    const loadingToast = toast.loading('Çıkış yapılıyor...');
    
    try {
      await signOut();
      toast.success('Başarıyla çıkış yapıldı', { id: loadingToast });
      router.push('/');
    } catch (error) {
      toast.error('Çıkış yapılırken hata oluştu', { id: loadingToast });
    }
  };

  const handleImageUpdate = (newImageUrl: string) => {
    // Profil fotoğrafı güncellendiğinde kullanıcı bilgilerini yenile
    console.log('Profil fotoğrafı güncellendi:', newImageUrl);
    toast.success('Profil fotoğrafı güncellendi!');
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Yönetici';
      case 'restaurant': return 'Restoran';
      case 'customer': return 'Müşteri';
      default: return 'Müşteri';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'restaurant': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil Bilgileri', icon: UserIcon },
    { id: 'addresses', name: 'Adres Defteri', icon: HomeIcon },
    { id: 'favorites', name: 'Favori Yemekler', icon: HeartIcon },
    { id: 'orders', name: 'Sipariş Geçmişi', icon: DocumentTextIcon }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Debug Bilgileri - Development modunda */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔍 Debug Bilgileri</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>Kullanıcı ID: {user?.uid}</div>
              <div>Email: {user?.email}</div>
              <div>Doğrulanmış: {(user as any)?.emailVerified ? 'Evet' : 'Hayır'}</div>
              <div>Aktif Tab: {activeTab}</div>
              <div>Düzenleme Modu: {isEditing ? 'Evet' : 'Hayır'}</div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* Profil Fotoğrafı */}
              <div className="flex-shrink-0">
                <ProfileImageUpload
                  user={user}
                  currentImageUrl={user.profileImage || ''}
                  onImageUpdate={handleImageUpdate}
                  size="lg"
                />
              </div>
              
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.displayName || 'Adsız Kullanıcı'}
                </h1>
                <p className="text-gray-600 mb-2">{user.email}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                    {getRoleText(user.role)}
                  </span>
                  {user.isAdmin && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <ShieldCheckIcon className="h-3 w-3 inline mr-1" />
                      Admin
                    </span>
                  )}
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    <ClockIcon className="h-3 w-3 inline mr-1" />
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')} tarihinde katıldı
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <BackToHomeButton variant="minimal" />
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                      ${activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          {activeTab === 'profile' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profil Bilgileri</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEditStart}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Düzenle
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditSave}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                    >
                      <CheckIcon className="h-4 w-4" />
                      Kaydet
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      İptal
                    </button>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Kişisel Bilgiler */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 mb-4">Kişisel Bilgiler</h3>
                  
                  {/* İsim */}
                  <div className="flex items-center gap-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">Ad Soyad</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.displayName}
                          onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.displayName || 'Belirtilmemiş'}</p>
                      )}
                    </div>
                  </div>

                  {/* E-posta */}
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">E-posta</label>
                      <p className="mt-1 text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">E-posta adresi değiştirilemez</p>
                    </div>
                  </div>

                  {/* Telefon */}
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">Telefon</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={editData.phoneNumber}
                          onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                          placeholder="0555 123 45 67"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.phoneNumber || 'Belirtilmemiş'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hesap Bilgileri */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 mb-4">Hesap Bilgileri</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Hesap Türü</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                        {getRoleText(user.role)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Üyelik Tarihi</span>
                      <span className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Son Güncelleme</span>
                      <span className="text-sm text-gray-900">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('tr-TR') : 'Hiç güncellenmedi'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-gray-600">E-posta Doğrulandı</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        (user as any)?.emailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(user as any)?.emailVerified ? 'Doğrulandı' : 'Doğrulanmadı'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'addresses' && (
            <AddressBook user={user as any} />
          )}

          {activeTab === 'favorites' && (
            <FavoritesList user={user as any} />
          )}

          {activeTab === 'orders' && (
            <div className="text-center py-12 text-gray-500">
              <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Sipariş Geçmişi</h3>
              <p className="text-gray-500 mb-4">Sipariş geçmişi özelliği yakında eklenecek.</p>
              <button
                onClick={() => router.push('/orders')}
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
              >
                <ClockIcon className="w-5 h-5 mr-2" />
                Siparişlerim
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 