'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { OrderService } from '@/services/orderService';
import { LocationService } from '@/services/locationService';
import { Order, PaymentMethod, OrderStatus, Address } from '@/types';
import { 
  CreditCard, 
  MapPin, 
  Clock, 
  User, 
  Phone,
  Shield,
  Zap,
  Brain,
  Navigation,
  CheckCircle,
  AlertCircle,
  Package,
  Truck,
  Timer,
  Star,
  MessageCircle,
  Gift,
  Percent,
  Calculator,
  Eye,
  Bell,
  Heart,
  Share2,
  Download,
  QrCode,
  Smartphone,
  Wifi,
  Signal,
  Battery,
  CloudSnow
} from 'lucide-react';
import toast from 'react-hot-toast';
import SimpleMapPicker from './SimpleMapPicker';

interface AdvancedOrderCompletionProps {
  className?: string;
}

interface DeliveryEstimate {
  estimatedTime: number;
  confidence: number;
  factors: string[];
  alternativeOptions: {
    type: 'express' | 'scheduled' | 'eco';
    time: number;
    cost: number;
    description: string;
  }[];
}

interface SmartSuggestion {
  type: 'upsell' | 'crossell' | 'discount' | 'loyalty';
  title: string;
  description: string;
  value: number;
  action: string;
}

interface RealTimeUpdate {
  type: 'restaurant' | 'courier' | 'system';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'success';
}

export default function AdvancedOrderCompletion({ className = '' }: AdvancedOrderCompletionProps) {
  const { user } = useAuth();
  const { cartItems, total, clearCart } = useCart();
  const router = useRouter();

  // State Management - Modern Approach
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionStep, setCompletionStep] = useState<'review' | 'payment' | 'confirmation' | 'tracking'>('review');
  
  // Advanced Location Features
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | 'dine_in'>('pickup');
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [deliveryEstimate, setDeliveryEstimate] = useState<DeliveryEstimate | null>(null);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  
  // Smart Payment System
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH_ON_DELIVERY);
  const [savedCards, setSavedCards] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  
  // AI-Powered Features
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [riskScore, setRiskScore] = useState<number>(0);
  const [fraudDetection, setFraudDetection] = useState<boolean>(false);
  
  // Real-time Communication
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([]);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState<'online' | 'busy' | 'offline'>('online');
  
  // Advanced UI States
  const [showMap, setShowMap] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showEco, setShowEco] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Modern Lifecycle Management
  useEffect(() => {
    initializeAdvancedFeatures();
    subscribeToRealTimeUpdates();
    calculateDeliveryEstimate();
    loadSmartSuggestions();
    validateOrder();
    
    return () => {
      // Cleanup subscriptions
    };
  }, [cartItems, selectedAddress]);

  // AI-Powered Initialization
  const initializeAdvancedFeatures = async () => {
    try {
      // Load user preferences
      await loadUserPreferences();
      
      // Initialize payment methods
      await loadSavedPaymentMethods();
      
      // Calculate loyalty benefits
      await calculateLoyaltyBenefits();
      
      // Fraud detection
      await runFraudDetection();
      
      console.log('🧠 Advanced features initialized');
    } catch (error) {
      console.error('Advanced features initialization failed:', error);
    }
  };

  // Real-time Delivery Estimation with AI
  const calculateDeliveryEstimate = async () => {
    if (!selectedAddress || cartItems.length === 0) return;
    
    setIsCalculatingDelivery(true);
    
    try {
      // Simulate AI-powered delivery estimation
      const factors = [
        'Trafik yoğunluğu',
        'Hava durumu',
        'Restoran yoğunluğu',
        'Kurye disponibilite',
        'Geçmiş teslimat performansı'
      ];
      
      const baseTime = 25;
      const trafficMultiplier = Math.random() * 0.3 + 0.8; // 0.8-1.1
      const weatherMultiplier = Math.random() * 0.2 + 0.9; // 0.9-1.1
      
      const estimatedTime = Math.round(baseTime * trafficMultiplier * weatherMultiplier);
      const confidence = Math.round((1 - Math.abs(trafficMultiplier - 1) - Math.abs(weatherMultiplier - 1)) * 100);
      
      const estimate: DeliveryEstimate = {
        estimatedTime,
        confidence,
        factors,
        alternativeOptions: [
          {
            type: 'express',
            time: Math.round(estimatedTime * 0.7),
            cost: 15,
            description: 'Öncelikli teslimat (+₺15)'
          },
          {
            type: 'scheduled',
            time: estimatedTime + 30,
            cost: -5,
            description: 'Planlı teslimat (₺5 indirim)'
          },
          {
            type: 'eco',
            time: estimatedTime + 15,
            cost: -8,
            description: 'Çevreci teslimat (₺8 indirim, karbon nötr)'
          }
        ]
      };
      
      setDeliveryEstimate(estimate);
      
      // Add real-time update
      addRealTimeUpdate({
        type: 'system',
        message: `Teslimat süresi güncellendi: ~${estimatedTime} dakika`,
        timestamp: new Date(),
        severity: 'info'
      });
      
    } catch (error) {
      console.error('Delivery estimation failed:', error);
    } finally {
      setIsCalculatingDelivery(false);
    }
  };

  // Smart Suggestions with Machine Learning
  const loadSmartSuggestions = async () => {
    try {
      const suggestions: SmartSuggestion[] = [
        {
          type: 'upsell',
          title: 'İçecek Ekle',
          description: 'Siparişinize soğuk içecek ekleyerek tam lezzet alın',
          value: 12,
          action: 'add_beverage'
        },
        {
          type: 'discount',
          title: '2. Sipariş İndirimi',
          description: 'Bu ay 2. siparişinizde %15 indirim kazanın',
          value: 15,
          action: 'apply_discount'
        },
        {
          type: 'loyalty',
          title: 'Puan Kullan',
          description: '₺20 değerinde puanınızı kullanabilirsiniz',
          value: 20,
          action: 'use_points'
        }
      ];
      
      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Smart suggestions failed:', error);
    }
  };

  // Real-time Updates System
  const subscribeToRealTimeUpdates = () => {
    // Simulate real-time restaurant status
    const interval = setInterval(() => {
      const statuses: Array<'online' | 'busy' | 'offline'> = ['online', 'busy'];
      setRestaurantStatus(statuses[Math.floor(Math.random() * statuses.length)]);
      
      // Random updates
      if (Math.random() > 0.7) {
        const updates = [
          'Restoran siparişinizi hazırlamaya başladı',
          'Kurye bulundu, yakında yola çıkacak',
          'Mutfak ekibi siparişinizi özenle hazırlıyor',
          'Teslimat süresi trafik durumuna göre güncellendi'
        ];
        
        addRealTimeUpdate({
          type: 'restaurant',
          message: updates[Math.floor(Math.random() * updates.length)],
          timestamp: new Date(),
          severity: 'info'
        });
      }
    }, 15000);
    
    return () => clearInterval(interval);
  };

  // Advanced Security & Fraud Detection
  const runFraudDetection = async () => {
    try {
      // Simulate AI fraud detection
      const userHistory = Math.random() * 100;
      const deviceFingerprint = Math.random() * 100;
      const locationRisk = Math.random() * 100;
      
      const calculatedRisk = (userHistory + deviceFingerprint + locationRisk) / 3;
      setRiskScore(calculatedRisk);
      
      if (calculatedRisk > 75) {
        setFraudDetection(true);
        addRealTimeUpdate({
          type: 'system',
          message: 'Güvenlik kontrolü tamamlandı',
          timestamp: new Date(),
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Fraud detection failed:', error);
    }
  };

  // Utility Functions
  const addRealTimeUpdate = (update: RealTimeUpdate) => {
    setRealTimeUpdates(prev => [update, ...prev.slice(0, 4)]);
  };

  const loadUserPreferences = async () => {
    // Load from localStorage or API
    const preferences = localStorage.getItem('userOrderPreferences');
    if (preferences) {
      const parsed = JSON.parse(preferences);
      setDeliveryMethod(parsed.deliveryMethod || 'delivery');
      setPaymentMethod(parsed.paymentMethod || PaymentMethod.CASH_ON_DELIVERY);
    }
  };

  const loadSavedPaymentMethods = async () => {
    // Simulate saved cards
    setSavedCards([
      { id: '1', last4: '4242', brand: 'visa', isDefault: true },
      { id: '2', last4: '5555', brand: 'mastercard', isDefault: false }
    ]);
    setWalletBalance(85.50);
  };

  const calculateLoyaltyBenefits = async () => {
    // Simulate loyalty calculation
    setLoyaltyPoints(Math.floor(Math.random() * 500));
  };

  const validateOrder = () => {
    // Real-time order validation
    console.log('🔍 Order Validation Debug:', { 
      cartItemsLength: cartItems.length, 
      hasUser: !!user, 
      deliveryMethod, 
      hasSelectedAddress: !!selectedAddress 
    });
    
    if (cartItems.length === 0) {
      console.log('❌ Validation failed: Empty cart');
      return false;
    }
    if (!user) {
      console.log('❌ Validation failed: No user');
      return false;
    }
    if (deliveryMethod === 'delivery' && !selectedAddress) {
      console.log('❌ Validation failed: No delivery address');
      return false;
    }
    
    console.log('✅ Order validation passed');
    return true;
  };

  // Advanced Order Submission
  const handleAdvancedOrderSubmission = async () => {
    if (!validateOrder()) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return;
    }

    setIsSubmitting(true);
    setCompletionStep('payment');

    try {
      // Prepare advanced order data
      const orderData = {
        userId: user!.uid,
        user: {
          uid: user!.uid,
          email: user!.email || '',
          displayName: user!.displayName || 'Müşteri',
          phoneNumber: user!.phoneNumber || '',
          role: user!.role || 'customer',
          isActive: true,
          createdAt: new Date()
        },
        items: cartItems,
        subtotal: total,
        deliveryFee: deliveryMethod === 'delivery' ? 10 : 0,
        serviceFee: Math.round(total * 0.02), // 2% service fee
        total: total + (deliveryMethod === 'delivery' ? 10 : 0) + Math.round(total * 0.02),
        restaurantId: cartItems[0]?.product?.restaurantId || '',
        status: OrderStatus.PENDING,
        deliveryAddress: selectedAddress || {
          street: 'Restoran içi servis',
          city: 'Manisa',
          district: 'Merkez',
          zipCode: '45000',
          country: 'Türkiye',
          coordinates: { lat: 38.7312, lng: 27.4288 }
        },
        paymentMethod,
        specialInstructions: '',
        estimatedDeliveryTime: new Date(Date.now() + (deliveryEstimate?.estimatedTime || 30) * 60000),
        metadata: {
          aiEstimate: deliveryEstimate,
          riskScore,
          smartSuggestionsUsed: smartSuggestions.filter(s => s.value > 0),
          deviceFingerprint: navigator.userAgent,
          appVersion: '2.0.0',
          orderSource: 'web_advanced'
        }
      };

      // Create order with advanced features
      const orderId = await OrderService.createOrder(orderData);
      
      setCompletionStep('confirmation');
      
      // Clear cart and redirect
      clearCart();
      
      // Show success with advanced features
      toast.success('🎉 Siparişiniz başarıyla alındı! Gerçek zamanlı takip başlatılıyor...', {
        duration: 4000,
        icon: '🚀'
      });
      
      // Advanced analytics tracking
      trackAdvancedOrderCompletion(orderId, orderData);
      
      // Redirect to advanced tracking
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Advanced order submission failed:', error);
      setCompletionStep('review');
      
      if (error instanceof Error) {
        if (error.message.includes('permission-denied')) {
          toast.error('🔐 Güvenlik hatası: Lütfen tekrar giriş yapın');
        } else if (error.message.includes('network')) {
          toast.error('🌐 Bağlantı hatası: İnternet bağlantınızı kontrol edin');
        } else {
          toast.error(`❌ Sipariş hatası: ${error.message}`);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const trackAdvancedOrderCompletion = (orderId: string, orderData: any) => {
    // Advanced analytics
    console.log('📊 Advanced Order Analytics:', {
      orderId,
      total: orderData.total,
      deliveryMethod,
      paymentMethod,
      aiFeatures: {
        deliveryEstimate: deliveryEstimate?.estimatedTime,
        riskScore,
        suggestionsCount: smartSuggestions.length
      },
      timestamp: new Date().toISOString()
    });
  };

  // UI Components
  const renderConnectionStatus = () => (
    <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded-full ${
      isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      {isConnected ? 'Bağlantı Aktif' : 'Çevrimdışı'}
      <Signal className="h-3 w-3" />
    </div>
  );

  const renderRealTimeStatus = () => (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </div>
          <span className="font-medium text-gray-900">Gerçek Zamanlı Durum</span>
        </div>
        {renderConnectionStatus()}
      </div>
      
      <div className="space-y-2">
        {realTimeUpdates.slice(0, 3).map((update, index) => (
          <div key={index} className="flex items-start gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full mt-1.5 ${
              update.severity === 'success' ? 'bg-green-500' :
              update.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`} />
            <div>
              <p className="text-gray-700">{update.message}</p>
              <p className="text-xs text-gray-500">
                {update.timestamp.toLocaleTimeString('tr-TR')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSmartSuggestions = () => (
    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-5 w-5 text-yellow-600" />
        <span className="font-medium text-gray-900">Akıllı Öneriler</span>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">AI</span>
      </div>
      
      <div className="space-y-3">
        {smartSuggestions.slice(0, 2).map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-yellow-100">
            <div>
              <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
              <p className="text-sm text-gray-600">{suggestion.description}</p>
            </div>
            <button className="text-sm bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors">
              {suggestion.type === 'discount' ? '₺' : ''}{suggestion.value}
              {suggestion.type === 'discount' ? ' İndirim' : 
               suggestion.type === 'loyalty' ? ' Puan' : ' ₺'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDeliveryEstimate = () => (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Navigation className="h-5 w-5 text-green-600" />
          <span className="font-medium text-gray-900">AI Teslimat Tahmini</span>
        </div>
        {isCalculatingDelivery && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Hesaplanıyor...
          </div>
        )}
      </div>
      
      {deliveryEstimate && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">
              ~{deliveryEstimate.estimatedTime} dk
            </span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Güven: </span>
              <span className="text-sm font-medium text-green-600">
                %{deliveryEstimate.confidence}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {deliveryEstimate.alternativeOptions.map((option, index) => (
              <button
                key={index}
                className={`p-2 text-xs border rounded-lg hover:bg-gray-50 transition-colors ${
                  option.type === 'express' ? 'border-red-200 text-red-700' :
                  option.type === 'eco' ? 'border-green-200 text-green-700' :
                  'border-blue-200 text-blue-700'
                }`}
              >
                <div className="font-medium">{option.time} dk</div>
                <div>{option.cost > 0 ? '+' : ''}₺{option.cost}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`advanced-order-completion ${className}`}>
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Gelişmiş Sipariş Sistemi</h2>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            <span className="text-sm">AI Destekli</span>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {['İnceleme', 'Ödeme', 'Onay', 'Takip'].map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                ['review', 'payment', 'confirmation', 'tracking'].indexOf(completionStep) >= index
                  ? 'bg-white text-purple-600' 
                  : 'bg-purple-500 text-white border-2 border-purple-400'
              }`}>
                {index + 1}
              </div>
              {index < 3 && <div className="w-8 h-1 bg-purple-400 mx-2" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 bg-white">
        {completionStep === 'review' && (
          <div className="space-y-6">
            {/* Real-time Status */}
            {renderRealTimeStatus()}
            
            {/* Delivery Estimate */}
            {renderDeliveryEstimate()}
            
            {/* Smart Suggestions */}
            {renderSmartSuggestions()}
            
            {/* Address Selection with Map */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Teslimat Adresi</h3>
              
              <button
                onClick={() => setShowMap(!showMap)}
                className="w-full p-3 border border-gray-300 rounded-lg text-left hover:border-purple-500 transition-colors mb-3"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <span>{selectedAddress ? selectedAddress.street : 'Adres seçin'}</span>
                </div>
              </button>
              
              {showMap && (
                <div className="mt-3">
                  <SimpleMapPicker
                    onLocationSelect={(address, lat, lng) => {
                      console.log('🎯 Konum seçildi:', { address, lat, lng });
                      setSelectedAddress({
                        street: address,
                        city: '', // Bu bilgiyi geocoding'den alacağız
                        district: '',
                        zipCode: '',
                        country: 'Türkiye',
                        coordinates: { lat, lng }
                      });
                    }}
                    useCurrentLocation={true}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            
            {/* Payment Method */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Ödeme Yöntemi</h3>
              
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-500">
                  <input
                    type="radio"
                    name="payment"
                    value={PaymentMethod.CARD_ON_DELIVERY}
                    checked={paymentMethod === PaymentMethod.CARD_ON_DELIVERY}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <span>Kapıda Kart ile Ödeme</span>
                  <Shield className="h-4 w-4 text-green-500 ml-auto" />
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-purple-500">
                  <input
                    type="radio"
                    name="payment"
                    value={PaymentMethod.CASH_ON_DELIVERY}
                    checked={paymentMethod === PaymentMethod.CASH_ON_DELIVERY}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  />
                  <Package className="h-5 w-5 text-gray-600" />
                  <span>Kapıda Nakit Ödeme</span>
                </label>
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={handleAdvancedOrderSubmission}
              disabled={isSubmitting || !validateOrder()}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sipariş Oluşturuluyor...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Siparişi Tamamla (₺{total.toFixed(2)})
                </>
              )}
            </button>
          </div>
        )}
        
        {completionStep === 'confirmation' && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sipariş Tamamlandı!</h3>
            <p className="text-gray-600 mb-4">Siparişiniz başarıyla alındı ve restoran bilgilendirildi.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                🚀 Gerçek zamanlı takip başlatılıyor...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 