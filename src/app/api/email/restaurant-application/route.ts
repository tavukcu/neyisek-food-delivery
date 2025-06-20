import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { RestaurantApplicationEmailData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: RestaurantApplicationEmailData = await request.json();

    // Development mode - just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Restaurant application email would be sent to:', data.applicantEmail);
      console.log('📧 [DEV MODE] Restaurant:', data.restaurantName, 'Status:', data.status);
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
    const html = generateRestaurantApplicationHTML(data);
    const isApproved = data.status === 'approved';
    const isRejected = data.status === 'rejected';
    const emoji = isApproved ? '🎉' : isRejected ? '😔' : '🔍';

    // Send email
    const mailOptions = {
      from: `"NeYisek.com" <${process.env.EMAIL_USER}>`,
      to: data.ownerEmail,
      subject: `${emoji} Restoran Başvuru Durumu - ${data.restaurantName}`,
      html
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Restaurant application email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function generateRestaurantApplicationHTML(data: RestaurantApplicationEmailData): string {
  const isApproved = data.status === 'approved';
  const isRejected = data.status === 'rejected';
  const headerBg = isApproved ? '#43e97b' : isRejected ? '#ff6b6b' : '#667eea';
  const emoji = isApproved ? '🎉' : isRejected ? '😔' : '🔍';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: ${headerBg}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${emoji} Restoran Başvuru Durumu</h1>
        <p>${data.restaurantName}</p>
      </div>
      <div class="content">
        <h2>Sayın ${data.ownerName},</h2>
        
        ${isApproved ? `
          <p>🎉 <strong>Harika haber!</strong> ${data.restaurantName} için yaptığınız başvuru onaylandı!</p>
          <p>Artık NeYisek.com platformunda restoranınızı açabilir ve sipariş almaya başlayabilirsiniz.</p>
          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/restaurant" class="button">
              🏪 Restoran Panelini Açın
            </a>
          </div>
        ` : isRejected ? `
          <p>😔 Ne yazık ki ${data.restaurantName} için yaptığınız başvuru bu sefer onaylanamadı.</p>
          ${data.adminMessage ? `<p><strong>Açıklama:</strong> ${data.adminMessage}</p>` : ''}
          <p>Eksikleri giderdikten sonra tekrar başvuru yapabilirsiniz.</p>
        ` : `
          <p>🔍 ${data.restaurantName} için yaptığınız başvuru inceleme aşamasında.</p>
          <p>Başvurunuz titizlikle değerlendiriliyor. Sonuç hakkında en kısa sürede bilgilendirileceksiniz.</p>
        `}
        
        <p>Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.</p>
      </div>
      <div class="footer">
        <p>Bu e-posta NeYisek.com tarafından gönderilmiştir.</p>
        <p>© 2024 NeYisek.com - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </body>
  </html>`;
} 