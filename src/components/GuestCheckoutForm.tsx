'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { useGuestUser, GuestUser } from '@/hooks/useGuestUser';
import toast from 'react-hot-toast';

interface GuestCheckoutFormProps {
  onGuestInfoSubmit: (guestUser: GuestUser) => void;
  onLoginRedirect: () => void;
  className?: string;
  currentUser?: {
    displayName?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
  } | null;
}

export default function GuestCheckoutForm({ 
  onGuestInfoSubmit, 
  onLoginRedirect,
  className = '',
  currentUser = null
}: GuestCheckoutFormProps) {
  const { guestSession, updateGuestUser, getOrCreateSession } = useGuestUser();
  
  const [formData, setFormData] = useState({
    name: currentUser?.displayName || guestSession?.guestUser?.name || '',
    email: currentUser?.email || guestSession?.guestUser?.email || '',
    phone: currentUser?.phoneNumber || guestSession?.guestUser?.phone || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validation error'ı temizle
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Ad Soyad gerekli';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Ad Soyad en az 2 karakter olmalı';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'E-posta gerekli';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Telefon numarası gerekli';
    } else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Geçerli bir telefon numarası girin';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Lütfen tüm alanları doğru şekilde doldurun');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Session yoksa oluştur
      getOrCreateSession();
      
      // Guest user bilgilerini güncelle
      const guestUser = updateGuestUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim()
      });
      
      toast.success('Bilgileriniz kaydedildi! Siparişinizi tamamlayabilirsiniz.');
      onGuestInfoSubmit(guestUser);
      
    } catch (error) {
      console.error('Guest user oluşturma hatası:', error);
      toast.error('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Misafir Olarak Sipariş Ver
        </h3>
        <p className="text-sm text-gray-600">
          Hızlı sipariş için bilgilerinizi girin. Hesap oluşturmaya gerek yok!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ad Soyad */}
        <div>
          <label htmlFor="guest-name" className="block text-sm font-medium text-gray-700 mb-2">
            Ad Soyad *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="guest-name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Adınız ve soyadınız"
              required
            />
            {validationErrors.name && (
              <div className="absolute right-3 top-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
        </div>

        {/* E-posta */}
        <div>
          <label htmlFor="guest-email" className="block text-sm font-medium text-gray-700 mb-2">
            E-posta Adresi *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="guest-email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ornek@email.com"
              required
            />
            {validationErrors.email && (
              <div className="absolute right-3 top-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {validationErrors.email && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Sipariş durumu hakkında bilgi almak için
          </p>
        </div>

        {/* Telefon */}
        <div>
          <label htmlFor="guest-phone" className="block text-sm font-medium text-gray-700 mb-2">
            Telefon Numarası *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              id="guest-phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                validationErrors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0555 123 45 67"
              required
            />
            {validationErrors.phone && (
              <div className="absolute right-3 top-3">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
            )}
          </div>
          {validationErrors.phone && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Teslimat koordinasyonu için gerekli
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Kaydediliyor...
            </span>
          ) : (
            'Devam Et'
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="px-3 text-sm text-gray-500">veya</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Login Option */}
      <button
        onClick={onLoginRedirect}
        className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
      >
        Hesabım var, giriş yap
      </button>

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 font-medium">Misafir Siparişi Avantajları:</p>
            <ul className="mt-1 text-blue-700 list-disc list-inside space-y-1">
              <li>Hızlı sipariş, kayıt gerektirmez</li>
              <li>E-posta ile sipariş takibi</li>
              <li>24 saat boyunca bilgileriniz saklanır</li>
              <li>İstediğiniz zaman hesap oluşturabilirsiniz</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 