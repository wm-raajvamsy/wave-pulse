/**
 * Information Retrieval Agent using LangGraph
 * Orchestrates multiple subagents to answer complex questions about application state, widget behavior, and page interactions
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { createGeminiClient } from '../gemini';
import { InformationRetrievalAgentState } from './utils/types';
import { 
  updateStep, 
  extractPageFiles, 
  handleError, 
  determineRecoveryAction 
} from './utils/helpers';
import { createCurrentPageStateAgent } from './current-page-state-agent';
import { createPageAgent } from './page-agent';
import { getAllToolSchemas, executeTool } from '../tools';
import { SYSTEM_INSTRUCTION_WITH_TOOLS } from '../prompts';
import { getAISeed } from '../config';

/**
 * Query Analyzer Node
 * Analyzes user query to understand what information needs to be retrieved
 */
async function queryAnalyzerNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const { userQuery } = state;
  
  console.log('[IR Agent] Query Analyzer: Analyzing query:', userQuery);
  
  try {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    const analysisPrompt = `Analyze this query: "${userQuery}"

Identify:
1. Which widget is being referenced (selected widget? specific name?)
2. What action/event is mentioned (tap, click, change, etc.)
3. What information is needed (properties, styles, events, behavior)
4. What context is required (current page, file structure, etc.)

Return a JSON object with:
{
  "widgetReference": "selected" | "specific-name" | widget name,
  "action": "tap" | "click" | "change" | etc.,
  "informationNeeded": ["properties", "styles", "events", "behavior"],
  "executionPlan": ["current-page-state", "file-operations", "page-agent"]
}`;

    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        temperature: 0.3,
        seed: getAISeed(),
      },
      contents: [{
        role: 'user',
        parts: [{ text: analysisPrompt }],
      }],
    });
    
    let analysisText = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      analysisText = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('');
    } else if (response.text && typeof response.text === 'function') {
      try {
        analysisText = response.text();
      } catch (e) {
        console.error('[IR Agent] Error calling response.text():', e);
      }
    } else if (response.text && typeof response.text === 'string') {
      analysisText = response.text;
    }
    
    // Try to parse JSON from response
    let queryAnalysis: any = {};
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        queryAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: extract information from text
        queryAnalysis = {
          widgetReference: analysisText.includes('selected') ? 'selected' : 'specific-name',
          action: analysisText.match(/tap|click|change|press|select/i)?.[0]?.toLowerCase() || undefined,
          informationNeeded: ['properties', 'styles', 'events', 'behavior'],
          executionPlan: ['current-page-state', 'file-operations', 'page-agent'],
        };
      }
    } catch (e) {
      // Fallback analysis
      queryAnalysis = {
        widgetReference: userQuery.toLowerCase().includes('selected') ? 'selected' : 'specific-name',
        action: userQuery.match(/tap|click|change|press|select/i)?.[0]?.toLowerCase() || undefined,
        informationNeeded: ['properties', 'styles', 'events', 'behavior'],
        executionPlan: ['current-page-state', 'file-operations', 'page-agent'],
      };
    }
    
    return {
      queryAnalysis,
      researchSteps: updateStep(state.researchSteps, 'query-analysis', 'completed'),
    };
  } catch (error) {
    return {
      queryAnalysis: {
        widgetReference: 'selected',
        informationNeeded: ['properties', 'styles', 'events', 'behavior'],
        executionPlan: ['current-page-state', 'file-operations', 'page-agent'],
      },
      researchSteps: updateStep(state.researchSteps, 'query-analysis', 'failed'),
      errors: [...(state.errors || []), handleError('query-analysis', error as Error)],
    };
  }
}

/**
 * Invoke Current Page State Agent Node
 * Invokes the Current Page State Agent subagent
 */
async function invokeCurrentPageStateAgent(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'current-page-state';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  
  console.log('[IR Agent] Invoking Current Page State Agent');
  
  // Emit step update
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  try {
    const currentPageStateAgentGraph = createCurrentPageStateAgent(
      state.channelId,
      state.projectLocation
    );
    
    // Compile the graph before invoking
    const currentPageStateAgent = currentPageStateAgentGraph.compile();
    
    // Invoke subagent
    const subagentState = {
      channelId: state.channelId,
      query: state.userQuery,
      errors: [],
    };
    
    const result = await currentPageStateAgent.invoke(subagentState as any);
    
    console.log('[IR Agent] Current Page State Agent completed:', {
      hasPageState: !!result.currentPageState,
      pageName: result.currentPageState?.pageName,
      hasSelectedWidget: !!result.currentPageState?.selectedWidget,
    });
    
    return {
      currentPageState: result.currentPageState,
      userClarification: result.userClarification,
      subagentResults: {
        ...state.subagentResults,
        currentPageStateAgent: result,
      },
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
    };
  } catch (error) {
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
    };
  }
}

/**
 * Resolve Page Name Node
 * Resolves the current page name, either from tabbar or user input
 */
async function resolvePageNameNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'resolve-page-name';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  
  console.log('[IR Agent] resolvePageNameNode: Starting resolution:', {
    activePageFromTabbar: state.currentPageState?.activePageFromTabbar,
    pageName: state.currentPageState?.pageName,
    hasUserClarification: !!state.userClarification?.response,
    currentPageState: state.currentPageState,
  });
  
  let pageName: string | undefined;
  
  // Try to get from tabbar
  if (state.currentPageState?.activePageFromTabbar) {
    pageName = state.currentPageState.activePageFromTabbar;
    console.log('[IR Agent] resolvePageNameNode: Using activePageFromTabbar:', pageName);
  }
  // Check if user provided clarification
  else if (state.userClarification?.response) {
    pageName = state.userClarification.response;
    console.log('[IR Agent] resolvePageNameNode: Using user clarification:', pageName);
  }
  // Need to ask user
  else if (state.currentPageState && !state.userClarification?.response) {
    console.log('[IR Agent] resolvePageNameNode: Cannot resolve page name, requesting user clarification');
    return {
      userClarification: {
        needed: true,
        question: 'Could not detect the current page from tabbar. Please provide the page name.',
      },
      researchSteps: updateStep(updatedSteps, stepId, 'pending'),
    };
  }
  
  console.log('[IR Agent] resolvePageNameNode: Resolved page name:', pageName);
  
  return {
    currentPageState: {
      ...state.currentPageState,
      pageName,
    },
    researchSteps: updateStep(updatedSteps, stepId, 'completed'),
  };
}

/**
 * LangGraph Tool Chaining: Find Component File Node
 * Explicitly calls find_files tool (no LLM interpretation)
 */
async function findComponentFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const pageName = state.currentPageState?.pageName || 'Main';
  const stepId = 'find-component-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  
  // Auto-generate projectLocation from channelId if not provided
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  console.log(`[IR Agent] findComponentFileNode START - pageName: ${pageName}, projectLocation: ${effectiveProjectLocation}`);
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Finding ${pageName}.component.js...`);
  
  try {
    const result = await executeTool('find_files', {
      namePattern: `${pageName}.component.js`,
      projectLocation: effectiveProjectLocation,
    });
    
    console.log(`[IR Agent] find_files result:`, JSON.stringify(result, null, 2));
    
    if (!result.success) {
      throw new Error(`find_files failed: ${result.error || 'Unknown error'}`);
    }
    
    if (!result.data?.files || result.data.files.length === 0) {
      throw new Error(`File not found: ${pageName}.component.js. Result: ${JSON.stringify(result, null, 2)}`);
    }
    
    const filePath = result.data.files[0];
    console.log(`[IR Agent] Found component file: ${filePath}`);
    console.log(`[IR Agent] Storing path in state. Current pageFiles:`, JSON.stringify(state.pageFiles || {}, null, 2));
    
    const returnValue = {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...(state.pageFiles || {}),
        _componentFilePath: filePath, // Temporary storage for chaining
      },
      projectLocation: effectiveProjectLocation, // Ensure projectLocation is preserved
    };
    
    console.log(`[IR Agent] findComponentFileNode END - returning:`, JSON.stringify(returnValue, null, 2));
    return returnValue;
  } catch (error) {
    console.error('[IR Agent] Error finding component file:', error);
    console.error('[IR Agent] Error stack:', error instanceof Error ? error.stack : 'No stack');
    const errorReturn = {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation, // Ensure projectLocation is preserved even on error
    };
    console.log(`[IR Agent] findComponentFileNode END (ERROR) - returning:`, JSON.stringify(errorReturn, null, 2));
    return errorReturn;
  }
}

/**
 * Helper function to get effective project location
 */
function getEffectiveProjectLocation(state: InformationRetrievalAgentState): string | undefined {
  return state.projectLocation || 
    (state.channelId ? `/root/WaveMaker/WaveMaker-Studio/projects/${state.channelId}/generated-rn-app` : undefined);
}

/**
 * LangGraph Tool Chaining: Read Component File Node
 * Explicitly calls read_file tool with path from previous node
 */
async function readComponentFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'read-component-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const filePath = (state.pageFiles as any)?._componentFilePath;
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  console.log(`[IR Agent] Read component file node - checking for path. State:`, {
    hasPageFiles: !!state.pageFiles,
    pageFilesKeys: state.pageFiles ? Object.keys(state.pageFiles) : [],
    filePath: filePath,
  });
  
  if (!filePath) {
    console.error(`[IR Agent] Component file path not found in state! pageFiles:`, JSON.stringify(state.pageFiles || {}, null, 2));
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Component file path not found - find node may have failed',
      }],
      projectLocation: effectiveProjectLocation,
    };
  }
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Reading component file: ${filePath}`);
  
  try {
    const result = await executeTool('read_file', {
      filePath,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }
    
    const content = result.data?.content || '';
    console.log(`[IR Agent] Read component file (${content.length} chars)`);
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        component: content,
        _componentFilePath: undefined, // Clean up temp
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error reading component file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * LangGraph Tool Chaining: Find Styles File Node
 */
async function findStylesFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const pageName = state.currentPageState?.pageName || 'Main';
  const stepId = 'find-styles-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Finding ${pageName}.style.js...`);
  
  try {
    const result = await executeTool('find_files', {
      namePattern: `${pageName}.style.js`,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success || !result.data?.files?.length) {
      throw new Error(`File not found: ${pageName}.style.js`);
    }
    
    const filePath = result.data.files[0];
    console.log(`[IR Agent] Found styles file: ${filePath}`);
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        _stylesFilePath: filePath,
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error finding styles file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * LangGraph Tool Chaining: Read Styles File Node
 */
async function readStylesFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'read-styles-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const filePath = (state.pageFiles as any)?._stylesFilePath;
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  if (!filePath) {
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Styles file path not found',
      }],
      projectLocation: effectiveProjectLocation,
    };
  }
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Reading styles file: ${filePath}`);
  
  try {
    const result = await executeTool('read_file', {
      filePath,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }
    
    const content = result.data?.content || '';
    console.log(`[IR Agent] Read styles file (${content.length} chars)`);
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        styles: content,
        _stylesFilePath: undefined,
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error reading styles file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * LangGraph Tool Chaining: Find Script File Node
 */
async function findScriptFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const pageName = state.currentPageState?.pageName || 'Main';
  const stepId = 'find-script-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Finding ${pageName}.script.js...`);
  
  try {
    const result = await executeTool('find_files', {
      namePattern: `${pageName}.script.js`,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success || !result.data?.files?.length) {
      throw new Error(`File not found: ${pageName}.script.js`);
    }
    
    const filePath = result.data.files[0];
    console.log(`[IR Agent] Found script file: ${filePath}`);
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        _scriptFilePath: filePath,
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error finding script file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * LangGraph Tool Chaining: Read Script File Node
 */
async function readScriptFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'read-script-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const filePath = (state.pageFiles as any)?._scriptFilePath;
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  if (!filePath) {
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Script file path not found',
      }],
      projectLocation: effectiveProjectLocation,
    };
  }
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Reading script file: ${filePath}`);
  
  try {
    const result = await executeTool('read_file', {
      filePath,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }
    
    const content = result.data?.content || '';
    console.log(`[IR Agent] Read script file (${content.length} chars)`);
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        script: content,
        _scriptFilePath: undefined,
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error reading script file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * LangGraph Tool Chaining: Find Variables File Node
 */
async function findVariablesFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const pageName = state.currentPageState?.pageName || 'Main';
  const stepId = 'find-variables-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Finding ${pageName}.variables.js...`);
  
  try {
    const result = await executeTool('find_files', {
      namePattern: `${pageName}.variables.js`,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success || !result.data?.files?.length) {
      throw new Error(`File not found: ${pageName}.variables.js`);
    }
    
    const filePath = result.data.files[0];
    console.log(`[IR Agent] Found variables file: ${filePath}`);
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        _variablesFilePath: filePath,
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error finding variables file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * LangGraph Tool Chaining: Read Variables File Node
 */
async function readVariablesFileNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'read-variables-file';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  const filePath = (state.pageFiles as any)?._variablesFilePath;
  const effectiveProjectLocation = getEffectiveProjectLocation(state);
  
  if (!filePath) {
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Variables file path not found',
      }],
      projectLocation: effectiveProjectLocation,
    };
  }
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  console.log(`[IR Agent] Reading variables file: ${filePath}`);
  
  try {
    const result = await executeTool('read_file', {
      filePath,
      projectLocation: effectiveProjectLocation,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to read file');
    }
    
    const content = result.data?.content || '';
    console.log(`[IR Agent] Read variables file (${content.length} chars)`);
    
    console.log('[IR Agent] All page files retrieved:', {
      hasComponent: !!state.pageFiles?.component,
      hasStyles: !!state.pageFiles?.styles,
      hasScript: !!state.pageFiles?.script,
      hasVariables: !!content,
    });
    
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
      pageFiles: {
        ...state.pageFiles,
        variables: content,
        _variablesFilePath: undefined,
      },
      projectLocation: effectiveProjectLocation,
    };
  } catch (error) {
    console.error('[IR Agent] Error reading variables file:', error);
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
      projectLocation: effectiveProjectLocation,
    };
  }
}

/**
 * Invoke Page Agent Node
 * Invokes Page Agent subagent to analyze page files
 */
async function invokePageAgent(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'analyze-page-files';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  
  // Emit step update
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  if (!state.pageFiles) {
    console.error('[IR Agent] Page Agent: No pageFiles in state!');
    return {
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Page files not retrieved',
      }],
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
    };
  }
  
  // Check if we have at least one file
  const hasAnyFile = !!(state.pageFiles.component || state.pageFiles.styles || 
                        state.pageFiles.script || state.pageFiles.variables);
  
  if (!hasAnyFile) {
    console.error('[IR Agent] Page Agent: No file contents found! pageFiles:', JSON.stringify(state.pageFiles, null, 2));
    return {
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'No page file contents retrieved - file reading may have failed',
      }],
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
    };
  }
  
  console.log('[IR Agent] Page Agent: Files available:', {
    hasComponent: !!state.pageFiles.component,
    hasStyles: !!state.pageFiles.styles,
    hasScript: !!state.pageFiles.script,
    hasVariables: !!state.pageFiles.variables,
  });
  
  try {
    const pageAgentGraph = createPageAgent(
      state.channelId,
      state.projectLocation
    );
    
    // Compile the graph before invoking
    const pageAgent = pageAgentGraph.compile();
    
    // Invoke Page Agent
    const pageAgentState = {
      pageFiles: state.pageFiles,
      currentPageState: state.currentPageState,
      userQuery: state.userQuery,
    };
    
    const result = await pageAgent.invoke(pageAgentState as any);
    
    return {
      pageAgentAnalysis: result.analysis,
      subagentResults: {
        ...state.subagentResults,
        pageAgent: result,
      },
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
    };
  } catch (error) {
    return {
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
    };
  }
}

/**
 * Answer Synthesis Node
 * Synthesizes final answer from all gathered information
 */
async function synthesizeAnswerNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'synthesize-answer';
  const updatedSteps = updateStep(state.researchSteps, stepId, 'in-progress');
  
  // Emit step update
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: updatedSteps },
    });
  }
  
  try {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    const synthesisPrompt = `Answer this question directly and concisely: "${state.userQuery}"

Context:
- Selected Widget: ${state.currentPageState?.selectedWidget?.widgetName || 'None'}
- Page Name: ${state.currentPageState?.pageName || 'Unknown'}

Page Files Content (Use these files to find the answer):
${state.pageFiles?.component ? `\nComponent File:\n\`\`\`javascript\n${state.pageFiles.component.substring(0, 5000)}${state.pageFiles.component.length > 5000 ? '\n... (truncated)' : ''}\n\`\`\`` : 'Component file not available'}
${state.pageFiles?.script ? `\nScript File:\n\`\`\`javascript\n${state.pageFiles.script}\n\`\`\`` : 'Script file not available'}
${state.pageFiles?.variables ? `\nVariables File:\n\`\`\`javascript\n${state.pageFiles.variables}\n\`\`\`` : 'Variables file not available'}

Event Handlers Found:
${JSON.stringify(state.pageAgentAnalysis?.eventHandlers || {}, null, 2)}

INSTRUCTIONS:
1. Read the user's question carefully and answer ONLY what they asked
2. Find the widget "${state.currentPageState?.selectedWidget?.widgetName || 'mentioned in the query'}" in the component file
3. Look for event handlers (onTap, onClick, onChange, etc.) in the component file
4. If the handler calls a function, find that function in script.js
5. If the handler calls an action (fragment.Actions.*), check variables.js to understand what it does
6. Focus on WHAT HAPPENS when the action is performed - explain the behavior, not all the details

RESPONSE FORMAT:
- Start with a direct answer to the question
- Explain what happens based on the code you found
- Only include details (properties, styles, location) if they're directly relevant to answering the question
- Be concise - avoid listing everything about the widget unless asked

Example for "what happens when I tap":
"When you tap on [widget], it [action]. This happens because [brief explanation of the code/handler]."

Do not include:
- Full property lists unless specifically asked
- Style details unless specifically asked
- File locations unless specifically asked
- Everything about the widget - only what's relevant to the question`;

    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        temperature: 0.3,
        seed: getAISeed(),
      },
      contents: [{
        role: 'user',
        parts: [{ text: synthesisPrompt }],
      }],
    });
    
    // Extract text from Gemini response
    let answer = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      answer = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('');
    } else if (response.text && typeof response.text === 'function') {
      // Fallback: try text() method if available
      try {
        answer = response.text();
      } catch (e) {
        console.error('[IR Agent] Error calling response.text():', e);
      }
    } else if (response.text && typeof response.text === 'string') {
      answer = response.text;
    }
    
    if (!answer) {
      console.error('[IR Agent] No text found in response:', JSON.stringify(response, null, 2));
      answer = 'Unable to generate answer. No response text received.';
    }
    
    // Emit completion update
    if (state.onStepUpdate) {
      state.onStepUpdate({
        type: 'complete',
        data: { 
          answer: answer,
          researchSteps: updateStep(updatedSteps, stepId, 'completed'),
        },
      });
    }
    
    return {
      finalAnswer: answer || 'Unable to generate answer.',
      researchSteps: updateStep(updatedSteps, stepId, 'completed'),
    };
  } catch (error) {
    return {
      finalAnswer: `Error generating answer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      researchSteps: updateStep(updatedSteps, stepId, 'failed'),
      errors: [...(state.errors || []), handleError(stepId, error as Error)],
    };
  }
}

/**
 * Routing Functions
 */
function routeAfterPageState(state: InformationRetrievalAgentState): string {
  console.log('[IR Agent] Routing after page state:', {
    hasPageName: !!state.currentPageState?.pageName,
    pageName: state.currentPageState?.pageName,
    clarificationNeeded: state.userClarification?.needed,
  });
  
  // If we don't have a page name and haven't asked for clarification yet, try to resolve it
  if (!state.currentPageState?.pageName && 
      !state.userClarification?.needed) {
    return 'resolve-page-name';
  }
  
  // If clarification is needed but not provided, we'll still try to proceed
  // The resolve-page-name node will handle asking for clarification
  if (state.userClarification?.needed && !state.userClarification?.response) {
    // For now, try to proceed anyway - we might be able to find page name from other sources
    return 'find-component-file';
  }
  
  return 'find-component-file';
}

function routeAfterUserClarification(state: InformationRetrievalAgentState): string {
  // If user provided clarification, go back to resolve-page-name to update pageName
  if (state.userClarification?.response) {
    return 'resolve-page-name';
  }
  // If clarification is needed but not provided, we can't proceed - but for now, try to continue
  // In a full implementation, this would trigger an interrupt
  if (state.userClarification?.needed) {
    // Still try to proceed - maybe we can get page name from other sources
    return 'find-component-file';
  }
  // If we have a page name (from tabbar or other source), proceed
  if (state.currentPageState?.pageName) {
    return 'find-component-file';
  }
  // Last resort: try to proceed anyway (might fail, but better than stopping)
  return 'find-component-file';
}

/**
 * Create Information Retrieval Agent
 */
export function createInformationRetrievalAgent(
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<InformationRetrievalAgentState>({
    channels: {
      userQuery: { reducer: (x: string, y?: string) => y ?? x },
      channelId: { reducer: (x?: string, y?: string) => y ?? x },
      projectLocation: { reducer: (x?: string, y?: string) => y ?? x },
      queryAnalysis: { reducer: (x?: any, y?: any) => y ?? x },
      currentPageState: { reducer: (x?: any, y?: any) => y ? { ...x, ...y } : x },
      pageFiles: { 
        reducer: (x?: any, y?: any) => {
          // Ensure we always merge properly, even if x is undefined
          if (!y) return x;
          if (!x) return y;
          return { ...x, ...y };
        }
      },
      pageAgentAnalysis: { reducer: (x?: any, y?: any) => y ?? x },
      subagentResults: { reducer: (x?: any, y?: any) => y ? { ...x, ...y } : x },
      finalAnswer: { reducer: (x?: string, y?: string) => y ?? x },
      researchSteps: { reducer: (x: any[], y?: any[]) => y ?? x },
      errors: { reducer: (x: any[], y?: any[]) => y ? [...(x || []), ...y] : x },
      userClarification: { reducer: (x?: any, y?: any) => y ?? x },
      onStepUpdate: { reducer: (x?: any, y?: any) => y ?? x },
    },
  } as any)
    .addNode('query-analyzer', queryAnalyzerNode as any)
    .addNode('current-page-state', invokeCurrentPageStateAgent as any)
    .addNode('resolve-page-name', resolvePageNameNode as any)
    // Explicit LangGraph tool chaining nodes - no LLM interpretation needed
    .addNode('find-component-file', findComponentFileNode as any)
    .addNode('read-component-file', readComponentFileNode as any)
    .addNode('find-styles-file', findStylesFileNode as any)
    .addNode('read-styles-file', readStylesFileNode as any)
    .addNode('find-script-file', findScriptFileNode as any)
    .addNode('read-script-file', readScriptFileNode as any)
    .addNode('find-variables-file', findVariablesFileNode as any)
    .addNode('read-variables-file', readVariablesFileNode as any)
    .addNode('page-agent', invokePageAgent as any)
    .addNode('answer-synthesis', synthesizeAnswerNode as any)
    
    .addEdge(START, 'query-analyzer')
    .addEdge('query-analyzer', 'current-page-state')
    .addConditionalEdges('current-page-state', routeAfterPageState as any, {
      'resolve-page-name': 'resolve-page-name',
      'find-component-file': 'find-component-file',
    })
    .addConditionalEdges('resolve-page-name', routeAfterUserClarification as any, {
      'resolve-page-name': 'resolve-page-name',
      'find-component-file': 'find-component-file',
    })
    // Explicit tool chaining: find → read → find → read → ...
    .addEdge('find-component-file', 'read-component-file')
    .addEdge('read-component-file', 'find-styles-file')
    .addEdge('find-styles-file', 'read-styles-file')
    .addEdge('read-styles-file', 'find-script-file')
    .addEdge('find-script-file', 'read-script-file')
    .addEdge('read-script-file', 'find-variables-file')
    .addEdge('find-variables-file', 'read-variables-file')
    .addEdge('read-variables-file', 'page-agent')
    .addEdge('page-agent', 'answer-synthesis')
    .addEdge('answer-synthesis', END);

  return workflow;
}

/**
 * Public API: Send message with Information Retrieval Agent (non-streaming)
 */
export async function sendMessageWithInformationRetrievalAgent(
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }> = [],
  channelId?: string,
  projectLocation?: string
): Promise<{
  answer: string;
  researchSteps: Array<{ id: string; description: string; status: string }>;
  errors?: Array<{ step: string; error: string }>;
}> {
  const graph = createInformationRetrievalAgent(channelId, projectLocation);
  const app = graph.compile();
  
  const initialState: InformationRetrievalAgentState = {
    userQuery: message,
    channelId,
    projectLocation,
    researchSteps: [],
    errors: [],
  };
  
  const finalState = await app.invoke(initialState as any) as InformationRetrievalAgentState;
  
  return {
    answer: finalState.finalAnswer || 'Unable to generate answer.',
    researchSteps: finalState.researchSteps || [],
    errors: finalState.errors?.length > 0 ? finalState.errors : undefined,
  };
}

/**
 * Public API: Send message with Information Retrieval Agent (streaming)
 */
export async function sendMessageWithInformationRetrievalAgentStreaming(
  message: string,
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }> = [],
  channelId?: string,
  projectLocation?: string,
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void
): Promise<{
  answer: string;
  researchSteps: Array<{ id: string; description: string; status: string }>;
  errors?: Array<{ step: string; error: string }>;
}> {
  console.log('[IR Agent] Starting Information Retrieval Agent streaming for query:', message.substring(0, 50));
  
  const graph = createInformationRetrievalAgent(channelId, projectLocation);
  const app = graph.compile();
  
  const initialState: InformationRetrievalAgentState = {
    userQuery: message,
    channelId,
    projectLocation,
    researchSteps: [],
    errors: [],
    onStepUpdate,
  };
  
  try {
    const finalState = await app.invoke(initialState as any) as InformationRetrievalAgentState;
    
    console.log('[IR Agent] Agent execution completed:', {
      hasFinalAnswer: !!finalState.finalAnswer,
      finalAnswerLength: finalState.finalAnswer?.length || 0,
      stepsCount: finalState.researchSteps?.length || 0,
      errorsCount: finalState.errors?.length || 0,
    });
    
    // Emit final complete event with the answer (only if synthesizeAnswerNode didn't already emit it)
    // The synthesizeAnswerNode emits complete when finalAnswer is created, so we only emit here if
    // something went wrong and we still want to notify the frontend
    if (onStepUpdate) {
      // Always emit final state for consistency
      onStepUpdate({
        type: 'complete',
        data: {
          answer: finalState.finalAnswer || 'Unable to generate answer. Please check errors or research steps.',
          researchSteps: finalState.researchSteps || [],
          errors: finalState.errors?.length > 0 ? finalState.errors : undefined,
        },
      });
    }
    
    return {
      answer: finalState.finalAnswer || 'Unable to generate answer.',
      researchSteps: finalState.researchSteps || [],
      errors: finalState.errors?.length > 0 ? finalState.errors : undefined,
    };
  } catch (error) {
    console.error('[IR Agent] Error during agent execution:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Emit error event
    if (onStepUpdate) {
      onStepUpdate({
        type: 'complete',
        data: {
          answer: `Error: ${errorMessage}`,
          researchSteps: [],
          errors: [{ step: 'agent-execution', error: errorMessage }],
        },
      });
    }
    
    return {
      answer: `Error: ${errorMessage}`,
      researchSteps: [],
      errors: [{ step: 'agent-execution', error: errorMessage }],
    };
  }
}

