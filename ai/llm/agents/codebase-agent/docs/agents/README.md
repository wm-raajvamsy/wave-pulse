# WaveMaker RN Codebase Agent System - Complete Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Agent Overview](#agent-overview)
4. [Documentation Index](#documentation-index)
5. [Common Queries](#common-queries)
6. [Agent Collaboration](#agent-collaboration)
7. [Best Practices](#best-practices)

---

## Introduction

The WaveMaker RN Codebase Agent System is a comprehensive AI-powered knowledge base and expert system for the WaveMaker React Native platform. It consists of a main orchestrator (the **Codebase Agent**) and **16 specialized sub-agents** (12 core + 4 specialized), each expert in a specific domain.

### What Can It Do?

The agent system can:
- **Answer Questions**: "How does WmButton work?" → Detailed component explanation
- **Find Code**: "Where is the List transformer?" → Exact file location with context
- **Explain Concepts**: "What is data binding?" → Comprehensive explanation with examples
- **Debug Issues**: "My list isn't rendering" → Diagnostic steps and solutions
- **Compare Features**: "Difference between Model and Live variables?" → Detailed comparison
- **Provide Examples**: "Show me form examples" → Complete working examples
- **Guide Development**: "How to create custom widget?" → Step-by-step guide

### How It Works

```
Your Query
    ↓
Codebase Agent (Orchestrator)
    ├─→ Understands intent
    ├─→ Selects appropriate sub-agent(s)
    └─→ Synthesizes comprehensive response
    ↓
Sub-Agents (Specialists)
    ├─→ Transformer Agent (widget transformation)
    ├─→ Style Agent (theming & styling)
    ├─→ Service Agent (runtime services)
    ├─→ Component Agent (widget implementation)
    ├─→ App Agent (application architecture)
    ├─→ Base Agent (core infrastructure)
    ├─→ Parser Agent (HTML/CSS/JS parsing)
    ├─→ Formatter Agent (code formatting)
    ├─→ Generation Agent (code generation)
    ├─→ Binding Agent (data binding)
    └─→ Variable Agent (state management)
    ↓
Comprehensive Answer with Code References
```

---

## Quick Start

### Example 1: Understanding a Component

**Query**: "Explain WmProgressCircle"

**Agent Response**:
1. **Component Agent** locates the implementation
2. **Style Agent** explains styling
3. **Transformer Agent** shows how it's generated
4. **Response** includes:
   - Component overview
   - File locations
   - Implementation details
   - Props explanation
   - Usage examples

### Example 2: Debugging an Issue

**Query**: "My variable isn't updating the list"

**Agent Response**:
1. **Variable Agent** explains variable system
2. **Binding Agent** explains data binding
3. **Component Agent** explains list rendering
4. **Response** includes:
   - Diagnostic steps
   - Common issues and solutions
   - Code to check
   - Debug logging suggestions

### Example 3: Learning a Concept

**Query**: "How does theming work?"

**Agent Response**:
1. **Style Agent** explains theme system
2. **Generation Agent** shows theme compilation
3. **App Agent** explains theme initialization
4. **Response** includes:
   - Architecture overview
   - Theme compilation process
   - Runtime theme switching
   - Custom theme creation

---

## Agent Overview

### Main Agent

#### **Codebase Agent** (Orchestrator)

**Role**: Query understanding, agent coordination, response synthesis

**Capabilities**:
- Intent detection from natural language queries
- Agent selection and coordination
- Context management across conversation
- Response aggregation and formatting

**Initialization**:
- Always initialized with complete @rn-codebase architecture
- Pre-loaded with component registry, service catalog, pattern library
- Maintains conversation context and history

---

### Sub-Agents

#### 1. **Transformer Agent** 📝

**Domain**: Widget transformation and transpilation

**Expertise**:
- HTML → JSX transformation
- Bind expression transformation
- Property mapping
- Widget-specific transformers

**Key Files**:
- `transpile/transpile.ts` - Core transpiler
- `transpile/bind.ex.transformer.ts` - Bind expressions
- `transpile/components/*.transpiler.ts` - Widget transformers (50+)

**Sample Queries**:
- "How does Button transformation work?"
- "Show me List widget transpilation"
- "Explain bind expression transformation"

**[Read Full Documentation →](./TRANSFORMER_AGENT.md)**

---

#### 2. **Style Agent** 🎨

**Domain**: Theming, styling, CSS/LESS compilation

**Expertise**:
- Theme system architecture
- CSS → React Native StyleSheet conversion
- Style definitions per widget
- Theme variables and inheritance

**Key Files**:
- `theme/theme.service.ts` - Theme compilation
- `theme/rn-stylesheet.transpiler.ts` - CSS → RN styles
- `theme/components/*.ts` - Style definitions (50+)
- `runtime/styles/theme.tsx` - Runtime theme system

**Sample Queries**:
- "How are styles applied to WmButton?"
- "Explain theme compilation"
- "How to create custom theme?"

**[Read Full Documentation →](./STYLE_AGENT.md)** *(Coming soon)*

---

#### 3. **StyleDefinition Agent** 📐

**Domain**: Widget style definitions and structure

**Expertise**:
- Style definition structure (StyleDefinition interface)
- Style selector mapping (RN ↔ Studio)
- Style states and variants
- Theme variable integration
- Widget-specific styling capabilities

**Key Files**:
- `theme/components/base-style-definition.ts` - Core interfaces
- `theme/components/style-definition.provider.ts` - Registry
- `theme/components/**/*.styledef.ts` - Widget style definitions (100+)

**Sample Queries**:
- "How are style definitions structured?"
- "Show me button style definition"
- "Explain style selector mapping"

**[Read Full Documentation →](./STYLEDEFINITION_AGENT.md)**

---

#### 4. **Service Agent** ⚙️

**Domain**: Runtime services and utilities

**Expertise**:
- Service architecture and DI container
- Service APIs and usage
- Service initialization
- Inter-service communication

**Key Files**:
- `core/injector.ts` - Dependency injection
- `core/navigation.service.ts` - Navigation
- `core/modal.service.ts` - Modals
- `core/*.service.ts` - All services

**Sample Queries**:
- "How does Navigation service work?"
- "Using the Modal service"
- "Explain dependency injection"

**[Read Full Documentation →](./SERVICE_AGENT.md)** *(Coming soon)*

---

#### 5. **Component Agent** 🧩

**Domain**: Widget implementation and architecture

**Expertise**:
- BaseComponent architecture
- Component lifecycle
- Props and state management
- All 50+ widget implementations

**Key Files**:
- `core/base.component.tsx` - Base component class
- `components/*/*.component.tsx` - All widgets (50+)
- `runtime/base-page.component.tsx` - Page base

**Sample Queries**:
- "How is WmButton implemented?"
- "Explain BaseComponent"
- "Component lifecycle hooks"
- "How to create custom widget?"

**[Read Full Documentation →](./COMPONENT_AGENT.md)**

---

#### 6. **App Agent** 📱

**Domain**: Application architecture and generation

**Expertise**:
- App generation process
- App structure and configuration
- Navigation structure
- Build profiles

**Key Files**:
- `app.generator.ts` - Main app generator
- `project.service.ts` - Project file access
- `profiles/*.profile.ts` - Build profiles
- `runtime/App.tsx` - Main app component

**Sample Queries**:
- "How is the app generated?"
- "Explain build process"
- "What are build profiles?"

**[Read Full Documentation →](./APP_AGENT.md)** *(Coming soon)*

---

#### 7. **Base Agent** 🔧

**Domain**: Core runtime infrastructure

**Expertise**:
- BaseComponent API
- Core utilities
- Event system
- Lifecycle management

**Key Files**:
- `core/base.component.tsx` - Base component
- `core/event-notifier.ts` - Event system
- `core/utils.ts` - Utilities
- `core/logger.ts` - Logging

**Sample Queries**:
- "What methods does BaseComponent provide?"
- "Explain the event notifier"
- "How to manage component lifecycle?"

**[Read Full Documentation →](./BASE_AGENT.md)** *(Coming soon)*

---

#### 8. **Parser Agent** 📄

**Domain**: HTML/CSS/JS parsing and AST manipulation

**Expertise**:
- HTML parsing (node-html-parser)
- CSS parsing (css-tree, LESS)
- JavaScript AST (Babel)
- Expression parsing

**Key Files**:
- `transpile/transpile.ts` - HTML parsing
- `transpile/bind.ex.transformer.ts` - Expression parsing
- `transpile/property/*.ts` - Property parsing
- `theme/font-stylesheet.transpiler.ts` - CSS parsing

**Sample Queries**:
- "How is HTML parsed?"
- "Explain bind expression evaluation"
- "How to parse custom properties?"

**[Read Full Documentation →](./PARSER_AGENT.md)** *(Coming soon)*

---

#### 9. **Formatter Agent** ✨

**Domain**: Code formatting and beautification

**Expertise**:
- Code formatting rules
- JavaScript/JSX formatting
- Data formatters
- Output beautification

**Key Files**:
- `fomatter.ts` - Code formatter
- `utils.ts` - Formatting utilities
- `runtime/core/formatters.ts` - Data formatters

**Sample Queries**:
- "How is generated code formatted?"
- "Explain data formatters"

**[Read Full Documentation →](./FORMATTER_AGENT.md)** *(Coming soon)*

---

#### 10. **Generation Agent** 🏗️

**Domain**: Code generation from templates

**Expertise**:
- Handlebars template engine
- Component generation
- Page generation
- Template helpers

**Key Files**:
- `app.generator.ts` - Main generator
- `handlebar-helpers.ts` - Template helpers
- `templates/**/*.template` - All templates

**Sample Queries**:
- "How are components generated?"
- "What templates are available?"
- "How to create custom template?"

**[Read Full Documentation →](./GENERATION_AGENT.md)** *(Coming soon)*

---

#### 11. **Binding Agent** 🔗

**Domain**: Data binding and watch system

**Expertise**:
- Two-way data binding
- Watch expressions
- Change detection
- Binding evaluation

**Key Files**:
- `runtime/watcher.ts` - Watch system
- `transpile/bind.ex.transformer.ts` - Bind transformation

**Sample Queries**:
- "How does data binding work?"
- "Explain watch expressions"
- "How to optimize watchers?"

**[Read Full Documentation →](./BINDING_AGENT.md)** *(Coming soon)*

---

#### 12. **Variable Agent** 📊

**Domain**: State management and variables

**Expertise**:
- Variable types (Model, Live, Service, Device)
- Variable lifecycle
- Variable transformation
- CRUD operations

**Key Files**:
- `variables/base-variable.ts` - Base variable
- `variables/model-variable.ts` - Model variable
- `variables/live-variable.ts` - Live variable
- `variables/variable.transformer.ts` - Variable generation

**Sample Queries**:
- "What is a LiveVariable?"
- "How are variables generated?"
- "Difference between Model and Live variables?"

**[Read Full Documentation →](./VARIABLE_AGENT.md)**

---

#### 13. **Transpiler Agent** 🔄

**Domain**: Core transpilation engine

**Expertise**:
- Transpilation engine implementation
- Tree traversal and processing
- Context management
- Pre/post transpilation hooks

**Key Files**:
- `transpile/transpile.ts` - Core transpiler
- `transpile/bind.ex.transformer.ts` - Expression transformation

**Sample Queries**:
- "How does the transpilation engine work?"
- "Explain the transpilation pipeline"
- "Debug transpilation issues"

**[Read Full Documentation →](./TRANSPILER_AGENT.md)**

---

#### 14. **Fragment Agent** 🧱

**Domain**: Fragments and hierarchy

**Expertise**:
- Pages, Partials, Prefabs
- Fragment hierarchy and lifecycle
- Parent-child communication
- Fragment composition patterns

**Key Files**:
- `runtime/base-page.component.tsx` - Page base
- `runtime/base-partial.component.tsx` - Partial base
- `runtime/base-prefab.component.tsx` - Prefab base

**Sample Queries**:
- "What are fragments?"
- "How do partials communicate with pages?"
- "Fragment lifecycle explained"

**[Read Full Documentation →](./FRAGMENT_AGENT.md)**

---

#### 15. **Watcher Agent** 👁️

**Domain**: Watch system and change detection

**Expertise**:
- Watch expression compilation
- Change detection algorithms
- Digest cycle management
- Watch optimization

**Key Files**:
- `runtime/watcher.ts` - Watcher implementation

**Sample Queries**:
- "How does the watch system work?"
- "Optimize watcher performance"
- "Debug watch expressions"

**[Read Full Documentation →](./WATCHER_AGENT.md)**

---

#### 16. **Memo Agent** 💾

**Domain**: Memoization and render optimization

**Expertise**:
- WmMemo component
- shouldComponentUpdate optimization
- React memoization patterns
- Performance optimization

**Key Files**:
- `runtime/memo.component.tsx` - WmMemo component

**Sample Queries**:
- "How does WmMemo work?"
- "Optimize component re-renders"
- "Memoization best practices"

**[Read Full Documentation →](./MEMO_AGENT.md)**

---

## Documentation Index

### Core Architecture
- **[Codebase Agent Architecture](../CODEBASE_AGENT_ARCHITECTURE.md)** - Complete system architecture
- **[System Overview](../architecture/system-overview.md)** - Platform overview
- **[Runtime Architecture](../architecture/runtime-architecture.md)** - Runtime design
- **[Codegen Architecture](../architecture/codegen-architecture.md)** - Code generation architecture

### Detailed Agent Documentation

#### Core Agents (12)
- **[Transformer Agent](./TRANSFORMER_AGENT.md)** ✅ Available
- **[Component Agent](./COMPONENT_AGENT.md)** ✅ Available
- **[Variable Agent](./VARIABLE_AGENT.md)** ✅ Available
- **[Style Agent](./STYLE_AGENT.md)** ✅ Available
- **[StyleDefinition Agent](./STYLEDEFINITION_AGENT.md)** ✅ Available
- **[Service Agent](./SERVICE_AGENT.md)** ✅ Available
- **[App Agent](./APP_AGENT.md)** ✅ Available
- **[Base Agent](./BASE_AGENT.md)** ✅ Available
- **[Parser Agent](./PARSER_AGENT.md)** ✅ Available
- **[Formatter Agent](./FORMATTER_AGENT.md)** ✅ Available
- **[Generation Agent](./GENERATION_AGENT.md)** ✅ Available
- **[Binding Agent](./BINDING_AGENT.md)** ✅ Available

#### Specialized Agents (4)
- **[Transpiler Agent](./TRANSPILER_AGENT.md)** ✅ Available
- **[Fragment Agent](./FRAGMENT_AGENT.md)** ✅ Available
- **[Watcher Agent](./WATCHER_AGENT.md)** ✅ Available
- **[Memo Agent](./MEMO_AGENT.md)** ✅ Available

### Runtime Documentation
- **[Core Concepts](../runtime/core-concepts.md)** - Fundamental concepts
- **[BaseComponent](../runtime/base-component.md)** - Base component API
- **[Component Lifecycle](../runtime/component-lifecycle.md)** - Lifecycle hooks
- **[Services](../runtime/services.md)** - Service layer
- **[Advanced Internals](../runtime/advanced-internals.md)** - Deep dive

### Code Generation Documentation
- **[Codegen Overview](../codegen/overview.md)** - Code generation overview
- **[Transpilation Process](../codegen/transpilation-process.md)** - How transpilation works
- **[Transformers](../codegen/transformers.md)** - Widget transformers

---

## Common Queries

### Understanding Components

```
Query: "How does WmButton work?"
Agents: Component Agent, Style Agent, Transformer Agent
Response: Complete component explanation with implementation, styling, and generation
```

```
Query: "What props does WmList support?"
Agent: Component Agent
Response: Complete props interface with descriptions and examples
```

```
Query: "Compare WmList and WmLivelist"
Agent: Component Agent
Response: Detailed comparison table with use cases
```

### Widget Transformation

```
Query: "How is WmForm transformed?"
Agent: Transformer Agent
Response: Complete transformation process with before/after examples
```

```
Query: "Explain bind expressions"
Agents: Transformer Agent, Binding Agent
Response: Bind expression syntax, transformation, and evaluation
```

### Styling & Theming

```
Query: "How to customize WmButton styles?"
Agents: Style Agent, Component Agent
Response: Style customization guide with examples
```

```
Query: "Explain theme compilation"
Agent: Style Agent
Response: Complete theme compilation pipeline
```

### Variables & State

```
Query: "What is a LiveVariable?"
Agent: Variable Agent
Response: Complete LiveVariable documentation with examples
```

```
Query: "How to use variables in forms?"
Agents: Variable Agent, Component Agent
Response: Complete form example with variable usage
```

### Debugging

```
Query: "My list isn't rendering"
Agents: Component Agent, Variable Agent, Binding Agent
Response: Diagnostic steps, common issues, solutions
```

```
Query: "Variable not updating UI"
Agents: Variable Agent, Binding Agent
Response: Debugging guide with common causes and fixes
```

### Architecture

```
Query: "Explain the app generation process"
Agents: App Agent, Generation Agent, Transformer Agent
Response: Complete build flow from Studio to React Native
```

```
Query: "How does navigation work?"
Agents: Service Agent, App Agent
Response: Navigation architecture and usage
```

### Custom Development

```
Query: "How to create a custom widget?"
Agents: Component Agent, Transformer Agent, Style Agent
Response: Step-by-step guide with complete example
```

```
Query: "How to add a custom transformer?"
Agent: Transformer Agent
Response: Transformer creation guide with template
```

---

## Agent Collaboration

### Collaboration Patterns

#### Pattern 1: Sequential Deep Dive
```
Query: "Comprehensive WmButton explanation"

Component Agent → Finds implementation
    ↓
Style Agent → Explains styling
    ↓
Transformer Agent → Shows generation
    ↓
Response Synthesizer → Combines all information
```

#### Pattern 2: Parallel Analysis
```
Query: "Analyze WmList performance"

Component Agent ─────┐
                     ├─→ Aggregator → Response
Binding Agent ───────┤
                     │
Variable Agent ──────┘
```

#### Pattern 3: Troubleshooting Chain
```
Query: "Debug form submission issue"

Variable Agent → Check variable setup
    ↓
Binding Agent → Verify data binding
    ↓
Component Agent → Check form implementation
    ↓
Service Agent → Verify API call
    ↓
Response with diagnostic tree
```

### Multi-Agent Queries

**Complex Query**: "Why is my paginated list slow?"

**Agent Collaboration**:
1. **Component Agent**: Analyzes WmList rendering
2. **Variable Agent**: Checks LiveVariable configuration
3. **Binding Agent**: Analyzes binding performance
4. **Service Agent**: Checks API call efficiency

**Response**: Multi-faceted performance analysis with specific optimizations

---

## Best Practices

### For Users

#### 1. Be Specific
```
❌ "How does list work?"
✅ "How does WmList render items?"
```

#### 2. Provide Context
```
❌ "It's not working"
✅ "My WmList isn't rendering items from Variables.employees.dataSet"
```

#### 3. Ask Follow-Up Questions
```
Initial: "What is a LiveVariable?"
Follow-up: "Show me a complete LiveVariable example"
Follow-up: "How to add pagination?"
```

#### 4. Request Examples
```
"Show me how to use WmForm with LiveVariable"
"Example of custom widget implementation"
```

### For Agents

#### 1. Provide Evidence
- Always include code references
- Link to actual files
- Show real examples from codebase

#### 2. Be Comprehensive
- Cover all aspects of the topic
- Provide context and background
- Include related topics

#### 3. Structure Responses
- Use clear headings
- Provide code examples
- Include step-by-step guides

#### 4. Stay Current
- Reference actual codebase
- Use current file locations
- Cite real implementations

---

## Getting Started

### Step 1: Read Core Documentation

Start with:
1. [Codebase Agent Architecture](../CODEBASE_AGENT_ARCHITECTURE.md)
2. [System Overview](../architecture/system-overview.md)

### Step 2: Explore Agent Documentation

Pick agents based on your interest:
- **App Developer**: Component Agent, Variable Agent, Binding Agent
- **Platform Developer**: Transformer Agent, Base Agent, Generation Agent
- **Theme Developer**: Style Agent, Formatter Agent

### Step 3: Try Sample Queries

Start with simple queries and progressively ask more complex ones:
1. "Where is WmButton?"
2. "How does WmButton work?"
3. "Show me WmButton implementation details"
4. "How to customize WmButton?"
5. "How to create a custom button widget?"

### Step 4: Build Understanding

- Ask for clarifications
- Request more examples
- Explore related topics
- Connect concepts

---

## Support & Contribution

### Questions?

Ask the Codebase Agent! Examples:
- "How do I use the agent system?"
- "What agents should I ask about X?"
- "Explain the agent collaboration process"

### Found an Issue?

The agent system is continuously learning and improving. If you notice:
- Incorrect information
- Outdated code references
- Missing documentation
- Better ways to explain concepts

Please report to the WaveMaker RN team.

---

## Quick Reference

### Agent Selection Guide

**Question Type** → **Primary Agent** → **Secondary Agents**

- Widget Implementation → Component Agent → Style, Transformer
- Widget Transformation → Transformer Agent → Parser, Generation
- Styling → Style Agent → StyleDefinition, Component
- Style Definitions → StyleDefinition Agent → Style, Component
- Variables → Variable Agent → Binding, Component
- Services → Service Agent → Base, Injector
- App Architecture → App Agent → Generation, Navigation
- Data Binding → Binding Agent → Variable, Component
- Code Generation → Generation Agent → Transformer, Template
- Parsing → Parser Agent → Transformer, Expression
- Formatting → Formatter Agent → Generation, Output

---

## Version Information

- **Documentation Version**: 1.0
- **Last Updated**: November 3, 2025
- **Platform Version**: Runtime 0.1.0, Codegen 1.0.0
- **React Native**: 0.81.4
- **Expo SDK**: 52.x

---

## Additional Resources

### External Links
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Internal Resources
- [WaveMaker Studio Documentation](../README.md)
- [Component Overview](../components/overview.md)
- [API Reference](../api-reference/runtime-api.md)

---

**Maintained by**: WaveMaker React Native Team  
**For**: Developers, Architects, Contributors  
**Purpose**: Comprehensive agent system guide

---

*The agent system makes the WaveMaker RN codebase accessible, understandable, and maintainable through AI-powered assistance.*

