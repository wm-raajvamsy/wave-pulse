# Proxy System Implementation

This document provides detailed coverage of the proxy pattern implementation in WaveMaker React Native, including component proxies, PropsProvider proxies, and their performance implications.

## Table of Contents

1. [Proxy Pattern Overview](#proxy-pattern-overview)
2. [Component Proxy](#component-proxy)
3. [PropsProvider Proxy](#propsprovider-proxy)
4. [Getter Logic](#getter-logic)
5. [Setter Logic](#setter-logic)
6. [Change Detection](#change-detection)
7. [Performance Impact](#performance-impact)
8. [Best Practices](#best-practices)

---

## Proxy Pattern Overview

JavaScript Proxy objects intercept and customize operations on target objects, enabling powerful patterns like property access tracking, validation, and change detection.

### Why Proxies in WaveMaker?

**Benefits**:
1. **Transparent Access**: Components use properties naturally
2. **Change Tracking**: Automatic detection of property changes
3. **Default Values**: Seamless fallback mechanism
4. **Runtime Override**: Dynamic property modification
5. **Lazy Evaluation**: Compute values only when accessed

### Proxy Basics

```typescript
// Basic proxy example
const target = { x: 1, y: 2 };

const handler = {
  get(target: any, prop: string) {
    console.log(`Getting ${prop}`);
    return target[prop];
  },
  
  set(target: any, prop: string, value: any) {
    console.log(`Setting ${prop} = ${value}`);
    target[prop] = value;
    return true;
  }
};

const proxy = new Proxy(target, handler);

proxy.x;           // Logs: "Getting x", returns 1
proxy.y = 3;       // Logs: "Setting y = 3"
```

### Proxy in WaveMaker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                PROXY ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Component Instance                                          │
│  ├─→ proxy: BaseComponent (self-reference)                  │
│  └─→ propertyProvider: PropsProvider                        │
│      ├─→ proxy: Proxy Object                                │
│      ├─→ defaultValues: {}                                  │
│      ├─→ overrideValues: {}                                 │
│      ├─→ props: {}                                           │
│      └─→ onChange: Function                                  │
│                                                              │
│  Access Flow:                                                │
│  component.props.caption                                     │
│    └─→ propertyProvider.proxy.caption                       │
│        └─→ getter trap                                       │
│            ├─→ Check overrideValues                          │
│            ├─→ Check props                                   │
│            └─→ Check defaultValues                           │
│                                                              │
│  Update Flow:                                                │
│  component.props.caption = 'New'                             │
│    └─→ propertyProvider.proxy.caption = 'New'               │
│        └─→ setter trap                                       │
│            ├─→ Store in overrideValues                       │
│            ├─→ Mark as dirty                                 │
│            └─→ Trigger onChange callback                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Proxy

Components have a `proxy` property that references themselves, enabling indirect access patterns.

### Component Proxy Implementation

**File**: `src/core/base.component.tsx`

```typescript
export abstract class BaseComponent<T, S, L> extends React.Component<T, S> {
  public proxy: BaseComponent<T, S, L>;
  public _INSTANCE: BaseComponent<T, S, L>;

  constructor(markupProps: T, defaultClass: string, ...) {
    super(markupProps, defaultClass, defaultProps, defaultState);
    
    // Self-reference for indirect access
    this.proxy = this;
    this._INSTANCE = this;
  }
}
```

### Component Proxy Usage

#### Indirect Component Access

```typescript
export default class WmButton extends BaseComponent {
  // Direct access
  handleDirectTap() {
    this.updateState({ pressed: true });
  }

  // Indirect access via proxy
  handleProxyTap() {
    this.proxy.updateState({ pressed: true });
    // Same as this.updateState()
  }
}
```

#### Widget References

```typescript
export default class MyPage extends BasePage {
  Widgets = {
    submitButton: null as WmButton | null,
    nameInput: null as WmText | null
  };

  onReady() {
    // Widgets are assigned proxy references
    this.Widgets.submitButton = button.proxy;
    this.Widgets.nameInput = input.proxy;
  }

  handleSubmit() {
    // Access via proxy
    const name = this.Widgets.nameInput?.props.datavalue;
    this.Widgets.submitButton?.proxy.updateState({ disabled: true });
  }
}
```

### Component Proxy Benefits

1. **Consistent Interface**: Always access via same pattern
2. **Reference Stability**: Proxy reference remains stable
3. **Indirection Layer**: Can intercept if needed
4. **Widget Access**: Standard way to reference widgets

---

## PropsProvider Proxy

The `PropsProvider` uses JavaScript Proxy to intercept property access and provide a sophisticated property resolution system.

### PropsProvider Architecture

**File**: `src/core/props.provider.ts`

```typescript
export class PropsProvider<T extends BaseProps> {
  private props: any = {};                    // Current props from React
  private defaultValues: any;                  // Component defaults
  private overrideValues: any;                 // Runtime overrides
  private isDirty = false;                     // Change detection flag
  private onChange: Function;                  // Change callback
  public proxy: any;                           // Proxy object

  constructor(
    defaultValues: any,
    overrideValues: any,
    onChange: Function
  ) {
    this.defaultValues = defaultValues;
    this.overrideValues = overrideValues;
    this.onChange = onChange;
    
    // Create proxy with custom handlers
    this.proxy = new Proxy(this, {
      get: this.getter.bind(this),
      set: this.setter.bind(this)
    });
  }

  private getter(target: any, prop: string) {
    // Custom get logic (see Getter Logic section)
  }

  private setter(target: any, prop: string, value: any) {
    // Custom set logic (see Setter Logic section)
  }
}
```

### Three-Tier Property System

```
┌─────────────────────────────────────────────────────────────┐
│           THREE-TIER PROPERTY RESOLUTION                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Access: component.props.caption                             │
│                                                              │
│  Resolution Order:                                           │
│                                                              │
│  1. Override Values (Highest Priority)                       │
│     ├─→ Runtime modifications                                │
│     ├─→ Dynamic property changes                             │
│     └─→ User interactions                                    │
│                                                              │
│  2. Props (Medium Priority)                                  │
│     ├─→ Current React props                                  │
│     ├─→ Parent-provided values                               │
│     └─→ Markup attributes                                    │
│                                                              │
│  3. Default Values (Lowest Priority)                         │
│     ├─→ Component defaults                                   │
│     ├─→ Type defaults                                        │
│     └─→ Fallback values                                      │
│                                                              │
│  Example:                                                    │
│  defaultValues.caption = 'Default'                           │
│  props.caption = 'From Markup'                               │
│  overrideValues.caption = 'Runtime'                          │
│                                                              │
│  Result: component.props.caption → 'Runtime'                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Getter Logic

The getter trap intercepts property access and implements the resolution order.

### Getter Implementation

```typescript
private getter(target: any, prop: string): any {
  // Priority 1: Override values (runtime changes)
  if (prop in this.overrideValues && this.overrideValues[prop] !== undefined) {
    return this.overrideValues[prop];
  }
  
  // Priority 2: Current props (from React)
  if (prop in this.props) {
    return this.props[prop];
  }
  
  // Priority 3: Default values (component defaults)
  if (prop in this.defaultValues) {
    return this.defaultValues[prop];
  }
  
  // Not found
  return undefined;
}
```

### Getter Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  GETTER EXECUTION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Access: proxy.someProperty                                  │
│  │                                                           │
│  ├─→ Check overrideValues[someProperty]                     │
│  │   ├─→ Exists and !== undefined?                          │
│  │   │   └─→ YES: Return overrideValues[someProperty] ✓     │
│  │   └─→ NO: Continue                                       │
│  │                                                           │
│  ├─→ Check props[someProperty]                              │
│  │   ├─→ Exists?                                            │
│  │   │   └─→ YES: Return props[someProperty] ✓             │
│  │   └─→ NO: Continue                                       │
│  │                                                           │
│  ├─→ Check defaultValues[someProperty]                      │
│  │   ├─→ Exists?                                            │
│  │   │   └─→ YES: Return defaultValues[someProperty] ✓     │
│  │   └─→ NO: Continue                                       │
│  │                                                           │
│  └─→ Return undefined                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Getter Examples

```typescript
// Example 1: Default value
const provider = new PropsProvider(
  { caption: 'Default Caption' },  // defaultValues
  {},                               // overrideValues
  () => {}                          // onChange
);

console.log(provider.proxy.caption); // 'Default Caption'

// Example 2: Props override default
provider.check({ caption: 'Props Caption' }); // Set props
console.log(provider.proxy.caption); // 'Props Caption'

// Example 3: Runtime override
provider.proxy.caption = 'Runtime Caption';
console.log(provider.proxy.caption); // 'Runtime Caption'

// Example 4: Priority order
const provider2 = new PropsProvider(
  { color: 'red' },      // defaultValues
  {},                     // overrideValues
  () => {}
);

provider2.check({ color: 'blue' }); // Set props
console.log(provider2.proxy.color); // 'blue' (props > default)

provider2.proxy.color = 'green';    // Runtime override
console.log(provider2.proxy.color); // 'green' (override > props > default)
```

### Special Property Handling

```typescript
// Accessing proxy internals
proxy.defaultValues    // Returns defaultValues object
proxy.overrideValues   // Returns overrideValues object
proxy.props            // Returns props object
proxy.isDirty          // Returns isDirty flag

// These bypass getter logic and access PropsProvider directly
```

---

## Setter Logic

The setter trap intercepts property assignments, stores values, and triggers change detection.

### Setter Implementation

```typescript
private setter(target: any, prop: string, value: any): boolean {
  // Get current value via getter
  const oldValue = this.proxy[prop];
  
  // Check if value actually changed
  if (oldValue !== value) {
    // Store in overrideValues (highest priority)
    this.overrideValues[prop] = value;
    
    // Mark as dirty for change detection
    this.isDirty = true;
    
    // Trigger onChange callback
    if (this.onChange) {
      this.onChange(prop, value, oldValue);
    }
  }
  
  // Always return true (assignment successful)
  return true;
}
```

### Setter Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  SETTER EXECUTION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Assignment: proxy.someProperty = newValue                   │
│  │                                                           │
│  ├─→ Get oldValue via getter                                │
│  │   └─→ oldValue = proxy.someProperty                      │
│  │                                                           │
│  ├─→ Compare: oldValue !== newValue?                        │
│  │   │                                                       │
│  │   ├─→ NO (same value):                                   │
│  │   │   └─→ Skip (no change needed)                        │
│  │   │                                                       │
│  │   └─→ YES (different):                                   │
│  │       │                                                   │
│  │       ├─→ Store in overrideValues                        │
│  │       │   overrideValues[someProperty] = newValue        │
│  │       │                                                   │
│  │       ├─→ Set dirty flag                                 │
│  │       │   isDirty = true                                 │
│  │       │                                                   │
│  │       └─→ Trigger onChange callback                      │
│  │           onChange(prop, newValue, oldValue)             │
│  │           ├─→ Component can react to change              │
│  │           └─→ Schedule re-render if needed               │
│  │                                                           │
│  └─→ Return true (success)                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Setter Examples

```typescript
// Example 1: Basic assignment
const provider = new PropsProvider(
  { caption: 'Default' },
  {},
  (prop, newVal, oldVal) => {
    console.log(`${prop}: ${oldVal} → ${newVal}`);
  }
);

provider.proxy.caption = 'New Caption';
// Logs: "caption: Default → New Caption"
// Sets: overrideValues.caption = 'New Caption'
// Sets: isDirty = true

// Example 2: No change
provider.proxy.caption = 'New Caption';
// No log (value unchanged)
// isDirty remains true (already set)

// Example 3: Multiple assignments
provider.proxy.caption = 'Caption 1';  // isDirty = true
provider.proxy.color = 'red';          // isDirty = true
provider.proxy.size = 'large';         // isDirty = true

// All stored in overrideValues
```

### onChange Callback Usage

```typescript
export abstract class BaseComponent {
  constructor(markupProps: T, defaultClass: string, ...) {
    this.propertyProvider = new PropsProvider(
      defaultProps,
      markupProps,
      (prop: string, newValue: any, oldValue: any) => {
        // Called when property changes
        console.log(`Property ${prop} changed from ${oldValue} to ${newValue}`);
        
        // Can trigger re-render
        if (this.initialized) {
          this.forceUpdate();
        }
        
        // Can invoke callbacks
        if (this.props.onPropertyChange) {
          this.props.onPropertyChange(prop, newValue, oldValue);
        }
      }
    );
  }
}
```

---

## Change Detection

The `isDirty` flag and `check()` method enable efficient change detection.

### isDirty Flag

```typescript
export class PropsProvider<T> {
  private isDirty = false;

  // Setter sets isDirty
  private setter(target: any, prop: string, value: any): boolean {
    const oldValue = this.proxy[prop];
    
    if (oldValue !== value) {
      this.overrideValues[prop] = value;
      this.isDirty = true;  // Mark as dirty
      this.onChange && this.onChange(prop, value, oldValue);
    }
    
    return true;
  }
}
```

### check() Method

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
  
  // Reset dirty flag and return if was dirty
  if (wasDirty) {
    this.isDirty = false;
    return true;
  }
  
  return false;
}
```

### Change Detection in shouldComponentUpdate

```typescript
shouldComponentUpdate(nextProps: T, nextState: S): boolean {
  // Check if props changed via PropsProvider
  const propsChanged = this.propertyProvider.check(nextProps);
  
  // Check if state changed
  const stateChanged = Object.keys(nextState).some(k => {
    return k !== 'props' && (this.state as any)[k] !== (nextState as any)[k];
  });
  
  return propsChanged || stateChanged;
}
```

### Change Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│              CHANGE DETECTION FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Property Assignment                                      │
│     proxy.caption = 'New'                                    │
│     └─→ setter() called                                      │
│         └─→ isDirty = true                                   │
│                                                              │
│  2. React Re-render Triggered                                │
│     componentWillUpdate() or shouldComponentUpdate()         │
│     │                                                        │
│     └─→ propertyProvider.check(nextProps)                   │
│         │                                                    │
│         ├─→ Check: wasDirty?                                │
│         │   ├─→ YES: Reset isDirty, return true            │
│         │   └─→ NO: Continue                                │
│         │                                                    │
│         ├─→ Check: props changed?                           │
│         │   ├─→ YES: Set isDirty, return true              │
│         │   └─→ NO: Return false                            │
│         │                                                    │
│         └─→ Result used in shouldComponentUpdate            │
│                                                              │
│  3. Component Renders                                        │
│     If check() returned true                                 │
│     └─→ render() executes                                    │
│         └─→ Uses latest property values                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Impact

Understanding the performance implications of proxy usage.

### Proxy Overhead

```typescript
class ProxyBenchmark {
  static measureDirectAccess() {
    const obj = { value: 42 };
    
    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {
      const x = obj.value;
    }
    const duration = performance.now() - start;
    
    console.log(`Direct access: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static measureProxyAccess() {
    const obj = { value: 42 };
    const proxy = new Proxy(obj, {
      get(target, prop) {
        return target[prop];
      }
    });
    
    const start = performance.now();
    for (let i = 0; i < 1000000; i++) {
      const x = proxy.value;
    }
    const duration = performance.now() - start;
    
    console.log(`Proxy access: ${duration.toFixed(2)}ms`);
    return duration;
  }

  static compare() {
    const direct = this.measureDirectAccess();
    const proxied = this.measureProxyAccess();
    const overhead = ((proxied - direct) / direct * 100).toFixed(2);
    
    console.log(`Overhead: ${overhead}%`);
  }
}

// Typical results:
// Direct access: 1.5ms
// Proxy access: 3.2ms
// Overhead: ~113% (2x slower)
```

### Performance Characteristics

| Operation | Direct | Proxy | Overhead |
|-----------|--------|-------|----------|
| Property read | ~0.001μs | ~0.003μs | ~200% |
| Property write | ~0.001μs | ~0.004μs | ~300% |
| Method call | ~0.002μs | ~0.005μs | ~150% |

### Mitigation Strategies

#### 1. Cache Frequently Accessed Properties

```typescript
export default class OptimizedComponent extends BaseComponent {
  private captionCache: string | null = null;

  get caption(): string {
    if (this.captionCache === null) {
      this.captionCache = this.props.caption;
    }
    return this.captionCache;
  }

  componentDidUpdate() {
    // Invalidate cache
    this.captionCache = null;
  }
}
```

#### 2. Batch Property Access

```typescript
// Bad: Multiple proxy accesses
const render1 = () => (
  <View>
    <Text>{this.props.caption}</Text>
    <Text>{this.props.caption}</Text>
    <Text>{this.props.caption}</Text>
  </View>
);

// Good: Single access, reuse value
const render2 = () => {
  const caption = this.props.caption;
  return (
    <View>
      <Text>{caption}</Text>
      <Text>{caption}</Text>
      <Text>{caption}</Text>
    </View>
  );
};
```

#### 3. Avoid Proxy in Hot Paths

```typescript
// Bad: Proxy access in tight loop
for (let i = 0; i < items.length; i++) {
  if (items[i].value === this.props.filterValue) {
    // Proxy accessed on every iteration
  }
}

// Good: Access once before loop
const filterValue = this.props.filterValue;
for (let i = 0; i < items.length; i++) {
  if (items[i].value === filterValue) {
    // Direct variable access
  }
}
```

### When Proxy Overhead Matters

**Significant impact**:
- Tight loops (> 1000 iterations)
- High-frequency events (scroll, mouse move)
- Performance-critical paths (animations)

**Negligible impact**:
- Normal component renders
- Event handlers (tap, press)
- Lifecycle methods

---

## Best Practices

### DO

✓ **Use proxy for normal property access**:
```typescript
const caption = this.props.caption;  // Via proxy
```

✓ **Cache in performance-critical code**:
```typescript
const cachedValue = this.props.value;
for (let i = 0; i < 10000; i++) {
  process(cachedValue);  // Use cached value
}
```

✓ **Leverage three-tier resolution**:
```typescript
// Set default
defaultProps.timeout = 5000;

// Override in markup
<WmWidget timeout={3000} />

// Override at runtime
widget.props.timeout = 1000;
```

✓ **Use onChange for side effects**:
```typescript
new PropsProvider(defaults, markup, (prop, newVal, oldVal) => {
  console.log(`${prop} changed`);
  this.forceUpdate();
});
```

### DON'T

✗ **Don't access proxy in tight loops**:
```typescript
// BAD
for (let i = 0; i < 100000; i++) {
  doSomething(this.props.value);
}

// GOOD
const value = this.props.value;
for (let i = 0; i < 100000; i++) {
  doSomething(value);
}
```

✗ **Don't bypass proxy accidentally**:
```typescript
// BAD - bypasses proxy
this.propertyProvider.props.caption = 'New';

// GOOD - uses proxy
this.props.caption = 'New';
```

✗ **Don't rely on proxy for performance-critical operations**:
```typescript
// BAD
animationFrame(() => {
  const x = this.props.x;  // Proxy access every frame
  const y = this.props.y;
  animate(x, y);
});

// GOOD
const x = this.props.x;
const y = this.props.y;
animationFrame(() => {
  animate(x, y);  // Direct variable access
});
```

---

## Summary

The proxy system in WaveMaker provides:

- **Component Proxy**: Self-reference for indirect access patterns
- **PropsProvider Proxy**: Three-tier property resolution (override > props > default)
- **Change Detection**: isDirty flag and check() method
- **Transparent Access**: Properties work naturally despite proxy
- **Flexibility**: Runtime property overrides

Key implementation details:
- Getter: Implements resolution order
- Setter: Stores in overrideValues, marks dirty, triggers onChange
- check(): Used in shouldComponentUpdate for render optimization
- Performance: ~2-3x overhead vs direct access (acceptable for most cases)

Best practices:
- Use proxy for normal access
- Cache in performance-critical code
- Leverage three-tier resolution
- Avoid proxy in tight loops

The proxy pattern enables powerful property management while maintaining clean, intuitive component APIs.

