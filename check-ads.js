const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyAhY94ep5kHijI6sQmYDqaHjxJ8WuLlrMU",
  authDomain: "yem30-halil.firebaseapp.com",
  databaseURL: "https://yem30-halil-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "yem30-halil",
  storageBucket: "yem30-halil.firebasestorage.app",
  messagingSenderId: "483321488725",
  appId: "1:483321488725:web:9876fc0d8f617a0c973bdc",
  measurementId: "G-YW6S5TBRGP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAds() {
  try {
    console.log('🔍 Firestore\'da reklamları kontrol ediyorum...');
    
    // Tüm reklamları getir
    const allAdsQuery = collection(db, 'advertisements');
    const allAdsSnapshot = await getDocs(allAdsQuery);
    console.log('📊 Toplam reklam sayısı:', allAdsSnapshot.size);
    
    allAdsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📄 Reklam ID:', doc.id);
      console.log('   - Başlık:', data.title);
      console.log('   - Pozisyon:', data.position);
      console.log('   - Aktif mi:', data.isActive);
      console.log('   - Başlangıç:', data.startDate?.toDate?.() || data.startDate);
      console.log('   - Bitiş:', data.endDate?.toDate?.() || data.endDate);
      console.log('   - Hedef kitle:', data.targetAudience);
      console.log('   ---');
    });
    
    // Hero pozisyonu için aktif reklamları kontrol et
    const heroQuery = query(
      collection(db, 'advertisements'),
      where('position', '==', 'hero'),
      where('isActive', '==', true)
    );
    const heroSnapshot = await getDocs(heroQuery);
    console.log('🎯 Hero pozisyonu aktif reklam sayısı:', heroSnapshot.size);
    
    // Banner pozisyonu için aktif reklamları kontrol et
    const bannerQuery = query(
      collection(db, 'advertisements'),
      where('position', '==', 'banner'),
      where('isActive', '==', true)
    );
    const bannerSnapshot = await getDocs(bannerQuery);
    console.log('🎯 Banner pozisyonu aktif reklam sayısı:', bannerSnapshot.size);
    
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkAds(); 