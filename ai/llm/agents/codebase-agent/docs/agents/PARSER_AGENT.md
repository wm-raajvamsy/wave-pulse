# Parser Agent - Detailed Documentation

## Overview

The **Parser Agent** is the expert on parsing HTML, CSS, JavaScript, and expressions in WaveMaker React Native. It understands how different file formats are parsed and transformed.

## Domain Expertise

### Core Responsibilities

1. **HTML Parsing**
   - Parse HTML markup using node-html-parser
   - DOM tree traversal
   - Element manipulation

2. **CSS Parsing**
   - CSS/LESS parsing using css-tree
   - Property extraction
   - Selector parsing

3. **JavaScript Parsing**
   - AST parsing using Babel
   - Code transformation
   - Expression evaluation

4. **Expression Parsing**
   - Bind expression parsing
   - Property expression parsing
   - Custom expression evaluation

## HTML Parsing

### Parser Implementation

**Library**: `node-html-parser`

```typescript
import { parse, HTMLElement, NodeType } from 'node-html-parser';

// Parse HTML string
const root: HTMLElement = parse(`
  <wm-page>
    <wm-container>
      <wm-button caption="Click me"></wm-button>
    </wm-container>
  </wm-page>
`);

// Traverse tree
function traverseHTML(element: HTMLElement, callback: (el: HTMLElement) => void) {
  callback(element);
  
  element.childNodes.forEach(child => {
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      traverseHTML(child as HTMLElement, callback);
    }
  });
}

// Access element properties
console.log(root.tagName);           // 'wm-page'
console.log(root.attributes);        // { ... }
console.log(root.childNodes);        // [ ... ]
console.log(root.textContent);       // Text content
```

### HTML Element API

```typescript
interface HTMLElement {
  // Properties
  tagName: string;                     // Element tag name
  attributes: Record<string, string>;  // Element attributes
  childNodes: Node[];                  // Child nodes
  parentNode: Node | null;             // Parent node
  textContent: string;                 // Text content
  
  // Methods
  getAttribute(name: string): string | undefined;
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
  
  querySelector(selector: string): HTMLElement | null;
  querySelectorAll(selector: string): HTMLElement[];
  
  appendChild(child: Node): void;
  removeChild(child: Node): void;
  insertBefore(newNode: Node, referenceNode: Node): void;
  
  // Properties
  get firstChild(): Node | null;
  get lastChild(): Node | null;
  get nextSibling(): Node | null;
  get previousSibling(): Node | null;
}
```

### Usage in Transpilation

**Location**: `wavemaker-rn-codegen/src/transpile/transpile.ts`

```typescript
export function transpileMarkup(markup: string, rnConfig: any): TranspiledOutput {
  // 1. Parse HTML
  const root = parse(markup);
  
  // 2. Pre-process (transform bind expressions)
  preTranspile(root, rnConfig);
  
  // 3. Transpile tree
  const result = transpileTree(root, context);
  
  return result;
}

function preTranspile(element: HTMLElement, rnConfig: any): void {
  // Transform bind: attributes
  Object.keys(element.attributes).forEach(name => {
    let value = element.attributes[name];
    
    if (value.startsWith('bind:')) {
      // Transform bind expression
      value = value.substring(5);
      element.setAttribute(name, 'bind:' + transformEx(value, 'fragment', 'attr'));
    }
  });
  
  // Recursively process children
  element.childNodes.forEach(child => {
    if (child.nodeType === NodeType.ELEMENT_NODE) {
      preTranspile(child as HTMLElement, rnConfig);
    }
  });
}
```

## CSS Parsing

### CSS Tree Parser

**Library**: `css-tree`

```typescript
import * as cssTree from 'css-tree';

// Parse CSS
const ast = cssTree.parse(`
  .button {
    background-color: #007bff;
    padding: 10px 20px;
    border-radius: 4px;
  }
  
  .button:hover {
    background-color: #0056b3;
  }
`);

// Walk AST
cssTree.walk(ast, {
  visit: 'Rule',
  enter(node) {
    // Process each rule
    console.log('Selector:', cssTree.generate(node.prelude));
    
    cssTree.walk(node.block, {
      visit: 'Declaration',
      enter(declaration) {
        console.log('Property:', declaration.property);
        console.log('Value:', cssTree.generate(declaration.value));
      }
    });
  }
});
```

### LESS Compiler

**Library**: `less`

```typescript
import less from 'less';

const lessInput = `
  @primary-color: #007bff;
  @border-radius: 4px;
  
  .button {
    background-color: @primary-color;
    border-radius: @border-radius;
    
    &:hover {
      background-color: darken(@primary-color, 10%);
    }
  }
`;

// Compile LESS to CSS
const output = await less.render(lessInput);
console.log(output.css);
```

### CSS to RN Transformation

**Location**: `wavemaker-rn-codegen/src/theme/rn-stylesheet.transpiler.ts`

```typescript
class RNStylesheetTranspiler {
  transform(cssAST: any): any {
    const styles: any = {};
    
    cssTree.walk(cssAST, {
      visit: 'Rule',
      enter: (node) => {
        // Parse selector
        const selector = this.parseSelector(node.prelude);
        
        // Parse declarations
        const styleObject = {};
        
        cssTree.walk(node.block, {
          visit: 'Declaration',
          enter: (declaration) => {
            // Transform property
            const [propName, propValue] = this.transformProperty(
              declaration.property,
              cssTree.generate(declaration.value)
            );
            
            styleObject[propName] = propValue;
          }
        });
        
        // Store style
        styles[selector] = styleObject;
      }
    });
    
    return styles;
  }
  
  private transformProperty(cssProperty: string, cssValue: string): [string, any] {
    // Property name: background-color → backgroundColor
    const rnProperty = cssProperty.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    
    // Value transformation
    let rnValue: any = cssValue;
    
    // Remove 'px' suffix
    if (cssValue.endsWith('px')) {
      rnValue = parseFloat(cssValue);
    }
    
    // Handle colors
    if (this.isColor(cssValue)) {
      rnValue = cssValue;
    }
    
    return [rnProperty, rnValue];
  }
}
```

## JavaScript Parsing

### Babel Parser

**Library**: `@babel/parser` and `@babel/traverse`

```typescript
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

// Parse JavaScript
const code = `
  function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
  }
`;

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx', 'typescript']
});

// Traverse AST
traverse(ast, {
  FunctionDeclaration(path) {
    console.log('Function:', path.node.id.name);
    console.log('Params:', path.node.params.map(p => p.name));
  },
  
  CallExpression(path) {
    if (path.node.callee.property?.name === 'reduce') {
      console.log('Found reduce call');
    }
  }
});

// Generate code
const output = generate(ast);
console.log(output.code);
```

### AST Transformation

**Location**: `wavemaker-rn-mcp/src/utils/ast-parser.ts`

```typescript
export class ASTParser {
  parseFile(filePath: string): any {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    return parser.parse(content, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  }
  
  extractClass(ast: any): ClassInfo | null {
    let classInfo: ClassInfo | null = null;
    
    traverse(ast, {
      ClassDeclaration(path) {
        classInfo = {
          name: path.node.id.name,
          methods: [],
          properties: [],
          extends: path.node.superClass?.name
        };
        
        // Extract methods
        path.node.body.body.forEach(member => {
          if (member.type === 'ClassMethod') {
            classInfo.methods.push({
              name: member.key.name,
              params: member.params.map(p => p.name),
              isAsync: member.async,
              lineNumber: member.loc?.start.line
            });
          } else if (member.type === 'ClassProperty') {
            classInfo.properties.push({
              name: member.key.name,
              type: member.typeAnnotation?.typeAnnotation?.type
            });
          }
        });
      }
    });
    
    return classInfo;
  }
}
```

## Expression Parsing

### Bind Expression Parser

**Location**: `wavemaker-rn-codegen/src/transpile/bind.ex.transformer.ts`

```typescript
export default function transformEx(
  expression: string,
  context: FORMAT_CONTEXT,
  type: string
): string {
  if (!expression) return expression;
  
  // 1. Identify expression parts
  const parts = parseExpression(expression);
  
  // 2. Transform each part
  const transformed = parts.map(part => {
    if (part.type === 'variable') {
      return `this.${part.value}`;
    } else if (part.type === 'method') {
      return `this.${part.value}`;
    } else if (part.type === 'literal') {
      return part.value;
    }
    return part.value;
  });
  
  return transformed.join('');
}

function parseExpression(expression: string): ExpressionPart[] {
  const parts: ExpressionPart[] = [];
  
  // Regular expressions for different parts
  const variableRegex = /\b(Variables|Widgets|App)\.[a-zA-Z0-9_.[\]]+/g;
  const methodRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  
  let lastIndex = 0;
  
  // Extract variables
  let match;
  while ((match = variableRegex.exec(expression)) !== null) {
    // Add literal before
    if (match.index > lastIndex) {
      parts.push({
        type: 'literal',
        value: expression.substring(lastIndex, match.index)
      });
    }
    
    // Add variable
    parts.push({
      type: 'variable',
      value: match[0]
    });
    
    lastIndex = variableRegex.lastIndex;
  }
  
  // Add remaining literal
  if (lastIndex < expression.length) {
    parts.push({
      type: 'literal',
      value: expression.substring(lastIndex)
    });
  }
  
  return parts;
}

interface ExpressionPart {
  type: 'variable' | 'method' | 'literal' | 'operator';
  value: string;
}
```

### Property Parser

**Location**: `wavemaker-rn-codegen/src/transpile/property/property-parser.ts`

```typescript
export function parseProperty(
  propName: string,
  propValue: string,
  element: HTMLElement,
  context: TranspilationContext
): ParsedProperty {
  // 1. Check property type
  if (propValue.startsWith('bind:')) {
    // Binding expression
    return {
      name: propName,
      value: transformEx(propValue.substring(5), 'fragment', 'attr'),
      type: 'binding'
    };
  }
  
  // 2. Check if boolean
  if (propValue === 'true' || propValue === 'false') {
    return {
      name: propName,
      value: propValue === 'true',
      type: 'boolean'
    };
  }
  
  // 3. Check if number
  if (!isNaN(Number(propValue))) {
    return {
      name: propName,
      value: Number(propValue),
      type: 'number'
    };
  }
  
  // 4. String literal
  return {
    name: propName,
    value: propValue,
    type: 'string'
  };
}

interface ParsedProperty {
  name: string;
  value: any;
  type: 'binding' | 'boolean' | 'number' | 'string' | 'object';
}
```

## Common Parsing Patterns

### Pattern 1: HTML to JSX

```typescript
// HTML
<wm-container class="main-container">
  <wm-label caption="Hello World"></wm-label>
</wm-container>

// Parse and transform
const root = parse(html);
const jsx = transformToJSX(root);

// JSX
<WmContainer classname="main-container">
  <WmLabel caption="Hello World" />
</WmContainer>
```

### Pattern 2: CSS to RN Styles

```typescript
// CSS
.button {
  background-color: #007bff;
  border-radius: 4px;
  padding: 10px 20px;
}

// Parse and transform
const ast = cssTree.parse(css);
const rnStyles = transformToRN(ast);

// RN Styles
{
  button: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    padding: [10, 20]
  }
}
```

### Pattern 3: Expression Evaluation

```typescript
// Studio expression
'Variables.user.dataSet.firstName + " " + Variables.user.dataSet.lastName'

// Parse and transform
const transformed = transformEx(expression, 'page', 'attr');

// React expression
'this.Variables.user.dataSet.firstName + " " + this.Variables.user.dataSet.lastName'
```

## Agent Capabilities

### 1. Explain Parsing

**Query**: "How is HTML parsed?"

**Response**: Complete explanation of HTML parsing using node-html-parser

### 2. Debug Parsing

**Query**: "Why is my bind expression not working?"

**Response**: Expression parsing explanation with examples

### 3. Custom Parsing

**Query**: "How to parse custom properties?"

**Response**: Guide on creating custom property parsers

## Best Practices

### Parsing

1. **Error Handling**: Handle malformed input gracefully
2. **Performance**: Cache parsed ASTs when possible
3. **Validation**: Validate input before parsing
4. **Memory**: Clean up large ASTs after use

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: HTML/CSS/JS Parsing & AST Manipulation

