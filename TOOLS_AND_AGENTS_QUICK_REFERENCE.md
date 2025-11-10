# Tools and Agents Quick Reference

## Quick Decision Guide

### "Should I use a tool or an agent?"

```
┌─────────────────────────────────────────────────────┐
│ START: User Query                                   │
└─────────────────────────────────────────────────────┘
                      ↓
    ┌─────────────────────────────────────────────────┐
    │ Can this be answered with 1-3 tool calls?       │
    └─────────────────────────────────────────────────┘
           YES ↓                        ↓ NO
    ┌──────────────────┐     ┌──────────────────────┐
    │ USE DIRECT TOOLS │     │ Route to Agent       │
    └──────────────────┘     └──────────────────────┘
                                       ↓
              ┌────────────────────────┴─────────────────────────┐
              │                                                  │
    ┌─────────────────────┐  ┌──────────────────┐  ┌───────────────────┐
    │ File modifications? │  │ UI behavior?     │  │ Platform/codebase?│
    │ → File Ops Agent    │  │ → Info Retrieval │  │ → Codebase Agent  │
    └─────────────────────┘  └──────────────────┘  └───────────────────┘
```

---

## Tools at a Glance

### UI Inspection Tools

| Tool | One-Liner | Common Use Case |
|------|-----------|----------------|
| `get_ui_layer_data` | Get app state, logs, network, components, timeline, storage | "Show console errors", "Get component tree", "What's selected?" |
| `select_widget` | Highlight widget by name | "Select button1" |
| `get_widget_properties_styles` | Get widget details by ID | After getting component tree, fetch specific widget info |
| `eval_expression` | Run JavaScript in app | "Get current page name", "Access app variables" |

### File System Tools

| Tool | One-Liner | Common Use Case |
|------|-----------|----------------|
| `find_files` | Find files by pattern | "Find Main.component.js" |
| `read_file` | Read file contents | **Always before editing!** |
| `edit_file` | Search/replace in file | "Change button caption" |
| `write_file` | Overwrite entire file | Create new files |
| `grep_files` | Search text in files | "Find all uses of MyVariable" |
| `list_directory` | List directory contents | "Show files in src/" |

---

## Agents at a Glance

| Agent | Purpose | When to Use | Example Query |
|-------|---------|-------------|---------------|
| **Information Retrieval** | Analyze UI behavior, page files | Complex widget behavior questions | "What happens when I tap login?" |
| **File Operations** | Multi-step file modifications | Multiple file edits, bulk changes | "Change all button colors to blue" |
| **Codebase** | WaveMaker platform internals | How platform features work | "How does Actions.navigate work?" |
| **Agent Router** | Route queries to correct agent | Automatic (runs first) | N/A (internal) |

---

## Tool Chaining Cheat Sheet

### ✅ Good Chains

```typescript
// Pattern 1: UI Inspection
get_ui_layer_data('components')
→ Find widget in tree
→ get_widget_properties_styles(widgetId)

// Pattern 2: File Edit (MOST IMPORTANT)
find_files('*.component.js')
→ read_file(exactPath)  // NEVER SKIP THIS
→ edit_file(exactPath, exactText, newText)

// Pattern 3: Error Investigation
get_ui_layer_data('console')
→ get_ui_layer_data('network')
→ eval_expression('check runtime state')

// Pattern 4: Widget + File
get_ui_layer_data('components')
→ find_files('[PageName].component.js')
→ read_file(path)
→ edit_file(path, oldCaption, newCaption)
```

### ❌ Bad Chains (Anti-Patterns)

```typescript
// WRONG: Edit without reading
find_files('*.component.js')
→ edit_file(guessedPath, guessedText, newText)  // ❌ Will fail!

// WRONG: Modified paths
find_files() returns "/full/path/to/file.js"
→ edit_file("/file.js")  // ❌ Use exact path!

// WRONG: Routing simple queries
"Show console errors"
→ Route to Information Retrieval Agent  // ❌ Use get_ui_layer_data('console')!
```

---

## Agent Chaining Cheat Sheet

### ✅ Good Agent Chains

```typescript
// Escalation Pattern
User asks: "What happens when I tap button1?"
→ Information Retrieval Agent
  → Analyzes page files
  → Finds handler calls Actions.navigate()
  → Consults Codebase Agent: "How does Actions.navigate work?"
  → Synthesizes complete answer

// Delegation Pattern
User asks: "Change all button colors to blue"
→ Agent Router
  → Routes to File Operations Agent
  → File Ops Agent handles multiple file edits automatically

// Consultation Pattern
IR Agent analyzing app code
→ Finds platform API usage (Variables, Actions, etc.)
→ Consults Codebase Agent for platform mechanism
→ Returns combined app + platform knowledge
```

---

## Common Query Examples

### Simple Queries (Direct Tools)

| Query | Tool | Notes |
|-------|------|-------|
| "Show console errors" | `get_ui_layer_data('console', {logLevel:'error'})` | No agent needed |
| "Get component tree" | `get_ui_layer_data('components')` | No agent needed |
| "What's selected?" | `get_ui_layer_data('components')` → find selected:true | No agent needed |
| "Get button1 caption" | `get_ui_layer_data('components')` → extract properties.caption | No agent needed |
| "Show network requests" | `get_ui_layer_data('network')` | No agent needed |

### Medium Queries (Tool Chains)

| Query | Chain | Notes |
|-------|-------|-------|
| "Change button1 caption to 'Submit'" | find → read → edit | Must read before edit |
| "Show contents of Main.component.js" | find → read | Simple chain |
| "Add caption to selected widget" | get_ui_layer_data → find → read → edit | Multi-step |

### Complex Queries (Agents)

| Query | Agent | Notes |
|-------|-------|-------|
| "What happens when I tap login?" | Information Retrieval | Needs page analysis |
| "How are these widgets connected?" | Information Retrieval | Needs file analysis |
| "Change all button colors" | File Operations | Multiple file edits |
| "How does BaseComponent work?" | Codebase | Platform internals |
| "What's the class name for button icon?" | Codebase | Style definitions |

---

## Critical Rules (Remember These!)

### 🔴 NEVER DO THIS

1. ❌ Edit files without reading them first
2. ❌ Modify file paths from tool responses
3. ❌ Guess search text for edit_file
4. ❌ Route simple queries to agents
5. ❌ Skip get_ui_layer_data for UI questions

### 🟢 ALWAYS DO THIS

1. ✅ Read files before editing
2. ✅ Copy exact paths from tool responses
3. ✅ Copy exact text from read_file
4. ✅ Try tools before routing to agents
5. ✅ Use get_ui_layer_data('components') for widget questions

---

## Troubleshooting

### "Edit failed: File not found"
- **Cause:** Modified the file path from find_files/read_file
- **Fix:** Copy the EXACT path from tool response

### "Edit failed: Search text not found"
- **Cause:** Didn't read file first, or modified search text
- **Fix:** Call read_file, copy EXACT text including whitespace

### "Duplicate attribute error"
- **Cause:** Searched for widget name, added new attribute, existing attribute present
- **Fix:** Search for complete attribute (e.g., `caption="old"` not just `name="button1"`)

### "Query routed to wrong agent"
- **Cause:** Query wasn't clear, or routing logic needs tuning
- **Fix:** Be more specific in query, or use direct tools

### "Agent taking too long"
- **Cause:** Unnecessary agent routing for simple query
- **Fix:** Use direct tools instead of agents

---

## Quick Commands

### Get Everything
```typescript
// Get all UI data at once
get_ui_layer_data(channelId, 'all')
```

### Get Selected Widget Full Info
```typescript
// Step 1: Get tree
get_ui_layer_data(channelId, 'components')
// Step 2: Find selected widget (selected: true)
// Step 3: Use widget ID
get_widget_properties_styles(channelId, widgetId)
```

### Edit File Safely
```typescript
// Step 1: Find
find_files('Main.component.js')
// Step 2: Read (CRITICAL)
read_file('/full/path/from/step1/Main.component.js')
// Step 3: Edit (use exact text from step 2)
edit_file('/full/path/from/step1/Main.component.js', 'caption="Click"', 'caption="Submit"')
```

---

## Seed Configuration

All AI operations use a fixed seed for reproducibility:

```bash
# Default seed: 42
# Set custom seed via environment variable:
export GEMINI_SEED=123
```

**Why?** Ensures consistent routing decisions and behavior across runs.

---

## Need Help?

1. **Check tools first:** Can this be answered with 1-3 tool calls?
2. **Check chains:** Does this need a tool chain (find → read → edit)?
3. **Check agents:** Is this truly complex and needs an agent?
4. **Check examples:** Find similar query in this guide

---

## Summary

- **14 tools** available - use them first!
- **4 main agents** - only when tools aren't enough
- **Tool chaining** - follow patterns, especially find → read → edit
- **Agent chaining** - IR Agent can consult Codebase Agent
- **Fixed seed** - reproducible AI behavior (seed: 42)
- **Critical rule** - ALWAYS read files before editing

Happy coding! 🚀

