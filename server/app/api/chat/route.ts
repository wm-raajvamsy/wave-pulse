import { NextRequest, NextResponse } from 'next/server';
import { sendMessageWithFileOperationsAgent } from '@/ai/llm/agents/file-operations-agent';

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], channelId, projectLocation } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Use File Operations agent for multi-step tool execution
    console.log('[Chat API] Using File Operations agent');
    const result = await sendMessageWithFileOperationsAgent(
      message,
      history,
      channelId,
      projectLocation
    );

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

