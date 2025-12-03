import { NextRequest } from 'next/server';
import { invoke, CALLS, jsonResponse, errorResponse } from '../utils/agent';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    const storage = await invoke(channelId, CALLS.STORAGE.GET_ALL, [], 10000);
    return jsonResponse(storage);
  } catch (error: any) {
    console.error('Error fetching storage:', error);
    return errorResponse(error.message || 'Failed to fetch storage');
  }
}
