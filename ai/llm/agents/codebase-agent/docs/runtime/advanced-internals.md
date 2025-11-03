# Advanced Runtime Internals

This document covers advanced internal mechanisms of the WaveMaker React Native runtime, including memoization, reactive watchers, state management, and property systems.

## Table of Contents

1. [WmMemo Component](#wmmemo-component)
2. [Watcher System](#watcher-system)
3. [State Update Mechanism](#state-update-mechanism)
4. [Timeout Management](#timeout-management)
5. [PropsProvider Internals](#propsprovider-internals)

---

## WmMemo Component

The `WmMemo` component is a specialized React component designed for efficient memoization and reactive rendering. It re-renders only when its watched expressions change.

### Architecture

**File**: `src/runtime/memo.component.tsx`

```typescript
export interface MemoProps {
  watcher: Watcher;
  render: (watch: Function) => React.ReactNode;
}

export interface MemoState {
  id: number;
}
```

### How It Works

1. **Initialization**: Creates a child `Watcher` instance from the parent watcher
2. **Render Tracking**: The `render` prop receives a `watch` function
3. **Change Detection**: When watched expressions change, the watcher triggers a re-render
4. **State Increment**: Re-renders are triggered by incrementing the `id` in state

### Key Methods

#### `constructor(props: MemoProps)`

```typescript
constructor(props: MemoProps) {
  super(props);
  this.state = { id: 1 };
  this.watcher = props.watcher.create();
  this.watcher.subscribe((o: any, n: any) => this.refresh());
}
```

Creates a child watcher and subscribes to changes.

#### `shouldComponentUpdate(nextProps: MemoProps, nextState: MemoState)`

```typescript
shouldComponentUpdate(nextProps: MemoProps, nextState: MemoState) {
  return Object.keys(nextProps).some((k: any) => {
    return k !== 'render' && nextProps[k] !== this.props[k];
  }) || this.state.id !== nextState.id;
}
```

Only re-renders when:
- Non-render props change
- Internal `id` state changes (triggered by watcher)

#### `refresh()`

```typescript
refresh = () => {
  this.setState({ id: this.state.id + 1 });
}
```

Increments the `id` to force a re-render.

#### `watch(fn: Function)`

```typescript
watch = (fn: Function) => {
  return this.watcher.watch(fn);
}
```

Registers an expression to watch and returns its current value.

### Usage Example

From `src/runtime/App.tsx`:

```typescript
renderDialogs(): ReactNode {
  return <WmMemo watcher={this.watcher} render={(watch) => {
    // Watch the last modal in the stack
    watch(() => last(AppModalService.modalsOpened)?.content);
    
    this.modalsOpened = AppModalService.modalsOpened.length;
    AppModalService.animatedRefs.length = 0;
    
    return (
      <>
        {AppModalService.modalOptions.content &&
          AppModalService.modalsOpened.map((o, i) => (
            // Render modal content
          ))
        }
      </>
    );
  }} />
}
```

### Performance Benefits

- **Selective Re-rendering**: Only re-renders when watched data changes
- **Granular Updates**: Multiple `WmMemo` components can watch different parts of state
- **Avoids Full Tree Re-renders**: Updates are isolated to memo boundaries

---

## Watcher System

The Watcher system provides a reactive observation mechanism for tracking changes in expressions and triggering callbacks.

### Architecture

**File**: `src/runtime/watcher.ts`

### Core Classes

#### `WatchExpression`

Represents a single watched expression.

```typescript
class WatchExpression {
  private lastValue: any;
  private lastExecutionTime = 0;

  constructor(
    private fn: Function,
    private onChange: (prev: any, now: any) => any
  ) {}

  check() {
    const now = this.fn();
    if (!isEqual(this.lastValue, now)) {
      const prev = this.lastValue;
      this.lastValue = now;
      this.onChange(prev, now);
    }
  }
}
```

**Key Features**:
- Executes the function and compares with previous value
- Uses `isEqual` for deep comparison
- Triggers `onChange` callback only on actual changes
- Tracks execution time for performance monitoring

#### `Watcher`

Manages multiple watch expressions in a hierarchical structure.

```typescript
export class Watcher {
  public static ROOT = new Watcher();
  
  private expressions: WatchExpression[] = [];
  private children: Watcher[] = [];
  private parent: Watcher | null = null;
  private subscriptions: Function[] = [];

  // Check all expressions and children
  check() {
    this.expressions.forEach(e => e.check());
    this.children.forEach(c => c.check());
  }

  // Create a child watcher
  create(): Watcher {
    const child = new Watcher();
    child.parent = this;
    this.children.push(child);
    return child;
  }

  // Register a watch expression
  watch(fn: Function, onChange?: (prev: any, now: any) => any): any {
    const expr = new WatchExpression(fn, onChange || (() => {}));
    this.expressions.push(expr);
    return expr.check();
  }

  // Clean up
  destroy() {
    this.expressions.length = 0;
    this.children.forEach(c => c.destroy());
    this.children.length = 0;
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index >= 0) {
        this.parent.children.splice(index, 1);
      }
    }
  }
}
```

### Hierarchical Structure

```
Watcher.ROOT
  ├── App Watcher
  │   ├── Page Watcher
  │   │   ├── Widget Watcher
  │   │   └── Widget Watcher
  │   └── Partial Watcher
  └── Another App Context
```

### Change Detection Algorithm

1. **Execute Expression**: Call the watched function
2. **Deep Compare**: Use `isEqual` to compare new value with last value
3. **Trigger Callback**: If different, call `onChange` with prev and new values
4. **Update Cache**: Store new value as `lastValue`

### Performance Tracking

Each `WatchExpression` tracks `lastExecutionTime` to identify slow expressions:

```typescript
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
```

### Integration with React Hooks

The `useWatcher` hook integrates the watcher system with functional components:

```typescript
export const useWatcher = (parent: Watcher) => {
  const [, setState] = useState(0);
  const watcherRef = useRef<Watcher>();

  if (!watcherRef.current) {
    const watcher = parent.create();
    watcher.subscribe(() => {
      setState(s => s + 1);
    });
    watcherRef.current = watcher;
  }

  useEffect(() => {
    return () => {
      watcherRef.current?.destroy();
    };
  }, []);

  return watcherRef.current;
};
```

### Usage Patterns

#### Basic Watch

```typescript
watcher.watch(() => someVariable.value, (prev, now) => {
  console.log(`Value changed from ${prev} to ${now}`);
});
```

#### Watch in Render

```typescript
<WmMemo watcher={parentWatcher} render={(watch) => {
  const value = watch(() => computeExpensiveValue());
  return <Text>{value}</Text>;
}} />
```

#### Fragment Watch

```typescript
this.watch('variable1', (newVal, oldVal) => {
  // Handle variable change
}, {});
```

---

## State Update Mechanism

The state update mechanism in `BaseComponent` provides debounced, batched updates to optimize performance.

### Architecture

**File**: `src/core/base.component.tsx`

```typescript
export abstract class BaseComponent<T, S, L> extends React.Component<T, S> {
  public updateStateTimeouts: NodeJS.Timeout[] = [];
  
  updateState(newPartialState: S, callback?: () => void) {
    if (!this.initialized) {
      // Before initialization: immediate update
      Object.assign(this.state, newPartialState);
      callback && callback();
    } else {
      // After initialization: debounced update
      const timeout = setTimeout(() => {
        this.setState(newPartialState as any, callback);
      }, 0);
      this.updateStateTimeouts.push(timeout);
    }
  }
}
```

### How It Works

#### Pre-Initialization Phase

When `initialized = false`:
- State updates are synchronous
- Direct assignment to `this.state`
- No React re-render triggered
- Used during constructor and initial setup

#### Post-Initialization Phase

When `initialized = true`:
- State updates are asynchronous via `setTimeout`
- Batched by React's event loop
- Re-renders are scheduled
- Timeouts are tracked for cleanup

### Debouncing Benefits

1. **Batching**: Multiple `updateState` calls in same tick are batched
2. **Performance**: Reduces number of re-renders
3. **Race Condition Prevention**: Ensures proper order of updates
4. **React Compatibility**: Aligns with React's update cycle

### Timeout Tracking

```typescript
public updateStateTimeouts: NodeJS.Timeout[] = [];
```

**Purpose**:
- Track all pending state update timeouts
- Enable cleanup on component unmount
- Prevent memory leaks from orphaned timers

**Cleanup**:
```typescript
componentWillUnmount() {
  // Clear all pending timeouts
  this.updateStateTimeouts.forEach(timeout => clearTimeout(timeout));
  this.updateStateTimeouts.length = 0;
}
```

### State Comparison in shouldComponentUpdate

```typescript
shouldComponentUpdate(nextProps: T, nextState: S, nextContext: any) {
  // Check if props changed (via PropsProvider)
  const propsChanged = this.propertyProvider.check(nextProps);
  
  // Check if state changed (excluding 'props' property)
  const stateChanged = Object.keys(nextState).some(k => {
    return k !== 'props' && (this.state as any)[k] !== (nextState as any)[k];
  });
  
  return propsChanged || stateChanged;
}
```

**Key Points**:
- Props checked via `propertyProvider.check()`
- State compared key-by-key
- `props` property excluded (managed by PropsProvider)
- Shallow comparison for performance

### Best Practices

**DO**:
```typescript
// Use updateState for component state
this.updateState({ isLoading: true });

// Chain callbacks if needed
this.updateState({ data: newData }, () => {
  console.log('State updated');
});
```

**DON'T**:
```typescript
// Don't use setState directly
this.setState({ isLoading: true }); // AVOID

// Don't modify state directly
this.state.isLoading = true; // WRONG
```

---

## Timeout Management

Timeout management is critical for preventing memory leaks and ensuring proper cleanup.

### Timeout Arrays

Each `BaseComponent` maintains an array of timeouts:

```typescript
public updateStateTimeouts: NodeJS.Timeout[] = [];
```

### Registration

Timeouts are automatically registered when using `updateState`:

```typescript
updateState(newPartialState: S, callback?: () => void) {
  const timeout = setTimeout(() => {
    this.setState(newPartialState as any, callback);
  }, 0);
  this.updateStateTimeouts.push(timeout);
}
```

### Cleanup

Automatic cleanup happens in `componentWillUnmount`:

```typescript
componentWillUnmount() {
  // Clear state update timeouts
  this.updateStateTimeouts.forEach(t => clearTimeout(t));
  this.updateStateTimeouts.length = 0;
  
  // Other cleanup
  this.cleanup.forEach(fn => fn());
  this.notifier.destroy();
  this.propertyProvider.destroy();
}
```

### Manual Timeout Management

For custom timeouts, use the `cleanup` array:

```typescript
constructor(props: T) {
  super(props);
  
  const timeout = setTimeout(() => {
    // Do something
  }, 1000);
  
  // Register for cleanup
  this.cleanup.push(() => clearTimeout(timeout));
}
```

### Common Timeout Patterns

#### Debounced Input

```typescript
private inputTimeout: NodeJS.Timeout | null = null;

handleInput(value: string) {
  if (this.inputTimeout) {
    clearTimeout(this.inputTimeout);
  }
  
  this.inputTimeout = setTimeout(() => {
    this.processInput(value);
  }, 300);
  
  this.cleanup.push(() => {
    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
    }
  });
}
```

#### Delayed Action

```typescript
componentDidMount() {
  const timeout = setTimeout(() => {
    this.updateState({ ready: true });
  }, 500);
  
  this.cleanup.push(() => clearTimeout(timeout));
}
```

---

## PropsProvider Internals

The `PropsProvider` class uses JavaScript Proxy to intercept property access and track changes.

### Architecture

**File**: `src/core/props.provider.ts`

```typescript
export class PropsProvider<T extends BaseProps> {
  private props: any = {};
  private isDirty = false;
  private onChange: Function;
  public proxy: any;

  constructor(
    private defaultValues: any,
    private overrideValues: any,
    onChange: Function
  ) {
    this.onChange = onChange;
    this.proxy = new Proxy(this, {
      get: this.getter.bind(this),
      set: this.setter.bind(this)
    });
  }
}
```

### Proxy Getter Logic

```typescript
private getter(target: any, prop: string) {
  // Return from override values first
  if (prop in this.overrideValues && this.overrideValues[prop] !== undefined) {
    return this.overrideValues[prop];
  }
  
  // Then from cached props
  if (prop in this.props) {
    return this.props[prop];
  }
  
  // Finally from defaults
  if (prop in this.defaultValues) {
    return this.defaultValues[prop];
  }
  
  return undefined;
}
```

**Resolution Order**:
1. Override values (runtime changes)
2. Cached props (current values)
3. Default values (component defaults)

### Proxy Setter Logic

```typescript
private setter(target: any, prop: string, value: any) {
  const oldValue = this.proxy[prop];
  
  if (oldValue !== value) {
    this.overrideValues[prop] = value;
    this.isDirty = true;
    
    if (this.onChange) {
      this.onChange(prop, value, oldValue);
    }
  }
  
  return true;
}
```

**Behavior**:
- Stores in `overrideValues`
- Marks provider as dirty
- Triggers `onChange` callback
- Enables change detection

### Change Detection

```typescript
check(newProps?: any): boolean {
  const wasDirty = this.isDirty;
  
  if (newProps) {
    // Check if any props changed
    const hasChanges = Object.keys(newProps).some(key => {
      return this.props[key] !== newProps[key];
    });
    
    if (hasChanges) {
      this.props = newProps;
      this.isDirty = true;
    }
  }
  
  if (wasDirty) {
    this.isDirty = false;
    return true;
  }
  
  return false;
}
```

**Used in `shouldComponentUpdate`**:
```typescript
shouldComponentUpdate(nextProps: T, nextState: S) {
  const propsChanged = this.propertyProvider.check(nextProps);
  // ... state comparison
  return propsChanged || stateChanged;
}
```

### Benefits of Proxy Pattern

1. **Transparent Access**: Components use props naturally
2. **Change Tracking**: Automatic detection of property changes
3. **Default Values**: Seamless fallback to defaults
4. **Runtime Override**: Dynamic property modification
5. **Performance**: Only re-render when props actually change

### Usage Example

```typescript
// In BaseComponent constructor
this.propertyProvider = new PropsProvider(
  defaultProps,
  markupProps,
  (prop, newVal, oldVal) => {
    console.log(`Property ${prop} changed from ${oldVal} to ${newVal}`);
  }
);

// Access via proxy
const value = this.propertyProvider.proxy.someProp;

// Set via proxy
this.propertyProvider.proxy.someProp = newValue;
```

### Memory Management

```typescript
destroy() {
  this.props = null;
  this.defaultValues = null;
  this.overrideValues = null;
  this.onChange = null as any;
  this.proxy = null;
}
```

Called in `componentWillUnmount` to free memory.

---

## Summary

The advanced internals of WaveMaker RN Runtime provide:

- **WmMemo**: Efficient selective re-rendering via watched expressions
- **Watcher System**: Reactive data binding with hierarchical observation
- **State Updates**: Debounced updates with timeout management
- **Timeout Tracking**: Automatic cleanup to prevent memory leaks
- **PropsProvider**: Proxy-based property system with change detection

These mechanisms work together to provide a high-performance, reactive UI framework with automatic memory management and optimized rendering.

