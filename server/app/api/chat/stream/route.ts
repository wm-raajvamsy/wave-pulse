import { NextRequest } from 'next/server';
import { sendMessageWithFileOperationsAgentStreaming } from '@/ai/llm/agents/file-operations-agent';
import { sendMessageWithInformationRetrievalAgentStreaming } from '@/ai/llm/agents/information-retrieval-agent';
import { sendMessageWithCodebaseAgentStreaming } from '@/ai/llm/agents/codebase-agent';
import { determineAgentForQuery } from '@/ai/llm/agents/agent-router';

/**
 * Streaming chat endpoint that sends research step updates in real-time
 * Automatically routes to Information Retrieval Agent, File Operations Agent, or Codebase Agent based on query type
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

    // Determine which agent to use using AI-based routing
    let agentType: 'information-retrieval' | 'file-operations' | 'codebase';
    try {
      agentType = await determineAgentForQuery(message);
      console.log(`[Chat API] AI Router selected: ${agentType} agent for query: "${message.substring(0, 50)}..."`);
    } catch (error) {
      console.error('[Chat API] Error in agent router, defaulting to file-operations:', error);
      agentType = 'file-operations';
    }
    const useIRAgent = agentType === 'information-retrieval';
    
    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        let finalResult: any = null;
        
        // Send step updates as they happen
        try {
          console.log(`[Chat API] Starting agent execution for ${agentType} agent`);
          
          if (agentType === 'information-retrieval') {
            // Use Information Retrieval Agent
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
            
            console.log(`[Chat API] IR Agent completed. Final result:`, {
              hasAnswer: !!finalResult?.answer,
              hasMessage: !!finalResult?.message,
              stepsCount: finalResult?.researchSteps?.length || 0,
            });
            
            // Convert IR Agent response format to match frontend expectations
            // Only set finalResult if we haven't already set it from complete event
            if (!finalResult) {
              finalResult = {
                message: finalResult?.answer || 'Unable to generate answer.',
                researchSteps: finalResult?.researchSteps || [],
                success: true,
              };
            }
          } else if (agentType === 'codebase') {
            // Use Codebase Agent
            finalResult = await sendMessageWithCodebaseAgentStreaming(
              message,
              channelId,
              (update: { type: 'step' | 'complete'; data?: any }) => {
                // Handle step updates
                if (update.type === 'step') {
                  console.log('[Chat API] Codebase Agent step update:', update.data?.researchSteps?.length || update.data?.steps?.length || 0, 'steps');
                  // Normalize to researchSteps format for frontend consistency
                  const normalizedUpdate = {
                    ...update,
                    data: {
                      researchSteps: update.data?.researchSteps || update.data?.steps || []
                    }
                  };
                  const chunk = `data: ${JSON.stringify(normalizedUpdate)}\n\n`;
                  controller.enqueue(encoder.encode(chunk));
                } else if (update.type === 'complete') {
                  console.log('[Chat API] Codebase Agent complete event received');
                  const completeData = {
                    ...update.data,
                    message: update.data?.message || 'Unable to generate response.',
                    researchSteps: update.data?.researchSteps || [],
                  };
                  console.log('[Chat API] Sending complete event to frontend:', { 
                    messageLength: completeData.message?.length || 0,
                    stepsCount: completeData.researchSteps?.length || 0 
                  });
                  const chunk = `data: ${JSON.stringify({ type: 'complete', data: completeData })}\n\n`;
                  controller.enqueue(encoder.encode(chunk));
                  finalResult = completeData;
                }
              },
              history.map(h => ({
                role: h.role as 'user' | 'model',
                parts: [{ text: h.content }],
              }))
            );
          } else {
            // Use File Operations Agent
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
          }
          
          // Send final result (only if we haven't already sent it via complete event)
          if (finalResult && agentType !== 'information-retrieval' && agentType !== 'codebase') {
            // For File Operations Agent, send final event
          const finalChunk = `data: ${JSON.stringify({ type: 'final', data: finalResult })}\n\n`;
          controller.enqueue(encoder.encode(finalChunk));
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
