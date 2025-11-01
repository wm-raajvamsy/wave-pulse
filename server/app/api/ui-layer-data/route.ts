import { NextRequest, NextResponse } from 'next/server';
import { UILayerData } from '@/types';
import { uiLayerDataStore, getUILayerDataFromStore, setUILayerDataToStore } from './store';

/**
 * GET /api/ui-layer-data?channelId=X
 * Retrieve current UI Layer data for a channel
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      );
    }

    const data = uiLayerDataStore.get(channelId);

    if (!data) {
      return NextResponse.json(
        { error: 'No data found for this channelId' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error retrieving UI Layer data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve UI Layer data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ui-layer-data
 * Store/update UI Layer data from client
 * Body: { channelId: string, data: UILayerData }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId, data } = body;

    if (!channelId) {
      return NextResponse.json(
        { error: 'channelId is required' },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    // Store the data
    setUILayerDataToStore(channelId, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing UI Layer data:', error);
    return NextResponse.json(
      { error: 'Failed to store UI Layer data' },
      { status: 500 }
    );
  }
}

// Re-export for convenience
export { getUILayerDataFromStore } from './store';

