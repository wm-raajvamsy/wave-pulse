/// <reference types="node" />

import { GoogleGenAI, Type } from '@google/genai';
import { GeminiToolSchema } from '../types';
import { executeTool } from './tools';
import { 
  SYSTEM_INSTRUCTION_WITH_TOOLS, 
  FINAL_RESPONSE_PROMPT, 
  FINAL_RESPONSE_SYSTEM_INSTRUCTION 
} from './prompts';

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

// Chat service using Gemini with structured JSON output and function calling
export class GeminiChatService {
  private ai: GoogleGenAI;
  private modelName: string;
  private chatHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
  private tools: GeminiToolSchema[] = [];

  constructor(apiKey?: string) {
    this.ai = createGeminiClient(apiKey);
    // Use gemini-flash-lite-latest or gemini-2.5-flash-lite
    this.modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
  }

  /**
   * Set tools for function calling
   */
  setTools(tools: GeminiToolSchema[]) {
    this.tools = tools;
  }

  async sendMessage(
    message: string, 
    history: Array<{ role: string; content: string }> = [],
    tools?: GeminiToolSchema[],
    channelId?: string
  ): Promise<{ message: string; success: boolean; researchSteps?: Array<{ id: string; description: string; status: string }>; widgetSelection?: { widgetId: string; widgetName: string } }> {
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

      // Use provided tools or default tools
      const activeTools = tools || this.tools;

      // Configuration with optional tools
      const config: any = {
        temperature: 0,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      };

      // Add system instruction to encourage tool usage when relevant
      if (activeTools.length > 0) {
        config.systemInstruction = {
          parts: [{ text: SYSTEM_INSTRUCTION_WITH_TOOLS }]
        };
        // Include tools in config
        config.tools = activeTools;
      } else {
        // Only set responseMimeType if no tools are provided (tools require different response format)
        config.responseMimeType = 'application/json' as const;
      }

      // Generate content stream
      const response = await this.ai.models.generateContentStream({
        model: this.modelName,
        config,
        contents,
      });

      // Collect all chunks and handle function calls
      let fullText = '';
      const functionCalls: any[] = [];
      const seenFunctionCalls = new Set<string>(); // Track to avoid duplicates

      for await (const chunk of response) {
        // Debug: Log chunk structure to understand what we're receiving
        // Uncomment to debug function call structure
        if (process.env.NODE_ENV === 'development' && (!chunk.text || chunk.functionCalls || (chunk.parts && chunk.parts.some((p: any) => p.functionCall)))) {
          console.log('Function call chunk:', JSON.stringify(chunk, null, 2));
        }
        
        // Check for function calls in candidates (actual Gemini API response format)
        if (chunk.candidates && Array.isArray(chunk.candidates)) {
          for (const candidate of chunk.candidates) {
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
              for (const part of candidate.content.parts) {
                if (part.functionCall) {
                  // Create unique key to avoid duplicates
                  const callKey = `${part.functionCall.name}_${JSON.stringify(part.functionCall.args || {})}`;
                  if (!seenFunctionCalls.has(callKey)) {
                    seenFunctionCalls.add(callKey);
                    functionCalls.push({
                      name: part.functionCall.name,
                      args: part.functionCall.args || {}
                    });
                  }
                }
              }
            }
          }
        }
        
        // Check for function calls in different possible formats (fallback)
        if (chunk.functionCalls && Array.isArray(chunk.functionCalls)) {
          for (const funcCall of chunk.functionCalls) {
            // Normalize function call structure
            if (typeof funcCall === 'object' && funcCall.name) {
              const callKey = `${funcCall.name}_${JSON.stringify(funcCall.args || {})}`;
              if (!seenFunctionCalls.has(callKey)) {
                seenFunctionCalls.add(callKey);
                functionCalls.push({
                  name: funcCall.name,
                  args: funcCall.args || {}
                });
              }
            }
          }
        }
        // Also check parts array for function calls (Gemini sometimes returns them in parts)
        if (chunk.parts && Array.isArray(chunk.parts)) {
          for (const part of chunk.parts) {
            if (part.functionCall) {
              const callKey = `${part.functionCall.name}_${JSON.stringify(part.functionCall.args || {})}`;
              if (!seenFunctionCalls.has(callKey)) {
                seenFunctionCalls.add(callKey);
                functionCalls.push({
                  name: part.functionCall.name,
                  args: part.functionCall.args || {}
                });
              }
            }
            // Sometimes function calls are nested differently (check if not already processed)
            if (!part.functionCall && part.type === 'functionCall') {
              const funcCall = part;
              if (funcCall.name) {
                const callKey = `${funcCall.name}_${JSON.stringify(funcCall.args || funcCall.parameters || {})}`;
                if (!seenFunctionCalls.has(callKey)) {
                  seenFunctionCalls.add(callKey);
                  functionCalls.push({
                    name: funcCall.name,
                    args: funcCall.args || funcCall.parameters || {}
                  });
                }
              }
            }
          }
        }
        // Collect text chunks from multiple possible locations
        // Prefer candidates format (primary), fallback to chunk.text to avoid duplicates
        if (chunk.candidates && Array.isArray(chunk.candidates) && chunk.candidates.length > 0) {
          // Primary: collect from candidates
          for (const candidate of chunk.candidates) {
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
              for (const part of candidate.content.parts) {
                // Only collect text, not function calls
                if (part.text && typeof part.text === 'string' && !part.functionCall) {
                  fullText += part.text;
                }
              }
            }
          }
        } else if (chunk.text && typeof chunk.text === 'string') {
          // Fallback: only use chunk.text if no candidates found
          fullText += chunk.text;
        }
      }
      
      // If we found function calls, we should prioritize them over text
      if (functionCalls.length > 0) {
        // Clear any partial text since we'll get a new response after function execution
        fullText = '';
      }

      // Track research steps for tool execution
      const researchSteps: Array<{ id: string; description: string; status: string }> = [];
      
      // Declare functionResults outside the block so it's accessible later
      let functionResults: any[] = [];
      
      // If there are function calls, execute them and get results
      if (functionCalls.length > 0) {
        console.log(`[Gemini] Detected ${functionCalls.length} function call(s)`, functionCalls);
        
        // Add pending steps
        functionCalls.forEach((funcCall, index) => {
          const stepDesc = funcCall.name === 'get_ui_layer_data' 
            ? `Retrieving ${funcCall.args?.dataType || 'UI layer'} data...`
            : funcCall.name === 'select_widget'
            ? `Selecting widget: ${funcCall.args?.widgetName || '...'}`
            : `Executing ${funcCall.name}...`;
          researchSteps.push({
            id: `step-${index}`,
            description: stepDesc,
            status: 'in-progress'
          });
        });
        
        // Execute all function calls (inject channelId if available)
        functionResults = await Promise.all(
          functionCalls.map(async (funcCall, index) => {
            try {
              // Update step to in-progress
              if (researchSteps[index]) {
                researchSteps[index].status = 'in-progress';
              }
              
              // Auto-inject channelId if available and not already provided
              const args = funcCall.args ? { ...funcCall.args } : {};
              if (channelId && !args.channelId) {
                args.channelId = channelId;
                console.log(`[Gemini] Auto-injected channelId: ${channelId}`);
              }
              
              console.log(`[Gemini] Executing tool: ${funcCall.name} with args:`, JSON.stringify(args, null, 2));
              const result = await executeTool(funcCall.name, args);
              console.log(`[Gemini] Tool result:`, JSON.stringify(result, null, 2));
              
              // Update step to completed
              if (researchSteps[index]) {
                researchSteps[index].status = 'completed';
                // Update description for widget selection
                if (funcCall.name === 'select_widget' && result.success && result.data?.widgetName) {
                  researchSteps[index].description = `Selected widget: ${result.data.widgetName}`;
                }
              }
              
              // Return the data or the full result
              const responseData = result.success !== false ? (result.data || result) : result;
              
              return {
                functionResponse: {
                  name: funcCall.name,
                  response: responseData,
                },
              };
            } catch (error) {
              console.error(`[Gemini] Error executing tool ${funcCall.name}:`, error);
              
              // Update step to show error
              if (researchSteps[index]) {
                researchSteps[index].status = 'completed';
                researchSteps[index].description += ` (Error: ${error instanceof Error ? error.message : 'Unknown error'})`;
              }
              
              return {
                functionResponse: {
                  name: funcCall.name,
                  response: {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                  },
                },
              };
            }
          })
        );

        // Add function results to contents and make another request
        // Format function results as parts array for Gemini API
        const functionResultParts = functionResults.map(result => ({
          functionResponse: result.functionResponse
        }));
        
        const updatedContents = [
          ...contents,
          {
            role: 'model' as const,
            parts: functionResultParts,
          },
          {
            role: 'user' as const,
            parts: [{ text: FINAL_RESPONSE_PROMPT }]
          },
        ];

        console.log(`[Gemini] Function results:`, JSON.stringify(functionResults, null, 2));
        console.log(`[Gemini] Requesting final response with function results...`);
        
        // Request final response with function results
        // Note: Don't include tools in final response request, as we want text output
        const finalResponse = await this.ai.models.generateContentStream({
          model: this.modelName,
          config: {
            temperature: 0.7, // Slightly higher for more natural responses
            thinkingConfig: {
              thinkingBudget: 0,
            },
            systemInstruction: {
              parts: [{ text: FINAL_RESPONSE_SYSTEM_INSTRUCTION }]
            },
            // Don't set responseMimeType here - we want natural text
          },
          contents: updatedContents,
        });

        // Collect final text response
        let finalText = '';
        const finalFunctionCalls: any[] = [];
        
        for await (const chunk of finalResponse) {
          // Prefer candidates format (primary), fallback to chunk.text to avoid duplicates
          if (chunk.candidates && Array.isArray(chunk.candidates) && chunk.candidates.length > 0) {
            // Primary: collect from candidates
            for (const candidate of chunk.candidates) {
              if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
                for (const part of candidate.content.parts) {
                  // Collect text, not function calls
                  if (part.text && typeof part.text === 'string' && !part.functionCall) {
                    finalText += part.text;
                  }
                  // Handle function calls in final response (shouldn't happen but handle it)
                  if (part.functionCall) {
                    finalFunctionCalls.push(part.functionCall);
                  }
                }
              }
            }
          } else if (chunk.text && typeof chunk.text === 'string') {
            // Fallback: only use chunk.text if no candidates found
            finalText += chunk.text;
          }
        }

        console.log(`[Gemini] Final response text length: ${finalText.length}`);
        
        // If we still have function calls, that's an issue - but proceed with text
        if (finalFunctionCalls.length > 0) {
          console.warn('[Gemini] Unexpected function calls in final response:', finalFunctionCalls);
        }

        // If we got no text, format the tool results in a user-friendly way
        if (!finalText && functionResults.length > 0) {
          const firstResult = functionResults[0]?.functionResponse?.response;
          if (firstResult && firstResult.success === false) {
            finalText = `Error: ${firstResult.error || 'Failed to retrieve data'}`;
          } else if (firstResult) {
            // Format the data in a readable way
            if (firstResult.consoleLogs && Array.isArray(firstResult.consoleLogs)) {
              if (firstResult.consoleLogs.length === 0) {
                finalText = '✅ No errors found in console logs.';
              } else {
                const errorCount = firstResult.consoleLogs.length;
                finalText = `⚠️ Found ${errorCount} error${errorCount > 1 ? 's' : ''} in console logs:\n\n`;
                firstResult.consoleLogs.forEach((log: any, index: number) => {
                  const date = new Date(log.date).toLocaleString();
                  const message = Array.isArray(log.message) ? log.message.join(' ') : log.message;
                  finalText += `${index + 1}. [${date}] ${message}\n`;
                });
              }
            } else if (firstResult.networkRequests && Array.isArray(firstResult.networkRequests)) {
              const count = firstResult.networkRequests.length;
              finalText = `Found ${count} network request${count > 1 ? 's' : ''}.`;
              // Show summary or details
              if (count > 0 && count <= 5) {
                finalText += '\n\n';
                firstResult.networkRequests.forEach((req: any, index: number) => {
                  finalText += `${index + 1}. ${req.method} ${req.path} - ${req.status}\n`;
                });
              }
            } else if (firstResult.timelineLogs && Array.isArray(firstResult.timelineLogs)) {
              // Find APP_STARTUP event for load time
              const appStartup = firstResult.timelineLogs.find((event: any) => event.name === 'APP_STARTUP');
              if (appStartup) {
                const loadTime = appStartup.endTime - appStartup.startTime;
                const loadTimeSeconds = (loadTime / 1000).toFixed(2);
                finalText = `⏱️ Application load time: **${loadTime}ms** (${loadTimeSeconds}s)\n\n`;
                finalText += `Found ${firstResult.timelineLogs.length} timeline event${firstResult.timelineLogs.length > 1 ? 's' : ''} in total.`;
              } else {
                const count = firstResult.timelineLogs.length;
                finalText = `Found ${count} timeline event${count > 1 ? 's' : ''}.`;
                if (count > 0 && count <= 10) {
                  finalText += '\n\n';
                  firstResult.timelineLogs.forEach((event: any, index: number) => {
                    const duration = event.endTime - event.startTime;
                    finalText += `${index + 1}. ${event.name}: ${duration}ms\n`;
                  });
                }
              }
            } else if (firstResult.componentTree) {
              finalText = `Component tree retrieved. Root component: ${firstResult.componentTree.name || 'Unknown'}`;
            } else {
              // Fallback to JSON if we don't know the structure
              finalText = JSON.stringify(firstResult, null, 2);
            }
          } else {
            finalText = 'Tool executed successfully but no response was generated.';
          }
        }

        fullText = finalText;
      }

      // Parse and validate JSON (only if no tools were used)
      let parsedResponse: any;
      let messageText: string;

      if (activeTools.length === 0) {
        try {
          parsedResponse = JSON.parse(fullText);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          console.error('Raw response:', fullText);
          throw new Error('Invalid JSON response from Gemini API');
        }

        // Extract message from structured response
        // Handle different possible JSON structures
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
      } else {
        // If tools were used, use the raw text
        // If we have function calls but no final text, it means we're waiting for function results
        if (functionCalls.length > 0 && !fullText) {
          messageText = 'Processing your request...';
        } else {
          messageText = fullText || 'No response received';
        }
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

      // Extract widget selection metadata from tool results
      let widgetSelection: { widgetId: string; widgetName: string } | undefined;
      if (functionResults && functionResults.length > 0) {
        for (const result of functionResults) {
          const toolName = result?.functionResponse?.name;
          const response = result?.functionResponse?.response;
          // Check if this is a select_widget tool result with widget selection data
          if (toolName === 'select_widget' && response && response.widgetId && response.widgetName) {
            widgetSelection = {
              widgetId: response.widgetId,
              widgetName: response.widgetName,
            };
            break; // Use the first successful selection
          }
        }
      }

      return {
        message: messageText,
        success: true,
        researchSteps: researchSteps.length > 0 ? researchSteps : undefined,
        widgetSelection,
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
