// Kullanıcı rolleri
export type UserRole = 'customer' | 'restaurant' | 'admin';

// Kullanıcı tipi tanımı
export interface User {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  address?: Address;
  role: UserRole; // Kullanıcı rolü: müşteri, restoran, admin
  isAdmin?: boolean; // Geriye dönük uyumluluk için (optional)
  isActive: boolean; // Kullanıcı aktif mi?
  restaurantId?: string; // Restoran sahipleri için restoran ID'si
  profileImage?: string; // Profile picture URL
  lastLoginAt?: Date; // Son giriş tarihi
  createdAt: Date;
  updatedAt?: Date;
}

// Adres tipi tanımı
export interface Address {
  street: string;
  city: string;
  district: string;
  zipCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Yemek kategorisi tipi tanımı
export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string; // 3D emoji icon
  imageUrl: string;
  color?: string; // Kategori kart rengi (hex color veya tailwind class)
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

// Ürün varyantı tipi tanımı
export interface ProductVariant {
  id: string;
  name: string; // Küçük, Orta, Büyük
  price: number;
  stock: number;
  isActive: boolean;
}

// Ürün resim galerisi tipi
export interface ProductImage {
  id: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
}

// Yemek ürünü tipi tanımı
export interface Product {
  id: string;
  restaurantId: string; // Ürünün ait olduğu restoran ID'si
  name: string;
  description: string;
  price: number; // Base price
  categoryId: string;
  imageUrl: string; // Primary image
  images: ProductImage[]; // Image gallery
  variants: ProductVariant[]; // Size/price variants
  ingredients: string[];
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  preparationTime: number; // dakika cinsinden
  calories: number;
  isActive: boolean;
  stock: number; // Base stock
  minStock: number; // Minimum stock alert
  maxStock: number; // Maximum stock limit
  tags: string[]; // Search tags
  rating: number; // Average rating
  reviewCount: number; // Number of reviews
  isPopular: boolean; // Popular product flag
  isFeatured: boolean; // Featured product flag
  createdAt: Date;
  updatedAt: Date;
}

// Sepet ürünü tipi tanımı
export interface CartItem {
  productId: string;
  product: Product;
  variantId?: string; // Selected variant
  variant?: ProductVariant;
  quantity: number;
  specialInstructions?: string;
  categoryId: string; // Kategori ID'si
  price: number; // Ürün fiyatı (variant fiyatı veya base fiyat)
}

// Sipariş durumu enum'u
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERING = 'delivering',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Ödeme yöntemi enum'u (güncellendi - sadece kapıda ödeme)
export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',     // Kapıda nakit ödeme
  CARD_ON_DELIVERY = 'card_on_delivery'      // Kapıda kredi kartı ile ödeme
}

// Komisyon hesaplama tipi
export interface CommissionCalculation {
  subtotal: number;           // Alt toplam (komisyon öncesi)
  commissionRate: number;     // Komisyon oranı (%9)
  commissionAmount: number;   // Komisyon tutarı
  restaurantEarning: number;  // Restoranın kazancı
  platformEarning: number;    // Platform kazancı
}

// Mali işlem tipi
export interface Transaction {
  id: string;
  orderId: string;
  restaurantId: string;
  type: 'commission' | 'payment' | 'refund';
  amount: number;
  commissionAmount: number;
  platformAmount: number;
  restaurantAmount: number;
  paymentMethod: PaymentMethod;
  status: 'pending' | 'completed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Restoran mali özeti
export interface RestaurantFinancials {
  restaurantId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  totalRevenue: number;        // Toplam gelir
  totalCommission: number;     // Toplam komisyon
  netEarning: number;          // Net kazanç
  totalOrders: number;         // Toplam sipariş sayısı
  averageOrderValue: number;   // Ortalama sipariş değeri
  commissionRate: number;      // Komisyon oranı
  paymentMethodBreakdown: {
    cash: { count: number; amount: number; commission: number };
    card: { count: number; amount: number; commission: number };
  };
  dailyBreakdown: {
    date: Date;
    revenue: number;
    commission: number;
    netEarning: number;
    orderCount: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Sipariş tipi tanımı (güncellenmiş)
export interface Order {
  id: string;
  userId: string;
  user: User;
  restaurantId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  commissionCalculation: CommissionCalculation;  // Komisyon hesaplaması
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryAddress: Address;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  specialInstructions?: string;
  transactionId?: string;  // Mali işlem ID'si
  createdAt: Date;
  updatedAt: Date;
}

// Restoran bilgileri tipi tanımı
export interface RestaurantInfo {
  id: string;
  name: string;
  description: string;
  categoryIds: string[]; // Restoranın sunduğu kategori ID'leri
  address: Address;
  phone: string;
  email: string;
  website?: string;
  coverImageUrl?: string; // Restoran kapak görseli
  workingHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  deliveryRadius: number; // km cinsinden
  minimumOrderAmount: number;
  deliveryFee: number;
  estimatedDeliveryTime: number; // dakika cinsinden
  isOpen: boolean;
  rating?: number; // Restoran puanı (0-5)
  reviewCount?: number; // Yorum sayısı
  commissionRate: number; // Komisyon oranı (varsayılan %9)
  createdAt: Date;
  updatedAt: Date;
}

// E-posta türleri
export enum EmailType {
  WELCOME = 'welcome',
  ORDER_CONFIRMATION = 'order_confirmation',
  ORDER_STATUS_UPDATE = 'order_status_update',
  RESTAURANT_APPLICATION = 'restaurant_application',
  FINANCIAL_REPORT = 'financial_report',
  PASSWORD_RESET = 'password_reset'
}

// E-posta template'leri için interface'ler
export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export interface OrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  restaurantName: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: string;
  estimatedDelivery?: string;
}

export interface RestaurantApplicationEmailData {
  restaurantName: string;
  ownerName: string;
  ownerEmail: string;
  status: 'approved' | 'rejected' | 'pending';
  adminMessage?: string;
}

export interface FinancialReportEmailData {
  restaurantName: string;
  ownerEmail: string;
  reportPeriod: {
    start: Date;
    end: Date;
  };
  totalRevenue: number;
  totalOrders: number;
  commission: number;
  netEarnings: number;
  pdfBuffer?: Buffer;
}

// Reklam/Kampanya türleri
export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  buttonText?: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  position: 'hero' | 'banner' | 'sidebar' | 'popup';
  priority: number; // Yüksek öncelik üstte gösterilir
  targetAudience?: 'all' | 'customers' | 'restaurants';
  backgroundColor?: string;
  textColor?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin user ID
  clickCount: number;
  viewCount: number;
}

export interface AdvertisementStats {
  totalViews: number;
  totalClicks: number;
  ctr: number; // Click-through rate
  dailyStats: {
    date: string;
    views: number;
    clicks: number;
  }[];
}

// ===== PUANLAMA VE DEĞERLENDİRME SİSTEMİ =====

// Değerlendirme tipi enum'u
export enum ReviewType {
  PRODUCT = 'product',           // Ürün değerlendirmesi
  RESTAURANT = 'restaurant',     // Restoran değerlendirmesi
  ORDER = 'order',              // Sipariş değerlendirmesi
  DELIVERY = 'delivery'         // Teslimat değerlendirmesi
}

// Değerlendirme durumu
export enum ReviewStatus {
  PENDING = 'pending',          // Onay bekliyor
  APPROVED = 'approved',        // Onaylandı
  REJECTED = 'rejected',        // Reddedildi
  HIDDEN = 'hidden'            // Gizlendi
}

// Temel değerlendirme interface'i
export interface Review {
  id: string;
  userId: string;                // Değerlendiren kullanıcı
  user: User;                   // Kullanıcı bilgileri
  type: ReviewType;             // Değerlendirme tipi
  targetId: string;             // Hedef ID (product, restaurant, order)
  orderId?: string;             // İlgili sipariş ID'si
  rating: number;               // 1-5 arası puan
  title?: string;               // Değerlendirme başlığı
  comment: string;              // Yorum metni
  pros?: string[];              // Artıları
  cons?: string[];              // Eksileri
  images?: string[];            // Değerlendirme fotoğrafları
  isVerifiedPurchase: boolean;  // Doğrulanmış satın alma
  isAnonymous: boolean;         // Anonim değerlendirme
  status: ReviewStatus;         // Değerlendirme durumu
  helpfulCount: number;         // Faydalı bulan sayısı
  reportCount: number;          // Şikayet sayısı
  moderatorNote?: string;       // Moderatör notu
  createdAt: Date;
  updatedAt: Date;
}

// Ürün değerlendirmesi (Review'dan türetilmiş)
export interface ProductReview extends Review {
  type: ReviewType.PRODUCT;
  productId: string;            // Değerlendirilen ürün ID'si
  product: Product;             // Ürün bilgileri
  restaurantId: string;         // Ürünün restoranı
  qualityRating: number;        // Kalite puanı (1-5)
  tasteRating: number;          // Lezzet puanı (1-5)
  portionRating: number;        // Porsiyon puanı (1-5)
  valueRating: number;          // Fiyat/performans puanı (1-5)
  wouldRecommend: boolean;      // Tavsiye eder mi?
}

// Restoran değerlendirmesi
export interface RestaurantReview extends Review {
  type: ReviewType.RESTAURANT;
  restaurantId: string;         // Değerlendirilen restoran ID'si
  restaurant: RestaurantInfo;   // Restoran bilgileri
  foodQualityRating: number;    // Yemek kalitesi (1-5)
  serviceRating: number;        // Hizmet kalitesi (1-5)
  deliveryRating: number;       // Teslimat kalitesi (1-5)
  valueRating: number;          // Fiyat/performans (1-5)
  wouldOrderAgain: boolean;     // Tekrar sipariş verir mi?
}

// Sipariş değerlendirmesi
export interface OrderReview extends Review {
  type: ReviewType.ORDER;
  orderId: string;              // Değerlendirilen sipariş ID'si
  order: Order;                 // Sipariş bilgileri
  restaurantId: string;         // Sipariş restoranı
  deliveryRating: number;       // Teslimat puanı (1-5)
  packagingRating: number;      // Paketleme puanı (1-5)
  temperatureRating: number;    // Sıcaklık puanı (1-5)
  accuracyRating: number;       // Sipariş doğruluğu (1-5)
  deliveryTime: number;         // Gerçek teslimat süresi (dakika)
  expectedDeliveryTime: number; // Beklenen teslimat süresi (dakika)
}

// Değerlendirme özeti
export interface ReviewSummary {
  targetId: string;             // Hedef ID
  type: ReviewType;             // Değerlendirme tipi
  totalReviews: number;         // Toplam değerlendirme sayısı
  averageRating: number;        // Ortalama puan
  ratingDistribution: {         // Puan dağılımı
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchaseCount: number; // Doğrulanmış satın alma sayısı
  lastUpdated: Date;            // Son güncelleme tarihi
}

// Ürün değerlendirme özeti
export interface ProductReviewSummary extends ReviewSummary {
  type: ReviewType.PRODUCT;
  productId: string;
  averageQualityRating: number;
  averageTasteRating: number;
  averagePortionRating: number;
  averageValueRating: number;
  recommendationRate: number;   // Tavsiye oranı (%)
}

// Restoran değerlendirme özeti
export interface RestaurantReviewSummary extends ReviewSummary {
  type: ReviewType.RESTAURANT;
  restaurantId: string;
  averageFoodQualityRating: number;
  averageServiceRating: number;
  averageDeliveryRating: number;
  averageValueRating: number;
  reorderRate: number;          // Tekrar sipariş oranı (%)
}

// Değerlendirme filtreleri
export interface ReviewFilters {
  rating?: number[];            // Puan filtreleri [4, 5]
  hasComment?: boolean;         // Yorumlu değerlendirmeler
  hasImages?: boolean;          // Fotoğraflı değerlendirmeler
  isVerified?: boolean;         // Doğrulanmış satın almalar
  dateRange?: {                 // Tarih aralığı
    start: Date;
    end: Date;
  };
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful'; // Sıralama
}

// Değerlendirme istatistikleri
export interface ReviewStats {
  period: string;               // Dönem
  totalReviews: number;         // Toplam değerlendirme
  averageRating: number;        // Ortalama puan
  ratingTrend: number;          // Puan trendi (+ veya -)
  responseRate: number;         // Yanıt oranı (%)
  averageResponseTime: number;  // Ortalama yanıt süresi (saat)
  topKeywords: {                // En çok kullanılan kelimeler
    word: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
  monthlyBreakdown: {           // Aylık dağılım
    month: string;
    reviewCount: number;
    averageRating: number;
  }[];
}

// Değerlendirme yanıtı
export interface ReviewResponse {
  id: string;
  reviewId: string;             // Yanıtlanan değerlendirme
  userId: string;               // Yanıtlayan kullanıcı (genelde restoran sahibi)
  user: User;                   // Kullanıcı bilgileri
  message: string;              // Yanıt mesajı
  isOfficial: boolean;          // Resmi yanıt mı?
  createdAt: Date;
  updatedAt: Date;
}

// Değerlendirme bildirimi
export interface ReviewReport {
  id: string;
  reviewId: string;             // Bildirilen değerlendirme
  reporterId: string;           // Bildiren kullanıcı
  reporter: User;               // Bildiren kullanıcı bilgileri
  reason: 'spam' | 'inappropriate' | 'fake' | 'offensive' | 'other'; // Bildirim nedeni
  description?: string;         // Açıklama
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'; // Durum
  moderatorId?: string;         // İnceleyen moderatör
  moderatorNote?: string;       // Moderatör notu
  createdAt: Date;
  updatedAt: Date;
}

// Değerlendirme yardımcı işlemi
export interface ReviewHelpful {
  id: string;
  reviewId: string;             // Değerlendirme ID'si
  userId: string;               // Faydalı bulan kullanıcı
  isHelpful: boolean;           // Faydalı mı değil mi
  createdAt: Date;
}

// Değerlendirme bildirimi ayarları
export interface ReviewNotificationSettings {
  userId: string;
  emailOnNewReview: boolean;    // Yeni değerlendirmede e-posta
  emailOnResponse: boolean;     // Yanıt geldiğinde e-posta
  pushOnNewReview: boolean;     // Yeni değerlendirmede push
  pushOnResponse: boolean;      // Yanıt geldiğinde push
  weeklyDigest: boolean;        // Haftalık özet
  createdAt: Date;
  updatedAt: Date;
}

// Şikayet Sistemi Types
export enum ComplaintType {
  ORDER = 'ORDER',
  PRODUCT = 'PRODUCT',
  RESTAURANT = 'RESTAURANT',
  DELIVERY = 'DELIVERY',
  PAYMENT = 'PAYMENT',
  SERVICE = 'SERVICE',
  TECHNICAL = 'TECHNICAL',
  OTHER = 'OTHER'
}

export enum ComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED'
}

export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface Complaint {
  id: string;
  userId: string;
  user: User;
  type: ComplaintType;
  title: string;
  description: string;
  orderId?: string;
  productId?: string;
  restaurantId?: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  images?: string[];
  adminNotes?: string;
  assignedTo?: string; // Admin user ID
  resolution?: string;
  satisfactionRating?: number; // 1-5 müşteri memnuniyet puanı
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  responseTime?: number; // dakika cinsinden
}

export interface ComplaintResponse {
  id: string;
  complaintId: string;
  adminId: string;
  adminName: string;
  message: string;
  isPublic: boolean; // Müşteriye gösterilsin mi?
  createdAt: Date;
}

export interface ComplaintStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  closed: number;
  rejected: number;
  averageResponseTime: number; // dakika
  satisfactionAverage: number;
  byType: Record<ComplaintType, number>;
  byPriority: Record<ComplaintPriority, number>;
}

export interface ComplaintFilters {
  status?: ComplaintStatus[];
  type?: ComplaintType[];
  priority?: ComplaintPriority[];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  restaurantId?: string;
  assignedTo?: string;
  searchTerm?: string;
}

export interface ComplaintNotification {
  id: string;
  complaintId: string;
  userId: string;
  adminId?: string;
  type: 'NEW_COMPLAINT' | 'STATUS_UPDATE' | 'ADMIN_RESPONSE' | 'RESOLUTION';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
} 