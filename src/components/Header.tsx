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
  ChevronDown
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-lg">
      <div className="container-responsive">
        <div className="flex items-center justify-between h-14 sm:h-16 lg:h-18 xl:h-20">
          {/* Logo Section */}
          <Link href="/" className="group flex items-center space-x-2 sm:space-x-3 transition-all duration-300 hover:scale-105">
            {/* Logo Container */}
            <div className="relative">
              <div className="bg-gradient-to-r from-green-500 to-yellow-500 rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white drop-shadow-sm group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </div>
            
            {/* Brand Text */}
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors duration-300">
                NeYisek.com
              </span>
              <span className="text-xs text-gray-500 hidden sm:hidden lg:block group-hover:text-green-500 transition-colors duration-300 font-medium">
                Lezzetli Yemekler Kapınızda
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {[
              { href: '/', icon: Home, label: 'Ana Sayfa' },
              { href: '/menu', icon: UtensilsCrossed, label: 'Menü' },
              { href: '/location', icon: MapPin, label: 'Konum' },
              { href: '/contact', icon: Phone, label: 'İletişim' },
              { href: '/delivery-areas', icon: MapPin, label: 'Teslimat' }
            ].map((item) => (
              <Link 
                key={item.href}
                href={item.href} 
                className="group relative px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-50"
              >
                <div className="flex items-center space-x-2 text-gray-700 group-hover:text-green-600 transition-colors duration-300">
                  {typeof item.icon === 'string' ? (
                    <span className="text-lg">{item.icon}</span>
                  ) : (
                    <item.icon className="h-4 w-4" />
                  )}
                  <span className="font-medium">{item.label}</span>
                </div>
                
                {/* Simple underline */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-green-500 group-hover:w-3/4 transition-all duration-300 rounded-full"></div>
              </Link>
            ))}
            
            {/* Admin/Restaurant Panel Links */}
            {user && user.isAdmin && (
              <Link 
                href="/admin" 
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ml-6"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Admin Panel</span>
                </div>
              </Link>
            )}
            
            {user && user.role === 'restaurant' && (
              <Link 
                href="/restaurant" 
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-300 shadow-md hover:shadow-lg ml-6"
              >
                <div className="flex items-center space-x-2">
                  <ChefHat className="h-4 w-4" />
                  <span>Restoran Panel</span>
                </div>
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cart Icon */}
            <Link 
              href="/cart" 
              className="relative p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 group"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 hover:text-green-600 transition-colors duration-300" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center shadow-lg border-2 border-white animate-pulse group-hover:scale-110 transition-transform duration-200">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>

            {/* User Section */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Notification Center */}
                {shouldShowNotifications && <NotificationCenter />}
                
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-1 sm:space-x-2 p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300"
                  >
                    {/* User Avatar */}
                    <div className="relative">
                      {renderUserAvatar('small')}
                      {/* Fallback için gizli div */}
                      {user?.profileImage && (
                        <div className="hidden w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs sm:text-sm font-bold">
                            {user.displayName?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {user.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.role === 'restaurant' ? 'Restoran' : user.isAdmin ? 'Admin' : 'Müşteri'}
                      </div>
                    </div>
                    
                    <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 transition-transform duration-300" style={{
                      transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }} />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {renderUserAvatar('default')}
                            {/* Fallback için gizli div */}
                            {user?.profileImage && (
                              <div className="hidden w-10 h-10 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">
                                  {user.displayName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.displayName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <Link 
                          href="/profile" 
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>Profilim</span>
                        </Link>
                        <Link 
                          href="/orders" 
                          className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>Siparişlerim</span>
                        </Link>
                        
                        {user.role === 'restaurant' && (
                          <Link 
                            href="/restaurant" 
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-medium transition-colors duration-200"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <ChefHat className="h-4 w-4" />
                            <span>Restoran Paneli</span>
                          </Link>
                        )}
                        
                        {user.isAdmin && (
                          <Link 
                            href="/admin" 
                            className="flex items-center space-x-3 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 font-medium transition-colors duration-200"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4" />
                            <span>Admin Paneli</span>
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button 
                            onClick={() => {
                              handleLogout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                          >
                            <LogOut className="h-4 w-4" />
                            <span>Çıkış Yap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link 
                href="/account" 
                className="p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 hover:text-green-600 transition-colors duration-300" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300"
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              ) : (
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-4 space-y-2">
              {/* Navigation Links */}
              {[
                { href: '/', icon: Home, label: 'Ana Sayfa' },
                { href: '/menu', icon: UtensilsCrossed, label: 'Menü' },
                { href: '/location', icon: MapPin, label: 'Konum' },
                { href: '/contact', icon: Phone, label: 'İletişim' },
                { href: '/delivery-areas', icon: MapPin, label: 'Teslimat Alanları' }
              ].map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-200"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {typeof item.icon === 'string' ? (
                    <span className="text-xl">{item.icon}</span>
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
              
              {/* User Section */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-3">
                      <div className="relative">
                        {renderUserAvatar('default')}
                        {/* Fallback için gizli div */}
                        {user?.profileImage && (
                          <div className="hidden w-10 h-10 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {user.displayName?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.displayName}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    
                    <Link 
                      href="/profile" 
                      className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      <span>Profilim</span>
                    </Link>
                    
                    <Link 
                      href="/orders" 
                      className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>Siparişlerim</span>
                    </Link>
                    
                    {user.role === 'restaurant' && (
                      <Link 
                        href="/restaurant" 
                        className="flex items-center space-x-3 p-3 rounded-lg text-green-600 hover:bg-green-50 font-medium transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <ChefHat className="h-5 w-5" />
                        <span>Restoran Paneli</span>
                      </Link>
                    )}
                    
                    {user.isAdmin && (
                      <Link 
                        href="/admin" 
                        className="flex items-center space-x-3 p-3 rounded-lg text-purple-600 hover:bg-purple-50 font-medium transition-all duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        <span>Admin Paneli</span>
                      </Link>
                    )}
                    
                    <button 
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 mt-2"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Çıkış Yap</span>
                    </button>
                  </>
                ) : (
                  <Link 
                    href="/account" 
                    className="flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-green-600 transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5" />
                    <span>Müşteri Girişi</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 