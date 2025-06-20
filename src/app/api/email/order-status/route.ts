import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { OrderEmailData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: OrderEmailData = await request.json();

    // Development mode - just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Order status email would be sent to:', data.customerEmail);
      console.log('📧 [DEV MODE] Order ID:', data.orderId, 'Status:', data.status);
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
    const html = generateOrderStatusUpdateHTML(data);
    const statusText = getOrderStatusText(data.status);

    // Send email
    const mailOptions = {
      from: `"NeYisek.com" <${process.env.EMAIL_USER}>`,
      to: data.customerEmail,
      subject: `📦 Sipariş Durumu: ${statusText} - #${data.orderId.slice(-8)}`,
      html
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order status email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function getOrderStatusText(status: string): string {
  switch (status) {
    case 'pending': return 'Bekliyor';
    case 'confirmed': return 'Onaylandı';
    case 'preparing': return 'Hazırlanıyor';
    case 'ready': return 'Hazır';
    case 'on_the_way': return 'Yolda';
    case 'delivered': return 'Teslim Edildi';
    case 'cancelled': return 'İptal Edildi';
    default: return 'Bilinmiyor';
  }
}

function generateOrderStatusUpdateHTML(data: OrderEmailData): string {
  const statusText = getOrderStatusText(data.status);
  const statusEmoji = data.status === 'delivered' ? '🎉' : 
                     data.status === 'on_the_way' ? '🚚' : 
                     data.status === 'preparing' ? '👨‍🍳' : '📦';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .status-badge { display: inline-block; background: #43e97b; color: white; padding: 10px 20px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${statusEmoji} Sipariş Durumu Güncellendi</h1>
        <p>Sipariş No: #${data.orderId.slice(-8)}</p>
      </div>
      <div class="content">
        <h2>Merhaba ${data.customerName}!</h2>
        <p><strong>${data.restaurantName}</strong> restoranından verdiğiniz siparişin durumu güncellendi.</p>
        
        <div style="text-align: center;">
          <span class="status-badge">${statusText}</span>
        </div>
        
        ${data.status === 'delivered' ? 
          '<p>🎉 <strong>Siparişiniz teslim edildi!</strong> Afiyet olsun!</p>' :
          data.status === 'on_the_way' ?
          '<p>🚚 Siparişiniz yola çıktı! Kısa süre içinde adresinizde olacak.</p>' :
          data.status === 'preparing' ?
          '<p>👨‍🍳 Siparişiniz özenle hazırlanıyor...</p>' :
          '<p>Siparişinizin durumu güncellendi.</p>'
        }
        
        <p>Siparişinizin detaylarını hesabınızdan takip edebilirsiniz.</p>
      </div>
      <div class="footer">
        <p>Bu e-posta NeYisek.com tarafından gönderilmiştir.</p>
        <p>© 2024 NeYisek.com - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </body>
  </html>`;
} 