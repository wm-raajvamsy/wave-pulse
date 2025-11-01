/**
 * File Operations Agent using LangGraph-style state machine
 * Handles multi-step file operations: find, read, write, edit files
 * Automatically chains operations (e.g., find then edit)
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { GoogleGenAI } from '@google/genai';
import { createGeminiClient } from '../gemini';
import { executeTool, getAllToolSchemas } from '../tools';
import { SYSTEM_INSTRUCTION_WITH_TOOLS } from '../prompts';

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
  const mentionsSelectedWidget = originalUserMessage.toLowerCase().includes('selected widget') || 
                                   originalUserMessage.toLowerCase().includes('the widget');
  
  // Detect if user mentioned a file name (common patterns: ".component.js", ".js", ".tsx", etc.)
  const mentionsFile = /\.(component\.js|js|tsx|ts|jsx|component\.tsx?)[\s"'`]/.test(originalUserMessage) ||
                       originalUserMessage.toLowerCase().includes('component.js') ||
                       originalUserMessage.toLowerCase().includes('find') && originalUserMessage.toLowerCase().includes('file');
  
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
  
  // Create a prompt that reminds the agent of the original request and file paths
  let continuationPrompt = '';
  if (originalUserMessage) {
    continuationPrompt = `The user's original request was: "${originalUserMessage}". `;
  }
  
  // Prevent retrying failed get_ui_layer_data calls
  if (failedUILayerData.length > 0 && !hasComponentTree) {
    continuationPrompt += `WARNING: get_ui_layer_data failed with "No data found for this channelId". Do NOT retry this call. The component tree data is not currently available. If you already have widget information from a previous successful get_ui_layer_data call, use that. Otherwise, proceed with the file operations using the widget name you identified. `;
  }
  
  // If user mentioned a file but find_files hasn't been called, remind agent
  if (mentionsFile && !hasFindFiles && filePaths.length === 0) {
    continuationPrompt += `CRITICAL: The user mentioned a file. You MUST first call find_files to locate the exact file path before attempting to read or edit it. Do NOT guess the file path - use find_files to get the correct full path. `;
  }
  
  // If user mentioned "selected widget" but we haven't gotten component tree yet and it hasn't failed
  if (mentionsSelectedWidget && !hasComponentTree && failedUILayerData.length === 0) {
    continuationPrompt += `CRITICAL: The user mentioned "selected widget". You MUST first call get_ui_layer_data with dataType "components" to get the component tree and identify which widget is currently selected. `;
  }
  
  // Check if we have component tree data from get_ui_layer_data
  const componentTreeResult = toolResults.find(tr => tr.name === 'get_ui_layer_data' && tr.result?.success === true && tr.result?.componentTree);
  if (componentTreeResult && mentionsSelectedWidget) {
    const componentTree = componentTreeResult.result.componentTree;
    // Try to find selected widget in the tree
    const findSelectedWidget = (node: any): any => {
      if (node.selected === true) return node;
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const found = findSelectedWidget(child);
          if (found) return found;
        }
      }
      return null;
    };
    const selectedWidget = componentTree ? findSelectedWidget(componentTree) : null;
    
    if (selectedWidget) {
      const captionValue = selectedWidget.properties?.caption ?? '';
      continuationPrompt += `IMPORTANT: The selected widget in the component tree is "${selectedWidget.name}" (id: ${selectedWidget.id}). `;
      if (captionValue !== undefined) {
        continuationPrompt += `This widget already has a caption attribute with value "${captionValue}". When editing the file, you MUST search for the EXISTING caption attribute pattern (e.g., caption="${captionValue}" or caption="") and replace ONLY that attribute value. DO NOT search for name="${selectedWidget.name}" and add a new caption - this will create duplicates. `;
      }
    } else {
      continuationPrompt += `REMINDER: You have component tree data from get_ui_layer_data. Look for widgets with "selected: true" or check which widget is currently selected in the tree. Use that widget's "name" property to find it in the file content. `;
    }
  }
  
  // Check if read_file was called and we're dealing with widget property edits (caption, show, etc.)
  const readFileResult = toolResults.find(tr => tr.name === 'read_file');
  const mentionsPropertyEdit = originalUserMessage.toLowerCase().match(/\b(caption|show|disabled|name|classname)\s*=/i) ||
                               originalUserMessage.toLowerCase().includes('modify') ||
                               originalUserMessage.toLowerCase().includes('change') ||
                               originalUserMessage.toLowerCase().includes('set');
  
  if (readFileResult && readFileResult.result?.content && mentionsPropertyEdit) {
    const content = readFileResult.result.content;
    // Extract widget name if available from component tree
    const componentTreeResult = toolResults.find(tr => tr.name === 'get_ui_layer_data' && tr.result?.success === true && tr.result?.componentTree);
    if (componentTreeResult) {
      const componentTree = componentTreeResult.result.componentTree;
      const findSelectedWidget = (node: any): any => {
        if (node.selected === true) return node;
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            const found = findSelectedWidget(child);
            if (found) return found;
          }
        }
        return null;
      };
      const selectedWidget = componentTree ? findSelectedWidget(componentTree) : null;
      if (selectedWidget && content.includes(`name="${selectedWidget.name}"`)) {
        // Check what properties already exist in the file for this widget
        const widgetPattern = new RegExp(`name="${selectedWidget.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`, 'g');
        const match = content.match(widgetPattern);
        if (match && match[0]) {
          const widgetTag = match[0];
          // Check for common attributes that might already exist
          const existingAttrs = ['caption', 'show', 'disabled', 'name', 'classname'].filter(attr => 
            widgetTag.includes(`${attr}=`)
          );
          
          if (existingAttrs.length > 0) {
            continuationPrompt += `CRITICAL: The file content shows that the widget name="${selectedWidget.name}" already has these attributes: ${existingAttrs.join(', ')}. When modifying any property, you MUST search for the EXISTING attribute pattern (e.g., ${existingAttrs.map(a => `${a}="..."`).join(', ')}) and replace ONLY that attribute value. Do NOT search for name="${selectedWidget.name}" and add a new attribute - this creates duplicate attributes. Always replace existing attributes, never add new ones. `;
          }
        }
      }
    }
  }
  
  if (filePaths.length > 0) {
    continuationPrompt += `CRITICAL: The file paths from previous tool results are: ${filePaths.join(', ')}. You MUST use these EXACT file paths (copy them verbatim) for ANY file operations like read_file, edit_file, or write_file. Do NOT modify, shorten, or guess these paths. Copy the entire path exactly as shown. `;
  } else if (mentionsFile && !hasFindFiles) {
    continuationPrompt += `IMPORTANT: You need to call find_files first to get the exact file path. The user mentioned a file, but you don't have the file path yet. `;
  }
  
  continuationPrompt += 'Based on the tool results above, continue with the next steps to complete the request. If all steps are complete, provide a final response confirming completion.';
  
  if (!originalUserMessage && filePaths.length === 0) {
    continuationPrompt = 'Continue with the next steps if needed, or provide a final response.';
  }

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

