import { NextRequest } from 'next/server';
import { getSessionData, clearNetworkLogs, jsonResponse, errorResponse } from '../utils/agent';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    const sessionData = getSessionData(channelId);
    return jsonResponse(sessionData.networkLogs);
  } catch (error: any) {
    console.error('Error fetching network logs:', error);
    return errorResponse(error.message || 'Failed to fetch network logs');
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    clearNetworkLogs(channelId);
    return jsonResponse({ success: true, message: 'Network logs cleared' });
  } catch (error: any) {
    console.error('Error clearing network logs:', error);
    return errorResponse(error.message || 'Failed to clear network logs');
  }
}
