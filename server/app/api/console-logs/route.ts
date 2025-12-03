import { NextRequest } from 'next/server';
import { getSessionData, clearConsoleLogs, jsonResponse, errorResponse } from '../utils/agent';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    const sessionData = getSessionData(channelId);
    return jsonResponse(sessionData.consoleLogs);
  } catch (error: any) {
    console.error('Error fetching console logs:', error);
    return errorResponse(error.message || 'Failed to fetch console logs');
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    clearConsoleLogs(channelId);
    return jsonResponse({ success: true, message: 'Console logs cleared' });
  } catch (error: any) {
    console.error('Error clearing console logs:', error);
    return errorResponse(error.message || 'Failed to clear console logs');
  }
}
