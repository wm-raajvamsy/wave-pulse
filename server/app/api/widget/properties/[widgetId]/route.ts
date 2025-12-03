import { NextRequest } from 'next/server';
import { invoke, CALLS, jsonResponse, errorResponse } from '../../../utils/agent';

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');
  const { widgetId } = params;

  if (!channelId) {
    return errorResponse('channelId is required', 400);
  }

  if (!widgetId) {
    return errorResponse('widgetId is required', 400);
  }

  try {
    // Decode the widgetId in case it contains special characters
    const decodedWidgetId = decodeURIComponent(widgetId);
    const data = await invoke(channelId, CALLS.WIDGET.GET_PROPERTIES_N_STYLES, [decodedWidgetId], 10000);
    return jsonResponse(data.properties || {});
  } catch (error: any) {
    console.error('Error fetching widget properties:', error);
    return errorResponse(error.message || 'Failed to fetch widget properties');
  }
}
