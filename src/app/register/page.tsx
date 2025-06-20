'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User,
  ArrowLeft,
  Phone
} from 'lucide-react';
import Link from 'next/link';

// Kayıt sayfası komponenti
export default function RegisterPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  });

  // Form verisini güncelleme fonksiyonu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form doğrulama fonksiyonu
  const validateForm = () => {
    if (!formData.displayName.trim()) {
      toast.error('Ad soyad alanı zorunludur');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('E-posta alanı zorunludur');
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Telefon numarası alanı zorunludur');
      return false;
    }
    // Telefon numarası format kontrolü (Türkiye formatı)
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
      toast.error('Geçerli bir telefon numarası girin (örn: 05XX XXX XX XX)');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      return false;
    }
    return true;
  };

  // Form gönderme fonksiyonu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const result = await signUp(formData.email, formData.password, formData.displayName, formData.phoneNumber);
      
      if (result.success) {
        toast.success('Hesabınız başarıyla oluşturuldu! Giriş yapılıyor...');
        router.push('/');
      } else {
        toast.error(result.error || 'Kayıt sırasında bir hata oluştu');
      }
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google ile giriş fonksiyonu
  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        toast.success('Google hesabınız ile başarıyla giriş yaptınız!');
        router.push('/');
      } else {
        toast.error(result.error || 'Google ile giriş sırasında bir hata oluştu');
      }
    } catch (error) {
      toast.error('Beklenmeyen bir hata oluştu');
    }
  };

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Sayfa İçeriği */}
      <section className="py-12 min-h-screen bg-gray-50">
        <div className="container-responsive">
          <div className="max-w-md mx-auto">
            {/* Geri Dön Butonu */}
            <Link 
              href="/account" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Giriş Sayfasına Dön
            </Link>

            {/* Form Kartı */}
            <div className="card p-8">
              {/* Başlık */}
              <div className="text-center mb-8">
                <div className="bg-gradient-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Hesap Oluştur
                </h1>
                <p className="text-gray-600">
                  NeYisek.com'a katılın ve lezzetli yemekleri keşfedin
                </p>
              </div>

              {/* Google ile Kayıt */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full mb-6 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 hover:shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google ile Devam Et
              </button>

              {/* Ayırıcı */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">veya</span>
                </div>
              </div>

              {/* Kayıt Formu */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Ad Soyad */}
                <div>
                  <label htmlFor="displayName" className="form-label">
                    Ad Soyad *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                      placeholder="Adınız ve soyadınız"
                      required
                    />
                  </div>
                </div>

                {/* E-posta */}
                <div>
                  <label htmlFor="email" className="form-label">
                    E-posta Adresi *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                      placeholder="ornek@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Telefon Numarası */}
                <div>
                  <label htmlFor="phoneNumber" className="form-label">
                    Telefon Numarası *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input pl-10"
                      placeholder="05XX XXX XX XX"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Türkiye telefon numarası formatında girin
                  </p>
                </div>

                {/* Şifre */}
                <div>
                  <label htmlFor="password" className="form-label">
                    Şifre *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className="form-input pl-10 pr-10"
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Şifre Tekrar */}
                <div>
                  <label htmlFor="confirmPassword" className="form-label">
                    Şifre Tekrar *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="form-input pl-10 pr-10"
                      placeholder="Şifrenizi tekrar girin"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Kayıt Ol Butonu */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="spinner"></div>
                      Hesap Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      Hesap Oluştur
                    </>
                  )}
                </button>
              </form>

              {/* Giriş Linki */}
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-4">
                  Zaten hesabınız var mı?
                </p>
                <Link href="/account" className="btn-outline w-full">
                  Giriş Yap
                </Link>
              </div>

              {/* Admin Bilgisi */}
              <div className="mt-6 p-4 bg-secondary-50 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  <strong>Admin Erişimi:</strong> halildincer1@gmail.com
                </p>
              </div>
            </div>

            {/* Güvenlik Bilgisi */}
            <div className="mt-8 text-center text-sm text-gray-600">
              <p>
                Hesap oluşturarak{' '}
                <a href="/terms" className="text-primary-600 hover:underline">
                  Kullanım Şartları
                </a>{' '}
                ve{' '}
                <a href="/privacy" className="text-primary-600 hover:underline">
                  Gizlilik Politikası
                </a>
                'nı kabul etmiş olursunuz.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-responsive">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 NeYisek.com. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </main>
  );
} 