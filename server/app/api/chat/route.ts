import { NextRequest, NextResponse } from 'next/server';
import { sendMessageWithInformationRetrievalAgent } from '@/ai/llm/agents/information-retrieval-agent';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], channelId, projectLocation } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Always use the orchestrator via Information Retrieval Agent
    // The orchestrator will intelligently decide which tools/agents to use
    console.log(`[Chat API] Processing query with orchestrator: "${message.substring(0, 50)}..."`);
    
    const irResult = await sendMessageWithInformationRetrievalAgent(
      message,
      history.map(h => ({
        role: h.role as 'user' | 'model',
        parts: [{ text: h.content }],
      })),
      channelId,
      projectLocation
    );
    
    // Convert IR Agent response format to match frontend expectations
    const result = {
      message: irResult.answer || 'Unable to generate answer.',
      researchSteps: irResult.researchSteps || [],
      success: true,
      sessionId: irResult.sessionId,
      logPath: irResult.logPath,
      answerQuality: irResult.answerQuality,
      confidence: irResult.confidence,
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('GEMINI_API_KEY')) {
        return NextResponse.json(
          { 
            error: 'Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.',
            success: false
          },
          { status: 500 }
        );
      }

      if (error.message.includes('Invalid JSON')) {
        return NextResponse.json(
          { 
            error: 'Invalid response format from AI service. Please try again.',
            success: false
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: error.message,
          success: false
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        error: 'An unexpected error occurred',
        success: false
      },
      { status: 500 }
    );
  }
}
