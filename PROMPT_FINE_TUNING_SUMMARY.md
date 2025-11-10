# Prompt Fine-Tuning Summary

## Overview

All AI prompts have been fine-tuned with a comprehensive common context that provides:
1. Complete awareness of all available tools and when to use them
2. Complete awareness of all available agents and when to route to them
3. Tool chaining patterns and best practices
4. Agent chaining patterns and best practices
5. Consistent fixed seed usage (seed: 42) for reproducible results

---

## Key Updates

### 1. Common Context Prompt (`ai/llm/prompts/common-context.ts`)

Created a comprehensive context document that includes:

#### Available Tools Documentation
- **UI Layer Tools** (4 tools):
  - `get_ui_layer_data` - Comprehensive UI inspection (console, network, components, timeline, storage, info)
  - `select_widget` - Widget selection/highlighting
  - `get_widget_properties_styles` - Direct property/style access
  - `eval_expression` - JavaScript execution in app context

- **File System Tools** (10 tools):
  - `find_files`, `read_file`, `edit_file`, `write_file`, `append_file`
  - `grep_files`, `list_directory`, `execute_command`, `echo_command`, `sed_command`

#### Agent Routing Documentation
- **Information Retrieval Agent** - Complex UI/behavior questions
- **File Operations Agent** - Multi-step file modifications
- **Codebase Agent** - WaveMaker platform architecture questions
- **Agent Router** - Intelligent query routing

#### Tool Chaining Patterns

**Pattern 1: UI Inspection Chain**
```
get_ui_layer_data('components') → find widget → get_widget_properties_styles
```

**Pattern 2: File Modification Chain**
```
find_files → read_file → edit_file
```
CRITICAL: Never skip read_file before edit_file

**Pattern 3: Widget + File Chain**
```
get_ui_layer_data('components') → find_files → read_file → edit_file
```

**Pattern 4: Error Investigation Chain**
```
get_ui_layer_data('console') → get_ui_layer_data('network') → find_files → read_file
```

#### Agent Chaining Patterns

**Pattern 1: Escalation**
```
Direct Tools → Information Retrieval Agent → Codebase Agent
```

**Pattern 2: Delegation**
```
Main Agent → File Operations Agent (for complex file tasks)
```

**Pattern 3: Consultation**
```
Information Retrieval Agent ⇄ Codebase Agent
```
IR Agent analyzes app code, consults Codebase Agent for platform mechanisms

#### Critical Rules

1. **Always Use Tools First** - Try direct tools before routing to agents
2. **Chain Tools Properly** - find_files → read_file → edit_file (never skip read_file)
3. **Use Exact Paths** - Copy file paths exactly from tool responses
4. **Use Exact Text** - Copy search text exactly from read_file responses
5. **Check Selected Widget** - Use get_ui_layer_data('components'), find selected: true
6. **Avoid Unnecessary Routing** - Don't route to agents if tools can answer directly
7. **Seed Consistency** - All AI operations use fixed seed (42) for reproducibility

---

## Files Updated

### 1. Core Prompt Files

#### `ai/llm/prompts/common-context.ts` (NEW)
- Comprehensive context prompt with all tools and agents
- Tool chaining guidelines
- Agent chaining guidelines
- Decision framework for tool vs agent usage

#### `ai/llm/prompts/system-instruction.ts`
- Updated to include `COMMON_CONTEXT_PROMPT`
- Enhanced operational guidelines
- Maintains existing widget and file operation rules

#### `ai/llm/prompts/index.ts`
- Exports `COMMON_CONTEXT_PROMPT`, `TOOL_CHAINING_GUIDELINES`, `AGENT_CHAINING_GUIDELINES`
- Exports `getCompleteContextPrompt()` function

### 2. Agent Files Updated

#### `ai/llm/agents/agent-router.ts`
- Added `COMMON_CONTEXT_PROMPT` import
- Updated routing prompt to include full context
- Enhanced routing options with "DIRECT TOOLS" option
- Clarified routing decision criteria
- Uses `getAISeed()` for consistent routing decisions

#### `ai/llm/agents/information-retrieval-agent.ts`
- Added `COMMON_CONTEXT_PROMPT` to query analysis
- Added `COMMON_CONTEXT_PROMPT` to answer synthesis
- Enhanced query analysis to consider direct tools first
- Improved decision framework for routing
- Uses `getAISeed()` consistently (2 usages)

#### `ai/llm/agents/codebase-agent/query-analyzer.ts`
- Added `COMMON_CONTEXT_PROMPT` import
- Updated system prompt to include full context
- Enhanced query analysis with tool awareness
- Uses `getAISeed()` for consistent analysis

#### `ai/llm/agents/codebase-agent/codebase-agent.ts`
- Uses `getAISeed()` for consistent codebase analysis

#### `ai/llm/agents/page-agent.ts`
- Uses `getAISeed()` for consistent page analysis

#### `ai/llm/agents/file-operations-agent.ts`
- Uses `getAISeed()` for consistent file operations

#### `ai/llm/agents/codebase-agent/base-sub-agent.ts`
- Uses `getAISeed()` (2 usages) for consistent sub-agent responses

---

## Seed Usage Verification

All agents now use `getAISeed()` consistently:

| File | getAISeed() Usages |
|------|-------------------|
| `agent-router.ts` | 1 |
| `information-retrieval-agent.ts` | 2 |
| `codebase-agent/query-analyzer.ts` | 1 |
| `codebase-agent/codebase-agent.ts` | 1 |
| `codebase-agent/base-sub-agent.ts` | 2 |
| `page-agent.ts` | 1 |
| `file-operations-agent.ts` | 1 |
| **Total** | **9** |

Seed configuration:
- Default seed: 42
- Configurable via `GEMINI_SEED` environment variable
- Defined in `ai/llm/config.ts`

---

## Benefits

### 1. Tool Awareness
- AI now understands ALL available tools and their purposes
- Clear guidance on when to use each tool
- Reduces unnecessary agent routing for simple queries

### 2. Agent Awareness
- AI understands when to route to specialized agents
- Clear escalation patterns from tools → agents
- Better decision making for complex queries

### 3. Tool Chaining
- Explicit patterns for common tool sequences
- Critical rule: Never edit files without reading first
- Proper path and text handling

### 4. Agent Chaining
- Clear patterns for agent collaboration
- Information Retrieval Agent can consult Codebase Agent
- File Operations Agent handles multi-step file tasks

### 5. Reproducibility
- Fixed seed (42) ensures consistent AI behavior
- Same query produces same routing decisions
- Easier debugging and prompt optimization

### 6. Efficiency
- Reduced unnecessary investigation flows
- Direct tool usage for simple queries
- Proper escalation only when needed

---

## Usage Examples

### Example 1: Simple Query (Direct Tools)
**Query:** "What's the selected widget?"

**Expected Flow:**
1. get_ui_layer_data(dataType: 'components')
2. Find widget with selected: true in tree
3. Return widget name and properties
4. **No agent routing needed**

### Example 2: Complex Query (Agent Chain)
**Query:** "What happens when I tap button1?"

**Expected Flow:**
1. Information Retrieval Agent receives query
2. Uses get_ui_layer_data('components') to get page context
3. Finds button1 event handler in page files
4. Discovers handler calls Actions.navigate()
5. **Agent Chaining:** IR Agent consults Codebase Agent about Actions.navigate
6. Synthesizes complete answer with app behavior + platform mechanism

### Example 3: File Modification (Tool Chain)
**Query:** "Change button1 caption to 'Submit'"

**Expected Flow:**
1. get_ui_layer_data('components') to get page name
2. find_files(pattern: "[PageName].component.js")
3. read_file(path from step 2) - **Critical: Must read first**
4. edit_file(searchText from step 3, replaceText: new caption)

### Example 4: Multi-File Task (Agent Delegation)
**Query:** "Find all buttons and change their color to blue"

**Expected Flow:**
1. Agent Router routes to File Operations Agent
2. File Operations Agent:
   - find_files(pattern: "*.component.js")
   - For each file: read_file → edit_file
   - Handles iteration automatically

---

## Testing Recommendations

1. **Test Direct Tool Queries**
   - "Show console errors"
   - "Get selected widget properties"
   - "Show component tree"
   - Expected: Direct tool usage, no agent routing

2. **Test Tool Chaining**
   - "Change button1 caption to 'Click Me'"
   - Expected: find_files → read_file → edit_file

3. **Test Agent Routing**
   - "What happens when I tap login button?"
   - Expected: Route to Information Retrieval Agent

4. **Test Agent Chaining**
   - "How do I call an action from script?"
   - Expected: IR Agent → Codebase Agent consultation

5. **Test Seed Consistency**
   - Same query multiple times should produce identical routing decisions
   - Use seed: 42 (default) or set GEMINI_SEED environment variable

---

## Future Enhancements

1. **Dynamic Tool Discovery**
   - Add new tools and they're automatically included in context
   - Consider generating tool descriptions dynamically

2. **Agent Performance Metrics**
   - Track tool usage patterns
   - Identify unnecessary agent routing
   - Optimize routing logic based on data

3. **Context Pruning**
   - For simple queries, provide minimal context
   - For complex queries, provide full context
   - Reduce token usage while maintaining effectiveness

4. **Tool Usage Analytics**
   - Track which tools are used most frequently
   - Identify underutilized tools
   - Optimize tool descriptions based on usage

---

## Conclusion

The prompt fine-tuning is now complete with:
- ✅ Comprehensive tool awareness
- ✅ Clear agent routing guidance
- ✅ Tool chaining patterns
- ✅ Agent chaining patterns
- ✅ Fixed seed usage (42) across all agents
- ✅ Decision framework for tool vs agent usage
- ✅ Critical rules for proper tool usage

All AI operations now have consistent, reproducible behavior with proper tool and agent awareness.

