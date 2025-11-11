/**
 * Orchestrator Agent
 * 
 * Implements the ReAct (Reasoning + Acting) pattern for adaptive tool and agent execution.
 * After each action, the orchestrator analyzes what was learned and decides the next step dynamically.
 * 
 * This enables intelligent tool chaining following WaveMaker data flow patterns:
 * - Widget → Binding → Variable → Network → Template
 * - Console/Timeline/Storage direct access
 * - File analysis for code structure
 * - Codebase agent for platform questions
 */

import { createGeminiClient } from '../gemini';
import { getAISeed } from '../config';

export interface ExecutionAction {
  step: number;
  type: 'tool' | 'agent' | 'synthesis';
  name: string;
  params?: any;
  reasoning: string;
  timestamp: Date;
  result?: string; // Raw text response from tool/agent
  error?: string;
}

export interface OrchestratorDecision {
  status: 'continue' | 'done' | 'need_clarification' | 'error';
  
  // If continue - what to do next
  nextAction?: {
    type: 'tool' | 'agent' | 'synthesis';
    name: string;
    params?: any;
    reasoning: string;
  };
  
  // If done - provide the final answer
  finalAnswer?: string;
  
  // If need_clarification - what to ask
  clarificationNeeded?: string;
  
  // Analysis of current state
  whatWeKnow: string[];
  whatWeMissing: string[];
  confidence: number; // 0-100
  
  // Overall reasoning
  reasoning: string;
  
  // Pattern being followed
  pattern?: string;
}

/**
 * Main orchestrator function
 * Analyzes the current state and decides what to do next
 */
export async function orchestrate(
  userQuery: string,
  executionHistory: ExecutionAction[],
  channelId?: string,
  projectLocation?: string,
  conversationHistory?: Array<{ role: 'user' | 'model'; parts: Array<{ text?: string }> }>,
  matchingPattern?: any
): Promise<OrchestratorDecision> {
  console.log(`[Orchestrator] Query: "${userQuery}"`);
  console.log(`[Orchestrator] Execution history steps: ${executionHistory.length}`);
  console.log(`[Orchestrator] Conversation history length: ${conversationHistory?.length || 0}`);
  if (conversationHistory && conversationHistory.length > 0) {
    console.log('[Orchestrator] Conversation context:', conversationHistory.slice(-2).map(h => ({
      role: h.role,
      textLength: h.parts[0]?.text?.length || 0,
      textPreview: h.parts[0]?.text?.substring(0, 80)
    })));
  }
  
  const ai = createGeminiClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
  
  console.log(`[Orchestrator] Analyzing step ${executionHistory.length} for query:`, userQuery.substring(0, 100));
  
  // Build execution history summary with raw text results
  let historyContext = executionHistory.length > 0
    ? `\n## EXECUTION HISTORY (What we've done so far):\n\n${executionHistory.map((action, idx) => {
        const resultText = action.error 
          ? `ERROR: ${action.error}`
          : action.result 
            ? (action.result.length > 30000 ? action.result.substring(0, 30000) + '\n... (truncated for brevity, but full data is available)' : action.result)
            : 'No result';
        
        return `**Step ${action.step}: ${action.type} - ${action.name}**
${action.params ? `Params: ${JSON.stringify(action.params)}` : ''}
Reasoning: ${action.reasoning}
Result: ${resultText}
`;
      }).join('\n')}\n`
    : '\n## EXECUTION HISTORY: This is the first step.\n';
  
  // Detect if we're repeating the same action
  const recentActions = executionHistory.slice(-3);
  const lastAction = executionHistory[executionHistory.length - 1];
  if (lastAction && recentActions.length >= 2) {
    const sameActionCount = recentActions.filter(a => 
      a.name === lastAction.name && 
      JSON.stringify(a.params) === JSON.stringify(lastAction.params)
    ).length;
    
    if (sameActionCount >= 2) {
      historyContext += `\n⚠️ WARNING: Tool "${lastAction.name}" with same params has been called ${sameActionCount} times recently. Consider a different approach or synthesize answer with available data.\n`;
    }
  }
  
  const conversationContext = conversationHistory && conversationHistory.length > 0
    ? `\n## CONVERSATION HISTORY (Recent conversation for context):\n${conversationHistory.slice(-4).map(msg => {
        const text = msg.parts[0]?.text || '';
        // Keep more context - 1500 chars should cover most responses
        return `${msg.role}: ${text.length > 1500 ? text.substring(0, 1500) + '...(truncated)' : text}`;
      }).join('\n\n')}\n`
    : '';
  
  const patternContext = matchingPattern
    ? `\n## MATCHING PATTERN FOUND\n\nA similar successful query pattern was found:\n- **Query Type**: ${matchingPattern.queryType}\n- **Intent**: ${matchingPattern.intent}\n- **Successful Steps**: ${matchingPattern.successfulSteps.join(' → ')}\n- **Tools Used**: ${matchingPattern.toolSequence.join(', ')}\n- **Average Confidence**: ${matchingPattern.averageConfidence}%\n- **Success Rate**: ${matchingPattern.successCount}/${matchingPattern.usageCount} (${Math.round(matchingPattern.successCount / matchingPattern.usageCount * 100)}%)\n\n**Consider following this proven pattern** but adapt as needed for the specific query.\n`
    : '';
  
  const prompt = `You are an intelligent orchestrator for a WaveMaker React Native application analysis system.

Your job is to analyze what information has been collected so far and decide the next action to take.

---

## USER QUERY

"${userQuery}"

${conversationContext}
${patternContext}
${historyContext}

---

## AVAILABLE TOOLS

### Runtime Inspection Tools
- **get_ui_layer_data** - Get runtime data from the application
  - dataType: 'components' (element tree + bindings), 'network' (API responses), 'info' (variables/app state), 
    'console' (logs/errors), 'storage' (localStorage), 'timeline' (events/navigation)
- **select_widget** - Highlight a widget by name
- **get_widget_properties_styles** - Get widget properties/styles by ID
- **eval_expression** - Execute JavaScript expression in app context

### File System Tools
- **find_files** - Find files by name pattern
- **read_file** - Read file contents
- **edit_file** - Edit file by search/replace
- **write_file** - Write/overwrite file
- **grep_files** - Search text in files
- **list_directory** - List directory contents
- **execute_command** - Execute shell command

### Available Agents (for complex tasks)
- **current-page-state-agent** - Gets current page state, selected widget, element tree
- **page-agent** - Analyzes page files (component.js, script.js, variables.js, styles.js)
- **codebase-agent** - Answers questions about WaveMaker React Native platform/codebase
- **file-operations-agent** - Handles multi-step file operations

---

## WAVEMAKER DATA FLOW PATTERNS

Follow these patterns when investigating WaveMaker applications:

**Pattern 1: Runtime Data Investigation (Widget → Binding → Variable → Network → Template)**
1. Get component tree to find widget and its data binding
2. Get network data to find actual API response for the variable
3. Get info data for variable configuration
4. Analyze template structure to understand display format
5. Synthesize answer matching the template

**Pattern 2: Direct Runtime Inspection**
1. Console errors? → get_ui_layer_data('console')
2. Network calls? → get_ui_layer_data('network')
3. Current page? → get_ui_layer_data('timeline') or get_ui_layer_data('info')
4. Storage data? → get_ui_layer_data('storage')

**Pattern 3: Code Structure Analysis**
1. Find relevant files (component.js, script.js, etc.)
2. Read file contents
3. Use page-agent to analyze relationships and behavior
4. Synthesize answer

**Pattern 4: Platform/Codebase Questions**
1. Route directly to codebase-agent
2. Let it handle the investigation

**Pattern 5: File Modifications**
1. Find target files
2. Read current content
3. Edit or write files
4. Confirm changes

---

## DECISION FRAMEWORK

Analyze the current state step by step:

### Step 0: Understand the context and conversation relevance
- **CHECK IF CONVERSATION HISTORY IS RELEVANT**:
  - If the new query is about the SAME topic as conversation history → USE IT for context
  - If the new query is about a DIFFERENT topic → IGNORE conversation history (it will confuse you)
  - Examples:
    - Previous: "how many users?", New: "what does button do?" → IGNORE history (different topics)
    - Previous: "how to change color?", New: "please apply that" → USE history (same topic, "that" refers to previous)
- **CHECK FOR REFERENCES**: If user says "this", "that", "it", "the style", "apply that" → look at conversation history
- **Understand if this is a follow-up**: Is user asking to execute what was previously explained?

### Step 1: What have we learned?
- Review execution history results
- Identify what data has been collected from tools
- Note any errors or missing information

### Step 2: Can we answer the query now?
- Do we have all information needed to answer?
- Is the answer clear from the data collected?
- If YES → status: 'done', provide finalAnswer

### Step 3: What's missing?
- What specific information is still needed?
- Which pattern applies to this query?
- What's the logical next step in the pattern?

### Step 4: Decide next action
- Which tool or agent will get us the missing information?
- What parameters should be used?
- Use information from conversation history when available
- Provide clear reasoning for the decision

### Step 5: Confidence check
- How confident are we in this approach? (0-100)
- If confidence < 50, consider alternative approaches
- If stuck in a loop, try a different strategy

---

## CRITICAL RULES

1. **CONVERSATION HISTORY RELEVANCE**: Before using conversation history, check if it's about the SAME topic as the new query. If it's a DIFFERENT topic, IGNORE the history completely. Examples:
   - Previous: "user counts", New: "button behavior" → IGNORE history (unrelated topics)
   - Previous: "how to change color", New: "apply that" → USE history (same topic, "that" = color change)
2. **"HOW TO" QUESTIONS = INSTRUCTIONS ONLY**: If the user asks "how do I...", "how to...", "how can I...", "what should I...", they want INSTRUCTIONS, not action. Get the current state, then provide detailed step-by-step instructions in finalAnswer. DO NOT execute edit_file or other modification tools.
3. **"APPLY/DO IT" = EXECUTE ACTION**: Only use edit_file, write_file when user explicitly says "apply", "do it", "make the change", "update it", "fix it"
4. **ANALYZE BEFORE FETCHING MORE**: If you already have data in execution history, READ IT and extract information from it. Don't keep requesting the same data.
5. **Be efficient**: Don't fetch data that won't help answer the query
6. **Follow patterns**: Use established WaveMaker data flow patterns
7. **Adapt**: If an approach isn't working, try something different
8. **Be specific**: Provide exact tool names and parameters
9. **Explain reasoning**: Always explain why this next action makes sense
10. **Stop when done**: Don't over-investigate - answer when you have enough info
11. **Track what you know**: Be explicit about what information you've collected
12. **AVOID LOOPS**: If you see a warning about repeated tool calls, you MUST switch to 'done' status and synthesize an answer from existing data, or try a completely different approach
13. **SYNTHESIZE WHEN YOU HAVE DATA**: If you have component tree AND network data, you have enough to answer most UI queries. Extract and parse the information to provide the answer.

---

## EXAMPLES OF GOOD DECISIONS

**Example 1: Query about displayed data**
Query: "How many users are shown?"
History: []
Decision:
{
  "status": "continue",
  "nextAction": {
    "type": "tool",
    "name": "get_ui_layer_data",
    "params": {"dataType": "components"},
    "reasoning": "Need to find which widget displays users and check its data binding"
  },
  "whatWeKnow": [],
  "whatWeMissing": ["Widget that displays users", "Data source", "Actual data"],
  "confidence": 90,
  "reasoning": "Following Pattern 1: Start with component tree to find widget and binding",
  "pattern": "Runtime Data Investigation"
}

**Example 2: After getting component tree**
Query: "How many users are shown?"
History: [get_ui_layer_data(components) → found WmList with binding Variables.usersData.dataSet]
Decision:
{
  "status": "continue",
  "nextAction": {
    "type": "tool",
    "name": "get_ui_layer_data",
    "params": {"dataType": "network"},
    "reasoning": "Found binding to usersData variable, need to get actual API response data"
  },
  "whatWeKnow": ["WmList widget displays users", "Bound to Variables.usersData.dataSet"],
  "whatWeMissing": ["Actual user data from API"],
  "confidence": 95,
  "reasoning": "Following Pattern 1: Got binding, now need network data to see actual response",
  "pattern": "Runtime Data Investigation"
}

**Example 3: Have all data needed - SYNTHESIZE**
Query: "How many users are shown?"
History: [
  Step 1: get_ui_layer_data(components) → Found WmList with binding,
  Step 2: get_ui_layer_data(network) → Network Data Result with requests containing user API responses
]
Decision:
{
  "status": "done",
  "finalAnswer": "There are 5 users currently shown:\\n\\n1. John Doe (john@example.com)\\n2. Jane Smith (jane@example.com)\\n3. Bob Johnson (bob@example.com)\\n4. Alice Brown (alice@example.com)\\n5. Charlie Davis (charlie@example.com)",
  "whatWeKnow": ["WmList widget identified", "Network data retrieved with user API responses", "Can parse user data from network results"],
  "whatWeMissing": [],
  "confidence": 95,
  "reasoning": "Have component tree AND network data. The network data contains API responses - I can extract user information from those responses and provide the answer. No need to fetch more data.",
  "pattern": "Runtime Data Investigation"
}

**Example 4: WARNING - Loop detected, must synthesize**
Query: "How many users are shown?"
History: [
  Step 1: get_ui_layer_data(components) → Component Tree Result with WmList,
  Step 2: get_ui_layer_data(network) → Network Data Result (42179 chars),
  Step 3: get_ui_layer_data(network) → Network Data Result (42179 chars) - SAME AS STEP 2
]
⚠️ WARNING: Tool "get_ui_layer_data" with same params has been called 2 times recently.
Decision:
{
  "status": "done",
  "finalAnswer": "Based on the component tree and network data collected, there is a WmList widget displaying users. The network data contains API responses that include user information. After analyzing the network responses, I found [extract count and list from the network data JSON].",
  "whatWeKnow": ["Component tree with WmList widget", "Network data with API responses (received twice)"],
  "whatWeMissing": [],
  "confidence": 80,
  "reasoning": "Loop detected - we've fetched network data twice with same result. Must stop and synthesize answer from existing data rather than fetching again. The data is already in execution history.",
  "pattern": "Runtime Data Investigation"
}

**Example 5A: RELEVANT conversation history - Use it!**
Query: "please apply this style"
Conversation History:
  user: "how do i change the text color of selected widget to red?"
  model: "To change the text color to red, you need to modify the styles.text object and add color: red property..."
History: []
Decision:
{
  "status": "done",
  "finalAnswer": "I understand you want to apply the red text color style we discussed. However, in WaveMaker, styles cannot be modified programmatically through files. You'll need to manually apply the changes I described: Open the widget properties for button1, navigate to the text styles section, and add the color property with value 'red'. The changes will take effect immediately after you save.",
  "whatWeKnow": ["Previous conversation was about changing text color to red", "User wants to apply that change", "WaveMaker styles are not file-based"],
  "whatWeMissing": [],
  "confidence": 90,
  "reasoning": "User said 'this style' which refers to the red color style from previous conversation. The conversation history is RELEVANT and should be used. However, WaveMaker doesn't support programmatic style changes, so I provide instructions.",
  "pattern": "Instructions (Follow-up)"
}

**Example 5B: IRRELEVANT conversation history - Ignore it!**
Query: "what happens when i click on the button"
Conversation History:
  user: "how many male and female users are showing?"
  model: "Based on the network data, there are 10 users displayed. Of these, 6 are male and 4 are female..."
History: []
Decision:
{
  "status": "continue",
  "nextAction": {
    "type": "tool",
    "name": "get_ui_layer_data",
    "params": {"dataType": "components"},
    "reasoning": "Need to find the button in the component tree to understand its click behavior"
  },
  "whatWeKnow": [],
  "whatWeMissing": ["Button widget and its properties", "Click event handlers"],
  "confidence": 90,
  "reasoning": "This is a NEW query about button behavior. The conversation history about user counts is IRRELEVANT and should be IGNORED. Starting fresh investigation of button click behavior.",
  "pattern": "Runtime Data Investigation"
}

**Example 6: "HOW TO" question - Provide INSTRUCTIONS, not action**
Query: "how do i change the text color of selected widget to red?"
History: [
  Step 1: get_ui_layer_data(components) → Found button1 selected,
  Step 2: get_widget_properties_styles(button1) → Current styles: { text: { fontSize: 14 } }
]
Decision:
{
  "status": "done",
  "finalAnswer": "To change the text color of the selected widget (button1) to red: 1. The widget name is button1. 2. You need to modify the styles.text object. 3. Add the color property with value red. The current text styles have fontSize: 14. You should add a color property with the value red to the text styles object.",
  "whatWeKnow": ["Selected widget is button1", "Current text styles have fontSize: 14", "Need to add color: red property"],
  "whatWeMissing": [],
  "confidence": 95,
  "reasoning": "User asked 'how do I' - they want INSTRUCTIONS, not me to execute the change. Provided complete step-by-step instructions with current and updated code.",
  "pattern": "Instructions (How To Query)"
}

**Example 7: Console error query**
Query: "Are there any errors?"
History: []
Decision:
{
  "status": "continue",
  "nextAction": {
    "type": "tool",
    "name": "get_ui_layer_data",
    "params": {"dataType": "console"},
    "reasoning": "Direct console data access to check for errors"
  },
  "whatWeKnow": [],
  "whatWeMissing": ["Console logs and errors"],
  "confidence": 95,
  "reasoning": "Following Pattern 2: Direct inspection - console query goes straight to console data",
  "pattern": "Direct Runtime Inspection"
}

---

## YOUR TASK

Analyze the execution history, determine what we know and what's missing, and decide the next action.

**IMPORTANT FOR finalAnswer:**
- When status is "done", provide a COMPLETE, DETAILED answer in the finalAnswer field
- Include ALL relevant information from execution history
- For follow-up queries, USE the conversation history to understand context
- Don't truncate or summarize - provide the full answer the user needs
- Use proper formatting (markdown, line breaks) for readability

Return ONLY a valid JSON object matching the OrchestratorDecision interface. No markdown, no code blocks, just JSON:

{
  "status": "continue" | "done" | "need_clarification",
  "nextAction": { "type": "tool"|"agent", "name": "...", "params": {...}, "reasoning": "..." },
  "finalAnswer": "..." (if status is "done" - provide COMPLETE, DETAILED answer),
  "whatWeKnow": ["...", "..."],
  "whatWeMissing": ["...", "..."],
  "confidence": 0-100,
  "reasoning": "...",
  "pattern": "..."
}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      config: {
        temperature: 0.3,
        seed: getAISeed(),
        responseMimeType: 'application/json',
        maxOutputTokens: 8192, // Allow longer responses, especially for finalAnswer field
      },
      contents: [{
        role: 'user',
        parts: [{ text: prompt }],
      }],
    });
    
    let decisionText = '';
    if (response.candidates && response.candidates[0]?.content?.parts) {
      decisionText = response.candidates[0].content.parts
        .map(part => part.text || '')
        .join('');
    }
    
    // Parse the JSON response
    const decision: OrchestratorDecision = JSON.parse(decisionText);
    
    console.log('[Orchestrator] Decision:', {
      status: decision.status,
      nextAction: decision.nextAction?.name,
      confidence: decision.confidence,
      pattern: decision.pattern,
      hasFinalAnswer: !!decision.finalAnswer,
      finalAnswerLength: decision.finalAnswer?.length || 0,
      finalAnswerPreview: decision.finalAnswer?.substring(0, 200),
    });
    
    return decision;
  } catch (error) {
    console.error('[Orchestrator] Error making decision:', error);
    
    // Fallback: try to make a reasonable decision based on query and history
    return makeFallbackDecision(userQuery, executionHistory);
  }
}


/**
 * Fallback decision logic when AI fails
 */
function makeFallbackDecision(
  userQuery: string,
  executionHistory: ExecutionAction[]
): OrchestratorDecision {
  console.log('[Orchestrator] Using fallback decision logic');
  
  // If no history, start with component data for UI queries
  if (executionHistory.length === 0) {
    if (/show|display|list|how many|current|what.*data/i.test(userQuery)) {
      return {
        status: 'continue',
        nextAction: {
          type: 'tool',
          name: 'get_ui_layer_data',
          params: { dataType: 'components' },
          reasoning: 'Starting with component tree to understand UI structure',
        },
        whatWeKnow: [],
        whatWeMissing: ['UI structure and data bindings'],
        confidence: 70,
        reasoning: 'Fallback: Query appears to be about displayed data, starting with components',
        pattern: 'Runtime Data Investigation',
      };
    }
    
    if (/error|console|log/i.test(userQuery)) {
      return {
        status: 'continue',
        nextAction: {
          type: 'tool',
          name: 'get_ui_layer_data',
          params: { dataType: 'console' },
          reasoning: 'Query about errors, checking console',
        },
        whatWeKnow: [],
        whatWeMissing: ['Console logs and errors'],
        confidence: 80,
        reasoning: 'Fallback: Error-related query, checking console',
        pattern: 'Direct Runtime Inspection',
      };
    }
  }
  
  // If we've done several steps, try to wrap up
  if (executionHistory.length >= 3) {
    return {
      status: 'done',
      finalAnswer: 'I was unable to complete the analysis due to an error in the orchestration process. Please try rephrasing your question.',
      whatWeKnow: executionHistory.map(a => `${a.name}: ${a.result?.substring(0, 100) || 'no result'}`),
      whatWeMissing: [],
      confidence: 30,
      reasoning: 'Fallback: Multiple steps completed but orchestrator failed, stopping',
    };
  }
  
  // Default: try to continue with info data
  return {
    status: 'continue',
    nextAction: {
      type: 'tool',
      name: 'get_ui_layer_data',
      params: { dataType: 'info' },
      reasoning: 'Getting application info and variables',
    },
    whatWeKnow: executionHistory.map(a => a.name),
    whatWeMissing: ['Application state and variables'],
    confidence: 50,
    reasoning: 'Fallback: Trying to gather more context',
    pattern: 'Runtime Data Investigation',
  };
}

