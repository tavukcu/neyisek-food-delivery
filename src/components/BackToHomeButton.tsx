'use client';

import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

interface BackToHomeButtonProps {
  variant?: 'primary' | 'secondary' | 'minimal';
  position?: 'fixed' | 'static';
  className?: string;
  showIcon?: boolean;
  text?: string;
}

export default function BackToHomeButton({ 
  variant = 'primary',
  position = 'static',
  className = '',
  showIcon = true,
  text = 'Ana Sayfaya Dön'
}: BackToHomeButtonProps) {
  const baseClasses = "inline-flex items-center gap-2 font-medium transition-all duration-300 transform hover:scale-105";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 px-6 py-3 rounded-xl shadow-md hover:shadow-lg",
    minimal: "text-green-600 hover:text-green-700 hover:bg-green-50 px-4 py-2 rounded-lg"
  };
  
  const positionClasses = position === 'fixed' 
    ? "fixed bottom-6 right-6 z-50 shadow-2xl" 
    : "";
  
  return (
    <Link 
      href="/"
      className={`${baseClasses} ${variantClasses[variant]} ${positionClasses} ${className}`}
    >
      {showIcon && (
        variant === 'minimal' ? 
          <ArrowLeft className="h-5 w-5" /> : 
          <Home className="h-5 w-5" />
      )}
      <span>{text}</span>
    </Link>
  );
} 