import { NextRequest, NextResponse } from 'next/server';
import { performanceManager } from '@/wavepulse/performance-manager';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required'
        },
        { status: 400 }
      );
    }

    // Return processed session data with component statistics
    const session = await performanceManager.getProcessedSession(sessionId);

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
      session
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('[API] Error getting performance session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get performance session'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required'
        },
        { status: 400 }
      );
    }

    const deleted = await performanceManager.deleteSession(sessionId);

    if (!deleted) {
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
      message: 'Session deleted successfully'
    });
  } catch (error: any) {
    console.error('[API] Error deleting performance session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete performance session'
      },
      { status: 500 }
    );
  }
}

