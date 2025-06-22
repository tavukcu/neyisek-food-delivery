'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useCurrentUserPresence } from '@/hooks/useUserPresence';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Home,
  UtensilsCrossed,
  Phone,
  MapPin,
  LogOut,
  Settings,
  ChefHat,
  ChevronDown,
  Store,
  Info,
  Package,
  Heart,
  Shield
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import NotificationCenter from './NotificationCenter';

// Header komponenti
export default function Header() {
  const { user, signOut } = useAuth();
  const { totalItems } = useCart(); // useCart hook'undan totalItems'ı alıyoruz
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Kullanıcı presence sistemini başlat
  useCurrentUserPresence();

  // Bildirim merkezinin gösterilip gösterilmeyeceğini belirle
  const shouldShowNotifications = user && (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/profile')
  );

  // Mobil menüyü açma/kapama fonksiyonu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Çıkış yapma fonksiyonu
  const handleLogout = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Kullanıcı avatarı render fonksiyonu
  const renderUserAvatar = (size: 'small' | 'default' | 'large' = 'default') => {
    const sizeClasses = {
      small: 'w-7 h-7 sm:w-8 sm:h-8',
      default: 'w-10 h-10',
      large: 'w-12 h-12'
    };

    const textSizeClasses = {
      small: 'text-xs sm:text-sm',
      default: 'text-base',
      large: 'text-lg'
    };

    if (user?.profileImage) {
      return (
        <img
          src={user.profileImage}
          alt={user.displayName || 'Profil resmi'}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            // Resim yüklenemezse fallback'e geç
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList?.remove('hidden');
          }}
        />
      );
    }

    // Fallback avatar (gradient background with initials)
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-green-500 to-yellow-500 rounded-full flex items-center justify-center shadow-sm`}>
        <span className={`text-white font-bold ${textSizeClasses[size]}`}>
          {user?.displayName?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-12 sm:h-16 lg:h-18">
          {/* Logo ve Brand */}
          <Link href="/" className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-1 sm:p-2 shadow-lg">
              <UtensilsCrossed className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl lg:text-2xl font-black text-gray-900 leading-tight">
                NeYisek
              </span>
              <span className="text-xs text-green-600 font-medium leading-none hidden sm:block">
                .com
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link 
              href="/menu" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <ChefHat className="h-4 w-4" />
              Menü
            </Link>
            <Link 
              href="/restaurants" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Store className="h-4 w-4" />
              Restoranlar
            </Link>
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-green-600 font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Hakkımızda
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            {/* Cart Button */}
            <Link 
              href="/cart" 
              className="relative p-1 sm:p-2 text-gray-700 hover:text-green-600 transition-colors duration-200"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  {renderUserAvatar('small')}
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[60px] sm:max-w-[100px]">
                    {user.displayName || user.email?.split('@')[0] || 'Kullanıcı'}
                  </span>
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || 'Kullanıcı'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                    
                    <Link 
                      href="/orders" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Package className="h-4 w-4" />
                      Siparişlerim
                    </Link>
                    
                    <Link 
                      href="/favorites" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Heart className="h-4 w-4" />
                      Favoriler
                    </Link>
                    
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Ayarlar
                    </Link>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Çıkış Yap
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link 
                  href="/login" 
                  className="text-xs sm:text-sm font-medium text-gray-700 hover:text-green-600 transition-colors duration-200 px-2 sm:px-3 py-1 rounded-lg hover:bg-green-50"
                >
                  Giriş
                </Link>
                <Link 
                  href="/register" 
                  className="text-xs sm:text-sm font-medium bg-green-500 hover:bg-green-600 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-lg transition-colors duration-200"
                >
                  Kayıt
                </Link>
              </div>
            )}

            {/* Admin/Restaurant Panel Buttons */}
            {(user?.role === 'admin' || user?.role === 'restaurant') && (
              <div className="hidden sm:flex items-center gap-2">
                {user.role === 'admin' && (
                  <Link 
                    href="/admin" 
                    className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">Admin</span>
                  </Link>
                )}
                
                {user.role === 'restaurant' && (
                  <Link 
                    href="/restaurant-panel" 
                    className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                  >
                    <Store className="h-4 w-4" />
                    <span className="hidden lg:inline">Panel</span>
                  </Link>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-1 sm:p-2 text-gray-700 hover:text-green-600 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 