# Information Retrieval Agent - Architecture Documentation

## Overview

The Information Retrieval Agent is a LangGraph-based agent designed to answer complex questions about application state, widget behavior, and page interactions. It orchestrates multiple subagents and tools to gather comprehensive information about the current application state and provide detailed answers to user queries.

**Example Query**: "What happens when I tap on the selected widget?"

## Architecture

### High-Level Flow

```
User Query
    ↓
Information Retrieval Agent (Orchestrator)
    ↓
Current Page State Agent (Subagent)
    ↓
File Operations Agent (Existing Agent)
    ↓
Page Agent (Subagent)
    ↓
Answer Synthesis
    ↓
Final Response
```

## State Management

### Information Retrieval Agent State

```typescript
interface InformationRetrievalAgentState {
  // User Input
  userQuery: string;
  channelId?: string;
  projectLocation?: string;
  
  // Current Page State Agent Results
  currentPageState?: {
    pageName?: string;
    activePageFromTabbar?: string;
    selectedWidget?: {
      widgetId: string;
      widgetName: string;
      properties: Record<string, any>;
      styles: Record<string, any>;
    };
    elementTree?: any; // Full component tree from Elements Tab (basic info for all widgets)
  };
  
  // Page Files
  pageFiles?: {
    component?: string; // Main.component.js content
    styles?: string;    // Main.styles.js content
    script?: string;    // Main.script.js content
    variables?: string; // Main.variables.js content
  };
  
  // Page Agent Analysis
  pageAgentAnalysis?: {
    fileRelations: Record<string, any>;
    widgetLocations: Record<string, any>;
    eventHandlers: Record<string, any>;
    styleMappings: Record<string, any>;
    propertyMappings: Record<string, any>;
    understanding: string; // Natural language understanding
  };
  
  // Subagent Invocations
  subagentResults?: {
    currentPageStateAgent?: any;
    pageAgent?: any;
  };
  
  // Final Answer
  finalAnswer?: string;
  
  // Execution Tracking
  researchSteps: Array<{
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
  }>;
  
  // Error Handling
  errors: Array<{
    step: string;
    error: string;
    recoveryAction?: string;
  }>;
  
  // User Interaction
  userClarification?: {
    needed: boolean;
    question?: string;
    response?: string;
  };
  
  // Callbacks
  onStepUpdate?: (update: { type: 'step' | 'complete'; data?: any }) => void;
  
  // LangGraph compatibility
  [key: string]: any;
}
```

## Node Definitions

### 1. Query Analyzer Node

**Purpose**: Analyze the user query to understand what information needs to be retrieved.

**Input**: `userQuery`, `channelId`

**Output**: Analysis of query intent, required subagents, and execution plan

**Behavior**:
- Parse query to identify key components:
  - Widget reference (selected widget, specific widget name)
  - Action/event (tap, click, change, etc.)
  - Information type (properties, styles, events, behavior)
- Determine which subagents need to be invoked
- Create execution plan

**Example**:
```typescript
async function queryAnalyzerNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const analysisPrompt = `Analyze this query: "${state.userQuery}"
  
  Identify:
  1. Which widget is being referenced (selected widget? specific name?)
  2. What action/event is mentioned (tap, click, change, etc.)
  3. What information is needed (properties, styles, events, behavior)
  4. What context is required (current page, file structure, etc.)
  
  Return structured analysis.`;
  
  const analysis = await llm.invoke(analysisPrompt);
  
  return {
    queryAnalysis: parseAnalysis(analysis),
    researchSteps: addStep(state.researchSteps, {
      id: 'query-analysis',
      description: 'Analyzing user query',
      status: 'completed'
    })
  };
}
```

### 2. Current Page State Agent (Subagent Invocation)

**Purpose**: Retrieve current page state including selected widget, page name, and element tree.

**Invocation**: This node invokes the Current Page State Agent as a subagent.

**Flow**:
1. Get element tree (basic info: id, name, tagName for all widgets)
2. Identify target widget from query (extract widget ID)
3. Fetch properties/styles directly using `get_widget_properties_styles` tool with widget ID
4. Extract active page from tabbar's `activePage` property (may also fetch tabbar properties/styles if needed)
5. If tabbar property not found, request user clarification
6. Return comprehensive page state

**Node Implementation**:
```typescript
async function invokeCurrentPageStateAgent(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'current-page-state';
  updateStep(state.researchSteps, stepId, 'in-progress');
  
  // Create Current Page State Agent graph
  const currentPageStateAgentGraph = createCurrentPageStateAgent(
    state.channelId,
    state.projectLocation
  );
  
  // Compile the graph before invoking
  const currentPageStateAgent = currentPageStateAgentGraph.compile();
  
  // Invoke subagent
  const subagentState = {
    channelId: state.channelId,
    projectLocation: state.projectLocation,
    query: state.userQuery,
  };
  
  const result = await currentPageStateAgent.invoke(subagentState);
  
  return {
    currentPageState: result.currentPageState,
    userClarification: result.userClarification,
    subagentResults: {
      ...state.subagentResults,
      currentPageStateAgent: result,
    },
    researchSteps: updateStep(state.researchSteps, stepId, 'completed'),
  };
}
```

### 3. Page Name Resolver Node

**Purpose**: Resolve the current page name, either from tabbar or user input.

**Behavior**:
- Check if `currentPageState.activePageFromTabbar` exists
- If not, check if user clarification is needed
- If user provided page name, use it
- Return resolved page name

**Implementation**:
```typescript
async function resolvePageNameNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'resolve-page-name';
  updateStep(state.researchSteps, stepId, 'in-progress');
  
  let pageName: string | undefined;
  
  // Try to get from tabbar
  if (state.currentPageState?.activePageFromTabbar) {
    pageName = state.currentPageState.activePageFromTabbar;
  }
  // Check if user provided clarification
  else if (state.userClarification?.response) {
    pageName = state.userClarification.response;
  }
  // Need to ask user
  else if (state.currentPageState && !state.userClarification?.response) {
    return {
      userClarification: {
        needed: true,
        question: 'Could not detect the current page from tabbar. Please provide the page name.',
      },
      researchSteps: updateStep(state.researchSteps, stepId, 'pending'),
    };
  }
  
  return {
    currentPageState: {
      ...state.currentPageState,
      pageName,
    },
    researchSteps: updateStep(state.researchSteps, stepId, 'completed'),
  };
}
```

### 4. File Operations Agent Invocation Node

**Purpose**: Use existing File Operations Agent to retrieve page files.

**Files to Retrieve**:
- `{PageName}.component.js`
- `{PageName}.styles.js`
- `{PageName}.script.js`
- `{PageName}.variables.js`

**Implementation**:
```typescript
async function invokeFileOperationsAgent(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'retrieve-page-files';
  updateStep(state.researchSteps, stepId, 'in-progress');
  
  const pageName = state.currentPageState?.pageName;
  if (!pageName) {
    return {
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Page name not resolved',
      }],
    };
  }
  
  // Create file operations request
  const fileOperationsQuery = `Find and read the following files for page "${pageName}":
  1. ${pageName}.component.js
  2. ${pageName}.styles.js
  3. ${pageName}.script.js
  4. ${pageName}.variables.js
  
  Read all these files and return their contents.`;
  
  // Invoke File Operations Agent
  const { createFileOperationsAgent } = await import('./file-operations-agent');
  const fileAgentGraph = createFileOperationsAgent(
    undefined,
    'gemini-2.5-flash-lite',
    state.channelId,
    state.projectLocation
  );
  
  // Compile the graph before invoking
  const fileAgent = fileAgentGraph.compile();
  
  const fileAgentResult = await fileAgent.invoke({
    messages: [{
      role: 'user',
      parts: [{ text: fileOperationsQuery }],
    }],
    toolResults: [],
    researchSteps: [],
    channelId: state.channelId,
    projectLocation: state.projectLocation,
    maxIterations: 15,
    iterationCount: 0,
  });
  
  // Extract file contents from tool results
  const pageFiles = extractPageFiles(fileAgentResult.toolResults);
  
  return {
    pageFiles,
    researchSteps: updateStep(state.researchSteps, stepId, 'completed'),
  };
}

function extractPageFiles(toolResults: Array<{ name: string; result: any }>) {
  const files: Record<string, string> = {};
  
  for (const result of toolResults) {
    if (result.name === 'read_file' && result.result?.content) {
      const filePath = result.result.filePath || '';
      const fileName = filePath.split('/').pop() || '';
      
      if (fileName.endsWith('.component.js')) {
        files.component = result.result.content;
      } else if (fileName.endsWith('.styles.js')) {
        files.styles = result.result.content;
      } else if (fileName.endsWith('.script.js')) {
        files.script = result.result.content;
      } else if (fileName.endsWith('.variables.js')) {
        files.variables = result.result.content;
      }
    }
  }
  
  return files;
}
```

### 5. Page Agent Invocation Node

**Purpose**: Invoke Page Agent subagent to analyze page files and understand relationships.

**Input**: Page files (component, styles, script, variables)

**Output**: Comprehensive analysis including:
- File relationships and dependencies
- Widget locations in files
- Event handlers and their mappings
- Style mappings
- Property mappings
- Natural language understanding

**Implementation**:
```typescript
async function invokePageAgent(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'analyze-page-files';
  updateStep(state.researchSteps, stepId, 'in-progress');
  
  if (!state.pageFiles) {
    return {
      errors: [...(state.errors || []), {
        step: stepId,
        error: 'Page files not retrieved',
      }],
    };
  }
  
  // Create Page Agent graph
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
  
  const result = await pageAgent.invoke(pageAgentState);
  
  return {
    pageAgentAnalysis: result.analysis,
    subagentResults: {
      ...state.subagentResults,
      pageAgent: result,
    },
    researchSteps: updateStep(state.researchSteps, stepId, 'completed'),
  };
}
```

### 6. Answer Synthesis Node

**Purpose**: Synthesize final answer from all gathered information.

**Input**: 
- User query
- Current page state
- Page agent analysis
- Selected widget information

**Output**: Comprehensive answer to user's question

**Implementation**:
```typescript
async function synthesizeAnswerNode(
  state: InformationRetrievalAgentState
): Promise<Partial<InformationRetrievalAgentState>> {
  const stepId = 'synthesize-answer';
  updateStep(state.researchSteps, stepId, 'in-progress');
  
  const synthesisPrompt = `User Question: "${state.userQuery}"

Context:
- Selected Widget: ${state.currentPageState?.selectedWidget?.widgetName}
- Widget Properties: ${JSON.stringify(state.currentPageState?.selectedWidget?.properties, null, 2)}
- Widget Styles: ${JSON.stringify(state.currentPageState?.selectedWidget?.styles, null, 2)}
- Page Name: ${state.currentPageState?.pageName}

Page Analysis:
- File Relationships: ${JSON.stringify(state.pageAgentAnalysis?.fileRelations, null, 2)}
- Widget Locations: ${JSON.stringify(state.pageAgentAnalysis?.widgetLocations, null, 2)}
- Event Handlers: ${JSON.stringify(state.pageAgentAnalysis?.eventHandlers, null, 2)}
- Style Mappings: ${JSON.stringify(state.pageAgentAnalysis?.styleMappings, null, 2)}
- Property Mappings: ${JSON.stringify(state.pageAgentAnalysis?.propertyMappings, null, 2)}
- Understanding: ${state.pageAgentAnalysis?.understanding}

Provide a comprehensive answer to the user's question. Explain:
1. Where the widget is located in the page
2. How it is used
3. What events are associated with it (if the question asks about events)
4. What styles are applied
5. What properties are set
6. What happens when the action is performed (based on event handlers)

Be specific and reference actual code locations and values.`;

  const answer = await llm.invoke(synthesisPrompt);
  
  return {
    finalAnswer: answer.content,
    researchSteps: updateStep(state.researchSteps, stepId, 'completed'),
  };
}
```

### 7. Conditional Routing Nodes

**Purpose**: Route execution based on state conditions.

**Key Routing Decisions**:

1. **After Query Analysis** → Always to Current Page State Agent
2. **After Current Page State** → Check if page name resolved
   - If not resolved → Page Name Resolver
   - If resolved → File Operations Agent
3. **After Page Name Resolution** → Check if user clarification needed
   - If needed → Wait for user input (interrupt)
   - If resolved → File Operations Agent
4. **After File Operations** → Always to Page Agent
5. **After Page Agent** → Always to Answer Synthesis
6. **After Answer Synthesis** → END

**Implementation**:
```typescript
function routeAfterPageState(state: InformationRetrievalAgentState): string {
  if (!state.currentPageState?.pageName && 
      !state.userClarification?.needed) {
    return 'resolve-page-name';
  }
  
  if (state.userClarification?.needed && !state.userClarification?.response) {
    return 'wait-for-user'; // Interrupt for user input
  }
  
  return 'file-operations';
}

function routeAfterUserClarification(state: InformationRetrievalAgentState): string {
  if (state.userClarification?.response) {
    return 'resolve-page-name';
  }
  return 'end';
}
```

## Subagent Specifications

### Current Page State Agent

**Purpose**: Retrieve current page state from UI layer data.

**State**:
```typescript
interface CurrentPageStateAgentState {
  channelId?: string;
  query: string;
  elementTree?: any; // Basic tree with id, name, tagName for all widgets
  targetWidgetId?: string; // Widget ID to fetch properties/styles for
  targetWidgetName?: string; // Widget name (for reference)
  selectedWidget?: {
    widgetId: string;
    widgetName: string;
    properties?: Record<string, any>; // Fetched via get_widget_properties_styles
    styles?: Record<string, any>; // Fetched via get_widget_properties_styles
  };
  activePageFromTabbar?: string;
  currentPageState?: any;
  errors: Array<{ step: string; error: string }>;
}
```

**Nodes**:

1. **Get Element Tree Node**
   - Calls `get_ui_layer_data` with `dataType: 'components'`
   - Extracts full component tree (basic info for all widgets)
   - Properties/styles are NOT available by default - only basic info (id, name, tagName)

2. **Identify Target Widget Node**
   - Parses query to identify widget reference (specific name, "selected widget", etc.)
   - Finds widget in element tree by name
   - Extracts widget ID
   - Stores targetWidgetId and targetWidgetName

3. **Get Widget Properties/Styles Node**
   - Checks if widget already has properties/styles in current tree
   - If yes, extracts directly from tree
   - If no, calls `get_widget_properties_styles` tool with widget ID
   - Tool handles client-side fetch and polling internally
   - Extracts properties and styles from result

4. **Find Tabbar Node**
   - Searches component tree for tabbar widget
   - If tabbar has properties (already fetched), extracts `activePage`
   - If tabbar doesn't have properties, calls `get_widget_properties_styles` for tabbar widget ID
   - Extracts `activePage` property from tabbar's properties

5. **Assemble State Node**
   - Combines all gathered information
   - Returns complete current page state
   - Note: Only selectedWidget has properties/styles, not all widgets

**Graph Structure**:
```
START
  ↓
Get Element Tree (basic info for all widgets)
  ↓
Identify Target Widget (from query, extract widget ID)
  ↓
Get Widget Properties/Styles (direct fetch by widget ID)
  ↓
Find Tabbar (parallel, may also fetch properties if needed)
  ↓
Assemble State
  ↓
END
```

### Page Agent

**Purpose**: Analyze page files and understand relationships.

**State**:
```typescript
interface PageAgentState {
  pageFiles: {
    component?: string;
    styles?: string;
    script?: string;
    variables?: string;
  };
  currentPageState?: any;
  userQuery: string;
  analysis?: {
    fileRelations: Record<string, any>;
    widgetLocations: Record<string, any>;
    eventHandlers: Record<string, any>;
    styleMappings: Record<string, any>;
    propertyMappings: Record<string, any>;
    understanding: string;
  };
}
```

**Nodes**:

1. **Parse Files Node**
   - Parse component.js to extract widget structure
   - Parse script.js to extract event handlers
   - Parse styles.js to extract style definitions
   - Parse variables.js to extract variable definitions

2. **Map File Relationships Node**
   - Identify how files reference each other
   - Map imports and dependencies
   - Understand file structure

3. **Locate Widgets Node**
   - Find widget locations in component.js
   - Map widget names to DOM positions
   - Extract widget hierarchy

4. **Map Event Handlers Node**
   - Extract event handlers from script.js
   - Map events to widgets
   - Identify event handler functions

5. **Map Styles Node**
   - Map style classes to widgets
   - Extract style definitions
   - Link styles to properties

6. **Map Properties Node**
   - Extract widget properties from component.js
   - Map to actual widget instances
   - Link to styles and events

7. **Build Understanding Node**
   - Generate natural language understanding
   - Create comprehensive analysis
   - Answer: "How do these files work together?"

**Graph Structure**:
```
START
  ↓
Parse Files
  ↓
Map File Relationships (parallel)
  ↓
Locate Widgets (parallel)
  ↓
Map Event Handlers (parallel)
  ↓
Map Styles (parallel)
  ↓
Map Properties (parallel)
  ↓
Build Understanding
  ↓
END
```

## Complete Graph Structure

```
Information Retrieval Agent Graph:

START
  ↓
Query Analyzer
  ↓
Invoke Current Page State Agent
  ↓
[Conditional] Route After Page State
  ├─→ resolve-page-name → resolve-page-name-node
  │     ↓
  │   [Conditional] Route After User Clarification
  │     ├─→ wait-for-user → [INTERRUPT]
  │     └─→ resolve-page-name-node
  │
  └─→ file-operations → Invoke File Operations Agent
        ↓
      Invoke Page Agent
        ↓
      Answer Synthesis
        ↓
      END
```

## Tool Usage

### Tools Used by Information Retrieval Agent

1. **Direct Tool Calls**:
   - None (delegates to subagents)

### Tools Used by Current Page State Agent

1. **get_ui_layer_data**
   - `dataType: 'components'` - Get component tree (basic info: id, name, tagName for all widgets)

2. **get_widget_properties_styles** (NEW)
   - Takes `widgetId` directly (no selection needed)
   - Triggers client-side fetch via WebSocket/API
   - Waits for sync to server
   - Returns properties/styles directly
   - Used to fetch properties/styles for target widget and tabbar widget

### Tools Used by File Operations Agent (via invocation)

1. **find_files** - Locate page files
2. **read_file** - Read file contents
3. **grep_files** - Search for specific patterns

### Tools Used by Page Agent

1. **None** (pure analysis of provided files)

## Error Handling

### Error Scenarios

1. **Page Name Not Found**
   - Action: Request user clarification
   - Recovery: Use user-provided page name

2. **Page Files Not Found**
   - Action: Try alternative file names (case variations)
   - Recovery: If still not found, inform user

3. **Selected Widget Not Found**
   - Action: Check if widget exists in element tree
   - Recovery: If not found, use available widget information

4. **Subagent Failures**
   - Action: Log error, continue with available data
   - Recovery: Provide partial answer if possible

### Error State Updates

```typescript
function handleError(
  state: InformationRetrievalAgentState,
  step: string,
  error: Error
): Partial<InformationRetrievalAgentState> {
  return {
    errors: [...(state.errors || []), {
      step,
      error: error.message,
      recoveryAction: determineRecoveryAction(step, error),
    }],
    researchSteps: updateStep(state.researchSteps, step, 'failed'),
  };
}
```

## Example Execution Flow

### Query: "What happens when I tap on the selected widget?"

1. **Query Analyzer**
   - Identifies: selected widget, tap event, behavior inquiry
   - Creates execution plan

2. **Current Page State Agent**
   - Calls `get_ui_layer_data(dataType: 'components')` → Gets basic tree info
   - Identifies target widget: "button1" → Extracts widgetId = "widget-123"
   - Calls `get_widget_properties_styles('widget-123')` → Fetches properties/styles directly
   - Finds tabbar, extracts `activePage` = "Main" (may also fetch tabbar properties if needed)
   - Returns selected widget: `button1` with properties and styles

3. **Page Name Resolution**
   - Page name resolved: "Main" (from tabbar)

4. **File Operations Agent**
   - Finds: `Main.component.js`, `Main.styles.js`, `Main.script.js`, `Main.variables.js`
   - Reads all four files

5. **Page Agent**
   - Parses component.js → finds `button1` widget
   - Parses script.js → finds `onButton1Tap` event handler
   - Parses styles.js → finds `button1Styles` styles
   - Maps relationships: button1 → onButton1Tap → button1Styles
   - Builds understanding: "button1 is a Button widget with tap handler that calls onButton1Tap function"

6. **Answer Synthesis**
   - Combines all information
   - Answers: "When you tap on the selected widget (button1), it triggers the `onButton1Tap` event handler defined in Main.script.js. This handler [description of what the handler does]. The widget has styles from Main.styles.js and properties set in Main.component.js."

## Integration Points

### With File Operations Agent

```typescript
// In invokeFileOperationsAgent node
const { createFileOperationsAgent } = await import('./file-operations-agent');
const fileAgentGraph = createFileOperationsAgent(
  apiKey,
  modelName,
  channelId,
  projectLocation
);

// Compile the graph before invoking
const fileAgent = fileAgentGraph.compile();

const result = await fileAgent.invoke({
  messages: [{
    role: 'user',
    parts: [{ text: fileOperationsQuery }],
  }],
  // ... other state
});
```

### With UI Layer Tools

```typescript
// In Current Page State Agent
import { executeTool } from '../tools';

// Get component tree (basic info)
const componentTreeResult = await executeTool('get_ui_layer_data', {
  channelId: state.channelId,
  dataType: 'components',
});

// Get widget properties/styles directly by widget ID
const widgetPropertiesStyles = await executeTool('get_widget_properties_styles', {
  channelId: state.channelId,
  widgetId: targetWidgetId,
});
```

## State Channel Reducers

```typescript
const channels = {
  userQuery: {
    reducer: (x: string, y?: string) => y ?? x,
  },
  channelId: {
    reducer: (x?: string, y?: string) => y ?? x,
  },
  currentPageState: {
    reducer: (x?: any, y?: any) => y ? { ...x, ...y } : x,
  },
  pageFiles: {
    reducer: (x?: any, y?: any) => y ? { ...x, ...y } : x,
  },
  pageAgentAnalysis: {
    reducer: (x?: any, y?: any) => y ?? x,
  },
  finalAnswer: {
    reducer: (x?: string, y?: string) => y ?? x,
  },
  researchSteps: {
    reducer: (x: any[], y?: any[]) => y ?? x,
  },
  errors: {
    reducer: (x: any[], y?: any[]) => y ? [...(x || []), ...y] : x,
  },
  userClarification: {
    reducer: (x?: any, y?: any) => y ?? x,
  },
};
```

## Streaming and Progress Updates

```typescript
function updateStep(
  steps: Array<{ id: string; description: string; status: string }>,
  stepId: string,
  status: string
): Array<{ id: string; description: string; status: string }> {
  const updated = [...steps];
  const index = updated.findIndex(s => s.id === stepId);
  
  if (index >= 0) {
    updated[index] = { ...updated[index], status };
  } else {
    updated.push({ id: stepId, description: stepId, status });
  }
  
  return updated;
}

// Emit update
if (state.onStepUpdate) {
  state.onStepUpdate({
    type: 'step',
    data: { researchSteps: state.researchSteps },
  });
}
```

## Testing Strategy

### Unit Tests

1. Test each node independently
2. Mock subagent invocations
3. Test state transitions
4. Test error handling

### Integration Tests

1. Test full flow with mock data
2. Test subagent communication
3. Test file operations agent integration
4. Test error recovery

### Example Test

```typescript
describe('Information Retrieval Agent', () => {
  it('should handle "What happens when I tap on selected widget?"', async () => {
    const agent = createInformationRetrievalAgent();
    const result = await agent.invoke({
      userQuery: 'What happens when I tap on the selected widget?',
      channelId: 'test-channel',
      projectLocation: '/test/project',
    });
    
    expect(result.finalAnswer).toBeDefined();
    expect(result.currentPageState?.selectedWidget).toBeDefined();
    expect(result.pageAgentAnalysis?.eventHandlers).toBeDefined();
  });
});
```

## Performance Considerations

1. **Parallel Execution**: Run independent operations in parallel
2. **Caching**: Cache UI layer data within execution
3. **Lazy Loading**: Only load files when needed
4. **Streaming**: Stream updates to user during execution

## Future Enhancements

1. **Caching Layer**: Cache page analysis results
2. **Incremental Updates**: Update analysis incrementally
3. **Multi-Page Support**: Handle queries across multiple pages
4. **History Tracking**: Track widget state changes over time
5. **Visual Mapping**: Generate visual representations of widget relationships

