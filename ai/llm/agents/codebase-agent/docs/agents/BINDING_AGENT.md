# Binding Agent - Detailed Documentation

## Overview

The **Binding Agent** is the expert on data binding and the watch system in WaveMaker React Native. It understands how bind expressions work, how data flows between components and variables, and how change detection operates.

## Domain Expertise

### Core Responsibilities

1. **Data Binding System**
   - One-way binding (display)
   - Two-way binding (input)
   - Binding evaluation
   - Binding context

2. **Watch System**
   - Watch expressions
   - Change detection
   - Watch optimization
   - Watch cleanup

3. **Bind Expression Transformation**
   - Expression parsing
   - Expression transformation
   - Context resolution

4. **Performance Optimization**
   - Efficient change detection
   - Debouncing
   - Batch updates

## Binding System Architecture

### Binding Types

```typescript
// 1. One-Way Binding (Display)
// Data flows: Variable → Widget
<WmLabel caption="bind:Variables.userName.dataSet.name" />
// Transpiles to:
<WmLabel caption={this.Variables.userName.dataSet.name} />

// 2. Two-Way Binding (Input)
// Data flows: Variable ← → Widget
<WmText datavalue="bind:Variables.formData.dataSet.email" />
// Transpiles to:
<WmText 
  datavalue={this.Variables.formData.dataSet.email}
  onChange={(value) => {
    this.Variables.formData.setValue('email', value);
  }}
/>

// 3. Expression Binding
<WmLabel caption="bind:Variables.user.dataSet.firstName + ' ' + Variables.user.dataSet.lastName" />
// Transpiles to:
<WmLabel caption={this.Variables.user.dataSet.firstName + ' ' + this.Variables.user.dataSet.lastName} />

// 4. Conditional Binding
<WmContainer show="bind:Variables.isLoggedIn.dataSet && Variables.user.dataSet !== null" />
// Transpiles to:
<WmContainer show={this.Variables.isLoggedIn.dataSet && this.Variables.user.dataSet !== null} />
```

### Binding Context

```typescript
// Binding context determines scope
enum BindingContext {
  PAGE = 'page',       // Page-level bindings
  PARTIAL = 'partial', // Partial-level bindings
  PREFAB = 'prefab',   // Prefab-level bindings
  FRAGMENT = 'fragment' // Template fragment (e.g., list items)
}

// In list templates:
<WmList dataset="bind:Variables.users.dataSet">
  {(item, index) => (
    // 'item' is in fragment context
    <WmLabel caption="bind:item.name" />
    // Transpiles to:
    <WmLabel caption={item.name} />
  )}
</WmList>
```

## Watch System

### Watcher Implementation

**Location**: `wavemaker-rn-runtime/src/runtime/watcher.ts`

```typescript
export class Watcher {
  private watchers = new Map<string, WatchExpression>();
  private context: any;
  
  constructor(context: any) {
    this.context = context;
  }
  
  /**
   * Watch an expression
   */
  watch(
    expression: string,
    callback: (newValue: any, oldValue: any) => void,
    options?: WatchOptions
  ): () => void {
    const watchId = generateUniqueId();
    
    // Parse expression
    const getter = this.compileGetter(expression);
    
    // Get initial value
    let oldValue = getter(this.context);
    
    // Create check function
    const check = () => {
      const newValue = getter(this.context);
      
      if (!this.isEqual(newValue, oldValue, options?.deep)) {
        callback(newValue, oldValue);
        oldValue = newValue;
      }
    };
    
    // Store watcher
    this.watchers.set(watchId, {
      expression,
      getter,
      check,
      callback
    });
    
    // Return unwatch function
    return () => {
      this.watchers.delete(watchId);
    };
  }
  
  /**
   * Trigger change detection
   */
  digest(): void {
    this.watchers.forEach(watcher => {
      watcher.check();
    });
  }
  
  /**
   * Compile getter function from expression
   */
  private compileGetter(expression: string): (context: any) => any {
    try {
      // Create getter function
      return new Function('context', `
        with (context) {
          try {
            return ${expression};
          } catch (e) {
            return undefined;
          }
        }
      `);
    } catch (error) {
      console.error('Failed to compile watch expression:', expression);
      return () => undefined;
    }
  }
  
  /**
   * Check equality
   */
  private isEqual(a: any, b: any, deep: boolean = false): boolean {
    if (!deep) {
      return a === b;
    }
    
    // Deep equality check
    return JSON.stringify(a) === JSON.stringify(b);
  }
  
  /**
   * Destroy all watchers
   */
  destroy(): void {
    this.watchers.clear();
  }
}

interface WatchExpression {
  expression: string;
  getter: (context: any) => any;
  check: () => void;
  callback: (newValue: any, oldValue: any) => void;
}

interface WatchOptions {
  deep?: boolean;      // Deep comparison
  immediate?: boolean; // Call immediately
}
```

### Usage in Components

```typescript
class MyPage extends BasePage<Props, State> {
  private watcher: Watcher;
  
  protected init(): void {
    super.init();
    
    // Create watcher
    this.watcher = new Watcher(this);
    
    // Watch variable
    const unwatch1 = this.watcher.watch(
      'Variables.userData.dataSet.name',
      (newValue, oldValue) => {
        console.log('Name changed:', oldValue, '→', newValue);
        this.updateGreeting(newValue);
      }
    );
    
    // Watch expression
    const unwatch2 = this.watcher.watch(
      'Variables.cart.dataSet.items.length',
      (newValue, oldValue) => {
        console.log('Cart items:', newValue);
        this.updateCartBadge(newValue);
      }
    );
    
    // Deep watch
    const unwatch3 = this.watcher.watch(
      'Variables.formData.dataSet',
      (newValue, oldValue) => {
        console.log('Form data changed');
        this.validateForm();
      },
      { deep: true }
    );
    
    // Register cleanup
    this.cleanup.push(unwatch1, unwatch2, unwatch3);
    
    // Trigger digest on updates
    this.subscribeToVariableChanges();
  }
  
  private subscribeToVariableChanges(): void {
    // Subscribe to variable updates
    this.Variables.userData.subscribe('success', () => {
      this.watcher.digest();
    });
  }
  
  protected destroy(): void {
    this.watcher.destroy();
    super.destroy();
  }
}
```

## Bind Expression Transformation

### Transformation Rules

**Location**: `wavemaker-rn-codegen/src/transpile/bind.ex.transformer.ts`

```typescript
// Studio Expression → React Expression

// 1. Variable access
'Variables.userName'
→ 'this.Variables.userName'

// 2. Widget access
'Widgets.button1.caption'
→ 'this.Widgets.button1.caption'

// 3. Page method
'submitForm()'
→ 'this.submitForm()'

// 4. App variables
'App.activeUser'
→ 'this.App.activeUser'

// 5. Item in list (fragment context)
'item.name'
→ 'item.name' (no transformation)

// 6. Complex expressions
'Variables.users.dataSet.filter(u => u.active).length'
→ 'this.Variables.users.dataSet.filter(u => u.active).length'
```

### Expression Evaluation

```typescript
export default function transformEx(
  expression: string,
  context: 'page' | 'partial' | 'prefab' | 'fragment',
  type: 'attr' | 'event' | 'text'
): string {
  // 1. Handle empty
  if (!expression || expression.trim() === '') {
    return expression;
  }
  
  // 2. Fragment context (list items) - no transformation
  if (context === 'fragment' && !expression.includes('Variables') && !expression.includes('Widgets')) {
    return expression;
  }
  
  // 3. Transform variable access
  expression = expression.replace(/\bVariables\./g, 'this.Variables.');
  
  // 4. Transform widget access
  expression = expression.replace(/\bWidgets\./g, 'this.Widgets.');
  
  // 5. Transform app access
  expression = expression.replace(/\bApp\./g, 'this.App.');
  
  // 6. Transform method calls
  expression = transformMethodCalls(expression);
  
  return expression;
}
```

## Data Flow

### Variable → Widget (One-Way)

```
Variable Update
    ↓
Variable.dataSet changes
    ↓
React re-render triggered
    ↓
Widget receives new props
    ↓
Widget displays new value
```

### Widget → Variable (Two-Way)

```
User Input
    ↓
Widget onChange event
    ↓
Variable.setValue() called
    ↓
Variable.dataSet updated
    ↓
Watchers notified (if any)
    ↓
Dependent widgets re-render
```

### Complete Two-Way Flow

```
[Variable] ←→ [Widget]
     ↕
[Watchers]
     ↕
[Other Widgets]
```

## Performance Optimization

### 1. Debounced Bindings

```typescript
// For search/filter inputs
class SearchWidget extends BaseComponent<...> {
  private debouncedUpdate = debounce((value: string) => {
    // Update variable
    this.Variables.searchQuery.setData(value);
    
    // Trigger search
    this.Variables.searchResults.invoke();
    
    // Trigger digest
    this.watcher.digest();
  }, 300);
  
  private handleChange(value: string): void {
    // Update UI immediately
    this.updateState({ inputValue: value });
    
    // Debounced variable update
    this.debouncedUpdate(value);
  }
}
```

### 2. Selective Watching

```typescript
// ❌ Bad: Watch entire object (deep)
this.watcher.watch(
  'Variables.largeDataset.dataSet',
  (newValue) => { /* ... */ },
  { deep: true } // Expensive!
);

// ✅ Good: Watch specific property
this.watcher.watch(
  'Variables.largeDataset.dataSet.status',
  (newValue) => { /* ... */ }
);
```

### 3. Batch Updates

```typescript
// ❌ Bad: Multiple individual updates
this.Variables.formData.setValue('firstName', 'John');
this.watcher.digest(); // Triggers re-render

this.Variables.formData.setValue('lastName', 'Doe');
this.watcher.digest(); // Triggers re-render again

// ✅ Good: Batch update
this.Variables.formData.setData({
  ...this.Variables.formData.dataSet,
  firstName: 'John',
  lastName: 'Doe'
});
this.watcher.digest(); // Single re-render
```

### 4. Unwatch on Unmount

```typescript
class MyWidget extends BaseComponent<...> {
  protected init(): void {
    super.init();
    
    // Create watches
    const unwatch1 = this.watcher.watch('...', () => {});
    const unwatch2 = this.watcher.watch('...', () => {});
    
    // IMPORTANT: Register cleanup
    this.cleanup.push(unwatch1, unwatch2);
  }
  
  // Cleanup happens automatically in destroy()
}
```

## Common Patterns

### Pattern 1: Computed Properties

```typescript
class MyPage extends BasePage<...> {
  protected init(): void {
    super.init();
    
    // Watch dependencies
    this.watcher.watch(
      'Variables.user.dataSet.firstName',
      () => this.updateFullName()
    );
    
    this.watcher.watch(
      'Variables.user.dataSet.lastName',
      () => this.updateFullName()
    );
  }
  
  private updateFullName(): void {
    const { firstName, lastName } = this.Variables.user.dataSet;
    this.Variables.fullName.setData(`${firstName} ${lastName}`);
  }
}
```

### Pattern 2: Validation

```typescript
class FormPage extends BasePage<...> {
  protected init(): void {
    super.init();
    
    // Watch form fields
    this.watcher.watch(
      'Variables.formData.dataSet',
      (newValue) => {
        const errors = this.validateForm(newValue);
        this.updateState({ errors });
      },
      { deep: true }
    );
  }
  
  private validateForm(formData: any): any {
    const errors: any = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    return errors;
  }
}
```

### Pattern 3: Derived Data

```typescript
class DashboardPage extends BasePage<...> {
  protected init(): void {
    super.init();
    
    // Watch data source
    this.watcher.watch(
      'Variables.salesData.dataSet',
      (data) => {
        // Calculate derived metrics
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        const average = total / data.length;
        
        this.updateState({ total, average });
      }
    );
  }
}
```

## Debugging Bindings

### Debug Tools

```typescript
// 1. Log binding evaluation
console.log('Binding value:', this.Variables.userName.dataSet.name);

// 2. Watch binding changes
this.watcher.watch(
  'Variables.userName.dataSet.name',
  (newValue, oldValue) => {
    console.log('Name changed:', oldValue, '→', newValue);
  }
);

// 3. Check watcher count
console.log('Active watchers:', this.watcher.watchers.size);

// 4. Trace variable updates
this.Variables.userData.subscribe('success', () => {
  console.log('Variable updated:', this.Variables.userData.dataSet);
  this.watcher.digest();
});
```

### Common Issues

```typescript
// Issue 1: Binding not updating
// Cause: Missing digest call
// Solution: Call watcher.digest() after updates

// Issue 2: Infinite loop
// Cause: Watch callback updates watched value
// Solution: Add condition to prevent infinite updates
this.watcher.watch('Variables.count.dataSet', (newValue) => {
  if (newValue < 10) { // Condition prevents infinite loop
    this.Variables.count.setData(newValue + 1);
  }
});

// Issue 3: Performance issues
// Cause: Too many watchers or deep watches
// Solution: Use selective watching and debouncing
```

## Best Practices

### Binding Usage

1. **Prefer One-Way**: Use one-way binding when possible
2. **Specific Paths**: Watch specific properties, not entire objects
3. **Cleanup**: Always unwatch on unmount
4. **Debounce**: Debounce expensive operations
5. **Avoid Loops**: Prevent infinite update loops

### Performance

1. **Shallow Watch**: Avoid deep watching large objects
2. **Batch Updates**: Update multiple properties at once
3. **Selective Digest**: Trigger digest only when needed
4. **Memoization**: Cache computed values

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Data Binding & Watch System

