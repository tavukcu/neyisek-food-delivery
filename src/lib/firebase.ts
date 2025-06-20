// Firebase SDK'larından gerekli fonksiyonları import ediyoruz
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import { getPerformance } from "firebase/performance";
import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Firebase konfigürasyon ayarları
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

// Firebase uygulamasını başlatıyoruz
const app = initializeApp(firebaseConfig);

// Google Auth Provider'ını oluşturuyoruz
export const googleProvider = new GoogleAuthProvider();
// Google Auth için ek ayarlar
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firebase servislerini export ediyoruz
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Analytics, Performance ve Remote Config - sadece browser ortamında
let analytics: any = null;
let performance: any = null;
let remoteConfig: any = null;

// Browser ortamında ve window yüklendikten sonra Firebase servislerini başlat
if (typeof window !== 'undefined') {
  // Analytics'i güvenli şekilde başlat
  const initializeAnalytics = async () => {
    try {
      const supported = await analyticsSupported();
    if (supported) {
      analytics = getAnalytics(app);
      console.log('🔥 Firebase Analytics başlatıldı');
      } else {
        console.warn('Firebase Analytics bu ortamda desteklenmiyor');
      }
    } catch (error) {
      console.warn('Firebase Analytics başlatılamadı:', error);
    }
  };

  // Performance Monitoring'i güvenli şekilde başlat
  const initializePerformance = () => {
  try {
    performance = getPerformance(app);
    console.log('📊 Firebase Performance Monitoring başlatıldı');
  } catch (error) {
    console.warn('Performance Monitoring başlatılamadı:', error);
  }
  };

  // Remote Config'i güvenli şekilde başlat
  const initializeRemoteConfig = () => {
  try {
    remoteConfig = getRemoteConfig(app);
    
    // Remote Config varsayılan değerleri
    remoteConfig.defaultConfig = {
      enable_new_feature: false,
      max_cart_items: 10,
      show_promotional_banner: true,
      delivery_fee: 5,
      minimum_order_amount: 25,
      welcome_message: "Hoş geldiniz!",
      maintenance_mode: false,
      app_version: "1.0.0"
    };
    
    // Minimum fetch interval (development için kısa)
    remoteConfig.settings = {
      minimumFetchIntervalMillis: process.env.NODE_ENV === 'development' ? 10000 : 3600000, // 10s dev, 1h prod
      fetchTimeoutMillis: 60000, // 60 seconds
    };
    
    console.log('🔧 Firebase Remote Config başlatıldı');
  } catch (error) {
    console.warn('Remote Config başlatılamadı:', error);
    }
  };

  // DOM yüklendikten sonra servisleri başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeAnalytics();
      initializePerformance();
      initializeRemoteConfig();
    });
  } else {
    // DOM zaten yüklü
    initializeAnalytics();
    initializePerformance();
    initializeRemoteConfig();
  }
}

// Export edilen servisler
export { analytics, performance, remoteConfig };

// Development ortamında Firebase emulator'ları kullan (opsiyonel)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Auth emulator için
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
    } catch (error) {
      console.log('Firebase emulator connection error:', error);
    }
  }
}

// Storage için CORS ayarları
if (typeof window !== 'undefined') {
  // Storage requests için retry logic
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args);
    } catch (error) {
      console.warn('Fetch error:', error);
      // CORS hatası durumunda retry
      if (error instanceof TypeError && error.message.includes('CORS')) {
        console.log('Retrying request due to CORS error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await originalFetch(...args);
      }
      throw error;
    }
  };
}

export default app; 