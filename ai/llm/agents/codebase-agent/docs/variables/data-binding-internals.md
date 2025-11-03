# Data Binding Internals

This document provides a deep dive into the data binding mechanism, watch expressions, change detection, and the reactive system in WaveMaker React Native.

## Table of Contents

1. [Watch Expressions](#watch-expressions)
2. [Watcher Hierarchy](#watcher-hierarchy)
3. [Change Detection](#change-detection)
4. [Expression Evaluation](#expression-evaluation)
5. [Performance Monitoring](#performance-monitoring)
6. [Watcher Lifecycle](#watcher-lifecycle)
7. [Auto-refresh Mechanism](#auto-refresh-mechanism)
8. [Data Binding Patterns](#data-binding-patterns)

---

## Watch Expressions

Watch expressions are the core of WaveMaker's reactive data binding system. They automatically track changes and trigger updates when values change.

### WatchExpression Class

**File**: `src/runtime/watcher.ts`

```typescript
class WatchExpression {
  private lastValue: any;
  private lastExecutionTime = 0;

  constructor(
    private fn: Function,
    private onChange: (prev: any, now: any) => any
  ) {
    this.lastValue = undefined;
  }

  check() {
    const startTime = Date.now();
    const now = this.fn();
    this.lastExecutionTime = Date.now() - startTime;
    
    if (!isEqual(this.lastValue, now)) {
      const prev = this.lastValue;
      this.lastValue = now;
      this.onChange(prev, now);
    }
  }
}
```

### How Watch Expressions Work

```
┌─────────────────────────────────────────────────────────────┐
│              WATCH EXPRESSION LIFECYCLE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Creation                                                 │
│     watch(() => expression)                                  │
│     └─→ Store function reference                            │
│     └─→ Execute once to get initial value                   │
│                                                              │
│  2. Check Phase (on each update cycle)                      │
│     └─→ Execute function: now = fn()                        │
│     └─→ Compare: isEqual(lastValue, now)                    │
│     └─→ If different:                                       │
│         ├─→ Call onChange(prev, now)                        │
│         └─→ Update lastValue = now                          │
│                                                              │
│  3. Cleanup                                                  │
│     └─→ Remove from expressions array                       │
│     └─→ Clear references                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Creating Watch Expressions

#### In WmMemo Components

```typescript
<WmMemo watcher={this.watcher} render={(watch) => {
  const userName = watch(() => this.Variables.user.dataSet.name);
  const itemCount = watch(() => this.Variables.items.dataSet.length);
  
  return (
    <View>
      <Text>User: {userName}</Text>
      <Text>Items: {itemCount}</Text>
    </View>
  );
}} />
```

#### In Fragment Components

```typescript
export default class MyPageComponent extends BasePage {
  onReady() {
    // Watch variable changes
    this.watch('user', (newValue, oldValue) => {
      console.log(`User changed from ${oldValue} to ${newValue}`);
      this.updateUI();
    }, {});
    
    // Watch computed expression
    this.watcher.watch(() => {
      return this.Variables.items.dataSet.filter(i => i.active).length;
    }, (prev, now) => {
      console.log(`Active items: ${prev} → ${now}`);
    });
  }
}
```

#### Direct Watcher Usage

```typescript
const watcher = Watcher.ROOT.create();

watcher.watch(() => someObject.property, (prev, now) => {
  console.log(`Property changed: ${prev} → ${now}`);
});

// Trigger check
watcher.check();
```

---

## Watcher Hierarchy

Watchers are organized in a hierarchical tree structure that mirrors the component tree.

### Hierarchy Structure

```
Watcher.ROOT (Static singleton)
  │
  ├── App Watcher
  │   ├── watcher.expressions[]
  │   └── watcher.children[]
  │       │
  │       ├── Page Watcher
  │       │   ├── watcher.expressions[]
  │       │   └── watcher.children[]
  │       │       │
  │       │       ├── Container Watcher
  │       │       │   └── Widget Watchers
  │       │       │
  │       │       └── List Watcher
  │       │           └── List Item Watchers
  │       │
  │       └── Partial Watcher
  │           └── Widget Watchers
  │
  └── Dialog Watcher
      └── Dialog Content Watchers
```

### Parent-Child Relationships

```typescript
export class Watcher {
  private parent: Watcher | null = null;
  private children: Watcher[] = [];

  create(): Watcher {
    const child = new Watcher();
    child.parent = this;
    this.children.push(child);
    return child;
  }

  destroy() {
    // Clear own expressions
    this.expressions.length = 0;
    
    // Destroy all children
    this.children.forEach(c => c.destroy());
    this.children.length = 0;
    
    // Remove from parent
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) {
        this.parent.children.splice(index, 1);
      }
    }
  }
}
```

### Recursive Checking

When a watcher checks for changes, it recursively checks all descendants:

```typescript
check() {
  // Check own expressions
  this.expressions.forEach(e => e.check());
  
  // Recursively check all children
  this.children.forEach(c => c.check());
}
```

**Impact**:
- Root check cascades through entire tree
- Deep trees = more checks
- Optimize by keeping trees shallow

### Watcher in BaseFragment

**File**: `src/runtime/base-fragment.component.tsx`

```typescript
export class BaseFragment {
  public watcher: Watcher;

  constructor(private parentWatcher?: Watcher) {
    this.watcher = parentWatcher 
      ? parentWatcher.create() 
      : Watcher.ROOT.create();
  }

  destroy() {
    this.watcher?.destroy();
    super.destroy();
  }
}
```

Fragments automatically create child watchers from their parent's watcher.

---

## Change Detection

Change detection determines when a watched expression has actually changed.

### isEqual Comparison

**File**: `src/runtime/watcher.ts`

```typescript
import { isEqual } from 'lodash';

check() {
  const now = this.fn();
  
  if (!isEqual(this.lastValue, now)) {
    const prev = this.lastValue;
    this.lastValue = now;
    this.onChange(prev, now);
  }
}
```

**Uses Lodash's `isEqual`**:
- Deep equality check
- Compares object structures recursively
- Handles arrays, objects, primitives, dates, etc.

### Comparison Examples

```typescript
// Primitives: Simple equality
isEqual(5, 5) → true
isEqual('hello', 'world') → false

// Arrays: Deep comparison
isEqual([1, 2, 3], [1, 2, 3]) → true
isEqual([1, 2, 3], [1, 2, 4]) → false

// Objects: Deep comparison
isEqual(
  { name: 'John', age: 30 },
  { name: 'John', age: 30 }
) → true

isEqual(
  { name: 'John', age: 30 },
  { name: 'John', age: 31 }
) → false

// Nested structures
isEqual(
  { user: { name: 'John', tags: ['a', 'b'] } },
  { user: { name: 'John', tags: ['a', 'b'] } }
) → true

// Reference vs Value
const obj1 = { x: 1 };
const obj2 = { x: 1 };
obj1 === obj2 → false (different references)
isEqual(obj1, obj2) → true (same values)
```

### Performance Implications

**Pros**:
- Accurate change detection
- Avoids false positives
- Works with complex data structures

**Cons**:
- Deep comparison is expensive for large objects
- Runs on every check cycle
- Can slow down with many watchers

### Optimization Strategies

#### 1. Watch Specific Properties

**Bad**:
```typescript
// Watches entire large object
watch(() => this.Variables.largeDataSet.dataSet)
```

**Good**:
```typescript
// Watch only what you need
watch(() => this.Variables.largeDataSet.dataSet.length)
watch(() => this.Variables.largeDataSet.dataSet[0]?.name)
```

#### 2. Use Memoization

```typescript
// Memoize filtered results
const activeItems = this.memoize('activeItems', () => {
  return this.Variables.items.dataSet.filter(i => i.active);
});

// Watch the memoized value
watch(() => activeItems)
```

#### 3. Custom Change Detection

For very large data structures, implement custom equality:

```typescript
class FastWatchExpression extends WatchExpression {
  check() {
    const now = this.fn();
    
    // Custom shallow comparison
    if (this.hasChanged(this.lastValue, now)) {
      const prev = this.lastValue;
      this.lastValue = now;
      this.onChange(prev, now);
    }
  }

  private hasChanged(prev: any, now: any): boolean {
    // Custom logic (e.g., compare IDs only)
    if (Array.isArray(prev) && Array.isArray(now)) {
      return prev.length !== now.length ||
        prev.some((item, i) => item.id !== now[i].id);
    }
    return prev !== now;
  }
}
```

---

## Expression Evaluation

How expressions are executed and their values computed.

### Function Execution Context

Watch expressions run in the context where they're defined:

```typescript
export default class MyPage extends BasePage {
  onReady() {
    // 'this' refers to page instance
    this.watcher.watch(() => {
      // Can access all page properties
      return this.Variables.user.dataSet.name;
    }, (prev, now) => {
      // Can call page methods
      this.updateUI(now);
    });
  }
}
```

### Arrow Functions vs Regular Functions

```typescript
// Arrow function: Preserves 'this' context
watch(() => this.Variables.user.dataSet.name)

// Regular function: May lose 'this' context
watch(function() {
  return this.Variables.user.dataSet.name; // 'this' may be wrong!
})
```

**Always use arrow functions** for watch expressions.

### Expression Complexity

Watch expressions should be simple and fast:

**Simple (Good)**:
```typescript
// Property access
watch(() => this.user.name)

// Simple computation
watch(() => this.items.length)

// Basic arithmetic
watch(() => this.price * this.quantity)
```

**Complex (Bad)**:
```typescript
// Expensive filtering and mapping
watch(() => {
  return this.Variables.items.dataSet
    .filter(item => item.category === 'electronics')
    .map(item => ({
      ...item,
      price: item.price * 1.1,
      tax: item.price * 0.08
    }))
    .reduce((sum, item) => sum + item.price + item.tax, 0);
})
// This runs on EVERY check cycle!
```

**Better approach**:
```typescript
// Compute once, cache, then watch
const computedValue = useMemo(() => {
  return this.Variables.items.dataSet
    .filter(item => item.category === 'electronics')
    .map(item => ({
      ...item,
      price: item.price * 1.1,
      tax: item.price * 0.08
    }))
    .reduce((sum, item) => sum + item.price + item.tax, 0);
}, [this.Variables.items.dataSet]);

watch(() => computedValue)
```

### Error Handling

Watch expressions should handle errors gracefully:

```typescript
watcher.watch(() => {
  try {
    return this.Variables.user.dataSet.address.city;
  } catch (e) {
    console.error('Error in watch expression:', e);
    return null;
  }
}, (prev, now) => {
  if (now !== null) {
    // Handle valid value
  }
});
```

---

## Performance Monitoring

Track watch expression performance to identify bottlenecks.

### Execution Time Tracking

Each `WatchExpression` tracks its execution time:

```typescript
class WatchExpression {
  private lastExecutionTime = 0;

  check() {
    const startTime = Date.now();
    const now = this.fn();
    this.lastExecutionTime = Date.now() - startTime;
    
    // ... change detection
  }

  getLastExecutionTime(): number {
    return this.lastExecutionTime;
  }
}
```

### Performance Analysis

Add monitoring to identify slow watchers:

```typescript
export class Watcher {
  check() {
    this.expressions.forEach((expr, index) => {
      const startTime = performance.now();
      expr.check();
      const duration = performance.now() - startTime;
      
      if (duration > 16) { // Longer than 1 frame at 60fps
        console.warn(
          `[Watcher Performance] Expression #${index} took ${duration.toFixed(2)}ms`,
          expr.fn.toString().slice(0, 100)
        );
      }
    });
    
    this.children.forEach(c => c.check());
  }
}
```

### Profiling Watchers

Create a profiling utility:

```typescript
class WatcherProfiler {
  private metrics = new Map<string, { count: number, totalTime: number }>();

  profile(name: string, fn: Function) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    const metric = this.metrics.get(name) || { count: 0, totalTime: 0 };
    metric.count++;
    metric.totalTime += duration;
    this.metrics.set(name, metric);
    
    return result;
  }

  report() {
    console.log('=== Watcher Performance Report ===');
    this.metrics.forEach((metric, name) => {
      const avg = metric.totalTime / metric.count;
      console.log(
        `${name}: ${metric.count} checks, ` +
        `${metric.totalTime.toFixed(2)}ms total, ` +
        `${avg.toFixed(2)}ms avg`
      );
    });
  }
}

const profiler = new WatcherProfiler();

// Use in watchers
watcher.watch(() => {
  return profiler.profile('userNameWatch', () => {
    return this.Variables.user.dataSet.name;
  });
});
```

### Performance Thresholds

| Expression Time | Classification | Action |
|----------------|----------------|--------|
| < 1ms | Excellent | No action needed |
| 1-5ms | Good | Monitor if called frequently |
| 5-16ms | Slow | Optimize if possible |
| > 16ms | Critical | Must optimize (blocks render) |

---

## Watcher Lifecycle

Complete lifecycle of a watcher instance.

### Creation

```typescript
// 1. Create from parent
const childWatcher = parentWatcher.create();

// 2. Register expressions
childWatcher.watch(() => expression1, onChange1);
childWatcher.watch(() => expression2, onChange2);

// 3. Subscribe to changes
childWatcher.subscribe((oldVal, newVal) => {
  console.log('Watcher changed');
});
```

### Active Phase

```typescript
// Periodic checking
setInterval(() => {
  childWatcher.check(); // Checks all expressions
}, 100);

// Or triggered checking
someEvent.on('dataChange', () => {
  childWatcher.check();
});
```

### Cleanup

```typescript
// Destroy when no longer needed
childWatcher.destroy();
// - Clears expressions
// - Destroys children recursively
// - Removes from parent
// - Clears subscriptions
```

### Integration with Component Lifecycle

```typescript
export default class MyComponent extends BaseComponent {
  private watcher: Watcher;

  constructor(props) {
    super(props);
    // Create watcher
    this.watcher = Watcher.ROOT.create();
    
    // Register for cleanup
    this.cleanup.push(() => this.watcher.destroy());
  }

  componentDidMount() {
    // Set up watches
    this.watcher.watch(() => this.props.data, (prev, now) => {
      this.handleDataChange(now);
    });
  }

  componentWillUnmount() {
    // Automatic cleanup via this.cleanup array
    super.componentWillUnmount();
  }
}
```

---

## Auto-refresh Mechanism

How bound widgets automatically update when data changes.

### Variable Binding

When a widget is bound to a variable, it automatically refreshes when the variable changes.

**Example**: List widget bound to variable

```html
<wm-list dataset="bind:Variables.employees.dataSet">
  <wm-list-item>
    <wm-label caption="bind:name"></wm-label>
  </wm-list-item>
</wm-list>
```

**Generated Code**:
```typescript
<WmMemo watcher={this.watcher} render={(watch) => {
  const dataset = watch(() => this.Variables.employees.dataSet);
  
  return (
    <WmList dataset={dataset}>
      {dataset.map((item, index) => (
        <WmListItem key={item.id || index}>
          <WmLabel caption={item.name} />
        </WmListItem>
      ))}
    </WmList>
  );
}} />
```

### How Auto-refresh Works

```
┌─────────────────────────────────────────────────────────────┐
│                 AUTO-REFRESH FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Variable Update                                          │
│     Variables.employees.dataSet = newData                    │
│                                                              │
│  2. Watcher Check Triggered                                  │
│     watcher.check()                                          │
│     └─→ Iterates all expressions                            │
│         └─→ Checks: Variables.employees.dataSet             │
│                                                              │
│  3. Change Detected                                          │
│     isEqual(oldData, newData) → false                       │
│     └─→ Triggers onChange callback                          │
│                                                              │
│  4. WmMemo Re-render                                         │
│     onChange calls: wmMemo.refresh()                         │
│     └─→ Increments state.id                                 │
│         └─→ Triggers React re-render                        │
│                                                              │
│  5. Widget Updates                                           │
│     render() executes with new data                          │
│     └─→ List displays updated items                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Manual Refresh

Components can also be refreshed manually:

```typescript
// Refresh specific watcher
this.watcher.check();

// Refresh entire app
App.notify('refresh', []);

// Refresh variable
this.Variables.employees.invoke();
```

### Conditional Refresh

Prevent unnecessary refreshes:

```typescript
watcher.watch(() => {
  return this.Variables.employees.dataSet;
}, (prev, now) => {
  // Only refresh if actually different
  if (prev?.length !== now?.length) {
    this.refreshList();
  }
});
```

---

## Data Binding Patterns

Common patterns for effective data binding.

### Pattern 1: Simple Property Binding

```typescript
<WmLabel caption={watch(() => this.Variables.user.dataSet.name)} />
```

### Pattern 2: Computed Property Binding

```typescript
<WmLabel caption={watch(() => {
  const user = this.Variables.user.dataSet;
  return `${user.firstName} ${user.lastName}`;
})} />
```

### Pattern 3: Conditional Binding

```typescript
<WmButton show={watch(() => {
  return this.Variables.user.dataSet.role === 'admin';
})} />
```

### Pattern 4: List Binding

```typescript
<WmMemo watcher={this.watcher} render={(watch) => {
  const items = watch(() => this.Variables.items.dataSet);
  
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ItemComponent item={item} />}
      keyExtractor={item => item.id}
    />
  );
}} />
```

### Pattern 5: Multi-Variable Binding

```typescript
<WmMemo watcher={this.watcher} render={(watch) => {
  const user = watch(() => this.Variables.user.dataSet);
  const settings = watch(() => this.Variables.settings.dataSet);
  const theme = watch(() => this.Variables.theme.dataSet);
  
  return (
    <UserProfile 
      user={user}
      settings={settings}
      theme={theme}
    />
  );
}} />
```

### Pattern 6: Nested Binding

```typescript
<WmMemo watcher={this.watcher} render={(watch) => {
  const userId = watch(() => this.Variables.selectedUser.dataSet.id);
  const userDetails = watch(() => 
    this.Variables.users.dataSet.find(u => u.id === userId)
  );
  
  return <UserDetailsView user={userDetails} />;
}} />
```

---

## Best Practices

### DO

✓ Watch specific properties, not entire objects
✓ Keep watch expressions simple and fast
✓ Use memoization for expensive computations
✓ Clean up watchers on component unmount
✓ Use arrow functions to preserve context
✓ Profile slow watch expressions
✓ Use WmMemo for selective re-rendering

### DON'T

✗ Watch large objects with deep nesting
✗ Create new objects in watch expressions
✗ Perform expensive operations in watch expressions
✗ Forget to destroy watchers
✗ Use regular functions (lose 'this' context)
✗ Create circular watch dependencies
✗ Watch volatile properties that change every millisecond

---

## Troubleshooting

### Issue: Component not updating

**Cause**: Watch expression not detecting change

**Solution**:
```typescript
// Ensure you're watching the right property
watch(() => this.Variables.user.dataSet) // ✓
watch(() => this.Variables.user) // ✗ (watches variable object, not data)
```

### Issue: Too many re-renders

**Cause**: Watch expression creating new object every time

**Solution**:
```typescript
// Bad: New object every check
watch(() => ({ name: this.user.name }))

// Good: Watch primitive or stable reference
watch(() => this.user.name)
```

### Issue: Slow performance

**Cause**: Expensive watch expression

**Solution**:
```typescript
// Profile and optimize
const startTime = performance.now();
watcher.check();
console.log('Watcher check took:', performance.now() - startTime);

// Memoize expensive operations
const filtered = useMemo(() => 
  items.filter(i => i.active)
, [items]);
```

---

## Summary

WaveMaker's data binding system provides:

- **Watch Expressions**: Reactive tracking of data changes
- **Hierarchical Watchers**: Tree-based organization
- **Deep Change Detection**: Using `isEqual` for accuracy
- **Performance Monitoring**: Track slow expressions
- **Auto-refresh**: Automatic widget updates
- **Flexible Patterns**: Multiple binding strategies

Understanding these internals enables you to build highly reactive, performant applications with efficient data binding.

