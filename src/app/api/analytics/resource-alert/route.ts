import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Resource alert verilerini analiz et
    const alertData = {
      timestamp: new Date().toISOString(),
      type: 'resource',
      severity: body.severity || 'info',
      resource: body.resource || '',
      usage: body.usage || 0,
      threshold: body.threshold || 0,
      available: body.available || 0,
      url: body.url || '',
      userAgent: request.headers.get('user-agent') || '',
      ...body
    };

    // Analytics servisini kullanarak veriyi kaydet
    await AnalyticsService.trackCustomEvent('resource_alert', alertData);

    return NextResponse.json({ 
      success: true, 
      message: 'Resource alert recorded',
      timestamp: alertData.timestamp
    });
    
  } catch (error) {
    console.error('Resource alert error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record resource alert' 
      },
      { status: 500 }
    );
  }
} 