import { createGeminiClient } from '@/ai/llm/gemini';
import { getAISeed } from '@/ai/llm/config';

/**
 * AI-based agent router
 * Uses Gemini to intelligently determine which agent should handle the query
 * Returns: 'information-retrieval' | 'file-operations'
 */
export async function determineAgentForQuery(
  message: string,
  useSeed: boolean = true
): Promise<'information-retrieval' | 'file-operations'> {
  try {
    const ai = createGeminiClient();
    const modelName = (typeof process !== 'undefined' ? process.env?.GEMINI_MODEL : undefined) || 'gemini-2.5-flash-lite';
    
    const routingPrompt = `You are an intelligent agent router. Your job is to analyze user queries and determine which specialized agent should handle them.

Available Agents:
1. **Information Retrieval Agent**: Use this for questions about:
   - Widget behavior, events, and interactions ("what happens when I tap...", "what does this button do?")
   - Widget properties and styles ("show me widget properties", "what styles are applied?")
   - Component tree and UI state ("what is the selected widget?", "show me the component tree")
   - Page structure and relationships ("how are widgets connected?", "what events are bound?")
   - General questions about UI elements and their behavior

2. **File Operations Agent**: Use this for:
   - File manipulation tasks ("read file X", "edit file Y", "find files")
   - Code modifications ("change this code", "add this function")
   - File system operations ("create file", "delete file", "list directory")
   - Searching code ("search for pattern", "grep files")
   - Any task that requires reading, writing, or modifying files

User Query: "${message}"

Analyze the query and respond with ONLY one word:
- "information-retrieval" if the query is about understanding UI/widget behavior, properties, events, or component structure
- "file-operations" if the query requires file manipulation, code editing, or file system operations

Your response must be exactly one of these two words, nothing else.`;

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
    }
    
    // Default fallback: use keywords if AI response is unclear
    const lowerMessage = message.toLowerCase();
    const irKeywords = [
      'what happens when', 'what happens if', 'what does', 'how does',
      'when i tap', 'when i click', 'when i select', 'selected widget',
      'widget properties', 'widget styles', 'event handler', 'on tap', 'on click',
      'show me', 'tell me about', 'explain', 'what is the',
    ];
    
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
    
    return irKeywords.some(keyword => lowerMessage.includes(keyword))
      ? 'information-retrieval'
      : 'file-operations';
  }
}

