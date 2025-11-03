# Component Agent - Detailed Documentation

## Overview

The **Component Agent** is the expert on widget implementation in WaveMaker React Native. It has comprehensive knowledge of all 50+ widgets, their architecture, props, lifecycle, and implementation details.

## Domain Expertise

### Core Responsibilities

1. **Component Architecture**
   - BaseComponent class and inheritance
   - Component lifecycle hooks
   - State and props management
   - Component hierarchy and relationships

2. **Widget Implementation**
   - How each widget is implemented
   - Widget-specific features
   - Props interface and types
   - Style definitions

3. **Component Patterns**
   - Composition patterns
   - Memoization strategies
   - Cleanup patterns
   - Performance optimizations

4. **Component Development**
   - Creating custom widgets
   - Extending existing widgets
   - Best practices and guidelines

## Knowledge Base

### Component Registry

Complete registry of all 50+ widgets organized by category:

```typescript
const COMPONENT_REGISTRY = {
  // Basic Widgets (8)
  basic: {
    'WmButton': 'components/basic/button/button.component.tsx',
    'WmLabel': 'components/basic/label/label.component.tsx',
    'WmIcon': 'components/basic/icon/icon.component.tsx',
    'WmPicture': 'components/basic/picture/picture.component.tsx',
    'WmHtml': 'components/basic/html/html.component.tsx',
    'WmSpinner': 'components/basic/spinner/spinner.component.tsx',
    'WmVideo': 'components/basic/video/video.component.tsx',
    'WmAudio': 'components/basic/audio/audio.component.tsx',
    'WmProgressBar': 'components/basic/progress-bar/progress-bar.component.tsx',
    'WmProgressCircle': 'components/basic/progress-circle/progress-circle.component.tsx',
  },
  
  // Container Widgets (12)
  container: {
    'WmContainer': 'components/container/container/container.component.tsx',
    'WmPanel': 'components/container/panel/panel.component.tsx',
    'WmTabs': 'components/container/tabs/tabs.component.tsx',
    'WmAccordion': 'components/container/accordion/accordion.component.tsx',
    'WmTile': 'components/container/tile/tile.component.tsx',
    'WmLayoutgrid': 'components/container/layoutgrid/layoutgrid.component.tsx',
    'WmGridColumn': 'components/container/layoutgrid/gridcolumn.component.tsx',
    'WmGridRow': 'components/container/layoutgrid/gridrow.component.tsx',
    'WmSegment': 'components/container/segment/segment.component.tsx',
    'WmWizard': 'components/container/wizard/wizard.component.tsx',
  },
  
  // Input Widgets (20)
  input: {
    'WmText': 'components/input/text/text.component.tsx',
    'WmTextarea': 'components/input/textarea/textarea.component.tsx',
    'WmNumber': 'components/input/number/number.component.tsx',
    'WmCheckbox': 'components/input/checkbox/checkbox.component.tsx',
    'WmRadioset': 'components/input/radioset/radioset.component.tsx',
    'WmSelect': 'components/input/select/select.component.tsx',
    'WmSwitch': 'components/input/switch/switch.component.tsx',
    'WmSlider': 'components/input/slider/slider.component.tsx',
    'WmRating': 'components/input/rating/rating.component.tsx',
    'WmDate': 'components/input/date/date.component.tsx',
    'WmTime': 'components/input/time/time.component.tsx',
    'WmDatetime': 'components/input/datetime/datetime.component.tsx',
    'WmCurrency': 'components/input/currency/currency.component.tsx',
    'WmColorPicker': 'components/input/color-picker/color-picker.component.tsx',
    'WmFileupload': 'components/input/fileupload/fileupload.component.tsx',
    'WmCheckboxset': 'components/input/checkboxset/checkboxset.component.tsx',
    'WmChips': 'components/input/chips/chips.component.tsx',
    'WmSearch': 'components/input/search/search.component.tsx',
  },
  
  // Data Widgets (6)
  data: {
    'WmList': 'components/data/list/list.component.tsx',
    'WmLivelist': 'components/data/list/livelist.component.tsx',
    'WmCard': 'components/data/card/card.component.tsx',
    'WmForm': 'components/data/form/form.component.tsx',
    'WmLiveform': 'components/data/form/liveform.component.tsx',
    'WmTable': 'components/data/table/table.component.tsx',
  },
  
  // Chart Widgets (5)
  chart: {
    'WmChart': 'components/chart/chart/chart.component.tsx',
    'WmBarchart': 'components/chart/barchart/barchart.component.tsx',
    'WmLinechart': 'components/chart/linechart/linechart.component.tsx',
    'WmPiechart': 'components/chart/piechart/piechart.component.tsx',
    'WmDonutchart': 'components/chart/donutchart/donutchart.component.tsx',
  },
  
  // Navigation Widgets (5)
  navigation: {
    'WmNav': 'components/navigation/nav/nav.component.tsx',
    'WmNavbar': 'components/navigation/navbar/navbar.component.tsx',
    'WmMenu': 'components/navigation/menu/menu.component.tsx',
    'WmPopover': 'components/navigation/popover/popover.component.tsx',
    'WmTabbar': 'components/navigation/tabbar/tabbar.component.tsx',
  },
  
  // Device Widgets (2)
  device: {
    'WmCamera': 'components/device/camera/camera.component.tsx',
    'WmBarcodescanner': 'components/device/barcodescanner/barcodescanner.component.tsx',
  },
  
  // Dialog Widgets (4)
  dialogs: {
    'WmAlertdialog': 'components/dialogs/alert-dialog/alert-dialog.component.tsx',
    'WmConfirmdialog': 'components/dialogs/confirm-dialog/confirm-dialog.component.tsx',
    'WmModal': 'components/dialogs/modal/modal.component.tsx',
    'WmPopup': 'components/dialogs/popup/popup.component.tsx',
  },
  
  // Page/Partial Containers
  page: {
    'WmPage': 'components/page/page/page.component.tsx',
    'WmPageContent': 'components/page/page-content/page-content.component.tsx',
    'WmHeader': 'components/page/header/header.component.tsx',
    'WmFooter': 'components/page/footer/footer.component.tsx',
    'WmLeftPanel': 'components/page/left-panel/left-panel.component.tsx',
  },
  
  // Advanced Widgets
  advanced: {
    'WmMedia': 'components/advanced/media/media.component.tsx',
    'WmCarousel': 'components/advanced/carousel/carousel.component.tsx',
    'WmQrcode': 'components/advanced/qrcode/qrcode.component.tsx',
  }
};
```

## BaseComponent Architecture

The foundation of all widgets is `BaseComponent`:

### Class Structure

```typescript
// Location: wavemaker-rn-runtime/src/core/base.component.tsx

export abstract class BaseComponent<
  T extends BaseProps,
  S extends BaseComponentState<T>,
  L extends BaseStyles
> extends React.Component<T, S> {
  
  // ============ Core Properties ============
  
  public styles: L;                        // Component styles
  public proxy: BaseComponent<T, S, L>;    // Props proxy for binding
  public _INSTANCE: BaseComponent<T, S, L>; // Component instance
  public initialized: boolean = false;     // Initialization flag
  public cleanup: Function[] = [];         // Cleanup functions
  public theme: Theme;                     // Current theme
  public parent: BaseComponent<any, any, any>; // Parent component
  public destroyed: boolean = false;       // Destruction flag
  public notifier: EventNotifier;          // Event notifier
  
  // ============ Lifecycle Methods ============
  
  constructor(props: T, defaultStyles: L, defaultClass: string) {
    super(props);
    this.styles = this.createStyles(defaultStyles, defaultClass);
    this.proxy = PropsProvider.provide(this);
    this.theme = BASE_THEME;
    this.notifier = new EventNotifier();
  }
  
  componentDidMount() {
    this.init();
  }
  
  componentWillUnmount() {
    this.destroy();
  }
  
  componentDidUpdate(prevProps: T) {
    this.onPropertyChange(prevProps);
  }
  
  // ============ Component Lifecycle Hooks ============
  
  // Called after component is mounted
  protected init(): void {
    if (this.initialized) return;
    
    this.initialized = true;
    this.invokeEventCallback('onLoad');
    this.props.listener?.onComponentInit?.(this);
  }
  
  // Called before component is unmounted
  protected destroy(): void {
    if (this.destroyed) return;
    
    this.destroyed = true;
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
    this.notifier.destroy();
    this.props.listener?.onComponentDestroy?.(this);
  }
  
  // Called when props change
  protected onPropertyChange(prevProps: T): void {
    // Override in subclass to handle specific prop changes
  }
  
  // ============ Utility Methods ============
  
  // Update state with cleanup
  protected updateState(
    partial: Partial<S>,
    callback?: () => void,
    delay?: number
  ): void {
    if (delay) {
      const timeout = setTimeout(() => {
        this.setState(partial as any, callback);
      }, delay);
      this.cleanup.push(() => clearTimeout(timeout));
    } else {
      this.setState(partial as any, callback);
    }
  }
  
  // Invoke event callback
  protected invokeEventCallback(
    eventName: string,
    ...args: any[]
  ): void {
    const callback = (this.props as any)[eventName];
    if (typeof callback === 'function') {
      callback.apply(this.proxy, args);
    }
  }
  
  // Get child widgets
  public getWidget(name: string): BaseComponent<any, any, any> | null {
    return this.findChildWidget(name);
  }
  
  // ============ Style Management ============
  
  private createStyles(defaultStyles: L, defaultClass: string): L {
    const themeStyles = this.theme[defaultClass] || {};
    const customStyles = this.props.styles || {};
    
    return StyleSheet.create({
      ...defaultStyles,
      ...themeStyles,
      ...customStyles,
    }) as L;
  }
  
  // ============ Abstract Methods ============
  
  // Must be implemented by subclass
  public abstract renderWidget(props: T): ReactNode;
  
  // Final render method
  public render(): ReactNode {
    if (!this.shouldShow()) {
      return null;
    }
    
    return this.renderWidget(this.props);
  }
}
```

### BaseProps Interface

```typescript
export class BaseProps extends StyleProps {
  id?: string;                    // Widget ID
  name?: string;                  // Widget name (for lookup)
  key?: any;                      // React key
  disabled?: boolean = false;     // Disabled state
  show?: Boolean | String | Number = true;  // Visibility
  styles?: any;                   // Custom styles
  classname?: string;             // CSS class names
  listener?: LifecycleListener;   // Lifecycle callbacks
  showindevice?: ('xs'|'sm'|'md'|'lg'|'xl'|'xxl')[];  // Responsive visibility
  showskeleton?: boolean;         // Show loading skeleton
  deferload?: boolean = false;    // Defer loading
  showskeletonchildren?: boolean = true;  // Show skeleton for children
  disabletoucheffect?: boolean = false;   // Disable touch effects
  isdefault?: boolean = false;    // Default widget flag
}
```

### BaseComponentState Interface

```typescript
export class BaseComponentState<T extends BaseProps> {
  public animationId?: number = 0;
  public animatableProps?: AnimatableProps<ViewStyle>;
  public props: T = {} as T;      // Current props
  public hide?: boolean = false;   // Hide flag
  public highlight?: boolean = false;  // Highlight flag
}
```

## Widget Implementation Pattern

Every widget follows this pattern:

```typescript
// Example: Button Component
// Location: components/basic/button/button.component.tsx

import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { BaseComponent, BaseComponentState, BaseProps, BaseStyles } from '@wavemaker/app-rn-runtime/core/base.component';

// ============ Props Interface ============

export class WmButtonProps extends BaseProps {
  caption?: string = '';           // Button text
  type?: string = 'default';       // Button type (primary, success, etc.)
  iconclass?: string;              // Icon class
  iconposition?: 'left' | 'right' = 'left';  // Icon position
  onPress?: Function;              // Press handler
  onLongpress?: Function;          // Long press handler
}

// ============ State Interface ============

export class WmButtonState extends BaseComponentState<WmButtonProps> {
  // Additional state if needed
}

// ============ Styles Interface ============

export interface WmButtonStyles extends BaseStyles {
  root: ViewStyle;      // Container style
  text: TextStyle;      // Text style
  icon: ViewStyle;      // Icon style
}

// Default styles
const DEFAULT_STYLES: WmButtonStyles = {
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#007bff',
  },
  text: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  icon: {
    marginRight: 8,
  }
};

// ============ Component Class ============

export class WmButton extends BaseComponent<
  WmButtonProps,
  WmButtonState,
  WmButtonStyles
> {
  constructor(props: WmButtonProps) {
    super(props, DEFAULT_STYLES, 'WmButton');
  }
  
  // ============ Lifecycle Overrides ============
  
  protected onPropertyChange(prevProps: WmButtonProps): void {
    // Handle prop changes
    if (prevProps.caption !== this.props.caption) {
      // Update if needed
    }
  }
  
  // ============ Event Handlers ============
  
  private handlePress = () => {
    if (this.props.disabled) return;
    
    this.invokeEventCallback('onPress');
  }
  
  private handleLongPress = () => {
    if (this.props.disabled) return;
    
    this.invokeEventCallback('onLongpress');
  }
  
  // ============ Render ============
  
  public renderWidget(props: WmButtonProps): React.ReactNode {
    const { caption, type, iconclass, disabled } = props;
    
    return (
      <TouchableOpacity
        style={[
          this.styles.root,
          type && this.styles[type],
          disabled && this.styles.disabled
        ]}
        onPress={this.handlePress}
        onLongPress={this.handleLongPress}
        disabled={disabled}
      >
        {iconclass && (
          <WmIcon iconclass={iconclass} styles={{ root: this.styles.icon }} />
        )}
        <Text style={this.styles.text}>{caption}</Text>
      </TouchableOpacity>
    );
  }
}
```

## Component Lifecycle

### Complete Lifecycle Flow

```
Component Creation
    ↓
constructor()
    ↓
getDerivedStateFromProps() [if defined]
    ↓
render()
    ↓
componentDidMount()
    ↓
init() [BaseComponent hook]
    ↓
onLoad event callback
    ↓
─── Component Active ───
    ↓
Props/State Change
    ↓
shouldComponentUpdate() [if defined]
    ↓
render()
    ↓
componentDidUpdate()
    ↓
onPropertyChange() [BaseComponent hook]
    ↓
─── Component Unmounting ───
    ↓
componentWillUnmount()
    ↓
destroy() [BaseComponent hook]
    ↓
cleanup[] execution
    ↓
notifier.destroy()
    ↓
onDestroy event callback
```

### Lifecycle Hooks

```typescript
class MyWidget extends BaseComponent<Props, State, Styles> {
  // 1. Initialization
  protected init(): void {
    super.init();
    // Component is now mounted and visible
    // Good place for:
    // - Subscribe to events
    // - Start timers
    // - Fetch initial data
    // - Register listeners
  }
  
  // 2. Property Changes
  protected onPropertyChange(prevProps: Props): void {
    // Called after props change and re-render
    if (prevProps.datavalue !== this.props.datavalue) {
      // Handle specific property change
    }
  }
  
  // 3. Cleanup
  protected destroy(): void {
    // Component is about to be unmounted
    // Good place for:
    // - Unsubscribe from events
    // - Clear timers
    // - Cancel requests
    // - Remove listeners
    super.destroy(); // Always call super.destroy()
  }
}
```

## Common Component Patterns

### Pattern 1: Container with Children

```typescript
export class WmPanel extends BaseComponent<
  WmPanelProps,
  WmPanelState,
  WmPanelStyles
> {
  public renderWidget(props: WmPanelProps): React.ReactNode {
    return (
      <View style={this.styles.root}>
        {props.title && (
          <View style={this.styles.header}>
            <Text style={this.styles.title}>{props.title}</Text>
          </View>
        )}
        <View style={this.styles.content}>
          {props.children}
        </View>
      </View>
    );
  }
}
```

### Pattern 2: List Widget with Item Rendering

```typescript
export class WmList extends BaseComponent<
  WmListProps,
  WmListState,
  WmListStyles
> {
  private renderItem = ({ item, index }: { item: any, index: number }) => {
    // Render template function passed as children
    if (typeof this.props.children === 'function') {
      return this.props.children(item, index);
    }
    return null;
  }
  
  public renderWidget(props: WmListProps): React.ReactNode {
    return (
      <FlatList
        data={props.dataset}
        renderItem={this.renderItem}
        keyExtractor={(item, index) => `${index}`}
        style={this.styles.root}
      />
    );
  }
}
```

### Pattern 3: Input Widget with Two-Way Binding

```typescript
export class WmText extends BaseComponent<
  WmTextProps,
  WmTextState,
  WmTextStyles
> {
  private handleChange = (value: string) => {
    // Update internal state
    this.updateState({ props: { ...this.state.props, datavalue: value } });
    
    // Invoke change callback (for two-way binding)
    this.invokeEventCallback('onChange', value);
  }
  
  public renderWidget(props: WmTextProps): React.ReactNode {
    return (
      <TextInput
        style={this.styles.root}
        value={props.datavalue}
        placeholder={props.placeholder}
        onChangeText={this.handleChange}
        editable={!props.disabled}
      />
    );
  }
}
```

### Pattern 4: Memoized Component

```typescript
export class WmExpensiveWidget extends BaseComponent<
  WmExpensiveWidgetProps,
  WmExpensiveWidgetState,
  WmExpensiveWidgetStyles
> {
  // Only re-render if specific props change
  shouldComponentUpdate(
    nextProps: WmExpensiveWidgetProps,
    nextState: WmExpensiveWidgetState
  ): boolean {
    return (
      nextProps.data !== this.props.data ||
      nextState.someState !== this.state.someState
    );
  }
  
  public renderWidget(props: WmExpensiveWidgetProps): React.ReactNode {
    // Expensive rendering logic
    return <View>{/* complex content */}</View>;
  }
}
```

### Pattern 5: Widget with Cleanup

```typescript
export class WmTimer extends BaseComponent<
  WmTimerProps,
  WmTimerState,
  WmTimerStyles
> {
  private intervalId: NodeJS.Timeout | null = null;
  
  protected init(): void {
    super.init();
    
    // Start interval
    this.intervalId = setInterval(() => {
      this.updateState({ count: this.state.count + 1 });
    }, 1000);
    
    // Register cleanup
    this.cleanup.push(() => {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    });
  }
  
  public renderWidget(props: WmTimerProps): React.ReactNode {
    return <Text>{this.state.count}</Text>;
  }
}
```

## Component Features

### 1. Props Provider (Proxy System)

```typescript
// PropsProvider creates a proxy for component props
// This enables:
// 1. Property access tracking for change detection
// 2. Binding updates
// 3. Watch expression evaluation

export class PropsProvider {
  static provide<T extends BaseComponent<any, any, any>>(
    component: T
  ): T {
    return new Proxy(component, {
      get(target, prop) {
        // Track property access
        // Return proxied value
        return Reflect.get(target, prop);
      },
      set(target, prop, value) {
        // Track property set
        // Trigger change detection
        return Reflect.set(target, prop, value);
      }
    });
  }
}

// Usage in component:
// this.proxy.props.someValue  // Tracked access
// this.props.someValue        // Direct access (not tracked)
```

### 2. Event Notifier

```typescript
// Every component has an event notifier for pub/sub
class SomeWidget extends BaseComponent<...> {
  protected init(): void {
    super.init();
    
    // Subscribe to events
    this.notifier.subscribe('dataChanged', (data) => {
      console.log('Data changed:', data);
    });
    
    // Publish events
    this.notifier.notify('dataChanged', newData);
  }
}
```

### 3. Parent-Child Communication

```typescript
// Access parent component
class ChildWidget extends BaseComponent<...> {
  protected init(): void {
    super.init();
    
    // Access parent
    if (this.parent) {
      console.log('Parent:', this.parent.constructor.name);
    }
  }
}

// Access child widgets
class ParentWidget extends BaseComponent<...> {
  private doSomething(): void {
    // Get child by name
    const childButton = this.getWidget('submitButton') as WmButton;
    if (childButton) {
      childButton.props.disabled = true;
    }
  }
}
```

### 4. Responsive Visibility

```typescript
// Component supports responsive visibility
<WmButton 
  caption="Mobile Only"
  showindevice={['xs', 'sm']}  // Only show on mobile
/>

<WmButton 
  caption="Tablet & Desktop"
  showindevice={['md', 'lg', 'xl']}  // Only show on larger screens
/>
```

### 5. Skeleton Loading

```typescript
// Component supports skeleton loading state
<WmList 
  dataset={this.Variables.users.dataSet}
  showskeleton={this.Variables.users.isExecuting}
  showskeletonchildren={true}
/>
```

## Agent Capabilities

### 1. Find Component

**Query**: "Where is WmProgressCircle implemented?"

**Response**:
```markdown
# WmProgressCircle Component Location

**Main Component**: 
`wavemaker-rn-runtime/src/components/basic/progress-circle/progress-circle.component.tsx`

**Related Files**:
- Props: `progress-circle.props.ts`
- Styles: `progress-circle.styles.ts`
- Tests: `progress-circle.component.spec.tsx`

**Category**: Basic Widgets

**Transformer**: 
`wavemaker-rn-codegen/src/transpile/components/progresscircle.transpiler.ts`

**Style Definition**: 
`wavemaker-rn-codegen/src/theme/components/progress-circle.ts`
```

### 2. Explain Implementation

**Query**: "How does WmList work?"

**Response**:
```markdown
# WmList Component Implementation

## Overview
WmList renders a scrollable list of items using React Native's FlatList.

## Class Structure
```typescript
export class WmList extends BaseComponent<
  WmListProps,
  WmListState,
  WmListStyles
> {
  // Implementation
}
```

## Key Properties
- `dataset`: Array of items to render
- `itemsperrow`: Number of items per row (1, 2, 3, etc.)
- `enablereorder`: Enable drag-to-reorder
- `onPull`: Pull to refresh callback
- `onItemclick`: Item click handler

## Rendering
Uses FlatList with:
1. Virtualization for performance
2. Item templates as render functions
3. Pull-to-refresh support
4. Reordering support

## Item Template
```jsx
<WmList dataset={items}>
  {(item, index) => (
    <WmListItem>
      <WmLabel caption={item.name} />
    </WmListItem>
  )}
</WmList>
```

[... detailed implementation explanation]
```

### 3. Compare Components

**Query**: "Difference between WmList and WmLivelist"

**Response**:
```markdown
# WmList vs WmLivelist Comparison

## WmList (Basic List)
- **Purpose**: Display static or manually managed data
- **Data Source**: Any array
- **Features**:
  - Simple item rendering
  - Manual data management
  - Client-side filtering/sorting
  - No built-in CRUD

## WmLivelist (Data-Bound List)
- **Purpose**: Display data from LiveVariable
- **Data Source**: LiveVariable.dataSet
- **Features**:
  - Automatic data binding
  - Built-in CRUD operations
  - Server-side pagination
  - Pull-to-refresh with data reload
  - Form integration for editing

## When to Use

**WmList**:
- Static content
- Client-side data
- Custom data management
- Simple display needs

**WmLivelist**:
- Backend data source
- CRUD operations needed
- Pagination required
- Live data updates

## Code Comparison

**WmList**:
```jsx
<WmList dataset={this.state.localItems}>
  {(item) => <WmLabel caption={item.name} />}
</WmList>
```

**WmLivelist**:
```jsx
<WmLivelist dataset={this.Variables.usersLiveVar.dataSet}>
  {(item) => <WmLabel caption={item.name} />}
</WmLivelist>
```
```

### 4. Debug Component

**Query**: "My List isn't rendering items"

**Response**:
```markdown
# Debugging WmList Rendering

## Common Issues

### Issue 1: Empty/Undefined Dataset
**Symptom**: Nothing renders
**Check**:
```javascript
console.log('Dataset:', this.props.dataset);
console.log('Is Array:', Array.isArray(this.props.dataset));
console.log('Length:', this.props.dataset?.length);
```
**Solution**: Ensure dataset is an array with items

### Issue 2: Render Function Not Returning JSX
**Symptom**: Blank list or errors
**Check**:
```jsx
<WmList dataset={items}>
  {(item, index) => {
    console.log('Rendering item:', item, index);
    return <WmLabel caption={item.name} />; // Must return JSX
  }}
</WmList>
```

### Issue 3: Key Extractor Issues
**Symptom**: Items duplicate or don't update
**Solution**: Ensure unique keys
```jsx
<WmList 
  dataset={items}
  keyExtractor={(item, index) => item.id || index}
>
```

### Issue 4: Style Hiding Content
**Symptom**: List exists but not visible
**Check**: Height and visibility styles
```javascript
console.log('List styles:', this.styles.root);
```

[... more diagnostic steps]
```

### 5. Custom Widget Guide

**Query**: "How to create a custom widget?"

**Response**:
```markdown
# Creating a Custom Widget

## Step 1: Define Props Interface

```typescript
// custom-widget.props.ts
import { BaseProps } from '@wavemaker/app-rn-runtime/core/base.component';

export class WmCustomWidgetProps extends BaseProps {
  title?: string = '';
  value?: number = 0;
  onValueChange?: Function;
}
```

## Step 2: Define State Interface

```typescript
// custom-widget.state.ts
import { BaseComponentState } from '@wavemaker/app-rn-runtime/core/base.component';
import { WmCustomWidgetProps } from './custom-widget.props';

export class WmCustomWidgetState extends BaseComponentState<WmCustomWidgetProps> {
  internalValue: number = 0;
}
```

## Step 3: Define Styles

```typescript
// custom-widget.styles.ts
import { defineStyles } from '@wavemaker/app-rn-runtime/core/base.component';

export default defineStyles({
  root: {
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  }
});
```

## Step 4: Implement Component

```typescript
// custom-widget.component.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { BaseComponent } from '@wavemaker/app-rn-runtime/core/base.component';
import { WmCustomWidgetProps } from './custom-widget.props';
import { WmCustomWidgetState } from './custom-widget.state';
import defaultStyles from './custom-widget.styles';

export class WmCustomWidget extends BaseComponent<
  WmCustomWidgetProps,
  WmCustomWidgetState,
  typeof defaultStyles
> {
  constructor(props: WmCustomWidgetProps) {
    super(props, defaultStyles, 'WmCustomWidget');
    this.state = {
      ...this.state,
      internalValue: props.value || 0
    };
  }
  
  protected init(): void {
    super.init();
    // Initialization logic
  }
  
  protected destroy(): void {
    // Cleanup logic
    super.destroy();
  }
  
  private handleValueChange = (newValue: number) => {
    this.updateState({ internalValue: newValue });
    this.invokeEventCallback('onValueChange', newValue);
  }
  
  public renderWidget(props: WmCustomWidgetProps): React.ReactNode {
    return (
      <View style={this.styles.root}>
        <Text style={this.styles.title}>{props.title}</Text>
        <Text>{this.state.internalValue}</Text>
      </View>
    );
  }
}
```

## Step 5: Create Transformer

[... transformer implementation]

## Step 6: Register Component

[... registration steps]
```

## Best Practices

### Component Development

1. **Extend BaseComponent**: Always extend from BaseComponent
2. **Follow Naming**: Use Wm prefix for widgets
3. **Type Safety**: Use TypeScript interfaces for props/state
4. **Cleanup**: Register cleanup functions in init()
5. **Event Callbacks**: Use invokeEventCallback() for events
6. **Proxy Access**: Use this.proxy when passing component reference
7. **Memoization**: Implement shouldComponentUpdate for expensive components
8. **Testing**: Write unit tests for components

### Performance

1. **Avoid Inline Functions**: Define handlers as class methods
2. **Memoize Styles**: Don't create new style objects in render
3. **Use shouldComponentUpdate**: Prevent unnecessary renders
4. **Cleanup Timers**: Always cleanup timers and subscriptions
5. **Virtualization**: Use FlatList for long lists

### Accessibility

1. **Add Labels**: Provide accessible labels
2. **Touch Targets**: Ensure minimum 44x44 touch target
3. **Screen Reader**: Test with screen reader enabled
4. **Focus Management**: Handle focus properly

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Component Implementation & Architecture

