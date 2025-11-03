# Fragment System Internals

This document covers the fragment architecture, hierarchy, lifecycle, and how fragments integrate with watchers, variables, and memoization in WaveMaker React Native.

## Table of Contents

1. [Fragment Architecture](#fragment-architecture)
2. [Fragment Hierarchy](#fragment-hierarchy)
3. [Watcher Integration](#watcher-integration)
4. [Variable Binding](#variable-binding)
5. [Memoization in Fragments](#memoization-in-fragments)
6. [Script Execution Context](#script-execution-context)
7. [Fragment Lifecycle](#fragment-lifecycle)
8. [Best Practices](#best-practices)

---

## Fragment Architecture

Fragments are the building blocks of WaveMaker applications. They represent reusable UI units with their own state, variables, and logic.

### Fragment Types

WaveMaker has four main fragment types:

```
App (BaseApp)
  └── Page (BasePage)
      ├── Partial (BasePartial)
      └── Prefab (BasePrefab)
```

### BaseFragment Class

**File**: `src/runtime/base-fragment.component.tsx`

```typescript
export class BaseFragment {
  // Core properties
  public App: any;
  public Actions: any = {};
  public Variables: any = {};
  public Widgets: any = {};
  
  // Watcher system
  public watcher: Watcher;
  
  // Memoization cache
  private _memoize = new Map<string, any>();
  
  // Lifecycle state
  public isDestroyed = false;

  constructor(private parentWatcher?: Watcher) {
    // Create watcher from parent or root
    this.watcher = parentWatcher 
      ? parentWatcher.create() 
      : Watcher.ROOT.create();
  }

  // Watch variables
  watch(variable: string, callback: Function, options: any) {
    // Variable watching implementation
  }

  // Memoization
  memoize(key: string, fn: Function) {
    if (!this._memoize.has(key)) {
      this._memoize.set(key, fn());
    }
    return this._memoize.get(key);
  }

  // Cleanup
  destroy() {
    this.watcher?.destroy();
    this._memoize.clear();
    this.isDestroyed = true;
  }
}
```

### Fragment Responsibilities

1. **State Management**: Manage component state and data
2. **Variable Management**: Own and manage variables
3. **Event Handling**: Define event handlers for widgets
4. **Watcher Management**: Create and manage reactive watchers
5. **Lifecycle Hooks**: Implement lifecycle methods
6. **Widget References**: Maintain references to child widgets

---

## Fragment Hierarchy

Fragments are organized in a hierarchical tree structure.

### Hierarchy Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   FRAGMENT HIERARCHY                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  App (BaseApp)                                               │
│  ├── watcher: Watcher                                        │
│  ├── Variables: { ... }                                      │
│  └── Actions: { ... }                                        │
│      │                                                       │
│      ├── Page1 (BasePage)                                    │
│      │   ├── watcher: child of App.watcher                   │
│      │   ├── Variables: { ... }                              │
│      │   ├── Actions: { ... }                                │
│      │   └── Children:                                       │
│      │       │                                               │
│      │       ├── Partial1 (BasePartial)                      │
│      │       │   ├── watcher: child of Page1.watcher         │
│      │       │   └── Variables: { ... }                      │
│      │       │                                               │
│      │       └── Prefab1 (BasePrefab)                        │
│      │           ├── watcher: child of Page1.watcher         │
│      │           └── Variables: { ... }                      │
│      │                                                       │
│      └── Page2 (BasePage)                                    │
│          └── ...                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### BaseApp (Application Root)

**File**: `src/runtime/App.tsx`

```typescript
export default abstract class BaseApp extends React.Component {
  Actions: any = {};
  Variables: any = {};
  
  // Root watcher
  public watcher = Watcher.ROOT.create();
  
  // Current page reference
  public activePage: BasePage | null = null;
  
  // Modal management
  modalsOpened = 0;

  constructor(props: any) {
    super(props);
    this.App = this;
  }

  renderDialogs(): ReactNode {
    return <WmMemo watcher={this.watcher} render={(watch) => {
      watch(() => last(AppModalService.modalsOpened)?.content);
      // Render modals
    }} />;
  }

  renderToasters(): ReactNode {
    return <WmMemo watcher={this.watcher} render={(watch) => {
      watch(() => ToastService.toastsOpened.length);
      // Render toasts
    }} />;
  }
}
```

### BasePage (Page Fragment)

**File**: `src/runtime/base-page.component.tsx`

```typescript
export default class BasePage extends BaseFragment {
  // Page-specific properties
  public pageParams: any = {};
  public queryParams: any = {};
  
  constructor(appWatcher: Watcher) {
    super(appWatcher);
    this.App = injector.get('APP');
    this.App.activePage = this;
  }

  // Lifecycle methods
  onReady() {
    // Called when page is ready
  }

  onShow() {
    // Called when page becomes visible
  }

  onHide() {
    // Called when page is hidden
  }

  onDestroy() {
    // Called before page is destroyed
    super.destroy();
  }
}
```

### BasePartial (Partial Fragment)

**File**: `src/runtime/base-partial.component.tsx`

```typescript
export default class BasePartial extends BaseFragment {
  constructor(pageWatcher: Watcher) {
    super(pageWatcher);
    this.App = injector.get('APP');
  }

  onReady() {
    // Partial initialization
  }
}
```

### BasePrefab (Prefab Fragment)

**File**: `src/runtime/base-prefab.component.tsx`

```typescript
export interface PrefabProps extends BaseProps {
  parentWatcher: Watcher;
}

export default class BasePrefab extends BaseFragment {
  constructor(parentWatcher: Watcher) {
    super(parentWatcher);
    this.App = injector.get('APP');
  }

  onPropertyChange(key: string, newValue: any, oldValue: any) {
    // Handle property changes from parent
  }
}
```

---

## Watcher Integration

Fragments integrate deeply with the watcher system for reactive data binding.

### Watcher Creation

Each fragment creates a child watcher from its parent:

```typescript
export class BaseFragment {
  public watcher: Watcher;

  constructor(private parentWatcher?: Watcher) {
    // Create child watcher
    this.watcher = parentWatcher 
      ? parentWatcher.create()  // Child of parent
      : Watcher.ROOT.create();   // Child of root
  }
}
```

### Watcher Hierarchy Example

```typescript
// App creates root-level watcher
class MyApp extends BaseApp {
  constructor(props) {
    super(props);
    // this.watcher = Watcher.ROOT.create()
  }
}

// Page creates watcher as child of App's watcher
class HomePage extends BasePage {
  constructor() {
    const app = injector.get('APP');
    super(app.watcher);
    // this.watcher = app.watcher.create()
  }
}

// Partial creates watcher as child of Page's watcher
class MyPartial extends BasePartial {
  constructor() {
    const page = injector.get('ACTIVE_PAGE');
    super(page.watcher);
    // this.watcher = page.watcher.create()
  }
}
```

### Variable Watching

Fragments can watch their variables for changes:

```typescript
export default class MyPage extends BasePage {
  onReady() {
    // Watch variable changes
    this.watch('user', (newValue, oldValue) => {
      console.log('User changed:', oldValue, '→', newValue);
      this.onUserChange(newValue);
    }, {});

    // Watch computed expression
    this.watcher.watch(() => {
      return this.Variables.items.dataSet.filter(i => i.active).length;
    }, (prev, now) => {
      console.log('Active items:', prev, '→', now);
    });
  }

  onUserChange(user: any) {
    // React to user change
    this.Widgets.welcomeLabel.caption = `Welcome, ${user.name}!`;
  }
}
```

### Widget Binding with Watchers

Widgets use the fragment's watcher for reactive updates:

```typescript
// Generated code from transpiler
<WmMemo watcher={this.watcher} render={(watch) => {
  const userName = watch(() => this.Variables.user.dataSet.name);
  const userEmail = watch(() => this.Variables.user.dataSet.email);
  
  return (
    <View>
      <WmLabel caption={userName} />
      <WmLabel caption={userEmail} />
    </View>
  );
}} />
```

---

## Variable Binding

Fragments manage variables and provide data to widgets.

### Variable Structure

```typescript
export default class MyPage extends BasePage {
  Variables = {
    user: {
      dataSet: null,
      loading: false,
      error: null,
      invoke: () => {
        // Fetch user data
      }
    },
    items: {
      dataSet: [],
      loading: false,
      error: null,
      invoke: () => {
        // Fetch items
      }
    }
  };
}
```

### Variable Initialization

```typescript
export default class MyPage extends BasePage {
  constructor(appWatcher: Watcher) {
    super(appWatcher);
    
    // Initialize variables
    this.initVariables();
  }

  private initVariables() {
    // Service Variable
    this.Variables.getUserService = {
      dataSet: null,
      loading: false,
      invoke: async () => {
        this.Variables.getUserService.loading = true;
        try {
          const response = await fetch('/api/user');
          this.Variables.getUserService.dataSet = await response.json();
        } catch (error) {
          this.Variables.getUserService.error = error;
        } finally {
          this.Variables.getUserService.loading = false;
        }
      }
    };
  }

  onReady() {
    // Auto-invoke variables
    this.Variables.getUserService.invoke();
  }
}
```

### Two-Way Binding

Variables support two-way data binding with form widgets:

```typescript
// In page script
export default class FormPage extends BasePage {
  Variables = {
    formData: {
      dataSet: {
        name: '',
        email: '',
        age: 0
      }
    }
  };

  onSubmit() {
    const data = this.Variables.formData.dataSet;
    console.log('Submitting:', data);
    // Submit form data
  }
}

// In template (generated code)
<WmForm>
  <WmText 
    value={this.Variables.formData.dataSet.name}
    onChangeText={(text) => {
      this.Variables.formData.dataSet.name = text;
      this.watcher.check(); // Trigger re-render
    }}
  />
  <WmText 
    value={this.Variables.formData.dataSet.email}
    onChangeText={(text) => {
      this.Variables.formData.dataSet.email = text;
      this.watcher.check();
    }}
  />
</WmForm>
```

### Variable Scope

Variables are scoped to their fragment:

```
App.Variables.globalData     ← Accessible from all fragments
  └── Page.Variables.pageData    ← Accessible from page and its children
      ├── Partial.Variables.partialData   ← Only in partial
      └── Prefab.Variables.prefabData     ← Only in prefab
```

Access parent variables:
```typescript
// In page
this.Variables.pageData  // Own variable
this.App.Variables.globalData  // App variable

// In partial
this.Variables.partialData  // Own variable
this.Page.Variables.pageData  // Page variable
this.App.Variables.globalData  // App variable
```

---

## Memoization in Fragments

Fragments provide a memoization cache for expensive computations.

### _memoize Map

```typescript
export class BaseFragment {
  private _memoize = new Map<string, any>();

  memoize(key: string, fn: Function) {
    if (!this._memoize.has(key)) {
      this._memoize.set(key, fn());
    }
    return this._memoize.get(key);
  }

  clearMemoizeCache() {
    this._memoize.clear();
  }
}
```

### Usage Examples

#### Expensive Calculation

```typescript
export default class MyPage extends BasePage {
  getFilteredItems() {
    return this.memoize('filteredItems', () => {
      console.log('Computing filtered items...');
      return this.Variables.items.dataSet
        .filter(item => item.active)
        .map(item => ({
          ...item,
          displayName: `${item.firstName} ${item.lastName}`,
          totalPrice: item.quantity * item.price
        }))
        .sort((a, b) => b.totalPrice - a.totalPrice);
    });
  }

  render() {
    const items = this.getFilteredItems();
    // Subsequent calls return cached value
  }
}
```

#### Computed Properties

```typescript
export default class DashboardPage extends BasePage {
  getTotalRevenue() {
    return this.memoize('totalRevenue', () => {
      return this.Variables.orders.dataSet
        .reduce((sum, order) => sum + order.total, 0);
    });
  }

  getAverageOrderValue() {
    return this.memoize('averageOrderValue', () => {
      const total = this.getTotalRevenue();
      const count = this.Variables.orders.dataSet.length;
      return count > 0 ? total / count : 0;
    });
  }
}
```

#### Cache Invalidation

```typescript
export default class MyPage extends BasePage {
  onDataRefresh() {
    // Clear cache when data changes
    this.clearMemoizeCache();
    
    // Or selectively clear
    this._memoize.delete('filteredItems');
    this._memoize.delete('totalRevenue');
  }

  watch('items', (newValue, oldValue) => {
    // Auto-clear cache on variable change
    this.clearMemoizeCache();
  }, {});
}
```

### When to Use Memoization

**Use memoization for**:
- Expensive filtering/mapping operations
- Complex calculations
- Sorted/grouped data
- Computed properties used multiple times

**Don't use memoization for**:
- Simple property access
- Single-use calculations
- Frequently changing data
- Async operations

---

## Script Execution Context

Fragment scripts execute with `this` referring to the fragment instance.

### Script Context

```typescript
// Page script file: HomePage.ts
export default class HomePage extends BasePage {
  // 'this' refers to the HomePage instance

  onReady() {
    // Access variables
    console.log(this.Variables.user.dataSet);
    
    // Access widgets
    this.Widgets.welcomeLabel.caption = 'Hello!';
    
    // Access App
    console.log(this.App.Variables.globalData);
    
    // Call other methods
    this.loadData();
  }

  loadData() {
    // Custom method
    this.Variables.items.invoke();
  }

  onButtonTap($event, widget) {
    // Event handler
    console.log('Button tapped:', widget.name);
  }
}
```

### Context Binding

Event handlers automatically have correct context:

```typescript
// In template
<WmButton onTap={this.onButtonTap.bind(this)} />

// Handler receives correct 'this'
onButtonTap($event, widget) {
  // 'this' is the page instance
  this.Variables.counter.dataSet++;
}
```

### Accessing Context from Nested Functions

```typescript
export default class MyPage extends BasePage {
  loadUsers() {
    fetch('/api/users')
      .then(response => response.json())
      .then(users => {
        // 'this' still refers to page (arrow function preserves context)
        this.Variables.users.dataSet = users;
      })
      .catch(error => {
        this.Variables.users.error = error.message;
      });
  }

  // Or use arrow function property
  loadUsersArrow = async () => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      this.Variables.users.dataSet = users;
    } catch (error) {
      this.Variables.users.error = error.message;
    }
  }
}
```

---

## Fragment Lifecycle

Complete lifecycle of a fragment with all hooks and phases.

### Lifecycle Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  FRAGMENT LIFECYCLE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CONSTRUCTION                                             │
│     constructor()                                            │
│     ├─→ Create watcher (child of parent)                    │
│     ├─→ Initialize Variables                                │
│     ├─→ Initialize Actions                                  │
│     └─→ Setup references (App, Page, etc.)                  │
│                                                              │
│  2. INITIALIZATION                                           │
│     onReady()                                                │
│     ├─→ Setup variable watchers                             │
│     ├─→ Invoke auto-load variables                          │
│     ├─→ Initialize widgets                                  │
│     └─→ Setup event handlers                                │
│                                                              │
│  3. ACTIVE PHASE                                             │
│     │                                                        │
│     ├─→ [For Pages] onShow()                                │
│     │   └─→ Page becomes visible                            │
│     │                                                        │
│     ├─→ Variable changes trigger watchers                   │
│     │   └─→ watcher.check() → re-render                     │
│     │                                                        │
│     ├─→ Event handlers execute                              │
│     │   └─→ onButtonTap(), onFormSubmit(), etc.             │
│     │                                                        │
│     └─→ [For Pages] onHide()                                │
│         └─→ Page becomes hidden                             │
│                                                              │
│  4. CLEANUP                                                  │
│     onDestroy() or destroy()                                 │
│     ├─→ watcher.destroy()                                   │
│     │   └─→ Clear expressions                               │
│     │   └─→ Destroy child watchers                          │
│     ├─→ clearMemoizeCache()                                 │
│     ├─→ Clear variable references                           │
│     └─→ isDestroyed = true                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Lifecycle Methods

```typescript
export default class MyPage extends BasePage {
  // 1. Construction
  constructor(appWatcher: Watcher) {
    super(appWatcher);
    console.log('Page constructed');
  }

  // 2. Initialization
  onReady() {
    console.log('Page ready');
    
    // Setup watchers
    this.watch('user', this.onUserChange, {});
    
    // Load initial data
    this.Variables.items.invoke();
  }

  // 3. Active phase hooks
  onShow() {
    console.log('Page shown');
    // Refresh data when page becomes visible
    this.Variables.items.invoke();
  }

  onHide() {
    console.log('Page hidden');
    // Pause activities
  }

  // 4. Cleanup
  onDestroy() {
    console.log('Page destroyed');
    // Custom cleanup
    super.destroy();
  }
}
```

### Page Navigation Lifecycle

```
Navigate to PageA:
  PageA.constructor()
  PageA.onReady()
  PageA.onShow()

Navigate to PageB:
  PageB.constructor()
  PageB.onReady()
  PageA.onHide()
  PageB.onShow()

Navigate back to PageA:
  PageA.onShow()
  PageB.onHide()
  (PageB may be destroyed or cached)
```

---

## Best Practices

### 1. Initialize Variables in Constructor

```typescript
// Good
constructor(appWatcher: Watcher) {
  super(appWatcher);
  this.initVariables();
}

private initVariables() {
  this.Variables.user = { dataSet: null };
  this.Variables.items = { dataSet: [] };
}
```

### 2. Use onReady for Setup

```typescript
// Good
onReady() {
  this.setupWatchers();
  this.loadInitialData();
}

// Bad: Don't do async work in constructor
constructor() {
  super();
  this.loadData(); // ✗ Too early
}
```

### 3. Clean Up Watchers

```typescript
// Good: Automatic cleanup via super.destroy()
onDestroy() {
  // Custom cleanup
  this.myCustomCleanup();
  
  // Automatic watcher cleanup
  super.destroy();
}
```

### 4. Use Memoization for Expensive Operations

```typescript
// Good
getProcessedData() {
  return this.memoize('processedData', () => {
    return this.expensiveOperation();
  });
}

// Clear when data changes
this.watch('rawData', () => {
  this._memoize.delete('processedData');
}, {});
```

### 5. Scope Variables Appropriately

```typescript
// App-level: Global data
App.Variables.currentUser
App.Variables.appConfig

// Page-level: Page-specific data
Page.Variables.pageData
Page.Variables.formData

// Partial/Prefab: Component-specific data
Partial.Variables.localState
```

### 6. Use Arrow Functions for Context Preservation

```typescript
// Good
loadData = async () => {
  const data = await fetchData();
  this.Variables.items.dataSet = data; // 'this' is correct
}

// Bad
loadData: function() {
  fetchData().then(function(data) {
    this.Variables.items.dataSet = data; // 'this' is wrong!
  });
}
```

---

## Summary

Fragment system provides:

- **Hierarchical Structure**: App → Page → Partial/Prefab
- **Watcher Integration**: Reactive data binding via child watchers
- **Variable Management**: Scoped variables per fragment
- **Memoization**: Cache expensive computations
- **Script Context**: `this` refers to fragment instance
- **Lifecycle Hooks**: onReady, onShow, onHide, onDestroy
- **Automatic Cleanup**: Watchers and caches cleaned on destroy

Understanding fragment internals enables building well-structured, performant WaveMaker applications.

