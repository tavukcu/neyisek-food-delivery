import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Performance verilerini analiz et
    const performanceData = {
      timestamp: new Date().toISOString(),
      type: 'performance',
      metric: body.metric || '',
      value: body.value || 0,
      page: body.page || '',
      loadTime: body.loadTime || 0,
      renderTime: body.renderTime || 0,
      domContentLoaded: body.domContentLoaded || 0,
      firstContentfulPaint: body.firstContentfulPaint || 0,
      largestContentfulPaint: body.largestContentfulPaint || 0,
      cumulativeLayoutShift: body.cumulativeLayoutShift || 0,
      firstInputDelay: body.firstInputDelay || 0,
      url: body.url || '',
      userAgent: request.headers.get('user-agent') || '',
      connection: body.connection || '',
      deviceType: body.deviceType || '',
      ...body
    };

    // Analytics servisini kullanarak veriyi kaydet
    await AnalyticsService.trackCustomEvent('performance_metrics', performanceData);

    return NextResponse.json({ 
      success: true, 
      message: 'Performance data recorded',
      timestamp: performanceData.timestamp
    });
    
  } catch (error) {
    console.error('Performance tracking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record performance data' 
      },
      { status: 500 }
    );
  }
} 