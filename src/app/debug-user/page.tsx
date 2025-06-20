'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

export default function DebugUserPage() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [applicationInfo, setApplicationInfo] = useState<any>(null);
  const [restaurantInfo, setRestaurantInfo] = useState<any>(null);
  const [ordersInfo, setOrdersInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const targetEmail = 'yusuf@gmail.com';

  const checkUserStatus = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Kullanıcıyı ara
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', targetEmail));
      const userSnapshot = await getDocs(userQuery);
      
      let userData = null;
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        userData = { id: userDoc.id, ...userDoc.data() };
        setUserInfo(userData);
        setMessage('✅ Kullanıcı bulundu');
      } else {
        setUserInfo(null);
        setMessage('❌ Kullanıcı bulunamadı: yusuf@gmail.com');
      }
      
      // Restoran başvurusunu ara
      const applicationsRef = collection(db, 'restaurant_applications');
      const appQuery = query(applicationsRef, where('email', '==', targetEmail));
      const appSnapshot = await getDocs(appQuery);
      
      let applicationData = null;
      if (!appSnapshot.empty) {
        const appDoc = appSnapshot.docs[0];
        applicationData = { id: appDoc.id, ...appDoc.data() };
        setApplicationInfo(applicationData);
        setMessage(prev => prev + ' | ✅ Başvuru bulundu');
      } else {
        setApplicationInfo(null);
        setMessage(prev => prev + ' | ❌ Başvuru bulunamadı');
      }
      
      // Restoran bilgisini ara
      if (userData?.restaurantId) {
        const restaurantRef = collection(db, 'restaurants');
        const restaurantQuery = query(restaurantRef, where('ownerId', '==', userSnapshot.docs[0].id));
        const restaurantSnapshot = await getDocs(restaurantQuery);
        
        if (!restaurantSnapshot.empty) {
          const restaurantDoc = restaurantSnapshot.docs[0];
          const restaurantData = restaurantDoc.data();
          setRestaurantInfo({
            id: restaurantDoc.id,
            ...restaurantData,
            createdAt: restaurantData.createdAt?.toDate?.()?.toString() || 'N/A',
            updatedAt: restaurantData.updatedAt?.toDate?.()?.toString() || 'N/A'
          });
          setMessage(prev => prev + ' | ✅ Restoran bulundu');
        } else {
          setRestaurantInfo(null);
          setMessage(prev => prev + ' | ❌ Restoran bulunamadı');
        }
        
        // Restoran siparişlerini kontrol et
        const ordersSnapshot = await getDocs(
          query(
            collection(db, 'orders'), 
            where('restaurantId', '==', userData.restaurantId),
            orderBy('createdAt', 'desc')
          )
        );
        
        const ordersData = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
          updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
        }));
        setOrdersInfo(ordersData);
      } else {
        setRestaurantInfo(null);
        setOrdersInfo([]);
        setMessage(prev => prev + ' | ❌ Restoran bulunamadı');
      }
      
    } catch (error) {
      console.error('Kullanıcı durumu kontrol hatası:', error);
      toast.error('Kontrol sırasında hata oluştu: ' + error.message);
      setMessage('❌ Hata: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fixUserAccess = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      // Kullanıcıyı ara
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', targetEmail));
      const userSnapshot = await getDocs(userQuery);
      
      let userId: string;
      
      if (userSnapshot.empty) {
        // Kullanıcı yoksa oluştur
        const userRef = doc(collection(db, 'users'));
        await setDoc(userRef, {
          email: targetEmail,
          name: 'Yusuf',
          role: 'restaurant',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        userId = userRef.id;
        setMessage('✅ Kullanıcı oluşturuldu');
      } else {
        // Mevcut kullanıcıyı güncelle
        const userDoc = userSnapshot.docs[0];
        userId = userDoc.id;
        await updateDoc(userDoc.ref, {
          role: 'restaurant',
          updatedAt: serverTimestamp()
        });
        setMessage('✅ Kullanıcı güncellendi');
      }
      
      // Restoran kaydını oluştur
      const restaurantRef = doc(collection(db, 'restaurants'));
      await setDoc(restaurantRef, {
        name: 'Erdem Pide',
        ownerId: userId,
        ownerName: 'Yusuf',
        email: targetEmail,
        phone: '+90555123456',
        address: 'Manisa, Türkiye',
        description: 'Geleneksel lezzetler ve taze pideler',
        isActive: true,
        isOpen: true,
        rating: 4.5,
        deliveryTime: 30,
        minimumOrder: 25,
        deliveryFee: 5,
        categories: ['Pide', 'Türk Mutfağı'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Kullanıcıya restaurantId'yi ata
      const usersRefUpdate = collection(db, 'users');
      const userQueryUpdate = query(usersRefUpdate, where('email', '==', targetEmail));
      const userSnapshotUpdate = await getDocs(userQueryUpdate);
      
      if (!userSnapshotUpdate.empty) {
        const userDocUpdate = userSnapshotUpdate.docs[0];
        await updateDoc(userDocUpdate.ref, {
          restaurantId: restaurantRef.id,
          updatedAt: serverTimestamp()
        });
      }
      
      setMessage(prev => prev + ' | ✅ Restoran oluşturuldu | 🎉 Tüm işlemler tamamlandı!');
      
      // Verileri yenile
      setTimeout(() => {
        checkUserStatus();
      }, 1000);
      
    } catch (error) {
      console.error('Kullanıcı düzeltme hatası:', error);
      toast.error('Düzeltme sırasında hata oluştu: ' + error.message);
      setMessage('❌ Düzeltme hatası: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Kullanıcı Debug Paneli - yusuf@gmail.com
        </h1>
        
        <div className="space-y-6">
          {/* Kontrol Butonları */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-4">
              <button
                onClick={checkUserStatus}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Kontrol Ediliyor...' : 'Kullanıcıyı Kontrol Et'}
              </button>
              
              <button
                onClick={fixUserAccess}
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Düzeltiliyor...' : 'Kullanıcıyı Düzelt'}
              </button>
            </div>
            
            {message && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-mono">{message}</p>
              </div>
            )}
          </div>

          {/* Kullanıcı Bilgileri */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">👤 Kullanıcı Bilgileri</h2>
            {userInfo ? (
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Kullanıcı bilgisi bulunamadı</p>
            )}
          </div>

          {/* Başvuru Bilgileri */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Restoran Başvurusu</h2>
            {applicationInfo ? (
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(applicationInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Restoran başvurusu bulunamadı</p>
            )}
          </div>

          {/* Restoran Bilgileri */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🏪 Restoran Bilgileri</h2>
            {restaurantInfo ? (
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto">
                {JSON.stringify(restaurantInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Restoran bilgisi bulunamadı</p>
            )}
          </div>

          {/* Sipariş Bilgileri */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">🛒 Sipariş Bilgileri</h2>
            {ordersInfo.length > 0 ? (
              <div className="space-y-2 text-sm">
                <p><strong>Toplam Sipariş:</strong> {ordersInfo.length}</p>
                <p><strong>Son 5 Sipariş:</strong></p>
                <div className="max-h-40 overflow-y-auto">
                  {ordersInfo.slice(0, 5).map((order, index) => (
                    <div key={order.id} className="border-l-2 border-blue-200 pl-2 mb-2">
                      <p><strong>#{order.id.slice(-6)}</strong></p>
                      <p>Durum: {order.status}</p>
                      <p>Tutar: {order.totalAmount}₺</p>
                      <p>Tarih: {order.createdAt?.toString?.() || order.createdAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-yellow-600">⚠️ Sipariş bulunamadı</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 