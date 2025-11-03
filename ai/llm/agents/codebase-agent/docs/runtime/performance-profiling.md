# Performance Profiling and Optimization Guide

This document provides comprehensive guidance on profiling, measuring, and optimizing performance in WaveMaker React Native applications.

## Table of Contents

1. [Performance Metrics](#performance-metrics)
2. [Render Performance](#render-performance)
3. [Watcher Performance](#watcher-performance)
4. [State Update Performance](#state-update-performance)
5. [Component Tree Performance](#component-tree-performance)
6. [Memory Profiling](#memory-profiling)
7. [Profiling Tools](#profiling-tools)
8. [Optimization Checklist](#optimization-checklist)
9. [Common Performance Issues](#common-performance-issues)

---

## Performance Metrics

Key performance indicators for React Native applications.

### Frame Rate (FPS)

Target: **60 FPS** (16.67ms per frame)

```typescript
// Frame budget breakdown
const FRAME_BUDGET_MS = 16.67; // 60 FPS

const frameBudget = {
  JavaScript: 8,      // JS execution
  Native: 4,          // Native operations
  React: 3,           // React reconciliation
  Layout: 1.67        // Layout calculations
};
```

### Performance Thresholds

| Metric | Good | Acceptable | Poor | Critical |
|--------|------|------------|------|----------|
| Component Render | < 5ms | 5-10ms | 10-16ms | > 16ms |
| Watch Expression | < 1ms | 1-5ms | 5-10ms | > 10ms |
| State Update | < 1ms | 1-3ms | 3-5ms | > 5ms |
| Tree Traversal | < 2ms | 2-5ms | 5-10ms | > 10ms |
| Full Watcher Check | < 10ms | 10-20ms | 20-50ms | > 50ms |

### Measuring Performance

```typescript
class PerformanceMetrics {
  static measure(name: string, fn: Function): number {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;
    
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }

  static async measureAsync(name: string, fn: Function): Promise<number> {
    const start = performance.now();
    await fn();
    const duration = performance.now() - start;
    
    if (__DEV__) {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
}
```

---

## Render Performance

Measuring and optimizing component render times.

### Measuring Render Times

#### Inline Measurement

```typescript
export default class WmWidget extends BaseComponent {
  private renderCount = 0;
  private totalRenderTime = 0;

  render() {
    const start = performance.now();
    
    this.renderCount++;
    const result = super.render();
    
    const duration = performance.now() - start;
    this.totalRenderTime += duration;
    
    if (__DEV__) {
      const avg = this.totalRenderTime / this.renderCount;
      
      console.log(
        `[Render] ${this.constructor.name}#${this.props.name || this.props.id}\n` +
        `  Count: ${this.renderCount}\n` +
        `  This: ${duration.toFixed(2)}ms\n` +
        `  Avg: ${avg.toFixed(2)}ms\n` +
        `  Total: ${this.totalRenderTime.toFixed(2)}ms`
      );
      
      if (duration > 16) {
        console.warn(`⚠️ Slow render: exceeds frame budget!`);
      }
    }
    
    return result;
  }
}
```

#### Using React Profiler

```typescript
import { Profiler } from 'react';

export default class WmPerformanceWidget extends BaseComponent {
  onRenderCallback = (
    id: string,
    phase: "mount" | "update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    console.log(`[Profiler] ${id}`);
    console.log(`  Phase: ${phase}`);
    console.log(`  Actual: ${actualDuration.toFixed(2)}ms`);
    console.log(`  Base: ${baseDuration.toFixed(2)}ms`);
    
    if (actualDuration > 16) {
      console.warn(`⚠️ Slow ${phase}: ${actualDuration.toFixed(2)}ms`);
    }
  }

  renderWidget(props: T) {
    return (
      <Profiler id={this.props.name || 'unnamed'} onRender={this.onRenderCallback}>
        {/* Component content */}
      </Profiler>
    );
  }
}
```

### Render Performance Analysis

#### Identifying Slow Renders

```typescript
class RenderProfiler {
  private static renderTimes = new Map<string, number[]>();

  static record(componentName: string, duration: number) {
    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }
    
    this.renderTimes.get(componentName)!.push(duration);
  }

  static analyze() {
    console.log('=== Render Performance Analysis ===\n');
    
    const analysis: Array<{
      component: string;
      count: number;
      avg: number;
      max: number;
      total: number;
    }> = [];
    
    this.renderTimes.forEach((times, component) => {
      const count = times.length;
      const total = times.reduce((sum, t) => sum + t, 0);
      const avg = total / count;
      const max = Math.max(...times);
      
      analysis.push({ component, count, avg, max, total });
    });
    
    // Sort by total time (worst offenders)
    analysis.sort((a, b) => b.total - a.total);
    
    analysis.forEach((item, index) => {
      console.log(`${index + 1}. ${item.component}`);
      console.log(`   Renders: ${item.count}`);
      console.log(`   Avg: ${item.avg.toFixed(2)}ms`);
      console.log(`   Max: ${item.max.toFixed(2)}ms`);
      console.log(`   Total: ${item.total.toFixed(2)}ms`);
      
      if (item.avg > 16) {
        console.warn('   ⚠️ Average exceeds frame budget');
      }
      
      if (item.count > 20) {
        console.warn('   ⚠️ Renders frequently');
      }
      
      console.log('');
    });
  }

  static reset() {
    this.renderTimes.clear();
  }
}
```

### Render Optimization Strategies

#### 1. Implement shouldComponentUpdate

```typescript
export default class OptimizedWidget extends BaseComponent {
  shouldComponentUpdate(nextProps: T, nextState: S) {
    // Only check relevant props
    const relevantProps = ['data', 'isActive', 'count'];
    
    const propsChanged = relevantProps.some(
      prop => this.props[prop] !== nextProps[prop]
    );
    
    const stateChanged = this.state.data !== nextState.data;
    
    return propsChanged || stateChanged;
  }
}
```

#### 2. Use PureComponent Pattern

```typescript
export default class PureWidget extends BaseComponent {
  shouldComponentUpdate(nextProps: T, nextState: S) {
    // Shallow comparison of all props and state
    return !shallowEqual(this.props, nextProps) ||
           !shallowEqual(this.state, nextState);
  }
}

function shallowEqual(obj1: any, obj2: any): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  return keys1.every(key => obj1[key] === obj2[key]);
}
```

#### 3. Memoize Expensive Computations

```typescript
export default class ComputingWidget extends BaseComponent {
  private memoizedResult: any = null;
  private lastInput: any = null;

  getProcessedData() {
    const input = this.props.data;
    
    if (this.lastInput === input && this.memoizedResult) {
      return this.memoizedResult;
    }
    
    const start = performance.now();
    
    this.memoizedResult = this.expensiveComputation(input);
    this.lastInput = input;
    
    const duration = performance.now() - start;
    console.log(`Computation took ${duration.toFixed(2)}ms`);
    
    return this.memoizedResult;
  }
}
```

---

## Watcher Performance

Analyzing and optimizing watch expression performance.

### Measuring Watcher Performance

#### Enhanced WatchExpression with Profiling

```typescript
class WatchExpression {
  private lastValue: any;
  private lastExecutionTime = 0;
  private executionCount = 0;
  private totalExecutionTime = 0;

  check() {
    const start = performance.now();
    
    this.executionCount++;
    const now = this.fn();
    
    this.lastExecutionTime = performance.now() - start;
    this.totalExecutionTime += this.lastExecutionTime;
    
    if (this.lastExecutionTime > 10) {
      console.warn(
        `Slow watch expression: ${this.lastExecutionTime.toFixed(2)}ms\n` +
        `Function: ${this.fn.toString().slice(0, 100)}...`
      );
    }
    
    if (!isEqual(this.lastValue, now)) {
      const prev = this.lastValue;
      this.lastValue = now;
      this.onChange(prev, now);
    }
  }

  getStats() {
    return {
      executionCount: this.executionCount,
      lastExecutionTime: this.lastExecutionTime,
      averageExecutionTime: this.totalExecutionTime / this.executionCount,
      totalExecutionTime: this.totalExecutionTime
    };
  }
}
```

#### Watcher Performance Profiler

```typescript
class WatcherProfiler {
  private static expressionStats = new Map<string, {
    count: number;
    totalTime: number;
    maxTime: number;
    function: string;
  }>();

  static record(fn: Function, duration: number) {
    const key = fn.toString().slice(0, 100);
    
    if (!this.expressionStats.has(key)) {
      this.expressionStats.set(key, {
        count: 0,
        totalTime: 0,
        maxTime: 0,
        function: key
      });
    }
    
    const stats = this.expressionStats.get(key)!;
    stats.count++;
    stats.totalTime += duration;
    stats.maxTime = Math.max(stats.maxTime, duration);
  }

  static analyze() {
    console.log('=== Watcher Performance Analysis ===\n');
    
    const sorted = Array.from(this.expressionStats.entries())
      .sort((a, b) => b[1].totalTime - a[1].totalTime);
    
    sorted.forEach(([key, stats], index) => {
      const avg = stats.totalTime / stats.count;
      
      console.log(`${index + 1}. Watch Expression`);
      console.log(`   Checks: ${stats.count}`);
      console.log(`   Avg: ${avg.toFixed(2)}ms`);
      console.log(`   Max: ${stats.maxTime.toFixed(2)}ms`);
      console.log(`   Total: ${stats.totalTime.toFixed(2)}ms`);
      console.log(`   Function: ${stats.function}`);
      
      if (avg > 5) {
        console.warn('   ⚠️ Average execution time high');
      }
      
      console.log('');
    });
  }
}
```

### Watcher Optimization Strategies

#### 1. Watch Specific Properties

```typescript
// Bad: Watches entire object
watch(() => this.Variables.largeObject.dataSet)

// Good: Watch specific property
watch(() => this.Variables.largeObject.dataSet.id)
watch(() => this.Variables.largeObject.dataSet.length)
```

#### 2. Memoize Complex Watches

```typescript
export default class MyPage extends BasePage {
  private filteredItemsCache: any[] = [];
  private lastRawItems: any[] = [];

  getFilteredItems() {
    const rawItems = this.Variables.items.dataSet;
    
    // Only recompute if source changed
    if (rawItems !== this.lastRawItems) {
      const start = performance.now();
      
      this.filteredItemsCache = rawItems
        .filter(item => item.active)
        .map(item => ({ ...item, processed: true }));
      
      this.lastRawItems = rawItems;
      
      const duration = performance.now() - start;
      console.log(`Filter took ${duration.toFixed(2)}ms`);
    }
    
    return this.filteredItemsCache;
  }

  // Watch the memoized result
  setupWatchers() {
    watch(() => this.getFilteredItems().length);
  }
}
```

#### 3. Limit Watcher Depth

```typescript
// Bad: Deep hierarchy
App Watcher
  └─ Page Watcher (depth 1)
      └─ Container Watcher (depth 2)
          └─ List Watcher (depth 3)
              └─ Item Watcher ×100 (depth 4)

// Good: Flatter structure
App Watcher
  ├─ Page Watcher (depth 1)
  ├─ Container Watcher (depth 1)
  └─ List Watcher (depth 1)
      └─ Item Watchers managed differently
```

---

## State Update Performance

Optimizing state updates and batching.

### Measuring State Update Performance

```typescript
export default class ProfiledComponent extends BaseComponent {
  updateState(newPartialState: S, callback?: () => void) {
    const start = performance.now();
    const stateKeys = Object.keys(newPartialState);
    
    super.updateState(newPartialState, () => {
      const duration = performance.now() - start;
      
      console.log(
        `[State Update] ${this.constructor.name}\n` +
        `  Keys: ${stateKeys.join(', ')}\n` +
        `  Duration: ${duration.toFixed(2)}ms`
      );
      
      callback && callback();
    });
  }
}
```

### State Update Batching Benefits

```typescript
class BatchingDemo {
  // Without batching: 3 renders
  updateWithoutBatching() {
    this.setState({ field1: 'a' }); // Render 1
    this.setState({ field2: 'b' }); // Render 2
    this.setState({ field3: 'c' }); // Render 3
  }

  // With updateState batching: 1 render
  updateWithBatching() {
    this.updateState({ field1: 'a' }); // Queued
    this.updateState({ field2: 'b' }); // Queued
    this.updateState({ field3: 'c' }); // Queued
    // All batched into single render!
  }

  // Manual batching
  updateManually() {
    this.updateState({
      field1: 'a',
      field2: 'b',
      field3: 'c'
    }); // Single call, single render
  }
}
```

### Measuring Batching Effectiveness

```typescript
class StateUpdateProfiler {
  private updateCounts = new Map<string, number>();
  private renderCounts = new Map<string, number>();

  recordUpdate(componentName: string) {
    const count = this.updateCounts.get(componentName) || 0;
    this.updateCounts.set(componentName, count + 1);
  }

  recordRender(componentName: string) {
    const count = this.renderCounts.get(componentName) || 0;
    this.renderCounts.set(componentName, count + 1);
  }

  analyze() {
    console.log('=== State Update Batching Analysis ===\n');
    
    this.updateCounts.forEach((updates, component) => {
      const renders = this.renderCounts.get(component) || 0;
      const batchingRatio = updates / renders;
      
      console.log(`${component}:`);
      console.log(`  Updates: ${updates}`);
      console.log(`  Renders: ${renders}`);
      console.log(`  Batching Ratio: ${batchingRatio.toFixed(2)}:1`);
      
      if (batchingRatio < 1.5) {
        console.warn('  ⚠️ Low batching effectiveness');
      }
      
      console.log('');
    });
  }
}
```

---

## Component Tree Performance

Analyzing component tree traversal and optimization.

### Tree Traversal Performance

```typescript
class TreeTraversalProfiler {
  static measureTraversal(root: BaseComponent<any, any, any>) {
    const start = performance.now();
    
    let nodeCount = 0;
    let maxDepth = 0;
    
    const traverse = (node: WmComponentNode, depth: number) => {
      nodeCount++;
      maxDepth = Math.max(maxDepth, depth);
      
      node.children.forEach(child => traverse(child, depth + 1));
    };
    
    traverse(root.componentNode, 0);
    
    const duration = performance.now() - start;
    
    console.log('=== Tree Traversal Performance ===');
    console.log(`Nodes: ${nodeCount}`);
    console.log(`Max Depth: ${maxDepth}`);
    console.log(`Duration: ${duration.toFixed(2)}ms`);
    console.log(`Avg per node: ${(duration / nodeCount).toFixed(3)}ms`);
    
    return { nodeCount, maxDepth, duration };
  }
}
```

### Optimizing Tree Operations

```typescript
// Bad: Traverse entire tree for each operation
function updateAllButtons(root: BaseComponent) {
  const traverse = (node: WmComponentNode) => {
    if (node.instance?.constructor.name === 'WmButton') {
      node.instance.updateState({ disabled: true });
    }
    node.children.forEach(child => traverse(child));
  };
  
  traverse(root.componentNode);
}

// Good: Cache button references
class ButtonManager {
  private buttons: WmButton[] = [];

  registerButton(button: WmButton) {
    this.buttons.push(button);
  }

  unregisterButton(button: WmButton) {
    const index = this.buttons.indexOf(button);
    if (index >= 0) {
      this.buttons.splice(index, 1);
    }
  }

  updateAllButtons() {
    this.buttons.forEach(button => {
      button.updateState({ disabled: true });
    });
  }
}
```

---

## Memory Profiling

Identifying and fixing memory leaks.

### Memory Usage Tracking

```typescript
class MemoryProfiler {
  private static snapshots: Array<{
    timestamp: number;
    components: number;
    watchers: number;
    listeners: number;
  }> = [];

  static takeSnapshot() {
    // Count active components, watchers, listeners
    const snapshot = {
      timestamp: Date.now(),
      components: this.countActiveComponents(),
      watchers: this.countActiveWatchers(),
      listeners: this.countActiveListeners()
    };
    
    this.snapshots.push(snapshot);
    
    return snapshot;
  }

  static analyze() {
    if (this.snapshots.length < 2) {
      console.log('Need at least 2 snapshots to analyze');
      return;
    }
    
    console.log('=== Memory Usage Analysis ===\n');
    
    this.snapshots.forEach((snapshot, index) => {
      console.log(`Snapshot ${index + 1} (${new Date(snapshot.timestamp).toISOString()})`);
      console.log(`  Components: ${snapshot.components}`);
      console.log(`  Watchers: ${snapshot.watchers}`);
      console.log(`  Listeners: ${snapshot.listeners}`);
      
      if (index > 0) {
        const prev = this.snapshots[index - 1];
        const componentDelta = snapshot.components - prev.components;
        const watcherDelta = snapshot.watchers - prev.watchers;
        const listenerDelta = snapshot.listeners - prev.listeners;
        
        console.log(`  Δ Components: ${componentDelta > 0 ? '+' : ''}${componentDelta}`);
        console.log(`  Δ Watchers: ${watcherDelta > 0 ? '+' : ''}${watcherDelta}`);
        console.log(`  Δ Listeners: ${listenerDelta > 0 ? '+' : ''}${listenerDelta}`);
        
        if (componentDelta > 10) {
          console.warn('  ⚠️ Component count increasing rapidly');
        }
      }
      
      console.log('');
    });
  }

  private static countActiveComponents(): number {
    // Implementation: traverse and count
    return 0;
  }

  private static countActiveWatchers(): number {
    // Implementation: count watcher instances
    return 0;
  }

  private static countActiveListeners(): number {
    // Implementation: count event listeners
    return 0;
  }
}
```

### Leak Detection

```typescript
class LeakDetector {
  private static componentRegistry = new WeakMap<BaseComponent<any, any, any>, string>();
  private static unmountedComponents = new Set<string>();

  static register(component: BaseComponent<any, any, any>) {
    const id = `${component.constructor.name}#${Math.random().toString(36)}`;
    this.componentRegistry.set(component, id);
  }

  static unregister(component: BaseComponent<any, any, any>) {
    const id = this.componentRegistry.get(component);
    if (id) {
      this.unmountedComponents.add(id);
    }
  }

  static checkForLeaks() {
    setTimeout(() => {
      console.log('=== Memory Leak Check ===');
      console.log(`Unmounted components: ${this.unmountedComponents.size}`);
      
      // If weak map still has references, they're leaked
      this.unmountedComponents.forEach(id => {
        console.log(`  Component ${id} may be leaked`);
      });
    }, 5000);
  }
}
```

---

## Profiling Tools

Using React DevTools and other profiling tools.

### React DevTools Profiler

#### Recording Performance

1. Open React DevTools
2. Go to Profiler tab
3. Click Record button
4. Interact with app
5. Stop recording

#### Analyzing Results

- **Flame Graph**: See component render times
- **Ranked Chart**: Components sorted by render time
- **Component Chart**: Individual component timeline

#### Interpretation

```typescript
// React DevTools data interpretation
interface ProfilerData {
  actualDuration: number;    // Time component took to render
  baseDuration: number;      // Estimated time without memoization
  startTime: number;         // When render started
  commitTime: number;        // When render committed
  interactions: Set<any>;    // User interactions during render
}

// Good: actualDuration close to baseDuration
// Bad: actualDuration >> baseDuration (inefficient)
```

### Performance Monitor

Enable performance monitor in development:

```typescript
import { PerformanceMonitor } from 'react-native';

if (__DEV__) {
  PerformanceMonitor.enable();
}
```

### Custom Performance Dashboard

```typescript
class PerformanceDashboard {
  private metrics = {
    renders: 0,
    slowRenders: 0,
    watcherChecks: 0,
    slowWatcherChecks: 0,
    stateUpdates: 0,
    avgRenderTime: 0,
    avgWatcherTime: 0
  };

  recordRender(duration: number) {
    this.metrics.renders++;
    if (duration > 16) {
      this.metrics.slowRenders++;
    }
    
    this.metrics.avgRenderTime = 
      (this.metrics.avgRenderTime * (this.metrics.renders - 1) + duration) / 
      this.metrics.renders;
  }

  recordWatcherCheck(duration: number) {
    this.metrics.watcherChecks++;
    if (duration > 5) {
      this.metrics.slowWatcherChecks++;
    }
    
    this.metrics.avgWatcherTime =
      (this.metrics.avgWatcherTime * (this.metrics.watcherChecks - 1) + duration) /
      this.metrics.watcherChecks;
  }

  display() {
    console.log('=== Performance Dashboard ===');
    console.log(`Renders: ${this.metrics.renders} (${this.metrics.slowRenders} slow)`);
    console.log(`Avg Render Time: ${this.metrics.avgRenderTime.toFixed(2)}ms`);
    console.log(`Watcher Checks: ${this.metrics.watcherChecks} (${this.metrics.slowWatcherChecks} slow)`);
    console.log(`Avg Watcher Time: ${this.metrics.avgWatcherTime.toFixed(2)}ms`);
    console.log(`State Updates: ${this.metrics.stateUpdates}`);
  }
}
```

---

## Optimization Checklist

Step-by-step optimization guide.

### Level 1: Quick Wins

- [ ] Enable production mode (`__DEV__ = false`)
- [ ] Use `updateState` instead of `setState`
- [ ] Implement `shouldComponentUpdate` for expensive components
- [ ] Use `React.memo` for functional components
- [ ] Avoid inline object/array creation in render
- [ ] Use proper keys in lists

### Level 2: Component Optimization

- [ ] Profile render times with React DevTools
- [ ] Identify components rendering > 16ms
- [ ] Add memoization for expensive computations
- [ ] Split large components into smaller ones
- [ ] Use `WmMemo` for selective re-rendering
- [ ] Optimize `shouldComponentUpdate` logic

### Level 3: Watcher Optimization

- [ ] Profile watch expression times
- [ ] Watch specific properties, not entire objects
- [ ] Memoize complex watch expressions
- [ ] Limit watcher hierarchy depth
- [ ] Remove unused watchers
- [ ] Use lazy evaluation in watches

### Level 4: State Management

- [ ] Batch multiple state updates
- [ ] Avoid unnecessary state updates
- [ ] Use local state when possible
- [ ] Normalize state shape
- [ ] Avoid deeply nested state

### Level 5: Memory Optimization

- [ ] Clean up subscriptions
- [ ] Clear timeouts on unmount
- [ ] Destroy watchers properly
- [ ] Profile memory usage
- [ ] Check for memory leaks
- [ ] Use weak references where appropriate

### Level 6: Advanced Optimization

- [ ] Use virtualization for long lists
- [ ] Implement code splitting
- [ ] Optimize images and assets
- [ ] Use lazy loading
- [ ] Profile native bridge calls
- [ ] Optimize animations (use native driver)

---

## Common Performance Issues

### Issue 1: Frequent Re-renders

**Symptoms**:
- Component renders > 10 times per second
- UI feels sluggish
- High CPU usage

**Diagnosis**:
```typescript
let renderCount = 0;
const startTime = Date.now();

componentDidUpdate() {
  renderCount++;
  const elapsed = Date.now() - startTime;
  
  if (elapsed >= 1000) {
    console.log(`Renders per second: ${renderCount}`);
    renderCount = 0;
    startTime = Date.now();
  }
}
```

**Solutions**:
1. Implement proper `shouldComponentUpdate`
2. Use `React.memo` or `PureComponent`
3. Avoid creating new objects in render
4. Move expensive computations outside render

### Issue 2: Slow Watch Expressions

**Symptoms**:
- Watcher checks take > 50ms
- UI freezes during data updates
- Delayed responses to user input

**Diagnosis**:
```typescript
watch(() => {
  const start = performance.now();
  const result = expensiveOperation();
  const duration = performance.now() - start;
  
  if (duration > 10) {
    console.warn(`Slow watch: ${duration}ms`);
  }
  
  return result;
});
```

**Solutions**:
1. Memoize expensive operations
2. Watch specific properties
3. Debounce frequent checks
4. Move computation to worker thread

### Issue 3: Memory Leaks

**Symptoms**:
- Memory usage grows over time
- App becomes slow after extended use
- Crashes on low-end devices

**Diagnosis**:
```typescript
// Take snapshots before and after navigation
MemoryProfiler.takeSnapshot(); // Before
navigateToPage();
MemoryProfiler.takeSnapshot(); // After
MemoryProfiler.analyze();
```

**Solutions**:
1. Clean up all subscriptions
2. Clear all timeouts
3. Destroy watchers
4. Remove event listeners
5. Clear component references

### Issue 4: Large Component Trees

**Symptoms**:
- Tree traversal takes > 10ms
- Initial render is slow
- Updates propagate slowly

**Diagnosis**:
```typescript
TreeTraversalProfiler.measureTraversal(appComponent);
```

**Solutions**:
1. Flatten component hierarchy
2. Use component registries
3. Avoid unnecessary nesting
4. Use direct references instead of traversal

---

## Summary

Effective performance profiling requires:

- **Measurement**: Use precise timing and profiling tools
- **Analysis**: Identify bottlenecks with data
- **Optimization**: Apply targeted improvements
- **Validation**: Measure impact of changes
- **Iteration**: Continuous profiling and optimization

Key metrics to monitor:
- Render times (< 16ms per frame)
- Watch expression times (< 5ms)
- State update frequency
- Memory usage trends
- Component tree depth

Tools to use:
- React DevTools Profiler
- Custom performance monitors
- Memory profilers
- Browser/Native performance tools

Follow the optimization checklist systematically, starting with quick wins and progressing to advanced optimizations. Always measure before and after optimization to validate improvements.

