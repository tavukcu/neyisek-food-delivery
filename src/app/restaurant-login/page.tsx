'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  ChefHat, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Store,
  Phone,
  User
} from 'lucide-react';
import Link from 'next/link';

// Restoran giriş sayfası komponenti
export default function RestaurantLoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
    restaurantName: ''
  });

  // Eğer kullanıcı zaten giriş yapmışsa ve restoran sahibiyse panele yönlendir
  useEffect(() => {
    if (user && user.role === 'restaurant') {
      router.push('/restaurant');
    }
  }, [user, router]);

  // Form verisini güncelleme fonksiyonu
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form gönderme fonksiyonu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      // Giriş yapma
      if (!formData.email.trim() || !formData.password.trim()) {
        toast.error('Lütfen e-posta ve şifre alanlarını doldurun');
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        const result = await signIn(formData.email, formData.password);
        
        if (result.success) {
          toast.success('Başarıyla giriş yaptınız!');
          // useEffect sayesinde otomatik yönlendirilecek
        } else {
          toast.error(result.error || 'Giriş sırasında bir hata oluştu');
        }
      } catch (error) {
        toast.error('Beklenmeyen bir hata oluştu');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Kayıt olma
      if (!formData.email.trim() || !formData.password.trim() || 
          !formData.displayName.trim() || !formData.phoneNumber.trim() ||
          !formData.restaurantName.trim()) {
        toast.error('Lütfen tüm alanları doldurun');
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        const result = await signUp(
          formData.email, 
          formData.password, 
          formData.displayName, 
          formData.phoneNumber
        );
        
        if (result.success) {
          toast.success('Restoran hesabınız oluşturuldu! Lütfen giriş yapın.');
          setIsLogin(true);
          setFormData({
            email: formData.email,
            password: '',
            displayName: '',
            phoneNumber: '',
            restaurantName: ''
          });
        } else {
          toast.error(result.error || 'Kayıt sırasında bir hata oluştu');
        }
      } catch (error) {
        toast.error('Beklenmeyen bir hata oluştu');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <main>
      {/* Header */}
      <Header />

      {/* Sayfa İçeriği */}
      <section className="py-12 min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="container-responsive">
          <div className="max-w-lg mx-auto">
            {/* Form Kartı */}
            <div className="card p-8 shadow-2xl">
              {/* Başlık */}
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <ChefHat className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Restoran Girişi' : 'Restoran Kaydı'}
                </h1>
                <p className="text-gray-600">
                  {isLogin 
                    ? 'Restoran panelinize erişim sağlayın' 
                    : 'NeYisek.com\'a restoran olarak katılın'
                  }
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="restoran@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Kayıt formu için ek alanlar */}
                {!isLogin && (
                  <>
                    {/* Restoran Adı */}
                    <div>
                      <label htmlFor="restaurantName" className="form-label">
                        Restoran Adı *
                      </label>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                          type="text"
                          id="restaurantName"
                          name="restaurantName"
                          value={formData.restaurantName}
                          onChange={handleInputChange}
                          className="form-input pl-10"
                          placeholder="Restoran adınız"
                          required
                        />
                      </div>
                    </div>

                    {/* Yetkili Adı */}
                    <div>
                      <label htmlFor="displayName" className="form-label">
                        Yetkili Adı Soyadı *
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

                    {/* Telefon */}
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
                          placeholder="0532 123 45 67"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

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
                      placeholder="••••••••"
                      required
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

                {/* Kayıt için ek bilgilendirme */}
                {!isLogin && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Not:</strong> Kaydınız tamamlandıktan sonra, restoran bilgilerinizi 
                      tamamlamanız ve menünüzü eklemeniz gerekecektir. Hesabınız inceleme sürecinden 
                      geçtikten sonra aktif hale gelecektir.
                    </p>
                  </div>
                )}

                {/* Giriş/Kayıt Butonu */}
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="spinner h-5 w-5"></div>
                  ) : (
                    <>
                      {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                      {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Form değiştirme */}
              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  {isLogin ? 'Henüz hesabınız yok mu?' : 'Zaten hesabınız var mı?'}
                </p>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary-600 hover:text-primary-700 font-medium mt-2"
                >
                  {isLogin ? 'Restoran Kaydı Oluştur' : 'Giriş Yap'}
                </button>
              </div>

              {/* Müşteri girişi */}
              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Müşteri misiniz?
                </p>
                <Link 
                  href="/account" 
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Müşteri Girişi →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
} 