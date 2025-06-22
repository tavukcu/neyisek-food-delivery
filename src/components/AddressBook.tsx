'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Address as MainAddress } from '@/types';

export interface Address {
  id?: string;
  title: string;
  fullName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  postalCode?: string;
  instructions?: string;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AddressBookProps {
  user: User | null;
  onAddressSelect?: (address: MainAddress) => void;
  selectedAddressId?: string;
  showSelection?: boolean;
  compact?: boolean;
  selectMode?: boolean;
}

export default function AddressBook({ 
  user, 
  onAddressSelect, 
  selectedAddressId,
  showSelection = false,
  compact = false,
  selectMode = false
}: AddressBookProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    fullName: '',
    phone: '',
    address: '',
    district: '',
    city: '',
    postalCode: '',
    instructions: '',
    isDefault: false
  });

  // Adresleri yükle
  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'addresses'),
        where('userId', '==', user.uid),
        orderBy('isDefault', 'desc'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const addressList: Address[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        addressList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Address);
      });

      setAddresses(addressList);
    } catch (error) {
      console.error('Adresler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Kullanıcı girişi gerekli');
      return;
    }

    // Form validasyonu
    if (!formData.title.trim()) {
      toast.error('Adres başlığı gerekli');
      return;
    }
    if (!formData.fullName.trim()) {
      toast.error('Ad soyad gerekli');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Telefon numarası gerekli');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Adres bilgisi gerekli');
      return;
    }
    if (!formData.district.trim()) {
      toast.error('İlçe bilgisi gerekli');
      return;
    }
    if (!formData.city.trim()) {
      toast.error('İl bilgisi gerekli');
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading(editingAddress ? 'Adres güncelleniyor...' : 'Adres kaydediliyor...');

    try {
      console.log('🏠 Adres kaydetme işlemi başlatıldı:', {
        user: user.uid,
        userEmail: user.email,
        formData,
        editingAddress: !!editingAddress,
        timestamp: new Date().toISOString()
      });

      const addressData = {
        ...formData,
        userId: user.uid,
        updatedAt: new Date()
      };

      if (editingAddress) {
        // Güncelle
        const addressRef = doc(db, 'addresses', editingAddress.id!);
        await updateDoc(addressRef, addressData);
        console.log('✅ Adres güncellendi');
        toast.success('Adres başarıyla güncellendi!', { id: loadingToast });
      } else {
        // Yeni ekle
        const docRef = await addDoc(collection(db, 'addresses'), {
          ...addressData,
          createdAt: new Date()
        });
        console.log('✅ Yeni adres eklendi:', docRef.id);
        toast.success('Adres başarıyla eklendi!', { id: loadingToast });
      }

      // Varsayılan adres ayarlandıysa, diğerlerini güncelle
      if (formData.isDefault) {
        await updateOtherAddressesDefault(user.uid);
      }

      resetForm();
      await loadAddresses();
    } catch (error: any) {
      console.error('🔴 Adres kaydetme hatası:', error);
      console.error('🔴 Hata detayları:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        user: user?.uid,
        timestamp: new Date().toISOString()
      });
      
      // Detaylı hata analizi
      let errorMessage = 'Adres kaydedilirken bir hata oluştu';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Bu işlem için yetkiniz bulunmuyor. Lütfen tekrar giriş yapın.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Sunucu şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
      } else if (error.message) {
        errorMessage = `Hata: ${error.message}`;
      }
      
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setSubmitting(false);
    }
  };

  const updateOtherAddressesDefault = async (userId: string) => {
    try {
      const q = query(
        collection(db, 'addresses'),
        where('userId', '==', userId),
        where('isDefault', '==', true)
      );

      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map(doc => 
        updateDoc(doc.ref, { isDefault: false })
      );

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Varsayılan adres güncelleme hatası:', error);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      title: address.title,
      fullName: address.fullName,
      phone: address.phone,
      address: address.address,
      district: address.district,
      city: address.city,
      postalCode: address.postalCode || '',
      instructions: address.instructions || '',
      isDefault: address.isDefault
    });
    setShowForm(true);
  };

  const handleDelete = async (addressId: string) => {
    const confirmDelete = window.confirm('Bu adresi silmek istediğinizden emin misiniz?');
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, 'addresses', addressId));
      console.log('✅ Adres silindi');
      loadAddresses();
    } catch (error) {
      console.error('Adres silme hatası:', error);
      alert('Adres silinirken bir hata oluştu.');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!user) return;

    try {
      // Önce tüm adresleri varsayılan olmayan yap
      await updateOtherAddressesDefault(user.uid);
      
      // Seçilen adresi varsayılan yap
      const addressRef = doc(db, 'addresses', addressId);
      await updateDoc(addressRef, { 
        isDefault: true,
        updatedAt: new Date()
      });

      console.log('✅ Varsayılan adres güncellendi');
      loadAddresses();
    } catch (error) {
      console.error('Varsayılan adres ayarlama hatası:', error);
      alert('Varsayılan adres ayarlanırken bir hata oluştu.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      fullName: '',
      phone: '',
      address: '',
      district: '',
      city: '',
      postalCode: '',
      instructions: '',
      isDefault: false
    });
    setEditingAddress(null);
    setShowForm(false);
  };

  // Address tipini MainAddress tipine dönüştür
  const convertToMainAddress = (address: Address): MainAddress => {
    return {
      street: address.address,
      district: address.district,
      city: address.city,
      zipCode: address.postalCode || '',
      country: 'Türkiye',
      coordinates: { lat: 0, lng: 0 } // Varsayılan koordinatlar
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - compact modda gizle */}
      {!compact && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Adreslerim</h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Yeni Adres Ekle</span>
          </button>
        </div>
      )}

      {/* Adres Listesi */}
      <div className={`grid gap-${compact ? '2' : '4'}`}>
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`${compact ? 'p-3' : 'p-4'} border rounded-lg transition-all duration-200 ${
              selectedAddressId === address.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${(showSelection || selectMode) ? 'cursor-pointer hover:bg-gray-50' : ''}`}
            onClick={() => (showSelection || selectMode) && onAddressSelect?.(convertToMainAddress(address))}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className={`font-medium text-gray-900 ${compact ? 'text-sm' : ''}`}>{address.title}</h4>
                  {address.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Varsayılan
                    </span>
                  )}
                  {selectedAddressId === address.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      Seçili
                    </span>
                  )}
                </div>
                
                {!compact && (
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>{address.fullName}</strong> - {address.phone}
                  </p>
                )}
                
                <p className={`text-sm text-gray-600 mb-1 ${compact ? 'truncate' : ''}`}>
                  {address.address}
                </p>
                
                <p className="text-sm text-gray-600 mb-1">
                  {address.district}, {address.city}
                  {address.postalCode && ` - ${address.postalCode}`}
                </p>
                
                {!compact && address.instructions && (
                  <p className="text-sm text-gray-500 italic">
                    Not: {address.instructions}
                  </p>
                )}
              </div>

              {/* Butonlar - selectMode'da gizle */}
              {!selectMode && !showSelection && (
                <div className="flex space-x-2 ml-4">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id!)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200"
                    >
                      Varsayılan Yap
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEdit(address)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors duration-200"
                  >
                    Düzenle
                  </button>
                  
                  <button
                    onClick={() => handleDelete(address.id!)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors duration-200"
                  >
                    Sil
                  </button>
                </div>
              )}

              {/* Seç butonu - selectMode'da göster */}
              {selectMode && (
                <button
                  onClick={() => onAddressSelect?.(convertToMainAddress(address))}
                  className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  Seç
                </button>
              )}
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Henüz kayıtlı adresiniz bulunmuyor.</p>
            {!compact && (
              <p className="text-sm">Yeni adres eklemek için yukarıdaki butonu kullanın.</p>
            )}
          </div>
        )}
      </div>

      {/* Adres Formu Modal - compact modda gizle */}
      {!compact && showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  {editingAddress ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres Başlığı *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ev, İş, vb."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0555 123 45 67"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adres *
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Sokak, cadde, bina no, daire no"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İlçe *
                    </label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      İl *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posta Kodu
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="34000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teslimat Notları
                  </label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="Kapıcıya teslim edilebilir, 3. kat, vb."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-700">
                    Bu adresi varsayılan adres olarak ayarla
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingAddress ? 'Güncelleniyor...' : 'Kaydediliyor...'}
                      </>
                    ) : (
                      editingAddress ? 'Güncelle' : 'Kaydet'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 