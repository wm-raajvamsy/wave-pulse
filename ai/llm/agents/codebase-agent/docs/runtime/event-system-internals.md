# Event System and Modal Internals

This document covers the event notification system, subscription mechanisms, event propagation patterns, and the modal/dialog system in WaveMaker React Native.

## Table of Contents

1. [EventNotifier Class](#eventnotifier-class)
2. [Event Propagation Patterns](#event-propagation-patterns)
3. [Subscription Management](#subscription-management)
4. [BaseComponent Integration](#basecomponent-integration)
5. [System Events](#system-events)
6. [Modal System Architecture](#modal-system-architecture)
7. [Custom Events](#custom-events)

---

## EventNotifier Class

The `EventNotifier` class is the foundation of the event system, providing pub/sub functionality with hierarchical event propagation.

### Architecture

**File**: `src/core/event-notifier.ts`

```typescript
export default class EventNotifier {
  public static ROOT = new EventNotifier();
  public name = '';
  public id = i++;
  
  private listeners = {} as any;
  private parent: EventNotifier = EventNotifier.ROOT;
  private children: EventNotifier[] = [];
}
```

### Hierarchical Structure

```
EventNotifier.ROOT
  ├── App EventNotifier
  │   ├── Page EventNotifier
  │   │   ├── Widget1 EventNotifier
  │   │   ├── Widget2 EventNotifier
  │   │   └── Widget3 EventNotifier
  │   └── Partial EventNotifier
  └── Dialog EventNotifier
```

Each component has its own `EventNotifier` instance organized in a tree structure.

---

## Core Methods

### `subscribe(event: string, fn: Function)`

Registers an event listener and returns an unsubscribe function.

```typescript
public subscribe(event: string, fn: Function) {
  this.listeners[event] = this.listeners[event] || [];
  this.listeners[event].push(fn);
  
  // Return unsubscribe function
  return () => {
    const eventListeners = this.listeners[event];
    const i = eventListeners.findIndex((fni: Function) => fni === fn);
    eventListeners.splice(i, 1);
  };
}
```

**Usage**:
```typescript
// Subscribe to an event
const unsubscribe = this.notifier.subscribe('dataChange', (newData) => {
  console.log('Data changed:', newData);
});

// Later: unsubscribe
unsubscribe();
```

**Key Features**:
- Multiple listeners per event
- Returns cleanup function
- Array-based listener storage
- Automatic listener removal

### `notify(event: string, args: any[], emitToParent: boolean)`

Triggers an event and propagates it through the component tree.

```typescript
public notify(event: string, args: any[], emitToParent = false) {
  let propagate = true;
  
  // Execute local listeners
  if (this.listeners[event]) {
    propagate = !this.listeners[event].find((l: Function) => {
      try {
        return (l && l.apply(null, args)) === false;
      } catch(e) {
        console.error(e);
      }
      return true;
    });
  }
  
  // Propagate if not stopped
  if (propagate) {
    if (this.parent && !!this.parent?.children?.length && emitToParent) {
      // Propagate upward to parent
      this.parent?.notify(event, args, true);
    } else {
      // Propagate downward to children
      this.children.forEach((c) => {
        c.notify(event, args);
      });
    }
  }
}
```

**Propagation Control**:
- Listener can return `false` to stop propagation
- `emitToParent=true`: propagates upward to parent
- `emitToParent=false`: propagates downward to children (default)

### `setParent(parent: EventNotifier)`

Establishes parent-child relationship in the event tree.

```typescript
setParent(parent: EventNotifier) {
  if (parent !== this.parent) {
    this.removeFromParent();
    this.parent = parent;
    this.parent.children.push(this);
  }
}
```

### `destroy()`

Cleans up the event notifier.

```typescript
public destroy() {
  this.removeFromParent();
}

private removeFromParent() {
  if (this.parent) {
    const i = this.parent.children.indexOf(this) || -1;
    if (i >= 0) {
      this.parent.children.splice(i, 1);
    }
    this.parent = null as any;
  }
}
```

---

## Event Propagation Patterns

### Downward Propagation (Default)

Events propagate from parent to all children.

```
Parent Component (notify)
    ├── Child 1 (receives event)
    ├── Child 2 (receives event)
    └── Child 3 (receives event)
```

**Example**:
```typescript
// Parent notifies all children
parentComponent.notify('themeChange', [newTheme], false);
```

### Upward Propagation

Events propagate from child to parent when `emitToParent=true`.

```
Child Component (notify with emitToParent=true)
    └── Parent (receives event)
        └── Grandparent (receives event)
            └── Root (receives event)
```

**Example**:
```typescript
// Child notifies parent chain
childComponent.notify('customEvent', [data], true);
```

### Stopping Propagation

Any listener can stop propagation by returning `false`.

```typescript
// This listener stops propagation
component.subscribe('myEvent', (data) => {
  console.log('Handling event');
  return false; // Stops further propagation
});

// This listener won't be called if above returns false
component.subscribe('myEvent', (data) => {
  console.log('This may not execute');
});
```

---

## Subscription Management

### Lifecycle Integration

Subscriptions should be cleaned up when components unmount.

```typescript
class MyComponent extends BaseComponent {
  private unsubscribers: Function[] = [];

  componentDidMount() {
    // Subscribe to events
    const unsub1 = this.notifier.subscribe('event1', this.handler1);
    const unsub2 = this.notifier.subscribe('event2', this.handler2);
    
    // Store for cleanup
    this.unsubscribers.push(unsub1, unsub2);
  }

  componentWillUnmount() {
    // Cleanup all subscriptions
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers.length = 0;
  }
}
```

### Multiple Listeners Per Event

Multiple components can listen to the same event.

```typescript
// Component A listens
componentA.notifier.subscribe('dataLoad', (data) => {
  console.log('Component A received data');
});

// Component B listens to same event
componentB.notifier.subscribe('dataLoad', (data) => {
  console.log('Component B received data');
});

// Parent notifies all children
parent.notify('dataLoad', [newData], false);
// Both Component A and B receive the event
```

### Parent Listener Registration

`BaseComponent` supports listening to parent events via `parentListenerDestroyers`.

**File**: `src/core/base.component.tsx`

```typescript
export abstract class BaseComponent {
  private parentListenerDestroyers = [] as Function[];

  protected listenToParent(event: string, handler: Function) {
    if (this.parent) {
      const unsubscribe = this.parent.notifier.subscribe(event, handler);
      this.parentListenerDestroyers.push(unsubscribe);
    }
  }

  componentWillUnmount() {
    // Cleanup parent listeners
    this.parentListenerDestroyers.forEach(unsub => unsub());
    // ...
  }
}
```

---

## BaseComponent Integration

Every `BaseComponent` has an integrated `EventNotifier`.

### Component Properties

```typescript
export abstract class BaseComponent {
  public notifier = new EventNotifier();
  private parentListenerDestroyers = [] as Function[];
}
```

### Public Methods

```typescript
// Subscribe to events on this component
public subscribe(event: string, fn: Function) {
  return this.notifier.subscribe(event, fn);
}

// Notify event to component tree
public notify(event: string, args: any[], emitToParent = false) {
  return this.notifier.notify(event, args, emitToParent);
}
```

### Usage in Components

```typescript
export default class WmButton extends BaseComponent {
  handleTap() {
    // Notify parent components
    this.notify('buttonTapped', [this.props.id], true);
    
    // Execute tap handler
    this.props.onTap?.();
  }
}
```

---

## System Events

### ViewPort Events

**File**: `src/core/viewport.ts`

The `ViewPort` class extends `EventNotifier` to broadcast device dimension changes.

```typescript
export const EVENTS = {
  SIZE_CHANGE: 'sizeChange',
  ORIENTATION_CHANGE: 'orientationChange'
};

export class ViewPort extends EventNotifier {
  public width: number;
  public height: number;
  public orientation: string;

  constructor() {
    super();
    Dimensions.addEventListener('change', () => {
      const dim = Dimensions.get('window');
      const orientation = dim.width > dim.height 
        ? SCREEN_ORIENTATION.LANDSCAPE 
        : SCREEN_ORIENTATION.PORTRAIT;
      
      // Notify size change
      this.notify(EVENTS.SIZE_CHANGE, [
        {width: dim.width, height: dim.height}, 
        {width: this.width, height: this.height}
      ]);
      
      this.width = dim.width;
      this.height = dim.height;
      
      // Notify orientation change
      if (this.orientation != orientation) {
        this.notify(EVENTS.ORIENTATION_CHANGE, [orientation, this.orientation]);
        this.orientation = orientation;
      }
    });
  }
}
```

**Subscribing to ViewPort Events**:
```typescript
import viewport from '@wavemaker/app-rn-runtime/core/viewport';

viewport.subscribe(EVENTS.SIZE_CHANGE, (newDim, oldDim) => {
  console.log(`Size changed from ${oldDim.width}x${oldDim.height} to ${newDim.width}x${newDim.height}`);
});
```

### Scroll Events

**File**: `src/core/sticky-wrapper.tsx`

Scroll events are throttled and notified every 100ms.

```typescript
const onScroll = useAnimatedScrollHandler({
  onScroll: (event: ReanimatedEvent<ScrollEvent>): void => {
    'worklet';
    const currentScrollTime = Date.now();
    
    // Throttle notifications to every 100ms
    if(currentScrollTime - lastNotifyTime.value >= 100){
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

const notifyEvent = (event: CustomJsScrollEvent) => {
  if(notifier) {
    notifier.notify('scroll', [{nativeEvent: event}]);
  }
}
```

**Why Throttle?**
- Scroll events fire very frequently (60+ fps)
- Throttling to 100ms reduces event overhead
- Still responsive for UI updates

### Network Events

**File**: `src/core/network.service.ts`

Network service notifies connection state changes.

```typescript
class NetworkService {
  private notifier = new EventNotifier();

  async start(appConfig: AppConfig) {
    NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      
      if (this.isOnline !== isConnected) {
        this.isOnline = isConnected;
        
        // Notify connection change
        this.notifier.notify('connectionChange', [isConnected]);
      }
    });
  }
}
```

### Theme Events

Theme changes trigger notifications to all subscribed components.

```typescript
class Theme {
  private listeners: Function[] = [];

  subscribe(callback: Function) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  updateTheme(newTheme: any) {
    this.currentTheme = newTheme;
    // Notify all listeners
    this.listeners.forEach(listener => listener(newTheme));
  }
}
```

---

## Modal System Architecture

The modal system provides layered dialog display with stacking, animations, and lifecycle management.

### Core Components

#### 1. ModalService Interface

**File**: `src/core/modal.service.ts`

```typescript
export interface ModalOptions {
  elevationIndex: number;
  name?: string;
  content: React.ReactNode;
  modalStyle?: any;
  contentStyle?: any;
  centered?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  isModal?: boolean;
  animation: string;
  animationdelay: number;
}

export interface ModalService {
  refresh: () => void;
  showModal: (options: ModalOptions) => void;
  hideModal: (options: ModalOptions) => void;
}
```

#### 2. AppModalService Implementation

**File**: `src/runtime/services/app-modal.service.tsx`

```typescript
class AppModalService implements ModalService {
  public modalOptions = {} as ModalOptions;
  public modalsOpened = [] as ModalOptions[];
  public animatedRefs: any = [];
  private backHandlerSubscription: NativeEventSubscription | null = null;

  public showModal(options: ModalOptions) {
    const i = this.modalsOpened.findIndex(o => o === options);
    if (i < 0) {
      // Calculate elevation/z-index
      options.elevationIndex = parseInt(
        this.getAppConfig().app.toastsOpened + this.modalsOpened.length + 1
      );
      
      // Add to stack
      this.modalsOpened.push(options);
      this.showLastModal();
      
      // Trigger onOpen callback after 500ms (accessibility)
      setTimeout(() => {
        this.modalOptions.onOpen && this.modalOptions.onOpen();
      }, 500);
    }
  }

  public hideModal(options?: ModalOptions) {
    const i = options 
      ? this.modalsOpened.findIndex(o => o === options) 
      : (this.modalsOpened.length - 1);
    
    if (i >= 0) {
      Promise.resolve()
        // Trigger exit animation
        .then(() => this.modalsOpened.length > 1 && 
          this.animatedRefs && this.animatedRefs[i].triggerExit())
        // Call onClose callback
        .then(() => {
          const o = this.modalsOpened[i];
          return o && o.onClose && o.onClose();
        })
        // Remove from stack
        .then(() => this.modalsOpened.splice(i, 1))
        // Show previous modal
        .then(() => this.showLastModal());
    }
    
    this.clearBackButtonPress();
  }

  private showLastModal() {
    this.modalOptions = this.modalsOpened.length 
      ? this.modalsOpened[this.modalsOpened.length - 1] 
      : {} as ModalOptions;
    
    this.refresh();
    this.setBackButtonPress();
  }

  public refresh() {
    this.getAppConfig().refresh();
  }
}
```

### Modal Stacking

Modals are stacked with increasing elevation/z-index:

```
Modal 3 (z-index: 3) ← Top
Modal 2 (z-index: 2)
Modal 1 (z-index: 1)
App Content (z-index: 0) ← Bottom
```

**Elevation Calculation**:
```typescript
options.elevationIndex = toastsOpened + modalsOpened.length + 1;
```

### Modal Rendering in App

**File**: `src/runtime/App.tsx`

```typescript
renderDialogs(): ReactNode {
  return <WmMemo watcher={this.watcher} render={(watch) => {
    // Watch for modal stack changes
    watch(() => last(AppModalService.modalsOpened)?.content);
    
    this.modalsOpened = AppModalService.modalsOpened.length;
    AppModalService.animatedRefs.length = 0;
    
    return (
      <>
        {AppModalService.modalOptions.content &&
          AppModalService.modalsOpened.map((o, i) => {
            return (
              <View 
                key={(o.name || '') + i}
                onStartShouldSetResponder={() => true}
                onResponderEnd={() => o.isModal && AppModalService.hideModal(o)}
                style={deepCopy(
                  styles.appModal,
                  o.centered ? styles.centeredModal : null,
                  o.modalStyle,
                  {
                    elevation: o.elevationIndex,
                    zIndex: o.elevationIndex
                  }
                )}>
                <Animatedview 
                  entryanimation={o.animation || 'fadeIn'} 
                  delay={o.animationdelay}
                  ref={ref => {
                    this.animatedRef = ref;
                    AppModalService.animatedRefs[i] = ref;
                  }}
                  style={[styles.appModalContent, o.contentStyle]}>
                  <GestureHandlerRootView style={{ width: '100%', alignItems: 'center' }}>
                    <View
                      onStartShouldSetResponder={evt => true}
                      onResponderEnd={(e) => e.stopPropagation()}
                      style={{ width: '100%', alignItems: 'center' }}>
                      {this.getProviders(o.content)}
                    </View>
                  </GestureHandlerRootView>
                </Animatedview>
              </View>
            );
          })
        }
      </>
    );
  }} />
}
```

### Dialog Component

**File**: `src/components/dialogs/dialog/dialog.component.tsx`

```typescript
export default class WmDialog extends BaseComponent {
  renderWidget(props: WmDialogProps) {
    return (
      <ModalConsumer>
        {(modalService: ModalService) => {
          modalService.showModal(this.prepareModalOptions((
            <AssetProvider value={this.loadAsset}>
              <ThemeProvider value={this.theme}>
                <View style={[this.styles.root, dynamicMaxHeight]}>
                  {this._background}
                  
                  {/* Header */}
                  {props.showheader ? (
                    <View style={this.styles.header}>
                      <View style={this.styles.headerLabel}>
                        {props.iconclass || props.iconurl || props.title ?
                          <WmIcon 
                            caption={props.title}
                            iconclass={props.iconclass}
                            styles={this.styles.icon}
                          /> : null}
                      </View>
                      
                      {/* Close button */}
                      {props.closable && 
                        <WmButton 
                          show={props.closable} 
                          iconclass="wm-sl-l sl-close" 
                          onTap={() => this.close()} 
                          styles={this.styles.closeBtn}
                        />
                      }
                    </View>
                  ) : null}
                  
                  {/* Content */}
                  {props.children}
                </View>
              </ThemeProvider>
            </AssetProvider>
          ), modalService));
          
          return null;
        }}
      </ModalConsumer>
    );
  }

  prepareModalOptions(content: React.ReactNode, modalService: ModalService) {
    const o = {
      name: this.props.name,
      content: content,
      onClose: () => this.invokeEventCallback('close', [null]),
      onOpen: () => this.invokeEventCallback('open', [null]),
      animation: this.props.animation,
      animationdelay: this.props.animationdelay,
      modalStyle: this.styles.modal,
      contentStyle: this.styles.modalContent,
      isModal: this.props.modal,
      centered: this.props.centered
    } as ModalOptions;
    
    return o;
  }
}
```

### Modal Features

#### 1. **Backdrop Dismissal**

```typescript
<View 
  onStartShouldSetResponder={() => true}
  onResponderEnd={() => o.isModal && AppModalService.hideModal(o)}>
  {/* Modal content */}
</View>
```

Tapping outside the modal (on backdrop) closes it if `isModal=true`.

#### 2. **Animation Support**

Each modal can have entry/exit animations:

```typescript
<Animatedview 
  entryanimation={o.animation || 'fadeIn'} 
  delay={o.animationdelay}
  ref={ref => AppModalService.animatedRefs[i] = ref}>
```

#### 3. **Hardware Back Button (Android)**

```typescript
private setBackButtonPress() {
  if (isAndroid() && !isWebPreviewMode() && this.modalsOpened.length > 0) {
    this.backHandlerSubscription = BackHandler.addEventListener(
      'hardwareBackPress', 
      this.handleBackButtonPress
    );
  }
}

private handleBackButtonPress = () => {
  if (this.modalsOpened.length) {
    this.hideModal();
    return true; // Prevent default back behavior
  }
  return false;
}
```

#### 4. **Lifecycle Callbacks**

```typescript
showModal(options: ModalOptions) {
  // ...
  setTimeout(() => {
    this.modalOptions.onOpen && this.modalOptions.onOpen();
  }, 500); // Delay for accessibility
}

hideModal(options?: ModalOptions) {
  // ...
  .then(() => {
    const o = this.modalsOpened[i];
    return o && o.onClose && o.onClose();
  })
  // ...
}
```

### Modal Context Provider

```typescript
const ModalContext = React.createContext<ModalService>(null as any);

export const ModalProvider = ModalContext.Provider;
export const ModalConsumer = ModalContext.Consumer;
```

The app provides the modal service via context:

```typescript
<ModalProvider value={AppModalService}>
  <App />
</ModalProvider>
```

### Modal vs React Native Modal

WaveMaker has two modal implementations:

#### 1. **WmModal Component** (Basic)

**File**: `src/components/basic/modal/modal.component.tsx`

Uses React Native's `<Modal>` directly:

```typescript
renderWidget(props: WmModalProps) {
  return (
    <View style={this.styles.root}>
      <ReactModal
        animationType={props.animationType}
        transparent={true}
        style={this.styles.content}>
        {props.children}
      </ReactModal>
    </View>
  );
}
```

#### 2. **WmDialog Component** (Advanced)

Uses custom modal service with stacking, animations, and lifecycle.

**When to use**:
- **WmModal**: Simple overlays, no stacking needed
- **WmDialog**: Complex dialogs, multiple modals, animations

---

## Custom Events

### Creating Custom Events

```typescript
export default class WmCustomWidget extends BaseComponent {
  handleCustomAction() {
    // Notify with custom event
    this.notify('customAction', [{
      widgetId: this.props.id,
      data: this.state.data,
      timestamp: Date.now()
    }], false);
  }
}
```

### Listening to Custom Events

```typescript
export default class WmParentComponent extends BaseComponent {
  componentDidMount() {
    // Subscribe to child custom events
    this.children.forEach(child => {
      child.subscribe('customAction', (eventData) => {
        console.log('Child action:', eventData);
      });
    });
  }
}
```

### Event Best Practices

**DO**:
- Use specific event names (e.g., 'userLogin', not 'event')
- Pass structured data as event arguments
- Clean up subscriptions in `componentWillUnmount`
- Use `emitToParent=true` for bubbling events
- Return `false` from listener to stop propagation

**DON'T**:
- Don't create memory leaks by forgetting to unsubscribe
- Don't pass large objects as event data (performance)
- Don't use events for simple parent-child communication (use props)
- Don't rely on event order across different notifiers

---

## Performance Considerations

### Event Throttling

For high-frequency events, use throttling:

```typescript
let lastEventTime = 0;
const THROTTLE_MS = 100;

component.subscribe('highFrequencyEvent', (data) => {
  const now = Date.now();
  if (now - lastEventTime > THROTTLE_MS) {
    lastEventTime = now;
    handleEvent(data);
  }
});
```

### Efficient Propagation

Stop propagation when not needed:

```typescript
component.subscribe('dataChange', (newData) => {
  if (this.processData(newData)) {
    return false; // Stop propagation
  }
});
```

### Listener Cleanup

Always clean up to prevent memory leaks:

```typescript
componentWillUnmount() {
  this.parentListenerDestroyers.forEach(unsub => unsub());
  this.notifier.destroy();
}
```

---

## Summary

The event system provides:

- **Hierarchical EventNotifier**: Tree-based event propagation
- **Pub/Sub Pattern**: Multiple listeners per event
- **Bidirectional Propagation**: Both up and down the tree
- **Propagation Control**: Stop via return false
- **Automatic Cleanup**: Integrated with component lifecycle
- **System Events**: ViewPort, Network, Scroll, Theme
- **Modal System**: Stacked dialogs with animations and lifecycle
- **Performance**: Throttling and efficient propagation

This enables loose coupling between components while maintaining predictable event flow and proper memory management.

