/// <reference types="node" />

import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client
export function createGeminiClient(apiKey?: string) {
  const key = apiKey || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!key) {
    throw new Error('GEMINI_API_KEY is not set. Please provide an API key.');
  }
  return new GoogleGenAI({
    apiKey: key,
  });
}

// Chat service using Gemini with structured JSON output
export class GeminiChatService {
  private ai: GoogleGenAI;
  private modelName: string;
  private chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  constructor(apiKey?: string) {
    this.ai = createGeminiClient(apiKey);
    // Use gemini-flash-lite-latest or gemini-2.5-flash-lite
    this.modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-flash-lite-latest';
  }

  async sendMessage(
    message: string, 
    history: Array<{ role: string; content: string }> = []
  ): Promise<{ message: string; success: boolean }> {
    try {
      // Build conversation contents from history + current message
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [
        ...history.map(msg => ({
          role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
          parts: [{ text: msg.content }]
        })),
        {
          role: 'user' as const,
          parts: [{ text: message }]
        }
      ];

      // Configuration for structured JSON output
      const config = {
        temperature: 0,
        thinkingConfig: {
          thinkingBudget: 0,
        },
        responseMimeType: 'application/json' as const,
      };

      // Generate content stream
      const response = await this.ai.models.generateContentStream({
        model: this.modelName,
        config,
        contents,
      });

      // Collect all text chunks
      let fullText = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullText += chunk.text;
        }
      }

      // Parse and validate JSON
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(fullText);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        console.error('Raw response:', fullText);
        throw new Error('Invalid JSON response from Gemini API');
      }

      // Extract message from structured response
      // Handle different possible JSON structures
      let messageText: string;
      if (typeof parsedResponse === 'string') {
        messageText = parsedResponse;
      } else if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        // Try common field names
        messageText = parsedResponse.message || 
                     parsedResponse.text || 
                     parsedResponse.response ||
                     parsedResponse.content ||
                     JSON.stringify(parsedResponse);
      } else {
        messageText = String(parsedResponse);
      }

      // Update chat history
      this.chatHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });
      this.chatHistory.push({
        role: 'model',
        parts: [{ text: messageText }]
      });

      return {
        message: messageText,
        success: true
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to get response from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  clearHistory() {
    this.chatHistory = [];
  }

  getHistory() {
    return this.chatHistory;
  }
}
