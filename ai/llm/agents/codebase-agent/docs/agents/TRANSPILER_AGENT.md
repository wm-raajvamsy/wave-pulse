# Transpiler Agent - Detailed Documentation

## Overview

The **Transpiler Agent** is the expert on the core transpilation engine in WaveMaker React Native. While the Transformer Agent focuses on widget-specific transformations, the Transpiler Agent understands the underlying transpilation infrastructure, markup parsing, and the complete transformation pipeline.

## Domain Expertise

### Core Responsibilities

1. **Transpilation Engine**
   - Core transpiler implementation
   - Tree traversal algorithms
   - Element processing pipeline
   - Context management

2. **Markup Processing**
   - HTML parsing using node-html-parser
   - Pre-transpilation transformations
   - Expression transformation
   - Attribute processing

3. **Output Generation**
   - JSX generation
   - Import management
   - Dependency tracking
   - Code formatting

4. **Transpilation Context**
   - Context propagation
   - Scope management
   - Data passing
   - State tracking

## Transpilation Architecture

### Core Transpiler

**Location**: `wavemaker-rn-codegen/src/transpile/transpile.ts`

```typescript
export class Transpiler {
  private transformers = new Map<string, Transformer>();
  private componentNamesList: string[] = [];
  
  /**
   * Main transpilation entry point
   */
  public transpile(
    markup: string,
    rnConfig: any
  ): TranspiledOutput {
    // 1. Parse HTML to DOM tree
    const root = parse(markup);
    
    // 2. Pre-transpile (transform bind expressions, events)
    this.preTranspile(root, rnConfig);
    
    // 3. Create transpilation context
    const context = this.createContext(rnConfig);
    
    // 4. Transpile DOM tree to JSX
    const result = this.transpileTree(root, context);
    
    // 5. Post-process output
    this.postProcess(result);
    
    return result;
  }
  
  /**
   * Pre-transpilation: Transform bind expressions and events
   */
  public preTranspile(element: HTMLElement, rnConfig: any): void {
    // Process attributes
    Object.keys(element.attributes).forEach(name => {
      let value: string = element.attributes[name];
      
      // 1. Transform bind: prefix
      if (value.startsWith('bind:')) {
        value = value.substring(5);
        element.setAttribute(
          name,
          'bind:' + transformEx(value, 'fragment', 'attr')
        );
      }
      
      // 2. Transform event handlers
      else if (name.startsWith('on-')) {
        // Convert on-click to onPress, on-tap to onPress, etc.
        if (name === 'on-tap') {
          const existingClick = element.getAttribute('on-click') || '';
          value = existingClick + ';' + value;
          element.removeAttribute('on-click');
        }
        
        element.setAttribute(
          name,
          transformEx(value, 'fragment', 'event')
        );
      }
      
      // 3. Transform groupby (for list grouping)
      else if (name === 'groupby' && value.includes('(')) {
        element.setAttribute(
          name,
          transformEx(value, 'fragment', 'event')
        );
      }
    });
    
    // Recursively process children
    element.childNodes.forEach(child => {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        this.preTranspile(child as HTMLElement, rnConfig);
      }
    });
  }
  
  /**
   * Transpile DOM tree recursively
   */
  private transpileTree(
    element: HTMLElement,
    context: TranspilationContext
  ): string {
    const tagName = element.tagName.toLowerCase();
    
    // Get transformer for this element
    const transformer = this.getTransformer(tagName);
    
    if (!transformer) {
      throw new Error(`No transformer found for tag: ${tagName}`);
    }
    
    // 1. Execute pre() - generates opening tag
    let markup = transformer.pre(element, context);
    
    // 2. Process children
    element.childNodes.forEach(child => {
      if (child.nodeType === NodeType.ELEMENT_NODE) {
        markup += this.transpileTree(child as HTMLElement, context);
      } else if (child.nodeType === NodeType.TEXT_NODE) {
        markup += this.transpileText(child.text, context);
      }
    });
    
    // 3. Execute post() - generates closing tag
    markup += transformer.post(element, context);
    
    // 4. Collect imports
    const imports = transformer.imports(element, context);
    context.result.imports.push(...imports);
    
    // 5. Collect dependencies (partials, prefabs)
    if (transformer.partials) {
      const partials = transformer.partials(element, context);
      context.result.partials.push(...partials);
    }
    
    if (transformer.prefabs) {
      const prefabs = transformer.prefabs(element, context);
      context.result.prefabs.push(...prefabs);
    }
    
    return markup;
  }
  
  /**
   * Transpile text nodes
   */
  private transpileText(text: string, context: TranspilationContext): string {
    // Handle empty text
    if (!text || text.trim() === '') {
      return '';
    }
    
    // Check for bind expressions in text
    if (text.includes('bind:')) {
      return this.transpileTextWithBindings(text, context);
    }
    
    // Plain text
    return text;
  }
  
  /**
   * Register transformer for a tag
   */
  public registerTransformer(tagName: string, transformer: Transformer): void {
    this.transformers.set(tagName.toLowerCase(), transformer);
  }
  
  /**
   * Get transformer for a tag
   */
  private getTransformer(tagName: string): Transformer | null {
    return this.transformers.get(tagName) || null;
  }
}
```

### Transpilation Context

```typescript
export class TranspilationContext {
  result: TranspiledOutput;
  transformer: Transformer;
  isPartOfPrefab: boolean;
  listener?: string;
  props: string[];
  data: any;
  rnConfig: any;
  
  constructor(args: {
    result: TranspiledOutput;
    transformer: Transformer;
    isPartOfPrefab: boolean;
    listener?: string;
    props: string[];
    data?: any;
    rnConfig: any;
  }) {
    this.result = args.result;
    this.transformer = args.transformer;
    this.isPartOfPrefab = args.isPartOfPrefab;
    this.listener = args.listener;
    this.props = args.props;
    this.data = assign({}, args.data);
    this.rnConfig = args.rnConfig;
  }
  
  /**
   * Get context data
   */
  get(key: string): any {
    return this.data && this.data[key];
  }
  
  /**
   * Set context data
   */
  set(key: string, value: any): void {
    this.data[key] = value;
  }
}
```

### Transpiled Output

```typescript
export interface TranspiledOutput {
  markup: string;              // Generated JSX
  components: any;             // Component metadata
  partials: string[];          // Required partials
  prefabs: string[];           // Required prefabs
  xcomponents: string[];       // Custom components
  imports: Import[];           // Import statements
}

export interface Import {
  name: string;                // Import name
  as?: string;                 // Alias
  from: string;                // Module path
  lazy?: boolean;              // Lazy import
}
```

## Transpilation Pipeline

### Complete Flow

```
HTML Markup String
    ↓
┌─────────────────────────────────┐
│  1. Parse HTML                  │
│     - node-html-parser          │
│     - DOM tree creation         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  2. Pre-Transpilation           │
│     - Transform bind:           │
│     - Transform events          │
│     - Transform groupby         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  3. Create Context              │
│     - Initialize result         │
│     - Setup configuration       │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  4. Transpile Tree              │
│     For each element:           │
│     ├─→ Get transformer         │
│     ├─→ Execute pre()           │
│     ├─→ Process children        │
│     ├─→ Execute post()          │
│     ├─→ Collect imports         │
│     └─→ Collect dependencies    │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  5. Post-Processing             │
│     - Deduplicate imports       │
│     - Format output             │
└─────────────────────────────────┘
    ↓
JSX Output + Metadata
```

## Advanced Features

### 1. Conditional Transpilation

```typescript
// Handle wm-if directive
private handleConditional(
  element: HTMLElement,
  context: TranspilationContext
): string {
  const condition = element.getAttribute('wm-if');
  
  if (condition) {
    const transformedCondition = transformEx(condition, 'fragment', 'attr');
    
    return `
      {${transformedCondition} && (
        ${this.transpileChildren(element, context)}
      )}
    `;
  }
  
  return this.transpileChildren(element, context);
}
```

### 2. Loop Transpilation

```typescript
// Handle wm-for directive (list rendering)
private handleLoop(
  element: HTMLElement,
  context: TranspilationContext
): string {
  const dataset = element.getAttribute('dataset');
  
  if (dataset) {
    const transformedDataset = transformEx(dataset, 'fragment', 'attr');
    
    return `
      {${transformedDataset} && ${transformedDataset}.map((item, index) => (
        ${this.transpileChildren(element, context)}
      ))}
    `;
  }
  
  return this.transpileChildren(element, context);
}
```

### 3. Slot Transpilation

```typescript
// Handle content projection
private handleSlot(
  element: HTMLElement,
  context: TranspilationContext
): string {
  const slotName = element.getAttribute('slot');
  
  if (slotName) {
    return `{this.props.${slotName}}`;
  }
  
  return '{this.props.children}';
}
```

### 4. Import Management

```typescript
// Deduplicate and organize imports
private deduplicateImports(imports: Import[]): Import[] {
  const seen = new Map<string, Import>();
  
  imports.forEach(imp => {
    const key = `${imp.name}-${imp.from}`;
    if (!seen.has(key)) {
      seen.set(key, imp);
    }
  });
  
  return Array.from(seen.values());
}

// Generate import statements
private generateImports(imports: Import[]): string {
  const deduplicated = this.deduplicateImports(imports);
  
  return deduplicated.map(imp => {
    if (imp.lazy) {
      return `const ${imp.as || imp.name} = React.lazy(() => import('${imp.from}'));`;
    } else if (imp.as) {
      return `import { ${imp.name} as ${imp.as} } from '${imp.from}';`;
    } else {
      return `import { ${imp.name} } from '${imp.from}';`;
    }
  }).join('\n');
}
```

## Special Cases

### 1. Page Scroll Handling

```typescript
private transpileForPageScroll(
  element: HTMLElement,
  content: HTMLElement,
  rnConfig: any
): void {
  const edgeToEdgeConfig = rnConfig?.edgeToEdgeConfig;
  const onScroll = element?.attributes?.onscroll || 
                   edgeToEdgeConfig?.scrollBehaviour || 
                   'none';
  
  if (!element?.attributes?.onscroll) {
    element.setAttribute('onscroll', onScroll);
  }
}
```

### 2. List Template Processing

```typescript
private transpileListTemplate(
  element: HTMLElement,
  context: TranspilationContext
): string {
  // Find wm-list-template child
  const template = element.querySelector('wm-list-template');
  
  if (template) {
    // Create fragment context for list items
    const fragmentContext = {
      ...context,
      data: { ...context.data, inFragment: true }
    };
    
    // Transpile template content
    const templateContent = this.transpileChildren(template, fragmentContext);
    
    return `
      {(item, index) => (
        ${templateContent}
      )}
    `;
  }
  
  return '';
}
```

### 3. Partial/Prefab Processing

```typescript
private transpilePartial(
  element: HTMLElement,
  context: TranspilationContext
): string {
  const partialName = element.getAttribute('name');
  const partialParams = this.extractParams(element);
  
  // Add to dependencies
  context.result.partials.push(partialName);
  
  // Generate partial usage
  return `
    <${partialName}Partial 
      ${this.generateParamProps(partialParams)}
    />
  `;
}
```

## Error Handling

### Transpilation Errors

```typescript
class TranspilationError extends Error {
  constructor(
    message: string,
    public element: HTMLElement,
    public context: TranspilationContext
  ) {
    super(message);
    this.name = 'TranspilationError';
  }
}

// Usage
try {
  const result = this.transpileTree(element, context);
} catch (error) {
  if (error instanceof TranspilationError) {
    console.error(`Transpilation error in ${error.element.tagName}:`, error.message);
    console.error('Element:', error.element.toString());
  }
  throw error;
}
```

## Performance Optimizations

### 1. Transformer Caching

```typescript
private transformerCache = new Map<string, Transformer>();

private getTransformer(tagName: string): Transformer {
  if (this.transformerCache.has(tagName)) {
    return this.transformerCache.get(tagName)!;
  }
  
  const transformer = this.loadTransformer(tagName);
  this.transformerCache.set(tagName, transformer);
  
  return transformer;
}
```

### 2. Expression Compilation Caching

```typescript
private expressionCache = new Map<string, string>();

private transformExpression(expr: string): string {
  if (this.expressionCache.has(expr)) {
    return this.expressionCache.get(expr)!;
  }
  
  const transformed = transformEx(expr, 'fragment', 'attr');
  this.expressionCache.set(expr, transformed);
  
  return transformed;
}
```

### 3. Lazy Element Processing

```typescript
// Only process visible elements
private shouldProcessElement(element: HTMLElement): boolean {
  // Skip hidden elements
  if (element.getAttribute('show') === 'false') {
    return false;
  }
  
  // Skip deferloaded elements in initial render
  if (element.getAttribute('deferload') === 'true') {
    return false;
  }
  
  return true;
}
```

## Testing Transpilation

### Test Structure

```typescript
describe('Transpiler', () => {
  let transpiler: Transpiler;
  
  beforeEach(() => {
    transpiler = new Transpiler();
    transpiler.registerAllTransformers();
  });
  
  it('should transpile simple markup', () => {
    const markup = '<wm-label caption="Hello"></wm-label>';
    const result = transpiler.transpile(markup, {});
    
    expect(result.markup).toContain('<WmLabel');
    expect(result.markup).toContain('caption="Hello"');
  });
  
  it('should handle bind expressions', () => {
    const markup = '<wm-label caption="bind:Variables.name"></wm-label>';
    const result = transpiler.transpile(markup, {});
    
    expect(result.markup).toContain('caption={this.Variables.name}');
  });
  
  it('should collect imports', () => {
    const markup = '<wm-button caption="Click"></wm-button>';
    const result = transpiler.transpile(markup, {});
    
    expect(result.imports).toContainEqual({
      name: 'WmButton',
      from: '@wavemaker/app-rn-runtime/components/basic/button'
    });
  });
});
```

## Agent Capabilities

### 1. Explain Transpilation

**Query**: "How does the transpilation engine work?"

**Response**: Complete explanation of the transpilation pipeline

### 2. Debug Transpilation

**Query**: "Why is my markup not transpiling correctly?"

**Response**: Diagnostic steps for transpilation issues

### 3. Optimize Transpilation

**Query**: "How to improve transpilation performance?"

**Response**: Performance optimization techniques

### 4. Custom Transpilation

**Query**: "How to add custom transpilation logic?"

**Response**: Guide on extending the transpiler

## Best Practices

### Transpiler Development

1. **Error Handling**: Handle all edge cases gracefully
2. **Context Management**: Pass context correctly through tree
3. **Performance**: Cache transformers and expressions
4. **Testing**: Write comprehensive tests
5. **Documentation**: Document custom transformations

### Transpilation Usage

1. **Validation**: Validate input markup
2. **Configuration**: Use appropriate RN config
3. **Debugging**: Enable debug logging when needed
4. **Optimization**: Use incremental transpilation for large projects

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Core Transpilation Engine & Markup Processing

