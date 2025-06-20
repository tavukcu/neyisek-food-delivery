import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { FinancialReportEmailData } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export async function POST(request: NextRequest) {
  try {
    const data: FinancialReportEmailData = await request.json();

    // Development mode - just log and return success
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [DEV MODE] Financial report email would be sent to:', data.recipientEmail);
      console.log('📧 [DEV MODE] Report period:', data.period);
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
    const html = generateFinancialReportEmailHTML(data);

    // Attachment setup
    const attachments: any[] = [];
    if (data.attachments) {
      data.attachments.forEach(attachment => {
        attachments.push({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType
        });
      });
    }

    // Send email
    const mailOptions = {
      from: `"NeYisek.com" <${process.env.EMAIL_USER}>`,
      to: data.recipientEmail,
      subject: `📊 Mali Rapor - ${data.period}`,
      html,
      attachments
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Financial report email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount);
}

function generateFinancialReportHTML(data: FinancialReportEmailData): string {
  const periodText = `${format(new Date(data.reportPeriod.start), 'dd MMM yyyy', { locale: tr })} - ${format(new Date(data.reportPeriod.end), 'dd MMM yyyy', { locale: tr })}`;

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
      .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
      .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
      .stat-value { font-size: 24px; font-weight: bold; color: #667eea; }
      .stat-label { font-size: 14px; color: #666; margin-top: 5px; }
      .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>📊 Mali Rapor</h1>
        <p>${data.restaurantName}</p>
        <p>${periodText}</p>
      </div>
      <div class="content">
        <p>Merhaba,</p>
        <p>${data.restaurantName} için ${periodText} dönemi mali raporunuz hazır.</p>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.totalRevenue)}</div>
            <div class="stat-label">Toplam Gelir</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${data.totalOrders}</div>
            <div class="stat-label">Toplam Sipariş</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.commission)}</div>
            <div class="stat-label">Komisyon</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(data.netEarnings)}</div>
            <div class="stat-label">Net Kazanç</div>
          </div>
        </div>
        
        ${data.pdfBuffer ? '<p>📎 Detaylı mali rapor PDF dosyası ekte bulunmaktadır.</p>' : ''}
        
        <p>Daha detaylı analiz için restoran panelinizi ziyaret edebilirsiniz.</p>
      </div>
      <div class="footer">
        <p>Bu e-posta NeYisek.com tarafından gönderilmiştir.</p>
        <p>© 2024 NeYisek.com - Tüm hakları saklıdır.</p>
      </div>
    </div>
  </body>
  </html>`;
} 