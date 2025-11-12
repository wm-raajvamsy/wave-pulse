import { NextRequest, NextResponse } from 'next/server';
import { performanceManager } from '@/wavepulse/performance-manager';

export async function POST(request: NextRequest) {
  try {
    const { channelId, metadata } = await request.json();

    const sessionId = `perf-${channelId}-${Date.now()}`;
    const session = performanceManager.startSession(sessionId, {
      channelId,
      ...metadata
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      startTime: session.startTime
    });
  } catch (error: any) {
    console.error('[API] Error starting performance session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to start performance session'
      },
      { status: 500 }
    );
  }
}

