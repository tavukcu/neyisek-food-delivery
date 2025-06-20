import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { WelcomeEmailData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const data: WelcomeEmailData = await request.json();

    // Development mode - just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Welcome email would be sent to:', data.userEmail);
      console.log('📧 [DEV MODE] User name:', data.userName);
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
    const html = generateWelcomeEmailHTML(data);

    // Send email
    const mailOptions = {
      from: `"NeYisek.com" <${process.env.EMAIL_USER}>`,
      to: data.userEmail,
      subject: '🎉 NeYisek.com\'a Hoş Geldiniz!',
      html
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function generateWelcomeEmailHTML(data: WelcomeEmailData): string {
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
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎉 Hoş Geldiniz!</h1>
        <p>NeYisek.com ailesine katıldığınız için teşekkürler</p>
      </div>
      <div class="content">
        <h2>Merhaba ${data.userName}!</h2>
        <p>NeYisek.com'a başarıyla kayıt oldunuz. Artık favori restoranlarınızdan kolayca sipariş verebilirsiniz.</p>
        
        <h3>🍕 Neler Yapabilirsiniz?</h3>
        <ul>
          <li>Binlerce restoran arasından seçim yapın</li>
          <li>Hızlı ve güvenli sipariş verin</li>
          <li>Siparişlerinizi gerçek zamanlı takip edin</li>
          <li>Favori restoranlarınızı kaydedin</li>
        </ul>
        
        <div style="text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}" class="button">
            🚀 Sipariş Vermeye Başlayın
          </a>
        </div>
        
        <p>Herhangi bir sorunuz olursa, bizimle iletişime geçmekten çekinmeyin.</p>
      </div>
      <div class="footer">
        <p>Bu e-posta NeYisek.com tarafından gönderilmiştir.</p>
        <p>© 2024 NeYisek.com - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </body>
  </html>`;
} 