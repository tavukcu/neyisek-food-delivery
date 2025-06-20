import { useState } from 'react';
import toast from 'react-hot-toast';

interface EmailApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export function useEmailService() {
  const [loading, setLoading] = useState(false);

  const callEmailAPI = async (endpoint: string, data: any): Promise<boolean> => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/email/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        toast.success('E-posta başarıyla gönderildi');
        return true;
      } else {
        toast.error('E-posta gönderilirken hata oluştu');
        return false;
      }
    } catch (error) {
      console.error('E-posta gönderme hatası:', error);
      toast.error('E-posta servisi ile bağlantı kurulamadı');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Hoş geldin e-postası gönder
  const sendWelcomeEmail = async (userName: string, userEmail: string) => {
    return callEmailAPI('welcome', { userName, userEmail });
  };

  // Sipariş onay e-postası gönder
  const sendOrderConfirmationEmail = async (orderData: any) => {
    return callEmailAPI('order-confirmation', orderData);
  };

  // Sipariş durumu güncelleme e-postası gönder
  const sendOrderStatusUpdateEmail = async (orderData: any) => {
    return callEmailAPI('order-status', orderData);
  };

  // Restoran başvuru durumu e-postası gönder
  const sendRestaurantApplicationEmail = async (applicationData: any) => {
    return callEmailAPI('restaurant-application', applicationData);
  };

  // Mali rapor e-postası gönder
  const sendFinancialReportEmail = async (reportData: any) => {
    return callEmailAPI('financial-report', reportData);
  };

  return {
    loading,
    sendWelcomeEmail,
    sendOrderConfirmationEmail,
    sendOrderStatusUpdateEmail,
    sendRestaurantApplicationEmail,
    sendFinancialReportEmail
  };
} 