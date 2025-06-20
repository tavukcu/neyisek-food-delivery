'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';

interface Favorite {
  id: string;
  userId: string;
  foodId: string;
  foodName: string;
  restaurantId: string;
  restaurantName: string;
  price: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FavoritesListProps {
  user: User | null;
}

export default function FavoritesList({ user }: FavoritesListProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'favorites'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const favoritesList: Favorite[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favoritesList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Favorite);
      });

      setFavorites(favoritesList);
    } catch (error) {
      console.error('Favoriler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    const confirmRemove = window.confirm('Bu yemeği favorilerden çıkarmak istediğinizden emin misiniz?');
    if (!confirmRemove) return;

    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      console.log('✅ Favorilerden çıkarıldı');
      loadFavorites(); // Listeyi yenile
    } catch (error) {
      console.error('Favori silme hatası:', error);
      alert('Favori silinirken bir hata oluştu.');
    }
  };

  const addToCart = (favorite: Favorite) => {
    // Sepete ekleme işlemi - bu kısım sepet sistemine göre güncellenebilir
    console.log('Sepete ekleniyor:', favorite);
    alert(`${favorite.foodName} sepete eklendi!`);
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Favori Yemeklerim ({favorites.length})
        </h3>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Henüz favori yemeğiniz yok</h4>
          <p className="text-gray-500 mb-4">Beğendiğiniz yemekleri favorilere ekleyerek kolayca bulabilirsiniz.</p>
          <Link 
            href="/menu"
            className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Yemekleri Keşfet
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Yemek Resmi */}
              <div className="relative h-48">
                {favorite.imageUrl ? (
                  <Image
                    src={favorite.imageUrl}
                    alt={favorite.foodName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Favori Çıkar Butonu */}
                <button
                  onClick={() => removeFavorite(favorite.id)}
                  className="absolute top-2 right-2 p-2 bg-white bg-opacity-90 rounded-full text-red-500 hover:bg-red-50 transition-colors duration-200"
                  title="Favorilerden çıkar"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Yemek Bilgileri */}
              <div className="p-4">
                <div className="mb-2">
                  <h4 className="font-semibold text-gray-900 mb-1">{favorite.foodName}</h4>
                  <Link 
                    href={`/restaurant/${favorite.restaurantId}`}
                    className="text-sm text-gray-600 hover:text-green-600 transition-colors duration-200"
                  >
                    📍 {favorite.restaurantName}
                  </Link>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-green-600">
                    ₺{favorite.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {favorite.createdAt.toLocaleDateString('tr-TR')}
                  </span>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => addToCart(favorite)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors duration-200"
                  >
                    Sepete Ekle
                  </button>
                  <Link
                    href={`/restaurant/${favorite.restaurantId}`}
                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Restoran
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Favori İstatistikleri */}
      {favorites.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Favori İstatistikleri</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{favorites.length}</div>
              <div className="text-sm text-gray-600">Toplam Favori</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {new Set(favorites.map(f => f.restaurantId)).size}
              </div>
              <div className="text-sm text-gray-600">Farklı Restoran</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                ₺{(favorites.reduce((sum, f) => sum + f.price, 0) / favorites.length).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Ortalama Fiyat</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                ₺{Math.min(...favorites.map(f => f.price)).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">En Ucuz</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 