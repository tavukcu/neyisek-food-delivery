'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface FavoriteButtonProps {
  user: User | null;
  foodId: string;
  foodName: string;
  restaurantId: string;
  restaurantName: string;
  price: number;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export default function FavoriteButton({
  user,
  foodId,
  foodName,
  restaurantId,
  restaurantName,
  price,
  imageUrl,
  size = 'md',
  showText = false
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  // Favori durumunu kontrol et
  useEffect(() => {
    if (user && foodId) {
      checkFavoriteStatus();
    }
  }, [user, foodId]);

  const checkFavoriteStatus = async () => {
    if (!user) return;

    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${foodId}`);
      const favoriteDoc = await getDoc(favoriteRef);
      setIsFavorite(favoriteDoc.exists());
    } catch (error) {
      console.error('Favori durumu kontrol hatası:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      alert('Favorilere eklemek için giriş yapmalısınız.');
      return;
    }

    setLoading(true);

    try {
      const favoriteRef = doc(db, 'favorites', `${user.uid}_${foodId}`);

      if (isFavorite) {
        // Favorilerden çıkar
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
        console.log('✅ Favorilerden çıkarıldı');
      } else {
        // Favorilere ekle
        await setDoc(favoriteRef, {
          userId: user.uid,
          foodId,
          foodName,
          restaurantId,
          restaurantName,
          price,
          imageUrl: imageUrl || '',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setIsFavorite(true);
        console.log('✅ Favorilere eklendi');
      }
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
      alert('Favori işlemi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`
        ${buttonSizeClasses[size]}
        ${isFavorite 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
        }
        transition-all duration-200 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${showText ? 'flex items-center space-x-2' : ''}
      `}
      title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
    >
      {loading ? (
        <div className={`${sizeClasses[size]} animate-spin`}>
          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
      ) : (
        <>
          <svg 
            className={`${sizeClasses[size]} ${isFavorite ? 'fill-current' : ''}`} 
            fill={isFavorite ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          {showText && (
            <span className="text-sm font-medium">
              {isFavorite ? 'Favorilerden Çıkar' : 'Favorilere Ekle'}
            </span>
          )}
        </>
      )}
    </button>
  );
} 