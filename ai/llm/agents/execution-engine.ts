/**
 * Execution Engine
 * 
 * Implements the adaptive execution loop that runs the orchestrator after each action.
 * This is the core of the ReAct pattern implementation.
 * 
 * Flow:
 * 1. Orchestrator analyzes current state and decides next action
 * 2. Engine executes the action (tool or agent)
 * 3. Results are added to execution history
 * 4. Loop back to step 1 until done or max steps reached
 */

import { orchestrate, ExecutionAction, OrchestratorDecision } from './orchestrator-agent';
import { executeTool } from '../tools';
import { sendMessageWithCodebaseAgentStreaming } from './codebase-agent/api';
import { sendMessageWithFileOperationsAgentStreaming } from './file-operations-agent';
import { createCurrentPageStateAgent } from './current-page-state-agent';
import { createPageAgent } from './page-agent';

const MAX_EXECUTION_STEPS = 15;

export interface ExecutionContext {
  userQuery: string;
  channelId?: string;
  projectLocation?: string;
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>;
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void;
}

export interface ExecutionResult {
  answer: string;
  executionHistory: ExecutionAction[];
  confidence: number;
  pattern?: string;
  errors?: Array<{ step: number; error: string }>;
}

/**
 * Main execution engine
 * Runs the adaptive orchestration loop
 */
export async function executeWithOrchestration(
  context: ExecutionContext
): Promise<ExecutionResult> {
  const { userQuery, channelId, projectLocation, conversationHistory, onStepUpdate } = context;
  
  console.log('[Execution Engine] Starting orchestrated execution for query:', userQuery.substring(0, 100));
  
  const executionHistory: ExecutionAction[] = [];
  const errors: Array<{ step: number; error: string }> = [];
  let currentStep = 0;
  let finalAnswer: string | undefined;
  let finalConfidence = 0;
  let finalPattern: string | undefined;
  
  // Adaptive execution loop
  while (currentStep < MAX_EXECUTION_STEPS) {
    currentStep++;
    
    console.log(`[Execution Engine] ========== Step ${currentStep} ==========`);
    
    try {
      // Step 1: Ask orchestrator what to do next
      const decision = await orchestrate(
        userQuery,
        executionHistory,
        channelId,
        projectLocation,
        conversationHistory
      );
      
      console.log('[Execution Engine] Orchestrator decision:', {
        status: decision.status,
        confidence: decision.confidence,
        whatWeKnow: decision.whatWeKnow.length,
        whatWeMissing: decision.whatWeMissing.length,
        hasFinalAnswer: !!decision.finalAnswer,
        finalAnswerLength: decision.finalAnswer?.length || 0,
        finalAnswerPreview: decision.finalAnswer?.substring(0, 150),
      });
      
      // Step 2: Check if we're done
      if (decision.status === 'done') {
        console.log('[Execution Engine] Orchestrator says DONE');
        finalAnswer = decision.finalAnswer || 'No answer provided';
        finalConfidence = decision.confidence;
        finalPattern = decision.pattern;
        break;
      }
      
      // Step 3: Check if we need clarification
      if (decision.status === 'need_clarification') {
        console.log('[Execution Engine] Orchestrator needs clarification');
        finalAnswer = `I need clarification: ${decision.clarificationNeeded}`;
        finalConfidence = decision.confidence;
        break;
      }
      
      // Step 4: Check if there's an error
      if (decision.status === 'error') {
        console.log('[Execution Engine] Orchestrator encountered error');
        errors.push({
          step: currentStep,
          error: decision.reasoning || 'Unknown orchestration error',
        });
        break;
      }
      
      // Step 5: Execute the next action
      if (!decision.nextAction) {
        console.error('[Execution Engine] No next action provided by orchestrator');
        break;
      }
      
      const action: ExecutionAction = {
        step: currentStep,
        type: decision.nextAction.type,
        name: decision.nextAction.name,
        params: decision.nextAction.params,
        reasoning: decision.nextAction.reasoning,
        timestamp: new Date(),
      };
      
      // Check for loops - prevent calling the same tool with same params more than 2 times
      const recentActions = executionHistory.slice(-3);
      const sameActionCount = recentActions.filter(a => 
        a.name === action.name && 
        JSON.stringify(a.params) === JSON.stringify(action.params)
      ).length;
      
      if (sameActionCount >= 2) {
        console.warn(`[Execution Engine] LOOP DETECTED: ${action.name} with same params called ${sameActionCount} times. Stopping execution.`);
        
        // Generate a generic fallback based on what we collected
        const toolsUsed = [...new Set(executionHistory.map(a => a.name))].join(', ');
        finalAnswer = `I encountered an issue while investigating your request. After ${executionHistory.length} steps, ` +
          `I attempted to use the same tool (${action.name}) multiple times without making progress.\n\n` +
          `Tools used: ${toolsUsed}\n\n` +
          `Please try rephrasing your question or breaking it into smaller steps.`;
        finalConfidence = 30;
        break;
      }
      
      console.log(`[Execution Engine] Executing: ${action.type} - ${action.name}`);
      console.log(`[Execution Engine] Reasoning: ${action.reasoning}`);
      
      try {
        // Execute the action based on type
        let rawResult: any;
        if (action.type === 'tool') {
          rawResult = await executeToolAction(action, channelId, projectLocation);
        } else if (action.type === 'agent') {
          rawResult = await executeAgentAction(action, channelId, projectLocation, conversationHistory);
        } else if (action.type === 'synthesis') {
          // Synthesis is handled by the orchestrator itself
          rawResult = { success: true, message: 'Synthesis step' };
        }
        
        // Convert result to text format for AI understanding
        action.result = convertResultToText(rawResult);
        
        console.log('[Execution Engine] Action completed:', {
          success: rawResult?.success !== false,
          hasData: !!rawResult?.data,
          resultLength: action.result?.length || 0,
        });
      } catch (error) {
        console.error('[Execution Engine] Action execution error:', error);
        action.error = error instanceof Error ? error.message : String(error);
        errors.push({
          step: currentStep,
          error: action.error,
        });
      }
      
      // Add to history
      executionHistory.push(action);
      
      // Notify frontend of progress
      if (onStepUpdate) {
        onStepUpdate({
          type: 'step',
          data: {
            step: currentStep,
            action: action.name,
            reasoning: action.reasoning,
            whatWeKnow: decision.whatWeKnow,
            whatWeMissing: decision.whatWeMissing,
            confidence: decision.confidence,
          },
        });
      }
      
      // Safety check: if we got an error and confidence is low, consider stopping
      if (action.error && decision.confidence < 50) {
        console.log('[Execution Engine] Error with low confidence, stopping');
        break;
      }
      
    } catch (error) {
      console.error('[Execution Engine] Loop iteration error:', error);
      errors.push({
        step: currentStep,
        error: error instanceof Error ? error.message : String(error),
      });
      break;
    }
  }
  
  // Check if we hit max steps
  if (currentStep >= MAX_EXECUTION_STEPS) {
    console.log('[Execution Engine] Max steps reached');
    if (!finalAnswer) {
      finalAnswer = 'I was unable to complete the analysis within the maximum number of steps. The investigation may be too complex or requires a different approach.';
    }
  }
  
  // If we still don't have an answer, create a default one
  if (!finalAnswer) {
    console.log('[Execution Engine] No final answer, creating default');
    finalAnswer = 'I was unable to complete the analysis. Please try rephrasing your question or provide more context.';
  }
  
  console.log('[Execution Engine] Execution complete:', {
    totalSteps: executionHistory.length,
    hasAnswer: !!finalAnswer,
    errors: errors.length,
  });
  
  // Notify frontend of completion
  if (onStepUpdate) {
    onStepUpdate({
      type: 'complete',
      data: {
        answer: finalAnswer,
        totalSteps: executionHistory.length,
        confidence: finalConfidence,
        pattern: finalPattern,
      },
    });
  }
  
  return {
    answer: finalAnswer,
    executionHistory,
    confidence: finalConfidence,
    pattern: finalPattern,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Execute a tool action
 */
async function executeToolAction(
  action: ExecutionAction,
  channelId?: string,
  projectLocation?: string
): Promise<any> {
  const toolName = action.name;
  const params = action.params || {};
  
  // Add channelId to params if not present
  if (channelId && !params.channelId) {
    params.channelId = channelId;
  }
  
  // Add projectLocation for file system tools if not present
  if (projectLocation && !params.projectLocation && isFileSystemTool(toolName)) {
    params.projectLocation = projectLocation;
  }
  
  console.log(`[Execution Engine] Calling tool: ${toolName}`, params);
  
  try {
    const result = await executeTool(toolName, params);
    return result;
  } catch (error) {
    console.error(`[Execution Engine] Tool execution error for ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute an agent action
 */
async function executeAgentAction(
  action: ExecutionAction,
  channelId?: string,
  projectLocation?: string,
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>
): Promise<any> {
  const agentName = action.name;
  const params = action.params || {};
  
  console.log(`[Execution Engine] Calling agent: ${agentName}`);
  
  try {
    switch (agentName) {
      case 'current-page-state-agent': {
        const agent = createCurrentPageStateAgent(channelId, projectLocation);
        const app = agent.compile();
        const result = await app.invoke({
          channelId,
          projectLocation,
        } as any);
        return { success: true, data: result };
      }
      
      case 'page-agent': {
        const pageFiles = params.pageFiles || {};
        const agent = createPageAgent();
        const app = agent.compile();
        const result = await app.invoke({
          pageFiles,
          userQuery: params.query || '',
        } as any);
        return { success: true, data: result };
      }
      
      case 'codebase-agent': {
        const query = params.query || action.params?.message || '';
        const result = await sendMessageWithCodebaseAgentStreaming(
          query,
          conversationHistory || [],
          undefined // onStepUpdate - agents handle their own streaming
        );
        return { success: true, data: result };
      }
      
      case 'file-operations-agent': {
        const query = params.query || action.params?.message || '';
        // Convert conversation history format if needed
        const formattedHistory = conversationHistory?.map(msg => ({
          role: msg.role,
          content: msg.parts[0]?.text || '',
        })) || [];
        const result = await sendMessageWithFileOperationsAgentStreaming(
          query,
          formattedHistory,
          channelId,
          projectLocation,
          undefined // onStepUpdate - agents handle their own streaming
        );
        return { success: true, data: result };
      }
      
      default:
        console.warn(`[Execution Engine] Unknown agent: ${agentName}`);
        return {
          success: false,
          error: `Unknown agent: ${agentName}`,
        };
    }
  } catch (error) {
    console.error(`[Execution Engine] Agent execution error for ${agentName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if a tool is a file system tool
 */
function isFileSystemTool(toolName: string): boolean {
  const fileSystemTools = [
    'find_files',
    'read_file',
    'edit_file',
    'write_file',
    'append_file',
    'grep_files',
    'list_directory',
    'execute_command',
    'echo_command',
    'sed_command',
  ];
  return fileSystemTools.includes(toolName);
}

/**
 * Convert any result to a human-readable text format for AI understanding
 * Instead of passing structured objects, we pass text descriptions that the AI can naturally understand
 */
function convertResultToText(result: any): string {
  if (!result) {
    return 'No result returned';
  }
  
  // If it's already a string, return it
  if (typeof result === 'string') {
    return result;
  }
  
  // Handle error cases
  if (result.success === false) {
    return `Error: ${result.error || result.message || 'Unknown error'}`;
  }
  
  // Convert to JSON with pretty formatting for AI readability
  try {
    const jsonText = JSON.stringify(result, null, 2);
    
    // Add a descriptive header to help AI understand what this is
    let description = 'Result:\n';
    
    // Add specific descriptions for known result types
    if (result.success && result.data) {
      const data = result.data;
      
      // Component tree
      if (data.componentTree) {
        description = 'Component Tree Result:\n';
      }
      // Network data
      else if (data.requests || data.networkRequests) {
        const count = (data.requests || data.networkRequests || []).length;
        description = `Network Data Result (${count} requests):\n`;
      }
      // Console data
      else if (data.logs !== undefined || data.errors !== undefined) {
        const logCount = (data.logs || []).length;
        const errorCount = (data.errors || []).length;
        description = `Console Data Result (${logCount} logs, ${errorCount} errors):\n`;
      }
      // Info/Variables data
      else if (data.variables || data.appInfo) {
        description = 'Application Info Result:\n';
      }
      // Timeline data
      else if (data.events || data.navigation) {
        description = 'Timeline Data Result:\n';
      }
      // Storage data
      else if (data.storage || data.localStorage) {
        description = 'Storage Data Result:\n';
      }
    }
    
    // Limit to 50K characters to keep context manageable but include enough data
    // Network responses can be large, so we need a generous limit
    const maxLength = 50000;
    if (jsonText.length > maxLength) {
      return description + jsonText.substring(0, maxLength) + '\n\n... (response truncated, showing first 50K characters)';
    }
    
    return description + jsonText;
  } catch (error) {
    // If JSON.stringify fails, convert to string
    return `Result (non-JSON): ${String(result)}`;
  }
}

