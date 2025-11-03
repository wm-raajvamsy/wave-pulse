# Timeout and Debouncing Patterns

This document covers timeout management, debouncing strategies, and asynchronous patterns in WaveMaker React Native.

## Table of Contents

1. [State Update Debouncing](#state-update-debouncing)
2. [Event Debouncing](#event-debouncing)
3. [Timeout Tracking](#timeout-tracking)
4. [Cleanup of Timeouts](#cleanup-of-timeouts)
5. [Race Condition Prevention](#race-condition-prevention)
6. [Custom Debouncing](#custom-debouncing)
7. [Throttling Patterns](#throttling-patterns)
8. [Best Practices](#best-practices)

---

## State Update Debouncing

State updates in `BaseComponent` are debounced using `setTimeout` to batch multiple updates and optimize rendering.

### Why Debounce State Updates?

**Problem without debouncing**:
```typescript
// Multiple setState calls
this.setState({ field1: 'a' }); // Render 1
this.setState({ field2: 'b' }); // Render 2
this.setState({ field3: 'c' }); // Render 3
// Result: 3 renders!
```

**Solution with debouncing**:
```typescript
// Multiple updateState calls
this.updateState({ field1: 'a' }); // Queued
this.updateState({ field2: 'b' }); // Queued
this.updateState({ field3: 'c' }); // Queued
// Result: 1 render with all changes!
```

### updateState Implementation

**File**: `src/core/base.component.tsx`

```typescript
export abstract class BaseComponent {
  public updateStateTimeouts: NodeJS.Timeout[] = [];

  updateState(newPartialState: S, callback?: () => void) {
    if (!this.initialized) {
      // Pre-initialization: immediate update
      Object.assign(this.state, newPartialState);
      callback && callback();
    } else {
      // Post-initialization: debounced update
      const timeout = setTimeout(() => {
        this.setState(newPartialState as any, callback);
      }, 0);
      this.updateStateTimeouts.push(timeout);
    }
  }
}
```

### How Debouncing Works

```
┌─────────────────────────────────────────────────────────────┐
│            STATE UPDATE DEBOUNCING FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Time 0ms:    updateState({ a: 1 })                         │
│               └─→ setTimeout(() => setState({ a: 1 }), 0)   │
│                   Push timeout to array                      │
│                                                              │
│  Time 1ms:    updateState({ b: 2 })                         │
│               └─→ setTimeout(() => setState({ b: 2 }), 0)   │
│                   Push timeout to array                      │
│                                                              │
│  Time 2ms:    updateState({ c: 3 })                         │
│               └─→ setTimeout(() => setState({ c: 3 }), 0)   │
│                   Push timeout to array                      │
│                                                              │
│  ─────── Event Loop Tick ───────                            │
│                                                              │
│  Time 4ms:    All timeouts execute in same tick             │
│               ├─→ setState({ a: 1 })                        │
│               ├─→ setState({ b: 2 })                        │
│               └─→ setState({ c: 3 })                        │
│                   React batches these into 1 render!        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Pre-initialization vs Post-initialization

#### Pre-initialization (initialized = false)

During constructor and before `componentDidMount`:

```typescript
constructor(props) {
  super(props);
  // initialized = false at this point
  
  this.updateState({ loading: true });
  // Direct assignment: this.state.loading = true
  // No React re-render
}
```

**Why?**
- Component not yet mounted
- `setState` would fail or cause warnings
- Direct assignment is safe during construction

#### Post-initialization (initialized = true)

After `componentDidMount`:

```typescript
componentDidMount() {
  this.initialized = true;
  
  this.updateState({ loading: false });
  // setTimeout(() => setState({ loading: false }), 0)
  // Proper React re-render
}
```

**Why?**
- Component fully mounted
- `setState` is safe
- Debouncing improves performance

### Example: Multiple State Updates

```typescript
export default class WmForm extends BaseComponent {
  handleSubmit() {
    // All these updates are batched into 1 render
    this.updateState({ submitting: true });
    this.updateState({ error: null });
    this.updateState({ touched: true });
    
    submitData(this.state.data)
      .then(response => {
        this.updateState({ submitting: false });
        this.updateState({ success: true });
      })
      .catch(error => {
        this.updateState({ submitting: false });
        this.updateState({ error: error.message });
      });
  }
}
```

---

## Event Debouncing

Debouncing prevents handlers from firing too frequently for high-frequency events.

### Tap Event Debouncing

**File**: `src/core/tappable.component.tsx`

```typescript
export default class Tappable extends React.Component {
  private static TAP_DELAY = 200; // 200ms debounce
  private lastTapTime = 0;

  onTap = (event: any) => {
    const now = Date.now();
    
    // Debounce: Ignore if within 200ms of last tap
    if (now - this.lastTapTime < Tappable.TAP_DELAY) {
      return;
    }
    
    this.lastTapTime = now;
    
    // Execute handler
    this.props.onTap && this.props.onTap(event);
  }
}
```

**Why 200ms?**
- Prevents accidental double-taps
- Feels responsive to users
- Reduces handler execution by ~70% for rapid taps

### Input Debouncing

For text inputs that trigger expensive operations:

```typescript
export default class WmSearch extends BaseComponent {
  private searchTimeout: NodeJS.Timeout | null = null;
  private static SEARCH_DELAY = 300; // 300ms debounce

  handleSearchChange = (text: string) => {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Update input immediately
    this.updateState({ searchText: text });
    
    // Debounce expensive search operation
    this.searchTimeout = setTimeout(() => {
      this.performSearch(text);
    }, WmSearch.SEARCH_DELAY);
    
    // Register for cleanup
    this.cleanup.push(() => {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }
    });
  }

  performSearch(query: string) {
    // Expensive operation: API call, filtering, etc.
    this.Variables.searchResults.setInput({ query });
    this.Variables.searchResults.invoke();
  }
}
```

**Benefits**:
- User sees immediate feedback (text updates)
- Search only fires after user stops typing
- Reduces API calls from 100s to 1-5 per search

### Scroll Event Debouncing

**File**: `src/core/sticky-wrapper.tsx`

```typescript
const onScroll = useAnimatedScrollHandler({
  onScroll: (event: ReanimatedEvent<ScrollEvent>): void => {
    'worklet';
    const currentScrollTime = Date.now();
    
    // Throttle to every 100ms
    if (currentScrollTime - lastNotifyTime.value >= 100) {
      lastNotifyTime.value = currentScrollTime;
      
      const safeEvent = {
        contentOffset: { y: event.contentOffset?.y ?? 0 },
        contentSize: { height: event.contentSize?.height ?? 0 },
        layoutMeasurement: { height: event.layoutMeasurement?.height ?? 0 },
        scrollDirection: scrollDirection.value,
        scrollDelta: delta,
      };
      
      runOnJS(notifyEvent)(safeEvent);
    }
  }
});
```

**Why throttle scroll events?**
- Scroll fires at 60+ fps (every ~16ms)
- Throttling to 100ms = ~10 events/second
- Reduces event overhead by ~80%
- Still feels responsive

---

## Timeout Tracking

Proper timeout tracking prevents memory leaks and ensures cleanup.

### updateStateTimeouts Array

Every `BaseComponent` tracks its state update timeouts:

```typescript
export abstract class BaseComponent {
  public updateStateTimeouts: NodeJS.Timeout[] = [];

  updateState(newPartialState: S, callback?: () => void) {
    const timeout = setTimeout(() => {
      this.setState(newPartialState as any, callback);
    }, 0);
    
    // Track timeout for cleanup
    this.updateStateTimeouts.push(timeout);
  }
}
```

### Custom Timeout Tracking

For other timeouts, use the `cleanup` array:

```typescript
export default class WmWidget extends BaseComponent {
  componentDidMount() {
    // Create timeout
    const timeout = setTimeout(() => {
      this.doSomething();
    }, 1000);
    
    // Register for cleanup
    this.cleanup.push(() => clearTimeout(timeout));
  }
  
  delayedAction(delay: number) {
    const timeout = setTimeout(() => {
      this.performAction();
    }, delay);
    
    // Always register timeouts for cleanup
    this.cleanup.push(() => clearTimeout(timeout));
  }
}
```

### Why Track Timeouts?

```typescript
// WITHOUT tracking
componentDidMount() {
  setTimeout(() => {
    this.setState({ loaded: true }); // DANGER!
  }, 2000);
}

// User navigates away after 1 second
// Timeout still fires after 2 seconds
// setState on unmounted component = WARNING + memory leak!

// WITH tracking
componentDidMount() {
  const timeout = setTimeout(() => {
    this.setState({ loaded: true }); // SAFE
  }, 2000);
  
  this.cleanup.push(() => clearTimeout(timeout));
}

// User navigates away
// componentWillUnmount() clears timeout
// No setState on unmounted component ✓
```

---

## Cleanup of Timeouts

Automatic cleanup ensures no orphaned timers.

### Automatic Cleanup in componentWillUnmount

**File**: `src/core/base.component.tsx`

```typescript
componentWillUnmount() {
  // Clear state update timeouts
  this.updateStateTimeouts.forEach(timeout => clearTimeout(timeout));
  this.updateStateTimeouts.length = 0;
  
  // Clear custom cleanups
  this.cleanup.forEach(fn => fn());
  this.cleanup.length = 0;
  
  // Other cleanup
  this.notifier.destroy();
  this.propertyProvider.destroy();
  
  this.destroyed = true;
}
```

### Cleanup Flow

```
┌─────────────────────────────────────────────────────────────┐
│              TIMEOUT CLEANUP FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Component Active                                         │
│     ├─→ updateStateTimeouts: [timeout1, timeout2, ...]      │
│     └─→ cleanup: [clearFn1, clearFn2, ...]                  │
│                                                              │
│  2. Component Unmounting                                     │
│     componentWillUnmount() called                            │
│                                                              │
│  3. Clear State Timeouts                                     │
│     updateStateTimeouts.forEach(t => clearTimeout(t))        │
│     └─→ Cancels pending setState calls                      │
│                                                              │
│  4. Execute Cleanup Functions                                │
│     cleanup.forEach(fn => fn())                              │
│     └─→ Clears custom timeouts, subscriptions, etc.         │
│                                                              │
│  5. Destroy Dependencies                                     │
│     ├─→ notifier.destroy()                                   │
│     ├─→ propertyProvider.destroy()                           │
│     └─→ watcher.destroy() (if applicable)                   │
│                                                              │
│  6. Mark as Destroyed                                        │
│     this.destroyed = true                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Manual Cleanup

Sometimes you need to clear timeouts before unmount:

```typescript
export default class WmCountdown extends BaseComponent {
  private countdownTimeout: NodeJS.Timeout | null = null;

  startCountdown() {
    // Clear any existing countdown
    this.stopCountdown();
    
    this.countdownTimeout = setTimeout(() => {
      this.updateState({ timeLeft: 0 });
      this.invokeEventCallback('onComplete', []);
    }, this.props.duration * 1000);
    
    // Register for cleanup
    this.cleanup.push(() => this.stopCountdown());
  }

  stopCountdown() {
    if (this.countdownTimeout) {
      clearTimeout(this.countdownTimeout);
      this.countdownTimeout = null;
    }
  }

  componentWillUnmount() {
    // Ensure stopped before unmount
    this.stopCountdown();
    super.componentWillUnmount();
  }
}
```

---

## Race Condition Prevention

Debouncing helps prevent race conditions in asynchronous operations.

### Problem: Race Conditions

```typescript
// WITHOUT debouncing
handleSearch(query: string) {
  // Call 1: User types "h" → API call starts (500ms response)
  this.api.search("h");
  
  // Call 2: User types "he" → API call starts (300ms response)
  this.api.search("he");
  
  // Call 3: User types "hel" → API call starts (200ms response)
  this.api.search("hel");
  
  // Results arrive out of order:
  // "hel" results (200ms) ✓ Correct
  // "he" results (300ms)  ✗ Overwrites correct results!
  // "h" results (500ms)   ✗ Wrong results displayed!
}
```

### Solution: Debounce + Request Cancellation

```typescript
export default class WmSearch extends BaseComponent {
  private searchTimeout: NodeJS.Timeout | null = null;
  private lastRequestId = 0;

  handleSearch(query: string) {
    // Clear pending search
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Debounce search
    this.searchTimeout = setTimeout(() => {
      this.performSearch(query);
    }, 300);
  }

  async performSearch(query: string) {
    // Generate unique request ID
    const requestId = ++this.lastRequestId;
    
    this.updateState({ loading: true });
    
    try {
      const results = await this.api.search(query);
      
      // Only update if this is still the latest request
      if (requestId === this.lastRequestId) {
        this.updateState({ 
          results,
          loading: false 
        });
      }
      // Ignore results from outdated requests
    } catch (error) {
      if (requestId === this.lastRequestId) {
        this.updateState({ 
          error: error.message,
          loading: false 
        });
      }
    }
  }
}
```

### AbortController Pattern

For fetch/axios requests:

```typescript
export default class WmDataWidget extends BaseComponent {
  private abortController: AbortController | null = null;

  async loadData() {
    // Abort previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    
    // Create new controller
    this.abortController = new AbortController();
    
    try {
      const response = await fetch(this.props.url, {
        signal: this.abortController.signal
      });
      const data = await response.json();
      this.updateState({ data });
    } catch (error) {
      if (error.name !== 'AbortError') {
        this.updateState({ error: error.message });
      }
      // Ignore abort errors
    }
  }

  componentWillUnmount() {
    // Abort on unmount
    if (this.abortController) {
      this.abortController.abort();
    }
    super.componentWillUnmount();
  }
}
```

---

## Custom Debouncing

Implement custom debounce utilities for specific needs.

### Generic Debounce Function

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Usage
export default class WmWidget extends BaseComponent {
  private debouncedUpdate = debounce((value: string) => {
    this.performExpensiveUpdate(value);
  }, 300);

  handleChange(value: string) {
    this.debouncedUpdate(value);
  }
}
```

### Debounce with Leading Edge

Execute immediately, then debounce subsequent calls:

```typescript
function debounceLeading<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastRun = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    
    if (now - lastRun >= delay) {
      // Execute immediately if enough time passed
      lastRun = now;
      fn.apply(this, args);
    } else {
      // Debounce subsequent calls
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        lastRun = Date.now();
        fn.apply(this, args);
      }, delay);
    }
  };
}
```

### Debounce with Max Wait

Ensure function executes at least once per max wait period:

```typescript
function debounceWithMaxWait<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  maxWait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastCall = 0;
  let lastExec = 0;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    lastCall = now;
    
    // Force execution if max wait exceeded
    if (now - lastExec >= maxWait) {
      lastExec = now;
      fn.apply(this, args);
      return;
    }
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      lastExec = Date.now();
      fn.apply(this, args);
    }, delay);
  };
}

// Usage: Debounce 300ms, but execute at least every 1000ms
const debouncedFn = debounceWithMaxWait(myFunction, 300, 1000);
```

---

## Throttling Patterns

Throttling limits how often a function can execute.

### Generic Throttle Function

```typescript
function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastRun = 0;
  let timeout: NodeJS.Timeout | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = limit - (now - lastRun);
    
    if (remaining <= 0) {
      // Execute immediately
      lastRun = now;
      fn.apply(this, args);
    } else {
      // Schedule for later
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        lastRun = Date.now();
        fn.apply(this, args);
      }, remaining);
    }
  };
}

// Usage
const throttledScroll = throttle((event) => {
  console.log('Scroll position:', event.y);
}, 100); // Max once per 100ms
```

### Scroll Throttling Example

```typescript
export default class WmScrollView extends BaseComponent {
  private throttledScrollHandler: (event: any) => void;

  constructor(props) {
    super(props);
    
    // Throttle scroll events to 100ms
    this.throttledScrollHandler = throttle((event) => {
      this.handleScroll(event);
    }, 100);
  }

  handleScroll(event: any) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    
    // Check if near bottom
    const distanceFromBottom = 
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    
    if (distanceFromBottom < 100) {
      this.loadMore();
    }
  }

  render() {
    return (
      <ScrollView onScroll={this.throttledScrollHandler}>
        {this.props.children}
      </ScrollView>
    );
  }
}
```

### Animation Frame Throttling

Use `requestAnimationFrame` for smooth animations:

```typescript
export default class WmAnimatedWidget extends BaseComponent {
  private rafId: number | null = null;
  private pendingUpdate: any = null;

  scheduleUpdate(data: any) {
    this.pendingUpdate = data;
    
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.performUpdate(this.pendingUpdate);
        this.rafId = null;
        this.pendingUpdate = null;
      });
    }
  }

  performUpdate(data: any) {
    this.updateState({ data });
  }

  componentWillUnmount() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    super.componentWillUnmount();
  }
}
```

---

## Best Practices

### 1. Always Track Timeouts

**DO**:
```typescript
const timeout = setTimeout(() => {}, 1000);
this.cleanup.push(() => clearTimeout(timeout));
```

**DON'T**:
```typescript
setTimeout(() => {}, 1000); // Untracked!
```

### 2. Use updateState, Not setState

**DO**:
```typescript
this.updateState({ loading: true }); // Debounced, tracked
```

**DON'T**:
```typescript
this.setState({ loading: true }); // Not debounced, not tracked
```

### 3. Choose Appropriate Delays

| Use Case | Recommended Delay |
|----------|-------------------|
| Button tap | 200ms |
| Text input | 300-500ms |
| Search | 300-500ms |
| Scroll events | 100ms |
| Window resize | 150-250ms |
| Autocomplete | 200-300ms |

### 4. Clear Timeouts Before Creating New Ones

**DO**:
```typescript
if (this.timeout) {
  clearTimeout(this.timeout);
}
this.timeout = setTimeout(() => {}, 1000);
```

**DON'T**:
```typescript
this.timeout = setTimeout(() => {}, 1000); // Previous timeout leaks!
```

### 5. Use Throttling for High-Frequency Events

**Events to throttle**:
- Scroll
- Window resize
- Mouse move
- Drag
- Animation frames

**DO**:
```typescript
const throttledHandler = throttle(handler, 100);
element.addEventListener('scroll', throttledHandler);
```

### 6. Cancel Async Operations on Unmount

**DO**:
```typescript
componentWillUnmount() {
  this.abortController?.abort();
  if (this.timeout) clearTimeout(this.timeout);
  super.componentWillUnmount();
}
```

### 7. Use Request IDs for Race Condition Prevention

**DO**:
```typescript
const requestId = ++this.lastRequestId;
const data = await fetchData();
if (requestId === this.lastRequestId) {
  this.updateState({ data });
}
```

---

## Common Pitfalls

### Pitfall 1: Forgetting to Clear Timeouts

```typescript
// BAD
componentDidMount() {
  setInterval(() => {
    this.tick();
  }, 1000);
}
// Interval continues after unmount!

// GOOD
componentDidMount() {
  const interval = setInterval(() => {
    this.tick();
  }, 1000);
  
  this.cleanup.push(() => clearInterval(interval));
}
```

### Pitfall 2: setState in Timeout After Unmount

```typescript
// BAD
setTimeout(() => {
  this.setState({ data }); // Component might be unmounted!
}, 1000);

// GOOD
const timeout = setTimeout(() => {
  if (!this.destroyed) {
    this.updateState({ data });
  }
}, 1000);
this.cleanup.push(() => clearTimeout(timeout));
```

### Pitfall 3: Closure Capturing Stale Values

```typescript
// BAD
for (let i = 0; i < 5; i++) {
  setTimeout(() => {
    console.log(i); // Always logs 5!
  }, i * 1000);
}

// GOOD
for (let i = 0; i < 5; i++) {
  ((index) => {
    setTimeout(() => {
      console.log(index); // Logs 0, 1, 2, 3, 4
    }, index * 1000);
  })(i);
}
```

---

## Summary

Effective timeout and debouncing management requires:

- **State Update Debouncing**: Batch updates with `updateState`
- **Event Debouncing**: Prevent excessive handler calls (200ms for taps, 300ms for inputs)
- **Timeout Tracking**: Always register timeouts for cleanup
- **Automatic Cleanup**: Let `componentWillUnmount` handle cleanup
- **Race Condition Prevention**: Use request IDs or AbortController
- **Throttling**: Limit high-frequency events (scroll, resize)
- **Best Practices**: Choose appropriate delays, clear before creating new timeouts

These patterns ensure responsive, performant applications without memory leaks or race conditions.

