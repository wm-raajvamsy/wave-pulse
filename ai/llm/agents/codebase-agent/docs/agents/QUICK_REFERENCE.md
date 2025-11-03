# Codebase Agent - Quick Reference Cheat Sheet

## Agent System at a Glance

```
┌─────────────────────────────────────────────────────┐
│         CODEBASE AGENT (Orchestrator)               │
│  • Query Understanding                              │
│  • Agent Coordination                               │
│  • Response Synthesis                               │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    Runtime                 Codegen
    @wavemaker/            @wavemaker/
    app-rn-runtime         rn-codegen
        │                     │
        ├─ 11 Sub-Agents ─────┤
```

---

## 15 Sub-Agents Quick Reference

### Core Agents (11)

| # | Agent | Domain | Key Expertise |
|---|-------|--------|---------------|
| 1 | **Transformer** 📝 | Widget Transformation | HTML→JSX, Bind expressions, Property mapping |
| 2 | **Style** 🎨 | Theming & Styling | CSS→RN styles, Theme compilation, Style defs |
| 3 | **Service** ⚙️ | Runtime Services | DI container, Service APIs, Navigation, Modal |
| 4 | **Component** 🧩 | Widget Implementation | BaseComponent, Lifecycle, 50+ widgets |
| 5 | **App** 📱 | App Architecture | App generation, Build flow, Navigation setup |
| 6 | **Base** 🔧 | Core Infrastructure | BaseComponent API, Utilities, Event system |
| 7 | **Parser** 📄 | Parsing & AST | HTML/CSS/JS parsing, Expression evaluation |
| 8 | **Formatter** ✨ | Code Formatting | JS/JSX formatting, Data formatters |
| 9 | **Generation** 🏗️ | Code Generation | Handlebars templates, Component generation |
| 10 | **Binding** 🔗 | Data Binding | Two-way binding, Watch system, Change detection |
| 11 | **Variable** 📊 | State Management | Variable types, CRUD ops, Lifecycle |

### Specialized Agents (4)

| # | Agent | Domain | Key Expertise |
|---|-------|--------|---------------|
| 12 | **Transpiler** 🔄 | Core Transpilation | Transpilation engine, Tree traversal, Context management |
| 13 | **Fragment** 🧱 | Fragments & Hierarchy | Pages, Partials, Prefabs, Fragment lifecycle |
| 14 | **Watcher** 👁️ | Watch System | Change detection, Digest cycle, Watch optimization |
| 15 | **Memo** 💾 | Memoization | WmMemo component, shouldComponentUpdate, Render optimization |

---

## Query → Agent Mapping

### Understanding Components
| Query | Primary Agent | Secondary Agents |
|-------|---------------|------------------|
| "Where is WmButton?" | Component | - |
| "How does WmButton work?" | Component | Style, Transformer |
| "What props does WmList support?" | Component | - |
| "Compare WmList and WmLivelist" | Component | Variable |

### Widget Transformation
| Query | Primary Agent | Secondary Agents |
|-------|---------------|------------------|
| "How is WmForm transformed?" | Transformer | Parser, Generation |
| "Explain bind expressions" | Transformer | Binding, Parser |
| "Show List transformer" | Transformer | - |

### Styling & Theming
| Query | Primary Agent | Secondary Agents |
|-------|---------------|------------------|
| "How to style WmButton?" | Style | Component |
| "Explain theme compilation" | Style | Generation |
| "CSS → RN StyleSheet?" | Style | Parser |

### Variables & State
| Query | Primary Agent | Secondary Agents |
|-------|---------------|------------------|
| "What is LiveVariable?" | Variable | - |
| "How to use variables?" | Variable | Binding, Component |
| "Variable lifecycle?" | Variable | - |

### Services & APIs
| Query | Primary Agent | Secondary Agents |
|-------|---------------|------------------|
| "How does Navigation work?" | Service | App |
| "Using Modal service?" | Service | - |
| "Dependency injection?" | Service | Base |

### Debugging
| Query | Primary Agent | Secondary Agents |
|-------|---------------|------------------|
| "List not rendering" | Component | Variable, Binding |
| "Variable not updating" | Variable | Binding |
| "Style not applying" | Style | Component |

---

## Codebase Paths Quick Reference

### Runtime (`@wavemaker/app-rn-runtime`)

```
wavemaker-rn-runtime/src/
├── components/          # All widgets (50+)
│   ├── basic/          # Button, Label, Icon, Picture, etc.
│   ├── container/      # Panel, Tabs, Accordion, etc.
│   ├── input/          # Text, Select, Date, etc.
│   ├── data/           # List, Form, Card, Table
│   ├── chart/          # Bar, Line, Pie, Donut
│   ├── navigation/     # Nav, Menu, Popover
│   ├── device/         # Camera, Barcode
│   ├── dialogs/        # Alert, Confirm, Modal
│   └── page/           # Page, Header, Footer
├── core/               # Core infrastructure
│   ├── base.component.tsx      # Base component class
│   ├── injector.ts             # DI container
│   ├── event-notifier.ts       # Event system
│   ├── navigation.service.ts   # Navigation
│   ├── modal.service.ts        # Modals
│   └── [services...]
├── variables/          # Variable system
│   ├── base-variable.ts        # Base variable
│   ├── model-variable.ts       # Model var
│   ├── live-variable.ts        # Live var
│   ├── service-variable.ts     # Service var
│   └── device-variable.ts      # Device var
├── styles/             # Styling system
│   ├── theme.tsx              # Runtime theme
│   └── theme.variables.ts     # Theme vars
├── runtime/            # App-level
│   ├── App.tsx                # Main app
│   ├── App.navigator.tsx      # Navigation
│   └── watcher.ts             # Watch system
└── actions/            # Actions
```

### Codegen (`@wavemaker/rn-codegen`)

```
wavemaker-rn-codegen/src/
├── app.generator.ts    # Main generator
├── project.service.ts  # Project access
├── fomatter.ts         # Code formatter
├── handlebar-helpers.ts # Template helpers
├── transpile/          # Transpilation
│   ├── transpile.ts            # Core transpiler
│   ├── bind.ex.transformer.ts  # Bind expressions
│   ├── style.transformer.ts    # Style transform
│   ├── components/             # Widget transformers (50+)
│   │   ├── button.transpiler.ts
│   │   ├── list.transpiler.ts
│   │   └── [50+ transformers...]
│   ├── property/               # Property parsing
│   └── style/                  # Style parsing
├── theme/              # Theme compilation
│   ├── theme.service.ts        # Theme compiler
│   ├── rn-stylesheet.transpiler.ts # CSS→RN
│   ├── variables.ts            # Theme variables
│   └── components/             # Style definitions (50+)
├── templates/          # Handlebars templates
│   ├── app.template
│   ├── bootstrap.template
│   ├── component/
│   └── [many templates...]
├── variables/          # Variable transformation
│   └── variable.transformer.ts
└── profiles/           # Build profiles
    ├── development.profile.ts
    ├── expo-preview.profile.ts
    └── web-preview.profile.ts
```

---

## Key Interfaces

### BaseComponent

```typescript
class BaseComponent<T extends BaseProps, S extends State, L extends Styles> {
  // Properties
  styles: L;
  proxy: BaseComponent;
  initialized: boolean;
  cleanup: Function[];
  theme: Theme;
  parent: BaseComponent;
  notifier: EventNotifier;
  
  // Lifecycle
  init(): void;
  destroy(): void;
  onPropertyChange(prevProps): void;
  
  // Render
  renderWidget(props: T): ReactNode;
  
  // Utilities
  updateState(partial, callback?, delay?): void;
  invokeEventCallback(eventName, ...args): void;
  getWidget(name): BaseComponent | null;
}
```

### BaseVariable

```typescript
class BaseVariable<T extends VariableConfig> {
  // Properties
  name: string;
  params: any;
  dataSet: any;
  isList: boolean;
  isExecuting: boolean;
  
  // Operations
  invoke(params?, onSuccess?, onError?): Promise;
  getData(): any;
  setData(dataSet): any;
  getValue(key, index?): any;
  setValue(key, value): any;
  getItem(index): any;
  setItem(index, value): any;
  addItem(value?, index?): any;
  removeItem(index): any;
  clearData(): void;
}
```

### Transformer Interface

```typescript
interface Transformer {
  pre(element, context): string;      // Before children
  post(element, context): string;     // After children
  imports(element, context): Import[]; // Required imports
  partials?(element, context): string[]; // Partials
  prefabs?(element, context): string[]; // Prefabs
}
```

---

## Common Patterns

### Component Lifecycle

```typescript
constructor → render → componentDidMount → init() → onLoad
                ↓
          Component Active
                ↓
Props Change → render → componentDidUpdate → onPropertyChange()
                ↓
componentWillUnmount → destroy() → cleanup execution
```

### Variable Lifecycle

```typescript
Creation → Configuration
    ↓
invoke() → BEFORE_INVOKE → onBefore()
    ↓
API Call / Operation
    ↓
SUCCESS/ERROR → onSuccess()/onError()
    ↓
AFTER_INVOKE → onComplete()
```

### Transformation Pipeline

```typescript
HTML Markup
    ↓
Parse HTML (node-html-parser)
    ↓
Pre-transpile (bind expressions)
    ↓
Widget Transformer
    ├─→ pre()
    ├─→ children
    ├─→ post()
    └─→ imports()
    ↓
Style Transformation
    ↓
Property Parsing
    ↓
JSX Output
```

---

## Variable Types Quick Comparison

| Feature | Model | Live | Service | Device |
|---------|-------|------|---------|--------|
| **Backend** | ❌ | ✅ | ✅ | ✅ |
| **CRUD** | ❌ | ✅ | ❌ | ❌ |
| **Pagination** | ❌ | ✅ | ❌ | ❌ |
| **Auto-invoke** | ❌ | ✅ | ✅ | ❌ |
| **Use Case** | Form data | DB entities | API calls | Device ops |

---

## Widget Categories

### Basic (10)
Button, Label, Icon, Picture, Html, Spinner, Video, Audio, ProgressBar, ProgressCircle

### Container (10)
Container, Panel, Tabs, Accordion, Tile, Layoutgrid, GridColumn, GridRow, Segment, Wizard

### Input (18)
Text, Textarea, Number, Checkbox, Radioset, Select, Switch, Slider, Rating, Date, Time, Datetime, Currency, ColorPicker, Fileupload, Checkboxset, Chips, Search

### Data (6)
List, Livelist, Card, Form, Liveform, Table

### Chart (5)
Chart, Barchart, Linechart, Piechart, Donutchart

### Navigation (5)
Nav, Navbar, Menu, Popover, Tabbar

### Device (2)
Camera, Barcodescanner

### Dialogs (4)
Alertdialog, Confirmdialog, Modal, Popup

---

## Event Callbacks

### Component Events
- `onLoad` - Component initialized
- `onDestroy` - Component unmounted
- `onPress` - Button/tappable pressed
- `onChange` - Input value changed
- `onFocus` / `onBlur` - Input focus

### Variable Events
- `onBefore` - Before invoke
- `onSuccess` - After success
- `onError` - On error
- `onComplete` - Always after invoke

---

## Common Code Snippets

### Create Component
```typescript
export class WmCustom extends BaseComponent<Props, State, Styles> {
  constructor(props) {
    super(props, DEFAULT_STYLES, 'WmCustom');
  }
  
  renderWidget(props) {
    return <View style={this.styles.root}>{props.children}</View>;
  }
}
```

### Create Variable
```javascript
Variables.myVar = new LiveVariable({
  name: 'myVar',
  isList: true,
  service: 'MyService',
  operation: 'read',
  startUpdate: true
});
```

### Create Transformer
```typescript
const customTranspiler: Transformer = {
  pre: (el, ctx) => `<WmCustom ${extractProps(el)}>`,
  post: (el, ctx) => `</WmCustom>`,
  imports: (el, ctx) => [{
    name: 'WmCustom',
    from: '@wavemaker/app-rn-runtime/components/custom'
  }]
};
```

---

## Debugging Quick Commands

### Component Debugging
```javascript
// Check component state
console.log('State:', this.state);
console.log('Props:', this.props);
console.log('Initialized:', this.initialized);

// Check parent/children
console.log('Parent:', this.parent);
console.log('Child:', this.getWidget('widgetName'));
```

### Variable Debugging
```javascript
// Check variable state
console.log('Variable:', {
  name: Variables.myVar.name,
  isExecuting: Variables.myVar.isExecuting,
  dataSet: Variables.myVar.dataSet,
  isList: Variables.myVar.isList
});

// Check variable config
console.log('Config:', Variables.myVar.config);
```

### Binding Debugging
```javascript
// Check binding
console.log('Binding:', this.bind('Variables.myVar.dataSet'));

// Watch expression
const unwatch = this.watch('Variables.myVar.dataSet', (newVal) => {
  console.log('Data changed:', newVal);
});
```

---

## Agent Documentation Links

- **[Codebase Agent Architecture](../CODEBASE_AGENT_ARCHITECTURE.md)** - Complete architecture
- **[Agent System README](./README.md)** - Comprehensive guide
- **[Transformer Agent](./TRANSFORMER_AGENT.md)** - Widget transformation
- **[Component Agent](./COMPONENT_AGENT.md)** - Widget implementation
- **[Variable Agent](./VARIABLE_AGENT.md)** - State management

---

## Support

**Ask the Agent**: "How do I [your question]?"

**Examples**:
- "How do I use the agent system?"
- "What agent handles styling?"
- "Show me variable examples"
- "Debug my component"

---

**Version**: 1.0 | **Updated**: Nov 3, 2025 | **Platform**: WaveMaker RN

