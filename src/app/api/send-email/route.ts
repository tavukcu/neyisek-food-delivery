import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// E-posta gönderme API endpoint'i
export async function POST(request: NextRequest) {
  try {
    const { to, subject, message, name, email, phone, type } = await request.json();

    // Gerekli alanları kontrol et
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Gerekli alanlar eksik' },
        { status: 400 }
      );
    }

    // Nodemailer transporter oluştur
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // E-posta içeriğini hazırla
    let htmlContent = '';
    
    if (type === 'contact') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4ade80;">İletişim Formu Mesajı</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Ad Soyad:</strong> ${name}</p>
            <p><strong>E-posta:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${phone || 'Belirtilmemiş'}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0;">Mesaj:</h3>
            <p style="line-height: 1.6; color: #6b7280;">${message}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #ecfdf5; border-radius: 8px;">
            <p style="margin: 0; color: #065f46; font-size: 14px;">
              Bu mesaj NeYisek.com iletişim formundan gönderilmiştir.
            </p>
          </div>
        </div>
      `;
    } else if (type === 'restaurant-application') {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4ade80;">Yeni Restoran Başvurusu</h2>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Restoran Adı:</strong> ${name}</p>
            <p><strong>E-posta:</strong> ${email}</p>
            <p><strong>Telefon:</strong> ${phone}</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0;">Açıklama:</h3>
            <p style="line-height: 1.6; color: #6b7280;">${message}</p>
          </div>
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              ⚠️ Bu başvuru admin panelinden onaylanmayı bekliyor.
            </p>
          </div>
        </div>
      `;
    } else {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4ade80;">${subject}</h2>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="line-height: 1.6; color: #374151;">${message}</p>
          </div>
          ${name && email ? `
            <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Gönderen: ${name} (${email})
              </p>
            </div>
          ` : ''}
        </div>
      `;
    }

    // E-posta gönder
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'E-posta başarıyla gönderildi' },
      { status: 200 }
    );

  } catch (error) {
    console.error('E-posta gönderme hatası:', error);
    return NextResponse.json(
      { error: 'E-posta gönderilemedi' },
      { status: 500 }
    );
  }
} 