/**
 * File Operations Agent using LangGraph-style state machine
 * Handles multi-step file operations: find, read, write, edit files
 * Automatically chains operations (e.g., find then edit)
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { GoogleGenAI } from '@google/genai';
import { createGeminiClient } from '../gemini';
import { executeTool, getAllToolSchemas } from '../tools';
import { SYSTEM_INSTRUCTION_WITH_TOOLS, buildContinuationPrompt, ContinuationPromptContext } from '../prompts';
import { getAISeed } from '../config';

/**
 * Agent state
 */
export interface FileOperationsAgentState {
  messages: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string; functionCall?: any; functionResponse?: any }> }>;
  toolResults: Array<{ name: string; result: any }>;
  channelId?: string;
  projectLocation?: string;
  researchSteps: Array<{ id: string; description: string; status: string }>;
  widgetSelection?: { widgetId: string; widgetName: string };
  maxIterations?: number;
  iterationCount: number;
  finalResponse?: string;
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void; // Callback for streaming updates
  [key: string]: any; // Index signature for LangGraph compatibility
}

/**
 * Agent node: Calls Gemini and decides next action
 */
async function agentNode(state: FileOperationsAgentState): Promise<Partial<FileOperationsAgentState>> {
  const { messages, toolResults, channelId, projectLocation, maxIterations = 15 } = state;
  
  console.log(`[FileOperationsAgent] Agent iteration ${state.iterationCount + 1}/${maxIterations}`);
  
  // Add agent iteration step
  const updatedResearchSteps = [...state.researchSteps];
  const agentStepId = `agent-iteration-${state.iterationCount + 1}`;
  updatedResearchSteps.push({
    id: agentStepId,
    description: `Agent thinking (iteration ${state.iterationCount + 1})...`,
    status: 'in-progress'
  });
  
  // Check iteration limit
  if (state.iterationCount >= maxIterations) {
    console.log(`[FileOperationsAgent] Reached max iterations`);
    const stepIndex = updatedResearchSteps.findIndex(s => s.id === agentStepId);
    if (stepIndex >= 0) {
      updatedResearchSteps[stepIndex].status = 'completed';
      updatedResearchSteps[stepIndex].description = `Agent thinking (iteration ${state.iterationCount + 1}) - Max iterations reached`;
    }
    return {
      finalResponse: 'Maximum iterations reached. Please try rephrasing your request.',
      researchSteps: updatedResearchSteps,
    };
  }

  const ai = createGeminiClient();
  const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
  const tools = getAllToolSchemas();

  // Build config
  const config: any = {
    temperature: 0.7,
    thinkingConfig: { thinkingBudget: 0 },
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION_WITH_TOOLS }]
    },
    tools: tools.length > 0 ? tools : undefined,
    seed: getAISeed(),
  };

  // Call Gemini
  const response = await ai.models.generateContentStream({
    model: modelName,
    config,
    contents: messages,
  });

  // Collect response
  let fullText = '';
  const functionCalls: any[] = [];
  const seenCalls = new Set<string>();

  for await (const chunk of response) {
    if (chunk.candidates && Array.isArray(chunk.candidates)) {
      for (const candidate of chunk.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.functionCall) {
              const callKey = `${part.functionCall.name}_${JSON.stringify(part.functionCall.args || {})}`;
              if (!seenCalls.has(callKey)) {
                seenCalls.add(callKey);
                functionCalls.push({
                  name: part.functionCall.name,
                  args: part.functionCall.args || {}
                });
              }
            }
            if (part.text && typeof part.text === 'string') {
              fullText += part.text;
            }
          }
        }
      }
    }
  }

  // Build response message
  const responseParts: Array<{ text?: string; functionCall?: any }> = [];
  if (fullText) {
    responseParts.push({ text: fullText });
  }
  for (const fc of functionCalls) {
    responseParts.push({ functionCall: fc });
  }

  const newMessages = [
    ...messages,
    {
      role: 'model' as const,
      parts: responseParts,
    }
  ];

  // Update agent step status based on whether we're calling tools or responding
  const stepIndex = updatedResearchSteps.findIndex(s => s.id === agentStepId);
  if (stepIndex >= 0) {
    if (functionCalls.length > 0) {
      updatedResearchSteps[stepIndex].status = 'completed';
      updatedResearchSteps[stepIndex].description = `Agent thinking (iteration ${state.iterationCount + 1}) - Deciding to use ${functionCalls.length} tool(s)`;
    } else if (fullText) {
      updatedResearchSteps[stepIndex].status = 'completed';
      updatedResearchSteps[stepIndex].description = `Agent thinking (iteration ${state.iterationCount + 1}) - Providing response`;
    }
  }

  // Emit step update if callback is provided
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedResearchSteps }
    });
  }

  return {
    messages: newMessages,
    iterationCount: state.iterationCount + 1,
    researchSteps: updatedResearchSteps,
  };
}

/**
 * Tool execution node
 */
async function toolNode(state: FileOperationsAgentState): Promise<Partial<FileOperationsAgentState>> {
  const { messages, channelId, projectLocation, researchSteps } = state;
  
  // Extract function calls from last message
  const lastMessage = messages[messages.length - 1];
  const functionCalls = lastMessage.parts
    ?.filter(p => p.functionCall)
    .map(p => p.functionCall) || [];

  if (functionCalls.length === 0) {
    return {};
  }

  console.log(`[FileOperationsAgent] Executing ${functionCalls.length} tool(s)`);

  // Execute tools
  const toolResults: Array<{ name: string; result: any }> = [];
  const updatedResearchSteps = [...researchSteps];

  for (let i = 0; i < functionCalls.length; i++) {
    const funcCall = functionCalls[i];
    
    // Update research steps
    const stepDesc = funcCall.name === 'get_ui_layer_data'
      ? `Retrieving ${funcCall.args?.dataType || 'UI layer'} data...`
      : funcCall.name === 'select_widget'
      ? `Selecting widget: ${funcCall.args?.widgetName || '...'}`
      : `Executing ${funcCall.name}...`;
    
    const stepId = `step-${Date.now()}-${i}`;
    updatedResearchSteps.push({
      id: stepId,
      description: stepDesc,
      status: 'in-progress'
    });

    try {
      // Auto-inject channelId and projectLocation
      const args = { ...funcCall.args };
      if (channelId && !args.channelId) {
        args.channelId = channelId;
      }
      
      const fileSystemTools = [
        'execute_command', 'echo_command', 'sed_command', 'read_file',
        'write_file', 'append_file', 'grep_files', 'find_files',
        'list_directory', 'edit_file',
      ];
      
      if (fileSystemTools.includes(funcCall.name) && !args.projectLocation) {
        // Use provided projectLocation, or auto-generate from channelId
        const effectiveProjectLocation = projectLocation || 
          (channelId ? `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app` : undefined);
        
        if (effectiveProjectLocation) {
          args.projectLocation = effectiveProjectLocation;
          console.log(`[FileOperationsAgent] Auto-injected projectLocation: ${effectiveProjectLocation}`);
        }
      }

      console.log(`[FileOperationsAgent] Executing tool: ${funcCall.name} with args:`, JSON.stringify(args, null, 2));
      const result = await executeTool(funcCall.name, args);
      console.log(`[FileOperationsAgent] Tool result:`, JSON.stringify(result, null, 2));

      const responseData = result.success !== false ? (result.data || result) : result;
      toolResults.push({
        name: funcCall.name,
        result: responseData,
      });

      // Update step status
      const stepIndex = updatedResearchSteps.findIndex(s => s.id === stepId);
      if (stepIndex >= 0) {
        updatedResearchSteps[stepIndex].status = 'completed';
        if (funcCall.name === 'select_widget' && responseData?.widgetName) {
          updatedResearchSteps[stepIndex].description = `Selected widget: ${responseData.widgetName}`;
        }
      }

    } catch (error) {
      console.error(`[FileOperationsAgent] Error executing tool ${funcCall.name}:`, error);
      toolResults.push({
        name: funcCall.name,
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Update step status
      const stepIndex = updatedResearchSteps.findIndex(s => s.id === stepId);
      if (stepIndex >= 0) {
        updatedResearchSteps[stepIndex].status = 'completed';
        updatedResearchSteps[stepIndex].description += ` (Error: ${error instanceof Error ? error.message : 'Unknown'})`;
      }
    }
  }

  // Add function results as messages
  const functionResultParts = toolResults.map(tr => ({
    functionResponse: {
      name: tr.name,
      response: tr.result,
    }
  }));

  // Find the original user request (first user message)
  const originalUserMessage = messages.find(m => m.role === 'user')?.parts?.find(p => p.text)?.text || '';
  
  // Check if we have file-related tool results and extract file paths
  const filePaths = toolResults
    .filter(tr => {
      // Check for filePath (from read_file, edit_file, etc.) or files array (from find_files)
      return tr.result?.filePath || tr.result?.files || (tr.name === 'find_files' && tr.result?.data?.files);
    })
    .map(tr => {
      // Priority: filePath > files array > data.files (from find_files)
      if (tr.result?.filePath) return tr.result.filePath;
      if (Array.isArray(tr.result?.files) && tr.result.files.length > 0) return tr.result.files[0];
      if (Array.isArray(tr.result?.data?.files) && tr.result.data.files.length > 0) return tr.result.data.files[0];
      return null;
    })
    .filter(Boolean) as string[];
  
  // Check if find_files has been called
  const hasFindFiles = toolResults.some(tr => tr.name === 'find_files');
  
  // Check for failed operations that shouldn't be retried
  const failedUILayerData = toolResults.filter(tr => 
    tr.name === 'get_ui_layer_data' && 
    tr.result?.success === false && 
    tr.result?.error?.includes('No data found')
  );
  
  // Check if we successfully got component tree data
  const hasComponentTree = toolResults.some(tr => 
    tr.name === 'get_ui_layer_data' && 
    tr.result?.success === true && 
    tr.result?.componentTree
  );
  
  // Find component tree result and read file result for context
  const componentTreeResult = toolResults.find(tr => tr.name === 'get_ui_layer_data' && tr.result?.success === true && tr.result?.componentTree);
  const readFileResult = toolResults.find(tr => tr.name === 'read_file');
  
  // Build continuation prompt using the centralized prompt builder
  const promptContext: ContinuationPromptContext = {
    originalUserMessage,
    toolResults,
    filePaths,
    hasComponentTree,
    hasFindFiles,
    failedUILayerData,
    componentTreeResult,
    readFileResult,
  };
  
  const continuationPrompt = buildContinuationPrompt(promptContext);

  const newMessages = [
    ...messages,
    {
      role: 'model' as const,
      parts: functionResultParts,
    },
    {
      role: 'user' as const,
      parts: [{ text: continuationPrompt }]
    }
  ];

  // Extract widget selection
  let widgetSelection: { widgetId: string; widgetName: string } | undefined;
  for (const tr of toolResults) {
    if (tr.name === 'select_widget' && tr.result?.widgetId && tr.result?.widgetName) {
      widgetSelection = {
        widgetId: tr.result.widgetId,
        widgetName: tr.result.widgetName,
      };
      break;
    }
  }

  // Emit step update if callback is provided
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedResearchSteps }
    });
  }

  return {
    messages: newMessages,
    toolResults: [...state.toolResults, ...toolResults],
    researchSteps: updatedResearchSteps,
    widgetSelection,
  };
}

/**
 * Decision node: Check if we should continue or end
 */
function shouldContinue(state: FileOperationsAgentState): string {
  const lastMessage = state.messages[state.messages.length - 1];
  const hasFunctionCalls = lastMessage.parts?.some(p => p.functionCall) || false;
  
  if (hasFunctionCalls) {
    return 'tools';
  }
  
  // If we have text in the last message, we're done
  if (lastMessage.parts?.some(p => p.text)) {
    return 'end';
  }
  
  return 'end';
}

/**
 * Create the File Operations Agent
 */
export function createFileOperationsAgent(
  apiKey?: string,
  modelName: string = 'gemini-2.5-flash-lite',
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<FileOperationsAgentState>({
    channels: {
      messages: {
        reducer: (x: FileOperationsAgentState['messages'], y?: FileOperationsAgentState['messages']) => 
          y !== undefined ? y : (x || []),
      },
      toolResults: {
        reducer: (x: FileOperationsAgentState['toolResults'], y?: FileOperationsAgentState['toolResults']) => 
          y !== undefined ? y : (x || []),
      },
      researchSteps: {
        reducer: (x: FileOperationsAgentState['researchSteps'], y?: FileOperationsAgentState['researchSteps']) => 
          y !== undefined ? y : (x || []),
      },
      iterationCount: {
        reducer: (x: number, y?: number) => 
          y !== undefined ? y : (x ?? 0),
      },
      channelId: {
        reducer: (x?: string, y?: string) => 
          y !== undefined ? y : x,
      },
      projectLocation: {
        reducer: (x?: string, y?: string) => 
          y !== undefined ? y : x,
      },
      maxIterations: {
        reducer: (x?: number, y?: number) => 
          y !== undefined ? y : (x ?? 15),
      },
      finalResponse: {
        reducer: (x?: string, y?: string) => 
          y !== undefined ? y : x,
      },
      widgetSelection: {
        reducer: (x?: FileOperationsAgentState['widgetSelection'], y?: FileOperationsAgentState['widgetSelection']) => 
          y !== undefined ? y : x,
      },
      onStepUpdate: {
        reducer: (x?: FileOperationsAgentState['onStepUpdate'], y?: FileOperationsAgentState['onStepUpdate']) => 
          y !== undefined ? y : x,
      },
    },
  } as any) // Type assertion to work around LangGraph's strict typing
    .addNode('agent', agentNode as any)
    .addNode('tools', toolNode as any)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', shouldContinue as any, {
      tools: 'tools',
      end: END,
    })
    .addEdge('tools', 'agent'); // Loop back to agent after tool execution

  return workflow;
}

/**
 * Send a message using the File Operations Agent (streaming version with step updates)
 */
export async function sendMessageWithFileOperationsAgentStreaming(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  channelId?: string,
  projectLocation?: string,
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void,
  apiKey?: string,
  modelName?: string
): Promise<{ message: string; success: boolean; researchSteps?: Array<{ id: string; description: string; status: string }>; widgetSelection?: { widgetId: string; widgetName: string } }> {
  
  const graph = createFileOperationsAgent(apiKey, modelName, channelId, projectLocation);
  
  // Build initial messages
  const messages: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [
    ...history.map(msg => ({
      role: (msg.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: msg.content }]
    })),
    {
      role: 'user' as const,
      parts: [{ text: message }]
    }
  ];
  
  const initialState: FileOperationsAgentState = {
    messages,
    toolResults: [],
    researchSteps: [],
    channelId,
    projectLocation,
    maxIterations: 15,
    iterationCount: 0,
    onStepUpdate, // Pass callback through state
  };
  
  // Compile and run
  const app = graph.compile();
  const finalState = await app.invoke(initialState as any) as FileOperationsAgentState;
  
  // Emit final update
  if (onStepUpdate) {
    onStepUpdate({
      type: 'complete',
      data: { 
        researchSteps: finalState.researchSteps,
        message: finalState.messages[finalState.messages.length - 1]?.parts?.find(p => p.text)?.text || finalState.finalResponse
      }
    });
  }
  
  // Extract final response
  const finalMessages = finalState.messages;
  const lastMessage = finalMessages[finalMessages.length - 1];
  const messageText = lastMessage.parts?.find(p => p.text)?.text || finalState.finalResponse || 'Task completed successfully.';
  
  return {
    message: messageText,
    success: true,
    researchSteps: finalState.researchSteps.length > 0 ? finalState.researchSteps : undefined,
    widgetSelection: finalState.widgetSelection,
  };
}

/**
 * Send a message using the File Operations Agent
 */
export async function sendMessageWithFileOperationsAgent(
  message: string,
  history: Array<{ role: string; content: string }> = [],
  channelId?: string,
  projectLocation?: string,
  apiKey?: string,
  modelName?: string
): Promise<{ message: string; success: boolean; researchSteps?: Array<{ id: string; description: string; status: string }>; widgetSelection?: { widgetId: string; widgetName: string } }> {
  
  // Use streaming version without callback (non-streaming behavior)
  return sendMessageWithFileOperationsAgentStreaming(
    message,
    history,
    channelId,
    projectLocation,
    undefined, // No callback = non-streaming
    apiKey,
    modelName
  );
}

