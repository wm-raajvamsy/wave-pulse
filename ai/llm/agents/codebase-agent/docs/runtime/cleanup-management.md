# Cleanup Management

This document covers memory management, resource cleanup, and best practices for preventing memory leaks in WaveMaker React Native applications.

## Table of Contents

1. [Cleanup Array](#cleanup-array)
2. [Automatic Cleanup](#automatic-cleanup)
3. [Manual Cleanup](#manual-cleanup)
4. [Cleanup Order](#cleanup-order)
5. [Memory Leak Prevention](#memory-leak-prevention)
6. [Common Cleanup Scenarios](#common-cleanup-scenarios)
7. [Best Practices](#best-practices)

---

## Cleanup Array

Every `BaseComponent` has a `cleanup` array for registering cleanup functions.

### Cleanup Array Structure

**File**: `src/core/base.component.tsx`

```typescript
export abstract class BaseComponent {
  public cleanup: Function[] = [];
  public updateStateTimeouts: NodeJS.Timeout[] = [];
  private parentListenerDestroyers: Function[] = [];
  public notifier = new EventNotifier();
  public destroyed = false;
}
```

### Registration

Register any resource that needs cleanup:

```typescript
export default class WmWidget extends BaseComponent {
  constructor(props: T) {
    super(props);
    
    // Register cleanup function
    this.cleanup.push(() => {
      console.log('Cleaning up custom resource');
      this.myCustomCleanup();
    });
  }

  componentDidMount() {
    // Create a timer
    const timer = setInterval(() => {
      this.tick();
    }, 1000);
    
    // Register timer cleanup
    this.cleanup.push(() => clearInterval(timer));
  }
}
```

### Execution

All cleanup functions execute in `componentWillUnmount`:

```typescript
componentWillUnmount() {
  // Clear state update timeouts
  this.updateStateTimeouts.forEach(timeout => clearTimeout(timeout));
  this.updateStateTimeouts.length = 0;
  
  // Execute all cleanup functions
  this.cleanup.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
  this.cleanup.length = 0;
  
  // Clear parent listeners
  this.parentListenerDestroyers.forEach(unsub => unsub());
  this.parentListenerDestroyers.length = 0;
  
  // Destroy event notifier
  this.notifier.destroy();
  
  // Destroy props provider
  this.propertyProvider.destroy();
  
  // Mark as destroyed
  this.destroyed = true;
}
```

---

## Automatic Cleanup

Several resources are automatically cleaned up by `BaseComponent`.

### 1. State Update Timeouts

**Automatically cleaned**: All pending `updateState` timeouts

```typescript
updateState(newPartialState: S, callback?: () => void) {
  const timeout = setTimeout(() => {
    this.setState(newPartialState as any, callback);
  }, 0);
  
  // Automatically tracked
  this.updateStateTimeouts.push(timeout);
}

componentWillUnmount() {
  // Automatic cleanup
  this.updateStateTimeouts.forEach(timeout => clearTimeout(timeout));
  this.updateStateTimeouts.length = 0;
}
```

**Why automatic?**
- All `updateState` calls create timeouts
- Framework manages the timeout array
- No manual tracking needed

### 2. Theme Subscriptions

**Automatically cleaned**: Theme change listeners

```typescript
constructor(props: T) {
  super(props);
  
  // Subscribe to theme changes
  const unsubscribe = this.theme.subscribe((newTheme) => {
    this.onThemeChange(newTheme);
  });
  
  // Automatically registered for cleanup
  this.cleanup.push(unsubscribe);
}
```

### 3. Accessibility Listeners

**Automatically cleaned**: Screen reader state listeners

```typescript
componentDidMount() {
  const unsubscribe = AccessibilityInfo.addEventListener(
    'screenReaderChanged',
    this.handleScreenReaderChange
  );
  
  // Automatically registered
  this.cleanup.push(() => unsubscribe.remove());
}
```

### 4. Parent Listeners

**Automatically cleaned**: Event listeners on parent components

```typescript
export abstract class BaseComponent {
  private parentListenerDestroyers: Function[] = [];

  protected listenToParent(event: string, handler: Function) {
    if (this.parent) {
      const unsubscribe = this.parent.notifier.subscribe(event, handler);
      this.parentListenerDestroyers.push(unsubscribe);
    }
  }

  componentWillUnmount() {
    // Automatic cleanup
    this.parentListenerDestroyers.forEach(unsub => unsub());
  }
}
```

### 5. Event Notifier

**Automatically cleaned**: All event subscriptions

```typescript
export default class WmWidget extends BaseComponent {
  componentDidMount() {
    // Subscribe to events
    this.notifier.subscribe('customEvent', this.handleEvent);
  }

  componentWillUnmount() {
    // Notifier automatically destroyed
    this.notifier.destroy();
    // All subscriptions cleared
  }
}
```

### 6. PropsProvider

**Automatically cleaned**: Property provider resources

```typescript
componentWillUnmount() {
  // Automatic cleanup
  this.propertyProvider.destroy();
  // Clears props, defaults, overrides, proxy
}
```

### 7. Watchers (in Fragments)

**Automatically cleaned**: Fragment watchers and expressions

```typescript
export class BaseFragment {
  public watcher: Watcher;

  destroy() {
    // Automatic watcher cleanup
    this.watcher?.destroy();
    // Clears expressions, children, parent reference
    
    this._memoize.clear();
    this.isDestroyed = true;
  }
}
```

---

## Manual Cleanup

Some resources require manual cleanup registration.

### Custom Timers

```typescript
export default class WmCountdown extends BaseComponent {
  private countdownTimer: NodeJS.Timeout | null = null;

  startCountdown() {
    // Create timer
    this.countdownTimer = setInterval(() => {
      this.tick();
    }, 1000);
    
    // Register cleanup
    this.cleanup.push(() => {
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    });
  }
}
```

### Animation Handles

```typescript
export default class WmAnimated extends BaseComponent {
  private animation: Animated.CompositeAnimation | null = null;

  startAnimation() {
    this.animation = Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: 300,
    });
    
    this.animation.start();
    
    // Register cleanup
    this.cleanup.push(() => {
      if (this.animation) {
        this.animation.stop();
        this.animation = null;
      }
    });
  }
}
```

### Network Requests

```typescript
export default class WmDataLoader extends BaseComponent {
  private abortController: AbortController | null = null;

  async loadData() {
    this.abortController = new AbortController();
    
    // Register cleanup
    this.cleanup.push(() => {
      if (this.abortController) {
        this.abortController.abort();
        this.abortController = null;
      }
    });
    
    try {
      const response = await fetch(this.props.url, {
        signal: this.abortController.signal,
      });
      const data = await response.json();
      this.updateState({ data });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error);
      }
    }
  }
}
```

### Native Module Listeners

```typescript
export default class WmLocationTracker extends BaseComponent {
  private locationSubscription: any = null;

  componentDidMount() {
    // Start watching location
    this.locationSubscription = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High },
      (location) => {
        this.updateState({ location });
      }
    );
    
    // Register cleanup
    this.cleanup.push(async () => {
      if (this.locationSubscription) {
        await this.locationSubscription.remove();
        this.locationSubscription = null;
      }
    });
  }
}
```

### WebSocket Connections

```typescript
export default class WmRealtimeData extends BaseComponent {
  private websocket: WebSocket | null = null;

  connectWebSocket() {
    this.websocket = new WebSocket('ws://example.com');
    
    this.websocket.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // Register cleanup
    this.cleanup.push(() => {
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
    });
  }
}
```

### File Handles

```typescript
export default class WmFileReader extends BaseComponent {
  private fileHandle: any = null;

  async openFile() {
    this.fileHandle = await FileSystem.openFile(this.props.path);
    
    // Register cleanup
    this.cleanup.push(async () => {
      if (this.fileHandle) {
        await this.fileHandle.close();
        this.fileHandle = null;
      }
    });
  }
}
```

---

## Cleanup Order

Resources are cleaned up in a specific order to prevent errors.

### Cleanup Sequence

```
┌─────────────────────────────────────────────────────────────┐
│              CLEANUP EXECUTION ORDER                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. State Update Timeouts                                    │
│     └─→ Clear all pending updateState timeouts              │
│                                                              │
│  2. Custom Cleanup Functions                                 │
│     └─→ Execute cleanup array (FIFO order)                  │
│         ├─→ Custom timers                                    │
│         ├─→ Network requests                                 │
│         ├─→ Subscriptions                                    │
│         └─→ Other resources                                  │
│                                                              │
│  3. Parent Listeners                                         │
│     └─→ Unsubscribe from parent events                      │
│                                                              │
│  4. Event Notifier                                           │
│     └─→ Destroy notifier and all subscriptions              │
│                                                              │
│  5. Props Provider                                           │
│     └─→ Destroy property provider                           │
│                                                              │
│  6. Mark Destroyed                                           │
│     └─→ Set destroyed flag                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Why This Order?

1. **State Timeouts First**: Prevent state updates after unmount
2. **Custom Cleanup Second**: User-defined cleanup runs early
3. **Parent Listeners Third**: Stop receiving external events
4. **Notifier Fourth**: Stop internal event propagation
5. **Props Provider Fifth**: Release property references
6. **Destroyed Flag Last**: Mark component as fully cleaned

### Implementation

```typescript
componentWillUnmount() {
  // 1. State update timeouts
  this.updateStateTimeouts.forEach(timeout => clearTimeout(timeout));
  this.updateStateTimeouts.length = 0;
  
  // 2. Custom cleanup
  this.cleanup.forEach(fn => {
    try {
      fn();
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  });
  this.cleanup.length = 0;
  
  // 3. Parent listeners
  this.parentListenerDestroyers.forEach(unsub => unsub());
  this.parentListenerDestroyers.length = 0;
  
  // 4. Event notifier
  this.notifier.destroy();
  
  // 5. Props provider
  this.propertyProvider.destroy();
  
  // 6. Mark destroyed
  this.destroyed = true;
}
```

---

## Memory Leak Prevention

Common memory leak patterns and how to prevent them.

### Leak 1: Orphaned Timers

**Problem**:
```typescript
// BAD: Timer continues after unmount
componentDidMount() {
  setInterval(() => {
    this.updateState({ time: Date.now() });
  }, 1000);
}
```

**Solution**:
```typescript
// GOOD: Timer is cleaned up
componentDidMount() {
  const timer = setInterval(() => {
    this.updateState({ time: Date.now() });
  }, 1000);
  
  this.cleanup.push(() => clearInterval(timer));
}
```

### Leak 2: Forgotten Subscriptions

**Problem**:
```typescript
// BAD: Subscription never unsubscribed
componentDidMount() {
  EventBus.subscribe('globalEvent', this.handleEvent);
}
```

**Solution**:
```typescript
// GOOD: Subscription cleaned up
componentDidMount() {
  const unsubscribe = EventBus.subscribe('globalEvent', this.handleEvent);
  this.cleanup.push(unsubscribe);
}
```

### Leak 3: Pending Network Requests

**Problem**:
```typescript
// BAD: Fetch completes after unmount
async loadData() {
  const response = await fetch('/api/data');
  const data = await response.json();
  this.setState({ data }); // Component might be unmounted!
}
```

**Solution**:
```typescript
// GOOD: Request aborted on unmount
async loadData() {
  this.abortController = new AbortController();
  
  this.cleanup.push(() => {
    this.abortController?.abort();
  });
  
  try {
    const response = await fetch('/api/data', {
      signal: this.abortController.signal,
    });
    const data = await response.json();
    
    if (!this.destroyed) {
      this.updateState({ data });
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error(error);
    }
  }
}
```

### Leak 4: Circular References

**Problem**:
```typescript
// BAD: Circular reference prevents GC
class Widget {
  parent: Container;
}

class Container {
  children: Widget[] = [];
  
  addChild(widget: Widget) {
    widget.parent = this; // Circular reference
    this.children.push(widget);
  }
}
```

**Solution**:
```typescript
// GOOD: Break circular references on cleanup
class Container {
  destroy() {
    this.children.forEach(child => {
      child.parent = null; // Break reference
    });
    this.children.length = 0;
  }
}
```

### Leak 5: Event Listeners on Global Objects

**Problem**:
```typescript
// BAD: Listener on window object
componentDidMount() {
  Dimensions.addEventListener('change', this.handleResize);
}
```

**Solution**:
```typescript
// GOOD: Remove listener on unmount
componentDidMount() {
  const subscription = Dimensions.addEventListener('change', this.handleResize);
  
  this.cleanup.push(() => {
    subscription.remove();
  });
}
```

---

## Common Cleanup Scenarios

### Scenario 1: Polling Data

```typescript
export default class WmDataPoller extends BaseComponent {
  private pollTimer: NodeJS.Timeout | null = null;

  startPolling() {
    this.pollTimer = setInterval(() => {
      this.Variables.data.invoke();
    }, 5000);
    
    this.cleanup.push(() => {
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
    });
  }

  componentDidMount() {
    this.startPolling();
  }
}
```

### Scenario 2: Animation Loop

```typescript
export default class WmAnimatedWidget extends BaseComponent {
  private animationFrame: number | null = null;

  animate = () => {
    this.animatedValue.setValue(this.animatedValue._value + 1);
    this.animationFrame = requestAnimationFrame(this.animate);
  }

  componentDidMount() {
    this.animate();
    
    this.cleanup.push(() => {
      if (this.animationFrame !== null) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
    });
  }
}
```

### Scenario 3: Multiple Resources

```typescript
export default class WmComplexWidget extends BaseComponent {
  componentDidMount() {
    // Timer
    const timer = setInterval(this.tick, 1000);
    this.cleanup.push(() => clearInterval(timer));
    
    // Subscription
    const unsub = EventBus.subscribe('event', this.handler);
    this.cleanup.push(unsub);
    
    // Network
    const controller = new AbortController();
    this.cleanup.push(() => controller.abort());
    
    // Animation
    const animation = Animated.timing(this.value, { toValue: 1 });
    animation.start();
    this.cleanup.push(() => animation.stop());
  }
}
```

---

## Best Practices

### 1. Always Register Cleanup

**DO**:
```typescript
const resource = createResource();
this.cleanup.push(() => resource.dispose());
```

**DON'T**:
```typescript
const resource = createResource();
// Forgot to register cleanup!
```

### 2. Check destroyed Flag

**DO**:
```typescript
async loadData() {
  const data = await fetch('/api/data');
  
  if (!this.destroyed) {
    this.updateState({ data });
  }
}
```

**DON'T**:
```typescript
async loadData() {
  const data = await fetch('/api/data');
  this.setState({ data }); // Might fail if unmounted
}
```

### 3. Use AbortController for Fetch

**DO**:
```typescript
this.abortController = new AbortController();
fetch(url, { signal: this.abortController.signal });
this.cleanup.push(() => this.abortController?.abort());
```

### 4. Clear References

**DO**:
```typescript
this.cleanup.push(() => {
  this.myLargeObject = null;
  this.myArray.length = 0;
});
```

### 5. Handle Cleanup Errors

**DO**:
```typescript
this.cleanup.forEach(fn => {
  try {
    fn();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});
```

### 6. Clean Up in Correct Order

**DO**:
```typescript
// Stop producing events first
this.stopPolling();

// Then unsubscribe
this.unsubscribeAll();

// Finally destroy
super.componentWillUnmount();
```

### 7. Document Cleanup Requirements

**DO**:
```typescript
/**
 * Component that polls data every 5 seconds.
 * Automatically stops polling on unmount.
 */
export default class WmDataPoller extends BaseComponent {
  // ...
}
```

---

## Debugging Memory Leaks

### Check for Leaks

```typescript
// Add to component
componentWillUnmount() {
  console.log(`[${this.props.name}] Unmounting`);
  console.log('  Timeouts:', this.updateStateTimeouts.length);
  console.log('  Cleanup functions:', this.cleanup.length);
  console.log('  Parent listeners:', this.parentListenerDestroyers.length);
  
  super.componentWillUnmount();
}
```

### Memory Profiling

Use React DevTools Profiler:

1. Open React DevTools
2. Go to Profiler tab
3. Start recording
4. Navigate through app
5. Check component unmounts
6. Look for components that don't unmount

### Common Warning Signs

- "Can't perform a React state update on an unmounted component"
- Increasing memory usage over time
- Timers/intervals still running after navigation
- Network requests completing after page change
- Event handlers firing on unmounted components

---

## Summary

Effective cleanup management requires:

- **Automatic Cleanup**: Framework handles common resources
- **Manual Registration**: Register custom resources via `cleanup` array
- **Proper Order**: Clean up in correct sequence
- **Leak Prevention**: Abort async operations, clear references
- **Best Practices**: Always register, check destroyed, handle errors
- **Debugging**: Use logging and profiling to find leaks

Following these patterns ensures memory-efficient, leak-free React Native applications with WaveMaker.

