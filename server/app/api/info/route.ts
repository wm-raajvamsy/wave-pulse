import { NextRequest } from 'next/server';
import { invoke, CALLS, jsonResponse, errorResponse } from '../utils/agent';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    // Fetch both app info and platform info in parallel
    const [appInfo, platformInfo] = await Promise.all([
      invoke(channelId, CALLS.APP.INFO, [], 10000),
      invoke(channelId, CALLS.PLATFORM.INFO, [], 10000)
    ]);

    return jsonResponse({
      app: appInfo,
      platform: platformInfo
    });
  } catch (error: any) {
    console.error('Error fetching info:', error);
    return errorResponse(error.message || 'Failed to fetch info');
  }
}
