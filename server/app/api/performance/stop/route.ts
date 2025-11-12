import { NextRequest, NextResponse } from 'next/server';
import { performanceManager } from '@/wavepulse/performance-manager';

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required'
        },
        { status: 400 }
      );
    }

    const session = await performanceManager.stopSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        summary: session.summary
      }
    });
  } catch (error: any) {
    console.error('[API] Error stopping performance session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to stop performance session'
      },
      { status: 500 }
    );
  }
}

