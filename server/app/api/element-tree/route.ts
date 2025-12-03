import { NextRequest } from 'next/server';
import { invoke, CALLS, jsonResponse, errorResponse } from '../utils/agent';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  try {
    const elementTree = await invoke(channelId, CALLS.WIDGET.TREE, [], 10000);
    return jsonResponse(elementTree);
  } catch (error: any) {
    console.error('Error fetching element tree:', error);
    return errorResponse(error.message || 'Failed to fetch element tree');
  }
}
