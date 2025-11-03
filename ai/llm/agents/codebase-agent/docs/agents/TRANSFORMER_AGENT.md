# Transformer Agent - Detailed Documentation

## Overview

The **Transformer Agent** is a specialized AI agent that understands and explains the widget transformation process in WaveMaker React Native. It has deep knowledge of how HTML markup is transpiled into React Native JSX components.

## Domain Expertise

### Core Responsibilities

1. **Widget Transformation Analysis**
   - Understand how each widget transforms from HTML to JSX
   - Explain property mappings
   - Handle attribute transformations
   - Process style transformations

2. **Bind Expression Transformation**
   - Parse bind: expressions
   - Transform expressions for React context
   - Handle different binding contexts (fragment, attr, event)

3. **Transpiler Location & Analysis**
   - Find transpiler files for any widget
   - Explain transpiler logic
   - Show transformation examples

4. **Debugging Transformation Issues**
   - Identify transformation problems
   - Suggest fixes
   - Explain unexpected output

## Knowledge Base

### Transformer Registry

The agent maintains a complete registry of all widget transformers:

```typescript
const TRANSFORMER_REGISTRY = {
  // Basic widgets
  'wm-button': 'transpile/components/button.transpiler.ts',
  'wm-label': 'transpile/components/label.transpiler.ts',
  'wm-icon': 'transpile/components/icon.transpiler.ts',
  'wm-picture': 'transpile/components/picture.transpiler.ts',
  'wm-html': 'transpile/components/html.transpiler.ts',
  'wm-spinner': 'transpile/components/spinner.transpiler.ts',
  'wm-video': 'transpile/components/video.transpiler.ts',
  'wm-audio': 'transpile/components/audio.transpiler.ts',
  
  // Container widgets
  'wm-container': 'transpile/components/container.transpiler.ts',
  'wm-panel': 'transpile/components/panel.transpiler.ts',
  'wm-tabs': 'transpile/components/tabs.transpiler.ts',
  'wm-accordion': 'transpile/components/accordion.transpiler.ts',
  'wm-tile': 'transpile/components/tile.transpiler.ts',
  'wm-layoutgrid': 'transpile/components/layoutgrid.transpiler.ts',
  
  // Input widgets
  'wm-text': 'transpile/components/text.transpiler.ts',
  'wm-textarea': 'transpile/components/textarea.transpiler.ts',
  'wm-number': 'transpile/components/number.transpiler.ts',
  'wm-checkbox': 'transpile/components/checkbox.transpiler.ts',
  'wm-radioset': 'transpile/components/radioset.transpiler.ts',
  'wm-select': 'transpile/components/select.transpiler.ts',
  'wm-switch': 'transpile/components/switch.transpiler.ts',
  'wm-slider': 'transpile/components/slider.transpiler.ts',
  'wm-rating': 'transpile/components/rating.transpiler.ts',
  'wm-date': 'transpile/components/date.transpiler.ts',
  'wm-time': 'transpile/components/time.transpiler.ts',
  'wm-datetime': 'transpile/components/datetime.transpiler.ts',
  
  // Data widgets
  'wm-list': 'transpile/components/list.transpiler.ts',
  'wm-card': 'transpile/components/card.transpiler.ts',
  'wm-form': 'transpile/components/form.transpiler.ts',
  'wm-liveform': 'transpile/components/liveform.transpiler.ts',
  'wm-livelist': 'transpile/components/livelist.transpiler.ts',
  'wm-table': 'transpile/components/table.transpiler.ts',
  
  // Chart widgets
  'wm-chart': 'transpile/components/chart.transpiler.ts',
  'wm-barchart': 'transpile/components/barchart.transpiler.ts',
  'wm-linechart': 'transpile/components/linechart.transpiler.ts',
  'wm-piechart': 'transpile/components/piechart.transpiler.ts',
  'wm-donutchart': 'transpile/components/donutchart.transpiler.ts',
  
  // Navigation widgets
  'wm-nav': 'transpile/components/nav.transpiler.ts',
  'wm-navbar': 'transpile/components/navbar.transpiler.ts',
  'wm-menu': 'transpile/components/menu.transpiler.ts',
  'wm-popover': 'transpile/components/popover.transpiler.ts',
  
  // Device widgets
  'wm-camera': 'transpile/components/camera.transpiler.ts',
  'wm-barcodescanner': 'transpile/components/barcodescanner.transpiler.ts',
  
  // Page/Partial
  'wm-page': 'transpile/components/page.transpiler.ts',
  'wm-partial': 'transpile/components/partial.transpiler.ts',
  'wm-page-content': 'transpile/components/page-content.transpiler.ts',
};
```

### Transformation Pipeline

The agent understands the complete transformation pipeline:

```
HTML Markup (Studio Output)
    ↓
Parse HTML (node-html-parser)
    ↓
Pre-transpile (bind expression transformation)
    ↓
Widget-Specific Transformer
    ↓
    ├─→ pre() - Process before children
    ├─→ children processing
    ├─→ post() - Process after children
    ├─→ imports() - Gather imports
    └─→ partials/prefabs() - Collect dependencies
    ↓
Style Transformation
    ↓
Property Parsing
    ↓
JSX Output
```

## Core Files

### 1. Main Transpiler (`transpile.ts`)

**Location**: `wavemaker-rn-codegen/src/transpile/transpile.ts`

**Key Concepts**:

```typescript
// Transpilation context - carries state through transformation
class TranspilationContext {
  result: TranspiledOutput;      // Accumulates output
  transformer: Transformer;       // Current widget transformer
  isPartOfPrefab: boolean;       // Context flag
  listener?: string;             // Event listener
  props: string[];               // Component props
  data: any;                     // Additional data
  rnConfig: any;                 // RN configuration
}

// Transformer interface - what every widget transformer implements
interface Transformer {
  pre(element: HTMLElement, context: TranspilationContext): string;
  post(element: HTMLElement, context: TranspilationContext): string;
  imports(element: HTMLElement, context: TranspilationContext): Import[];
  partials?(element: HTMLElement, context: TranspilationContext): string[];
  prefabs?(element: HTMLElement, context: TranspilationContext): string[];
  xcomponents?(element: HTMLElement, context: TranspilationContext): string[];
}

// Output structure
interface TranspiledOutput {
  markup: string;           // Generated JSX
  components: any;          // Component metadata
  partials: string[];       // Required partials
  prefabs: string[];        // Required prefabs
  xcomponents: string[];    // Custom components
  imports: Import[];        // Import statements
}
```

**Key Methods**:

```typescript
class Transpiler {
  // Main transpilation entry point
  public transpile(markup: string, rnConfig: any): TranspiledOutput {
    // 1. Parse HTML
    const root = parse(markup);
    
    // 2. Pre-transpile (bind expressions)
    this.preTranspile(root, rnConfig);
    
    // 3. Transpile tree
    const result = this.transpileTree(root, rnConfig);
    
    return result;
  }
  
  // Pre-transpile: Transform bind expressions
  private preTranspile(element: HTMLElement, rnConfig: any) {
    // Transform bind: attributes
    Object.keys(element.attributes).forEach(name => {
      let value = element.attributes[name];
      if (value.startsWith('bind:')) {
        value = value.substring(5);
        element.setAttribute(name, 'bind:' + transformEx(value, 'fragment', 'attr'));
      }
      // Handle events
      else if (name.startsWith('on-')) {
        element.setAttribute(name, transformEx(value, 'fragment', 'event'));
      }
    });
    
    // Recursively process children
    element.childNodes.forEach(child => {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        this.preTranspile(child as HTMLElement, rnConfig);
      }
    });
  }
  
  // Transpile element tree
  private transpileTree(
    element: HTMLElement,
    context: TranspilationContext
  ): string {
    const transformer = this.getTransformer(element.tagName);
    
    // 1. Execute pre() - before children
    let markup = transformer.pre(element, context);
    
    // 2. Process children
    element.childNodes.forEach(child => {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        markup += this.transpileTree(child as HTMLElement, context);
      } else if (child.nodeType === NodeType.TEXT_NODE) {
        markup += this.transpileText(child.text);
      }
    });
    
    // 3. Execute post() - after children
    markup += transformer.post(element, context);
    
    // 4. Gather imports
    context.result.imports.push(...transformer.imports(element, context));
    
    return markup;
  }
}
```

### 2. Bind Expression Transformer (`bind.ex.transformer.ts`)

**Location**: `wavemaker-rn-codegen/src/transpile/bind.ex.transformer.ts`

**Purpose**: Transform Studio bind expressions to React-compatible expressions

**Examples**:

```javascript
// Studio expression → React expression

// Variable access
"Variables.userName" → "this.Variables.userName"

// Widget access
"Widgets.button1.caption" → "this.Widgets.button1.caption"

// Conditionals
"Variables.isLoggedIn ? 'Logout' : 'Login'" 
  → "this.Variables.isLoggedIn ? 'Logout' : 'Login'"

// Function calls
"toDate(Variables.startDate, 'yyyy-MM-dd')"
  → "this.toDate(this.Variables.startDate, 'yyyy-MM-dd')"

// Array access
"Variables.users[0].name" → "this.Variables.users[0].name"
```

**Transformation Contexts**:

```typescript
enum FORMAT_CONTEXT {
  FRAGMENT = 'fragment',  // In JSX: {expression}
  ATTR = 'attr',          // In attribute: prop={expression}
  EVENT = 'event'         // In event: onPress={() => expression}
}

// Usage:
transformEx(expression, FORMAT_CONTEXT.FRAGMENT, 'attr')
```

### 3. Style Transformer (`style.transformer.ts`)

**Location**: `wavemaker-rn-codegen/src/transpile/style.transformer.ts`

**Purpose**: Transform style attributes to React Native StyleSheet

```typescript
// HTML style attribute
<wm-button class="btn-primary" 
           width="100" 
           height="50"
           backgroundcolor="#007bff">
</wm-button>

// Transpiled to JSX
<WmButton 
  styles={{
    root: [
      this.theme.WmButton?.root,
      { width: 100, height: 50, backgroundColor: '#007bff' }
    ]
  }}
/>
```

### 4. Property Parser (`property/property-parser.ts`)

**Location**: `wavemaker-rn-codegen/src/transpile/property/property-parser.ts`

**Purpose**: Parse and transform widget properties

```typescript
export function parseProperty(
  propName: string,
  propValue: string,
  element: HTMLElement,
  context: TranspilationContext
): ParsedProperty {
  // Handle different property types
  if (propValue.startsWith('bind:')) {
    return parseBindProperty(propName, propValue, context);
  } else if (isStyleProperty(propName)) {
    return parseStyleProperty(propName, propValue);
  } else if (isEventProperty(propName)) {
    return parseEventProperty(propName, propValue, context);
  } else {
    return parseLiteralProperty(propName, propValue);
  }
}
```

## Widget Transformer Structure

Every widget transformer follows this pattern:

```typescript
// Example: button.transpiler.ts
import { Transformer, TranspilationContext } from '../transpile';
import { HTMLElement } from 'node-html-parser';

const buttonTranspiler: Transformer = {
  /**
   * pre() - Called before processing children
   * Returns opening tag markup
   */
  pre(element: HTMLElement, context: TranspilationContext): string {
    const attrs = element.attributes;
    
    // Extract properties
    const caption = attrs.caption || attrs.label || '';
    const type = attrs.type || 'default';
    const disabled = attrs.disabled === 'true';
    
    // Build props object
    const props = [];
    if (caption) props.push(`caption="${caption}"`);
    if (type) props.push(`type="${type}"`);
    if (disabled) props.push(`disabled={true}`);
    
    // Handle bind expressions
    if (attrs['caption.bind']) {
      const expr = transformEx(attrs['caption.bind'], 'fragment', 'attr');
      props.push(`caption={${expr}}`);
    }
    
    // Handle events
    if (attrs['on-click']) {
      const handler = transformEx(attrs['on-click'], 'fragment', 'event');
      props.push(`onPress={() => {${handler}}}`);
    }
    
    // Handle styles
    const styles = extractStyles(element, context);
    if (styles) {
      props.push(`styles={${styles}}`);
    }
    
    return `<WmButton ${props.join(' ')}>`;
  },
  
  /**
   * post() - Called after processing children
   * Returns closing tag markup
   */
  post(element: HTMLElement, context: TranspilationContext): string {
    return `</WmButton>`;
  },
  
  /**
   * imports() - Returns required imports
   */
  imports(element: HTMLElement, context: TranspilationContext): Import[] {
    return [{
      name: 'WmButton',
      from: '@wavemaker/app-rn-runtime/components/basic/button'
    }];
  },
  
  /**
   * partials() - Returns required partials (optional)
   */
  partials(element: HTMLElement, context: TranspilationContext): string[] {
    // If button contains a partial reference
    if (element.attributes['partial']) {
      return [element.attributes['partial']];
    }
    return [];
  }
};

export default buttonTranspiler;
```

## Common Transformation Patterns

### Pattern 1: Simple Property Mapping

```typescript
// HTML
<wm-label caption="Hello World" color="blue"></wm-label>

// Transpiled JSX
<WmLabel caption="Hello World" color="blue" />
```

### Pattern 2: Bind Expression Property

```typescript
// HTML
<wm-label caption="bind:Variables.userName"></wm-label>

// Transpiled JSX
<WmLabel caption={this.Variables.userName} />
```

### Pattern 3: Event Handling

```typescript
// HTML
<wm-button on-click="Variables.counter.setValue('count', Variables.counter.count + 1)">

// Transpiled JSX
<WmButton 
  onPress={() => {
    this.Variables.counter.setValue('count', this.Variables.counter.count + 1);
  }}
/>
```

### Pattern 4: Conditional Rendering

```typescript
// HTML
<wm-container show="bind:Variables.isLoggedIn">
  <wm-label caption="Welcome"></wm-label>
</wm-container>

// Transpiled JSX
<WmContainer show={this.Variables.isLoggedIn}>
  <WmLabel caption="Welcome" />
</WmContainer>
```

### Pattern 5: List Rendering

```typescript
// HTML
<wm-list dataset="bind:Variables.users.dataSet">
  <wm-list-template>
    <wm-label caption="bind:item.name"></wm-label>
  </wm-list-template>
</wm-list>

// Transpiled JSX
<WmList dataset={this.Variables.users.dataSet}>
  {(item, index) => (
    <WmLabel caption={item.name} />
  )}
</WmList>
```

### Pattern 6: Style Application

```typescript
// HTML
<wm-button 
  class="btn-primary custom-button" 
  width="100" 
  height="50"
  backgroundcolor="#007bff">
</wm-button>

// Transpiled JSX
<WmButton
  classname="btn-primary custom-button"
  styles={{
    root: [
      this.theme.WmButton?.root,
      this.theme['btn-primary'],
      this.theme['custom-button'],
      { width: 100, height: 50, backgroundColor: '#007bff' }
    ]
  }}
/>
```

## Agent Capabilities

### 1. Locate Transformer

**Query**: "Where is the Button transformer?"

**Response**:
```markdown
The Button transformer is located at:
`wavemaker-rn-codegen/src/transpile/components/button.transpiler.ts`

It handles the transformation of `<wm-button>` HTML elements to 
`<WmButton>` React Native components.
```

### 2. Explain Transformation

**Query**: "How does the List widget transformation work?"

**Response**:
```markdown
# List Widget Transformation

The List transformer (`list.transpiler.ts`) performs these steps:

## 1. Pre-processing
- Extracts `dataset` binding
- Identifies template content
- Processes list item template

## 2. Template Transformation
```typescript
// HTML
<wm-list dataset="bind:Variables.users.dataSet">
  <wm-list-template>
    <wm-label caption="bind:item.name"></wm-label>
  </wm-list-template>
</wm-list>

// Becomes
<WmList dataset={this.Variables.users.dataSet}>
  {(item, index) => (
    <WmLabel caption={item.name} />
  )}
</WmList>
```

## 3. Key Transformations
1. `dataset.bind` → `dataset` prop with evaluated expression
2. Template content → render function with `(item, index)` params
3. `item.field` bindings → direct item property access

## 4. Import Generation
Adds: `import { WmList } from '@wavemaker/app-rn-runtime/components/data/list'`
```

### 3. Debug Transformation

**Query**: "My button's onClick isn't working after transpilation"

**Response**:
```markdown
# Debugging Button onClick Transformation

## Common Issues

### Issue 1: Event Property Name
In Studio, you use `on-click`, but it transpiles to `onPress` in React Native.

**Check the transpiled code**:
```javascript
// ❌ Wrong (not supported in RN)
<WmButton onClick={() => {...}} />

// ✅ Correct
<WmButton onPress={() => {...}} />
```

### Issue 2: Expression Syntax
Ensure your expression is valid JavaScript after transformation.

**Studio**:
```xml
<wm-button on-click="Variables.counter.increment()">
```

**Transpiled**:
```jsx
<WmButton onPress={() => { this.Variables.counter.increment(); }} />
```

### Issue 3: Scope Issues
Variables must be accessed via `this.`:

**❌ Wrong**:
```javascript
onPress={() => { Variables.counter.increment(); }}
```

**✅ Correct**:
```javascript
onPress={() => { this.Variables.counter.increment(); }}
```

## Debug Steps

1. **Check transpiled file**: Look at `src/pages/YourPage/YourPage.component.js`
2. **Verify event handler**: Search for `onPress=`
3. **Check console**: Look for runtime errors
4. **Add logging**:
```javascript
onPress={() => {
  console.log('Button clicked');
  this.Variables.counter.increment();
}}
```
```

### 4. Show Examples

**Query**: "Show me transformation examples for Form widget"

**Response**:
```markdown
# Form Widget Transformation Examples

## Example 1: Basic Form

**HTML**:
```xml
<wm-form name="employeeForm">
  <wm-text name="firstName" placeholder="First Name"></wm-text>
  <wm-text name="lastName" placeholder="Last Name"></wm-text>
  <wm-button caption="Submit" on-click="submitForm()"></wm-button>
</wm-form>
```

**Transpiled JSX**:
```jsx
<WmForm name="employeeForm">
  <WmText name="firstName" placeholder="First Name" />
  <WmText name="lastName" placeholder="Last Name" />
  <WmButton caption="Submit" onPress={() => { this.submitForm(); }} />
</WmForm>
```

## Example 2: Form with Data Binding

**HTML**:
```xml
<wm-liveform dataset="bind:Variables.employeeLiveVariable.dataSet">
  <wm-text name="firstName" 
           datavalue="bind:Variables.employeeLiveVariable.dataSet.firstName">
  </wm-text>
  <wm-button caption="Save" on-click="Variables.employeeLiveVariable.save()">
  </wm-button>
</wm-liveform>
```

**Transpiled JSX**:
```jsx
<WmLiveform dataset={this.Variables.employeeLiveVariable.dataSet}>
  <WmText 
    name="firstName"
    datavalue={this.Variables.employeeLiveVariable.dataSet.firstName}
    onChange={(value) => {
      this.Variables.employeeLiveVariable.dataSet.firstName = value;
    }}
  />
  <WmButton 
    caption="Save"
    onPress={() => { this.Variables.employeeLiveVariable.save(); }}
  />
</WmLiveform>
```

[... more examples]
```

## Advanced Topics

### Custom Transformers

Creating a custom transformer for a new widget:

```typescript
// custom-widget.transpiler.ts
import { Transformer, TranspilationContext, Import } from '../transpile';
import { HTMLElement } from 'node-html-parser';
import { transformEx } from './bind.ex.transformer';

const customWidgetTranspiler: Transformer = {
  pre(element: HTMLElement, context: TranspilationContext): string {
    const attrs = element.attributes;
    const props = [];
    
    // Extract and transform properties
    Object.keys(attrs).forEach(key => {
      if (key.endsWith('.bind')) {
        const propName = key.replace('.bind', '');
        const expr = transformEx(attrs[key], 'fragment', 'attr');
        props.push(`${propName}={${expr}}`);
      } else if (key.startsWith('on-')) {
        const eventName = key.replace('on-', 'on').replace(/-([a-z])/g, 
          (g) => g[1].toUpperCase());
        const handler = transformEx(attrs[key], 'fragment', 'event');
        props.push(`${eventName}={() => {${handler}}}`);
      } else {
        props.push(`${key}="${attrs[key]}"`);
      }
    });
    
    // Handle styles
    const styles = this.extractStyles(element, context);
    if (styles) props.push(`styles={${styles}}`);
    
    return `<WmCustomWidget ${props.join(' ')}>`;
  },
  
  post(element: HTMLElement, context: TranspilationContext): string {
    return `</WmCustomWidget>`;
  },
  
  imports(element: HTMLElement, context: TranspilationContext): Import[] {
    return [{
      name: 'WmCustomWidget',
      from: '@wavemaker/app-rn-runtime/components/custom/custom-widget'
    }];
  }
};

export default customWidgetTranspiler;
```

### Transformer Registration

```typescript
// In transpile.ts
private initTransformers() {
  this.transformers.set('wm-custom-widget', customWidgetTranspiler);
}
```

## Query Examples

The Transformer Agent can handle queries like:

1. **Location Queries**
   - "Where is the X transformer?"
   - "Find the transformer for wm-list"
   - "Show me all container widget transformers"

2. **Explanation Queries**
   - "How does wm-button transformation work?"
   - "Explain the List widget transpilation"
   - "What happens during form transformation?"

3. **Comparison Queries**
   - "Difference between wm-list and wm-livelist transformation"
   - "Compare wm-text and wm-textarea transformers"

4. **Debugging Queries**
   - "Why is my bind expression not working?"
   - "My onClick handler isn't transpiling correctly"
   - "Debug transformation of wm-form"

5. **Example Queries**
   - "Show examples of wm-list transformation"
   - "Examples of bind expressions in wm-label"
   - "Form transformation examples"

6. **Custom Development Queries**
   - "How to create a custom transformer?"
   - "Guide on widget transpilation"
   - "Add a new widget transformer"

## Best Practices

### For Agent Usage

1. **Be Specific**: Mention the exact widget name
2. **Provide Context**: Include the HTML markup when debugging
3. **Show Expected Output**: Describe what you expect to see
4. **Include Errors**: Share any transpilation errors

### For Transformer Development

1. **Follow Pattern**: Use the standard transformer structure
2. **Handle All Properties**: Check all possible attributes
3. **Transform Expressions**: Use transformEx() for bindings
4. **Generate Imports**: Always return required imports
5. **Style Processing**: Use extractStyles() for style handling
6. **Error Handling**: Handle malformed markup gracefully

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Widget Transformation & Transpilation

