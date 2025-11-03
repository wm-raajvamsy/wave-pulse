# Codebase Agent

The Codebase Agent is an intelligent information retrieval and analysis system designed to understand and explain the WaveMaker React Native codebase. It serves as the primary interface for querying codebase knowledge, analyzing implementations, and providing deep insights into how and why things work.

## Overview

The Codebase Agent combines **Information Retrieval** and **File Operations** capabilities specifically for the WaveMaker React Native codebase. It operates across both the runtime (`@wavemaker/app-rn-runtime`) and codegen (`@wavemaker/rn-codegen`) codebases.

## Architecture

The agent follows a multi-stage pipeline:

1. **Query Analysis** - Uses AI with fixed seed to analyze query intent, domain, and select sub-agents
2. **File Discovery** - Finds relevant files using multiple strategies (name, content, symbol, dependency)
3. **Code Analysis** - Analyzes code structure, relationships, and patterns
4. **Sub-Agent Execution** - Executes specialized sub-agents in parallel
5. **Response Validation** - Validates sources, code snippets, and completeness
6. **Final Response** - Formats and returns the final answer

## Sub-Agents

The Codebase Agent includes 16 specialized sub-agents, each combining IR + FileOps for their domain:

1. **BaseAgent** - BaseComponent, core infrastructure, lifecycle
2. **ComponentAgent** - Widget components (WmButton, WmText, etc.)
3. **StyleAgent** - Theme compilation and styling
4. **StyleDefinitionAgent** - Style definitions and class names
5. **ServiceAgent** - Runtime services (Navigation, Modal, Security)
6. **BindingAgent** - Data binding and watchers
7. **VariableAgent** - Variables and state management
8. **TranspilerAgent** - Code generation and transpilation
9. **TransformerAgent** - Widget transformation (HTML to JSX)
10. **ParserAgent** - Parsing HTML, CSS, JavaScript
11. **FormatterAgent** - Code and data formatting
12. **GenerationAgent** - Code generation from templates
13. **FragmentAgent** - Fragments (pages, partials, prefabs)
14. **WatcherAgent** - Watch system and change detection
15. **MemoAgent** - Memoization and render optimization
16. **AppAgent** - Application architecture and generation

## Usage

```typescript
import { createCodebaseAgent } from './codebase-agent';

const agent = createCodebaseAgent();

const result = await agent.invoke({
  userQuery: "How does BaseComponent handle lifecycle?",
  channelId: "your-channel-id",
  researchSteps: [],
  errors: [],
  onStepUpdate: (update) => {
    console.log('Step update:', update);
  }
});

console.log('Final response:', result.finalResponse);
```

## Documentation

All documentation from `/Users/raajr_500278/wavemaker-rn-mcp/WavemakerDocs` has been copied to `./docs/` for reference.

## Integration

The Codebase Agent is integrated into the agent router and will be automatically selected for queries about:
- How things work in the codebase
- Why things are designed a certain way
- What something is or where it's located
- Codebase architecture and internals
- Style definitions and class names

See `agent-router.ts` for routing logic.

