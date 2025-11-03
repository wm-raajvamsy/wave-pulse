# Fragment Agent - Detailed Documentation

## Overview

The **Fragment Agent** is the expert on fragments (pages, partials, prefabs) in WaveMaker React Native. It understands the fragment hierarchy, lifecycle, communication patterns, and how fragments compose to build applications.

## Domain Expertise

### Core Responsibilities

1. **Fragment Types**
   - Pages (top-level screens)
   - Partials (reusable sections)
   - Prefabs (packaged components)
   - Fragment hierarchy

2. **Fragment Lifecycle**
   - Initialization
   - Loading and unloading
   - Parameter passing
   - Cleanup and disposal

3. **Fragment Communication**
   - Parent-child communication
   - Event propagation
   - Data passing
   - Context sharing

4. **Fragment Composition**
   - Nesting rules
   - Loading strategies
   - Dependency management

## Fragment Types

### 1. Page (Top-Level Fragment)

**Location**: `wavemaker-rn-runtime/src/runtime/base-page.component.tsx`

```typescript
export abstract class BasePage<T extends BaseProps, S extends State> 
  extends BaseComponent<T, S, any> {
  
  // Page-specific properties
  public pageName: string;
  public Variables: any = {};
  public Widgets: any = {};
  public Actions: any = {};
  
  // App context
  protected App: any;
  
  constructor(props: T) {
    super(props, {} as any, 'Page');
    
    // Initialize app context
    this.App = this.getAppContext();
  }
  
  /**
   * Page lifecycle
   */
  protected init(): void {
    super.init();
    
    // Initialize variables
    this.initVariables();
    
    // Invoke page onReady
    this.invokeEventCallback('onReady');
    
    // Auto-invoke startUpdate variables
    this.autoInvokeVariables();
  }
  
  /**
   * Initialize variables
   */
  private initVariables(): void {
    Object.keys(this.Variables).forEach(varName => {
      const variable = this.Variables[varName];
      
      if (variable.config?.startUpdate) {
        variable.invoke();
      }
    });
  }
  
  /**
   * Navigate to another page
   */
  protected goToPage(pageName: string, params?: any): void {
    this.NavigationService.navigate(pageName, params);
  }
  
  /**
   * Get app context
   */
  private getAppContext(): any {
    return {
      // App-level data and methods
      activeUser: null,
      environment: 'production',
      // ...
    };
  }
}
```

### 2. Partial (Reusable Fragment)

**Location**: `wavemaker-rn-runtime/src/runtime/base-partial.component.tsx`

```typescript
export abstract class BasePartial<T extends BaseProps, S extends State> 
  extends BaseComponent<T, S, any> {
  
  // Partial-specific properties
  public partialName: string;
  public Variables: any = {};
  public Widgets: any = {};
  
  // Parent page reference
  protected Page: BasePage<any, any>;
  
  constructor(props: T) {
    super(props, {} as any, 'Partial');
  }
  
  /**
   * Partial lifecycle
   */
  protected init(): void {
    super.init();
    
    // Get parent page
    this.Page = this.findParentPage();
    
    // Initialize variables
    this.initVariables();
    
    // Invoke partial onLoad
    this.invokeEventCallback('onLoad');
  }
  
  /**
   * Find parent page in component tree
   */
  private findParentPage(): BasePage<any, any> {
    let current = this.parent;
    
    while (current) {
      if (current instanceof BasePage) {
        return current;
      }
      current = current.parent;
    }
    
    throw new Error('Partial must be inside a Page');
  }
  
  /**
   * Access page variables
   */
  protected getPageVariable(name: string): any {
    return this.Page?.Variables[name];
  }
  
  /**
   * Access page widgets
   */
  protected getPageWidget(name: string): any {
    return this.Page?.Widgets[name];
  }
}
```

### 3. Prefab (Packaged Fragment)

**Location**: `wavemaker-rn-runtime/src/runtime/base-prefab.component.tsx`

```typescript
export abstract class BasePrefab<T extends BaseProps, S extends State> 
  extends BaseComponent<T, S, any> {
  
  // Prefab-specific properties
  public prefabName: string;
  public Variables: any = {};
  public Widgets: any = {};
  public Partials: any = {};
  
  // Prefab configuration
  protected config: any;
  
  constructor(props: T, config: any) {
    super(props, {} as any, 'Prefab');
    this.config = config;
  }
  
  /**
   * Prefab lifecycle
   */
  protected init(): void {
    super.init();
    
    // Initialize prefab-specific setup
    this.initPrefabConfig();
    
    // Initialize variables
    this.initVariables();
    
    // Load partials
    this.loadPartials();
    
    // Invoke prefab onLoad
    this.invokeEventCallback('onLoad');
  }
  
  /**
   * Initialize prefab configuration
   */
  private initPrefabConfig(): void {
    // Apply configuration from props
    if (this.props.config) {
      Object.assign(this.config, this.props.config);
    }
  }
  
  /**
   * Load prefab partials
   */
  private loadPartials(): void {
    Object.keys(this.Partials).forEach(partialName => {
      const Partial = this.Partials[partialName];
      // Lazy load partial if needed
    });
  }
}
```

## Fragment Hierarchy

### Component Tree Structure

```
App
 ├─ NavigationContainer
 │   └─ Stack.Navigator
 │       ├─ HomePage (Page)
 │       │   ├─ HeaderPartial (Partial)
 │       │   ├─ ContentContainer
 │       │   │   ├─ UserListPrefab (Prefab)
 │       │   │   │   └─ UserItemPartial (Partial in Prefab)
 │       │   │   └─ FilterPartial (Partial)
 │       │   └─ FooterPartial (Partial)
 │       ├─ ProfilePage (Page)
 │       └─ SettingsPage (Page)
 └─ Modals
     └─ CustomModal (Partial)
```

### Hierarchy Rules

```typescript
// Valid hierarchy
Page → Partial → Widget
Page → Prefab → Partial → Widget
Page → Widget

// Invalid hierarchy
Partial → Page ❌
Prefab → Page ❌
Widget → Page ❌
```

## Fragment Lifecycle

### Complete Lifecycle Flow

```
Fragment Creation
    ↓
constructor()
    ↓
Set parent reference
    ↓
componentDidMount()
    ↓
init()
    ↓
    ├─→ Find parent (if Partial/Prefab)
    ├─→ Initialize Variables
    ├─→ Load dependencies
    └─→ Invoke onLoad/onReady
    ↓
─── Fragment Active ───
    ↓
Props Change
    ↓
componentDidUpdate()
    ↓
onPropertyChange()
    ↓
─── Fragment Unmounting ───
    ↓
componentWillUnmount()
    ↓
destroy()
    ↓
    ├─→ Cleanup subscriptions
    ├─→ Destroy child fragments
    ├─→ Clear references
    └─→ Invoke onDestroy
```

### Lifecycle Events

```typescript
// Page lifecycle events
interface PageEvents {
  onReady: () => void;        // Page ready
  onDestroy: () => void;      // Page destroyed
  onShow: () => void;         // Page shown (navigation)
  onHide: () => void;         // Page hidden (navigation)
}

// Partial lifecycle events
interface PartialEvents {
  onLoad: () => void;         // Partial loaded
  onDestroy: () => void;      // Partial destroyed
}

// Prefab lifecycle events
interface PrefabEvents {
  onLoad: () => void;         // Prefab loaded
  onDestroy: () => void;      // Prefab destroyed
  onPropertyChange: (key: string, value: any) => void; // Property changed
}
```

## Fragment Communication

### 1. Parent to Child

```typescript
// Page passing data to Partial
class HomePage extends BasePage<...> {
  renderWidget(props) {
    return (
      <HeaderPartial
        title={this.Variables.pageTitle.dataSet}
        user={this.Variables.currentUser.dataSet}
        onLogout={() => this.handleLogout()}
      />
    );
  }
}

// Partial receiving data
class HeaderPartial extends BasePartial<...> {
  renderWidget(props) {
    return (
      <View>
        <Text>{this.props.title}</Text>
        <Text>{this.props.user.name}</Text>
        <WmButton
          caption="Logout"
          onPress={this.props.onLogout}
        />
      </View>
    );
  }
}
```

### 2. Child to Parent

```typescript
// Partial notifying parent
class FilterPartial extends BasePartial<...> {
  private handleFilterChange(filter: any): void {
    // Option 1: Via callback prop
    if (this.props.onFilterChange) {
      this.props.onFilterChange(filter);
    }
    
    // Option 2: Via parent reference
    if (this.Page) {
      (this.Page as HomePage).updateFilter(filter);
    }
    
    // Option 3: Via event notifier
    this.notifier.notify('filterChanged', filter);
  }
}

// Page handling child event
class HomePage extends BasePage<...> {
  protected init(): void {
    super.init();
    
    // Subscribe to partial events
    this.subscribeToPartialEvents();
  }
  
  private subscribeToPartialEvents(): void {
    const filterPartial = this.getWidget('filterPartial');
    
    if (filterPartial) {
      filterPartial.notifier.subscribe('filterChanged', (filter) => {
        this.applyFilter(filter);
      });
    }
  }
  
  public updateFilter(filter: any): void {
    this.Variables.filterData.setData(filter);
    this.Variables.listData.invoke();
  }
}
```

### 3. Sibling Communication

```typescript
// Via parent coordination
class HomePage extends BasePage<...> {
  private handleUserSelect(user: any): void {
    // Update data
    this.Variables.selectedUser.setData(user);
    
    // Notify other partials
    const detailPartial = this.getWidget('userDetail');
    if (detailPartial) {
      detailPartial.loadUser(user);
    }
  }
  
  renderWidget(props) {
    return (
      <View>
        <UserListPartial
          onUserSelect={(user) => this.handleUserSelect(user)}
        />
        <UserDetailPartial
          name="userDetail"
          user={this.Variables.selectedUser.dataSet}
        />
      </View>
    );
  }
}
```

## Fragment Loading Strategies

### 1. Eager Loading (Default)

```typescript
// All fragments loaded immediately
class HomePage extends BasePage<...> {
  renderWidget(props) {
    return (
      <View>
        <HeaderPartial />
        <ContentPartial />
        <FooterPartial />
      </View>
    );
  }
}
```

### 2. Lazy Loading

```typescript
// Fragments loaded on demand
class HomePage extends BasePage<...> {
  state = {
    showDetails: false
  };
  
  renderWidget(props) {
    return (
      <View>
        <HeaderPartial />
        <ContentPartial />
        
        {this.state.showDetails && (
          <DetailsPartial />
        )}
        
        <FooterPartial />
      </View>
    );
  }
}
```

### 3. Deferred Loading

```typescript
// Fragment marked for deferred load
<WmPartial
  name="HeavyPartial"
  deferload={true}
/>

// Load programmatically
class HomePage extends BasePage<...> {
  private loadHeavyPartial(): void {
    const partial = this.getWidget('HeavyPartial');
    if (partial && partial.props.deferload) {
      partial.load();
    }
  }
}
```

### 4. Conditional Loading

```typescript
// Load based on condition
class HomePage extends BasePage<...> {
  renderWidget(props) {
    return (
      <View>
        {this.Variables.isLoggedIn.dataSet && (
          <UserDashboardPartial />
        )}
        
        {!this.Variables.isLoggedIn.dataSet && (
          <LoginPartial />
        )}
      </View>
    );
  }
}
```

## Fragment Composition Patterns

### Pattern 1: Container-Content

```typescript
// Container provides structure
class DashboardPage extends BasePage<...> {
  renderWidget(props) {
    return (
      <LayoutPartial>
        <HeaderPartial slot="header" />
        <SidebarPartial slot="sidebar" />
        <ContentPartial slot="content" />
        <FooterPartial slot="footer" />
      </LayoutPartial>
    );
  }
}
```

### Pattern 2: List-Item

```typescript
// List renders multiple item fragments
class UsersPage extends BasePage<...> {
  renderWidget(props) {
    return (
      <WmList dataset={this.Variables.users.dataSet}>
        {(item, index) => (
          <UserItemPartial
            user={item}
            onSelect={() => this.selectUser(item)}
          />
        )}
      </WmList>
    );
  }
}
```

### Pattern 3: Wizard Steps

```typescript
// Multi-step wizard with fragments
class WizardPage extends BasePage<...> {
  state = {
    currentStep: 1
  };
  
  renderWidget(props) {
    return (
      <View>
        {this.state.currentStep === 1 && <Step1Partial />}
        {this.state.currentStep === 2 && <Step2Partial />}
        {this.state.currentStep === 3 && <Step3Partial />}
      </View>
    );
  }
}
```

### Pattern 4: Master-Detail

```typescript
// Master list with detail view
class ProductsPage extends BasePage<...> {
  state = {
    selectedProduct: null
  };
  
  renderWidget(props) {
    return (
      <View style={{ flexDirection: 'row' }}>
        <ProductListPartial
          onSelect={(product) => this.setState({ selectedProduct: product })}
        />
        
        {this.state.selectedProduct && (
          <ProductDetailPartial
            product={this.state.selectedProduct}
          />
        )}
      </View>
    );
  }
}
```

## Fragment Best Practices

### 1. Fragment Design

- **Single Responsibility**: Each fragment has one clear purpose
- **Reusability**: Design partials for reuse across pages
- **Independence**: Minimize dependencies between fragments
- **Parameterization**: Use props for configuration

### 2. Fragment Communication

- **Prefer Props**: Use props for parent-to-child data
- **Callbacks**: Use callbacks for child-to-parent events
- **Avoid Direct Access**: Don't directly access parent/sibling internals
- **Use Events**: Use event notifier for loose coupling

### 3. Fragment Lifecycle

- **Initialize Properly**: Setup in init(), not constructor
- **Cleanup**: Always cleanup in destroy()
- **Unsubscribe**: Unsubscribe from events
- **Null Checks**: Check parent/child references before use

### 4. Performance

- **Lazy Load**: Load heavy fragments on demand
- **Conditional Rendering**: Don't render hidden fragments
- **Memoization**: Memoize expensive fragments
- **Virtual Lists**: Use virtualization for list items

## Agent Capabilities

### 1. Explain Fragments

**Query**: "What are fragments in WaveMaker RN?"

**Response**: Complete explanation of fragment types and hierarchy

### 2. Fragment Communication

**Query**: "How do partials communicate with pages?"

**Response**: All communication patterns with examples

### 3. Fragment Lifecycle

**Query**: "What is the fragment lifecycle?"

**Response**: Complete lifecycle explanation with hooks

### 4. Debugging Fragments

**Query**: "My partial can't access page variables"

**Response**: Diagnostic steps for fragment issues

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Fragments (Pages, Partials, Prefabs) & Fragment Hierarchy

