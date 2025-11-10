import { createGeminiClient } from '@/ai/llm/gemini';
import { getAISeed } from '@/ai/llm/config';
import { COMMON_CONTEXT_PROMPT } from '@/ai/llm/prompts/common-context';

/**
 * AI-based agent router
 * Uses Gemini with fixed seed to intelligently determine which agent should handle the query
 * Returns: 'information-retrieval' | 'file-operations' | 'codebase'
 * 
 * NOTE: This provides the initial routing decision. Once a query reaches an agent,
 * the orchestrator takes over and can dynamically switch between agents, tools, and
 * sub-agents based on what's learned during execution. This adaptive behavior enables
 * intelligent tool chaining following WaveMaker data flow patterns.
 */
export async function determineAgentForQuery(
  message: string,
  useSeed: boolean = true
): Promise<'information-retrieval' | 'file-operations' | 'codebase'> {
  try {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    const routingPrompt = `${COMMON_CONTEXT_PROMPT}

---

## ROUTING TASK

You are an intelligent agent router. Your job is to analyze user queries and determine which specialized agent should handle them.

IMPORTANT: Consider if the query can be answered with DIRECT TOOLS first before routing to agents.

Routing Options:
1. **Information Retrieval Agent** (with orchestrator): Use for any UI/application questions
   - Simple queries: "show console errors", "how many users are shown?", "what's selected?"
   - Complex queries: "what happens when I tap...", "what does this button do?"
   - The IR agent now uses an orchestrator that adaptively decides whether to use direct tools,
     file analysis, or sub-agents based on what's needed
   → The orchestrator handles tool chaining intelligently following WaveMaker patterns

2. **Information Retrieval Agent**: ALL application/UI queries route here
   - Widget behavior and event analysis: "what happens when I tap...", "what does this button do?"
   - Page structure analysis: "how are widgets connected?", "what events are bound?"
   - Questions requiring page file analysis (component.js, script.js, variables.js)
   - Questions that need synthesizing information from multiple sources

3. **File Operations Agent**: Use for multi-step file modifications
   - Multiple file operations: "find all buttons and change their color"
   - Iterative file processing: "update all API endpoints in the project"
   - Complex file modifications requiring planning and multiple tool chains
   - NOT for simple single-file reads or edits (use direct tools)

4. **Codebase Agent**: Use for WaveMaker platform/codebase questions
   - Platform architecture: "how does BaseComponent work?", "how does two-way binding work?"
   - Platform APIs: "how do I use Actions.navigate?", "how do Variables work?"
   - Style definitions: "what is the class name for button icon?"
   - Codebase internals: "how does the transpiler convert HTML to JSX?"
   - Any question about the WaveMaker React Native codebase implementation, architecture, or design

User Query: "${message}"

Analyze the query and respond with ONLY one word:
- "information-retrieval" if the query is about understanding UI/widget behavior, properties, events, or component structure in the current application
- "file-operations" if the query requires file manipulation, code editing, or file system operations
- "codebase" if the query is about how/why/what/where in the WaveMaker React Native codebase itself

Your response must be exactly one of these three words, nothing else.`;

    const config: any = {
      temperature: 0.1, // Low temperature for consistent routing decisions
      seed: useSeed ? getAISeed() : undefined,
    };

    const response = await ai.models.generateContent({
      model: modelName,
      config,
      contents: [{
        role: 'user',
        parts: [{ text: routingPrompt }],
      }],
    });
    
    let decision = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      decision = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('')
        .trim()
        .toLowerCase();
    } else if (response.text && typeof response.text === 'function') {
      try {
        decision = response.text().trim().toLowerCase();
      } catch (e) {
        console.error('[Agent Router] Error calling response.text():', e);
      }
    } else if (response.text && typeof response.text === 'string') {
      decision = response.text.trim().toLowerCase();
    }
    
    // Clean up the response - extract just the agent name
    if (decision.includes('information-retrieval')) {
      return 'information-retrieval';
    } else if (decision.includes('file-operations')) {
      return 'file-operations';
    } else if (decision.includes('codebase')) {
      return 'codebase';
    }
    
    // Default fallback: use keywords if AI response is unclear
    const lowerMessage = message.toLowerCase();
    const irKeywords = [
      'what happens when', 'what happens if', 'what does', 'how does',
      'when i tap', 'when i click', 'when i select', 'selected widget',
      'widget properties', 'widget styles', 'event handler', 'on tap', 'on click',
      'show me', 'tell me about', 'explain', 'what is the',
    ];
    
    const codebaseKeywords = [
      'how does', 'why does', 'what is', 'where is',
      'basecomponent', 'wmbutton', 'wavemaker', 'codebase',
      'style definition', 'class name', 'rnStyleSelector',
      'transpiler', 'transformer', 'codegen', 'runtime'
    ];
    
    if (codebaseKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'codebase';
    }
    
    return irKeywords.some(keyword => lowerMessage.includes(keyword))
      ? 'information-retrieval'
      : 'file-operations';
      
  } catch (error) {
    console.error('[Agent Router] Error determining agent, falling back to keyword detection:', error);
    
    // Fallback to keyword-based routing on error
    const lowerMessage = message.toLowerCase();
    const irKeywords = [
      'what happens when', 'what happens if', 'what does', 'how does',
      'when i tap', 'when i click', 'when i select', 'selected widget',
      'widget properties', 'widget styles', 'event handler', 'on tap', 'on click',
      'show me', 'tell me about', 'explain', 'what is the',
    ];
    
    const codebaseKeywords = [
      'how does', 'why does', 'what is', 'where is',
      'basecomponent', 'wmbutton', 'wavemaker', 'codebase',
      'style definition', 'class name', 'rnStyleSelector',
      'transpiler', 'transformer', 'codegen', 'runtime'
    ];
    
    if (codebaseKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'codebase';
    }
    
    return irKeywords.some(keyword => lowerMessage.includes(keyword))
      ? 'information-retrieval'
      : 'file-operations';
  }
}

