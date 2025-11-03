import { Type } from '@google/genai';
import { GeminiToolSchema, ToolExecutionResult } from '../../types';

/**
 * Expression evaluation tool description for AI prompts
 */
export const EXPRESSION_EVAL_TOOL_DESCRIPTION = `Evaluate a JavaScript expression in the app iframe. This tool executes JavaScript code in the context of the running application and returns the result. Use this to access app configuration, variables, or execute code in the app's context.`;

/**
 * Store for expression evaluation requests/results
 * This is a simple in-memory store for server-client communication
 */
const expressionStore = new Map<string, { request: any; result?: any; timestamp: number }>();

/**
 * Get page name using expression evaluation
 * This uses CALLS.EXPRESSION.EVAL to execute wm.App.appConfig.currentPage.name in the app iframe
 */
export async function evalExpression(
  channelId: string,
  expression: string
): Promise<ToolExecutionResult> {
  try {
    console.log('[eval_expression] Starting evaluation:', { channelId, expression });
    
    if (!channelId) {
      console.log('[eval_expression] Error: channelId is required');
      return {
        success: false,
        error: 'channelId is required',
      };
    }

    if (!expression) {
      console.log('[eval_expression] Error: expression is required');
      return {
        success: false,
        error: 'expression is required',
      };
    }

    // Create a unique request ID
    const requestId = `eval_${channelId}_${Date.now()}`;
    
    // Store the request
    expressionStore.set(requestId, {
      request: { expression, channelId },
      timestamp: Date.now(),
    });

    // The client-side code will poll /api/expression-eval?channelId=... to get pending requests
    // and execute them using uiAgent.invoke(CALLS.EXPRESSION.EVAL, [{expr: expression}])
    // Then submit the result back via POST /api/expression-eval
    
    console.log('[eval_expression] Request stored:', requestId);
    
    // Poll for result (max 5 seconds)
    const maxAttempts = 10;
    const delayMs = 500;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      const stored = expressionStore.get(requestId);
      if (stored?.result !== undefined) {
        console.log('[eval_expression] Result received:', stored.result);
        expressionStore.delete(requestId);
        
        return {
          success: true,
          data: {
            expression,
            result: stored.result,
          },
        };
      }
    }
    
    // Timeout - remove request
    expressionStore.delete(requestId);
    console.log('[eval_expression] Timeout waiting for result');
    
    return {
      success: false,
      error: 'Timeout waiting for expression evaluation result. Make sure the app is connected and client-side expression executor is running.',
    };
  } catch (error) {
    console.error('[eval_expression] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get expression evaluation result (called by client-side code)
 */
export function setExpressionResult(requestId: string, result: any): void {
  const stored = expressionStore.get(requestId);
  if (stored) {
    stored.result = result;
    console.log('[eval_expression] Result set for request:', requestId, result);
  }
}

/**
 * Get pending expression requests (called by client-side code)
 */
export function getPendingExpressionRequests(channelId: string): Array<{ requestId: string; expression: string }> {
  const requests: Array<{ requestId: string; expression: string }> = [];
  
  for (const [requestId, stored] of expressionStore.entries()) {
    if (stored.request.channelId === channelId && stored.result === undefined) {
      requests.push({
        requestId,
        expression: stored.request.expression,
      });
    }
  }
  
  return requests;
}

/**
 * Get Gemini tool schema for expression evaluation
 */
export function getExpressionEvalToolSchema(): GeminiToolSchema {
  return {
    functionDeclarations: [
      {
        name: 'eval_expression',
        description: EXPRESSION_EVAL_TOOL_DESCRIPTION,
        parameters: {
          type: Type.OBJECT,
          properties: {
            channelId: {
              type: Type.STRING,
              description: 'Channel identifier for the connected application session. This is automatically provided when available.',
            },
            expression: {
              type: Type.STRING,
              description: 'JavaScript expression to evaluate in the app context. Example: "wm.App.appConfig.currentPage.name"',
            },
          },
          required: ['expression'],
        },
      },
    ],
  };
}

