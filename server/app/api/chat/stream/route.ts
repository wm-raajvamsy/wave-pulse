import { NextRequest } from 'next/server';
import { sendMessageWithInformationRetrievalAgentStreaming } from '@/ai/llm/agents/information-retrieval-agent';

/**
 * Streaming chat endpoint that sends research step updates in real-time
 * Uses the orchestrator which intelligently decides which tools/agents to use
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

    // Always use the orchestrator via Information Retrieval Agent
    // The orchestrator will intelligently decide which tools/agents to use
    console.log(`[Chat API] Processing query with orchestrator: "${message.substring(0, 50)}..."`);

    
    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        let finalResult: any = null;
        
        // Send step updates as they happen
        try {
          console.log(`[Chat API] Starting orchestrator execution`);
          
          finalResult = await sendMessageWithInformationRetrievalAgentStreaming(
              message,
              history.map(h => ({
                role: h.role as 'user' | 'model',
                parts: [{ text: h.content }],
              })),
              channelId,
              projectLocation,
              (update: { type: 'step' | 'complete'; data?: any }) => {
                // Handle step updates
                if (update.type === 'step') {
                  console.log('[Chat API] IR Agent step update:', update.data?.researchSteps?.length || 0, 'steps');
                  const chunk = `data: ${JSON.stringify(update)}\n\n`;
                  controller.enqueue(encoder.encode(chunk));
                } else if (update.type === 'complete') {
                  console.log('[Chat API] IR Agent complete event received');
                  // Convert answer to message format for frontend
                  const completeData = {
                    ...update.data,
                    message: update.data?.answer || update.data?.message || 'Unable to generate answer.',
                    researchSteps: update.data?.researchSteps || [],
                  };
                  // Remove answer field if it exists (we have message now)
                  delete completeData.answer;
                  console.log('[Chat API] Sending complete event to frontend:', { 
                    messageLength: completeData.message?.length || 0,
                    stepsCount: completeData.researchSteps?.length || 0 
                  });
                  const chunk = `data: ${JSON.stringify({ type: 'complete', data: completeData })}\n\n`;
                  controller.enqueue(encoder.encode(chunk));
                  // Also set finalResult here so we don't need to send it again
                  finalResult = completeData;
                }
              }
            );
            
            console.log(`[Chat API] Orchestrator completed. Final result:`, {
              hasAnswer: !!finalResult?.answer,
              hasMessage: !!finalResult?.message,
              stepsCount: finalResult?.researchSteps?.length || 0,
            });
            
            // Convert response format to match frontend expectations
            // Only set finalResult if we haven't already set it from complete event
            if (!finalResult) {
              finalResult = {
                message: finalResult?.answer || 'Unable to generate answer.',
                researchSteps: finalResult?.researchSteps || [],
                success: true,
              };
            }
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
