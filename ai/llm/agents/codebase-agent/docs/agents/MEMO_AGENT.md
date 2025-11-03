# Memo Agent - Detailed Documentation

## Overview

The **Memo Agent** is the expert on memoization and the WmMemo component in WaveMaker React Native. It understands how components are optimized through memoization, preventing unnecessary re-renders and improving performance.

## Domain Expertise

### Core Responsibilities

1. **WmMemo Component**
   - Memoization wrapper
   - Props comparison
   - Render optimization
   - Update control

2. **Memoization Patterns**
   - Component memoization
   - Value memoization
   - Callback memoization
   - Computed property caching

3. **shouldComponentUpdate**
   - Update conditions
   - Props comparison
   - State comparison
   - Performance optimization

4. **React Optimization**
   - React.memo usage
   - useMemo hook patterns
   - useCallback patterns
   - Pure components

## WmMemo Component

### Implementation

**Location**: `wavemaker-rn-runtime/src/runtime/memo.component.tsx`

```typescript
import React from 'react';
import { isEqual } from 'lodash';

interface WmMemoProps {
  name?: string;
  show?: boolean;
  children: React.ReactNode;
  memoProps?: string[];     // Props to compare for memoization
  skipRender?: boolean;      // Skip render optimization
}

interface WmMemoState {
  show: boolean;
}

/**
 * WmMemo - Memoization wrapper component
 * Prevents unnecessary re-renders by comparing props
 */
export class WmMemo extends React.Component<WmMemoProps, WmMemoState> {
  private previousProps: any = {};
  
  constructor(props: WmMemoProps) {
    super(props);
    this.state = {
      show: props.show !== false
    };
  }
  
  /**
   * Control updates based on props comparison
   */
  shouldComponentUpdate(
    nextProps: WmMemoProps,
    nextState: WmMemoState
  ): boolean {
    // Always update if skipRender is true
    if (nextProps.skipRender) {
      return true;
    }
    
    // Check show state
    if (nextState.show !== this.state.show) {
      return true;
    }
    
    // Check specified memo props
    if (nextProps.memoProps) {
      return this.hasPropsChanged(nextProps, nextProps.memoProps);
    }
    
    // Default: shallow comparison of all props
    return !this.shallowEqual(this.props, nextProps);
  }
  
  /**
   * Check if specified props have changed
   */
  private hasPropsChanged(nextProps: any, memoProps: string[]): boolean {
    return memoProps.some(propName => {
      const oldValue = this.previousProps[propName];
      const newValue = nextProps[propName];
      
      return !isEqual(oldValue, newValue);
    });
  }
  
  /**
   * Shallow equality check
   */
  private shallowEqual(obj1: any, obj2: any): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    return keys1.every(key => obj1[key] === obj2[key]);
  }
  
  /**
   * Store props for next comparison
   */
  componentDidUpdate(): void {
    if (this.props.memoProps) {
      this.props.memoProps.forEach(propName => {
        this.previousProps[propName] = (this.props as any)[propName];
      });
    }
  }
  
  render(): React.ReactNode {
    if (!this.state.show) {
      return null;
    }
    
    return this.props.children;
  }
}
```

### Usage

```tsx
// Basic usage - memoize entire component
<WmMemo>
  <ExpensiveComponent data={this.Variables.data.dataSet} />
</WmMemo>

// Selective memoization - only re-render if specific props change
<WmMemo memoProps={['userId', 'userName']}>
  <UserProfile
    userId={this.Variables.user.dataSet.id}
    userName={this.Variables.user.dataSet.name}
    email={this.Variables.user.dataSet.email}  // Changes to email won't trigger re-render
  />
</WmMemo>

// Conditional visibility
<WmMemo show={this.state.showDetails}>
  <DetailedView data={this.Variables.details.dataSet} />
</WmMemo>

// Skip memoization when needed
<WmMemo skipRender={this.state.forceUpdate}>
  <LiveUpdatingComponent />
</WmMemo>
```

## Memoization Patterns

### Pattern 1: Component Memoization

```typescript
// Expensive component that should only re-render when props change
class ExpensiveList extends BaseComponent<Props, State, Styles> {
  /**
   * Prevent re-renders unless data changes
   */
  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    return (
      nextProps.data !== this.props.data ||
      nextState.selectedId !== this.state.selectedId
    );
  }
  
  renderWidget(props: Props): React.ReactNode {
    return (
      <FlatList
        data={props.data}
        renderItem={this.renderItem}
      />
    );
  }
}

// Usage with WmMemo
<WmMemo memoProps={['data']}>
  <ExpensiveList data={this.Variables.items.dataSet} />
</WmMemo>
```

### Pattern 2: Value Memoization

```typescript
class DashboardPage extends BasePage<...> {
  private computedValuesCache = new Map<string, any>();
  
  /**
   * Memoize expensive computation
   */
  private getMemoizedTotal(): number {
    const data = this.Variables.salesData.dataSet;
    const cacheKey = JSON.stringify(data);
    
    if (this.computedValuesCache.has(cacheKey)) {
      return this.computedValuesCache.get(cacheKey);
    }
    
    // Expensive calculation
    const total = data.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    this.computedValuesCache.set(cacheKey, total);
    return total;
  }
  
  renderWidget(props) {
    return (
      <View>
        <WmLabel caption={`Total: $${this.getMemoizedTotal()}`} />
      </View>
    );
  }
}
```

### Pattern 3: Callback Memoization

```typescript
class ListPage extends BasePage<...> {
  // Memoize event handlers to prevent child re-renders
  private handleItemClick = this.memoizeCallback((item: any) => {
    this.Variables.selectedItem.setData(item);
    this.NavigationService.navigate('DetailPage', { item });
  });
  
  private memoizeCallback<T extends Function>(fn: T): T {
    let memoized: T;
    
    return ((...args: any[]) => {
      if (!memoized) {
        memoized = fn.bind(this);
      }
      return memoized(...args);
    }) as any as T;
  }
  
  renderWidget(props) {
    return (
      <WmList dataset={this.Variables.items.dataSet}>
        {(item, index) => (
          <WmListItem
            onPress={() => this.handleItemClick(item)}
          />
        )}
      </WmList>
    );
  }
}
```

### Pattern 4: Computed Property Memoization

```typescript
class UserPage extends BasePage<...> {
  private _fullName: string | null = null;
  private _nameComputed = false;
  
  /**
   * Computed property with caching
   */
  get fullName(): string {
    if (!this._nameComputed) {
      const { firstName, lastName } = this.Variables.user.dataSet;
      this._fullName = `${firstName} ${lastName}`;
      this._nameComputed = true;
    }
    
    return this._fullName!;
  }
  
  /**
   * Invalidate cache when data changes
   */
  protected init(): void {
    super.init();
    
    this.watcher.watch('Variables.user.dataSet', () => {
      this._nameComputed = false;
    });
  }
  
  renderWidget(props) {
    return <WmLabel caption={this.fullName} />;
  }
}
```

### Pattern 5: List Item Memoization

```typescript
// Memoized list item component
const MemoizedListItem = React.memo(
  ({ item, onPress }: any) => (
    <View>
      <WmLabel caption={item.name} />
      <WmButton caption="View" onPress={() => onPress(item)} />
    </View>
  ),
  (prevProps, nextProps) => {
    // Only re-render if item.id changed
    return prevProps.item.id === nextProps.item.id;
  }
);

// Usage
class ItemsPage extends BasePage<...> {
  renderWidget(props) {
    return (
      <WmList dataset={this.Variables.items.dataSet}>
        {(item, index) => (
          <MemoizedListItem
            key={item.id}
            item={item}
            onPress={this.handleItemPress}
          />
        )}
      </WmList>
    );
  }
}
```

## shouldComponentUpdate Patterns

### Pattern 1: Prop Comparison

```typescript
class MyWidget extends BaseComponent<Props, State, Styles> {
  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // Only update if specific props changed
    return (
      nextProps.data !== this.props.data ||
      nextProps.title !== this.props.title ||
      nextState.expanded !== this.state.expanded
    );
  }
}
```

### Pattern 2: Deep Comparison

```typescript
class MyWidget extends BaseComponent<Props, State, Styles> {
  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // Deep comparison for complex props
    return (
      !isEqual(nextProps.data, this.props.data) ||
      !isEqual(nextState.formData, this.state.formData)
    );
  }
}
```

### Pattern 3: Selective Update

```typescript
class MyWidget extends BaseComponent<Props, State, Styles> {
  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // Update only for specific state changes
    const stateChanged = (
      nextState.loading !== this.state.loading ||
      nextState.error !== this.state.error
    );
    
    // Or specific prop changes
    const propsChanged = (
      nextProps.userId !== this.props.userId
    );
    
    return stateChanged || propsChanged;
  }
}
```

## React Hooks Patterns

### useMemo Pattern

```typescript
import React, { useMemo } from 'react';

function ExpensiveComponent({ data }: { data: any[] }) {
  // Memoize expensive computation
  const sortedData = useMemo(() => {
    console.log('Sorting data...');
    return data.sort((a, b) => a.name.localeCompare(b.name));
  }, [data]); // Only recompute when data changes
  
  return (
    <View>
      {sortedData.map(item => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </View>
  );
}
```

### useCallback Pattern

```typescript
import React, { useCallback } from 'react';

function ParentComponent() {
  const [count, setCount] = React.useState(0);
  
  // Memoize callback to prevent child re-renders
  const handleClick = useCallback((id: number) => {
    console.log('Clicked:', id);
    // Process click
  }, []); // Empty deps - callback never changes
  
  return (
    <View>
      {items.map(item => (
        <ChildComponent
          key={item.id}
          item={item}
          onClick={handleClick}  // Same reference each render
        />
      ))}
    </View>
  );
}

// Child won't re-render unless item changes
const ChildComponent = React.memo(({ item, onClick }) => (
  <TouchableOpacity onPress={() => onClick(item.id)}>
    <Text>{item.name}</Text>
  </TouchableOpacity>
));
```

### React.memo Pattern

```typescript
// Memoize functional component
const UserCard = React.memo(
  ({ user }: { user: User }) => (
    <View>
      <Text>{user.name}</Text>
      <Text>{user.email}</Text>
    </View>
  ),
  (prevProps, nextProps) => {
    // Return true if props are equal (skip render)
    return prevProps.user.id === nextProps.user.id;
  }
);
```

## Performance Optimization

### 1. List Virtualization with Memoization

```typescript
class LargeListPage extends BasePage<...> {
  // Memoize render function
  private renderItem = ({ item }: { item: any }) => (
    <MemoizedListItem item={item} />
  );
  
  // Memoize key extractor
  private keyExtractor = (item: any) => item.id.toString();
  
  renderWidget(props) {
    return (
      <FlatList
        data={this.Variables.items.dataSet}
        renderItem={this.renderItem}
        keyExtractor={this.keyExtractor}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={20}
      />
    );
  }
}
```

### 2. Conditional Memoization

```typescript
class AdaptiveComponent extends BaseComponent<Props, State, Styles> {
  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    // Skip memoization in development for easier debugging
    if (__DEV__) {
      return true;
    }
    
    // Use memoization in production
    return nextProps.data !== this.props.data;
  }
}
```

### 3. Cache Invalidation

```typescript
class CachedDataComponent extends BaseComponent<Props, State, Styles> {
  private cache = new Map<string, any>();
  private cacheVersion = 0;
  
  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.cacheVersion++;
    this.cache.clear();
  }
  
  /**
   * Get cached value
   */
  private getCached(key: string, factory: () => any): any {
    const cacheKey = `${key}_${this.cacheVersion}`;
    
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, factory());
    }
    
    return this.cache.get(cacheKey);
  }
  
  protected onPropertyChange(prevProps: Props): void {
    if (prevProps.data !== this.props.data) {
      this.invalidateCache();
    }
  }
}
```

## Common Issues

### Issue 1: Over-Memoization

```typescript
// ❌ Bad: Memoizing everything unnecessarily
<WmMemo>
  <WmMemo>
    <WmMemo>
      <SimpleComponent /> // Too much overhead!
    </WmMemo>
  </WmMemo>
</WmMemo>

// ✅ Good: Memoize only expensive components
<SimpleComponent />
<WmMemo memoProps={['data']}>
  <ExpensiveComponent data={largeDataset} />
</WmMemo>
```

### Issue 2: Incorrect Dependencies

```typescript
// ❌ Bad: Missing dependencies in useMemo
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price * tax, 0);
}, [items]); // Missing 'tax' dependency!

// ✅ Good: Include all dependencies
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price * tax, 0);
}, [items, tax]);
```

### Issue 3: Stale Closures

```typescript
// ❌ Bad: Stale closure in useCallback
const handleClick = useCallback(() => {
  console.log(count); // Always logs initial count!
}, []); // Empty deps

// ✅ Good: Include dependencies
const handleClick = useCallback(() => {
  console.log(count); // Always logs current count
}, [count]);
```

## Best Practices

### Memoization Guidelines

1. **Profile First**: Measure before optimizing
2. **Memoize Expensive**: Only memoize expensive operations
3. **Correct Dependencies**: Include all dependencies
4. **Avoid Premature**: Don't optimize prematurely
5. **Test Thoroughly**: Test memoized components

### When to Memoize

✅ **DO memoize**:
- Large lists/tables
- Complex computations
- Frequent re-renders
- Heavy components

❌ **DON'T memoize**:
- Simple components
- Rarely rendered
- Already fast
- Adds complexity

## Agent Capabilities

### 1. Explain Memoization

**Query**: "How does WmMemo work?"

**Response**: Complete explanation of WmMemo and memoization

### 2. Optimize Performance

**Query**: "How to optimize my list performance?"

**Response**: Memoization strategies for lists

### 3. Debug Memoization

**Query**: "My component isn't memoizing correctly"

**Response**: Diagnostic steps for memoization issues

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Memoization & Render Optimization

