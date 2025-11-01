import { NextRequest, NextResponse } from 'next/server';
import { GeminiChatService } from '@/ai/llm/gemini';
import { getAllToolSchemas } from '@/ai/llm/tools';

// Create a singleton instance to maintain chat history
let chatService: GeminiChatService | null = null;

function getChatService(): GeminiChatService {
  if (!chatService) {
    chatService = new GeminiChatService();
    // Set default tools
    chatService.setTools(getAllToolSchemas());
  }
  return chatService;
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [], channelId } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get chat service instance
    const service = getChatService();

    // Get tools
    const tools = getAllToolSchemas();
    
    // Pass channelId to service so it can auto-inject into tool calls
    const result = await service.sendMessage(message, history, tools, channelId);

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

