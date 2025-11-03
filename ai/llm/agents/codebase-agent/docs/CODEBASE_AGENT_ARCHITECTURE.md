# WaveMaker React Native Codebase Agent Architecture

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [Sub-Agents](#sub-agents)
5. [Agent Workflows](#agent-workflows)
6. [Integration & Communication](#integration--communication)
7. [Usage Examples](#usage-examples)
8. [Best Practices](#best-practices)

---

## Overview

### What is the Codebase Agent?

The **Codebase Agent** is an intelligent AI-powered system designed to provide deep insights, analysis, and answers about the WaveMaker React Native codebase. It serves as a comprehensive knowledge base and expert system that understands how the platform works, why it works that way, and how to effectively use or extend it.

### Purpose

The Codebase Agent acts as:
- **Architecture Expert**: Understands the entire system design
- **Code Navigator**: Finds relevant files and implementations instantly
- **Pattern Analyzer**: Identifies and explains code patterns and best practices
- **Problem Solver**: Diagnoses issues and suggests solutions
- **Documentation Generator**: Creates context-aware documentation
- **Query Resolver**: Answers technical questions about the codebase

### Base Paths

```
Runtime Codebase:
  generated-rn-app/node_modules/@wavemaker/app-rn-runtime
  OR
  wavemaker-studio-frontend/wavemaker-rn-runtime

Codegen Codebase:
  generated-rn-app/node_modules/@wavemaker/rn-codegen
  OR
  wavemaker-studio-frontend/wavemaker-rn-codegen
```

### Initialization

The Codebase Agent is **always initialized** with:
1. **@rn-codebase architecture** - Complete understanding of the runtime and codegen structure
2. **Component registry** - Knowledge of all 50+ widgets and their implementations
3. **Service catalog** - Mapping of all services and utilities
4. **Pattern library** - Common patterns and anti-patterns
5. **Transformer mappings** - Understanding of all widget transformers

---

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Codebase Agent (Orchestrator)                 │
│                                                                   │
│  • Query Understanding & Intent Detection                        │
│  • Agent Coordination & Workflow Management                      │
│  • Context Management & Memory                                   │
│  • Response Synthesis & Formatting                               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│  Knowledge Base  │       │  Sub-Agents      │
│                  │       │  (Specialists)   │
│  • Architecture  │       │                  │
│  • Patterns      │       │  • Transformer   │
│  • Best Practice │◄─────►│  • Style         │
│  • Issues        │       │  • Service       │
│  • Components    │       │  • Component     │
└──────────────────┘       │  • App           │
                           │  • Base          │
                           │  • Parser        │
                           │  • Formatter     │
                           │  • Generation    │
                           │  • Binding       │
                           │  • Variable      │
                           └──────────────────┘
                                    │
                                    ▼
                           ┌──────────────────┐
                           │  Codebase Access │
                           │                  │
                           │  • File System   │
                           │  • AST Parser    │
                           │  • Grep/Search   │
                           │  • Pattern Match │
                           └──────────────────┘
```

### Core Principles

1. **Separation of Concerns**: Each sub-agent is specialized in a specific domain
2. **Collaborative Intelligence**: Agents work together to answer complex queries
3. **Context Awareness**: Maintains context across multiple queries
4. **Evidence-Based**: Always provides code references and examples
5. **Lazy Loading**: Loads files and data only when needed
6. **Caching**: Caches frequently accessed information

---

## Core Components

### 1. Query Analyzer

**Responsibility**: Understand user intent and route to appropriate sub-agents

**Capabilities**:
- Natural language understanding
- Intent classification
- Entity extraction (component names, file paths, concepts)
- Multi-part query decomposition

**Intent Categories**:
```typescript
enum QueryIntent {
  FIND_COMPONENT = 'find_component',           // "Where is WmButton?"
  UNDERSTAND_FEATURE = 'understand_feature',   // "How does data binding work?"
  ANALYZE_PATTERN = 'analyze_pattern',         // "Show me cleanup patterns"
  DIAGNOSE_ISSUE = 'diagnose_issue',           // "Why isn't my list rendering?"
  GET_EXAMPLE = 'get_example',                 // "Example of using LiveVariable"
  EXPLAIN_WHY = 'explain_why',                 // "Why is memoization used?"
  COMPARE = 'compare',                         // "Difference between Page and Partial"
  GENERATE_CODE = 'generate_code'              // "Generate a custom widget"
}
```

### 2. Knowledge Base

**Responsibility**: Store and retrieve structured knowledge about the codebase

**Structure**:
```typescript
interface KnowledgeBase {
  architecture: {
    overview: SystemArchitecture;
    runtime: RuntimeArchitecture;
    codegen: CodegenArchitecture;
    buildFlow: BuildFlowDiagram;
  };
  
  components: {
    registry: ComponentRegistry;        // All 50+ components
    hierarchy: ComponentHierarchy;      // Parent-child relationships
    dependencies: DependencyGraph;      // Component dependencies
  };
  
  patterns: {
    bestPractices: Pattern[];          // Recommended patterns
    antiPatterns: Pattern[];           // Patterns to avoid
    commonUseCases: UseCase[];         // Common scenarios
  };
  
  services: {
    catalog: ServiceCatalog;           // All services
    apis: ServiceAPI[];                // Service interfaces
    usage: ServiceUsageExamples[];     // How to use services
  };
  
  transformers: {
    registry: TransformerRegistry;     // All widget transformers
    mappings: WidgetTransformerMap;    // Widget -> Transformer
  };
  
  issues: {
    common: CommonIssue[];             // Frequently encountered issues
    solutions: IssueSolution[];        // Known solutions
  };
}
```

### 3. Context Manager

**Responsibility**: Maintain conversation context and state

**Features**:
- Conversation history tracking
- File context (currently open files)
- Query context (related previous queries)
- Session persistence
- Context pruning (removes irrelevant context)

### 4. Response Synthesizer

**Responsibility**: Format and present responses to users

**Output Formats**:
- Code snippets with line numbers
- File references
- Architecture diagrams (ASCII)
- Step-by-step explanations
- Comparison tables
- Decision trees

---

## Sub-Agents

### 1. Transformer Agent

**Domain**: Widget transpilation and code transformation

**Responsibilities**:
- Locate widget transformers
- Explain transformation logic
- Analyze HTML → JSX conversion
- Understand property mapping
- Handle bind expressions

**Knowledge Areas**:
```typescript
interface TransformerKnowledge {
  // All widget transformers (button, label, list, etc.)
  transformers: Map<string, TransformerInfo>;
  
  // Transformation rules
  rules: {
    htmlToJsx: Rule[];
    propertyMapping: PropertyMap[];
    eventHandling: EventMap[];
    styleTransformation: StyleRule[];
  };
  
  // Expression transformation
  bindExpressions: {
    syntax: BindExpressionSyntax;
    context: BindingContext[];
    transformation: ExpressionTransformer;
  };
}
```

**Example Queries**:
- "How does the Button transformer work?"
- "Show me the List widget transformation"
- "How are bind expressions converted?"
- "What properties does the Form transformer handle?"

**Key Files**:
```
wavemaker-rn-codegen/src/transpile/
├── transpile.ts                      # Core transpilation engine
├── bind.ex.transformer.ts            # Bind expression transformer
├── style.transformer.ts              # Style transformation
└── components/
    ├── button.transpiler.ts
    ├── label.transpiler.ts
    ├── list.transpiler.ts
    ├── form.transpiler.ts
    └── [50+ widget transformers]
```

**Capabilities**:
1. **Find Transformer**: Locate transformer for any widget
2. **Explain Transformation**: Break down how HTML becomes JSX
3. **Show Examples**: Provide before/after transformation examples
4. **Debug Transformation**: Help diagnose transformation issues
5. **Custom Transformers**: Guide on creating custom transformers

---

### 2. Style Agent

**Domain**: Theming, styling, and CSS/LESS compilation

**Responsibilities**:
- Theme system architecture
- CSS → React Native StyleSheet conversion
- Style definitions per widget
- Theme variables and inheritance
- Runtime style application

**Knowledge Areas**:
```typescript
interface StyleKnowledge {
  // Theme compilation
  themeCompilation: {
    lessCompiler: LessCompiler;
    cssParser: CSSParser;
    styleSheetGenerator: StyleSheetGenerator;
  };
  
  // Widget style definitions
  styleDefinitions: Map<string, WidgetStyleDef>;
  
  // Theme variables
  themeVariables: {
    base: BaseThemeVariables;
    component: ComponentVariables;
    custom: CustomVariables;
  };
  
  // Style application
  styleApplication: {
    inheritance: StyleInheritance;
    cascade: StyleCascade;
    overrides: StyleOverrides;
  };
}
```

**Example Queries**:
- "How are styles applied to WmButton?"
- "What CSS properties are supported?"
- "How does theme switching work?"
- "Explain the style compilation process"
- "How to create custom theme variables?"

**Key Files**:
```
wavemaker-rn-codegen/src/theme/
├── theme.service.ts                  # Theme compilation service
├── rn-stylesheet.transpiler.ts       # CSS → RN StyleSheet
├── variables.ts                      # Theme variables
├── runtime-styles.generator.ts       # Runtime style generation
└── components/                       # Style definitions per widget
    ├── button.ts
    ├── label.ts
    └── [50+ style definitions]

wavemaker-rn-runtime/src/styles/
├── theme.tsx                         # Runtime theme system
├── theme.variables.ts                # Theme variables
├── style-props.ts                    # Style property utilities
└── background.component.tsx          # Background rendering
```

**Capabilities**:
1. **Explain Style Compilation**: How LESS/CSS becomes RN styles
2. **Widget Styling**: How each widget applies styles
3. **Theme Architecture**: Theme system design and usage
4. **Custom Styles**: Guide on adding custom styles
5. **Debug Styles**: Help diagnose styling issues

---

### 3. Service Agent

**Domain**: Runtime services and utilities

**Responsibilities**:
- Service architecture and DI container
- Service APIs and usage
- Service initialization and lifecycle
- Inter-service communication

**Knowledge Areas**:
```typescript
interface ServiceKnowledge {
  // Core services
  services: {
    navigation: NavigationService;
    modal: ModalService;
    security: SecurityService;
    storage: StorageService;
    network: NetworkService;
    i18n: I18nService;
    logger: Logger;
    toast: ToastService;
    spinner: SpinnerService;
    // ... more services
  };
  
  // Service infrastructure
  infrastructure: {
    injector: DependencyInjector;
    lifecycle: ServiceLifecycle;
    initialization: ServiceInit;
  };
  
  // Service patterns
  patterns: {
    singleton: SingletonPattern;
    factory: FactoryPattern;
    injection: InjectionPattern;
  };
}
```

**Example Queries**:
- "How does the Navigation service work?"
- "How to use the Modal service?"
- "Explain the dependency injection system"
- "How are services initialized?"
- "Show me examples of using Storage service"

**Key Files**:
```
wavemaker-rn-runtime/src/core/
├── injector.ts                       # DI container
├── navigation.service.ts             # Navigation
├── modal.service.ts                  # Modals
├── security.service.ts               # Security
├── storage.service.ts                # Storage
├── network.service.ts                # Network
├── i18n.service.ts                   # Internationalization
├── logger.ts                         # Logging
├── toast.service.ts                  # Toast notifications
├── spinner.service.ts                # Loading spinner
└── [more services]
```

**Capabilities**:
1. **Service Lookup**: Find service by name or functionality
2. **API Documentation**: Explain service methods and usage
3. **Dependency Resolution**: Explain service dependencies
4. **Custom Services**: Guide on creating custom services
5. **Service Patterns**: Explain service design patterns

---

### 4. Component Agent

**Domain**: Widget implementation and architecture

**Responsibilities**:
- Component structure and hierarchy
- BaseComponent architecture
- Component lifecycle
- Props and state management
- Component patterns

**Knowledge Areas**:
```typescript
interface ComponentKnowledge {
  // Component registry (50+ widgets)
  registry: {
    basic: BasicWidget[];              // Button, Label, Icon, etc.
    container: ContainerWidget[];      // Panel, Tabs, Accordion, etc.
    input: InputWidget[];              // Text, Select, Date, etc.
    data: DataWidget[];                // List, Card, Form, etc.
    chart: ChartWidget[];              // Line, Bar, Pie, etc.
    navigation: NavigationWidget[];    // Menu, Navbar, Popover, etc.
    device: DeviceWidget[];            // Camera, Barcode, etc.
    dialogs: DialogWidget[];           // Alert, Confirm, etc.
  };
  
  // Base architecture
  base: {
    baseComponent: BaseComponentAPI;
    lifecycle: LifecycleHooks;
    propsProvider: PropsProviderSystem;
    stateManagement: StateManager;
  };
  
  // Component patterns
  patterns: {
    composition: CompositionPattern;
    inheritance: InheritancePattern;
    memoization: MemoizationPattern;
    cleanup: CleanupPattern;
  };
}
```

**Example Queries**:
- "How is WmButton implemented?"
- "What is BaseComponent?"
- "How do component lifecycles work?"
- "Show me the List widget implementation"
- "How to create a custom widget?"

**Key Files**:
```
wavemaker-rn-runtime/src/
├── core/
│   ├── base.component.tsx            # Base component class
│   ├── props.provider.ts             # Props proxy system
│   └── wm-component-tree.ts          # Component hierarchy
├── components/
│   ├── basic/                        # Basic widgets
│   ├── container/                    # Container widgets
│   ├── input/                        # Input widgets
│   ├── data/                         # Data widgets
│   ├── chart/                        # Chart widgets
│   ├── navigation/                   # Navigation widgets
│   ├── device/                       # Device widgets
│   └── dialogs/                      # Dialog widgets
└── runtime/
    ├── base-page.component.tsx       # Base page
    ├── base-partial.component.tsx    # Base partial
    └── base-prefab.component.tsx     # Base prefab
```

**Capabilities**:
1. **Component Lookup**: Find any widget implementation
2. **Architecture Explanation**: Explain component design
3. **Lifecycle Analysis**: Explain lifecycle hooks and timing
4. **Props Analysis**: Explain component props and types
5. **Implementation Guidance**: Guide on widget implementation

---

### 5. App Agent

**Domain**: Application-level architecture and generation

**Responsibilities**:
- App generation process
- App structure and configuration
- Navigation structure
- Page and partial management
- Build profiles

**Knowledge Areas**:
```typescript
interface AppKnowledge {
  // App generation
  generation: {
    appGenerator: AppGenerator;
    projectService: ProjectService;
    incrementalBuilder: IncrementalBuilder;
  };
  
  // App structure
  structure: {
    entryPoint: AppEntryPoint;
    navigation: NavigationStructure;
    pages: PageManagement;
    partials: PartialManagement;
    prefabs: PrefabManagement;
  };
  
  // Configuration
  configuration: {
    bootstrap: BootstrapConfig;
    profiles: BuildProfiles;
    devices: DeviceConfig;
    plugins: PluginConfig;
  };
}
```

**Example Queries**:
- "How is the app generated?"
- "Explain the build process"
- "How are pages registered?"
- "What are build profiles?"
- "How does navigation work?"

**Key Files**:
```
wavemaker-rn-codegen/src/
├── app.generator.ts                  # Main app generator
├── project.service.ts                # Project file access
├── increment-builder.ts              # Incremental builds
└── profiles/
    ├── profile.ts                    # Base profile
    ├── development.profile.ts        # Dev profile
    ├── expo-preview.profile.ts       # Expo preview
    └── web-preview.profile.ts        # Web preview

wavemaker-rn-runtime/src/runtime/
├── App.tsx                           # Main app component
├── App.navigator.tsx                 # Navigation setup
├── base-page.component.tsx           # Page base
└── base-partial.component.tsx        # Partial base
```

**Capabilities**:
1. **Build Process**: Explain complete build flow
2. **App Structure**: Explain generated app structure
3. **Profile Selection**: Guide on choosing build profiles
4. **Navigation Setup**: Explain navigation configuration
5. **Optimization**: Guide on app optimization

---

### 6. Base Agent

**Domain**: Core runtime infrastructure and utilities

**Responsibilities**:
- BaseComponent API
- Core utilities and helpers
- Event system
- Lifecycle management
- Memory management

**Knowledge Areas**:
```typescript
interface BaseKnowledge {
  // BaseComponent
  baseComponent: {
    api: BaseComponentAPI;
    lifecycle: LifecycleHooks;
    cleanup: CleanupSystem;
    state: StateManagement;
    props: PropsSystem;
  };
  
  // Core utilities
  utilities: {
    utils: CoreUtils;
    formatters: Formatters;
    validators: Validators;
    accessibility: AccessibilityHelpers;
  };
  
  // Event system
  events: {
    notifier: EventNotifier;
    subscription: SubscriptionSystem;
    propagation: EventPropagation;
  };
  
  // Infrastructure
  infrastructure: {
    injector: DependencyInjector;
    logger: Logger;
    viewport: Viewport;
    display: DisplayManager;
  };
}
```

**Example Queries**:
- "What methods does BaseComponent provide?"
- "How does the cleanup system work?"
- "Explain the event notifier"
- "What utility functions are available?"
- "How to properly manage component lifecycle?"

**Key Files**:
```
wavemaker-rn-runtime/src/core/
├── base.component.tsx                # Base component class
├── event-notifier.ts                 # Event system
├── utils.ts                          # Core utilities
├── formatters.ts                     # Data formatters
├── accessibility.ts                  # Accessibility helpers
├── injector.ts                       # DI container
├── logger.ts                         # Logging system
├── viewport.ts                       # Viewport management
└── display.manager.ts                # Display management
```

**Capabilities**:
1. **API Reference**: Complete BaseComponent API
2. **Lifecycle Guide**: Comprehensive lifecycle documentation
3. **Event System**: Explain event notifier usage
4. **Utilities**: Document all utility functions
5. **Best Practices**: Guide on proper usage

---

### 7. Parser Agent

**Domain**: HTML/CSS/JS parsing and AST manipulation

**Responsibilities**:
- HTML parsing and transformation
- CSS parsing and analysis
- JavaScript AST parsing
- Bind expression parsing
- Property parsing

**Knowledge Areas**:
```typescript
interface ParserKnowledge {
  // HTML parsing
  html: {
    parser: HTMLParser;
    transformer: HTMLTransformer;
    nodeTypes: NodeTypeRegistry;
  };
  
  // CSS parsing
  css: {
    parser: CSSParser;
    cssTree: CSSTreeParser;
    lessCompiler: LessCompiler;
  };
  
  // JavaScript parsing
  javascript: {
    babelParser: BabelParser;
    astTraversal: ASTTraversal;
    transformation: ASTTransformation;
  };
  
  // Expression parsing
  expressions: {
    bindParser: BindExpressionParser;
    propertyParser: PropertyParser;
    evaluator: ExpressionEvaluator;
  };
}
```

**Example Queries**:
- "How is HTML parsed?"
- "How are bind expressions evaluated?"
- "Explain CSS parsing"
- "How to parse custom properties?"
- "Show me AST transformation"

**Key Files**:
```
wavemaker-rn-codegen/src/
├── transpile/
│   ├── transpile.ts                  # Main transpiler (uses node-html-parser)
│   ├── bind.ex.transformer.ts        # Bind expression parser
│   └── property/
│       ├── property-parser.ts        # Property parser
│       └── [property-specific parsers]
└── theme/
    └── font-stylesheet.transpiler.ts # CSS parsing

wavemaker-rn-mcp/src/utils/
├── ast-parser.ts                     # AST utilities
└── code-pattern-extractor.ts        # Pattern extraction
```

**Capabilities**:
1. **HTML Parsing**: Explain HTML parsing process
2. **Expression Evaluation**: How bind expressions work
3. **CSS Parsing**: CSS/LESS parsing and transformation
4. **AST Analysis**: JavaScript AST manipulation
5. **Custom Parsers**: Guide on creating custom parsers

---

### 8. Formatter Agent

**Domain**: Code formatting and prettification

**Responsibilities**:
- Code formatting rules
- JavaScript/JSX formatting
- Style formatting
- Output beautification

**Knowledge Areas**:
```typescript
interface FormatterKnowledge {
  // Code formatting
  formatting: {
    prettier: PrettierConfig;
    rules: FormattingRules;
    jsxFormatting: JSXFormatter;
  };
  
  // Generated code
  output: {
    indentation: IndentationRules;
    lineBreaks: LineBreakRules;
    spacing: SpacingRules;
  };
  
  // Custom formatters
  custom: {
    dataFormatters: DataFormatter[];
    displayFormatters: DisplayFormatter[];
  };
}
```

**Example Queries**:
- "How is generated code formatted?"
- "What are the formatting rules?"
- "How to format custom output?"
- "Explain data formatters"

**Key Files**:
```
wavemaker-rn-codegen/src/
├── fomatter.ts                       # Code formatter
└── utils.ts                          # Formatting utilities

wavemaker-rn-runtime/src/core/
└── formatters.ts                     # Runtime formatters
```

**Capabilities**:
1. **Format Rules**: Explain formatting standards
2. **Code Beautification**: How code is beautified
3. **Data Formatting**: Runtime data formatters
4. **Custom Formatters**: Guide on custom formatters

---

### 9. Generation Agent

**Domain**: Code generation from templates

**Responsibilities**:
- Template engine (Handlebars)
- Component generation
- Page generation
- File generation from templates

**Knowledge Areas**:
```typescript
interface GenerationKnowledge {
  // Template system
  templates: {
    engine: HandlebarsEngine;
    helpers: HandlebarsHelpers;
    registry: TemplateRegistry;
  };
  
  // Generation types
  generators: {
    component: ComponentGenerator;
    page: PageGenerator;
    partial: PartialGenerator;
    prefab: PrefabGenerator;
    service: ServiceGenerator;
  };
  
  // Template files
  templateFiles: Map<string, Template>;
}
```

**Example Queries**:
- "How are components generated?"
- "What templates are available?"
- "How does the template engine work?"
- "How to create custom templates?"

**Key Files**:
```
wavemaker-rn-codegen/src/
├── app.generator.ts                  # Main generator
├── handlebar-helpers.ts              # Template helpers
└── templates/
    ├── component/
    │   ├── component.template        # Component template
    │   ├── component.props.template  # Props template
    │   ├── script.template           # Script template
    │   └── style.template            # Style template
    ├── app.template                  # App template
    ├── bootstrap.template            # Bootstrap template
    ├── pages-config.template         # Pages config
    └── [many more templates]
```

**Capabilities**:
1. **Template System**: Explain Handlebars usage
2. **Generation Process**: How files are generated
3. **Template Helpers**: Available helper functions
4. **Custom Generation**: Guide on custom generation

---

### 10. Binding Agent

**Domain**: Data binding and watch system

**Responsibilities**:
- Two-way data binding
- Watch expressions
- Change detection
- Binding evaluation

**Knowledge Areas**:
```typescript
interface BindingKnowledge {
  // Binding system
  binding: {
    twoWay: TwoWayBinding;
    oneWay: OneWayBinding;
    evaluation: BindingEvaluation;
  };
  
  // Watch system
  watch: {
    watchers: WatcherSystem;
    changeDetection: ChangeDetection;
    optimization: WatcherOptimization;
  };
  
  // Expression evaluation
  expressions: {
    syntax: BindingSyntax;
    context: BindingContext;
    scope: ScopeResolution;
  };
}
```

**Example Queries**:
- "How does data binding work?"
- "Explain watch expressions"
- "How are bind expressions evaluated?"
- "How to optimize watchers?"

**Key Files**:
```
wavemaker-rn-runtime/src/runtime/
└── watcher.ts                        # Watch system

wavemaker-rn-codegen/src/transpile/
└── bind.ex.transformer.ts            # Bind expression transformer
```

**Capabilities**:
1. **Binding Explanation**: How binding works
2. **Watch System**: Watcher implementation and usage
3. **Performance**: Binding optimization techniques
4. **Debugging**: Debug binding issues

---

### 11. Variable Agent

**Domain**: Variable system and state management

**Responsibilities**:
- Variable types (Model, Live, Service, Device)
- Variable lifecycle
- Variable transformation (generation)
- Variable operations

**Knowledge Areas**:
```typescript
interface VariableKnowledge {
  // Variable types
  types: {
    model: ModelVariable;
    live: LiveVariable;
    service: ServiceVariable;
    device: DeviceVariable;
  };
  
  // Variable system
  system: {
    baseVariable: BaseVariable;
    lifecycle: VariableLifecycle;
    operations: VariableOperations;
  };
  
  // Transformation
  transformation: {
    transformer: VariableTransformer;
    generation: VariableGeneration;
  };
}
```

**Example Queries**:
- "What variable types are available?"
- "How does LiveVariable work?"
- "How are variables generated?"
- "Explain variable lifecycle"

**Key Files**:
```
wavemaker-rn-runtime/src/variables/
├── base-variable.ts                  # Base variable
├── model-variable.ts                 # Model variable
├── live-variable.ts                  # Live variable
├── service-variable.ts               # Service variable
├── device-variable.ts                # Device variable
└── http.service.ts                   # HTTP service

wavemaker-rn-codegen/src/variables/
└── variable.transformer.ts           # Variable transformation
```

**Capabilities**:
1. **Variable Types**: Explain all variable types
2. **Lifecycle**: Variable initialization and cleanup
3. **Operations**: Variable methods and operations
4. **Transformation**: How variables are generated

---

## Agent Workflows

### Query Resolution Workflow

```
User Query
    │
    ▼
┌─────────────────┐
│ Query Analyzer  │ ◄─── Analyze intent, extract entities
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Intent Router   │ ◄─── Route to appropriate sub-agent(s)
└────────┬────────┘
         │
         ├─────────────┬────────────┬──────────────┬──────────┐
         ▼             ▼            ▼              ▼          ▼
    ┌────────┐   ┌─────────┐  ┌──────────┐  ┌─────────┐  [more]
    │Component│   │Transform│  │ Style    │  │ Service │
    │ Agent   │   │  Agent  │  │  Agent   │  │  Agent  │
    └────┬───┘   └────┬────┘  └─────┬────┘  └────┬────┘
         │            │              │            │
         └────────────┴──────────────┴────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   Codebase   │ ◄─── Access files, parse code
                  │   Access     │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Response   │ ◄─── Synthesize answer
                  │ Synthesizer  │
                  └──────┬───────┘
                         │
                         ▼
                  Final Response
```

### Example: "How does WmButton work?"

```
1. Query Analyzer
   └─→ Intent: FIND_COMPONENT + UNDERSTAND_FEATURE
   └─→ Entity: "WmButton"
   └─→ Aspect: "implementation"

2. Agent Selection
   └─→ Primary: Component Agent
   └─→ Secondary: Style Agent, Transformer Agent

3. Component Agent
   ├─→ Locate: components/basic/button/button.component.tsx
   ├─→ Analyze: Class structure, props, lifecycle
   └─→ Find related: button.props.ts, button.styles.ts

4. Style Agent
   └─→ Locate: theme/components/button.ts
   └─→ Explain: Style definitions

5. Transformer Agent
   └─→ Locate: transpile/components/button.transpiler.ts
   └─→ Explain: HTML → JSX transformation

6. Response Synthesis
   ├─→ Section 1: Component overview
   ├─→ Section 2: Implementation details
   ├─→ Section 3: Style application
   ├─→ Section 4: Transformation process
   └─→ Section 5: Usage examples

7. Final Response
   └─→ Formatted markdown with code references
```

### Example: "Why isn't my list rendering?"

```
1. Query Analyzer
   └─→ Intent: DIAGNOSE_ISSUE
   └─→ Entity: "list"
   └─→ Problem: "not rendering"

2. Agent Selection
   └─→ Primary: Component Agent
   └─→ Secondary: Binding Agent, Variable Agent

3. Component Agent
   └─→ Locate: components/data/list/list.component.tsx
   └─→ Analyze: Rendering logic, conditions

4. Binding Agent
   └─→ Check: Data binding patterns
   └─→ Identify: Common binding issues

5. Variable Agent
   └─→ Check: Variable setup
   └─→ Identify: Common variable issues

6. Knowledge Base
   └─→ Retrieve: Common list rendering issues
   └─→ Retrieve: Solutions and fixes

7. Response Synthesis
   ├─→ Section 1: Possible causes
   ├─→ Section 2: Diagnostic steps
   ├─→ Section 3: Code to check
   ├─→ Section 4: Common solutions
   └─→ Section 5: Debug logging suggestions

8. Final Response
   └─→ Structured troubleshooting guide
```

---

## Integration & Communication

### Agent Communication Protocol

```typescript
interface AgentMessage {
  from: AgentType;
  to: AgentType | AgentType[];
  type: 'QUERY' | 'RESPONSE' | 'DELEGATE' | 'AGGREGATE';
  payload: any;
  context: MessageContext;
}

interface MessageContext {
  originalQuery: string;
  intent: QueryIntent;
  entities: Entity[];
  conversationId: string;
  timestamp: number;
}
```

### Collaboration Patterns

#### 1. Sequential Processing
Agent A → Agent B → Agent C → Response

**Example**: Understanding a widget
- Component Agent finds implementation
- Style Agent explains styling
- Transformer Agent explains generation
- Response synthesized

#### 2. Parallel Processing
```
Query → Agent A ──┐
     → Agent B ──┼──→ Aggregate → Response
     → Agent C ──┘
```

**Example**: Comprehensive analysis
- Component Agent analyzes structure
- Style Agent analyzes styles (parallel)
- Transformer Agent analyzes transformation (parallel)
- Results aggregated

#### 3. Hierarchical Delegation
```
Main Agent
    └─→ Sub-Agent 1
        └─→ Sub-Agent 2
            └─→ Sub-Agent 3
```

**Example**: Deep dive
- App Agent
  └─→ Generation Agent (how page is generated)
      └─→ Template Agent (template details)
          └─→ Parser Agent (template parsing)

---

## Usage Examples

### Example 1: Understanding a Component

**Query**: "Explain how WmProgressCircle works"

**Response Structure**:
```markdown
# WmProgressCircle Component

## Overview
The WmProgressCircle is a circular progress indicator widget located in the basic widgets category.

## Location
- **Component**: `components/basic/progress-circle/progress-circle.component.tsx`
- **Props**: `components/basic/progress-circle/progress-circle.props.ts`
- **Styles**: `components/basic/progress-circle/progress-circle.styles.ts`
- **Transformer**: `transpile/components/progresscircle.transpiler.ts`

## Implementation

### Class Structure
```typescript
// From: progress-circle.component.tsx:15-150
export class WmProgressCircle extends BaseComponent<WmProgressCircleProps, ...> {
  // Key methods explained...
}
```

### Key Properties
- `value`: Current progress value (0-100)
- `maxvalue`: Maximum value for progress
- `type`: Style variant (primary, success, danger, etc.)
- ... [more props]

### Rendering Logic
1. Calculates percentage from value/maxvalue
2. Uses react-native-circular-progress library
3. Applies theme-based styling
4. Handles animations

## Styling

[Style definitions and theming explained]

## Code Generation

[How HTML is transformed to this component]

## Usage Examples

[Example code snippets]
```

**Agents Involved**:
1. **Component Agent**: Found implementation, analyzed structure
2. **Style Agent**: Explained styling
3. **Transformer Agent**: Explained generation
4. **Base Agent**: Explained BaseComponent inheritance

---

### Example 2: Debugging an Issue

**Query**: "My variable isn't updating the list"

**Response Structure**:
```markdown
# Debugging Variable → List Binding

## Diagnostic Steps

### Step 1: Verify Variable Setup
Check your variable configuration:
```javascript
// Variables should be properly initialized
liveVariable = new LiveVariable({
  isList: true,
  twoWayBinding: true,
  // ... config
});
```

### Step 2: Check Data Binding
Verify the list is bound correctly:
```xml
<wm-list dataset="bind:Variables.liveVariable.dataSet">
```

### Step 3: Common Issues

#### Issue 1: Variable not a List
**Symptom**: Only first item shows or data structure wrong
**Solution**: Ensure `isList: true` in variable config
**Code**: [relevant code example]

#### Issue 2: Not Triggering Re-render
**Symptom**: Data updates but UI doesn't
**Solution**: Ensure proper state update in component
**Code**: [relevant code example]

[... more issues and solutions]

### Step 4: Debug Logging
Add this logging to diagnose:
```javascript
console.log('Variable data:', this.Variables.liveVariable.dataSet);
console.log('Is list:', Array.isArray(this.Variables.liveVariable.dataSet));
```

### Step 5: Check Variable Lifecycle
[Explanation of when variable loads, updates, etc.]

## Related Documentation
- [Variable System](...)
- [List Component](...)
- [Data Binding](...)
```

**Agents Involved**:
1. **Variable Agent**: Explained variable system
2. **Binding Agent**: Explained data binding
3. **Component Agent**: Explained list rendering
4. **Knowledge Base**: Retrieved common issues

---

### Example 3: Learning a Concept

**Query**: "How does data binding work in WaveMaker RN?"

**Response Structure**:
```markdown
# Data Binding in WaveMaker React Native

## Overview
WaveMaker RN uses a two-way data binding system that connects UI widgets to data sources (variables).

## Architecture

### Binding Types

#### 1. One-Way Binding
Data flows from source to widget
```xml
<wm-label caption="bind:Variables.userName"></wm-label>
```

#### 2. Two-Way Binding
Data flows bidirectionally
```xml
<wm-text datavalue="bind:Variables.formData.name"></wm-text>
```

### Binding Syntax

In markup:
```xml
<wm-widget property="bind:expression"></wm-widget>
```

Transpiled to:
```javascript
<WmWidget property={this.bind('expression')} />
```

## How It Works

### Step 1: Parse Binding Expression
[Explanation with code]

### Step 2: Create Watcher
[Explanation with code]

### Step 3: Evaluate Expression
[Explanation with code]

### Step 4: Update Widget
[Explanation with code]

### Step 5: Handle Changes (Two-Way)
[Explanation with code]

## Implementation Deep Dive

### bind.ex.transformer.ts
```typescript
// How bind expressions are transformed
export default function transformEx(expression, context, type) {
  // ... transformation logic
}
```

### watcher.ts
```typescript
// How watchers detect changes
export class Watcher {
  watch(expression, callback) {
    // ... watch logic
  }
}
```

### PropsProvider
```typescript
// How props are proxied for binding
export class PropsProvider {
  // ... proxy logic
}
```

## Performance Considerations
- Watch expression optimization
- Avoid deep watches
- Debounce expensive operations
[... detailed explanations]

## Best Practices
1. Use specific paths (not deep watches)
2. Cleanup watchers in lifecycle
3. Avoid binding in loops
[... more practices]

## Examples

### Example 1: Form Binding
[Complete example]

### Example 2: List Item Binding
[Complete example]

## Related Topics
- [Variable System](...)
- [Watch System](...)
- [Component Lifecycle](...)
```

**Agents Involved**:
1. **Binding Agent**: Core binding explanation
2. **Parser Agent**: Expression parsing
3. **Transformer Agent**: Code transformation
4. **Base Agent**: Runtime binding
5. **Component Agent**: Widget binding usage

---

## Best Practices

### For Agent Implementation

1. **Specialized Knowledge**
   - Each agent should have deep knowledge in its domain
   - Don't overlap responsibilities
   - Maintain clear boundaries

2. **Evidence-Based Responses**
   - Always provide code references
   - Link to actual files
   - Show real examples from codebase

3. **Context Awareness**
   - Maintain conversation context
   - Reference previous queries when relevant
   - Build on previous answers

4. **Lazy Loading**
   - Don't load all files upfront
   - Load only what's needed for the query
   - Cache frequently accessed files

5. **Clear Communication**
   - Use structured responses
   - Provide clear headings
   - Include code examples
   - Link to related documentation

### For Agent Usage

1. **Be Specific**
   - Provide specific component/file names
   - Include context in queries
   - Specify what aspect you're interested in

2. **Follow-Up Questions**
   - Ask for clarification
   - Request examples
   - Dive deeper into specific aspects

3. **Multi-Part Queries**
   - Break complex queries into parts
   - Allow agents to work sequentially
   - Build understanding progressively

4. **Verify Understanding**
   - Ask agents to explain back
   - Request examples to verify
   - Test understanding with specific scenarios

---

## Future Enhancements

### Planned Features

1. **Learning System**
   - Learn from query patterns
   - Improve responses over time
   - Build query → answer cache

2. **Code Generation**
   - Generate custom widgets
   - Generate transformers
   - Generate style definitions

3. **Automated Testing**
   - Generate tests for components
   - Generate tests for transformers
   - Validate generated code

4. **Visual Diagrams**
   - Generate architecture diagrams
   - Generate flow diagrams
   - Generate dependency graphs

5. **Interactive Exploration**
   - Interactive codebase navigation
   - Step-through explanations
   - Visual debugging

---

## Conclusion

The Codebase Agent system provides a comprehensive, intelligent interface to the WaveMaker React Native codebase. By leveraging specialized sub-agents, it can answer complex queries, diagnose issues, explain concepts, and guide development.

Each sub-agent is an expert in its domain:
- **Transformer Agent**: Widget transformation expert
- **Style Agent**: Theming and styling expert
- **Service Agent**: Runtime services expert
- **Component Agent**: Widget implementation expert
- **App Agent**: Application architecture expert
- **Base Agent**: Core infrastructure expert
- **Parser Agent**: Parsing and AST expert
- **Formatter Agent**: Code formatting expert
- **Generation Agent**: Code generation expert
- **Binding Agent**: Data binding expert
- **Variable Agent**: State management expert

Together, they form a powerful system that makes the WaveMaker RN codebase accessible, understandable, and maintainable.

---

**Document Version**: 1.0  
**Last Updated**: November 3, 2025  
**Maintained By**: WaveMaker React Native Team

