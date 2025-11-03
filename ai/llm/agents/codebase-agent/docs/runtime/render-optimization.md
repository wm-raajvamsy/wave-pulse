# Render Optimization Guide

This document covers rendering behavior, optimization strategies, and performance analysis for WaveMaker React Native components.

## Table of Contents

1. [Render Cycles](#render-cycles)
2. [shouldComponentUpdate Logic](#shouldcomponentupdate-logic)
3. [Render Count Analysis](#render-count-analysis)
4. [Memoization Patterns](#memoization-patterns)
5. [Watch Expression Optimization](#watch-expression-optimization)
6. [Render Batching](#render-batching)
7. [Best Practices](#best-practices)

---

## Render Cycles

Understanding when and why components render is crucial for optimization.

### Component Render Triggers

A component renders when:

1. **Initial Mount**: First time the component appears
2. **Props Change**: Parent passes different props
3. **State Change**: Component's `setState` or `updateState` is called
4. **Parent Re-renders**: By default, children re-render when parent renders
5. **Context Change**: When a consumed context value changes
6. **Force Update**: Explicit `forceUpdate()` call

### BaseComponent Render Method

**File**: `src/core/base.component.tsx`

```typescript
render() {
  if (!this._showView || this.props.show === false) {
    return null;
  }

  if (this._showSkeleton && this.props.showskeleton) {
    return this.renderSkeleton(this.props as any);
  }

  return this.renderWidget(this.props as any);
}
```

**Render Flow**:
```
render() called
  ├─→ Check show/hide conditions
  ├─→ Check skeleton mode
  └─→ Call renderWidget() or renderSkeleton()
```

### Component Lifecycle with Rendering

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT LIFECYCLE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. constructor()                                            │
│     └─→ Initialize state, props, notifier                   │
│                                                              │
│  2. componentDidMount()                                      │
│     └─→ Setup subscriptions, timers                         │
│                                                              │
│  3. [UPDATES] Prop/State changes trigger:                   │
│     │                                                        │
│     ├─→ shouldComponentUpdate(nextProps, nextState)         │
│     │   └─→ Return true/false to control re-render         │
│     │                                                        │
│     ├─→ render()                                            │
│     │   └─→ Returns React elements                         │
│     │                                                        │
│     └─→ componentDidUpdate(prevProps, prevState)           │
│         └─→ React to changes                               │
│                                                              │
│  4. componentWillUnmount()                                   │
│     └─→ Cleanup subscriptions, timers, watchers            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## shouldComponentUpdate Logic

The `shouldComponentUpdate` method is the primary optimization point for preventing unnecessary re-renders.

### BaseComponent Implementation

```typescript
shouldComponentUpdate(nextProps: T, nextState: S, nextContext: any) {
  // Check if props changed via PropsProvider
  const propsChanged = this.propertyProvider.check(nextProps);
  
  // Check if state changed (excluding 'props' property)
  const stateChanged = Object.keys(nextState).some(k => {
    return k !== 'props' && (this.state as any)[k] !== (nextState as any)[k];
  });
  
  return propsChanged || stateChanged;
}
```

### PropsProvider.check() Mechanism

**File**: `src/core/props.provider.ts`

```typescript
check(newProps?: any): boolean {
  const wasDirty = this.isDirty;
  
  if (newProps) {
    // Compare each prop
    const hasChanges = Object.keys(newProps).some(key => {
      return this.props[key] !== newProps[key];
    });
    
    if (hasChanges) {
      this.props = newProps;
      this.isDirty = true;
    }
  }
  
  // Reset dirty flag and return if was dirty
  if (wasDirty) {
    this.isDirty = false;
    return true;
  }
  
  return false;
}
```

**Key Features**:
- **Shallow Comparison**: Only checks reference equality
- **Dirty Flag**: Tracks if props have changed since last check
- **Reset on Check**: Flag is reset after `shouldComponentUpdate`

### State Comparison Logic

```typescript
const stateChanged = Object.keys(nextState).some(k => {
  return k !== 'props' && (this.state as any)[k] !== (nextState as any)[k];
});
```

**Why exclude 'props'?**
- The `props` property in state is managed by PropsProvider
- Already checked via `propertyProvider.check()`
- Avoids double-checking

### When Components Re-render

| Scenario | Props Changed | State Changed | Re-render? |
|----------|--------------|---------------|------------|
| Parent re-renders, same props | No | No | **No** ✓ |
| Parent passes new prop value | Yes | No | **Yes** |
| Component calls updateState | No | Yes | **Yes** |
| Both props and state change | Yes | Yes | **Yes** |
| PropsProvider dirty flag set | Yes | No | **Yes** |

### Overriding shouldComponentUpdate

For custom optimization logic:

```typescript
export default class WmCustomWidget extends BaseComponent {
  shouldComponentUpdate(nextProps: WmCustomWidgetProps, nextState: WmCustomWidgetState) {
    // Custom logic
    if (this.props.expensiveData === nextProps.expensiveData) {
      return false; // Skip render if expensive data unchanged
    }
    
    // Fall back to default logic
    return super.shouldComponentUpdate(nextProps, nextState);
  }
}
```

**Use cases**:
- Deep comparison for complex props
- Skip renders for specific prop combinations
- Optimize high-frequency updates

---

## Render Count Analysis

Understanding how many times components render helps identify performance issues.

### Tracking Renders

Add render counting in development:

```typescript
export default class WmMyWidget extends BaseComponent {
  private renderCount = 0;

  render() {
    if (__DEV__) {
      this.renderCount++;
      console.log(`${this.props.name || this.props.id} rendered ${this.renderCount} times`);
    }
    
    return super.render();
  }
}
```

### Typical Render Counts

| Component Type | Expected Renders | Notes |
|----------------|------------------|-------|
| Static Widget | 1-2 | Initial + theme change |
| Data Widget | 3-5 | Initial + data loads |
| Form Input | 5-10 | Each keystroke triggers render |
| List Item | 1-2 per item | Optimized via FlatList |
| Container | 2-3 | Initial + children updates |
| Page Component | 2-4 | Navigation + data loading |

### High Render Count Indicators

**Warning signs**:
- Input components rendering > 20 times during typing
- Static widgets rendering > 5 times
- List items rendering on every scroll
- Entire page re-rendering on single widget update

### Analyzing Render Performance

Using React DevTools Profiler:

```typescript
import { Profiler } from 'react';

renderWidget(props: T) {
  return (
    <Profiler 
      id={this.props.name || 'unnamed'}
      onRender={(id, phase, actualDuration) => {
        if (actualDuration > 16) { // > 1 frame at 60fps
          console.warn(`Slow render: ${id} took ${actualDuration}ms`);
        }
      }}>
      {/* Your component content */}
    </Profiler>
  );
}
```

---

## Memoization Patterns

Memoization prevents expensive recalculations and reduces renders.

### WmMemo Component

The `WmMemo` component provides selective re-rendering based on watched expressions.

**File**: `src/runtime/memo.component.tsx`

```typescript
<WmMemo watcher={this.watcher} render={(watch) => {
  const value = watch(() => this.Variables.myVariable.dataSet);
  
  return <Text>{value}</Text>;
}} />
```

**Benefits**:
- Only re-renders when watched value changes
- Isolates expensive renders
- Reduces cascading updates

### Fragment Memoization

Fragments use a `_memoize` cache for expensive computations.

**File**: `src/runtime/base-fragment.component.tsx`

```typescript
export class BaseFragment {
  private _memoize = new Map<string, any>();

  memoize(key: string, fn: Function) {
    if (!this._memoize.has(key)) {
      this._memoize.set(key, fn());
    }
    return this._memoize.get(key);
  }

  clearMemoizeCache() {
    this._memoize.clear();
  }
}
```

**Usage**:
```typescript
// In page/partial component
const expensiveResult = this.memoize('calculation', () => {
  return this.Variables.items.dataSet
    .filter(item => item.active)
    .map(item => item.value * 2)
    .reduce((a, b) => a + b, 0);
});
```

**When to use**:
- Expensive calculations
- Data transformations
- Filtered/sorted lists
- Computed properties

### React.memo for Functional Components

Functional components can use `React.memo`:

```typescript
const OptimizedComponent = React.memo((props) => {
  return <View>{props.data}</View>;
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip render)
  return prevProps.data === nextProps.data;
});
```

### useMemo Hook

For expensive computations within functional components:

```typescript
const MyComponent = (props) => {
  const expensiveValue = useMemo(() => {
    return props.items
      .filter(i => i.active)
      .map(i => i.value)
      .reduce((a, b) => a + b, 0);
  }, [props.items]); // Only recalculate when items change
  
  return <Text>{expensiveValue}</Text>;
};
```

### useCallback Hook

Memoize callback functions to prevent child re-renders:

```typescript
const ParentComponent = () => {
  const [count, setCount] = useState(0);
  
  // Without useCallback, this creates new function on every render
  const handlePress = useCallback(() => {
    console.log('Button pressed');
  }, []); // Empty deps = never recreate
  
  return <ChildButton onPress={handlePress} />;
};
```

---

## Watch Expression Optimization

Watch expressions enable reactive data binding but can impact performance if overused.

### Watcher Performance

**File**: `src/runtime/watcher.ts`

Each `WatchExpression` tracks execution time:

```typescript
class WatchExpression {
  private lastExecutionTime = 0;

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

### Performance Monitoring

Add monitoring for slow watchers:

```typescript
export class Watcher {
  check() {
    this.expressions.forEach(expr => {
      const startTime = Date.now();
      expr.check();
      const duration = Date.now() - startTime;
      
      if (duration > 16) { // > 1 frame
        console.warn(`Slow watcher: ${expr.fn.toString().slice(0, 50)} took ${duration}ms`);
      }
    });
    
    this.children.forEach(c => c.check());
  }
}
```

### Watch Expression Best Practices

**DO**:
```typescript
// ✓ Watch specific properties
watch(() => this.Variables.user.dataSet.name)

// ✓ Watch computed simple values
watch(() => this.Variables.items.dataSet.length)

// ✓ Memoize complex expressions
const filtered = this.memoize('filtered', () => 
  this.Variables.items.dataSet.filter(i => i.active)
);
watch(() => filtered)
```

**DON'T**:
```typescript
// ✗ Watch entire large objects
watch(() => this.Variables.largeDataSet.dataSet) // Deep comparison expensive!

// ✗ Watch expressions that create new objects
watch(() => ({ 
  items: this.Variables.items.dataSet 
})) // Always different reference!

// ✗ Watch with expensive computations
watch(() => 
  this.Variables.items.dataSet
    .filter(i => i.active)
    .map(i => expensiveTransform(i))
) // Runs on every check!
```

### Watcher Hierarchy Optimization

Keep watcher trees shallow:

```
Good: Flat structure
└── App Watcher
    ├── Widget1 Watcher
    ├── Widget2 Watcher
    └── Widget3 Watcher

Bad: Deep nesting
└── App Watcher
    └── Page Watcher
        └── Container Watcher
            └── List Watcher
                └── Item Watcher (×100)
```

**Why?**
- `check()` recursively calls all children
- Deep trees = more traversal overhead
- Flat trees = faster checks

---

## Render Batching

React batches state updates to optimize rendering.

### Automatic Batching

React automatically batches updates in:
- Event handlers
- Lifecycle methods
- Promises (React 18+)

```typescript
handlePress = () => {
  // These are batched into single render
  this.updateState({ count: 1 });
  this.updateState({ name: 'test' });
  this.updateState({ active: true });
  
  // Only 1 render, not 3!
}
```

### updateState Batching

`BaseComponent.updateState` uses `setTimeout` for batching:

```typescript
updateState(newPartialState: S, callback?: () => void) {
  if (!this.initialized) {
    Object.assign(this.state, newPartialState);
    callback && callback();
  } else {
    const timeout = setTimeout(() => {
      this.setState(newPartialState as any, callback);
    }, 0);
    this.updateStateTimeouts.push(timeout);
  }
}
```

**How it works**:
1. Multiple `updateState` calls create multiple `setTimeout(0)`
2. All timeouts execute in same event loop tick
3. React batches all `setState` calls
4. Single render with combined state changes

### Manual Batching with unstable_batchedUpdates

For non-batched contexts (timers, network callbacks):

```typescript
import { unstable_batchedUpdates } from 'react-native';

fetchData().then(data => {
  unstable_batchedUpdates(() => {
    this.updateState({ data });
    this.updateState({ loading: false });
    this.updateState({ error: null });
  });
  // Single render instead of 3
});
```

---

## Best Practices

### 1. Minimize Prop Drilling

**Bad**:
```typescript
<Parent prop1={a} prop2={b} prop3={c} prop4={d} prop5={e}>
  <Middle prop1={a} prop2={b} prop3={c} prop4={d} prop5={e}>
    <Child prop1={a} prop2={b} prop3={c} prop4={d} prop5={e} />
  </Middle>
</Parent>
```

**Good**:
```typescript
<Parent>
  <Middle>
    <Child /> {/* Access via context or fragment reference */}
  </Middle>
</Parent>
```

### 2. Use Keys in Lists

**Bad**:
```typescript
{items.map((item, index) => (
  <WmListItem key={index} item={item} /> // Index as key
))}
```

**Good**:
```typescript
{items.map(item => (
  <WmListItem key={item.id} item={item} /> // Unique ID as key
))}
```

### 3. Avoid Inline Functions

**Bad**:
```typescript
<WmButton onTap={() => this.handleTap(item.id)} />
// New function on every render
```

**Good**:
```typescript
handleTap = (id: string) => {
  // Handler logic
}

render() {
  return <WmButton onTap={() => this.handleTap(this.props.item.id)} />
}

// Or even better with binding
<WmButton onTap={this.handleTap.bind(this, item.id)} />
```

### 4. Avoid Inline Object/Array Creation

**Bad**:
```typescript
<WmContainer styles={{ root: { padding: 10 } }} />
// New object every render
```

**Good**:
```typescript
const containerStyles = { root: { padding: 10 } };

<WmContainer styles={containerStyles} />
// Same reference every render
```

### 5. Use shouldComponentUpdate Wisely

**Good pattern**:
```typescript
shouldComponentUpdate(nextProps: T, nextState: S) {
  // Only re-render if these specific props change
  return (
    this.props.data !== nextProps.data ||
    this.props.isLoading !== nextProps.isLoading
  );
}
```

### 6. Measure Before Optimizing

```typescript
// Add performance markers
const start = performance.now();
this.expensiveOperation();
const duration = performance.now() - start;

if (duration > 16) {
  console.warn(`Slow operation: ${duration}ms`);
}
```

### 7. Profile in Production Mode

Development mode has extra overhead. Always profile in production:

```bash
# Build release mode
npm run build:release

# Test performance
npx react-native run-android --variant=release
```

---

## Performance Checklist

Use this checklist to optimize component rendering:

- [ ] Implement `shouldComponentUpdate` for expensive components
- [ ] Use `WmMemo` for selective re-rendering
- [ ] Memoize expensive computations with `memoize()`
- [ ] Avoid creating new objects/arrays in render
- [ ] Use proper keys in lists
- [ ] Minimize watch expression complexity
- [ ] Keep watcher hierarchy shallow
- [ ] Batch state updates
- [ ] Clean up subscriptions and timers
- [ ] Profile with React DevTools
- [ ] Test in production mode
- [ ] Monitor render counts in development

---

## Debugging Render Issues

### Enable Render Logging

```typescript
export default class WmWidget extends BaseComponent {
  componentDidUpdate(prevProps: T, prevState: S) {
    if (__DEV__) {
      const changedProps = Object.keys(this.props).filter(
        key => prevProps[key] !== this.props[key]
      );
      const changedState = Object.keys(this.state).filter(
        key => prevState[key] !== this.state[key]
      );
      
      console.log(`[${this.props.name}] Re-rendered`);
      console.log('  Props changed:', changedProps);
      console.log('  State changed:', changedState);
    }
  }
}
```

### Use Why Did You Render

Install and configure:

```bash
npm install @welldone-software/why-did-you-render
```

```typescript
import whyDidYouRender from '@welldone-software/why-did-you-render';

if (__DEV__) {
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}

// Mark components for tracking
WmButton.whyDidYouRender = true;
```

---

## Summary

Effective render optimization requires:

- **Understanding render triggers**: Props, state, parent, context
- **Smart shouldComponentUpdate**: Prevent unnecessary re-renders
- **Memoization**: Cache expensive computations
- **Watch optimization**: Keep expressions simple and fast
- **Batching**: Leverage React's automatic batching
- **Measurement**: Profile before optimizing
- **Best practices**: Avoid common anti-patterns

Follow these guidelines to build high-performance, responsive React Native applications with WaveMaker.

