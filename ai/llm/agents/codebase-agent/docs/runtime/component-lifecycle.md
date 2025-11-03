# Component Lifecycle

## Overview

WaveMaker React Native components follow a well-defined lifecycle from creation to destruction. Understanding this lifecycle is crucial for proper initialization, cleanup, and optimization.

## Lifecycle Phases

```
┌─────────────────────────────────────────────────────────┐
│                  1. CREATION PHASE                       │
│  constructor() → property initialization → proxy setup  │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  2. MOUNTING PHASE                       │
│  render() → componentDidMount() → onComponentInit()     │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  3. UPDATE PHASE                         │
│  prop/state change → onPropertyChange() →               │
│  shouldComponentUpdate() → render() →                   │
│  componentDidUpdate() → onComponentChange()             │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  4. UNMOUNTING PHASE                     │
│  onComponentDestroy() → componentWillUnmount() →        │
│  cleanup() → destroy()                                  │
└─────────────────────────────────────────────────────────┘
```

## Detailed Lifecycle Methods

### Creation Phase

#### `constructor(markupProps, defaultClass, defaultProps?, defaultState?)`

First method called when component is created.

**Responsibilities:**
- Initialize properties via PropsProvider
- Set up proxy object
- Initialize component tree node
- Subscribe to theme changes
- Register cleanup functions

**Example:**

```typescript
constructor(props: ButtonProps) {
  super(props, 'app-button', {
    caption: 'Button',
    type: 'button'
  });
  
  // Additional initialization
  this.handlePress = this.handlePress.bind(this);
}
```

**What NOT to do:**
- ❌ Call setState()
- ❌ Make API calls
- ❌ Access DOM/refs
- ❌ Subscribe to external events

### Mounting Phase

#### `render()`

Called to generate the component's JSX.

**Features:**
- Consumes React contexts (Parent, Theme, Assets, etc.)
- Merges all style layers
- Handles visibility logic
- Calls renderWidget() or renderSkeleton()

**What NOT to do:**
- ❌ Update state
- ❌ Make side effects
- ❌ Override this method (override renderWidget instead)

#### `componentDidMount()`

Called immediately after component is inserted into DOM.

**Use cases:**
- ✅ Make API calls
- ✅ Set up subscriptions
- ✅ Start timers
- ✅ Initialize third-party libraries
- ✅ Trigger lifecycle listener

**Example:**

```typescript
componentDidMount() {
  super.componentDidMount();
  
  // Now safe to use refs, make API calls, etc.
  if (this.props.autoload) {
    this.loadData();
  }
  
  // Subscribe to external events
  this.subscription = eventEmitter.on('event', this.handleEvent);
  
  // Register cleanup
  this.cleanup.push(() => {
    this.subscription.unsubscribe();
  });
}
```

#### `onComponentInit` (Listener Callback)

User-defined callback invoked after mount.

```typescript
<WmButton
  name="button1"
  listener={{
    onComponentInit: (widget) => {
      console.log('Button initialized:', widget.name);
      widget.caption = 'Ready!';
    }
  }}
/>
```

### Update Phase

#### `onPropertyChange(name: string, newValue: any, oldValue: any)`

Called whenever a property changes.

**Use cases:**
- React to specific property changes
- Validate new values
- Trigger side effects
- Update dependent state

**Example:**

```typescript
onPropertyChange(name: string, $new: any, $old: any) {
  if (name === 'dataset') {
    // Dataset changed, reload list
    this.updateState({ items: $new });
  } else if (name === 'disabled') {
    // Disabled state changed
    console.log(`Component is now ${$new ? 'disabled' : 'enabled'}`);
  }
}
```

#### `shouldComponentUpdate(nextProps, nextState, nextContext)`

Determines if component should re-render.

**Default behavior:**
- Check if props changed via PropsProvider
- Check if state changed (excluding props)
- Return true if any changes detected

**Override for optimization:**

```typescript
shouldComponentUpdate(nextProps: T, nextState: S): boolean {
  // Custom optimization logic
  if (this.state.someValue === nextState.someValue) {
    return false; // Skip render
  }
  return super.shouldComponentUpdate(nextProps, nextState);
}
```

#### `render()`

Re-renders the component with new props/state.

#### `componentDidUpdate(prevProps, prevState, snapshot?)`

Called after component updates.

**Use cases:**
- React to prop changes
- Make API calls based on changes
- Update external state

**Example:**

```typescript
componentDidUpdate(prevProps: T, prevState: S) {
  super.componentDidUpdate(prevProps, prevState);
  
  // Check if specific prop changed
  if (prevProps.userId !== this.props.userId) {
    this.loadUserData(this.props.userId);
  }
}
```

#### `onComponentChange` (Listener Callback)

User-defined callback invoked after every update.

```typescript
<WmButton
  listener={{
    onComponentChange: (widget) => {
      console.log('Button changed:', widget.caption);
    }
  }}
/>
```

### Unmounting Phase

#### `onComponentDestroy` (Listener Callback)

First called before unmount.

```typescript
<WmButton
  listener={{
    onComponentDestroy: (widget) => {
      console.log('Button about to be destroyed');
      // Save state, cleanup, etc.
    }
  }}
/>
```

#### `componentWillUnmount()`

Called just before component is removed from DOM.

**Responsibilities:**
- Mark component as destroyed
- Call all registered cleanup functions
- Notify parent of destruction
- Remove from component tree

**Default cleanup (automatic):**
- Unsubscribe from theme changes
- Unsubscribe from accessibility events
- Clear all timeouts
- Destroy event notifier

**Example:**

```typescript
componentWillUnmount() {
  super.componentWillUnmount();
  
  // Additional cleanup
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
}
```

## Custom Lifecycle Hooks

### `componentWillAttach()`

Called before component becomes visible (fixed/sticky components).

```typescript
componentWillAttach() {
  // Component is about to be shown
  this.setState({ hide: false });
}
```

### `componentWillDetach()`

Called before component is hidden (fixed/sticky components).

```typescript
componentWillDetach() {
  // Component is about to be hidden
  this.setState({ hide: true });
}
```

## State Update Methods

### `updateState(newPartialState: S, callback?: () => void)`

Safe method to update component state.

**Features:**
- Works before and after initialization
- Debounced for performance
- Respects destroyed state
- Triggers onComponentChange listener

**Example:**

```typescript
// Simple update
this.updateState({ pressed: true } as S);

// With callback
this.updateState({ pressed: true } as S, () => {
  console.log('State updated and rendered');
});
```

### `refresh()`

Force immediate re-render.

```typescript
component.refresh();
```

### `cleanRefresh()`

Force re-render and notify all children.

```typescript
component.cleanRefresh();
// Emits 'forceUpdate' event that children listen to
```

## Lifecycle Scenarios

### Scenario 1: Page Load

```
1. Page component constructor
2. Page render()
3. Widget constructors
4. Widget render() calls
5. Page componentDidMount()
6. Widget componentDidMount() calls
7. Page onComponentInit listener
8. Execute startup variables
9. Execute startup actions
```

### Scenario 2: Property Update

```
1. User/code sets property
2. PropsProvider detects change
3. onPropertyChange() called
4. updateState() queued
5. shouldComponentUpdate() checked
6. render() called
7. componentDidUpdate() called
8. onComponentChange listener called
```

### Scenario 3: Navigation Away

```
1. Navigation triggered
2. onComponentDestroy listeners called
3. componentWillUnmount() called
4. Cleanup functions executed
5. Component marked as destroyed
6. Removed from component tree
7. Unsubscribed from parent events
```

### Scenario 4: Widget Visibility Toggle

```
// When show=false
1. show property changes
2. onPropertyChange('show', false, true)
3. render() checks isVisible()
4. Returns null (if hideMode = DONOT_ADD_TO_DOM)
   OR hides with opacity/display (if hideMode = ADD_TO_DOM)

// When show=true
1. show property changes
2. onPropertyChange('show', true, false)
3. render() checks isVisible()
4. Renders widget
```

## Best Practices

### ✅ DO

1. **Initialize in constructor:**
   ```typescript
   constructor(props) {
     super(props, 'app-widget');
     this.myRef = React.createRef();
   }
   ```

2. **Side effects in componentDidMount:**
   ```typescript
   componentDidMount() {
     super.componentDidMount();
     this.loadData();
   }
   ```

3. **Register cleanup:**
   ```typescript
   componentDidMount() {
     super.componentDidMount();
     const subscription = service.subscribe(callback);
     this.cleanup.push(() => subscription.unsubscribe());
   }
   ```

4. **Use updateState for state changes:**
   ```typescript
   this.updateState({ value: newValue } as S);
   ```

5. **Check destroyed state:**
   ```typescript
   if (this.destroyed) {
     return; // Don't update destroyed component
   }
   ```

### ❌ DON'T

1. **Don't call setState in constructor:**
   ```typescript
   constructor(props) {
     super(props, 'app-widget');
     this.setState({ value: 1 }); // ❌ Wrong
   }
   ```

2. **Don't make side effects in render:**
   ```typescript
   render() {
     this.loadData(); // ❌ Wrong - causes infinite loop
     return <View />;
   }
   ```

3. **Don't forget to call super:**
   ```typescript
   componentDidMount() {
     // ❌ Missing super.componentDidMount()
     this.loadData();
   }
   ```

4. **Don't forget cleanup:**
   ```typescript
   componentDidMount() {
     setInterval(() => {}, 1000); // ❌ Memory leak - not cleaned up
   }
   ```

5. **Don't update state after unmount:**
   ```typescript
   async loadData() {
     const data = await api.fetch();
     this.updateState({ data }); // ❌ Might update after unmount
   }
   
   // ✅ Correct:
   async loadData() {
     const data = await api.fetch();
     if (!this.destroyed) {
       this.updateState({ data });
     }
   }
   ```

## Debugging Lifecycle

### Enable Logging

```typescript
import { WIDGET_LOGGER } from '@wavemaker/app-rn-runtime/core/base.component';

// In wm_rn_config.json
{
  "preferences": {
    "enableLogs": true
  }
}

// Logs will show:
// "[widget] Button1: caption changed from 'Old' to 'New'"
// "[widget] Button1 is rendering."
```

### Listener for All Lifecycle Events

```typescript
<WmButton
  name="debugButton"
  listener={{
    onComponentInit: (w) => console.log('Init:', w.name),
    onComponentChange: (w) => console.log('Change:', w.name),
    onComponentDestroy: (w) => console.log('Destroy:', w.name)
  }}
/>
```

## Performance Optimization

### 1. Optimize shouldComponentUpdate

```typescript
shouldComponentUpdate(nextProps: T, nextState: S): boolean {
  // Only re-render if specific props changed
  return (
    this.props.caption !== nextProps.caption ||
    this.state.pressed !== nextState.pressed
  );
}
```

### 2. Use React.memo for Functional Components

```typescript
const MemoizedComponent = React.memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.value === nextProps.value;
});
```

### 3. Batch State Updates

```typescript
// ❌ Bad: Multiple updates
this.updateState({ value1: a });
this.updateState({ value2: b });
this.updateState({ value3: c });

// ✅ Good: Single update
this.updateState({
  value1: a,
  value2: b,
  value3: c
} as S);
```

### 4. Lazy Load Heavy Components

```typescript
// Generate with lazyload profile
const HeavyComponent = React.lazy(() => import('./Heavy'));
```

## Next Steps

- [BaseComponent](./base-component.md) - Complete BaseComponent API
- [Services](./services.md) - Service layer documentation
- [Core Concepts](./core-concepts.md) - Back to core concepts

