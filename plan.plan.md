# Information Retrieval Agent Implementation Plan

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
- Create `getWidgetPropertiesStyles()` function that takes widgetId directly
- Check if widget already has properties/styles in current tree
- If not, trigger client-side fetch via WebSocket/API
- Poll server store until properties/styles available
- Return properties/styles directly
- Add to tool registry in `ai/llm/tools/index.ts`

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

### 2.3 Implement Identify Target Widget Node
**Function**: `identifyTargetWidgetNode`
- Parse query to identify widget reference (specific name, "selected widget", etc.)
- Find widget in element tree by name
- Extract widget ID
- Store `targetWidgetId` and `targetWidgetName` in state

### 2.4 Implement Get Widget Properties/Styles Node
**Function**: `getWidgetPropertiesStylesNode`
- Check if widget already has properties/styles in current tree
- If yes, extract directly from tree
- If no, call `executeTool('get_widget_properties_styles', { channelId, widgetId })`
- Extract properties and styles from result
- Update state with selectedWidget object

### 2.5 Implement Find Tabbar Node
**Function**: `findTabbarNode`
- Search component tree for tabbar widget
- If tabbar has properties, extract `activePage`
- If tabbar doesn't have properties, call `get_widget_properties_styles` for tabbar
- Extract `activePage` property from tabbar's properties
- Update state with `activePageFromTabbar`

### 2.6 Implement Assemble State Node
**Function**: `assembleStateNode`
- Combine all gathered information
- Create complete `currentPageState` object
- Return assembled state

### 2.7 Wire Current Page State Agent Graph
- START → get-element-tree → identify-target-widget → get-widget-properties-styles
- Parallel: find-tabbar (can run anytime after get-element-tree)
- Both converge to assemble-state → END

## Phase 3: Page Agent (Subagent)

### 3.1 Create Page Agent
**File**: `ai/llm/agents/page-agent.ts`
- Import LangGraph dependencies
- Import `createGeminiClient` from `../gemini`
- Create `createPageAgent()` function
- Define state channels with reducers

### 3.2 Implement Parse Files Node
**Function**: `parseFilesNode`
- Parse component.js to extract widget structure
- Parse script.js to extract event handlers
- Parse styles.js to extract style definitions
- Parse variables.js to extract variable definitions
- Store parsed structures in state

### 3.3 Implement Map File Relationships Node
**Function**: `mapFileRelationshipsNode`
- Analyze imports in component.js
- Analyze style references
- Analyze variable usage
- Build `fileRelations` map

### 3.4 Implement Locate Widgets Node
**Function**: `locateWidgetsNode`
- Find widget instances in component.js
- Map widget names to DOM positions
- Extract widget hierarchy
- Build `widgetLocations` map

### 3.5 Implement Map Event Handlers Node
**Function**: `mapEventHandlersNode`
- Extract event handler functions from script.js
- Map events to widgets
- Extract function bodies
- Build `eventHandlers` map

### 3.6 Implement Map Styles Node
**Function**: `mapStylesNode`
- Find style class definitions in styles.js
- Map styles to widgets
- Extract style properties
- Build `styleMappings` map

### 3.7 Implement Map Properties Node
**Function**: `mapPropertiesNode`
- Extract widget properties from component.js
- Map properties to widget instances
- Link properties to styles and events
- Build `propertyMappings` map

### 3.8 Implement Build Understanding Node
**Function**: `buildUnderstandingNode`
- Use LLM to generate natural language understanding
- Create prompt combining all mappings
- Generate comprehensive analysis
- Store in `understanding` field

### 3.9 Wire Page Agent Graph
- START → parse-files → [all mapping nodes in parallel]
- All mapping nodes converge to build-understanding → END

## Phase 4: Information Retrieval Agent (Main Orchestrator)

### 4.1 Create Information Retrieval Agent
**File**: `ai/llm/agents/information-retrieval-agent.ts`
- Import LangGraph dependencies
- Import subagent creation functions
- Import File Operations Agent
- Import helper utilities
- Create `createInformationRetrievalAgent()` function
- Define state channels with reducers

### 4.2 Implement Query Analyzer Node
**Function**: `queryAnalyzerNode`
- Use LLM to analyze user query
- Extract: widget reference, action/event, information type needed
- Create execution plan
- Update `researchSteps` with analysis step

### 4.3 Implement Invoke Current Page State Agent Node
**Function**: `invokeCurrentPageStateAgent`
- Create Current Page State Agent graph
- **Compile**: `const currentPageStateAgent = createCurrentPageStateAgent(...).compile()`
- Invoke with subagent state
- Extract `currentPageState` from result
- Update `researchSteps` and `subagentResults`

### 4.4 Implement Resolve Page Name Node
**Function**: `resolvePageNameNode`
- Check if `activePageFromTabbar` exists
- If not, check for user clarification response
- If neither exists, set `userClarification.needed = true`
- Update `currentPageState.pageName`

### 4.5 Implement Invoke File Operations Agent Node
**Function**: `invokeFileOperationsAgent`
- Extract pageName from state
- Build file operations query for 4 files
- Import `createFileOperationsAgent`
- Create File Operations Agent graph
- **Compile**: `const fileAgent = fileAgentGraph.compile()`
- Invoke with file operations query
- Use `extractPageFiles()` helper to parse results
- Update state with `pageFiles`

### 4.6 Implement Invoke Page Agent Node
**Function**: `invokePageAgent`
- Create Page Agent graph
- **Compile**: `const pageAgent = pageAgentGraph.compile()`
- Invoke with pageFiles, currentPageState, userQuery
- Extract `analysis` from result
- Update `pageAgentAnalysis` and `subagentResults`

### 4.7 Implement Answer Synthesis Node
**Function**: `synthesizeAnswerNode`
- Build comprehensive prompt with all gathered information
- Use LLM to generate final answer
- Answer all questions: location, usage, events, styles, properties, behavior
- Update `finalAnswer` and `researchSteps`

### 4.8 Implement Routing Functions
**Functions**: `routeAfterPageState`, `routeAfterUserClarification`
- Check state conditions
- Return appropriate node names for conditional edges

### 4.9 Wire Information Retrieval Agent Graph
- START → query-analyzer → current-page-state
- Add conditional edges for routing
- Configure edges: file-operations → page-agent → answer-synthesis → END

### 4.10 Create Public API Functions
**Functions**: `sendMessageWithInformationRetrievalAgent()`, `sendMessageWithInformationRetrievalAgentStreaming()`
- Similar pattern to File Operations Agent
- Accept: message, history, channelId, projectLocation, onStepUpdate
- Create agent, compile, invoke with initial state
- Return final answer with research steps

## Phase 5: Error Handling and Edge Cases

### 5.1 Add Error Handling
- Handle page name not found → request user clarification
- Handle page files not found → try alternatives or inform user
- Handle widget not found → use available information
- Handle properties/styles timeout → continue with basic info or retry
- Handle subagent failures → log error, continue with partial data

### 5.2 Add User Clarification Support
- Implement interrupt mechanism for user input
- Store clarification question in state
- Wait for user response
- Resume execution after response received

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
- Verify UI layer tool integration
- Test new `get_widget_properties_styles` tool
- Test LLM calls for analysis and synthesis

### 6.3 Create Test Cases
**File**: `ai/llm/agents/information-retrieval-agent.spec.ts`
- Test query analyzer with various query types
- Test Current Page State Agent with mock UI layer data
- Test Page Agent with mock file contents
- Test full flow with example query
- Test error handling scenarios

## Implementation Order

1. **Phase 1** (Infrastructure): Types, helpers, and new tool - Foundation for all agents
2. **Phase 2** (Current Page State Agent): Complete subagent first - Used by main agent
3. **Phase 3** (Page Agent): Complete subagent second - Used by main agent  
4. **Phase 4** (Main Agent): Orchestrator implementation - Uses subagents
5. **Phase 5** (Error Handling): Robustness - Can be done incrementally
6. **Phase 6** (Testing): Validation - Throughout and at end

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

