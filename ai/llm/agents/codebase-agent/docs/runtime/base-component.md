# BaseComponent API Reference

## Overview

`BaseComponent` is the abstract base class for all WaveMaker React Native widgets. It provides the foundational functionality including lifecycle management, property handling, styling, events, and rendering logic.

**Location:** `src/core/base.component.tsx`

## Class Signature

```typescript
abstract class BaseComponent<
  T extends BaseProps,        // Props type
  S extends BaseComponentState<T>,  // State type
  L extends BaseStyles        // Styles type
> extends React.Component<T, S>
```

## Constructor

```typescript
constructor(
  markupProps: T,
  defaultClass: string,
  defaultProps?: T,
  defaultState?: S
)
```

**Parameters:**
- `markupProps`: Properties from generated markup/code
- `defaultClass`: CSS class name for default styling (e.g., 'app-button')
- `defaultProps`: Default property values
- `defaultState`: Initial component state

**Example:**

```typescript
class WmButton extends BaseComponent<ButtonProps, ButtonState, ButtonStyles> {
  constructor(props: ButtonProps) {
    super(
      props,
      'app-button',                    // default class
      { caption: 'Button' },           // default props
      { pressed: false } as ButtonState // default state
    );
  }
}
```

## Properties

### Public Properties

#### `styles: L`
Current merged styles for the component.

```typescript
// Access component styles
console.log(this.styles.root);    // Container styles
console.log(this.styles.text);    // Text styles
```

#### `proxy: BaseComponent<T, S, L>`
Proxy object for clean external API.

```typescript
// Users interact with proxy, not direct instance
const button = /* component instance */;
button.proxy.caption = "New Text";  // Via proxy
```

#### `parent: BaseComponent`
Reference to parent component in the tree.

```typescript
// Access parent
if (this.parent) {
  console.log('Parent:', this.parent.constructor.name);
}
```

#### `theme: Theme`
Current theme object.

```typescript
// Access theme
const buttonStyle = this.theme.getStyle('app-button');
```

#### `initialized: boolean`
Whether component has completed mount lifecycle.

```typescript
if (this.initialized) {
  // Component is fully initialized
}
```

#### `destroyed: boolean`
Whether component has been unmounted.

```typescript
if (this.destroyed) {
  // Component is destroyed, avoid state updates
  return;
}
```

#### `notifier: EventNotifier`
Event notification system.

```typescript
// Emit events
this.notifier.notify('dataLoaded', [data]);

// Subscribe to events
this.notifier.subscribe('dataLoaded', callback);
```

#### `componentNode: WmComponentNode`
Node in the component tree.

```typescript
// Add child
this.componentNode.add(childNode);

// Find children
const found = this.componentNode.find(node => 
  node.instance.props.name === 'button1'
);
```

#### `layout: Layout`
Component layout information (position and dimensions).

```typescript
interface Layout {
  x: number;      // Relative X position
  y: number;      // Relative Y position
  width: number;  // Width in pixels
  height: number; // Height in pixels
  px: number;     // Absolute X position
  py: number;     // Absolute Y position
}

// Access layout
console.log(this.layout.width, this.layout.height);
```

## Core Methods

### Lifecycle Methods

#### `componentDidMount()`
Called after component is mounted to DOM.

```typescript
componentDidMount() {
  super.componentDidMount();
  // Component is now initialized
  // Safe to call APIs, setup timers, etc.
}
```

#### `componentWillUnmount()`
Called before component is unmounted.

```typescript
componentWillUnmount() {
  super.componentWillUnmount();
  // Cleanup subscriptions, timers, etc.
}
```

#### `componentDidUpdate(prevProps, prevState, snapshot)`
Called after component updates.

```typescript
componentDidUpdate(prevProps: T, prevState: S, snapshot?: any) {
  super.componentDidUpdate(prevProps, prevState, snapshot);
  // Handle prop/state changes
}
```

#### `shouldComponentUpdate(nextProps, nextState, nextContext)`
Determines if component should re-render.

```typescript
shouldComponentUpdate(nextProps: T, nextState: S, nextContext: any): boolean {
  // BaseComponent provides optimized implementation
  // Override only if custom logic needed
  return super.shouldComponentUpdate(nextProps, nextState, nextContext);
}
```

#### Custom Lifecycle Hooks

**`componentWillAttach()`**
Called before component is added to visible tree.

```typescript
componentWillAttach() {
  // Component is about to become visible
  // Used by fixed/sticky components
}
```

**`componentWillDetach()`**
Called before component is removed from visible tree.

```typescript
componentWillDetach() {
  // Component is about to be hidden
  // Used by fixed/sticky components
}
```

### Property Management

#### `setProp(propName: string, value: any)`
Set a property value at runtime.

```typescript
// Set caption property
component.setProp('caption', 'New Caption');

// Triggers onPropertyChange and re-render
```

#### `setPropDefault(propName: string, value: any)`
Update default value for a property.

```typescript
// Change default without triggering change event
component.setPropDefault('caption', 'Default Caption');
```

#### `onPropertyChange(name: string, newValue: any, oldValue: any)`
Called when a property changes. Override to handle specific properties.

```typescript
onPropertyChange(name: string, $new: any, $old: any) {
  if (name === 'caption') {
    // Handle caption change
    console.log(`Caption changed from ${$old} to ${$new}`);
  }
}
```

### State Management

#### `updateState(newPartialState: S, callback?: () => void)`
Update component state safely.

```typescript
// Update state
this.updateState({
  pressed: true
} as S);

// With callback
this.updateState({ pressed: true } as S, () => {
  console.log('State updated');
});
```

**Features:**
- Safe for use before and after initialization
- Debounced for performance
- Respects destroyed state
- Triggers listener callbacks

### Event Handling

#### `invokeEventCallback(eventName: string, args: any[])`
Invoke user-defined event callback.

```typescript
// Invoke onTap callback
this.invokeEventCallback('onTap', [event, this.proxy]);

// In markup:
// <WmButton onTap={(event, widget) => { ... }} />
```

#### `subscribe(event: string, fn: Function): Function`
Subscribe to component events.

```typescript
// Subscribe
const unsubscribe = component.subscribe('dataLoaded', (data) => {
  console.log('Data:', data);
});

// Unsubscribe
unsubscribe();
```

#### `notify(event: string, args: any[], emitToParent: boolean)`
Emit an event.

```typescript
// Emit to subscribers
this.notify('dataLoaded', [data]);

// Emit to parent as well
this.notify('childEvent', [data], true);
```

### Styling

#### `getDefaultStyles(): BaseStyles`
Get default styles from theme.

```typescript
getDefaultStyles(): BaseStyles {
  return this.theme.getStyle(this.defaultClass);
}
```

#### `getStyleClassName(): string`
Get custom class name for component.

```typescript
const className = this.getStyleClassName();
// Returns value of 'classname' prop
```

### Rendering

#### `abstract renderWidget(props: T): ReactNode`
Must be implemented by subclasses to render the widget.

```typescript
renderWidget(props: ButtonProps): ReactNode {
  return (
    <TouchableOpacity style={this.styles.root}>
      <Text style={this.styles.text}>{props.caption}</Text>
    </TouchableOpacity>
  );
}
```

#### `renderSkeleton(props: T): ReactNode`
Optional skeleton loader rendering.

```typescript
renderSkeleton(props: ButtonProps): ReactNode {
  return (
    <View style={styles.skeleton}>
      <SkeletonPlaceholder />
    </View>
  );
}
```

#### `render(): ReactNode`
Main render method (provided by BaseComponent).

```typescript
// Don't override this method
// Override renderWidget() instead
render(): ReactNode {
  // BaseComponent handles:
  // - Context consumption
  // - Style merging
  // - Visibility checks
  // - Skeleton rendering
  // - Fixed positioning
  // - Animations
  // Then calls renderWidget()
}
```

### Utility Methods

#### `refresh()`
Force component to re-render.

```typescript
component.refresh();
```

#### `cleanRefresh()`
Force re-render and notify children.

```typescript
component.cleanRefresh();
// Also emits 'forceUpdate' event
```

#### `reset()`
Reset component to initial state. Override for custom logic.

```typescript
reset() {
  // Reset to initial state
  this.updateState(this.initialState);
}
```

#### `animate(props: AnimatableProps)`
Animate the component.

```typescript
component.animate({
  animation: 'fadeIn',
  duration: 300,
  easing: 'ease-out'
});
```

**Animation Options:**
- `animation`: Animation name (e.g., 'fadeIn', 'bounceIn')
- `duration`: Duration in milliseconds
- `delay`: Delay before starting
- `easing`: Easing function
- `iterationCount`: Number of times to repeat

### Testing & Accessibility

#### `getTestId(suffix?: string): string`
Get test ID for component.

```typescript
const testId = this.getTestId();
// Returns: "page1_button1"

const testIdWithSuffix = this.getTestId('submit');
// Returns: "page1_button1_submit"
```

#### `getTestProps(suffix?: string): object`
Get test props (testID and accessibilityLabel).

```typescript
<TouchableOpacity {...this.getTestProps()}>
  {/* ... */}
</TouchableOpacity>
```

#### `getTestPropsForInput(suffix?: string): object`
Get test props for input widgets (uses 'i' suffix by default).

```typescript
<TextInput {...this.getTestPropsForInput()} />
// testID: "page1_text1_i"
```

#### `getTestPropsForAction(suffix?: string): object`
Get test props for action widgets (uses 'a' suffix by default).

```typescript
<TouchableOpacity {...this.getTestPropsForAction()}>
```

#### `getTestPropsForLabel(suffix?: string): object`
Get test props for label widgets (uses 'l' suffix by default).

```typescript
<Text {...this.getTestPropsForLabel()}>
```

### Layout & Positioning

#### `handleLayout(event: LayoutChangeEvent, ref?: React.RefObject<View>)`
Handle layout changes and update layout info.

```typescript
<View onLayout={(e) => this.handleLayout(e)}>
  {/* ... */}
</View>
```

#### `getLayout(): Layout`
Get current layout information.

```typescript
const layout = component.getLayout();
console.log(layout.width, layout.height);
console.log(layout.px, layout.py); // Absolute position
```

#### `getLayoutOfWidget(name: string): {x: number, y: number} | undefined`
Get layout of a widget by name.

```typescript
const position = this.getLayoutOfWidget('button1');
if (position) {
  console.log(position.x, position.y);
}
```

### Scrolling

#### `scrollToTop()`
Scroll to top of scrollable container.

```typescript
component.scrollToTop();
```

#### `scrollToEnd()`
Scroll to end of scrollable container.

```typescript
component.scrollToEnd();
```

#### `scrollToPosition(widgetName: string)`
Scroll to specific widget position.

```typescript
component.scrollToPosition('targetWidget');
```

### Visibility

#### `showView(): boolean`
Determine if component should be visible.

```typescript
showView(): boolean {
  return this.isVisible();
}
```

#### `isVisible(): boolean`
Check if component is visible based on 'show' prop.

```typescript
if (component.isVisible()) {
  // Component is visible
}
```

### RTL Support

#### `get isRTL(): boolean`
Check if current locale is Right-to-Left.

```typescript
if (this.isRTL) {
  // Apply RTL-specific logic
}
```

## Properties Reference

### BaseProps

Base properties available on all components:

```typescript
interface BaseProps extends StyleProps {
  id?: string;                    // Unique identifier
  name?: string;                  // Widget name
  key?: any;                      // React key
  disabled?: boolean;             // Disabled state
  show?: boolean | string | number; // Visibility
  styles?: any;                   // Inline styles
  classname?: string;             // CSS class name
  listener?: LifecycleListener;   // Lifecycle listener
  showindevice?: ('xs'|'sm'|'md'|'lg'|'xl'|'xxl')[]; // Responsive visibility
  showskeleton?: boolean;         // Show skeleton loader
  deferload?: boolean;            // Defer loading
  showskeletonchildren?: boolean; // Show skeleton for children
  disabletoucheffect?: boolean;   // Disable touch effects
  isdefault?: boolean;            // Is default widget
}
```

### LifecycleListener

```typescript
interface LifecycleListener {
  onComponentInit?: (component: BaseComponent) => void;
  onComponentChange?: (component: BaseComponent) => void;
  onComponentDestroy?: (component: BaseComponent) => void;
}
```

**Usage:**

```typescript
<WmButton 
  name="button1"
  listener={{
    onComponentInit: (widget) => {
      console.log('Button initialized');
    },
    onComponentChange: (widget) => {
      console.log('Button changed');
    },
    onComponentDestroy: (widget) => {
      console.log('Button destroyed');
    }
  }}
/>
```

## Advanced Features

### Component Proxy

BaseComponent creates a proxy for clean external API:

```typescript
// Proxy intercepts property access
const proxy = new Proxy(component, {
  get: (target, prop) => {
    // Return prop from PropsProvider if exists
    if (propsProvider.has(prop)) {
      return state.props[prop];
    }
    return target[prop];
  },
  set: (target, prop, value) => {
    // Set prop via PropsProvider
    if (propsProvider.has(prop)) {
      propsProvider.overrideProp(prop, value);
      updateState({ props: {[prop]: value} });
      return true;
    }
    target[prop] = value;
    return true;
  }
});
```

**Benefits:**
- Clean API for users
- Property validation
- Change tracking
- State synchronization

### Cleanup Management

BaseComponent manages cleanup via cleanup array:

```typescript
// Register cleanup function
this.cleanup.push(() => {
  // Cleanup logic
  subscription.unsubscribe();
});

// Automatically called on unmount
componentWillUnmount() {
  this.cleanup.forEach(fn => fn());
}
```

### Parent-Child Relationships

Components automatically establish parent-child relationships:

```typescript
setParent(parent: BaseComponent) {
  this.parent = parent;
  this.parent.componentNode.add(this.componentNode);
  this.notifier.setParent(parent.notifier);
  
  // Listen to parent events
  this.parentListenerDestroyers = [
    this.parent.subscribe('forceUpdate', () => {
      this.forceUpdate();
    }),
    this.parent.subscribe('destroy', () => {
      this.destroyParentListeners();
    })
  ];
}
```

### Fixed Positioning

Components can be fixed positioned:

```typescript
// If styles.root.position === 'fixed'
renderFixedContainer(props: T) {
  // Renders in FixedView (portal-like)
  return (
    <FixedView style={fixedStyles} theme={this.theme}>
      {this.renderWidget(props)}
    </FixedView>
  );
}
```

### Background Handling

Complex background styles are handled separately:

```typescript
setBackground() {
  const bgStyle = this.styles.root;
  
  this._background = (
    <BackgroundComponent 
      image={bgStyle.backgroundImage}
      position={bgStyle.backgroundPosition}
      size={bgStyle.backgroundSize}
      repeat={bgStyle.backgroundRepeat}
      resizeMode={bgStyle.backgroundResizeMode}
      style={{borderRadius: this.styles.root.borderRadius}}
    />
  );
  
  // Remove from root style (handled by BackgroundComponent)
  delete this.styles.root.backgroundImage;
  delete this.styles.root.backgroundPosition;
  // ...
}
```

## Example: Custom Component

```typescript
import { BaseComponent, BaseProps, BaseStyles, defineStyles } from '@wavemaker/app-rn-runtime/core/base.component';
import { View, Text, TouchableOpacity } from 'react-native';

// 1. Define Props
interface CustomButtonProps extends BaseProps {
  caption?: string;
  iconclass?: string;
  onTap?: (event: any, widget: any) => void;
}

// 2. Define State
interface CustomButtonState extends BaseComponentState<CustomButtonProps> {
  pressed: boolean;
}

// 3. Define Styles
interface CustomButtonStyles extends BaseStyles {
  icon: TextStyle;
}

// 4. Define default styles
const DEFAULT_STYLES = defineStyles<CustomButtonStyles>({
  root: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5
  },
  text: {
    color: '#ffffff',
    fontSize: 16
  },
  icon: {
    marginRight: 5,
    color: '#ffffff'
  }
});

// 5. Implement Component
export class WmCustomButton extends BaseComponent<
  CustomButtonProps,
  CustomButtonState,
  CustomButtonStyles
> {
  constructor(props: CustomButtonProps) {
    super(
      props,
      'app-custom-button',
      { caption: 'Button' },
      { pressed: false } as CustomButtonState
    );
  }
  
  // Override property change handler
  onPropertyChange(name: string, $new: any, $old: any) {
    if (name === 'caption') {
      console.log(`Caption changed: ${$old} → ${$new}`);
    }
  }
  
  // Handle press
  private handlePress = (event: any) => {
    if (this.state.props.disabled) {
      return;
    }
    
    this.updateState({ pressed: true } as CustomButtonState);
    
    setTimeout(() => {
      this.updateState({ pressed: false } as CustomButtonState);
    }, 150);
    
    this.invokeEventCallback('onTap', [event, this.proxy]);
  }
  
  // Render widget
  renderWidget(props: CustomButtonProps): ReactNode {
    return (
      <TouchableOpacity
        style={this.styles.root}
        onPress={this.handlePress}
        disabled={props.disabled}
        {...this.getTestProps()}
      >
        {this._background}
        {props.iconclass && (
          <Icon name={props.iconclass} style={this.styles.icon} />
        )}
        <Text style={this.styles.text}>
          {props.caption}
        </Text>
      </TouchableOpacity>
    );
  }
}
```

## Next Steps

- [Component Lifecycle](./component-lifecycle.md) - Detailed lifecycle documentation
- [Services](./services.md) - Service layer reference
- [Core Concepts](./core-concepts.md) - Back to core concepts

