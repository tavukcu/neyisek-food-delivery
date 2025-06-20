import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { OrderEmailData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: OrderEmailData = await request.json();

    // Development mode - just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Order confirmation email would be sent to:', data.customerEmail);
      console.log('📧 [DEV MODE] Order ID:', data.orderId);
      return NextResponse.json({ 
        success: true, 
        message: 'Development mode - email logged instead of sent' 
      });
    }

    // Production mode - send actual email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Generate HTML content
    const html = generateOrderConfirmationHTML(data);

    // Send email
    const mailOptions = {
      from: `"NeYisek.com" <${process.env.EMAIL_USER}>`,
      to: data.customerEmail,
      subject: `✅ Siparişiniz Alındı - #${data.orderId.slice(-8)}`,
      html
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order confirmation email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
}

function generateOrderConfirmationHTML(data: OrderEmailData): string {
  const itemsHTML = data.orderItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 5px; overflow: hidden; }
      .order-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
      .total { background: #43e97b; color: white; font-weight: bold; padding: 12px; text-align: right; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✅ Siparişiniz Alındı!</h1>
        <p>Sipariş No: #${data.orderId.slice(-8)}</p>
      </div>
      <div class="content">
        <h2>Merhaba ${data.customerName}!</h2>
        <p><strong>${data.restaurantName}</strong> restoranından verdiğiniz sipariş başarıyla alındı ve hazırlanmaya başlandı.</p>
        
        <table class="order-table">
          <thead>
            <tr>
              <th>Ürün</th>
              <th style="text-align: center;">Adet</th>
              <th style="text-align: right;">Fiyat</th>
              <th style="text-align: right;">Toplam</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
            <tr class="total">
              <td colspan="3">Toplam Tutar:</td>
              <td style="text-align: right;">${formatCurrency(data.total)}</td>
            </tr>
          </tbody>
        </table>
        
        ${data.estimatedDelivery ? `<p><strong>Tahmini Teslimat:</strong> ${data.estimatedDelivery}</p>` : ''}
        
        <p>Siparişinizin durumunu hesabınızdan takip edebilirsiniz.</p>
      </div>
      <div class="footer">
        <p>Bu e-posta NeYisek.com tarafından gönderilmiştir.</p>
        <p>© 2024 NeYisek.com - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </body>
  </html>`;
} 