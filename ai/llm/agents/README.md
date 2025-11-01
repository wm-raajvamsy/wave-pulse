# File Operations Agent Architecture

This directory contains a File Operations Agent implementation using LangGraph-style state machine that handles multi-step file operations (find, read, write, edit files) more reliably than manual chaining.

## Benefits over Manual Chaining

1. **State Management**: Clear state that persists across iterations
2. **Automatic Loops**: Natural looping back to agent after tool execution
3. **Conditional Logic**: Easy decision points (continue vs end)
4. **Error Handling**: Better structured error handling
5. **Observability**: Clear state transitions for debugging

## Architecture

```
START → agent → decision → tools → agent → ... → END
                      ↓
                    end
```

- **agent**: Calls Gemini and decides next action
- **decision**: Checks if tool calls are needed
- **tools**: Executes tools and returns results
- **loop**: Automatically loops back to agent for next step

## Usage

```typescript
import { sendMessageWithFileOperationsAgent } from './agents/file-operations-agent';

const result = await sendMessageWithFileOperationsAgent(
  "find Main.component.js and add caption 'Hi' to selected widget",
  history,
  channelId,
  projectLocation
);
```

## Integration

To use this in your chat route, replace the `GeminiChatService.sendMessage` call with `sendMessageWithFileOperationsAgent`.

The agent will automatically:
1. Find the file
2. Read the file
3. Identify the widget
4. Edit the file
5. Provide final response

All without manual chaining logic!

