# Information Retrieval Agent - Implementation Details

## Visual Flow Diagrams

### Main Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Query                                   │
│  "What happens when I tap on the selected widget?"              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Query Analyzer Node                                 │
│  • Parse query intent                                            │
│  • Identify widget reference                                     │
│  • Identify action/event                                         │
│  • Create execution plan                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      Invoke Current Page State Agent (Subagent)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Get Element Tree (get_ui_layer_data)                  │  │
│  │    → Basic info: id, name, tagName for all widgets        │  │
│  │ 2. Identify Target Widget (from query)                  │  │
│  │    → Extract widget ID from tree                         │  │
│  │ 3. Get Widget Properties/Styles                          │  │
│  │    → Call get_widget_properties_styles(widgetId)         │  │
│  │ 4. Find Tabbar → Extract activePage property             │  │
│  │    → May also fetch tabbar properties/styles if needed   │  │
│  │ 5. Assemble Current Page State                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         Route Decision: Page Name Resolved?                    │
│  ┌──────────────────────┐         ┌──────────────────────┐    │
│  │   YES                │         │   NO                 │    │
│  │   ──────             │         │   ──────             │    │
│  │                      │         │                      │    │
│  │   Continue to        │         │   Resolve Page Name  │    │
│  │   File Operations    │         │   Node               │    │
│  └──────────────────────┘         └──────────┬───────────┘    │
│                                               │                │
│                                               ▼                │
│                                   ┌───────────────────────────┐│
│                                   │  Check Tabbar Property   ││
│                                   │  • Found? Use it          ││
│                                   │  • Not found? Ask user    ││
│                                   └──────────┬───────────────┘│
│                                              │                 │
│                                              ▼                 │
│                                   ┌───────────────────────────┐│
│                                   │  User Clarification       ││
│                                   │  Needed? → INTERRUPT      ││
│                                   │  Provided? → Continue     ││
│                                   └──────────┬───────────────┘│
│                                              │                 │
└──────────────────────────────────────────────┼─────────────────┘
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│      Invoke File Operations Agent (Existing Agent)             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Query: "Find and read Main.component.js,                │  │
│  │         Main.styles.js, Main.script.js,                  │  │
│  │         Main.variables.js"                               │  │
│  │                                                           │  │
│  │ Steps:                                                    │  │
│  │ 1. find_files("Main.component.js")                       │  │
│  │ 2. read_file("Main.component.js")                       │  │
│  │ 3. find_files("Main.styles.js")                         │  │
│  │ 4. read_file("Main.styles.js")                         │  │
│  │ 5. find_files("Main.script.js")                         │  │
│  │ 6. read_file("Main.script.js")                         │  │
│  │ 7. find_files("Main.variables.js")                      │  │
│  │ 8. read_file("Main.variables.js")                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Output: pageFiles { component, styles, script, variables }    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            Invoke Page Agent (Subagent)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Input: pageFiles (4 files) + currentPageState           │  │
│  │                                                           │  │
│  │ Nodes:                                                    │  │
│  │ 1. Parse Files Node                                      │  │
│  │    • Parse component.js → widget structure               │  │
│  │    • Parse script.js → event handlers                   │  │
│  │    • Parse styles.js → style definitions                │  │
│  │    • Parse variables.js → variable definitions          │  │
│  │                                                           │  │
│  │ 2. Map File Relationships (parallel)                    │  │
│  │    • Component → Script imports                          │  │
│  │    • Component → Styles references                       │  │
│  │    • Script → Variables usage                            │  │
│  │                                                           │  │
│  │ 3. Locate Widgets (parallel)                            │  │
│  │    • Find widget in component.js                         │  │
│  │    • Map widget name to DOM position                     │  │
│  │    • Extract widget hierarchy                            │  │
│  │                                                           │  │
│  │ 4. Map Event Handlers (parallel)                        │  │
│  │    • Extract onButton1Tap from script.js                │  │
│  │    • Map to widget button1                               │  │
│  │    • Identify handler function body                      │  │
│  │                                                           │  │
│  │ 5. Map Styles (parallel)                                │  │
│  │    • Find button1Styles in styles.js                    │  │
│  │    • Map styles to widget                               │  │
│  │    • Extract style properties                            │  │
│  │                                                           │  │
│  │ 6. Map Properties (parallel)                             │  │
│  │    • Extract properties from component.js                │  │
│  │    • Map to widget instances                             │  │
│  │    • Link to styles and events                           │  │
│  │                                                           │  │
│  │ 7. Build Understanding                                   │  │
│  │    • Generate natural language understanding             │  │
│  │    • Create comprehensive analysis                       │  │
│  │    • Answer: "How do these files work together?"        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Output: pageAgentAnalysis { fileRelations, widgetLocations,  │
│                              eventHandlers, styleMappings,     │
│                              propertyMappings, understanding }  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Answer Synthesis Node                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Input:                                                    │  │
│  │ • userQuery                                               │  │
│  │ • currentPageState (selectedWidget, properties, styles)  │  │
│  │ • pageAgentAnalysis (all mappings and understanding)     │  │
│  │                                                           │  │
│  │ Process:                                                  │  │
│  │ • Combine all information                                 │  │
│  │ • Answer specific questions:                              │  │
│  │   1. Where is widget located?                             │  │
│  │   2. How is it used?                                      │  │
│  │   3. What events are associated?                          │  │
│  │   4. What styles are applied?                            │  │
│  │   5. What properties are set?                            │  │
│  │   6. What happens when action is performed?              │  │
│  │                                                           │  │
│  │ Output: Comprehensive natural language answer             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Final Answer                               │
│  "When you tap on button1, it triggers the onButton1Tap       │
│   event handler which [description]. The widget has styles     │
│   from Main.styles.js and properties set in Main.component.js"  │
└─────────────────────────────────────────────────────────────────┘
```

### Current Page State Agent Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           Current Page State Agent                               │
│                    (Subagent)                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         Get Element Tree Node                                    │
│  Tool: get_ui_layer_data(channelId, dataType: 'components')     │
│  Output: Full component tree with basic info (id, name, tagName)│
│          for all widgets - NO properties/styles by default       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      Identify Target Widget Node                                 │
│  • Parse query to identify widget reference                     │
│  • Find widget in element tree by name                          │
│  • Extract widget ID                                            │
│  • Store targetWidgetId and targetWidgetName                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│      Get Widget Properties/Styles Node                          │
│  • Check if widget already has properties/styles in tree       │
│  • If not, call get_widget_properties_styles(widgetId)         │
│  • Tool handles client-side fetch and polling                   │
│  • Extract properties and styles from result                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │                                   │
         ▼                                   ▼
┌──────────────────────┐         ┌──────────────────────┐
│  Find Tabbar Node    │         │ Assemble State Node  │
│  • Search for        │         │                      │
│    tabbar widget     │         │                      │
│  • If no properties, │         │                      │
│    fetch via         │         │                      │
│    get_widget_       │         │                      │
│    properties_styles │         │                      │
│  • Extract           │         │                      │
│    activePage        │         │                      │
│    property          │         │                      │
└──────────┬───────────┘         └──────────┬──────────┘
           │                                │
           └────────────┬──────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Return currentPageState                            │
│  • elementTree (basic info for all widgets)                     │
│  • selectedWidget (with properties/styles)                      │
│  • activePageFromTabbar                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Page Agent Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Page Agent                                    │
│                    (Subagent)                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Parse Files Node                                    │
│  Input: pageFiles { component, styles, script, variables }      │
│                                                                   │
│  Parse:                                                           │
│  • component.js → AST/widget structure                          │
│  • script.js → Function definitions, event handlers             │
│  • styles.js → Style definitions, class mappings                 │
│  • variables.js → Variable definitions, exports                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────────┐
         │                                   │
         ▼                                   ▼
┌──────────────────────┐         ┌──────────────────────┐
│ Map File             │         │ Locate Widgets Node │
│ Relationships Node    │         │ • Find widget in    │
│ • Component → Script  │         │   component.js      │
│ • Component → Styles  │         │ • Map to DOM        │
│ • Script → Variables │         │   position           │
│                      │         │ • Extract hierarchy  │
└──────────┬───────────┘         └──────────┬──────────┘
           │                                │
           └────────────┬──────────────────┘
                        │
                        ▼
         ┌───────────────────────────────────┐
         │                                   │
         ▼                                   ▼
┌──────────────────────┐         ┌──────────────────────┐
│ Map Event            │         │ Map Styles Node     │
│ Handlers Node        │         │ • Find styles in    │
│ • Extract handlers   │         │   styles.js          │
│   from script.js     │         │ • Map to widgets     │
│ • Map to widgets     │         │ • Extract properties │
│ • Identify function  │         │                      │
│   bodies             │         │                      │
└──────────┬───────────┘         └──────────┬──────────┘
           │                                │
           └────────────┬──────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│          Map Properties Node                                     │
│  • Extract properties from component.js                          │
│  • Map to widget instances                                       │
│  • Link to styles and events                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         Build Understanding Node                                 │
│  Generate natural language understanding:                        │
│  "button1 is a Button widget in Main.component.js.              │
│   It has an onTap event handler (onButton1Tap) defined in       │
│   Main.script.js. The handler does [X]. Styles are defined in    │
│   Main.styles.js as button1Styles..."                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Return analysis                                     │
│  { fileRelations, widgetLocations, eventHandlers,              │
│    styleMappings, propertyMappings, understanding }             │
└─────────────────────────────────────────────────────────────────┘
```

## State Transition Diagram

```
Initial State
    ↓
{ userQuery: "...", channelId: "...", researchSteps: [] }
    ↓
[Query Analyzer]
    ↓
{ queryAnalysis: {...}, researchSteps: [{"id": "query-analysis", ...}] }
    ↓
[Invoke Current Page State Agent]
    ↓
{ currentPageState: { pageName: "Main", selectedWidget: {...}, ... }, 
  researchSteps: [..., {"id": "current-page-state", ...}] }
    ↓
[Route Decision: Page Name Resolved?]
    ↓
YES → [Invoke File Operations Agent]
NO  → [Resolve Page Name] → [User Clarification?] → YES → [INTERRUPT]
                                                      NO  → [Continue]
    ↓
{ pageFiles: { component: "...", styles: "...", script: "...", variables: "..." },
  researchSteps: [..., {"id": "retrieve-page-files", ...}] }
    ↓
[Invoke Page Agent]
    ↓
{ pageAgentAnalysis: { fileRelations: {...}, widgetLocations: {...}, ... },
  researchSteps: [..., {"id": "analyze-page-files", ...}] }
    ↓
[Answer Synthesis]
    ↓
{ finalAnswer: "...", researchSteps: [..., {"id": "synthesize-answer", ...}] }
    ↓
END
```

## LangGraph Implementation Structure

### Main Graph Definition

```typescript
export function createInformationRetrievalAgent(
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<InformationRetrievalAgentState>({
    channels: {
      // ... state channels (see main documentation)
    },
  })
    .addNode('query-analyzer', queryAnalyzerNode)
    .addNode('current-page-state', invokeCurrentPageStateAgent)
    .addNode('resolve-page-name', resolvePageNameNode)
    .addNode('file-operations', invokeFileOperationsAgent)
    .addNode('page-agent', invokePageAgent)
    .addNode('answer-synthesis', synthesizeAnswerNode)
    
    // Edges
    .addEdge(START, 'query-analyzer')
    .addEdge('query-analyzer', 'current-page-state')
    .addConditionalEdges('current-page-state', routeAfterPageState, {
      'resolve-page-name': 'resolve-page-name',
      'file-operations': 'file-operations',
    })
    .addConditionalEdges('resolve-page-name', routeAfterUserClarification, {
      'resolve-page-name': 'resolve-page-name',
      'file-operations': 'file-operations',
      'wait-for-user': 'wait-for-user', // INTERRUPT
    })
    .addEdge('file-operations', 'page-agent')
    .addEdge('page-agent', 'answer-synthesis')
    .addEdge('answer-synthesis', END);

  return workflow;
}
```

### Current Page State Agent Graph

```typescript
function createCurrentPageStateAgent(
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<CurrentPageStateAgentState>({
    channels: {
      channelId: { reducer: (x, y) => y ?? x },
      query: { reducer: (x, y) => y ?? x },
      elementTree: { reducer: (x, y) => y ?? x },
      targetWidgetId: { reducer: (x, y) => y ?? x },
      targetWidgetName: { reducer: (x, y) => y ?? x },
      selectedWidget: { reducer: (x, y) => y ?? x },
      activePageFromTabbar: { reducer: (x, y) => y ?? x },
      currentPageState: { reducer: (x, y) => y ?? x },
      errors: { reducer: (x, y) => y ? [...(x || []), ...y] : x },
    },
  })
    .addNode('get-element-tree', getElementTreeNode)
    .addNode('identify-target-widget', identifyTargetWidgetNode)
    .addNode('get-widget-properties-styles', getWidgetPropertiesStylesNode)
    .addNode('find-tabbar', findTabbarNode)
    .addNode('assemble-state', assembleStateNode)
    
    .addEdge(START, 'get-element-tree')
    .addEdge('get-element-tree', 'identify-target-widget')
    .addEdge('identify-target-widget', 'get-widget-properties-styles')
    .addEdge('get-widget-properties-styles', 'find-tabbar')
    .addEdge('find-tabbar', 'assemble-state')
    .addEdge('assemble-state', END);

  return workflow;
}
```

### Page Agent Graph

```typescript
function createPageAgent(
  channelId?: string,
  projectLocation?: string
) {
  const workflow = new StateGraph<PageAgentState>({
    channels: {
      pageFiles: { reducer: (x, y) => y ? { ...x, ...y } : x },
      currentPageState: { reducer: (x, y) => y ?? x },
      userQuery: { reducer: (x, y) => y ?? x },
      analysis: { reducer: (x, y) => y ?? x },
    },
  })
    .addNode('parse-files', parseFilesNode)
    .addNode('map-file-relationships', mapFileRelationshipsNode)
    .addNode('locate-widgets', locateWidgetsNode)
    .addNode('map-event-handlers', mapEventHandlersNode)
    .addNode('map-styles', mapStylesNode)
    .addNode('map-properties', mapPropertiesNode)
    .addNode('build-understanding', buildUnderstandingNode)
    
    .addEdge(START, 'parse-files')
    .addEdge('parse-files', 'map-file-relationships')
    .addEdge('parse-files', 'locate-widgets')
    .addEdge('parse-files', 'map-event-handlers')
    .addEdge('parse-files', 'map-styles')
    .addEdge('parse-files', 'map-properties')
    .addEdge('map-file-relationships', 'build-understanding')
    .addEdge('locate-widgets', 'build-understanding')
    .addEdge('map-event-handlers', 'build-understanding')
    .addEdge('map-styles', 'build-understanding')
    .addEdge('map-properties', 'build-understanding')
    .addEdge('build-understanding', END);

  return workflow;
}
```

## Key Implementation Functions

### Helper Functions

```typescript
// Step management
function addStep(
  steps: Array<{ id: string; description: string; status: string }>,
  step: { id: string; description: string; status: string }
): Array<{ id: string; description: string; status: string }> {
  return [...steps, step];
}

function updateStep(
  steps: Array<{ id: string; description: string; status: string }>,
  stepId: string,
  status: string
): Array<{ id: string; description: string; status: string }> {
  return steps.map(s => s.id === stepId ? { ...s, status } : s);
}

// Widget finding helpers
function findSelectedWidget(elementTree: any): any {
  if (elementTree.selected === true) return elementTree;
  if (elementTree.children && Array.isArray(elementTree.children)) {
    for (const child of elementTree.children) {
      const found = findSelectedWidget(child);
      if (found) return found;
    }
  }
  return null;
}

function findTabbar(elementTree: any): any {
  if (elementTree.type === 'Tabbar' || elementTree.name?.toLowerCase().includes('tabbar')) {
    return elementTree;
  }
  if (elementTree.children && Array.isArray(elementTree.children)) {
    for (const child of elementTree.children) {
      const found = findTabbar(child);
      if (found) return found;
    }
  }
  return null;
}

// File extraction helpers
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

## Example State Snapshots

### After Query Analysis

```typescript
{
  userQuery: "What happens when I tap on the selected widget?",
  channelId: "channel-123",
  queryAnalysis: {
    widgetReference: "selected",
    action: "tap",
    informationNeeded: ["events", "behavior", "properties", "styles"],
    executionPlan: ["current-page-state", "file-operations", "page-agent"]
  },
  researchSteps: [
    { id: "query-analysis", description: "Analyzing user query", status: "completed" }
  ]
}
```

### After Current Page State

```typescript
{
  // ... previous state
  currentPageState: {
    pageName: "Main",
    activePageFromTabbar: "Main",
    selectedWidget: {
      widgetId: "widget-123",
      widgetName: "button1",
      properties: {
        caption: "Click Me",
        show: true,
        disabled: false
      },
      styles: {
        root: { backgroundColor: "#007bff" },
        text: { color: "#ffffff" }
      }
    },
    elementTree: { /* full tree with basic info */ },
    selectedWidget: {
      widgetId: "widget-123",
      widgetName: "button1",
      properties: { /* fetched via get_widget_properties_styles */ },
      styles: { /* fetched via get_widget_properties_styles */ }
    }
  },
  researchSteps: [
    // ... previous steps
    { id: "current-page-state", description: "Retrieving current page state", status: "completed" }
  ]
}
```

### After File Operations

```typescript
{
  // ... previous state
  pageFiles: {
    component: "/* Main.component.js content */",
    styles: "/* Main.styles.js content */",
    script: "/* Main.script.js content */",
    variables: "/* Main.variables.js content */"
  },
  researchSteps: [
    // ... previous steps
    { id: "retrieve-page-files", description: "Retrieving page files", status: "completed" }
  ]
}
```

### After Page Agent

```typescript
{
  // ... previous state
  pageAgentAnalysis: {
    fileRelations: {
      componentImportsScript: true,
      componentReferencesStyles: true,
      scriptUsesVariables: true
    },
    widgetLocations: {
      button1: {
        file: "component.js",
        line: 45,
        hierarchy: ["Page", "Container", "Button"]
      }
    },
    eventHandlers: {
      button1: {
        event: "onTap",
        handler: "onButton1Tap",
        function: "function onButton1Tap() { /* ... */ }",
        location: "script.js",
        line: 120
      }
    },
    styleMappings: {
      button1: {
        styleClass: "button1Styles",
        location: "styles.js",
        properties: { backgroundColor: "#007bff", color: "#ffffff" }
      }
    },
    propertyMappings: {
      button1: {
        properties: { caption: "Click Me", show: true },
        location: "component.js"
      }
    },
    understanding: "button1 is a Button widget in Main.component.js at line 45. It has an onTap event handler (onButton1Tap) defined in Main.script.js at line 120. The handler navigates to the next page. Styles are defined in Main.styles.js as button1Styles."
  },
  researchSteps: [
    // ... previous steps
    { id: "analyze-page-files", description: "Analyzing page files", status: "completed" }
  ]
}
```

### Final State

```typescript
{
  // ... all previous state
  finalAnswer: "When you tap on the selected widget (button1), it triggers the onButton1Tap event handler defined in Main.script.js at line 120. This handler function navigates to the next page using the navigation service. The widget is located in Main.component.js at line 45 within a Container component. It has styles defined in Main.styles.js as button1Styles with a blue background (#007bff) and white text. The widget properties include caption 'Click Me', show: true, and disabled: false.",
  researchSteps: [
    // ... all steps
    { id: "synthesize-answer", description: "Synthesizing final answer", status: "completed" }
  ]
}
```

## Error Recovery Strategies

### Page Name Not Found

```typescript
{
  currentPageState: {
    // ... other state
    activePageFromTabbar: undefined
  },
  userClarification: {
    needed: true,
    question: "Could not detect the current page from tabbar. Please provide the page name."
  },
  // Wait for user input via interrupt
}
```

### Page Files Not Found

```typescript
{
  errors: [
    {
      step: "retrieve-page-files",
      error: "Could not find Main.component.js",
      recoveryAction: "Try alternative file names or check project structure"
    }
  ],
  // Continue with available files or request user clarification
}
```

## Integration Checklist

- [ ] Create `information-retrieval-agent.ts` with main graph
- [ ] Create `current-page-state-agent.ts` subagent
- [ ] Create `page-agent.ts` subagent
- [ ] Implement all node functions
- [ ] Implement routing logic
- [ ] Add error handling
- [ ] Add streaming support
- [ ] Test with example queries
- [ ] Integrate with existing file operations agent
- [ ] Add user clarification handling (interrupts)
- [ ] Add progress tracking

