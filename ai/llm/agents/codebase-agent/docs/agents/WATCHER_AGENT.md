# Watcher Agent - Detailed Documentation

## Overview

The **Watcher Agent** is the expert on the watch system in WaveMaker React Native. It has deep knowledge of how watchers detect changes, trigger updates, and optimize performance through efficient change detection.

## Domain Expertise

### Core Responsibilities

1. **Watcher System**
   - Watch expression compilation
   - Change detection algorithms
   - Digest cycle management
   - Watcher lifecycle

2. **Watch Expressions**
   - Expression parsing
   - Getter compilation
   - Dependency tracking
   - Context binding

3. **Change Detection**
   - Shallow vs deep comparison
   - Dirty checking
   - Digest optimization
   - Performance tuning

4. **Watcher Patterns**
   - One-time watches
   - Continuous watches
   - Collection watches
   - Deep watches

## Watcher Implementation

### Core Watcher Class

**Location**: `wavemaker-rn-runtime/src/runtime/watcher.ts`

```typescript
export class Watcher {
  private watchers = new Map<string, WatchExpression>();
  private context: any;
  private digestInProgress = false;
  private maxDigestIterations = 10;
  
  constructor(context: any) {
    this.context = context;
  }
  
  /**
   * Watch an expression
   */
  watch(
    expression: string | (() => any),
    callback: WatchCallback,
    options?: WatchOptions
  ): WatchDestructor {
    const watchId = this.generateWatchId();
    
    // Compile getter function
    const getter = typeof expression === 'string'
      ? this.compileGetter(expression)
      : expression;
    
    // Get initial value
    let oldValue = this.safeEval(getter);
    
    // Create check function
    const check = () => {
      const newValue = this.safeEval(getter);
      
      if (this.hasChanged(newValue, oldValue, options)) {
        try {
          callback(newValue, oldValue);
          oldValue = this.cloneValue(newValue, options);
        } catch (error) {
          console.error('Error in watch callback:', error);
        }
      }
    };
    
    // Store watcher
    this.watchers.set(watchId, {
      id: watchId,
      expression,
      getter,
      callback,
      check,
      options: options || {}
    });
    
    // Call immediately if requested
    if (options?.immediate) {
      callback(oldValue, undefined);
    }
    
    // Return destructor function
    return () => {
      this.watchers.delete(watchId);
    };
  }
  
  /**
   * Watch collection (array/object changes)
   */
  watchCollection(
    expression: string | (() => any),
    callback: WatchCallback,
    options?: WatchOptions
  ): WatchDestructor {
    return this.watch(expression, callback, {
      ...options,
      deep: false,
      collection: true
    });
  }
  
  /**
   * Watch deep (nested property changes)
   */
  watchDeep(
    expression: string | (() => any),
    callback: WatchCallback,
    options?: WatchOptions
  ): WatchDestructor {
    return this.watch(expression, callback, {
      ...options,
      deep: true
    });
  }
  
  /**
   * One-time watch (auto-unwatch after first trigger)
   */
  watchOnce(
    expression: string | (() => any),
    callback: WatchCallback
  ): WatchDestructor {
    const destructor = this.watch(expression, (newValue, oldValue) => {
      callback(newValue, oldValue);
      destructor(); // Auto-unwatch
    });
    
    return destructor;
  }
  
  /**
   * Trigger digest cycle
   */
  digest(): void {
    if (this.digestInProgress) {
      console.warn('Digest already in progress');
      return;
    }
    
    this.digestInProgress = true;
    let iterations = 0;
    let dirty = true;
    
    while (dirty && iterations < this.maxDigestIterations) {
      dirty = false;
      
      this.watchers.forEach(watcher => {
        const previousValue = this.safeEval(watcher.getter);
        watcher.check();
        const currentValue = this.safeEval(watcher.getter);
        
        if (this.hasChanged(currentValue, previousValue, watcher.options)) {
          dirty = true;
        }
      });
      
      iterations++;
    }
    
    if (iterations >= this.maxDigestIterations) {
      console.error('Max digest iterations reached. Possible infinite loop.');
    }
    
    this.digestInProgress = false;
  }
  
  /**
   * Compile getter function from expression string
   */
  private compileGetter(expression: string): () => any {
    try {
      // Create Function with context binding
      return new Function('context', `
        with (context) {
          try {
            return ${expression};
          } catch (e) {
            return undefined;
          }
        }
      `).bind(null, this.context);
    } catch (error) {
      console.error('Failed to compile watch expression:', expression, error);
      return () => undefined;
    }
  }
  
  /**
   * Safely evaluate getter
   */
  private safeEval(getter: () => any): any {
    try {
      return getter();
    } catch (error) {
      return undefined;
    }
  }
  
  /**
   * Check if value has changed
   */
  private hasChanged(
    newValue: any,
    oldValue: any,
    options?: WatchOptions
  ): boolean {
    // Deep comparison
    if (options?.deep) {
      return !this.deepEqual(newValue, oldValue);
    }
    
    // Collection comparison (length and items)
    if (options?.collection) {
      return !this.collectionEqual(newValue, oldValue);
    }
    
    // Shallow comparison (reference equality)
    return newValue !== oldValue;
  }
  
  /**
   * Deep equality check
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => this.deepEqual(a[key], b[key]));
  }
  
  /**
   * Collection equality check
   */
  private collectionEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    
    return a.every((item, index) => item === b[index]);
  }
  
  /**
   * Clone value for comparison
   */
  private cloneValue(value: any, options?: WatchOptions): any {
    if (options?.deep) {
      return JSON.parse(JSON.stringify(value));
    }
    
    if (Array.isArray(value)) {
      return [...value];
    }
    
    if (typeof value === 'object' && value !== null) {
      return { ...value };
    }
    
    return value;
  }
  
  /**
   * Generate unique watch ID
   */
  private generateWatchId(): string {
    return `watch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get watcher count
   */
  getWatcherCount(): number {
    return this.watchers.size;
  }
  
  /**
   * Destroy all watchers
   */
  destroy(): void {
    this.watchers.clear();
  }
}

// Types
interface WatchExpression {
  id: string;
  expression: string | (() => any);
  getter: () => any;
  callback: WatchCallback;
  check: () => void;
  options: WatchOptions;
}

type WatchCallback = (newValue: any, oldValue: any) => void;
type WatchDestructor = () => void;

interface WatchOptions {
  immediate?: boolean;    // Call immediately with initial value
  deep?: boolean;         // Deep comparison
  collection?: boolean;   // Collection comparison
}
```

## Watch Patterns

### Pattern 1: Simple Property Watch

```typescript
class MyPage extends BasePage<...> {
  protected init(): void {
    super.init();
    
    // Watch single property
    const unwatch = this.watcher.watch(
      'Variables.userName.dataSet',
      (newValue, oldValue) => {
        console.log('Username changed:', oldValue, '→', newValue);
        this.updateGreeting(newValue);
      }
    );
    
    this.cleanup.push(unwatch);
  }
}
```

### Pattern 2: Expression Watch

```typescript
// Watch computed expression
const unwatch = this.watcher.watch(
  'Variables.cart.dataSet.items.length > 0',
  (newValue, oldValue) => {
    if (newValue) {
      console.log('Cart has items');
      this.showCheckoutButton();
    } else {
      console.log('Cart is empty');
      this.hideCheckoutButton();
    }
  }
);
```

### Pattern 3: Deep Object Watch

```typescript
// Watch for deep changes in object
const unwatch = this.watcher.watchDeep(
  'Variables.formData.dataSet',
  (newValue, oldValue) => {
    console.log('Form data changed');
    this.validateForm();
    this.markAsModified();
  }
);
```

### Pattern 4: Collection Watch

```typescript
// Watch for array changes (add/remove items)
const unwatch = this.watcher.watchCollection(
  'Variables.todoList.dataSet',
  (newValue, oldValue) => {
    console.log('Todo list changed:', newValue.length, 'items');
    this.updateCounter(newValue.length);
  }
);
```

### Pattern 5: Multiple Property Watch

```typescript
// Watch multiple properties
const firstName = 'Variables.user.dataSet.firstName';
const lastName = 'Variables.user.dataSet.lastName';

const unwatch1 = this.watcher.watch(firstName, () => this.updateFullName());
const unwatch2 = this.watcher.watch(lastName, () => this.updateFullName());

this.cleanup.push(unwatch1, unwatch2);

private updateFullName(): void {
  const { firstName, lastName } = this.Variables.user.dataSet;
  this.Variables.fullName.setData(`${firstName} ${lastName}`);
}
```

### Pattern 6: One-Time Watch

```typescript
// Watch once (e.g., wait for data to load)
const unwatch = this.watcher.watchOnce(
  'Variables.userData.dataSet !== null',
  (isLoaded) => {
    if (isLoaded) {
      console.log('User data loaded');
      this.initializeUI();
    }
  }
);
```

### Pattern 7: Conditional Watch

```typescript
// Enable/disable watch based on condition
let unwatch: (() => void) | null = null;

private enableWatch(): void {
  if (!unwatch) {
    unwatch = this.watcher.watch(
      'Variables.liveData.dataSet',
      (newValue) => {
        this.updateUI(newValue);
      }
    );
  }
}

private disableWatch(): void {
  if (unwatch) {
    unwatch();
    unwatch = null;
  }
}
```

### Pattern 8: Debounced Watch

```typescript
// Debounce watch callback
import { debounce } from 'lodash';

const debouncedCallback = debounce((newValue) => {
  console.log('Search query:', newValue);
  this.performSearch(newValue);
}, 300);

const unwatch = this.watcher.watch(
  'Variables.searchQuery.dataSet',
  (newValue) => {
    debouncedCallback(newValue);
  }
);
```

## Change Detection Strategies

### 1. Shallow Change Detection (Default)

```typescript
// Detects reference changes only
const obj1 = { name: 'John' };
const obj2 = { name: 'John' };

obj1 !== obj2  // true (different references)
```

**Use for**:
- Primitives (string, number, boolean)
- Object/array references
- Performance-critical watches

### 2. Deep Change Detection

```typescript
// Detects nested property changes
const obj1 = { user: { name: 'John' } };
const obj2 = { user: { name: 'Jane' } };

deepEqual(obj1, obj2)  // false (nested value different)
```

**Use for**:
- Complex objects
- Nested data structures
- Form data validation

**Warning**: Expensive for large objects!

### 3. Collection Change Detection

```typescript
// Detects array length and item changes
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3, 4];

arr1.length !== arr2.length  // true (length changed)
```

**Use for**:
- Lists and arrays
- Collection operations
- Efficient array watching

## Digest Cycle

### Digest Cycle Flow

```
Variable Update
    ↓
Trigger Digest
    ↓
┌─────────────────────────┐
│ Digest Cycle Start      │
│ digestInProgress = true │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Iteration 1             │
│ - Check all watchers    │
│ - Execute callbacks     │
│ - Mark dirty if changed │
└─────────────────────────┘
    ↓
    Dirty? ──No──→ Done
    │
    Yes
    ↓
┌─────────────────────────┐
│ Iteration 2...N         │
│ (max 10 iterations)     │
└─────────────────────────┘
    ↓
┌─────────────────────────┐
│ Digest Cycle End        │
│ digestInProgress = false│
└─────────────────────────┘
```

### Triggering Digest

```typescript
// Manual digest trigger
this.watcher.digest();

// Auto-digest after variable updates
Variables.userData.subscribe('success', () => {
  this.watcher.digest();
});

// Digest in event handlers
private handleButtonClick(): void {
  this.Variables.counter.setValue('count', newValue);
  this.watcher.digest();
}
```

## Performance Optimization

### 1. Minimize Watchers

```typescript
// ❌ Bad: Too many watchers
this.watcher.watch('Variables.user.dataSet.firstName', ...);
this.watcher.watch('Variables.user.dataSet.lastName', ...);
this.watcher.watch('Variables.user.dataSet.email', ...);
this.watcher.watch('Variables.user.dataSet.phone', ...);

// ✅ Good: Single watcher
this.watcher.watch('Variables.user.dataSet', (user) => {
  this.updateUserUI(user);
});
```

### 2. Use Shallow Watches

```typescript
// ❌ Bad: Deep watch on large object
this.watcher.watchDeep('Variables.largeDataset.dataSet', ...);

// ✅ Good: Shallow watch specific properties
this.watcher.watch('Variables.largeDataset.dataSet.status', ...);
```

### 3. Debounce Expensive Operations

```typescript
// Debounce expensive watch callbacks
const debouncedUpdate = debounce(() => {
  this.updateExpensiveUI();
}, 300);

this.watcher.watch('Variables.searchQuery.dataSet', () => {
  debouncedUpdate();
});
```

### 4. Unwatch When Not Needed

```typescript
// Conditionally enable/disable watches
class MyPage extends BasePage<...> {
  private unwatchers: (() => void)[] = [];
  
  private startWatching(): void {
    this.unwatchers.push(
      this.watcher.watch(...),
      this.watcher.watch(...)
    );
  }
  
  private stopWatching(): void {
    this.unwatchers.forEach(unwatch => unwatch());
    this.unwatchers = [];
  }
}
```

### 5. Batch Updates

```typescript
// ❌ Bad: Multiple updates trigger multiple digests
Variables.user.setValue('firstName', 'John');
this.watcher.digest();
Variables.user.setValue('lastName', 'Doe');
this.watcher.digest();

// ✅ Good: Batch updates, single digest
Variables.user.setData({
  ...Variables.user.dataSet,
  firstName: 'John',
  lastName: 'Doe'
});
this.watcher.digest();
```

## Debugging Watchers

### Debug Utilities

```typescript
// 1. Count active watchers
console.log('Active watchers:', this.watcher.getWatcherCount());

// 2. Log watch triggers
this.watcher.watch('Variables.data.dataSet', (newValue, oldValue) => {
  console.log('Watch triggered:', {
    old: oldValue,
    new: newValue,
    stack: new Error().stack
  });
});

// 3. Track digest cycles
let digestCount = 0;
const originalDigest = this.watcher.digest.bind(this.watcher);
this.watcher.digest = () => {
  digestCount++;
  console.log('Digest cycle:', digestCount);
  originalDigest();
};

// 4. Detect infinite loops
this.watcher.watch('Variables.counter.dataSet', (newValue) => {
  if (newValue < 10) {
    // This will cause infinite loop!
    this.Variables.counter.setValue('count', newValue + 1);
    this.watcher.digest();
  }
});
```

## Common Issues

### Issue 1: Infinite Digest Loop

```typescript
// ❌ Problem: Watch callback modifies watched value
this.watcher.watch('Variables.count.dataSet', (newValue) => {
  this.Variables.count.setData(newValue + 1); // Infinite loop!
  this.watcher.digest();
});

// ✅ Solution: Add condition
this.watcher.watch('Variables.count.dataSet', (newValue) => {
  if (newValue < 10) { // Prevent infinite loop
    this.Variables.count.setData(newValue + 1);
    this.watcher.digest();
  }
});
```

### Issue 2: Watch Not Triggering

```typescript
// ❌ Problem: No digest after update
Variables.userData.setData(newData);
// No digest called, watchers won't trigger

// ✅ Solution: Trigger digest
Variables.userData.setData(newData);
this.watcher.digest();
```

### Issue 3: Performance Issues

```typescript
// ❌ Problem: Too many deep watches
this.watcher.watchDeep('Variables.data1.dataSet', ...);
this.watcher.watchDeep('Variables.data2.dataSet', ...);
this.watcher.watchDeep('Variables.data3.dataSet', ...);

// ✅ Solution: Use shallow watches
this.watcher.watch('Variables.data1.dataSet.id', ...);
this.watcher.watch('Variables.data2.dataSet.status', ...);
```

## Agent Capabilities

### 1. Explain Watchers

**Query**: "How does the watcher system work?"

**Response**: Complete explanation of watcher implementation

### 2. Optimize Watchers

**Query**: "How to optimize watch performance?"

**Response**: Performance optimization techniques

### 3. Debug Watchers

**Query**: "My watch isn't triggering"

**Response**: Diagnostic steps and common solutions

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Watcher System & Change Detection

