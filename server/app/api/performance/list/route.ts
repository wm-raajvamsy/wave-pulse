import { NextResponse } from 'next/server';
import { performanceManager } from '@/wavepulse/performance-manager';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const sessions = await performanceManager.listSessions();

    return NextResponse.json({
      success: true,
      sessions
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error: any) {
    console.error('[API] Error listing performance sessions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list performance sessions',
        sessions: []
      },
      { status: 500 }
    );
  }
}

