# Runtime Core Concepts

## Overview

The WaveMaker React Native runtime is built on several foundational concepts that enable a component-based, declarative UI framework with powerful data binding, theming, and service integration capabilities.

## Key Concepts

### 1. Component-Based Architecture

Every UI element in WaveMaker RN is a component that extends from `BaseComponent`.

```typescript
// All widgets inherit from BaseComponent
WmButton extends BaseComponent
WmLabel extends BaseComponent
WmList extends BaseComponent
// ... and 50+ more
```

**Benefits:**
- Consistent API across all widgets
- Shared functionality (styling, events, lifecycle)
- Predictable behavior
- Easy to extend and customize

### 2. Fragment-Based State Management

Applications use a "fragment" concept for state management:

```typescript
// Fragment represents a scope (App, Page, or Partial)
interface Fragment {
  Variables: {          // All variables in this scope
    myVar: Variable;
    userList: LiveVariable;
    // ...
  };
  
  Actions: {            // All actions in this scope
    onLoad: Action;
    onClick: Action;
    // ...
  };
  
  Widgets: {            // References to widgets
    button1: WmButton;
    list1: WmList;
    // ...
  };
  
  appConfig: {          // App-level configuration
    SecurityService: SecurityService;
    // ... other services
  };
}
```

**Fragment Hierarchy:**
```
App Fragment (Global)
  └─ Page Fragment (Page-specific)
      └─ Partial Fragment (Partial-specific)
          └─ Prefab Fragment (Prefab-specific)
```

### 3. Property System

Components use a sophisticated property management system:

#### Props Types

1. **Default Props**: Widget-level defaults
2. **Markup Props**: Properties from generated code
3. **Dynamic Props**: Runtime property updates

#### PropsProvider

The `PropsProvider` class manages all property concerns:

```typescript
class PropsProvider<T> {
  constructor(
    defaultProps: T,
    markupProps: T,
    onChange: (name: string, newValue: any, oldValue: any) => void
  );
  
  // Get current prop value
  get(): T;
  
  // Set prop at runtime
  set(name: string, value: any): void;
  
  // Override specific prop
  overrideProp(name: string, value: any): void;
  
  // Check if props changed
  check(newProps?: T): boolean;
}
```

#### Property Resolution Order

```
Runtime prop (highest priority)
  ↓
Markup prop
  ↓
Default prop (lowest priority)
```

Example:

```typescript
// Default: caption = "Click Me"
// Markup: caption = "Submit"
// Runtime: component.caption = "Send"
// Result: Shows "Send"
```

### 4. Event System

Three-tier event system for communication:

#### Tier 1: Internal Component Events

```typescript
// Within a component
this.notify('dataLoaded', [data]);

// Subscribe to component events
component.subscribe('dataLoaded', (data) => {
  console.log('Data loaded:', data);
});
```

#### Tier 2: User Callbacks

```typescript
// In markup/generated code
<WmButton onTap={(event, widget) => {
  // User-defined logic
  console.log('Button tapped');
}} />

// In component
this.invokeEventCallback('onTap', [event, this.proxy]);
```

#### Tier 3: Parent-Child Communication

```typescript
// Child notifies parent
this.notifier.setParent(parentComponent.notifier);
this.notify('childEvent', [data], true); // true = emit to parent

// Parent listens
parentComponent.subscribe('childEvent', (data) => {
  // Handle child event
});
```

### 5. Styling System

Multi-layered styling approach combining static and dynamic styles:

#### Style Sources (Merge Order)

```typescript
1. Widget default styles (from theme)
2. Locale-specific styles (en, ar, etc.)
3. Disabled state styles
4. RTL (Right-to-Left) styles
5. Custom class styles
6. Inline styles
7. Dynamic style overrides
```

#### Style Structure

```typescript
interface BaseStyles {
  root: ViewStyle;       // Container styles
  text: TextStyle;       // Text styles
  [key: string]: any;    // Component-specific styles
}
```

#### Style Properties

Styles can be set via:

```typescript
// 1. Class name
<WmButton classname="btn-primary" />

// 2. Inline styles object
<WmButton styles={{root: {backgroundColor: 'red'}}} />

// 3. Individual style props
<WmButton width="100" height="50" backgroundcolor="blue" />

// 4. Dynamic/bound styles
<WmButton width={bind:myWidth} />
```

### 6. Theme System

Dynamic, runtime-switchable theming:

```typescript
interface Theme {
  // Get styles for a class
  getStyle(className: string): BaseStyles;
  
  // Merge multiple style objects
  mergeStyle(...styles: BaseStyles[]): BaseStyles;
  
  // Listen for theme changes
  subscribe(event: ThemeEvent, callback: Function): Function;
}
```

**Theme Structure:**

```
theme/
  ├── native-mobile/           # Mobile theme
  │   ├── android/
  │   │   ├── styles.js        # Compiled RN styles
  │   │   └── assets/          # Android-specific assets
  │   └── ios/
  │       ├── styles.js        # Compiled RN styles
  │       └── assets/          # iOS-specific assets
  └── web/                     # Web theme (for web preview)
      └── styles.css
```

### 7. Data Binding

Two-way data binding between widgets and variables:

```typescript
// One-way binding (widget reads variable)
<WmLabel caption={bind:myVariable.dataValue} />

// Two-way binding (widget reads and writes)
<WmText datavalue={bind:myVariable.dataValue} />
```

**Binding Flow:**

```
User Input → Widget → Variable → Backend
    ↑                               ↓
    └───────────── Update ──────────┘
```

### 8. Variable System

Reactive state management using Variables:

```typescript
// Variable types
- Variable: Simple data storage
- LiveVariable: Database CRUD operations
- ServiceVariable: REST API calls
- DeviceVariable: Device feature access
- NavigationVariable: Page navigation
- TimerVariable: Scheduled actions
```

**Variable Lifecycle:**

```
Create → Initialize → Bind to Widgets → 
Update (auto/manual) → Trigger Callbacks → Destroy
```

### 9. Service Layer

Dependency injection pattern for services:

```typescript
// Injector provides singleton services
import injector from '@wavemaker/app-rn-runtime/core/injector';

const navigationService = injector.NavigationService.get();
const modalService = injector.ModalService.get();
const toastService = injector.ToastService.get();
```

**Core Services:**
- NavigationService: Page navigation
- ModalService: Modal dialogs
- ToastService: Toast notifications
- SpinnerService: Loading indicators
- SecurityService: Authentication/authorization
- StorageService: Persistent storage
- SecureStorageService: Encrypted storage
- I18nService: Internationalization
- NetworkService: Network monitoring

### 10. Navigation Architecture

Hierarchical navigation using React Navigation:

```
App
 └─ DrawerNavigator (if leftpanel exists)
     └─ StackNavigator
         ├─ Page1
         ├─ Page2
         └─ Page3
```

**Navigation Actions:**

```typescript
// Navigate to page
NavigationService.goToPage('Page2', {param1: 'value'});

// Go back
NavigationService.goBack();

// Open drawer
NavigationService.openDrawer();
```

### 11. Lifecycle Hooks

Components have a well-defined lifecycle:

```typescript
// Initialization
constructor()
componentDidMount()        // Component ready

// Updates
onPropertyChange()         // Property changed
shouldComponentUpdate()    // Should re-render?
componentDidUpdate()       // After update

// Cleanup
componentWillUnmount()     // Before destroy
```

**Custom Lifecycle:**

```typescript
componentWillAttach()      // Before adding to DOM
componentWillDetach()      // Before removing from DOM
```

### 12. Context System

Components consume multiple React contexts:

```typescript
// Available contexts
- ParentContext: Parent component reference
- ThemeConsumer: Current theme
- AssetConsumer: Asset loading function
- TextIdPrefixConsumer: Test ID prefix
- TappableContext: Nearest tappable ancestor
```

**Context Flow:**

```tsx
<ThemeProvider value={theme}>
  <ParentContext.Provider value={parentComponent}>
    <AssetProvider value={loadAsset}>
      <YourComponent />
    </AssetProvider>
  </ParentContext.Provider>
</ThemeProvider>
```

### 13. Component Tree

Runtime maintains a tree structure of components:

```typescript
class WmComponentNode {
  instance: BaseComponent;
  children: WmComponentNode[];
  
  add(child: WmComponentNode): void;
  remove(child: WmComponentNode): void;
  find(predicate: Function): WmComponentNode | null;
}
```

**Uses:**
- Parent-child communication
- Event bubbling
- Tree traversal
- Debugging
- Finding widgets by name

### 14. Proxy Pattern

Components expose a proxy interface for property access:

```typescript
// Internal component
class WmButton extends BaseComponent {
  // ... implementation
}

// Proxy exposes clean interface
component.caption = "New Text";    // Sets via proxy
console.log(component.caption);    // Gets via proxy
```

Benefits:
- Clean API for users
- Property validation
- Change detection
- State synchronization

### 15. Animation Support

Built-in animation system:

```typescript
// Animate any widget
component.animate({
  animation: 'fadeIn',
  duration: 300,
  easing: 'ease-out',
  delay: 0
});
```

**Supported Animations:**
- fadeIn, fadeOut, fadeInDown, fadeInUp
- slideInLeft, slideInRight, slideInUp, slideInDown
- bounceIn, bounceOut
- zoomIn, zoomOut
- Custom animations

### 16. Accessibility

Built-in accessibility support:

```typescript
// Automatic test IDs
<WmButton {...this.getTestProps('submitBtn')} />
// Generates: testID="page1_submitBtn"

// Screen reader support
<WmLabel 
  accessibilityLabel="Welcome message"
  accessibilityHint="Displays welcome text"
  accessibilityRole="text"
/>

// Detect screen reader
import { isScreenReaderEnabled } from '@wavemaker/app-rn-runtime/core/accessibility';
```

### 17. Platform Abstraction

Single codebase for iOS, Android, and Web:

```typescript
import { Platform } from 'react-native';

// Platform-specific code
if (Platform.OS === 'ios') {
  // iOS
} else if (Platform.OS === 'android') {
  // Android
} else if (Platform.OS === 'web') {
  // Web
}

// Platform-specific styles
const styles = Platform.select({
  ios: { paddingTop: 20 },
  android: { paddingTop: 0 },
  web: { paddingTop: 10 }
});
```

### 18. Error Handling

Comprehensive error handling:

```typescript
// Global error boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>

// Widget-level error handling
try {
  // Widget logic
} catch (error) {
  console.error('Widget error:', error);
  // Show error UI or fallback
}
```

### 19. Performance Optimization

Built-in optimizations:

#### Lazy Loading

```typescript
// Pages
const Page1 = React.lazy(() => import('./pages/Page1'));

// Partials
const HeaderPartial = React.lazy(() => import('./partials/Header'));
```

#### Memoization

```typescript
// Memoize expensive computations
const styles = useMemo(() => 
  theme.getStyle('app-button'), 
  [theme]
);

// Memoize components
const MemoizedList = React.memo(WmList);
```

#### Virtual Scrolling

```typescript
// Large lists use FlatList
<WmList
  dataset={largeArray}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
/>
```

### 20. Debugging Support

Developer-friendly debugging:

```typescript
// Hierarchical logging
import { ROOT_LOGGER } from '@wavemaker/app-rn-runtime/core/logger';

const logger = ROOT_LOGGER.extend('MyComponent');
logger.debug('Debug info');
logger.info('Info message');
logger.warn('Warning');
logger.error('Error occurred');

// Log levels controlled by app config
enableLogs: true  // Enable all logging
```

## Best Practices

### 1. Component Usage

```typescript
// ✅ Good: Use fragments to access state
<WmButton onTap={() => fragment.Variables.myVar.setValue(10)} />

// ❌ Bad: Direct state manipulation
<WmButton onTap={() => myVar = 10} />
```

### 2. Property Updates

```typescript
// ✅ Good: Use component proxy
buttonWidget.caption = "New Text";

// ❌ Bad: Direct property assignment
buttonWidget.props.caption = "New Text";
```

### 3. Event Handlers

```typescript
// ✅ Good: Bind to fragment methods
<WmButton onTap={fragment.onButtonClick} />

// ❌ Bad: Inline complex logic
<WmButton onTap={() => { /* 50 lines of code */ }} />
```

### 4. Styling

```typescript
// ✅ Good: Use classes for reusability
<WmButton classname="btn-primary" />

// ❌ Bad: Inline styles everywhere
<WmButton styles={{root: {backgroundColor: 'red', ...}}} />
```

### 5. Variable Usage

```typescript
// ✅ Good: Use appropriate variable types
const userList = createLiveVariable({type: 'User'});

// ❌ Bad: Use generic Variable for everything
const userList = createVariable({});
```

## Architecture Patterns

### 1. Composition Over Inheritance

```typescript
// Compose complex widgets from simple ones
<WmContainer>
  <WmLabel caption="Name:" />
  <WmText datavalue={bind:name} />
</WmContainer>
```

### 2. Unidirectional Data Flow

```
User Action → Event → Variable Update → Widget Re-render
```

### 3. Separation of Concerns

```
Component (View)
  ↓ uses
Script (Controller)
  ↓ uses
Variable (Model/Data)
  ↓ uses
Service (Backend)
```

### 4. Declarative UI

```typescript
// Define what UI should look like
<WmLabel 
  caption={bind:userName} 
  show={bind:isLoggedIn}
/>

// Not how to update it imperatively
```

## Next Steps

- [BaseComponent](./base-component.md) - Deep dive into base component
- [Component Lifecycle](./component-lifecycle.md) - Lifecycle details
- [Services](./services.md) - Service layer documentation
- [Navigation](./navigation.md) - Navigation system

