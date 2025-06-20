import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getSalesAnalytics, getCustomerAnalytics, getDashboardStats } from './analyticsService';
import { getDetailedSalesReport, getCustomerBehaviorReport, getProductPerformanceReport, getFinancialReport } from './reportService';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// E-posta rapor tipleri
export enum EmailReportType {
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary',
  MONTHLY_SUMMARY = 'monthly_summary',
  SALES_REPORT = 'sales_report',
  CUSTOMER_REPORT = 'customer_report',
  PRODUCT_REPORT = 'product_report',
  FINANCIAL_REPORT = 'financial_report',
  CUSTOM_REPORT = 'custom_report'
}

export enum EmailReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly'
}

export enum EmailReportStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DISABLED = 'disabled'
}

export interface EmailReportSubscription {
  id: string;
  name: string;
  description: string;
  type: EmailReportType;
  frequency: EmailReportFrequency;
  recipients: string[]; // E-posta adresleri
  status: EmailReportStatus;
  lastSent?: Date;
  nextSend: Date;
  includeCharts: boolean;
  customFilters?: {
    dateRange?: number; // Gün sayısı
    categories?: string[];
    paymentMethods?: string[];
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailReportTemplate {
  type: EmailReportType;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
}

export interface EmailReportLog {
  id: string;
  subscriptionId: string;
  recipients: string[];
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  sentAt?: Date;
  error?: string;
  reportData: any;
}

// E-posta rapor aboneliği oluştur
export const createEmailReportSubscription = async (
  subscriptionData: Omit<EmailReportSubscription, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'email_report_subscriptions'), {
      ...subscriptionData,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
      nextSend: Timestamp.fromDate(subscriptionData.nextSend),
      lastSent: subscriptionData.lastSent ? Timestamp.fromDate(subscriptionData.lastSent) : null
    });
    return docRef.id;
  } catch (error) {
    console.error('E-posta rapor aboneliği oluşturulurken hata:', error);
    throw error;
  }
};

// E-posta rapor aboneliklerini getir
export const getEmailReportSubscriptions = async (status?: EmailReportStatus): Promise<EmailReportSubscription[]> => {
  try {
    let subscriptionsQuery = query(collection(db, 'email_report_subscriptions'), orderBy('createdAt', 'desc'));
    
    if (status) {
      subscriptionsQuery = query(
        collection(db, 'email_report_subscriptions'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
    }

    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    const subscriptions: EmailReportSubscription[] = [];

    subscriptionsSnapshot.forEach((doc) => {
      const data = doc.data();
      subscriptions.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        type: data.type,
        frequency: data.frequency,
        recipients: data.recipients || [],
        status: data.status,
        lastSent: data.lastSent?.toDate(),
        nextSend: data.nextSend?.toDate() || new Date(),
        includeCharts: data.includeCharts || false,
        customFilters: data.customFilters,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });

    return subscriptions;
  } catch (error) {
    console.error('E-posta rapor abonelikleri getirilirken hata:', error);
    throw error;
  }
};

// E-posta rapor aboneliğini güncelle
export const updateEmailReportSubscription = async (
  subscriptionId: string, 
  updates: Partial<EmailReportSubscription>
): Promise<void> => {
  try {
    const subscriptionRef = doc(db, 'email_report_subscriptions', subscriptionId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };

    if (updates.nextSend) {
      updateData.nextSend = Timestamp.fromDate(updates.nextSend);
    }
    if (updates.lastSent) {
      updateData.lastSent = Timestamp.fromDate(updates.lastSent);
    }

    await updateDoc(subscriptionRef, updateData);
  } catch (error) {
    console.error('E-posta rapor aboneliği güncellenirken hata:', error);
    throw error;
  }
};

// E-posta rapor aboneliğini sil
export const deleteEmailReportSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'email_report_subscriptions', subscriptionId));
  } catch (error) {
    console.error('E-posta rapor aboneliği silinirken hata:', error);
    throw error;
  }
};

// Rapor verilerini hazırla
export const prepareReportData = async (subscription: EmailReportSubscription): Promise<any> => {
  try {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    // Tarih aralığını belirle
    switch (subscription.frequency) {
      case EmailReportFrequency.DAILY:
        startDate = subDays(now, 1);
        break;
      case EmailReportFrequency.WEEKLY:
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case EmailReportFrequency.MONTHLY:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      default:
        startDate = subDays(now, subscription.customFilters?.dateRange || 7);
    }

    // Rapor tipine göre veri hazırla
    switch (subscription.type) {
      case EmailReportType.DAILY_SUMMARY:
      case EmailReportType.WEEKLY_SUMMARY:
      case EmailReportType.MONTHLY_SUMMARY:
        const [salesData, customerData, dashboardData] = await Promise.all([
          getSalesAnalytics(startDate, endDate),
          getCustomerAnalytics(),
          getDashboardStats()
        ]);
        return { salesData, customerData, dashboardData, period: { startDate, endDate } };

      case EmailReportType.SALES_REPORT:
        const detailedSalesReport = await getDetailedSalesReport(startDate, endDate);
        return { detailedSalesReport, period: { startDate, endDate } };

      case EmailReportType.CUSTOMER_REPORT:
        const customerBehaviorReport = await getCustomerBehaviorReport(startDate, endDate);
        return { customerBehaviorReport, period: { startDate, endDate } };

      case EmailReportType.PRODUCT_REPORT:
        const productPerformanceReport = await getProductPerformanceReport(startDate, endDate);
        return { productPerformanceReport, period: { startDate, endDate } };

      case EmailReportType.FINANCIAL_REPORT:
        const financialReport = await getFinancialReport(startDate, endDate);
        return { financialReport, period: { startDate, endDate } };

      default:
        throw new Error('Desteklenmeyen rapor tipi');
    }
  } catch (error) {
    console.error('Rapor verileri hazırlanırken hata:', error);
    throw error;
  }
};

// E-posta şablonları
export const getEmailTemplate = (type: EmailReportType): EmailReportTemplate => {
  const templates: Record<EmailReportType, EmailReportTemplate> = {
    [EmailReportType.DAILY_SUMMARY]: {
      type: EmailReportType.DAILY_SUMMARY,
      subject: 'NeYisek.com - Günlük Özet Raporu - {{date}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">NeYisek.com Günlük Özet</h1>
          <p>Tarih: {{date}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Günlük İstatistikler</h2>
            <ul>
              <li><strong>Bugünkü Gelir:</strong> ₺{{todayRevenue}}</li>
              <li><strong>Bugünkü Siparişler:</strong> {{todayOrders}}</li>
              <li><strong>Bekleyen Siparişler:</strong> {{pendingOrders}}</li>
              <li><strong>Toplam Müşteri:</strong> {{totalCustomers}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Satış Performansı</h2>
            <ul>
              <li><strong>Toplam Gelir:</strong> ₺{{totalRevenue}}</li>
              <li><strong>Toplam Sipariş:</strong> {{totalOrders}}</li>
              <li><strong>Ortalama Sipariş Değeri:</strong> ₺{{averageOrderValue}}</li>
              <li><strong>Tamamlanma Oranı:</strong> %{{completionRate}}</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Günlük Özet - {{date}}
        
        Günlük İstatistikler:
        - Bugünkü Gelir: ₺{{todayRevenue}}
        - Bugünkü Siparişler: {{todayOrders}}
        - Bekleyen Siparişler: {{pendingOrders}}
        - Toplam Müşteri: {{totalCustomers}}
        
        Satış Performansı:
        - Toplam Gelir: ₺{{totalRevenue}}
        - Toplam Sipariş: {{totalOrders}}
        - Ortalama Sipariş Değeri: ₺{{averageOrderValue}}
        - Tamamlanma Oranı: %{{completionRate}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.WEEKLY_SUMMARY]: {
      type: EmailReportType.WEEKLY_SUMMARY,
      subject: 'NeYisek.com - Haftalık Özet Raporu - {{dateRange}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">NeYisek.com Haftalık Özet</h1>
          <p>Dönem: {{dateRange}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Haftalık Performans</h2>
            <ul>
              <li><strong>Toplam Gelir:</strong> ₺{{totalRevenue}}</li>
              <li><strong>Toplam Sipariş:</strong> {{totalOrders}}</li>
              <li><strong>Yeni Müşteriler:</strong> {{newCustomers}}</li>
              <li><strong>Ortalama Sipariş Değeri:</strong> ₺{{averageOrderValue}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Müşteri Analizleri</h2>
            <ul>
              <li><strong>Aktif Müşteriler:</strong> {{activeCustomers}}</li>
              <li><strong>VIP Müşteriler:</strong> {{vipCustomers}}</li>
              <li><strong>Müşteri Memnuniyeti:</strong> %{{customerSatisfaction}}</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Haftalık Özet - {{dateRange}}
        
        Haftalık Performans:
        - Toplam Gelir: ₺{{totalRevenue}}
        - Toplam Sipariş: {{totalOrders}}
        - Yeni Müşteriler: {{newCustomers}}
        - Ortalama Sipariş Değeri: ₺{{averageOrderValue}}
        
        Müşteri Analizleri:
        - Aktif Müşteriler: {{activeCustomers}}
        - VIP Müşteriler: {{vipCustomers}}
        - Müşteri Memnuniyeti: %{{customerSatisfaction}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.MONTHLY_SUMMARY]: {
      type: EmailReportType.MONTHLY_SUMMARY,
      subject: 'NeYisek.com - Aylık Özet Raporu - {{month}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">NeYisek.com Aylık Özet</h1>
          <p>Ay: {{month}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Aylık Performans</h2>
            <ul>
              <li><strong>Toplam Gelir:</strong> ₺{{totalRevenue}} ({{revenueGrowth}}% büyüme)</li>
              <li><strong>Toplam Sipariş:</strong> {{totalOrders}} ({{orderGrowth}}% büyüme)</li>
              <li><strong>Yeni Müşteriler:</strong> {{newCustomers}}</li>
              <li><strong>Müşteri Tutma Oranı:</strong> %{{retentionRate}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>En İyi Performans</h2>
            <ul>
              <li><strong>En Çok Satan Ürün:</strong> {{topProduct}}</li>
              <li><strong>En Değerli Müşteri:</strong> {{topCustomer}}</li>
              <li><strong>En Başarılı Gün:</strong> {{bestDay}}</li>
            </ul>
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Aylık Özet - {{month}}
        
        Aylık Performans:
        - Toplam Gelir: ₺{{totalRevenue}} ({{revenueGrowth}}% büyüme)
        - Toplam Sipariş: {{totalOrders}} ({{orderGrowth}}% büyüme)
        - Yeni Müşteriler: {{newCustomers}}
        - Müşteri Tutma Oranı: %{{retentionRate}}
        
        En İyi Performans:
        - En Çok Satan Ürün: {{topProduct}}
        - En Değerli Müşteri: {{topCustomer}}
        - En Başarılı Gün: {{bestDay}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.SALES_REPORT]: {
      type: EmailReportType.SALES_REPORT,
      subject: 'NeYisek.com - Detaylı Satış Raporu - {{dateRange}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Detaylı Satış Raporu</h1>
          <p>Dönem: {{dateRange}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Satış Özeti</h2>
            <ul>
              <li><strong>Toplam Gelir:</strong> ₺{{totalRevenue}}</li>
              <li><strong>Toplam Sipariş:</strong> {{totalOrders}}</li>
              <li><strong>Ortalama Sipariş Değeri:</strong> ₺{{averageOrderValue}}</li>
              <li><strong>Tamamlanma Oranı:</strong> %{{completionRate}}</li>
              <li><strong>İptal Oranı:</strong> %{{cancellationRate}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Ödeme Yöntemleri</h2>
            {{#paymentMethods}}
            <p><strong>{{method}}:</strong> {{count}} sipariş (₺{{revenue}})</p>
            {{/paymentMethods}}
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>En Çok Satan Saatler</h2>
            {{#topHours}}
            <p><strong>{{hour}}:00:</strong> {{orders}} sipariş (₺{{revenue}})</p>
            {{/topHours}}
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Detaylı Satış Raporu - {{dateRange}}
        
        Satış Özeti:
        - Toplam Gelir: ₺{{totalRevenue}}
        - Toplam Sipariş: {{totalOrders}}
        - Ortalama Sipariş Değeri: ₺{{averageOrderValue}}
        - Tamamlanma Oranı: %{{completionRate}}
        - İptal Oranı: %{{cancellationRate}}
        
        Ödeme Yöntemleri:
        {{#paymentMethods}}
        - {{method}}: {{count}} sipariş (₺{{revenue}})
        {{/paymentMethods}}
        
        En Çok Satan Saatler:
        {{#topHours}}
        - {{hour}}:00: {{orders}} sipariş (₺{{revenue}})
        {{/topHours}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.CUSTOMER_REPORT]: {
      type: EmailReportType.CUSTOMER_REPORT,
      subject: 'NeYisek.com - Müşteri Davranış Raporu - {{dateRange}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Müşteri Davranış Raporu</h1>
          <p>Dönem: {{dateRange}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Müşteri Özeti</h2>
            <ul>
              <li><strong>Toplam Müşteri:</strong> {{totalCustomers}}</li>
              <li><strong>Yeni Müşteriler:</strong> {{newCustomers}}</li>
              <li><strong>Geri Dönen Müşteriler:</strong> {{returningCustomers}}</li>
              <li><strong>Müşteri Tutma Oranı:</strong> %{{retentionRate}}</li>
              <li><strong>Müşteri Yaşam Boyu Değeri:</strong> ₺{{lifetimeValue}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Müşteri Segmentleri</h2>
            {{#segments}}
            <p><strong>{{segment}}:</strong> {{count}} müşteri (₺{{revenue}})</p>
            {{/segments}}
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Müşteri Davranış Raporu - {{dateRange}}
        
        Müşteri Özeti:
        - Toplam Müşteri: {{totalCustomers}}
        - Yeni Müşteriler: {{newCustomers}}
        - Geri Dönen Müşteriler: {{returningCustomers}}
        - Müşteri Tutma Oranı: %{{retentionRate}}
        - Müşteri Yaşam Boyu Değeri: ₺{{lifetimeValue}}
        
        Müşteri Segmentleri:
        {{#segments}}
        - {{segment}}: {{count}} müşteri (₺{{revenue}})
        {{/segments}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.PRODUCT_REPORT]: {
      type: EmailReportType.PRODUCT_REPORT,
      subject: 'NeYisek.com - Ürün Performans Raporu - {{dateRange}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Ürün Performans Raporu</h1>
          <p>Dönem: {{dateRange}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Ürün Özeti</h2>
            <ul>
              <li><strong>Toplam Ürün:</strong> {{totalProducts}}</li>
              <li><strong>Aktif Ürün:</strong> {{activeProducts}}</li>
              <li><strong>En Çok Satan Ürün:</strong> {{topProduct}}</li>
              <li><strong>En Karlı Kategori:</strong> {{topCategory}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>En İyi 5 Ürün</h2>
            {{#topProducts}}
            <p><strong>{{name}}:</strong> {{quantity}} adet (₺{{revenue}})</p>
            {{/topProducts}}
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Ürün Performans Raporu - {{dateRange}}
        
        Ürün Özeti:
        - Toplam Ürün: {{totalProducts}}
        - Aktif Ürün: {{activeProducts}}
        - En Çok Satan Ürün: {{topProduct}}
        - En Karlı Kategori: {{topCategory}}
        
        En İyi 5 Ürün:
        {{#topProducts}}
        - {{name}}: {{quantity}} adet (₺{{revenue}})
        {{/topProducts}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.FINANCIAL_REPORT]: {
      type: EmailReportType.FINANCIAL_REPORT,
      subject: 'NeYisek.com - Mali Rapor - {{dateRange}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">Mali Rapor</h1>
          <p>Dönem: {{dateRange}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Mali Özet</h2>
            <ul>
              <li><strong>Toplam Gelir:</strong> ₺{{totalRevenue}}</li>
              <li><strong>Toplam Maliyet:</strong> ₺{{totalCosts}}</li>
              <li><strong>Brüt Kar:</strong> ₺{{grossProfit}}</li>
              <li><strong>Net Kar:</strong> ₺{{netProfit}}</li>
              <li><strong>Kar Marjı:</strong> %{{profitMargin}}</li>
              <li><strong>Gelir Büyümesi:</strong> %{{revenueGrowth}}</li>
            </ul>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>Maliyet Dağılımı</h2>
            {{#costBreakdown}}
            <p><strong>{{category}}:</strong> ₺{{amount}} (%{{percentage}})</p>
            {{/costBreakdown}}
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        NeYisek.com Mali Rapor - {{dateRange}}
        
        Mali Özet:
        - Toplam Gelir: ₺{{totalRevenue}}
        - Toplam Maliyet: ₺{{totalCosts}}
        - Brüt Kar: ₺{{grossProfit}}
        - Net Kar: ₺{{netProfit}}
        - Kar Marjı: %{{profitMargin}}
        - Gelir Büyümesi: %{{revenueGrowth}}
        
        Maliyet Dağılımı:
        {{#costBreakdown}}
        - {{category}}: ₺{{amount}} (%{{percentage}})
        {{/costBreakdown}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    },
    [EmailReportType.CUSTOM_REPORT]: {
      type: EmailReportType.CUSTOM_REPORT,
      subject: 'NeYisek.com - Özel Rapor - {{title}}',
      htmlTemplate: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #10b981;">{{title}}</h1>
          <p>{{description}}</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            {{content}}
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">
            Bu rapor otomatik olarak oluşturulmuştur. NeYisek.com Admin Paneli
          </p>
        </div>
      `,
      textTemplate: `
        {{title}}
        
        {{description}}
        
        {{content}}
        
        Bu rapor otomatik olarak oluşturulmuştur.
      `
    }
  };

  return templates[type];
};

// Şablon verilerini işle
export const processTemplate = (template: string, data: any): string => {
  let processedTemplate = template;
  
  // Basit şablon değişkeni değiştirme
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedTemplate = processedTemplate.replace(regex, data[key] || '');
  });
  
  return processedTemplate;
};

// E-posta gönderme simülasyonu (gerçek implementasyon için e-posta servisi gerekli)
export const sendEmailReport = async (
  subscription: EmailReportSubscription,
  reportData: any
): Promise<void> => {
  try {
    const template = getEmailTemplate(subscription.type);
    
    // Şablon verilerini hazırla
    const templateData = {
      date: format(new Date(), 'dd/MM/yyyy'),
      dateRange: `${format(reportData.period.startDate, 'dd/MM/yyyy')} - ${format(reportData.period.endDate, 'dd/MM/yyyy')}`,
      month: format(new Date(), 'MMMM yyyy'),
      ...reportData
    };
    
    const subject = processTemplate(template.subject, templateData);
    const htmlContent = processTemplate(template.htmlTemplate, templateData);
    const textContent = processTemplate(template.textTemplate, templateData);
    
    // E-posta gönderme simülasyonu
    console.log('E-posta gönderiliyor:', {
      to: subscription.recipients,
      subject,
      html: htmlContent,
      text: textContent
    });
    
    // E-posta log kaydı oluştur
    await addDoc(collection(db, 'email_report_logs'), {
      subscriptionId: subscription.id,
      recipients: subscription.recipients,
      subject,
      status: 'sent',
      sentAt: Timestamp.fromDate(new Date()),
      reportData: templateData
    });
    
    // Abonelik güncelle
    await updateEmailReportSubscription(subscription.id, {
      lastSent: new Date(),
      nextSend: calculateNextSendDate(subscription.frequency)
    });
    
  } catch (error) {
    console.error('E-posta gönderilirken hata:', error);
    
    // Hata log kaydı oluştur
    await addDoc(collection(db, 'email_report_logs'), {
      subscriptionId: subscription.id,
      recipients: subscription.recipients,
      subject: 'Rapor gönderimi başarısız',
      status: 'failed',
      sentAt: Timestamp.fromDate(new Date()),
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      reportData: reportData
    });
    
    throw error;
  }
};

// Sonraki gönderim tarihini hesapla
const calculateNextSendDate = (frequency: EmailReportFrequency): Date => {
  const now = new Date();
  
  switch (frequency) {
    case EmailReportFrequency.DAILY:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 gün sonra
    case EmailReportFrequency.WEEKLY:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 hafta sonra
    case EmailReportFrequency.MONTHLY:
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    case EmailReportFrequency.QUARTERLY:
      const nextQuarter = new Date(now);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      return nextQuarter;
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
};

// Gönderilmesi gereken raporları kontrol et
export const checkPendingReports = async (): Promise<void> => {
  try {
    const now = new Date();
    const activeSubscriptions = await getEmailReportSubscriptions(EmailReportStatus.ACTIVE);
    
    for (const subscription of activeSubscriptions) {
      if (subscription.nextSend <= now) {
        try {
          const reportData = await prepareReportData(subscription);
          await sendEmailReport(subscription, reportData);
          console.log(`Rapor gönderildi: ${subscription.name}`);
        } catch (error) {
          console.error(`Rapor gönderilirken hata (${subscription.name}):`, error);
        }
      }
    }
  } catch (error) {
    console.error('Bekleyen raporlar kontrol edilirken hata:', error);
    throw error;
  }
};

// E-posta rapor loglarını getir
export const getEmailReportLogs = async (subscriptionId?: string): Promise<EmailReportLog[]> => {
  try {
    let logsQuery = query(collection(db, 'email_report_logs'), orderBy('sentAt', 'desc'));
    
    if (subscriptionId) {
      logsQuery = query(
        collection(db, 'email_report_logs'),
        where('subscriptionId', '==', subscriptionId),
        orderBy('sentAt', 'desc')
      );
    }

    const logsSnapshot = await getDocs(logsQuery);
    const logs: EmailReportLog[] = [];

    logsSnapshot.forEach((doc) => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        subscriptionId: data.subscriptionId,
        recipients: data.recipients || [],
        subject: data.subject,
        status: data.status,
        sentAt: data.sentAt?.toDate(),
        error: data.error,
        reportData: data.reportData
      });
    });

    return logs;
  } catch (error) {
    console.error('E-posta rapor logları getirilirken hata:', error);
    throw error;
  }
}; 