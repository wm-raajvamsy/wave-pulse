import { NextRequest, NextResponse } from 'next/server';
import { getPendingExpressionRequests, setExpressionResult } from '@/ai/llm/tools/expression-eval';

/**
 * API endpoint for expression evaluation
 * Client polls this to get pending expression requests
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const channelId = searchParams.get('channelId');
  
  if (!channelId) {
    return NextResponse.json(
      { error: 'channelId is required' },
      { status: 400 }
    );
  }
  
  const requests = getPendingExpressionRequests(channelId);
  return NextResponse.json({ requests });
}

/**
 * API endpoint to submit expression evaluation result
 */
export async function POST(request: NextRequest) {
  const { requestId, result } = await request.json();
  
  if (!requestId) {
    return NextResponse.json(
      { error: 'requestId is required' },
      { status: 400 }
    );
  }
  
  setExpressionResult(requestId, result);
  return NextResponse.json({ success: true });
}

