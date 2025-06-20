import { remoteConfig } from '@/lib/firebase';
import { fetchAndActivate, getValue, getBoolean, getNumber, getString } from 'firebase/remote-config';

// Remote Config varsayılan değerleri
export interface AppConfig {
  enableNewFeature: boolean;
  maxCartItems: number;
  showPromotionalBanner: boolean;
  deliveryFee: number;
  minimumOrderAmount: number;
  welcomeMessage: string;
  maintenanceMode: boolean;
  appVersion: string;
  enablePushNotifications: boolean;
  maxFileUploadSizeMB: number;
  supportedPaymentMethods: string[];
  featuredRestaurantIds: string[];
}

export class RemoteConfigService {
  private static isInitialized = false;
  private static configCache: Partial<AppConfig> = {};

  // Remote Config'i başlat ve değerleri getir
  static async initialize(): Promise<boolean> {
    if (!remoteConfig) {
      console.warn('Remote Config kullanılamıyor');
      return false;
    }

    try {
      // Fetch and activate
      await fetchAndActivate(remoteConfig);
      this.isInitialized = true;
      
      // Cache'i güncelle
      await this.refreshCache();
      
      console.log('🔧 Remote Config başarıyla başlatıldı');
      return true;
    } catch (error) {
      console.warn('Remote Config başlatılamadı:', error);
      return false;
    }
  }

  // Cache'i yenile
  private static async refreshCache() {
    if (!remoteConfig) return;

    try {
      this.configCache = {
        enableNewFeature: getBoolean(remoteConfig, 'enable_new_feature'),
        maxCartItems: getNumber(remoteConfig, 'max_cart_items'),
        showPromotionalBanner: getBoolean(remoteConfig, 'show_promotional_banner'),
        deliveryFee: getNumber(remoteConfig, 'delivery_fee'),
        minimumOrderAmount: getNumber(remoteConfig, 'minimum_order_amount'),
        welcomeMessage: getString(remoteConfig, 'welcome_message'),
        maintenanceMode: getBoolean(remoteConfig, 'maintenance_mode'),
        appVersion: getString(remoteConfig, 'app_version'),
        enablePushNotifications: getBoolean(remoteConfig, 'enable_push_notifications'),
        maxFileUploadSizeMB: getNumber(remoteConfig, 'max_file_upload_size_mb'),
        supportedPaymentMethods: getString(remoteConfig, 'supported_payment_methods').split(','),
        featuredRestaurantIds: getString(remoteConfig, 'featured_restaurant_ids').split(',')
      };

      console.log('📋 Remote Config cache güncellendi:', this.configCache);
    } catch (error) {
      console.warn('Cache yenileme hatası:', error);
    }
  }

  // Boolean değer al
  static getBoolean(key: keyof AppConfig, defaultValue: boolean = false): boolean {
    if (!this.isInitialized) {
      console.warn(`Remote Config başlatılmamış, varsayılan değer kullanılıyor: ${key} = ${defaultValue}`);
      return defaultValue;
    }

    try {
      const value = this.configCache[key];
      return typeof value === 'boolean' ? value : defaultValue;
    } catch (error) {
      console.warn(`Remote Config boolean değer alınamadı: ${key}`, error);
      return defaultValue;
    }
  }

  // Number değer al
  static getNumber(key: keyof AppConfig, defaultValue: number = 0): number {
    if (!this.isInitialized) {
      console.warn(`Remote Config başlatılmamış, varsayılan değer kullanılıyor: ${key} = ${defaultValue}`);
      return defaultValue;
    }

    try {
      const value = this.configCache[key];
      return typeof value === 'number' ? value : defaultValue;
    } catch (error) {
      console.warn(`Remote Config number değer alınamadı: ${key}`, error);
      return defaultValue;
    }
  }

  // String değer al
  static getString(key: keyof AppConfig, defaultValue: string = ''): string {
    if (!this.isInitialized) {
      console.warn(`Remote Config başlatılmamış, varsayılan değer kullanılıyor: ${key} = ${defaultValue}`);
      return defaultValue;
    }

    try {
      const value = this.configCache[key];
      return typeof value === 'string' ? value : defaultValue;
    } catch (error) {
      console.warn(`Remote Config string değer alınamadı: ${key}`, error);
      return defaultValue;
    }
  }

  // Array değer al
  static getArray(key: keyof AppConfig, defaultValue: string[] = []): string[] {
    if (!this.isInitialized) {
      console.warn(`Remote Config başlatılmamış, varsayılan değer kullanılıyor: ${key} = ${defaultValue}`);
      return defaultValue;
    }

    try {
      const value = this.configCache[key];
      return Array.isArray(value) ? value : defaultValue;
    } catch (error) {
      console.warn(`Remote Config array değer alınamadı: ${key}`, error);
      return defaultValue;
    }
  }

  // Tüm konfigürasyonu al
  static getAllConfig(): Partial<AppConfig> {
    return { ...this.configCache };
  }

  // Feature flag kontrolü
  static isFeatureEnabled(featureName: string): boolean {
    switch (featureName) {
      case 'newFeature':
        return this.getBoolean('enableNewFeature');
      case 'pushNotifications':
        return this.getBoolean('enablePushNotifications');
      case 'promotionalBanner':
        return this.getBoolean('showPromotionalBanner');
      default:
        console.warn(`Bilinmeyen feature flag: ${featureName}`);
        return false;
    }
  }

  // Maintenance mode kontrolü
  static isMaintenanceMode(): boolean {
    return this.getBoolean('maintenanceMode');
  }

  // Minimum sipariş tutarı
  static getMinimumOrderAmount(): number {
    return this.getNumber('minimumOrderAmount', 25);
  }

  // Teslimat ücreti
  static getDeliveryFee(): number {
    return this.getNumber('deliveryFee', 5);
  }

  // Maksimum sepet öğe sayısı
  static getMaxCartItems(): number {
    return this.getNumber('maxCartItems', 10);
  }

  // Hoş geldin mesajı
  static getWelcomeMessage(): string {
    return this.getString('welcomeMessage', 'Hoş geldiniz!');
  }

  // Desteklenen ödeme yöntemleri
  static getSupportedPaymentMethods(): string[] {
    return this.getArray('supportedPaymentMethods', ['cash', 'card']);
  }

  // Öne çıkan restoran ID'leri
  static getFeaturedRestaurantIds(): string[] {
    return this.getArray('featuredRestaurantIds', []);
  }

  // Maksimum dosya yükleme boyutu (MB)
  static getMaxFileUploadSizeMB(): number {
    return this.getNumber('maxFileUploadSizeMB', 5);
  }

  // Konfigürasyonu zorla yenile
  static async forceRefresh(): Promise<boolean> {
    if (!remoteConfig) return false;

    try {
      // Minimum fetch interval'ı sıfırla
      remoteConfig.settings.minimumFetchIntervalMillis = 0;
      
      await fetchAndActivate(remoteConfig);
      await this.refreshCache();
      
      console.log('🔄 Remote Config zorla yenilendi');
      return true;
    } catch (error) {
      console.warn('Remote Config yenileme hatası:', error);
      return false;
    }
  }

  // Development için debug bilgileri
  static debugInfo() {
    console.log('🔧 Remote Config Debug Info:', {
      isInitialized: this.isInitialized,
      cacheSize: Object.keys(this.configCache).length,
      config: this.configCache
    });
  }
} 