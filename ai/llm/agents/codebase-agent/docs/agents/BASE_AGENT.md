# Base Agent - Detailed Documentation

## Overview

The **Base Agent** is the expert on core runtime infrastructure in WaveMaker React Native. It has deep knowledge of BaseComponent API, core utilities, event system, and fundamental patterns.

## Domain Expertise

### Core Responsibilities

1. **BaseComponent Architecture**
   - Complete API reference
   - Lifecycle hooks
   - Props and state management
   - Component tree management

2. **Core Utilities**
   - Utility functions
   - Data formatters
   - Validators
   - Helper methods

3. **Event System**
   - EventNotifier implementation
   - Subscription management
   - Event propagation

4. **Infrastructure**
   - Dependency injection
   - Logging system
   - Viewport management
   - Accessibility helpers

## BaseComponent Complete API

### Properties

```typescript
class BaseComponent<T extends BaseProps, S extends State, L extends Styles> {
  // ============ Core Properties ============
  
  styles: L;                             // Component styles
  proxy: BaseComponent<T, S, L>;         // Props proxy for binding
  _INSTANCE: BaseComponent<T, S, L>;     // Component instance reference
  initialized: boolean = false;          // Initialization flag
  cleanup: Function[] = [];              // Cleanup functions
  theme: Theme;                          // Current theme
  parent: BaseComponent<any, any, any>;  // Parent component
  destroyed: boolean = false;            // Destruction flag
  notifier: EventNotifier;               // Event notifier
  hideMode: HideMode;                    // Hide behavior mode
  isFixed: boolean = false;              // Fixed position flag
  isSticky: boolean = false;             // Sticky position flag
  _showSkeleton: boolean = false;        // Skeleton state
  updateStateTimeouts: NodeJS.Timeout[] = []; // State update timeouts
}
```

### Lifecycle Methods

```typescript
// ============ React Lifecycle ============

constructor(props: T, defaultStyles: L, defaultClass: string);
componentDidMount(): void;
componentWillUnmount(): void;
componentDidUpdate(prevProps: T): void;
shouldComponentUpdate(nextProps: T, nextState: S): boolean;

// ============ Custom Lifecycle Hooks ============

protected init(): void {
  // Called after componentDidMount
  // Use for:
  // - Initialize subscriptions
  // - Start timers
  // - Fetch initial data
}

protected destroy(): void {
  // Called before componentWillUnmount
  // Use for:
  // - Cleanup subscriptions
  // - Clear timers
  // - Cancel requests
}

protected onPropertyChange(prevProps: T): void {
  // Called after componentDidUpdate
  // Use for:
  // - React to prop changes
  // - Update derived state
}
```

### State Management

```typescript
// ============ State Update Methods ============

/**
 * Update state with automatic cleanup
 */
protected updateState(
  partial: Partial<S>,
  callback?: () => void,
  delay?: number
): void;

/**
 * Update state immediately
 */
this.updateState({ someValue: newValue });

/**
 * Update state with callback
 */
this.updateState({ someValue: newValue }, () => {
  console.log('State updated');
});

/**
 * Delayed state update (auto-cleanup)
 */
this.updateState({ someValue: newValue }, undefined, 1000);
```

### Event Handling

```typescript
// ============ Event Methods ============

/**
 * Invoke event callback from props
 */
protected invokeEventCallback(
  eventName: string,
  ...args: any[]
): void;

// Usage:
this.invokeEventCallback('onPress', event);
this.invokeEventCallback('onChange', value);

/**
 * Event notifier (pub/sub)
 */
this.notifier.subscribe('eventName', (data) => {
  console.log('Event received:', data);
});

this.notifier.notify('eventName', data);
```

### Component Tree Navigation

```typescript
// ============ Component Tree Methods ============

/**
 * Get child widget by name
 */
public getWidget(name: string): BaseComponent<any, any, any> | null;

// Usage:
const button = this.getWidget('submitButton');
if (button) {
  button.props.disabled = true;
}

/**
 * Access parent
 */
if (this.parent) {
  console.log('Parent:', this.parent.constructor.name);
}

/**
 * Find widget in tree
 */
private findChildWidget(name: string): BaseComponent | null;
```

### Rendering

```typescript
// ============ Render Methods ============

/**
 * Main render (final)
 */
public render(): ReactNode;

/**
 * Widget-specific render (override this)
 */
public abstract renderWidget(props: T): ReactNode;

/**
 * Check if should show
 */
private shouldShow(): boolean;
```

### Style Management

```typescript
// ============ Style Methods ============

/**
 * Create component styles
 */
private createStyles(
  defaultStyles: L,
  defaultClass: string
): L;

/**
 * Get class styles from theme
 */
private getClassStyles(classname?: string): any;

/**
 * Merge styles with precedence
 */
private mergeStyles(base: any, override: any): any;
```

### Utility Methods

```typescript
// ============ Utility Methods ============

/**
 * Get prop value
 */
protected getProp(propName: string): any;

/**
 * Set prop value
 */
protected setProp(propName: string, value: any): void;

/**
 * Get app config
 */
protected getAppConfig(): any;

/**
 * Check if platform
 */
protected isPlatform(platform: 'ios' | 'android' | 'web'): boolean;
```

## Core Utilities

### Utils Module

**Location**: `wavemaker-rn-runtime/src/core/utils.ts`

```typescript
// Deep copy object
export function deepCopy<T>(obj: T): T;

// Check if value is defined
export function isDefined(val: any): boolean;

// Check if value is empty
export function isEmpty(val: any): boolean;

// Get nested property value
export function get(obj: any, path: string, defaultValue?: any): any;

// Set nested property value
export function set(obj: any, path: string, value: any): void;

// Debounce function
export function debounce<T extends Function>(
  func: T,
  wait: number
): T;

// Throttle function
export function throttle<T extends Function>(
  func: T,
  wait: number
): T;

// Generate unique ID
export function generateUniqueId(): string;

// Format date
export function formatDate(date: Date, format: string): string;

// Parse date
export function parseDate(dateString: string, format: string): Date;
```

### Formatters

**Location**: `wavemaker-rn-runtime/src/core/formatters.ts`

```typescript
// Number formatters
export function formatNumber(value: number, format: string): string;
export function formatCurrency(value: number, currency: string): string;
export function formatPercentage(value: number, decimals?: number): string;

// Date formatters
export function formatDate(date: Date, format: string): string;
export function formatTime(date: Date, format: string): string;
export function formatDateTime(date: Date, format: string): string;
export function toDate(value: any, format?: string): Date;

// String formatters
export function capitalize(str: string): string;
export function uppercase(str: string): string;
export function lowercase(str: string): string;
export function truncate(str: string, length: number): string;

// Usage in components:
const formattedPrice = this.formatCurrency(100, 'USD'); // '$100.00'
const formattedDate = this.formatDate(new Date(), 'MM/dd/yyyy');
```

### Accessibility

**Location**: `wavemaker-rn-runtime/src/core/accessibility.ts`

```typescript
// Check if screen reader enabled
export async function isScreenReaderEnabled(): Promise<boolean>;

// Announce for screen reader
export function announceForAccessibility(message: string): void;

// Get accessibility label
export function getAccessibilityLabel(props: any): string;

// Get accessibility hint
export function getAccessibilityHint(props: any): string;

// Usage:
const isReaderEnabled = await isScreenReaderEnabled();
if (isReaderEnabled) {
  announceForAccessibility('Data loaded successfully');
}
```

## Event System

### EventNotifier

**Location**: `wavemaker-rn-runtime/src/core/event-notifier.ts`

```typescript
export default class EventNotifier {
  private listeners = new Map<string, Set<Function>>();
  
  /**
   * Subscribe to event
   */
  subscribe(event: string, listener: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    };
  }
  
  /**
   * Notify listeners
   */
  notify(event: string, ...args: any[]): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }
  
  /**
   * Unsubscribe all listeners for an event
   */
  unsubscribe(event: string): void {
    this.listeners.delete(event);
  }
  
  /**
   * Clear all listeners
   */
  destroy(): void {
    this.listeners.clear();
  }
}
```

### Usage Patterns

```typescript
class MyComponent extends BaseComponent<...> {
  protected init(): void {
    super.init();
    
    // Subscribe to events
    const unsubscribe1 = this.notifier.subscribe('dataChanged', (data) => {
      console.log('Data changed:', data);
      this.updateState({ data });
    });
    
    const unsubscribe2 = this.notifier.subscribe('statusUpdate', (status) => {
      this.updateState({ status });
    });
    
    // Register cleanup
    this.cleanup.push(unsubscribe1, unsubscribe2);
  }
  
  private updateData(newData: any): void {
    // Notify listeners
    this.notifier.notify('dataChanged', newData);
  }
}
```

## Common Patterns

### Pattern 1: Cleanup Management

```typescript
class MyWidget extends BaseComponent<...> {
  protected init(): void {
    super.init();
    
    // 1. Timers
    const timer = setInterval(() => {
      this.doSomething();
    }, 1000);
    
    this.cleanup.push(() => clearInterval(timer));
    
    // 2. Subscriptions
    const unsubscribe = someService.subscribe((data) => {
      this.handleData(data);
    });
    
    this.cleanup.push(unsubscribe);
    
    // 3. Event listeners
    const removeListener = this.notifier.subscribe('event', () => {});
    
    this.cleanup.push(removeListener);
  }
  
  // Cleanup is automatic - called in destroy()
}
```

### Pattern 2: Parent-Child Communication

```typescript
// Child notifies parent
class ChildWidget extends BaseComponent<...> {
  private notifyParent(data: any): void {
    if (this.parent) {
      (this.parent as ParentWidget).handleChildEvent(data);
    }
  }
}

// Parent accesses child
class ParentWidget extends BaseComponent<...> {
  private accessChild(): void {
    const child = this.getWidget('childName') as ChildWidget;
    if (child) {
      child.doSomething();
    }
  }
  
  public handleChildEvent(data: any): void {
    console.log('Child event:', data);
  }
}
```

### Pattern 3: Delayed Updates

```typescript
class MyWidget extends BaseComponent<...> {
  private debouncedUpdate = debounce((value: string) => {
    this.updateState({ searchQuery: value });
    this.performSearch(value);
  }, 300);
  
  private handleInput(value: string): void {
    // Debounced update
    this.debouncedUpdate(value);
  }
}
```

### Pattern 4: Lifecycle Hooks

```typescript
class MyWidget extends BaseComponent<...> {
  protected init(): void {
    super.init();
    console.log('Widget initialized');
    
    // Setup
    this.setupEventListeners();
    this.fetchInitialData();
  }
  
  protected onPropertyChange(prevProps: Props): void {
    // React to prop changes
    if (prevProps.datavalue !== this.props.datavalue) {
      this.handleDataChange(this.props.datavalue);
    }
  }
  
  protected destroy(): void {
    console.log('Widget destroyed');
    
    // Cleanup (automatic via this.cleanup array)
    super.destroy();
  }
}
```

## Best Practices

### Component Development

1. **Always Call super**: Call super.init() and super.destroy()
2. **Use Cleanup Array**: Register all cleanup functions
3. **Type Safety**: Use TypeScript interfaces
4. **Event Callbacks**: Use invokeEventCallback() for props
5. **State Updates**: Use updateState() instead of setState()

### Performance

1. **Memoization**: Implement shouldComponentUpdate when needed
2. **Debounce**: Debounce expensive operations
3. **Lazy Initialization**: Initialize expensive resources lazily
4. **Cleanup**: Always cleanup timers and subscriptions

### Memory Management

1. **Clear Timers**: Always clear intervals and timeouts
2. **Unsubscribe**: Unsubscribe from events and observables
3. **Null References**: Clear references on destroy
4. **Avoid Leaks**: Don't create circular references

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Core Infrastructure & BaseComponent API

