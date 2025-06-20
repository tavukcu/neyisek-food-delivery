const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function checkCategories() {
  try {
    const categoriesRef = collection(db, 'categories');
    const snapshot = await getDocs(categoriesRef);
    
    console.log('📊 Toplam kategori sayısı:', snapshot.size);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log('📋 Kategori:', {
        id: doc.id,
        name: data.name,
        isActive: data.isActive,
        icon: data.icon
      });
    });
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

checkCategories(); 