# Component Hierarchy and Parent Relationships

This document covers the component hierarchy system, parent-child relationships, component tree management, and how parent references enable coordination between components in WaveMaker React Native.

## Table of Contents

1. [Parent-Child Relationships](#parent-child-relationships)
2. [WmComponentNode Tree](#wmcomponentnode-tree)
3. [Parent Reference Management](#parent-reference-management)
4. [Parent Listeners](#parent-listeners)
5. [EventNotifier Parent Hierarchy](#eventnotifier-parent-hierarchy)
6. [Use Cases and Patterns](#use-cases-and-patterns)
7. [Traversing the Component Tree](#traversing-the-component-tree)
8. [Best Practices](#best-practices)

---

## Parent-Child Relationships

Every `BaseComponent` maintains a reference to its parent component, enabling communication and coordination in the component tree.

### Parent Property

**File**: `src/core/base.component.tsx`

```typescript
export abstract class BaseComponent<T, S, L> extends React.Component<T, S> {
  public parent: BaseComponent<any, any, any> = null as any;
  private parentListenerDestroyers: Function[] = [];
  public notifier = new EventNotifier();
  public componentNode: WmComponentNode;
  
  // ... other properties
}
```

### Setting the Parent

The `setParent()` method establishes the parent-child relationship:

```typescript
protected setParent(parent: BaseComponent<any, any, any>) {
  if (parent && this.parent !== parent) {
    // Set parent reference
    this.parent = parent;
    
    // Register in component tree
    this.parent.componentNode.add(this.componentNode);
    
    // Set up event notifier hierarchy
    this.notifier.setParent(parent.notifier);
    
    // Subscribe to parent events
    this.parentListenerDestroyers = [
      this.parent.subscribe('forceUpdate', () => {
        this.forceUpdate();
      }),
      this.parent.subscribe('destroy', () => {
        this.destroyParentListeners();
      })
    ];
  }
}
```

### Parent Relationship Establishment

```
┌─────────────────────────────────────────────────────────────┐
│            PARENT RELATIONSHIP ESTABLISHMENT                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Child Component Creation                                 │
│     └─→ Child constructed                                    │
│                                                              │
│  2. setParent(parent) Called                                 │
│     ├─→ Check: parent exists && parent !== current          │
│     └─→ Continue if true                                     │
│                                                              │
│  3. Set Parent Reference                                     │
│     └─→ this.parent = parent                                 │
│                                                              │
│  4. Register in Component Tree                               │
│     └─→ parent.componentNode.add(this.componentNode)         │
│         ├─→ Add to parent's children array                   │
│         └─→ Set componentNode.parent reference               │
│                                                              │
│  5. Set Up EventNotifier Hierarchy                           │
│     └─→ this.notifier.setParent(parent.notifier)            │
│         ├─→ Remove from old parent (if any)                  │
│         ├─→ Set new parent                                   │
│         └─→ Add to parent's children array                   │
│                                                              │
│  6. Subscribe to Parent Events                               │
│     ├─→ Subscribe to 'forceUpdate'                           │
│     │   └─→ Re-render when parent forces update             │
│     └─→ Subscribe to 'destroy'                               │
│         └─→ Clean up parent listeners                        │
│                                                              │
│  7. Store Unsubscribe Functions                              │
│     └─→ parentListenerDestroyers = [unsub1, unsub2]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### When is setParent Called?

Parent relationships are established during component mounting:

```typescript
// Example: Container widget adding child
export default class WmContainer extends BaseComponent {
  componentDidMount() {
    // Children set this container as their parent
    React.Children.forEach(this.props.children, (child: any) => {
      if (child?.type?.prototype instanceof BaseComponent) {
        child.ref?.current?.setParent(this);
      }
    });
  }
}
```

---

## WmComponentNode Tree

The `WmComponentNode` class creates a parallel tree structure that mirrors the component hierarchy but is separate from React's tree.

### WmComponentNode Structure

**File**: `src/core/wm-component-tree.ts`

```typescript
export class WmComponentNode {
  type?: string;
  parent?: WmComponentNode;
  readonly children: WmComponentNode[] = [];
  instance?: BaseComponent<any, any, any>;
  private id = ++globalId;
  private _classnameMap: Map<string, boolean> = new Map();

  constructor(args: {
    type?: string,
    classname?: string,
    children?: WmComponentNode[],
    instance?: BaseComponent<any, any, any>
  }) {
    this.type = args.type;
    this.instance = args.instance;
    args.children?.forEach(c => this.add(c));
  }
}
```

### Tree Operations

#### Adding a Child

```typescript
add(node: WmComponentNode) {
  if (node.parent !== this) {
    // Remove from old parent if exists
    node.parent?.remove(node);
    
    // Add to this node's children
    this.children.push(node);
    
    // Set parent reference
    node.parent = this;
    
    // Refresh the node
    node.refresh();
  }
}
```

#### Removing a Child

```typescript
remove(node: WmComponentNode) {
  const i = this.children.findIndex((n) => n === node);
  if (i >= 0) {
    // Remove from children array
    this.children.splice(i, 1);
    
    // Clear parent reference
    node.parent = undefined;
    
    // Refresh remaining children
    this.children?.forEach((c) => {
      c.refresh();
    });
  }
}
```

#### Refreshing Nodes

```typescript
private refresh(only?: (node: WmComponentNode) => boolean) {
  // Refresh this node if filter passes
  if (!only || only(this)) {
    this.instance?.refresh();
  }
  
  // Recursively refresh children if filter provided
  if (only) {
    this.children?.forEach((c) => {
      c?.refresh(only);
    });
  }
}
```

### Component Tree vs React Tree

```
React Component Tree:
<App>
  <Page>
    <Container>
      <Button />
      <Text />
    </Container>
  </Page>
</App>

WmComponentNode Tree:
AppNode
  └─ PageNode
      └─ ContainerNode
          ├─ ButtonNode
          └─ TextNode

Each node has:
- Reference to component instance
- Parent node reference
- Children node array
- Type and classname information
```

### Why a Separate Tree?

**Reasons for WmComponentNode**:

1. **Direct Access**: Navigate component hierarchy without React internals
2. **Custom Operations**: Perform WaveMaker-specific operations
3. **Refresh Control**: Selective refresh of component subtrees
4. **Query Capabilities**: Find components by type, class, etc.
5. **Independence**: Not affected by React reconciliation

### Tree Initialization

```typescript
export abstract class BaseComponent {
  public componentNode: WmComponentNode;

  constructor(markupProps: T, defaultClass: string, ...) {
    // Create component node
    this.componentNode = new WmComponentNode({
      type: this.constructor.name,
      instance: this
    });
  }
}
```

---

## Parent Reference Management

How parent references are created, maintained, and cleaned up.

### Parent Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│               PARENT REFERENCE LIFECYCLE                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CREATION PHASE                                              │
│  ├─→ Child component constructed                             │
│  ├─→ Parent reference initially null                         │
│  └─→ ComponentNode created without parent                    │
│                                                              │
│  MOUNTING PHASE                                              │
│  ├─→ Parent's componentDidMount() executes                   │
│  ├─→ Parent identifies children                              │
│  ├─→ Calls child.setParent(this)                            │
│  └─→ Parent reference established                            │
│                                                              │
│  ACTIVE PHASE                                                │
│  ├─→ Child can access parent via this.parent                 │
│  ├─→ Child receives parent events                            │
│  ├─→ Parent can trigger updates in children                  │
│  └─→ Communication flows both ways                           │
│                                                              │
│  UNMOUNTING PHASE                                            │
│  ├─→ Parent notifies 'destroy' event                         │
│  ├─→ Child's destroyParentListeners() called                 │
│  ├─→ Parent listeners unsubscribed                           │
│  ├─→ ComponentNode removed from parent                       │
│  └─→ Parent reference cleared (optional)                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Accessing the Parent

```typescript
export default class WmWidget extends BaseComponent {
  someMethod() {
    if (this.parent) {
      // Access parent properties
      const parentId = this.parent.props.id;
      
      // Call parent methods
      this.parent.refresh();
      
      // Get parent type
      const parentType = this.parent.constructor.name;
      
      // Navigate up the tree
      const grandParent = this.parent.parent;
    }
  }
}
```

### Finding Ancestor by Type

```typescript
export default class WmWidget extends BaseComponent {
  findAncestor(type: string): BaseComponent<any, any, any> | null {
    let current = this.parent;
    
    while (current) {
      if (current.constructor.name === type) {
        return current;
      }
      current = current.parent;
    }
    
    return null;
  }

  // Usage
  componentDidMount() {
    const form = this.findAncestor('WmForm');
    if (form) {
      console.log('This widget is inside a form');
    }
    
    const list = this.findAncestor('WmList');
    if (list) {
      console.log('This widget is inside a list');
    }
  }
}
```

### Checking Parent Chain

```typescript
export default class WmWidget extends BaseComponent {
  isChildOf(ancestor: BaseComponent<any, any, any>): boolean {
    let current = this.parent;
    
    while (current) {
      if (current === ancestor) {
        return true;
      }
      current = current.parent;
    }
    
    return false;
  }

  getDepth(): number {
    let depth = 0;
    let current = this.parent;
    
    while (current) {
      depth++;
      current = current.parent;
    }
    
    return depth;
  }
}
```

---

## Parent Listeners

Components automatically subscribe to specific parent events when the parent relationship is established.

### Parent Event Subscriptions

```typescript
protected setParent(parent: BaseComponent<any, any, any>) {
  if (parent && this.parent !== parent) {
    this.parent = parent;
    // ... other setup
    
    // Subscribe to parent events
    this.parentListenerDestroyers = [
      // Force update subscription
      this.parent.subscribe('forceUpdate', () => {
        this.forceUpdate();
      }),
      
      // Destroy subscription
      this.parent.subscribe('destroy', () => {
        this.destroyParentListeners();
      })
    ];
  }
}
```

### Force Update Propagation

When a parent forces an update, all children re-render:

```typescript
export default class WmContainer extends BaseComponent {
  handleDataChange() {
    // Update container state
    this.updateState({ data: newData });
    
    // Force children to update
    this.notifier.notify('forceUpdate', []);
    // All children subscribed to 'forceUpdate' will re-render
  }
}
```

**Flow**:
```
Parent.notify('forceUpdate')
  └─→ Child1.forceUpdate() ✓
  └─→ Child2.forceUpdate() ✓
  └─→ Child3.forceUpdate() ✓
```

### Destroy Cascade

When parent is destroyed, children clean up their parent listeners:

```typescript
componentWillUnmount() {
  // Notify children of destruction
  this.notifier.notify('destroy', []);
  
  // Children's destroyParentListeners() is called
  // ...rest of cleanup
}
```

### Custom Parent Listeners

Components can add custom parent event listeners:

```typescript
export default class WmFormField extends BaseComponent {
  componentDidMount() {
    if (this.parent) {
      // Listen to parent's submit event
      const unsub = this.parent.subscribe('submit', () => {
        this.validate();
      });
      
      // Register for cleanup
      this.parentListenerDestroyers.push(unsub);
    }
  }
}

// Parent form triggers submit
export default class WmForm extends BaseComponent {
  handleSubmit() {
    // Notify all child fields
    this.notifier.notify('submit', []);
    
    // Each field's validate() is called
  }
}
```

### Cleanup of Parent Listeners

```typescript
public destroyParentListeners() {
  // Unsubscribe from all parent events
  this.parentListenerDestroyers.forEach(unsub => unsub());
  this.parentListenerDestroyers.length = 0;
}

componentWillUnmount() {
  // Automatic cleanup
  this.destroyParentListeners();
  
  // ... other cleanup
}
```

---

## EventNotifier Parent Hierarchy

The `EventNotifier` also maintains a parent-child hierarchy parallel to components.

### EventNotifier Hierarchy

**File**: `src/core/event-notifier.ts`

```typescript
export default class EventNotifier {
  public static ROOT = new EventNotifier();
  private parent: EventNotifier = EventNotifier.ROOT;
  private children: EventNotifier[] = [];

  setParent(parent: EventNotifier) {
    if (parent !== this.parent) {
      // Remove from old parent
      this.removeFromParent();
      
      // Set new parent
      this.parent = parent;
      
      // Add to new parent's children
      this.parent.children.push(this);
    }
  }

  private removeFromParent() {
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i >= 0) {
        this.parent.children.splice(i, 1);
      }
      this.parent = null as any;
    }
  }
}
```

### Hierarchy Structure

```
EventNotifier.ROOT
  │
  ├─ App.notifier
  │   │
  │   ├─ Page.notifier
  │   │   │
  │   │   ├─ Container.notifier
  │   │   │   ├─ Button.notifier
  │   │   │   └─ Text.notifier
  │   │   │
  │   │   └─ List.notifier
  │   │       └─ ListItem.notifier (×N)
  │   │
  │   └─ Partial.notifier
  │
  └─ Dialog.notifier
```

### Event Propagation with Parent

#### Downward Propagation (Default)

Events propagate from parent to all children:

```typescript
notify(event: string, args: any[], emitToParent = false) {
  // Execute local listeners
  let propagate = true;
  if (this.listeners[event]) {
    propagate = !this.listeners[event].find((l: Function) => {
      return (l && l.apply(null, args)) === false;
    });
  }
  
  // Propagate to children (default)
  if (propagate && !emitToParent) {
    this.children.forEach((c) => {
      c.notify(event, args);
    });
  }
}
```

**Example**:
```typescript
// Parent notifies all children
container.notifier.notify('dataLoaded', [data], false);

// Flow:
Container.notify('dataLoaded')
  ├─→ Button.notify('dataLoaded')
  ├─→ Text.notify('dataLoaded')
  └─→ Icon.notify('dataLoaded')
```

#### Upward Propagation (emitToParent=true)

Events propagate from child to parent chain:

```typescript
notify(event: string, args: any[], emitToParent = false) {
  // ... execute local listeners
  
  // Propagate upward to parent
  if (propagate && emitToParent) {
    this.parent?.notify(event, args, true);
  }
}
```

**Example**:
```typescript
// Child notifies parent chain
button.notifier.notify('tap', [event], true);

// Flow:
Button.notify('tap', true)
  └─→ Container.notify('tap', true)
      └─→ Page.notify('tap', true)
          └─→ App.notify('tap', true)
              └─→ ROOT.notify('tap', true)
```

### Integration with Component Parent

When component parent is set, notifier parent is also set:

```typescript
protected setParent(parent: BaseComponent<any, any, any>) {
  if (parent && this.parent !== parent) {
    this.parent = parent;
    
    // Set notifier parent to match component parent
    this.notifier.setParent(parent.notifier);
    
    // ... rest of setup
  }
}
```

**This ensures**:
- Component hierarchy matches event hierarchy
- Events flow naturally through component tree
- Parent-child communication works seamlessly

---

## Use Cases and Patterns

Common scenarios where parent relationships are essential.

### Use Case 1: Form Field Validation

Form fields access parent form for validation coordination:

```typescript
export default class WmText extends BaseComponent {
  validate(): boolean {
    const isValid = this.checkValidity();
    
    if (!isValid && this.parent) {
      // Notify parent form of validation error
      this.parent.notifier.notify('fieldError', [{
        field: this.props.name,
        error: this.state.error
      }]);
    }
    
    return isValid;
  }
}

export default class WmForm extends BaseComponent {
  componentDidMount() {
    // Listen to field errors
    this.subscribe('fieldError', (errorData) => {
      console.log(`Field ${errorData.field} has error:`, errorData.error);
      this.updateState({
        errors: [...this.state.errors, errorData]
      });
    });
  }
}
```

### Use Case 2: List Item Communication

List items communicate with parent list:

```typescript
export default class WmListItem extends BaseComponent {
  handleTap() {
    if (this.parent && this.parent.constructor.name === 'WmList') {
      // Notify parent list of item selection
      (this.parent as WmList).selectItem(this);
    }
  }
}

export default class WmList extends BaseComponent {
  selectItem(item: WmListItem) {
    // Update selected item
    this.updateState({ selectedItem: item.props.id });
    
    // Notify all items to update selection state
    this.notifier.notify('selectionChanged', [item.props.id]);
  }
}
```

### Use Case 3: Nested Container Layout

Nested containers coordinate layout calculations:

```typescript
export default class WmContainer extends BaseComponent {
  calculateAvailableSpace(): { width: number, height: number } {
    let availableWidth = this.layout.width;
    let availableHeight = this.layout.height;
    
    // Subtract parent's padding if exists
    if (this.parent) {
      const parentStyles = this.parent.styles.root;
      availableWidth -= (parentStyles.paddingLeft || 0) + (parentStyles.paddingRight || 0);
      availableHeight -= (parentStyles.paddingTop || 0) + (parentStyles.paddingBottom || 0);
    }
    
    return { width: availableWidth, height: availableHeight };
  }
}
```

### Use Case 4: Theme Inheritance

Components inherit theme settings from parent:

```typescript
export default class WmWidget extends BaseComponent {
  getEffectiveTheme() {
    // Check if parent has custom theme override
    if (this.parent && this.parent.theme !== BASE_THEME) {
      return this.parent.theme;
    }
    
    // Use own theme
    return this.theme;
  }

  componentDidMount() {
    const theme = this.getEffectiveTheme();
    this.applyTheme(theme);
  }
}
```

### Use Case 5: Accessibility Context

Parent provides accessibility context to children:

```typescript
export default class WmFormField extends BaseComponent {
  getAccessibilityLabel(): string {
    let label = this.props.accessibilitylabel || this.props.caption;
    
    // Prepend parent form name for context
    if (this.parent && this.parent.constructor.name === 'WmForm') {
      const formName = this.parent.props.name;
      label = `${formName}, ${label}`;
    }
    
    return label;
  }
}
```

### Use Case 6: Data Context Propagation

Parent provides data context for children:

```typescript
export default class WmDataProvider extends BaseComponent {
  componentDidMount() {
    // Provide data to children
    this.notifier.notify('dataContextAvailable', [this.state.data]);
  }
}

export default class WmDataConsumer extends BaseComponent {
  componentDidMount() {
    if (this.parent) {
      // Request data context from parent
      this.parent.subscribe('dataContextAvailable', (data) => {
        this.updateState({ contextData: data });
      });
    }
  }
}
```

---

## Traversing the Component Tree

Utility methods for navigating the component hierarchy.

### Traversal Utilities

```typescript
export class ComponentTreeUtils {
  /**
   * Find first ancestor matching predicate
   */
  static findAncestor(
    component: BaseComponent<any, any, any>,
    predicate: (c: BaseComponent<any, any, any>) => boolean
  ): BaseComponent<any, any, any> | null {
    let current = component.parent;
    
    while (current) {
      if (predicate(current)) {
        return current;
      }
      current = current.parent;
    }
    
    return null;
  }

  /**
   * Get all ancestors up to root
   */
  static getAncestors(
    component: BaseComponent<any, any, any>
  ): BaseComponent<any, any, any>[] {
    const ancestors: BaseComponent<any, any, any>[] = [];
    let current = component.parent;
    
    while (current) {
      ancestors.push(current);
      current = current.parent;
    }
    
    return ancestors;
  }

  /**
   * Find all descendants matching predicate
   */
  static findDescendants(
    component: BaseComponent<any, any, any>,
    predicate: (c: BaseComponent<any, any, any>) => boolean
  ): BaseComponent<any, any, any>[] {
    const results: BaseComponent<any, any, any>[] = [];
    
    const traverse = (node: WmComponentNode) => {
      if (node.instance && predicate(node.instance)) {
        results.push(node.instance);
      }
      
      node.children.forEach(child => traverse(child));
    };
    
    traverse(component.componentNode);
    return results;
  }

  /**
   * Get component path from root
   */
  static getPath(
    component: BaseComponent<any, any, any>
  ): string[] {
    const path: string[] = [];
    let current: BaseComponent<any, any, any> | null = component;
    
    while (current) {
      path.unshift(current.props.name || current.constructor.name);
      current = current.parent;
    }
    
    return path;
  }

  /**
   * Find sibling components
   */
  static getSiblings(
    component: BaseComponent<any, any, any>
  ): BaseComponent<any, any, any>[] {
    if (!component.parent) {
      return [];
    }
    
    return component.parent.componentNode.children
      .map(node => node.instance)
      .filter(instance => instance && instance !== component) as BaseComponent<any, any, any>[];
  }
}
```

### Usage Examples

```typescript
export default class WmWidget extends BaseComponent {
  componentDidMount() {
    // Find parent form
    const form = ComponentTreeUtils.findAncestor(this, (c) => {
      return c.constructor.name === 'WmForm';
    });
    
    // Get all ancestors
    const ancestors = ComponentTreeUtils.getAncestors(this);
    console.log('Depth:', ancestors.length);
    
    // Find all button descendants
    const buttons = ComponentTreeUtils.findDescendants(this, (c) => {
      return c.constructor.name === 'WmButton';
    });
    console.log('Number of buttons:', buttons.length);
    
    // Get component path
    const path = ComponentTreeUtils.getPath(this);
    console.log('Path:', path.join(' > '));
    // Example: "App > HomePage > MainContainer > UserCard > ActionButton"
    
    // Find siblings
    const siblings = ComponentTreeUtils.getSiblings(this);
    console.log('Siblings:', siblings.length);
  }
}
```

---

## Best Practices

### DO

✓ **Check parent exists before accessing**:
```typescript
if (this.parent) {
  this.parent.someMethod();
}
```

✓ **Use parent for contextual information**:
```typescript
const formContext = this.findAncestor('WmForm');
if (formContext) {
  // Use form context
}
```

✓ **Clean up parent listeners**:
```typescript
componentWillUnmount() {
  this.destroyParentListeners();
  super.componentWillUnmount();
}
```

✓ **Use events for parent-child communication**:
```typescript
this.parent.subscribe('dataChange', this.handleDataChange);
```

✓ **Register custom parent listeners for cleanup**:
```typescript
const unsub = this.parent.subscribe('customEvent', handler);
this.parentListenerDestroyers.push(unsub);
```

### DON'T

✗ **Don't assume parent type without checking**:
```typescript
// BAD
this.parent.formSpecificMethod();

// GOOD
if (this.parent.constructor.name === 'WmForm') {
  (this.parent as WmForm).formSpecificMethod();
}
```

✗ **Don't create circular parent relationships**:
```typescript
// BAD
componentA.setParent(componentB);
componentB.setParent(componentA); // Circular!
```

✗ **Don't store parent references without cleanup**:
```typescript
// BAD
this.myParentRef = this.parent;
// Should be cleared in componentWillUnmount
```

✗ **Don't modify parent state directly**:
```typescript
// BAD
this.parent.state.someValue = newValue;

// GOOD
this.parent.updateState({ someValue: newValue });
```

✗ **Don't rely on parent for critical functionality**:
```typescript
// BAD - component breaks if no parent
this.parent.doSomething();

// GOOD - graceful handling
if (this.parent) {
  this.parent.doSomething();
} else {
  this.handleNoParent();
}
```

### Performance Considerations

**Efficient parent lookups**:
```typescript
// Cache parent lookups if used frequently
private cachedForm: WmForm | null = null;

getForm(): WmForm | null {
  if (!this.cachedForm) {
    this.cachedForm = this.findAncestor('WmForm') as WmForm;
  }
  return this.cachedForm;
}

componentWillUnmount() {
  this.cachedForm = null;
  super.componentWillUnmount();
}
```

**Limit tree traversal depth**:
```typescript
findAncestor(type: string, maxDepth: number = 10): BaseComponent | null {
  let current = this.parent;
  let depth = 0;
  
  while (current && depth < maxDepth) {
    if (current.constructor.name === type) {
      return current;
    }
    current = current.parent;
    depth++;
  }
  
  return null;
}
```

---

## Debugging Parent Relationships

### Logging Parent Chain

```typescript
export default class WmWidget extends BaseComponent {
  logParentChain() {
    const chain: string[] = [];
    let current: BaseComponent<any, any, any> | null = this;
    
    while (current) {
      chain.push(`${current.constructor.name}#${current.props.id || current.props.name}`);
      current = current.parent;
    }
    
    console.log('Parent chain:', chain.join(' → '));
  }

  componentDidMount() {
    if (__DEV__) {
      this.logParentChain();
    }
  }
}
```

### Visualizing Component Tree

```typescript
export class TreeVisualizer {
  static visualize(root: BaseComponent<any, any, any>, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let output = `${spaces}${root.constructor.name}`;
    
    if (root.props.id || root.props.name) {
      output += ` (${root.props.id || root.props.name})`;
    }
    
    output += '\n';
    
    root.componentNode.children.forEach(child => {
      if (child.instance) {
        output += this.visualize(child.instance, indent + 1);
      }
    });
    
    return output;
  }
}

// Usage
console.log(TreeVisualizer.visualize(appInstance));
// Output:
// App
//   HomePage (homePage)
//     MainContainer (mainContainer)
//       Button (submitBtn)
//       Text (labelText)
//     SidePanel (sidePanel)
//       Menu (mainMenu)
```

---

## Summary

The parent system enables:

- **Hierarchical Organization**: Components organized in a tree
- **Contextual Communication**: Children access parent context
- **Event Propagation**: Events flow through parent-child relationships
- **Coordinated Behavior**: Parents coordinate child behavior
- **Lifecycle Management**: Parent destruction cascades to children
- **Tree Traversal**: Navigate and query the component hierarchy

Understanding parent relationships is essential for:
- Creating composite widgets
- Implementing form validation
- Managing data contexts
- Coordinating complex UIs
- Debugging component interactions
- Optimizing performance

The parent system, combined with EventNotifier and WmComponentNode, provides a robust framework for building complex, coordinated user interfaces in WaveMaker React Native.

