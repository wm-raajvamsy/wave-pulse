import { Type } from '@google/genai';

/**
 * Tool schema for Gemini function calling
 */
export type GeminiToolSchema = {
  functionDeclarations: Array<{
    name: string;
    description: string;
    parameters: Type;
  }>;
};

/**
 * Tool execution result
 */
export type ToolExecutionResult = {
  success: boolean;
  data?: any;
  error?: string;
};

/**
 * Tool function signature
 */
export type ToolFunction = (...args: any[]) => Promise<ToolExecutionResult>;

