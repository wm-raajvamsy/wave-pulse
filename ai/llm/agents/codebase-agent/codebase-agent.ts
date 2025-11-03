/**
 * Codebase Agent using LangGraph
 * Orchestrates file discovery, code analysis, and sub-agent execution
 * to answer complex questions about the WaveMaker React Native codebase
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import {
  CodebaseAgentState,
  QueryAnalysis,
  FileMatch,
  CodeAnalysis,
  AgentResponse
} from './types';
import { QueryAnalyzer } from './query-analyzer';
import { FileDiscoveryEngine } from './file-discovery';
// Import moved inside function to avoid synchronous initialization issues
import { SubAgentOrchestrator } from './sub-agent-orchestrator';
import { ResponseValidator } from './response-validator';
import { createGeminiClient } from '../../gemini';
import { getAISeed } from '../../config';

/**
 * Query Analyzer Node
 * Uses AI with fixed seed to analyze query intent, domain, and select sub-agents
 */
async function queryAnalyzerNode(
  state: CodebaseAgentState
): Promise<Partial<CodebaseAgentState>> {
  const { userQuery, channelId } = state;
  
  console.log('[Codebase Agent] Query Analyzer: Analyzing query:', userQuery);
  console.log('[Codebase Agent] Query Analyzer: State received:', {
    hasUserQuery: !!userQuery,
    hasChannelId: !!channelId,
    researchStepsCount: state.researchSteps?.length || 0
  });
  
  try {
    updateStep(state, 'query-analyzer', 'Analyzing query intent and domain...', 'in-progress');
    
    const analyzer = new QueryAnalyzer();
    const analysis = await analyzer.analyzeQuery(userQuery);
    
    console.log('[Codebase Agent] Query Analyzer: Analysis result:', {
      intent: analysis.intent,
      subAgents: analysis.subAgents,
      basePath: analysis.basePath
    });
    
    updateStep(state, 'query-analyzer', 'Query analysis complete', 'completed');
    
    return {
      queryAnalysis: analysis
    };
  } catch (error: any) {
    const errorMsg = `Query analysis failed: ${error.message}`;
    console.error('[Codebase Agent]', errorMsg, error);
    console.error('[Codebase Agent] Error stack:', error.stack);
    updateStep(state, 'query-analyzer', errorMsg, 'failed');
    
    return {
      errors: [
        ...(state.errors || []),
        {
          step: 'query-analyzer',
          error: errorMsg,
          recoveryAction: 'Retry with parser fallback'
        }
      ]
    };
  }
}

/**
 * File Discovery Node
 * Discovers relevant files based on query analysis
 */
async function fileDiscoveryNode(
  state: CodebaseAgentState
): Promise<Partial<CodebaseAgentState>> {
  const { queryAnalysis, channelId, userQuery } = state;
  
  if (!queryAnalysis || !channelId) {
    return { errors: [...(state.errors || []), { step: 'file-discovery', error: 'Missing query analysis or channelId' }] };
  }
  
  console.log('[Codebase Agent] File Discovery: Searching for relevant files...');
  
  try {
    updateStep(state, 'file-discovery', 'Discovering relevant files...', 'in-progress');
    
    const discovery = new FileDiscoveryEngine(channelId);
    const basePath = getBasePath(queryAnalysis.basePath, channelId);
    
    const files = await discovery.discoverFiles(
      userQuery,
      queryAnalysis.domain,
      basePath
    );
    
    updateStep(state, 'file-discovery', `Found ${files.length} relevant files`, 'completed');
    
    return {
      discoveredFiles: files
    };
  } catch (error: any) {
    const errorMsg = `File discovery failed: ${error.message}`;
    console.error('[Codebase Agent]', errorMsg);
    updateStep(state, 'file-discovery', errorMsg, 'failed');
    
    return {
      errors: [
        ...(state.errors || []),
        {
          step: 'file-discovery',
          error: errorMsg,
          recoveryAction: 'Continue with empty file list'
        }
      ],
      discoveredFiles: []
    };
  }
}

/**
 * Code Analysis Node
 * Analyzes discovered files to extract structure and relationships
 */
async function codeAnalysisNode(
  state: CodebaseAgentState
): Promise<Partial<CodebaseAgentState>> {
  const { discoveredFiles, userQuery } = state;
  
  if (!discoveredFiles || discoveredFiles.length === 0) {
    return { codeAnalysis: { files: [], relationships: [], patterns: [], insights: [] } };
  }
  
  console.log('[Codebase Agent] Code Analysis: Analyzing code structure...');
  
  try {
    updateStep(state, 'code-analysis', 'Analyzing code structure...', 'in-progress');
    
    // Import dynamically to avoid synchronous initialization issues
    const { CodeAnalysisEngine } = await import('./code-analysis');
    const analyzer = new CodeAnalysisEngine();
    const analysis = await analyzer.analyzeCode(discoveredFiles, userQuery);
    
    updateStep(state, 'code-analysis', 'Code analysis complete', 'completed');
    
    return {
      codeAnalysis: analysis
    };
  } catch (error: any) {
    const errorMsg = `Code analysis failed: ${error.message}`;
    console.error('[Codebase Agent]', errorMsg);
    updateStep(state, 'code-analysis', errorMsg, 'failed');
    
    return {
      errors: [
        ...(state.errors || []),
        {
          step: 'code-analysis',
          error: errorMsg,
          recoveryAction: 'Continue without deep analysis'
        }
      ]
    };
  }
}

/**
 * Sub-Agent Execution Node
 * Executes selected sub-agents in parallel
 */
async function subAgentExecutionNode(
  state: CodebaseAgentState
): Promise<Partial<CodebaseAgentState>> {
  const { queryAnalysis, discoveredFiles, codeAnalysis, channelId, userQuery } = state;
  
  if (!queryAnalysis || !queryAnalysis.subAgents || queryAnalysis.subAgents.length === 0) {
    return {
      errors: [
        ...(state.errors || []),
        { step: 'sub-agent-execution', error: 'No sub-agents selected' }
      ]
    };
  }
  
  console.log('[Codebase Agent] Sub-Agent Execution: Executing agents:', queryAnalysis.subAgents);
  
  try {
    updateStep(state, 'sub-agent-execution', `Executing ${queryAnalysis.subAgents.length} sub-agent(s)...`, 'in-progress');
    
    console.log('[Codebase Agent] Sub-Agent Execution: Creating orchestrator...');
    const orchestrator = new SubAgentOrchestrator(state.onStepUpdate, state.researchSteps);
    const basePath = getBasePath(queryAnalysis.basePath, channelId || '');
    
    console.log('[Codebase Agent] Sub-Agent Execution: Base path:', basePath);
    console.log('[Codebase Agent] Sub-Agent Execution: Discovered files count:', discoveredFiles?.length || 0);
    
    const context: any = {
      query: userQuery,
      files: discoveredFiles || [],
      codeAnalysis,
      basePath,
      channelId,
      onStepUpdate: state.onStepUpdate,
      researchSteps: state.researchSteps || []
    };
    
    console.log('[Codebase Agent] Sub-Agent Execution: Calling orchestrator.execute...');
    const response = await orchestrator.execute(
      userQuery,
      queryAnalysis.subAgents,
      context
    );
    
    // Get updated steps from orchestrator (includes all sub-agent steps)
    const orchestratorSteps = orchestrator.getResearchSteps();
    
    // Merge orchestrator's steps back into state (don't replace, merge)
    // The orchestrator was initialized with state.researchSteps, so we need to merge any new steps
    const existingSteps = state.researchSteps || [];
    const mergedSteps = [...existingSteps];
    
    // Add orchestrator steps, updating existing ones or adding new ones
    orchestratorSteps.forEach(orchestratorStep => {
      const existingIndex = mergedSteps.findIndex(s => s.id === orchestratorStep.id);
      if (existingIndex >= 0) {
        // Update existing step (orchestrator might have updated status/description)
        mergedSteps[existingIndex] = orchestratorStep;
      } else {
        // Add new step (sub-agent steps)
        mergedSteps.push(orchestratorStep);
      }
    });
    
    state.researchSteps = mergedSteps;
    
    console.log('[Codebase Agent] Sub-Agent Execution: Response received:', {
      hasResponse: !!response,
      hasResponseContent: !!response?.response,
      agent: response?.agent,
      agents: response?.agents,
      responseType: typeof response?.response,
      totalSteps: mergedSteps.length,
      orchestratorStepsCount: orchestratorSteps.length,
      existingStepsCount: existingSteps.length
    });
    
    updateStep(state, 'sub-agent-execution', 'Sub-agent execution complete', 'completed');
    
    return {
      aggregatedResponse: response,
      researchSteps: state.researchSteps, // Include all merged steps
      subAgentResponses: {
        [response.agent || 'multi-agent']: response as any
      }
    };
  } catch (error: any) {
    const errorMsg = `Sub-agent execution failed: ${error.message}`;
    console.error('[Codebase Agent] Sub-Agent Execution Error:', errorMsg);
    console.error('[Codebase Agent] Sub-Agent Execution Error Stack:', error instanceof Error ? error.stack : String(error));
    updateStep(state, 'sub-agent-execution', errorMsg, 'failed');
    
    return {
      errors: [
        ...(state.errors || []),
        {
          step: 'sub-agent-execution',
          error: errorMsg,
          recoveryAction: 'Return partial response'
        }
      ]
    };
  }
}

/**
 * Response Validation Node
 * Validates the aggregated response
 */
async function responseValidationNode(
  state: CodebaseAgentState
): Promise<Partial<CodebaseAgentState>> {
  const { aggregatedResponse, userQuery, queryAnalysis } = state;
  
  if (!aggregatedResponse) {
    return {};
  }
  
  console.log('[Codebase Agent] Response Validation: Validating response...');
  
  try {
    updateStep(state, 'validation', 'Validating response...', 'in-progress');
    
    const validator = new ResponseValidator();
    const validation = await validator.validate(aggregatedResponse, userQuery);
    
    updateStep(state, 'validation', 'Validation complete', 'completed');
    
    return {
      validation
    };
  } catch (error: any) {
    const errorMsg = `Validation failed: ${error.message}`;
    console.error('[Codebase Agent]', errorMsg);
    
    return {
      validation: {
        valid: false,
        issues: [{
          type: 'consistency',
          severity: 'warning',
          message: errorMsg
        }]
      }
    };
  }
}

/**
 * Final Response Generation Node
 * Formats and returns the final response
 */
async function finalResponseNode(
  state: CodebaseAgentState
): Promise<Partial<CodebaseAgentState>> {
  const { aggregatedResponse, validation } = state;
  
  console.log('[Codebase Agent] Final Response Node:', {
    hasAggregatedResponse: !!aggregatedResponse,
    aggregatedResponseType: aggregatedResponse ? typeof aggregatedResponse.response : 'none',
    researchStepsCount: state.researchSteps?.length || 0
  });
  
  if (!aggregatedResponse) {
    const errorMsg = 'Unable to generate response. No aggregated response from sub-agents.';
    console.error('[Codebase Agent]', errorMsg);
    
    return {
      finalResponse: errorMsg + ' Please try rephrasing your query.',
      researchSteps: state.researchSteps.map(step => 
        step.status === 'in-progress' ? { ...step, status: 'failed' } : step
      )
    };
  }
  
    console.log('[Codebase Agent] Final Response: Generating final answer...');
    
    try {
      updateStep(state, 'final-response', 'Generating final response...', 'in-progress');
      
      // Format response with synthesis if multiple agents
      const response = await formatResponse(aggregatedResponse, validation, state.userQuery);
      
      console.log('[Codebase Agent] Final Response: Generated response length:', response.length);
    
    updateStep(state, 'final-response', 'Response generated', 'completed');
    
    // Notify completion
    if (state.onStepUpdate) {
      state.onStepUpdate({
        type: 'complete',
        data: {
          message: response,
          researchSteps: state.researchSteps || []
        }
      });
    }
    
    return {
      finalResponse: response,
      researchSteps: state.researchSteps || []
    };
  } catch (error: any) {
    const errorMsg = `Final response generation failed: ${error.message}`;
    console.error('[Codebase Agent]', errorMsg, error);
    
    return {
      finalResponse: typeof aggregatedResponse.response === 'string' 
        ? aggregatedResponse.response 
        : JSON.stringify(aggregatedResponse.response),
      errors: [
        ...(state.errors || []),
        {
          step: 'final-response',
          error: errorMsg
        }
      ]
    };
  }
}

/**
 * Helper: Update research step
 */
function updateStep(
  state: CodebaseAgentState,
  stepId: string,
  description: string,
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
): void {
  const steps = [...(state.researchSteps || [])];
  const existingIndex = steps.findIndex(s => s.id === stepId);
  
  if (existingIndex >= 0) {
    steps[existingIndex] = { ...steps[existingIndex], description, status };
  } else {
    steps.push({ id: stepId, description, status });
  }
  
  state.researchSteps = steps;
  
  if (state.onStepUpdate) {
    state.onStepUpdate({
      type: 'step',
      data: { researchSteps: steps }
    });
  }
}

/**
 * Helper: Get base path
 */
function getBasePath(basePathType: 'runtime' | 'codegen' | 'both', channelId: string): string {
  const runtimePath = `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/app-rn-runtime`;
  const codegenPath = `/root/WaveMaker/WaveMaker-Studio/projects/${channelId}/generated-rn-app/node_modules/@wavemaker/rn-codegen`;
  
  if (basePathType === 'runtime') return runtimePath;
  if (basePathType === 'codegen') return codegenPath;
  return runtimePath; // Default to runtime for 'both'
}

/**
 * Helper: Format response with synthesis
 */
async function formatResponse(response: AgentResponse, validation?: any, userQuery?: string): Promise<string> {
  if (typeof response.response === 'string') {
    return response.response;
  }
  
  const structured = response.response;
  
  // If we have multiple agent responses, synthesize them into a coherent answer
  if (structured.sections && structured.sections.length > 1 && userQuery) {
    return await synthesizeResponse(structured, userQuery, response);
  }
  
  // Single agent response - format normally
  let formatted = `# ${structured.summary || 'Answer'}\n\n`;
  
  structured.sections.forEach(section => {
    formatted += `## ${section.title}\n\n${section.content}\n\n`;
  });
  
  if (structured.insights && structured.insights.length > 0) {
    formatted += `## Key Insights\n\n`;
    structured.insights.forEach(insight => {
      formatted += `- ${insight}\n`;
    });
    formatted += '\n';
  }
  
  if (structured.flow) {
    formatted += `## Flow\n\n\`\`\`\n${structured.flow}\n\`\`\`\n\n`;
  }
  
  // Add sources
  if (response.sources && response.sources.length > 0) {
    formatted += `## Source Files\n\n`;
    response.sources.forEach(source => {
      const lineInfo = source.lineStart && source.lineEnd 
        ? ` (lines ${source.lineStart}-${source.lineEnd})` 
        : '';
      formatted += `- \`${source.path}\`${lineInfo}\n`;
    });
    formatted += '\n';
  }
  
  // Add cross-references
  if (response.crossReferences && response.crossReferences.length > 0) {
    formatted += `## Related Files\n\n`;
    response.crossReferences.forEach(ref => {
      formatted += `- \`${ref.from}\` ${ref.type} \`${ref.to}\` - ${ref.description}\n`;
    });
    formatted += '\n';
  }
  
  // Add validation warnings
  if (validation && !validation.valid && validation.issues) {
    const warnings = validation.issues.filter(i => i.severity === 'warning');
    if (warnings.length > 0) {
      formatted += `## Notes\n\n`;
      warnings.forEach(issue => {
        formatted += `⚠️ ${issue.message}\n`;
      });
      formatted += '\n';
    }
  }
  
  return formatted;
}

/**
 * Synthesizes multiple agent responses into a coherent answer
 */
async function synthesizeResponse(
  structured: any,
  userQuery: string,
  response: AgentResponse
): Promise<string> {
  const ai = createGeminiClient();
  const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
  
  // Combine all agent responses
  const agentResponses = structured.sections.map((section: any) => ({
    agent: section.agent || section.title,
    content: section.content,
    sources: section.sources || []
  }));
  
  const sourcesList = response.sources?.map((s: any) => s.path).join('\n') || '';
  
  const synthesisPrompt = `You are synthesizing answers from multiple specialized agents about the WaveMaker React Native codebase.

User Query: "${userQuery}"

Agent Responses:
${agentResponses.map((ar: any, idx: number) => `
=== ${ar.agent} ===
${ar.content}
`).join('\n')}

Source Files Analyzed:
${sourcesList}

**TASK**: Create a coherent, direct answer to the user's query by:
1. **Synthesizing** information from all agent responses
2. **Answering directly** - don't just list what each agent said
3. **Providing a clear solution** or explanation based on the combined analysis
4. **Citing specific files** where relevant
5. **Removing redundancy** - don't repeat the same information multiple times

Format your response as a clear, well-structured answer that directly addresses the user's question. Include:
- Direct answer/solution
- How it works (based on code evidence)
- Specific implementation details
- Code examples if applicable
- References to source files

Do NOT just list the agent responses - synthesize them into a single coherent answer.`;

  try {
    const synthesis = await ai.models.generateContent({
      model: modelName,
      config: {
        temperature: 0.1,
        seed: getAISeed(),
        systemInstruction: {
          parts: [{
            text: `You are an expert at synthesizing technical information from multiple sources into coherent, actionable answers.`
          }]
        }
      },
      contents: [{
        role: 'user',
        parts: [{ text: synthesisPrompt }]
      }]
    });
    
    let synthesizedText = '';
    if (synthesis.response?.text) {
      synthesizedText = synthesis.response.text;
    } else if (synthesis.candidates && synthesis.candidates[0]?.content?.parts) {
      synthesizedText = synthesis.candidates[0].content.parts
        .map(part => part.text || '')
        .join('');
    }
    
    if (synthesizedText) {
      // Add sources section
      if (response.sources && response.sources.length > 0) {
        synthesizedText += `\n\n## Source Files\n\n`;
        response.sources.forEach(source => {
          const lineInfo = source.lineStart && source.lineEnd 
            ? ` (lines ${source.lineStart}-${source.lineEnd})` 
            : '';
          synthesizedText += `- \`${source.path}\`${lineInfo}\n`;
        });
      }
      
      return synthesizedText;
    }
  } catch (error) {
    console.error('[Codebase Agent] Synthesis error:', error);
  }
  
  // Fallback to aggregation if synthesis fails
  let formatted = `# Answer\n\n`;
  structured.sections.forEach((section: any) => {
    formatted += `## ${section.title}\n\n${section.content}\n\n`;
  });
  if (response.sources && response.sources.length > 0) {
    formatted += `## Source Files\n\n`;
    response.sources.forEach((source: any) => {
      formatted += `- \`${source.path}\`\n`;
    });
  }
  return formatted;
}

/**
 * Create Codebase Agent
 */
export function createCodebaseAgent() {
  console.log('[Codebase Agent] createCodebaseAgent: Starting...');
  
  let workflow: StateGraph<CodebaseAgentState>;
  try {
    console.log('[Codebase Agent] createCodebaseAgent: Creating StateGraph...');
    workflow = new StateGraph<CodebaseAgentState>({
      channels: {
        userQuery: { reducer: (x: string, y: string) => y || x },
        channelId: { reducer: (x: string, y: string) => y || x },
        queryAnalysis: { reducer: (x: any, y: any) => y || x },
        discoveredFiles: { reducer: (x: any[], y: any[]) => y || x },
        codeAnalysis: { reducer: (x: any, y: any) => y || x },
        aggregatedResponse: { reducer: (x: any, y: any) => y || x },
        validation: { reducer: (x: any, y: any) => y || x },
        finalResponse: { reducer: (x: string, y: string) => y || x },
        researchSteps: { reducer: (x: any[], y: any[]) => y || x },
        errors: { reducer: (x: any[], y: any[]) => [...(x || []), ...(y || [])] },
        onStepUpdate: { reducer: (x: any, y: any) => y || x }
      }
    });
    console.log('[Codebase Agent] createCodebaseAgent: StateGraph created');
  } catch (error) {
    console.error('[Codebase Agent] createCodebaseAgent: Error creating StateGraph:', error);
    console.error('[Codebase Agent] createCodebaseAgent: Error details:', error instanceof Error ? error.stack : String(error));
    throw error;
  }

  try {
    console.log('[Codebase Agent] createCodebaseAgent: Adding nodes...');
    
    // Verify all node functions are defined
    const nodes = {
      queryAnalyzer: queryAnalyzerNode,
      fileDiscovery: fileDiscoveryNode,
      codeAnalysis: codeAnalysisNode,
      subAgentExecution: subAgentExecutionNode,
      responseValidation: responseValidationNode,
      finalResponse: finalResponseNode
    };
    
    console.log('[Codebase Agent] createCodebaseAgent: Node functions status:', 
      Object.entries(nodes).map(([name, fn]) => `${name}: ${typeof fn}`).join(', '));
    
    // Add nodes
    console.log('[Codebase Agent] createCodebaseAgent: Adding queryAnalyzer node...');
    try {
      workflow.addNode('queryAnalyzer', queryAnalyzerNode);
      console.log('[Codebase Agent] createCodebaseAgent: queryAnalyzer added');
    } catch (error) {
      console.error('[Codebase Agent] createCodebaseAgent: Error adding queryAnalyzer:', error);
      throw error;
    }
    
    console.log('[Codebase Agent] createCodebaseAgent: Adding fileDiscovery node...');
    try {
      workflow.addNode('fileDiscovery', fileDiscoveryNode);
      console.log('[Codebase Agent] createCodebaseAgent: fileDiscovery added');
    } catch (error) {
      console.error('[Codebase Agent] createCodebaseAgent: Error adding fileDiscovery:', error);
      throw error;
    }
    
    console.log('[Codebase Agent] createCodebaseAgent: Adding codeAnalysis node...');
    console.log('[Codebase Agent] createCodebaseAgent: codeAnalysisNode type:', typeof codeAnalysisNode);
    console.log('[Codebase Agent] createCodebaseAgent: codeAnalysisNode name:', codeAnalysisNode.name);
    try {
      // Wrap in a simple function to avoid any closure issues
      // Note: Using 'codeAnalysisProcessor' as node name to avoid conflict with state channel 'codeAnalysis'
      const wrappedCodeAnalysisNode = async (state: CodebaseAgentState) => {
        return await codeAnalysisNode(state);
      };
      console.log('[Codebase Agent] createCodebaseAgent: Wrapped codeAnalysisNode, calling addNode...');
      const startTime = Date.now();
      workflow.addNode('codeAnalysisProcessor', wrappedCodeAnalysisNode);
      const duration = Date.now() - startTime;
      console.log('[Codebase Agent] createCodebaseAgent: codeAnalysisProcessor added successfully in', duration, 'ms');
    } catch (error) {
      console.error('[Codebase Agent] createCodebaseAgent: Error adding codeAnalysis:', error);
      console.error('[Codebase Agent] createCodebaseAgent: Error details:', error instanceof Error ? error.stack : String(error));
      throw error;
    }
    
    console.log('[Codebase Agent] createCodebaseAgent: Adding subAgentExecution node...');
    try {
      workflow.addNode('subAgentExecution', subAgentExecutionNode);
      console.log('[Codebase Agent] createCodebaseAgent: subAgentExecution added');
    } catch (error) {
      console.error('[Codebase Agent] createCodebaseAgent: Error adding subAgentExecution:', error);
      throw error;
    }
    
    console.log('[Codebase Agent] createCodebaseAgent: Adding responseValidation node...');
    try {
      workflow.addNode('responseValidation', responseValidationNode);
      console.log('[Codebase Agent] createCodebaseAgent: responseValidation added');
    } catch (error) {
      console.error('[Codebase Agent] createCodebaseAgent: Error adding responseValidation:', error);
      throw error;
    }
    
    console.log('[Codebase Agent] createCodebaseAgent: Adding finalResponse node...');
    try {
      // Using 'finalResponseGenerator' as node name to avoid conflict with state channel 'finalResponse'
      workflow.addNode('finalResponseGenerator', finalResponseNode);
      console.log('[Codebase Agent] createCodebaseAgent: finalResponseGenerator added');
    } catch (error) {
      console.error('[Codebase Agent] createCodebaseAgent: Error adding finalResponse:', error);
      throw error;
    }
    
    console.log('[Codebase Agent] createCodebaseAgent: All nodes added successfully');

    // Define edges
    console.log('[Codebase Agent] createCodebaseAgent: Adding edges...');
    workflow.addEdge(START, 'queryAnalyzer');
    workflow.addEdge('queryAnalyzer', 'fileDiscovery');
    workflow.addEdge('fileDiscovery', 'codeAnalysisProcessor');
    workflow.addEdge('codeAnalysisProcessor', 'subAgentExecution');
    workflow.addEdge('subAgentExecution', 'responseValidation');
    workflow.addEdge('responseValidation', 'finalResponseGenerator');
    workflow.addEdge('finalResponseGenerator', END);
    console.log('[Codebase Agent] createCodebaseAgent: Edges added');

    console.log('[Codebase Agent] createCodebaseAgent: Compiling workflow...');
    const compiled = workflow.compile();
    console.log('[Codebase Agent] createCodebaseAgent: Workflow compiled successfully');
    
    return compiled;
  } catch (error) {
    console.error('[Codebase Agent] createCodebaseAgent: Error during workflow setup:', error);
    console.error('[Codebase Agent] createCodebaseAgent: Error details:', error instanceof Error ? error.stack : String(error));
    throw error;
  }
}

