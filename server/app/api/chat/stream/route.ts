import { NextRequest } from 'next/server';
import { sendMessageWithFileOperationsAgentStreaming } from '@/ai/llm/agents/file-operations-agent';

/**
 * Streaming chat endpoint that sends research step updates in real-time
 */
export async function POST(request: NextRequest) {
  try {
    const { message, history = [], channelId, projectLocation } = await request.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Chat API] Using File Operations agent with streaming');
    
    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        let finalResult: any = null;
        
        // Send step updates as they happen
        try {
          finalResult = await sendMessageWithFileOperationsAgentStreaming(
            message,
            history,
            channelId,
            projectLocation,
            (update: { type: 'step' | 'complete'; data?: any }) => {
              const chunk = `data: ${JSON.stringify(update)}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          );
          
          // Send final result
          const finalChunk = `data: ${JSON.stringify({ type: 'final', data: finalResult })}\n\n`;
          controller.enqueue(encoder.encode(finalChunk));
        } catch (error) {
          const errorChunk = `data: ${JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          })}\n\n`;
          controller.enqueue(encoder.encode(errorChunk));
        }
        
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat streaming API error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: false 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

