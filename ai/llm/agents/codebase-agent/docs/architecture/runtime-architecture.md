# Runtime Architecture

## Overview

The wavemaker-rn-runtime package (`@wavemaker/app-rn-runtime`) provides the complete runtime infrastructure for WaveMaker React Native applications. It consists of a component library, service layer, styling system, and application framework.

## Core Architecture Layers

```
┌────────────────────────────────────────────────────────┐
│                  Application Layer                      │
│         (Generated App, Pages, Partials)                │
└──────────────────────┬─────────────────────────────────┘
                       │
                       │ Uses
                       ▼
┌────────────────────────────────────────────────────────┐
│              Component Library Layer                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  50+ UI Widgets (Button, List, Form, etc.)      │  │
│  │  All extend BaseComponent                        │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │
                       │ Built on
                       ▼
┌────────────────────────────────────────────────────────┐
│               Core Infrastructure Layer                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  - BaseComponent (Abstract base class)          │  │
│  │  - PropsProvider (Property management)          │  │
│  │  │  - EventNotifier (Event system)              │  │
│  │  - Theme System (Dynamic styling)               │  │
│  │  - Service Layer (Navigation, Modal, etc.)      │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬─────────────────────────────────┘
                       │
                       │ Built on
                       ▼
┌────────────────────────────────────────────────────────┐
│              React Native / Expo                        │
└────────────────────────────────────────────────────────┘
```

## Component System

### BaseComponent Architecture

Every widget in the runtime extends from `BaseComponent`, which provides:

#### 1. **Component Lifecycle**

```typescript
class BaseComponent<T extends BaseProps, S extends BaseComponentState<T>, L extends BaseStyles> {
  // Initialization
  constructor(markupProps, defaultClass, defaultProps, defaultState)
  
  // React lifecycle
  componentDidMount()      // Widget initialized
  componentDidUpdate()     // Props/state changed
  componentWillUnmount()   // Widget destroyed
  
  // Custom lifecycle
  componentWillAttach()    // Before adding to DOM
  componentWillDetach()    // Before removing from DOM
}
```

#### 2. **Property System**

The `PropsProvider` manages all component properties:

- **Default Props**: Widget defaults
- **Markup Props**: Properties from generated code
- **Dynamic Props**: Runtime property changes
- **Property Watchers**: Detect changes and trigger updates

```typescript
// Property change flow
User sets prop → PropsProvider detects → onPropertyChange() called → 
updateState() → React re-renders
```

#### 3. **Styling System**

Components use a multi-layer styling approach:

```typescript
// Style resolution order (last wins)
1. Default widget styles (from theme)
2. Locale-specific styles
3. Disabled state styles
4. RTL (Right-to-Left) styles
5. Custom class styles
6. Inline styles from markup
7. Dynamic style overrides
```

Styles are defined as:

```typescript
interface BaseStyles {
  root: ViewStyle;      // Container style
  text: TextStyle;      // Text style
  [key: string]: any;   // Component-specific styles
}
```

#### 4. **Event System**

Three-level event system:

```typescript
// 1. Component events (internal)
this.notify('eventName', [args]);

// 2. User callbacks
this.invokeEventCallback('onTap', [args]);

// 3. Parent notification
this.notifier.setParent(parent.notifier);
```

#### 5. **Context Management**

Components consume multiple contexts:

- **ParentContext**: Access parent component
- **ThemeConsumer**: Current theme
- **AssetConsumer**: Asset loading function
- **TextIdPrefixConsumer**: Test ID prefix for nested widgets
- **TappableContext**: Nearest tappable ancestor

### Component Tree Structure

Runtime maintains a component tree for:

```typescript
class WmComponentNode {
  instance: BaseComponent;
  children: WmComponentNode[];
  
  add(child: WmComponentNode);
  remove(child: WmComponentNode);
  find(predicate: Function): WmComponentNode;
}
```

**Use cases:**
- Parent-child communication
- Event bubbling
- Tree traversal for debugging
- Widget queries

## Service Layer

### Service Injection

Services are accessed via the injector pattern:

```typescript
import injector from '@wavemaker/app-rn-runtime/core/injector';

// Accessing services
const navService = injector.NavigationService.get();
const modalService = injector.ModalService.get();
```

### Core Services

#### 1. **NavigationService**

Manages app navigation using React Navigation:

```typescript
interface NavigationService {
  // Navigate to page
  goToPage(pageName: string, params?: any): void;
  
  // Go back
  goBack(): void;
  
  // Open drawer
  openDrawer(): void;
  closeDrawer(): void;
  
  // Navigation state
  getCurrentPage(): string;
  canGoBack(): boolean;
}
```

**Features:**
- Stack navigation
- Drawer navigation
- Tab navigation
- Deep linking
- Navigation guards

#### 2. **ModalService**

Display modal dialogs:

```typescript
interface ModalService {
  showModal(component: ReactNode, config?: ModalConfig): Promise<any>;
  hideModal(): void;
}
```

**Modal Types:**
- Alert dialog
- Confirm dialog
- Custom modal
- Bottom sheet

#### 3. **ToastService**

Show toast notifications:

```typescript
interface ToastService {
  show(message: string, duration?: number, type?: 'success' | 'error' | 'info'): void;
}
```

#### 4. **SpinnerService**

Display loading spinners:

```typescript
interface SpinnerService {
  show(message?: string): void;
  hide(): void;
}
```

#### 5. **SecurityService**

Handle authentication and authorization:

```typescript
interface SecurityService {
  isAuthenticated(): boolean;
  login(credentials: any): Promise<any>;
  logout(): Promise<void>;
  hasAccessToWidget(roles: string): boolean;
}
```

#### 6. **StorageService**

Persistent data storage using AsyncStorage:

```typescript
interface StorageService {
  getItem(key: string): Promise<string>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

#### 7. **SecureStorageService**

Encrypted storage for sensitive data using Expo SecureStore:

```typescript
interface SecureStorageService {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string>;
  removeItem(key: string): Promise<void>;
}
```

#### 8. **I18nService**

Internationalization support:

```typescript
interface I18nService {
  getSelectedLocale(): string;
  setLocale(locale: string): Promise<void>;
  isRTLLocale(): boolean;
  get(key: string, defaultValue?: string): string;
}
```

#### 9. **NetworkService**

Monitor network connectivity:

```typescript
interface NetworkService {
  isConnected(): Promise<boolean>;
  getNetworkState(): Promise<NetworkState>;
  onNetworkChange(callback: Function): Function; // Returns unsubscribe
}
```

#### 10. **Device Services**

Access device features:

```typescript
// Camera
interface CameraService {
  captureImage(options: CameraOptions): Promise<ImageResult>;
  captureVideo(options: VideoOptions): Promise<VideoResult>;
}

// Location
interface LocationService {
  getCurrentPosition(options?: LocationOptions): Promise<Position>;
  watchPosition(callback: Function): Function;
}

// Contacts
interface ContactsService {
  getContacts(options?: ContactOptions): Promise<Contact[]>;
}

// Calendar
interface CalendarService {
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  createEvent(event: CalendarEvent): Promise<string>;
  deleteEvent(eventId: string): Promise<void>;
}
```

## Theme System

### Theme Structure

```typescript
interface Theme {
  // Get style for a class
  getStyle(className: string): BaseStyles;
  
  // Merge multiple styles
  mergeStyle(...styles: BaseStyles[]): BaseStyles;
  
  // Clean invalid properties
  cleanseStyleProperties(style: any): BaseStyles;
  
  // Subscribe to theme changes
  subscribe(event: ThemeEvent, callback: Function): Function;
}
```

### Theme Loading

Themes are loaded dynamically:

1. Read theme files from `theme/` directory
2. Parse and compile styles
3. Register with theme manager
4. Apply to components

### Theme Variables

Themes can define variables:

```javascript
// app.theme.variables.js
export default {
  baseFont: 'Roboto',
  primaryColor: '#007bff',
  successColor: '#28a745',
  errorColor: '#dc3545',
  // ... more variables
};
```

### Style Resolution

```typescript
// Component render method
this.styles = this.theme.mergeStyle(
  this.getDefaultStyles(),              // Base styles
  localeStyles,                          // Locale-specific
  disabledStyles,                        // Disabled state
  rtlStyles,                             // RTL support
  customClassStyles,                     // Custom class
  inlineStyles,                          // Inline from markup
  styleOverrides                         // Dynamic overrides
);
```

## State Management

### Fragment-based Architecture

Generated apps use a fragment-based state management:

```typescript
// Fragment contains:
- Component state
- Variable values
- Actions
- Page configuration
```

### Variable System

Variables are reactive and auto-update:

```typescript
// Variable definition
const MyVariable = createVariable({
  name: 'myVar',
  type: 'string',
  defaultValue: 'Hello',
  // Auto-updates on changes
});

// In component
<WmLabel caption={fragment.Variables.myVar.dataValue} />
```

### Data Binding

Two-way data binding between widgets and variables:

```
Widget ←→ Variable ←→ Backend Service
```

## Navigation Architecture

### Navigator Types

#### 1. **Stack Navigator**

Default page navigation:

```typescript
<Stack.Navigator>
  <Stack.Screen name="Page1" component={Page1} />
  <Stack.Screen name="Page2" component={Page2} />
</Stack.Navigator>
```

#### 2. **Drawer Navigator**

Left panel navigation:

```typescript
<Drawer.Navigator>
  <Drawer.Screen name="Home" component={HomePage} />
  <Drawer.Screen name="Settings" component={SettingsPage} />
</Drawer.Navigator>
```

#### 3. **Tab Navigator**

Bottom tab bar:

```typescript
<Tab.Navigator tabBar={props => <WmTabbar {...props} />}>
  <Tab.Screen name="Tab1" component={Tab1} />
  <Tab.Screen name="Tab2" component={Tab2} />
</Tab.Navigator>
```

### Navigation Flow

```
App.tsx
  └─ App.navigator.tsx
      ├─ Drawer Navigator (if leftpanel exists)
      │   └─ Stack Navigator
      │       └─ Pages
      └─ Stack Navigator (no leftpanel)
          └─ Pages
```

## Animation System

Components support animations via React Native Animatable:

```typescript
// Animate a widget
component.animate({
  animation: 'fadeIn',
  duration: 300,
  easing: 'ease-out'
});
```

**Built-in animations:**
- fadeIn/fadeOut
- slideInLeft/slideInRight
- bounceIn
- zoomIn/zoomOut
- Custom animations

## Error Handling

### Error Boundary

Global error catching:

```typescript
<ErrorBoundary fallback={<ErrorFallbackComponent />}>
  <App />
</ErrorBoundary>
```

### Widget Error Handling

```typescript
try {
  // Widget logic
} catch (error) {
  console.error(error);
  // Show error UI
}
```

## Testing Support

### Test IDs

All widgets support test IDs:

```typescript
<WmButton {...this.getTestProps('submitBtn')} />
// Generates testID: "page1_submitBtn"
```

### Accessibility

Screen reader support:

```typescript
<WmLabel 
  accessibilityLabel="Welcome message"
  accessibilityHint="Displays welcome text"
/>
```

## Performance Optimizations

### 1. **Lazy Loading**

Pages and partials can be lazy-loaded:

```typescript
const Page1 = React.lazy(() => import('./pages/Page1'));
```

### 2. **Memoization**

Theme styles are memoized:

```typescript
const styles = useMemo(() => theme.getStyle('app-button'), [theme]);
```

### 3. **Virtual Scrolling**

Large lists use FlatList with optimizations:

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
/>
```

### 4. **Image Optimization**

Images are lazy-loaded with placeholders:

```typescript
<WmPicture 
  source="image.jpg"
  loadingstrategy="lazy"
/>
```

## Debugging

### Logger System

Hierarchical logging:

```typescript
import { ROOT_LOGGER } from '@wavemaker/app-rn-runtime/core/logger';

const logger = ROOT_LOGGER.extend('MyComponent');
logger.debug('Debug message');
logger.info('Info message');
logger.error('Error message');
```

### Development Tools

- React Native Debugger integration
- Component tree inspection
- Network request monitoring
- Performance profiling

## Platform-Specific Code

Handle platform differences:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
} else if (Platform.OS === 'web') {
  // Web-specific code
}
```

## Next Steps

- [Component Lifecycle](../runtime/component-lifecycle.md) - Detailed lifecycle hooks
- [Services](../runtime/services.md) - Complete service documentation
- [Navigation](../runtime/navigation.md) - Navigation system details

