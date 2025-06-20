import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

// PDF raporları için tip tanımları
export interface ReportData {
  title: string;
  subtitle: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    [key: string]: string | number;
  };
  tableData?: {
    headers: string[];
    rows: (string | number)[][];
  };
  chartData?: any;
}

export interface UserReportData {
  totalUsers: number;
  onlineUsers: number;
  newUsersThisMonth: number;
  usersByRole: {
    customers: number;
    restaurants: number;
    admins: number;
  };
  users: Array<{
    displayName: string;
    email: string;
    role: string;
    isOnline: boolean;
    lastSeen: string;
    createdAt: string;
  }>;
}

export interface RestaurantReportData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  commission: number;
  netEarnings: number;
  orders: Array<{
    id: string;
    date: string;
    total: string;
    status: string;
    paymentMethod: string;
  }>;
  dailyStats: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
}

export class ReportService {
  // PDF için Türkçe font ayarları
  private static setupPDF(): jsPDF {
    const doc = new jsPDF();
    
    // Başlık için font boyutu
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    
    return doc;
  }

  // Ortak başlık ekleme
  private static addHeader(doc: jsPDF, title: string, subtitle: string): number {
    let yPosition = 20;
    
    // Logo placeholder (varsa logo eklenebilir)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NeYisek.com', 20, yPosition);
    
    // Başlık
    yPosition += 20;
    doc.setFontSize(16);
    doc.text(title, 20, yPosition);
    
    // Alt başlık
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, yPosition);
    
    // Tarih
    yPosition += 10;
    doc.setFontSize(10);
    doc.text(`Rapor Tarihi: ${format(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}`, 20, yPosition);
    
    // Çizgi
    yPosition += 10;
    doc.line(20, yPosition, 190, yPosition);
    
    return yPosition + 10;
  }

  // Özet bilgileri ekleme
  private static addSummary(doc: jsPDF, summary: { [key: string]: string | number }, startY: number): number {
    let yPosition = startY;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ÖZET', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    Object.entries(summary).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 25, yPosition);
      yPosition += 7;
    });
    
    return yPosition + 10;
  }

  // Kullanıcı yönetimi raporu
  static generateUserReport(data: UserReportData): void {
    const doc = this.setupPDF();
    
    // Başlık
    let yPosition = this.addHeader(
      doc, 
      'Kullanıcı Yönetimi Raporu',
      'Sistemdeki kullanıcıların detaylı analizi'
    );
    
    // Özet bilgileri
    const summary = {
      'Toplam Kullanıcı': data.totalUsers.toLocaleString('tr-TR'),
      'Online Kullanıcı': data.onlineUsers.toLocaleString('tr-TR'),
      'Bu Ay Yeni': data.newUsersThisMonth.toLocaleString('tr-TR'),
      'Müşteri': data.usersByRole.customers.toLocaleString('tr-TR'),
      'Restoran': data.usersByRole.restaurants.toLocaleString('tr-TR'),
      'Yönetici': data.usersByRole.admins.toLocaleString('tr-TR')
    };
    
    yPosition = this.addSummary(doc, summary, yPosition);
    
    // Kullanıcı tablosu
    if (data.users && data.users.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('KULLANICI LİSTESİ', 20, yPosition);
      yPosition += 10;
      
      const tableData = data.users.map(user => [
        user.displayName,
        user.email,
        user.role === 'customer' ? 'Müşteri' : 
        user.role === 'restaurant' ? 'Restoran' : 'Yönetici',
        user.isOnline ? 'Online' : 'Offline',
        user.lastSeen,
        user.createdAt
      ]);
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [['İsim', 'E-posta', 'Rol', 'Durum', 'Son Görülme', 'Kayıt Tarihi']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // PDF'i indir
    doc.save(`kullanici-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // Restoran mali raporu
  static generateRestaurantFinancialReport(
    restaurantName: string, 
    data: RestaurantReportData,
    dateRange: { start: Date; end: Date }
  ): void {
    const doc = this.setupPDF();
    
    // Başlık
    let yPosition = this.addHeader(
      doc, 
      `${restaurantName} - Mali Rapor`,
      `${format(dateRange.start, 'dd MMM yyyy', { locale: tr })} - ${format(dateRange.end, 'dd MMM yyyy', { locale: tr })}`
    );
    
    // Mali özet
    const summary = {
      'Toplam Sipariş': data.totalOrders.toLocaleString('tr-TR'),
      'Toplam Gelir': `₺${data.totalRevenue.toLocaleString('tr-TR')}`,
      'Ortalama Sipariş Değeri': `₺${data.averageOrderValue.toLocaleString('tr-TR')}`,
      'Platform Komisyonu': `₺${data.commission.toLocaleString('tr-TR')}`,
      'Net Kazanç': `₺${data.netEarnings.toLocaleString('tr-TR')}`
    };
    
    yPosition = this.addSummary(doc, summary, yPosition);
    
    // Sipariş tablosu
    if (data.orders && data.orders.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SİPARİŞ DETAYLARI', 20, yPosition);
      yPosition += 10;
      
      const tableData = data.orders.map(order => [
        order.id,
        order.date,
        order.total,
        order.status === 'delivered' ? 'Teslim Edildi' :
        order.status === 'pending' ? 'Bekliyor' :
        order.status === 'preparing' ? 'Hazırlanıyor' : order.status,
        order.paymentMethod === 'cash' ? 'Nakit' :
        order.paymentMethod === 'card' ? 'Kart' : 'Online'
      ]);
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Sipariş ID', 'Tarih', 'Tutar', 'Durum', 'Ödeme']],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // Yeni sayfa - günlük istatistikler
    if (data.dailyStats && data.dailyStats.length > 0) {
      doc.addPage();
      yPosition = 30;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('GÜNLÜK İSTATİSTİKLER', 20, yPosition);
      yPosition += 10;
      
      const dailyTableData = data.dailyStats.map(day => [
        day.date,
        day.orders.toString(),
        `₺${day.revenue.toLocaleString('tr-TR')}`
      ]);
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Tarih', 'Sipariş Sayısı', 'Gelir']],
        body: dailyTableData,
        styles: {
          fontSize: 9,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [39, 174, 96],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // PDF'i indir
    doc.save(`${restaurantName.toLowerCase().replace(/\s+/g, '-')}-mali-rapor-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // Admin genel raporu
  static generateAdminDashboardReport(data: {
    totalUsers: number;
    totalRestaurants: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    monthlyStats: Array<{
      month: string;
      users: number;
      orders: number;
      revenue: number;
    }>;
    topRestaurants: Array<{
      name: string;
      orders: number;
      revenue: number;
    }>;
  }): void {
    const doc = this.setupPDF();
    
    // Başlık
    let yPosition = this.addHeader(
      doc, 
      'Admin Dashboard Raporu',
      'Platform geneli istatistikler ve analitikler'
    );
    
    // Genel özet
    const summary = {
      'Toplam Kullanıcı': data.totalUsers.toLocaleString('tr-TR'),
      'Toplam Restoran': data.totalRestaurants.toLocaleString('tr-TR'),
      'Toplam Sipariş': data.totalOrders.toLocaleString('tr-TR'),
      'Toplam Gelir': `₺${data.totalRevenue.toLocaleString('tr-TR')}`,
      'Toplam Komisyon': `₺${data.totalCommission.toLocaleString('tr-TR')}`
    };
    
    yPosition = this.addSummary(doc, summary, yPosition);
    
    // En iyi restoranlar
    if (data.topRestaurants && data.topRestaurants.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EN İYİ PERFORMANS GÖSTEREN RESTORANLAR', 20, yPosition);
      yPosition += 10;
      
      const restaurantTableData = data.topRestaurants.map(restaurant => [
        restaurant.name,
        restaurant.orders.toLocaleString('tr-TR'),
        `₺${restaurant.revenue.toLocaleString('tr-TR')}`
      ]);
      
      (doc as any).autoTable({
        startY: yPosition,
        head: [['Restoran Adı', 'Sipariş Sayısı', 'Gelir']],
        body: restaurantTableData,
        styles: {
          fontSize: 10,
          cellPadding: 4
        },
        headStyles: {
          fillColor: [231, 76, 60],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 20, right: 20 }
      });
    }
    
    // PDF'i indir
    doc.save(`admin-dashboard-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  // Sipariş detay raporu
  static generateOrderReport(orders: Array<{
    id: string;
    customerName: string;
    restaurantName: string;
    date: string;
    status: string;
    total: number;
    paymentMethod: string;
    items: Array<{ name: string; quantity: number; price: number }>;
  }>): void {
    const doc = this.setupPDF();
    
    // Başlık
    let yPosition = this.addHeader(
      doc, 
      'Sipariş Detay Raporu',
      `Toplam ${orders.length} sipariş`
    );
    
    // Sipariş tablosu
    const tableData = orders.map(order => [
      order.id,
      order.customerName,
      order.restaurantName,
      order.date,
      order.status === 'delivered' ? 'Teslim Edildi' :
      order.status === 'pending' ? 'Bekliyor' :
      order.status === 'preparing' ? 'Hazırlanıyor' : order.status,
      `₺${order.total.toLocaleString('tr-TR')}`,
      order.paymentMethod === 'cash' ? 'Nakit' :
      order.paymentMethod === 'card' ? 'Kart' : 'Online'
    ]);
    
    (doc as any).autoTable({
      startY: yPosition,
      head: [['Sipariş ID', 'Müşteri', 'Restoran', 'Tarih', 'Durum', 'Tutar', 'Ödeme']],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 20, right: 20 }
    });
    
    // PDF'i indir
    doc.save(`siparis-raporu-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }
} 