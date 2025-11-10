# Tools and Agents Inventory

## TOOLS

### UI Layer Tools

1. **`get_ui_layer_data`**
   - Purpose: Retrieves UI layer data from the connected application (console logs, network requests, component tree, timeline events, storage, app info)
   - Data types: 'console', 'network', 'components', 'timeline', 'storage', 'info', 'all'
   - Supports filtering by log level, HTTP method, status code, and result limits

2. **`select_widget`**
   - Purpose: Selects/highlights a widget in the element tree by its name (for UI inspector visualization)
   - Finds widgets by exact or partial name match
   - Returns widget ID, name, and tagName for client-side selection

3. **`get_widget_properties_styles`**
   - Purpose: Gets properties and styles for a widget by its ID (without needing to select it first)
   - Fetches widget properties/styles directly from component tree or triggers client-side fetch
   - Returns properties and styles objects for the specified widget

4. **`eval_expression`**
   - Purpose: Evaluates JavaScript expressions in the app iframe context (e.g., accessing app config, variables)
   - Executes code in the running application's context
   - Uses polling mechanism to wait for client-side execution results

### File System Tools

5. **`execute_command`**
   - Purpose: Executes any shell command on the server (generic command execution)
   - Supports project location scoping

6. **`echo_command`**
   - Purpose: Executes echo command with options (no newline, escape sequences)
   - Useful for debugging and text output

7. **`sed_command`**
   - Purpose: Executes sed command for text transformation, search/replace, stream editing
   - Supports in-place editing, backups, extended regex

8. **`read_file`**
   - Purpose: Reads file contents from the filesystem
   - Uses cat command internally

9. **`write_file`**
   - Purpose: Writes content to a file (overwrites existing file)
   - Uses printf for multiline content handling

10. **`append_file`**
    - Purpose: Appends content to the end of a file
    - Preserves existing file content

11. **`grep_files`**
    - Purpose: Searches for text patterns in files (like grep)
    - Supports case-sensitive/insensitive, recursive search, line numbers

12. **`find_files`**
    - Purpose: Finds files or directories by name pattern (supports wildcards)
    - Supports filtering by type (file/directory), max depth

13. **`list_directory`**
    - Purpose: Lists files and directories in a directory (like ls)
    - Supports hidden files, detailed listings

14. **`edit_file`**
    - Purpose: Edits a file by replacing text (search and replace)
    - Uses sed internally with proper escaping
    - Validates replacements and detects duplicate attributes

---

## AGENTS

### Main Agents

1. **Information Retrieval Agent** (`information-retrieval-agent.ts`)
   - Purpose: Orchestrates multiple sub-agents to answer complex questions about application state, widget behavior, and page interactions
   - Flow: Query Analysis → Route to Codebase Agent OR Current Page State → Page Name Resolution → File Discovery → Page Agent → Answer Synthesis
   - Uses LangGraph state machine with multiple nodes for query analysis, file discovery, and answer synthesis

2. **File Operations Agent** (`file-operations-agent.ts`)
   - Purpose: Handles multi-step file operations (find, read, write, edit files) with automatic tool chaining
   - Flow: Agent Node (LLM decision) → Tool Node (execution) → Loop back to Agent Node until completion
   - Automatically chains operations (e.g., find then edit)
   - Supports streaming updates via callbacks

3. **Codebase Agent** (`codebase-agent/codebase-agent.ts`)
   - Purpose: Answers questions about the WaveMaker React Native codebase itself (how things work, architecture, implementation details)
   - Flow: Query Analyzer → File Discovery → Code Analysis → Sub-Agent Orchestrator → Response Validator
   - Uses specialized sub-agents for different domains (components, styles, bindings, etc.)

4. **Agent Router** (`agent-router.ts`)
   - Purpose: Intelligently routes user queries to the appropriate specialized agent (Information Retrieval, File Operations, or Codebase)
   - Uses AI to analyze query intent and determine routing
   - Fallback to keyword-based routing on errors

### Sub-Agents (used by Information Retrieval Agent)

5. **Current Page State Agent** (`current-page-state-agent.ts`)
   - Purpose: Retrieves current page state including selected widget, page name, and element tree
   - Flow: Get Element Tree → Identify Target Widget → Get Widget Properties/Styles → Get Page Name → Assemble State
   - Extracts page name from timeline PAGE_READY events or WmPage component

6. **Page Agent** (`page-agent.ts`)
   - Purpose: Analyzes page files (component.js, script.js, style.js, variables.js) and understands relationships between components, styles, scripts, and variables
   - Flow: Parse Files → Map File Relationships → Locate Widgets → Map Event Handlers → Map Styles → Map Properties → Build Understanding
   - Extracts inline event handlers from JSX and function-based handlers from script.js

### Codebase Agent Sub-Agents (used by Codebase Agent)

7. **App Agent** (`codebase-agent/sub-agents/app-agent.ts`)
   - Purpose: Handles queries about app-level configuration, initialization, and app-wide features

8. **Base Agent** (`codebase-agent/sub-agents/base-agent.ts`)
   - Purpose: Handles queries about BaseComponent and core component architecture

9. **Binding Agent** (`codebase-agent/sub-agents/binding-agent.ts`)
   - Purpose: Handles queries about data binding mechanisms and variable bindings

10. **Component Agent** (`codebase-agent/sub-agents/component-agent.ts`)
    - Purpose: Handles queries about specific component implementations (WmButton, WmText, etc.)

11. **Formatter Agent** (`codebase-agent/sub-agents/formatter-agent.ts`)
    - Purpose: Handles queries about formatting and display transformations

12. **Fragment Agent** (`codebase-agent/sub-agents/fragment-agent.ts`)
    - Purpose: Handles queries about fragment system and fragment-based navigation

13. **Generation Agent** (`codebase-agent/sub-agents/generation-agent.ts`)
    - Purpose: Handles queries about code generation and transpilation

14. **Memo Agent** (`codebase-agent/sub-agents/memo-agent.ts`)
    - Purpose: Handles queries about memoization and performance optimization

15. **Parser Agent** (`codebase-agent/sub-agents/parser-agent.ts`)
    - Purpose: Handles queries about parsing and AST manipulation

16. **Service Agent** (`codebase-agent/sub-agents/service-agent.ts`)
    - Purpose: Handles queries about service integration and API calls

17. **Style Agent** (`codebase-agent/sub-agents/style-agent.ts`)
    - Purpose: Handles queries about styling system and style application

18. **Style Definition Agent** (`codebase-agent/sub-agents/style-definition-agent.ts`)
    - Purpose: Handles queries about style definitions and CSS class names

19. **Transformer Agent** (`codebase-agent/sub-agents/transformer-agent.ts`)
    - Purpose: Handles queries about code transformation and compilation

20. **Transpiler Agent** (`codebase-agent/sub-agents/transpiler-agent.ts`)
    - Purpose: Handles queries about HTML-to-JSX transpilation

21. **Variable Agent** (`codebase-agent/sub-agents/variable-agent.ts`)
    - Purpose: Handles queries about variable system and data flow

22. **Watcher Agent** (`codebase-agent/sub-agents/watcher-agent.ts`)
    - Purpose: Handles queries about watchers and reactive data binding

---

## OBSERVATIONS

### Current Issues Identified:

1. **Tool Usage Problem**: After adding additional agents, the system may be routing too many queries to the Information Retrieval Agent's investigation flow instead of directly using UI tools like `get_ui_layer_data` for simple queries.

2. **Missing Direct Tool Access**: Simple queries that could be answered with a single tool call (e.g., "get selected widget properties") are going through the full agent investigation flow instead of directly calling `get_widget_properties_styles` or `get_ui_layer_data`.

3. **Agent Router Behavior**: The Agent Router may be too aggressive in routing queries to Information Retrieval Agent, even for simple tool-based queries.

4. **Tool Chaining**: Some tools are designed to work together (e.g., `get_ui_layer_data` → `select_widget` → `get_widget_properties_styles`), but the agents may not be using them efficiently.

### Available but Underutilized Tools:

- `get_ui_layer_data` with `dataType: 'components'` - Can get component tree directly
- `get_ui_layer_data` with `dataType: 'info'` - Can get app info and platform info
- `get_ui_layer_data` with `dataType: 'timeline'` - Can get performance timeline (including PAGE_READY events for page name)
- `select_widget` - Can select widgets for visualization
- `get_widget_properties_styles` - Can get properties/styles without selection
- `eval_expression` - Can execute JavaScript in app context (e.g., get current page name)

### Recommended Next Steps:

1. Review Agent Router logic to better distinguish between simple tool queries vs. complex investigation queries
2. Add direct tool execution path for simple queries (bypass agent flow)
3. Ensure Information Retrieval Agent uses tools more efficiently before falling back to file operations
4. Review tool descriptions to ensure LLMs understand when to use each tool directly

