import { 
  EmailType, 
  WelcomeEmailData, 
  OrderEmailData, 
  RestaurantApplicationEmailData, 
  FinancialReportEmailData 
} from '@/types';

// Client-side Email API Service
export class EmailService {
  // Base API call method - only for client-side
  private static async callEmailAPI(endpoint: string, data: any): Promise<boolean> {
    try {
      // Always use API route on client-side
      const response = await fetch(`/api/email/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return response.ok;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  // Public methods - use API calls
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    return this.callEmailAPI('welcome', data);
  }

  static async sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
    return this.callEmailAPI('order-confirmation', data);
  }

  static async sendOrderStatusUpdateEmail(data: OrderEmailData): Promise<boolean> {
    return this.callEmailAPI('order-status', data);
  }

  static async sendRestaurantApplicationEmail(data: RestaurantApplicationEmailData): Promise<boolean> {
    return this.callEmailAPI('restaurant-application', data);
  }

  static async sendFinancialReportEmail(data: FinancialReportEmailData): Promise<boolean> {
    return this.callEmailAPI('financial-report', data);
  }
} 