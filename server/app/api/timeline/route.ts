import { NextRequest } from 'next/server';
import { getSessionData, clearTimelineLogs, jsonResponse, errorResponse } from '../utils/agent';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    const sessionData = getSessionData(channelId);
    return jsonResponse(sessionData.timelineLogs);
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    return errorResponse(error.message || 'Failed to fetch timeline');
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    clearTimelineLogs(channelId);
    return jsonResponse({ success: true, message: 'Timeline logs cleared' });
  } catch (error: any) {
    console.error('Error clearing timeline logs:', error);
    return errorResponse(error.message || 'Failed to clear timeline logs');
  }
}
