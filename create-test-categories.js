const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, getDocs } = require('firebase/firestore');

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

async function createTestCategories() {
  try {
    // Önce mevcut kategorileri kontrol et
    const categoriesRef = collection(db, 'categories');
    const existingCategories = await getDocs(categoriesRef);
    
    console.log(`📊 Mevcut kategori sayısı: ${existingCategories.size}`);
    
    const categories = [
      {
        name: 'Pizza',
        description: 'Lezzetli İtalyan pizzaları',
        icon: '🍕',
        color: '#FF6B6B',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Burger',
        description: 'Sulu hamburgerler',
        icon: '🍔',
        color: '#4ECDC4',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Döner',
        description: 'Geleneksel Türk döneri',
        icon: '🥙',
        color: '#45B7D1',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Makarna',
        description: 'İtalyan makarna çeşitleri',
        icon: '🍝',
        color: '#96CEB4',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Tatlı',
        description: 'Nefis tatlılar',
        icon: '🍰',
        color: '#FFEAA7',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'İçecek',
        description: 'Serinletici içecekler',
        icon: '🥤',
        color: '#DDA0DD',
        isActive: true,
        sortOrder: 6
      },
      {
        name: 'Kahvaltı',
        description: 'Güne güzel başlangıç',
        icon: '🥞',
        color: '#98D8C8',
        isActive: true,
        sortOrder: 7
      },
      {
        name: 'Salata',
        description: 'Sağlıklı ve taze salatalar',
        icon: '🥗',
        color: '#F7DC6F',
        isActive: true,
        sortOrder: 8
      }
    ];

    console.log('🚀 Test kategorileri oluşturuluyor...');
    
    for (const categoryData of categories) {
      const docRef = await addDoc(categoriesRef, {
        ...categoryData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Kategori oluşturuldu: ${categoryData.name} (ID: ${docRef.id})`);
    }
    
    console.log('🎉 Tüm test kategorileri başarıyla oluşturuldu!');
    
    // Güncel kategori sayısını göster
    const updatedCategories = await getDocs(categoriesRef);
    console.log(`📈 Toplam kategori sayısı: ${updatedCategories.size}`);
    
  } catch (error) {
    console.error('❌ Kategori oluşturma hatası:', error);
  }
}

createTestCategories(); 