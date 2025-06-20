import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Performance alert verilerini analiz et
    const alertData = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      severity: body.severity || 'info',
      metric: body.metric || '',
      value: body.value || 0,
      threshold: body.threshold || 0,
      url: body.url || '',
      userAgent: request.headers.get('user-agent') || '',
      ...body
    };

    // Analytics servisini kullanarak veriyi kaydet
    await AnalyticsService.trackCustomEvent('performance_alert', alertData);

    return NextResponse.json({ 
      success: true, 
      message: 'Performance alert recorded',
      timestamp: alertData.timestamp
    });
    
  } catch (error) {
    console.error('Performance alert error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record performance alert' 
      },
      { status: 500 }
    );
  }
} 