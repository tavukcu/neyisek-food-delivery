import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/services/analyticsService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Engagement verilerini analiz et
    const engagementData = {
      timestamp: new Date().toISOString(),
      type: 'engagement',
      action: body.action || '',
      element: body.element || '',
      page: body.page || '',
      sessionId: body.sessionId || '',
      userId: body.userId || '',
      duration: body.duration || 0,
      url: body.url || '',
      userAgent: request.headers.get('user-agent') || '',
      ...body
    };

    // Analytics servisini kullanarak veriyi kaydet
    await AnalyticsService.trackCustomEvent('user_engagement', engagementData);

    return NextResponse.json({ 
      success: true, 
      message: 'Engagement data recorded',
      timestamp: engagementData.timestamp
    });
    
  } catch (error) {
    console.error('Engagement tracking error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to record engagement data' 
      },
      { status: 500 }
    );
  }
} 