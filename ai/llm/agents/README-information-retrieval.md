# Information Retrieval Agent - Quick Reference

## Overview

The Information Retrieval Agent is a LangGraph-based orchestrator that answers complex questions about application state, widget behavior, and page interactions by coordinating multiple subagents.

## Architecture Summary

```
Information Retrieval Agent (Orchestrator)
    ├─→ Current Page State Agent (Subagent)
    │   ├─→ Gets element tree
    │   ├─→ Extracts properties/styles
    │   ├─→ Finds tabbar → activePage
    │   └─→ Gets selected widget
    │
    ├─→ File Operations Agent (Existing)
    │   └─→ Retrieves page files (.component.js, .styles.js, .script.js, .variables.js)
    │
    └─→ Page Agent (Subagent)
        ├─→ Parses files
        ├─→ Maps relationships
        ├─→ Locates widgets
        ├─→ Maps event handlers
        ├─→ Maps styles
        ├─→ Maps properties
        └─→ Builds understanding
```

## Key Nodes

1. **query-analyzer**: Analyzes user query intent
2. **current-page-state**: Invokes Current Page State Agent
3. **resolve-page-name**: Resolves page name from tabbar or user input
4. **file-operations**: Invokes File Operations Agent
5. **page-agent**: Invokes Page Agent for file analysis
6. **answer-synthesis**: Combines all information into final answer

## State Structure

```typescript
interface InformationRetrievalAgentState {
  userQuery: string;
  channelId?: string;
  currentPageState?: {
    pageName?: string;
    selectedWidget?: {
      widgetId: string;
      widgetName: string;
      properties: Record<string, any>;
      styles: Record<string, any>;
    };
  };
  pageFiles?: {
    component?: string;
    styles?: string;
    script?: string;
    variables?: string;
  };
  pageAgentAnalysis?: {
    fileRelations: Record<string, any>;
    widgetLocations: Record<string, any>;
    eventHandlers: Record<string, any>;
    styleMappings: Record<string, any>;
    propertyMappings: Record<string, any>;
    understanding: string;
  };
  finalAnswer?: string;
  researchSteps: Array<{ id: string; description: string; status: string }>;
}
```

## Execution Flow

1. **Query Analysis** → Understand user intent
2. **Get Current Page State** → UI layer data + selected widget
3. **Resolve Page Name** → From tabbar or user input
4. **Retrieve Page Files** → Via File Operations Agent
5. **Analyze Page Files** → Via Page Agent
6. **Synthesize Answer** → Combine all information

## Example Query

**Input**: "What happens when I tap on the selected widget?"

**Output**: 
"When you tap on button1, it triggers the onButton1Tap event handler defined in Main.script.js which [description]. The widget is located in Main.component.js and has styles from Main.styles.js..."

## Subagents

### Current Page State Agent
- **Purpose**: Retrieve current UI state
- **Tools**: `get_ui_layer_data`
- **Output**: Page name, selected widget, element tree, properties/styles

### Page Agent
- **Purpose**: Analyze page files
- **Tools**: None (pure analysis)
- **Output**: File relationships, widget locations, event handlers, style mappings

## Integration Points

- **File Operations Agent**: Invoked to retrieve page files
- **UI Layer Tools**: Used by Current Page State Agent
- **LLM**: Used for analysis and synthesis

## Error Handling

- Page name not found → Request user clarification
- Files not found → Try alternatives or inform user
- Widget not found → Use available information
- Subagent failures → Continue with partial data

## Key Features

- ✅ Multi-agent orchestration
- ✅ Subagent delegation
- ✅ Tool chaining
- ✅ Prompt chaining
- ✅ State management
- ✅ Error recovery
- ✅ Progress tracking
- ✅ User clarification (interrupts)

## Documentation Files

1. **information-retrieval-agent.md**: Complete architecture documentation
2. **information-retrieval-agent-implementation.md**: Implementation details with diagrams
3. **README.md** (this file): Quick reference

## Next Steps

1. Review architecture documentation
2. Review implementation details
3. Approve design
4. Begin implementation

