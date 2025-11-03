# Information Retrieval Agent - Final Implementation Plan

## Executive Summary

This document outlines the implementation plan for the Information Retrieval Agent system, which uses LangGraph to orchestrate multiple subagents to answer complex questions about application state, widget behavior, and page interactions. The system uses a direct widget ID approach for fetching properties/styles, eliminating the need for widget selection.

## Critical Understanding: Properties/Styles Retrieval

### Current System Behavior

1. **Component Tree Structure**: Contains basic info (id, name, tagName, children) for ALL widgets, but NO properties/styles by default
2. **Properties/Styles Fetching**: Can be done directly with widget ID via `uiAgent.invoke(CALLS.WIDGET.GET_PROPERTIES_N_STYLES, [widgetId])`
3. **Key Insight**: We can get widget IDs from the element tree and directly invoke `uiAgent.invoke(CALLS.WIDGET.GET_PROPERTIES_N_STYLES, [widgetId])` on the client - no selection needed!
4. **Solution**: Create a new server-side tool `get_widget_properties_styles` that:
   - Takes `widgetId` directly (no selection needed)
   - Communicates with client to trigger fetch
   - Waits for sync to server
   - Returns properties/styles directly

### Benefits of Direct Approach

- **No selection needed** - Just get widget ID from tree and fetch properties/styles
- **Simpler flow** - No need to select → wait → extract
- **More flexible** - Can fetch properties/styles for any widget, not just selected one
- **Faster** - Direct fetch without selection step

## Phase 1: Core Infrastructure and Types

### 1.1 Create Type Definitions
**File**: `ai/llm/agents/utils/types.ts`
- Define `InformationRetrievalAgentState` interface
- Define `CurrentPageStateAgentState` interface  
- Define `PageAgentState` interface
- Define helper types for state management
- Reference: `information-retrieval-agent.md` lines 33-108

### 1.2 Create Helper Utilities
**File**: `ai/llm/agents/utils/helpers.ts`
- Implement `addStep()` function for step tracking
- Implement `updateStep()` function for step updates
- Implement `findSelectedWidget()` tree traversal helper
- Implement `findTabbar()` tree traversal helper
- Implement `extractPageFiles()` file extraction helper
- Reference: `information-retrieval-agent-implementation.md` lines 456-519

### 1.3 Create New Tool: get_widget_properties_styles
**File**: `ai/llm/tools/widget-properties-styles.ts` (NEW)

This tool directly fetches widget properties/styles by widget ID without requiring selection:

```typescript
export async function getWidgetPropertiesStyles(
  channelId: string,
  widgetId: string
): Promise<ToolExecutionResult> {
  // 1. Validate inputs
  // 2. Check if widget already has properties/styles in current tree
  // 3. If not, trigger client-side fetch via WebSocket/API
  // 4. Poll server store until properties/styles available
  // 5. Return properties/styles directly
}
```

**Implementation Details**:
- Check current tree first (may already have properties/styles)
- If not available, trigger client-side fetch (via WebSocket message or API)
- Poll server store with retries (max 5 attempts, 2 second delays)
- Return properties/styles directly

**Add to Tool Registry**: `ai/llm/tools/index.ts`
- Add `get_widget_properties_styles` to `toolExecutors`
- Add `getWidgetPropertiesStylesToolSchema()` to `getAllToolSchemas()`

## Phase 2: Current Page State Agent (Subagent)

### 2.1 Create Current Page State Agent
**File**: `ai/llm/agents/current-page-state-agent.ts`
- Import LangGraph dependencies (`StateGraph`, `START`, `END`)
- Import `executeTool` from `../tools`
- Import new `getWidgetPropertiesStyles` tool
- Create `createCurrentPageStateAgent()` function
- Define state channels with reducers

### 2.2 Implement Get Element Tree Node
**Function**: `getElementTreeNode`
- Call `executeTool('get_ui_layer_data', { channelId, dataType: 'components' })`
- Extract component tree from result
- Store basic widget info (id, name, tagName) for all widgets
- Update state with elementTree
- Reference: `server/types/index.ts` WidgetNode structure

### 2.3 Implement Identify Target Widget Node
**Function**: `identifyTargetWidgetNode`
- Parse query to identify widget reference:
  - Specific widget name (e.g., "button1")
  - "selected widget" (find widget with `selected: true`)
  - Widget mentioned in context
- Find widget in element tree by name
- Extract widget ID
- Store `targetWidgetId` and `targetWidgetName` in state

### 2.4 Implement Get Widget Properties/Styles Node
**Function**: `getWidgetPropertiesStylesNode`
- Check if widget already has properties/styles in current tree
- If yes, extract directly from tree
- If no, call `executeTool('get_widget_properties_styles', { channelId, widgetId })`
- Wait for result (tool handles polling internally)
- Extract properties and styles from result
- Update state with selectedWidget object

### 2.5 Implement Find Tabbar Node
**Function**: `findTabbarNode`
- Search component tree for tabbar widget (check `tagName` or `name` contains "tabbar")
- If tabbar has properties (already fetched), extract `activePage`
- If tabbar doesn't have properties, call `get_widget_properties_styles` for tabbar widget ID
- Extract `activePage` property from tabbar's properties
- Update state with `activePageFromTabbar`
- Handle case where tabbar not found

### 2.6 Implement Assemble State Node
**Function**: `assembleStateNode`
- Combine all gathered information:
  - elementTree (basic info for all widgets)
  - selectedWidget (with properties/styles fetched directly)
  - activePageFromTabbar
- Create complete `currentPageState` object
- Return assembled state

### 2.7 Wire Current Page State Agent Graph
- START → get-element-tree → identify-target-widget → get-widget-properties-styles
- Parallel: find-tabbar (can run anytime after get-element-tree, may also fetch properties if needed)
- Both converge to assemble-state → END

**State Structure**:
```typescript
interface CurrentPageStateAgentState {
  channelId?: string;
  query: string;
  elementTree?: WidgetNode;
  targetWidgetId?: string; // Widget ID to fetch properties/styles for
  targetWidgetName?: string; // Widget name (for reference)
  selectedWidget?: {
    widgetId: string;
    widgetName: string;
    properties?: Record<string, any>;
    styles?: WidgetNode['styles'];
  };
  activePageFromTabbar?: string;
  currentPageState?: any;
  errors: Array<{ step: string; error: string }>;
}
```

## Phase 3: Page Agent (Subagent)

### 3.1 Create Page Agent
**File**: `ai/llm/agents/page-agent.ts`
- Import LangGraph dependencies
- Import `createGeminiClient` from `../gemini`
- Create `createPageAgent()` function
- Define state channels with reducers
- Reference: `information-retrieval-agent-implementation.md` lines 414-448

### 3.2 Implement Parse Files Node
**Function**: `parseFilesNode`
- Parse component.js to extract widget structure (use regex/AST parsing)
- Parse script.js to extract event handlers and function definitions
- Parse styles.js to extract style definitions and class mappings
- Parse variables.js to extract variable definitions and exports
- Store parsed structures in state
- Reference: `information-retrieval-agent.md` lines 592-596

### 3.3 Implement Map File Relationships Node
**Function**: `mapFileRelationshipsNode`
- Analyze imports in component.js (references to script.js)
- Analyze style references in component.js (references to styles.js)
- Analyze variable usage in script.js (references to variables.js)
- Build `fileRelations` map
- Reference: `information-retrieval-agent.md` lines 598-601

### 3.4 Implement Locate Widgets Node
**Function**: `locateWidgetsNode`
- Find widget instances in component.js file content
- Map widget names to their DOM positions (line numbers)
- Extract widget hierarchy (parent-child relationships)
- Build `widgetLocations` map
- Reference: `information-retrieval-agent.md` lines 603-606

### 3.5 Implement Map Event Handlers Node
**Function**: `mapEventHandlersNode`
- Extract event handler functions from script.js (e.g., `onButton1Tap`)
- Map event names to widget names (e.g., button1 → onButton1Tap)
- Extract function bodies for each handler
- Identify handler locations (file, line number)
- Build `eventHandlers` map
- Reference: `information-retrieval-agent.md` lines 608-611

### 3.6 Implement Map Styles Node
**Function**: `mapStylesNode`
- Find style class definitions in styles.js
- Map style classes to widget names (e.g., button1Styles → button1)
- Extract style properties for each class
- Build `styleMappings` map
- Reference: `information-retrieval-agent.md` lines 613-616

### 3.7 Implement Map Properties Node
**Function**: `mapPropertiesNode`
- Extract widget properties from component.js file content
- Map properties to widget instances
- Link properties to styles and events
- Build `propertyMappings` map
- Reference: `information-retrieval-agent.md` lines 618-621

### 3.8 Implement Build Understanding Node
**Function**: `buildUnderstandingNode`
- Use LLM to generate natural language understanding
- Create prompt combining all mappings and relationships
- Generate comprehensive analysis text
- Answer: "How do these files work together?"
- Store in `understanding` field
- Reference: `information-retrieval-agent.md` lines 623-626

### 3.9 Wire Page Agent Graph
- Add all nodes to graph
- Configure edges: START → parse-files → [all mapping nodes in parallel]
- All mapping nodes converge to build-understanding → END
- Reference: `information-retrieval-agent-implementation.md` lines 434-445

## Phase 4: Information Retrieval Agent (Main Orchestrator)

### 4.1 Create Information Retrieval Agent
**File**: `ai/llm/agents/information-retrieval-agent.ts`
- Import LangGraph dependencies
- Import subagent creation functions
- Import File Operations Agent
- Import helper utilities
- Create `createInformationRetrievalAgent()` function
- Define state channels with reducers (all fields from state interface)
- Reference: `information-retrieval-agent-implementation.md` lines 339-372

### 4.2 Implement Query Analyzer Node
**Function**: `queryAnalyzerNode`
- Use LLM to analyze user query
- Extract: widget reference, action/event, information type needed
- Create execution plan
- Update `researchSteps` with analysis step
- Return `queryAnalysis` object
- Reference: `information-retrieval-agent.md` lines 131-154

### 4.3 Implement Invoke Current Page State Agent Node
**Function**: `invokeCurrentPageStateAgent`
- Create Current Page State Agent graph
- Compile the graph: `graph.compile()`
- Invoke with subagent state (channelId, query)
- Extract `currentPageState` from result
- Handle user clarification if needed
- Update `researchSteps` and `subagentResults`
- Reference: `information-retrieval-agent.md` lines 172-202

### 4.4 Implement Resolve Page Name Node
**Function**: `resolvePageNameNode`
- Check if `activePageFromTabbar` exists in currentPageState
- If not, check for user clarification response
- If neither exists, set `userClarification.needed = true`
- Update `currentPageState.pageName` with resolved value
- Update `researchSteps`
- Reference: `information-retrieval-agent.md` lines 217-251

### 4.5 Implement Invoke File Operations Agent Node
**Function**: `invokeFileOperationsAgent`
- Extract pageName from state
- Build file operations query for 4 files (component, styles, script, variables)
- Import `createFileOperationsAgent`
- Create File Operations Agent graph
- **Compile the graph**: `const fileAgent = fileAgentGraph.compile()`
- Invoke with file operations query
- Use `extractPageFiles()` helper to parse results
- Update state with `pageFiles`
- Handle errors (files not found)
- Reference: `information-retrieval-agent.md` lines 266-346

### 4.6 Implement Invoke Page Agent Node
**Function**: `invokePageAgent`
- Create Page Agent graph
- **Compile the graph**: `const pageAgent = pageAgentGraph.compile()`
- Invoke with pageFiles, currentPageState, userQuery
- Extract `analysis` from result
- Update `pageAgentAnalysis` and `subagentResults`
- Update `researchSteps`
- Reference: `information-retrieval-agent.md` lines 365-403

### 4.7 Implement Answer Synthesis Node
**Function**: `synthesizeAnswerNode`
- Build comprehensive prompt with:
  - User query
  - Selected widget info (properties, styles)
  - Page analysis (all mappings, understanding)
- Use LLM to generate final answer
- Answer all questions: location, usage, events, styles, properties, behavior
- Update `finalAnswer` and `researchSteps`
- Reference: `information-retrieval-agent.md` lines 420-458

### 4.8 Implement Routing Functions
**Functions**: `routeAfterPageState`, `routeAfterUserClarification`
- `routeAfterPageState`: Check if page name resolved, route accordingly
- `routeAfterUserClarification`: Check if user provided response, route accordingly
- Return appropriate node names for conditional edges
- Reference: `information-retrieval-agent.md` lines 480-498

### 4.9 Wire Information Retrieval Agent Graph
- Add all nodes to graph
- Configure edges: START → query-analyzer → current-page-state
- Add conditional edge from current-page-state → routeAfterPageState
- Add conditional edge from resolve-page-name → routeAfterUserClarification
- Configure edges: file-operations → page-agent → answer-synthesis → END
- Reference: `information-retrieval-agent-implementation.md` lines 356-369

### 4.10 Create Public API Functions
**Functions**: `sendMessageWithInformationRetrievalAgent()`, `sendMessageWithInformationRetrievalAgentStreaming()`
- Similar pattern to File Operations Agent
- Accept: message, history, channelId, projectLocation, onStepUpdate
- Create agent, compile, invoke with initial state
- Return final answer with research steps
- Handle streaming updates via callback
- Reference: `file-operations-agent.ts` lines 446-531

## Phase 5: Error Handling and Edge Cases

### 5.1 Add Error Handling
- Handle page name not found → request user clarification
- Handle page files not found → try alternatives or inform user
- Handle widget not found → use available information or inform user
- Handle properties/styles timeout → continue with basic info or retry
- Handle subagent failures → log error, continue with partial data
- Add error recovery actions
- Reference: `information-retrieval-agent.md` lines 722-735

### 5.2 Add User Clarification Support
- Implement interrupt mechanism for user input
- Store clarification question in state
- Wait for user response
- Resume execution after response received
- Reference: `information-retrieval-agent.md` lines 97-101

## Phase 6: Integration and Testing

### 6.1 Update Agent Exports
**File**: `ai/llm/agents/index.ts` (create if needed)
- Export `createInformationRetrievalAgent`
- Export `sendMessageWithInformationRetrievalAgent`
- Export `sendMessageWithInformationRetrievalAgentStreaming`
- Export subagent creation functions
- Export types

### 6.2 Integration Points
- Ensure File Operations Agent integration works correctly
- Verify UI layer tool integration in Current Page State Agent
- Test new `get_widget_properties_styles` tool
- Test LLM calls for analysis and synthesis
- Reference: `information-retrieval-agent.md` lines 770-806

### 6.3 Create Test Cases
**File**: `ai/llm/agents/information-retrieval-agent.spec.ts`
- Test query analyzer with various query types
- Test Current Page State Agent with mock UI layer data
- Test `get_widget_properties_styles` tool
- Test Page Agent with mock file contents
- Test full flow with example query
- Test error handling scenarios
- Reference: `information-retrieval-agent.md` lines 890-903

## Implementation Flow Summary

### Current Page State Agent Flow
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

### Information Retrieval Agent Flow
```
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

## Example Query Flow

**Query**: "What happens when I tap on button1?"

1. **Query Analyzer** → Identifies: button1 widget, tap event, behavior inquiry
2. **Current Page State Agent**:
   - Get Element Tree → Get basic info for all widgets
   - Identify Target Widget → Find "button1" in tree, extract widgetId = "widget-123"
   - Get Widget Properties/Styles → Call `get_widget_properties_styles('widget-123')` directly
   - Find Tabbar → Extract activePage = "Main"
3. **Page Name Resolution** → Page name resolved: "Main" (from tabbar)
4. **File Operations Agent** → Finds and reads: Main.component.js, Main.styles.js, Main.script.js, Main.variables.js
5. **Page Agent** → Analyzes files, maps relationships, locates widgets, maps event handlers, maps styles, builds understanding
6. **Answer Synthesis** → Combines all information into comprehensive answer

## Key Implementation Notes

- **Always compile graphs**: `graph.compile().invoke(state)` - Never call `.invoke()` directly on StateGraph
- **Direct widget ID approach**: Use `get_widget_properties_styles` instead of `select_widget` for fetching properties/styles
- **Follow existing patterns**: Use `file-operations-agent.ts` as reference for LangGraph structure
- **Use `createGeminiClient()`** for LLM calls
- **Use `executeTool()`** for tool execution
- **Update `researchSteps`** for progress tracking
- **Emit updates** via `onStepUpdate` callback for streaming
- **Handle state merging** correctly with reducers
- **Use TypeScript types** strictly for type safety

## Implementation Order

1. **Phase 1** (Infrastructure): Types, helpers, and new tool - Foundation for all agents
2. **Phase 2** (Current Page State Agent): Complete subagent first - Used by main agent
3. **Phase 3** (Page Agent): Complete subagent second - Used by main agent  
4. **Phase 4** (Main Agent): Orchestrator implementation - Uses subagents
5. **Phase 5** (Error Handling): Robustness - Can be done incrementally
6. **Phase 6** (Testing): Validation - Throughout and at end

## Dependencies

- `@langchain/langgraph` - For state graph implementation
- `@google/genai` - For Gemini LLM integration
- Existing tools: `get_ui_layer_data`, `select_widget`, file system tools
- New tool: `get_widget_properties_styles` (to be created)

## Next Steps

1. Review and approve this plan
2. Create new tool `get_widget_properties_styles`
3. Implement WebSocket/API trigger for client-side fetch (in tool)
4. Begin Phase 1 implementation
5. Progress through phases sequentially
6. Test incrementally at each phase

