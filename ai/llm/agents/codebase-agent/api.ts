/**
 * Public API: Send message with Codebase Agent
 */

import { createCodebaseAgent } from './codebase-agent';
import { CodebaseAgentState } from './types';

/**
 * Send message with Codebase Agent (non-streaming)
 */
export async function sendMessageWithCodebaseAgent(
  message: string,
  channelId?: string
): Promise<{
  message: string;
  researchSteps: Array<{ id: string; description: string; status: string }>;
  success: boolean;
  errors?: Array<{ step: string; error: string }>;
}> {
  console.log('[Codebase Agent] Starting Codebase Agent for query:', message.substring(0, 50));
  
  if (!channelId) {
    return {
      message: 'Channel ID is required for Codebase Agent',
      researchSteps: [],
      success: false,
      errors: [{ step: 'initialization', error: 'Channel ID is required' }]
    };
  }
  
  const app = createCodebaseAgent();
  
  const initialState: CodebaseAgentState = {
    userQuery: message,
    channelId,
    researchSteps: [],
    errors: []
  };
  
  try {
    console.log('[Codebase Agent] Invoking LangGraph workflow (non-streaming)...');
    const finalState = await app.invoke(initialState as any) as CodebaseAgentState;
    
    console.log('[Codebase Agent] Agent execution completed:', {
      hasFinalResponse: !!finalState.finalResponse,
      finalResponseLength: finalState.finalResponse?.length || 0,
      stepsCount: finalState.researchSteps?.length || 0,
      errorsCount: finalState.errors?.length || 0,
    });
    
    return {
      message: finalState.finalResponse || 'Unable to generate response.',
      researchSteps: finalState.researchSteps || [],
      success: true,
      errors: finalState.errors?.length > 0 ? finalState.errors : undefined
    };
  } catch (error) {
    console.error('[Codebase Agent] Error during agent execution:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      message: `Error: ${errorMessage}`,
      researchSteps: [],
      success: false,
      errors: [{ step: 'agent-execution', error: errorMessage }]
    };
  }
}

/**
 * Send message with Codebase Agent (streaming)
 */
export async function sendMessageWithCodebaseAgentStreaming(
  message: string,
  channelId?: string,
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void,
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>
): Promise<{
  message: string;
  researchSteps: Array<{ id: string; description: string; status: string }>;
  success: boolean;
  errors?: Array<{ step: string; error: string }>;
}> {
  console.log('[Codebase Agent] Starting Codebase Agent streaming for query:', message.substring(0, 50));
  console.log('[Codebase Agent] Conversation history length:', conversationHistory?.length || 0);
  
  if (!channelId) {
    return {
      message: 'Channel ID is required for Codebase Agent',
      researchSteps: [],
      success: false,
      errors: [{ step: 'initialization', error: 'Channel ID is required' }]
    };
  }
  
  console.log('[Codebase Agent] Creating workflow...');
  let app;
  try {
    app = createCodebaseAgent();
    console.log('[Codebase Agent] Workflow created successfully, type:', typeof app);
  } catch (error) {
    console.error('[Codebase Agent] Error creating workflow:', error);
    throw error;
  }
  
  const initialState: CodebaseAgentState = {
    userQuery: message,
    channelId,
    researchSteps: [],
    errors: [],
    onStepUpdate
  };
  
  console.log('[Codebase Agent] Initial state prepared:', {
    hasUserQuery: !!initialState.userQuery,
    userQueryLength: initialState.userQuery?.length || 0,
    hasChannelId: !!initialState.channelId,
    channelId: initialState.channelId,
    hasOnStepUpdate: !!initialState.onStepUpdate,
    researchStepsCount: initialState.researchSteps?.length || 0
  });
  
  try {
    console.log('[Codebase Agent] Invoking LangGraph workflow...');
    console.log('[Codebase Agent] App type:', typeof app, 'has invoke:', typeof app?.invoke);
    
    if (!app || typeof app.invoke !== 'function') {
      throw new Error('Workflow app is not properly initialized or does not have invoke method');
    }
    
    const finalState = await app.invoke(initialState as any) as CodebaseAgentState;
    
    console.log('[Codebase Agent] Agent execution completed:', {
      hasFinalResponse: !!finalState.finalResponse,
      finalResponseLength: finalState.finalResponse?.length || 0,
      stepsCount: finalState.researchSteps?.length || 0,
      errorsCount: finalState.errors?.length || 0,
    });
    
    // Emit final complete event
    if (onStepUpdate) {
      onStepUpdate({
        type: 'complete',
        data: {
          message: finalState.finalResponse || 'Unable to generate response.',
          researchSteps: finalState.researchSteps || [],
          errors: finalState.errors?.length > 0 ? finalState.errors : undefined
        }
      });
    }
    
    return {
      message: finalState.finalResponse || 'Unable to generate response.',
      researchSteps: finalState.researchSteps || [],
      success: true,
      errors: finalState.errors?.length > 0 ? finalState.errors : undefined
    };
  } catch (error) {
    console.error('[Codebase Agent] Error during agent execution:', error);
    console.error('[Codebase Agent] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Emit error event
    if (onStepUpdate) {
      onStepUpdate({
        type: 'complete',
        data: {
          message: `Error: ${errorMessage}`,
          researchSteps: [],
          errors: [{ step: 'agent-execution', error: errorMessage }]
        }
      });
    }
    
    return {
      message: `Error: ${errorMessage}`,
      researchSteps: [],
      success: false,
      errors: [{ step: 'agent-execution', error: errorMessage }]
    };
  }
}

