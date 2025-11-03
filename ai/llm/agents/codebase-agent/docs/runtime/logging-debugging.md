# Logging and Debugging System

This document covers the logging infrastructure, debug tracing, performance monitoring, and debugging techniques in WaveMaker React Native applications.

## Table of Contents

1. [Logger System Architecture](#logger-system-architecture)
2. [Log Levels](#log-levels)
3. [Creating and Using Loggers](#creating-and-using-loggers)
4. [Hierarchical Loggers](#hierarchical-loggers)
5. [Built-in Loggers](#built-in-loggers)
6. [Logger Configuration](#logger-configuration)
7. [Performance Tracing](#performance-tracing)
8. [Debugging Techniques](#debugging-techniques)
9. [Production Logging](#production-logging)
10. [Best Practices](#best-practices)

---

## Logger System Architecture

WaveMaker React Native uses a hierarchical logging system built on `react-native-logs`.

### Core Components

**File**: `src/core/logger.ts`

```typescript
import { logger } from 'react-native-logs';

// Log levels with severity
const levels = {
  debug: 0,   // Most verbose
  info: 1,    // Informational
  warn: 2,    // Warnings
  error: 3    // Errors only
};

// Base logger instance
const log = logger.createLogger({
  severity: 'debug',
  levels: levels,
  enabledExtensions: []
});
```

### Logger Class

```typescript
export class Logger {
  private ins = null as any;

  constructor(private name: string, private level: string) {
    // Create extended logger with name
    this.ins = log.extend(this.name);
    log.enable(this.name);
  }

  private isEnabled(level: string) {
    // Check if level is enabled
    return levels[level] >= levels[this.level];
  }

  private log(level: string, msg: string | Function) {
    if (this.isEnabled(level)) {
      // Evaluate function if needed
      if (msg instanceof Function) {
        msg = msg();
      }
      this.ins[level](msg);
    }
  }

  debug(msg: string | Function) {
    this.log('debug', msg);
  }

  info(msg: string | Function) {
    this.log('info', msg);
  }

  warn(msg: string | Function) {
    this.log('warn', msg);
  }

  error(msg: string | Function) {
    this.log('error', msg);
  }

  extend(name: string) {
    return getLogger(this.name + '.' + name);
  }

  setLevel(level: string) {
    this.level = level;
  }
}
```

### LoggerCollection

Manages all logger instances:

```typescript
class LoggerCollection {
  loggerMap = new Map<string, Logger>();
  config = {} as any;
  key = 'wm.log.config';

  init() {
    // Load persisted configuration
    StorageService.getItem(this.key).then((data) => {
      if (data) {
        this.config = JSON.parse(data as string) || {};
        keys(this.config).forEach((k: string) => {
          this.loggerMap.get(k)?.setLevel(this.config[k].level);
        });
      }
    }).catch(() => {});
  }

  get(name: string) {
    return this.loggerMap.get(name);
  }

  set(name: string, logger: Logger) {
    this.loggerMap.set(name, logger);
  }

  setLogLevel(name?: string, level?: string) {
    // Set log level for logger(s)
    if (level !== undefined) {
      [...this.loggerMap.keys()]
        .filter(k => !name || k.startsWith(name))
        .forEach(k => {
          level && this.loggerMap.get(k)?.setLevel(level);
          if (k) {
            this.config[k] = this.config[k] || {};
            this.config[k].level = level;
          }
        });
      
      // Persist configuration
      StorageService.setItem(this.key, JSON.stringify(this.config));
    }
  }

  getLogLevel(name?: string) {
    return name && this.config[name]?.level;
  }

  list() {
    return sortBy([...this.loggerMap.keys()]);
  }
}
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              LOGGER SYSTEM ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  react-native-logs                                           │
│  └─→ Base Logger (log)                                       │
│                                                              │
│  LoggerCollection (Singleton)                                │
│  ├─→ loggerMap: Map<string, Logger>                         │
│  ├─→ config: { [name]: { level: string } }                  │
│  └─→ Persistent storage (StorageService)                    │
│                                                              │
│  Logger Hierarchy:                                           │
│  root                                                        │
│    ├─→ root.performance                                      │
│    │   └─→ root.performance.render                          │
│    ├─→ root.component                                        │
│    │   ├─→ root.component.button                            │
│    │   └─→ root.component.list                              │
│    └─→ root.network                                          │
│        └─→ root.network.api                                  │
│                                                              │
│  Logger Methods:                                             │
│  ├─→ debug(msg): Most verbose                               │
│  ├─→ info(msg): Informational                               │
│  ├─→ warn(msg): Warnings                                    │
│  └─→ error(msg): Errors only                                │
│                                                              │
│  Level Filtering:                                            │
│  If logger level = 'warn':                                   │
│    ├─→ debug() ✗ Not logged                                 │
│    ├─→ info()  ✗ Not logged                                 │
│    ├─→ warn()  ✓ Logged                                     │
│    └─→ error() ✓ Logged                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Log Levels

Four log levels control verbosity.

### Level Definitions

```typescript
const levels = {
  debug: 0,   // Development debugging
  info: 1,    // General information
  warn: 2,    // Warnings
  error: 3    // Errors only
};
```

### Level Behavior

| Level | Severity | debug() | info() | warn() | error() | Use Case |
|-------|----------|---------|--------|--------|---------|----------|
| debug | 0 | ✓ | ✓ | ✓ | ✓ | Development |
| info  | 1 | ✗ | ✓ | ✓ | ✓ | Verbose production |
| warn  | 2 | ✗ | ✗ | ✓ | ✓ | Production |
| error | 3 | ✗ | ✗ | ✗ | ✓ | Production (minimal) |

### Level Filtering

```typescript
private isEnabled(level: string) {
  // Current level must be >= requested level
  return levels[level] >= levels[this.level];
}

// Example: Logger level = 'warn' (2)
logger.debug('test');  // 0 >= 2? No → Not logged
logger.info('test');   // 1 >= 2? No → Not logged
logger.warn('test');   // 2 >= 2? Yes → Logged ✓
logger.error('test');  // 3 >= 2? Yes → Logged ✓
```

---

## Creating and Using Loggers

### Getting a Logger

```typescript
import loggerService from '@wavemaker/app-rn-runtime/core/logger';

// Get or create logger
const myLogger = loggerService.get('myModule');

// Or with specific level
const myLogger = loggerService.get('myModule', 'debug');
```

### Basic Logging

```typescript
export default class MyComponent extends BaseComponent {
  private logger = loggerService.get('component.myComponent');

  componentDidMount() {
    this.logger.debug('Component mounted');
    this.logger.info('Initialization complete');
    this.logger.warn('Using deprecated API');
    this.logger.error('Failed to load data');
  }
}
```

### Lazy Evaluation

Pass a function to defer expensive string construction:

```typescript
// Bad: String computed even if not logged
logger.debug('Data: ' + JSON.stringify(largeObject));

// Good: Function only executed if debug enabled
logger.debug(() => 'Data: ' + JSON.stringify(largeObject));
```

**Why?**
- Expensive operations only run when needed
- Improves performance when logging disabled
- Useful for complex object serialization

### Example with Lazy Evaluation

```typescript
export default class DataLoader extends BaseComponent {
  private logger = loggerService.get('data.loader');

  async loadData() {
    this.logger.info('Starting data load');
    
    const startTime = Date.now();
    const data = await this.fetchData();
    const duration = Date.now() - startTime;
    
    // Only compute message if debug enabled
    this.logger.debug(() => {
      return `Loaded ${data.length} items in ${duration}ms:\n${
        data.map(item => `  - ${item.id}: ${item.name}`).join('\n')
      }`;
    });
    
    this.logger.info(`Data loaded successfully (${duration}ms)`);
  }
}
```

---

## Hierarchical Loggers

Loggers can be organized hierarchically.

### Creating Hierarchical Loggers

```typescript
// Root logger
const rootLogger = loggerService.get('root');

// Extended logger
const performanceLogger = rootLogger.extend('performance');
// Full name: 'root.performance'

// Further extended
const renderLogger = performanceLogger.extend('render');
// Full name: 'root.performance.render'
```

### Hierarchy Example

```
root
├─ root.component
│  ├─ root.component.button
│  ├─ root.component.list
│  ├─ root.component.form
│  └─ root.component.chart
├─ root.network
│  ├─ root.network.api
│  ├─ root.network.websocket
│  └─ root.network.upload
├─ root.performance
│  ├─ root.performance.render
│  ├─ root.performance.watcher
│  └─ root.performance.state
└─ root.data
   ├─ root.data.variable
   └─ root.data.service
```

### Setting Hierarchical Log Levels

```typescript
// Set level for all loggers starting with 'root.component'
loggerService.setLogLevel('root.component', 'debug');

// Affects:
// - root.component
// - root.component.button
// - root.component.list
// - etc.

// Set level for entire hierarchy
loggerService.setLogLevel('root', 'warn');
```

### Benefits of Hierarchy

1. **Granular Control**: Enable debug for specific modules
2. **Organization**: Logical grouping of related logs
3. **Easy Filtering**: Filter by namespace
4. **Bulk Configuration**: Set levels for entire subtrees

---

## Built-in Loggers

WaveMaker provides pre-configured loggers.

### ROOT_LOGGER

```typescript
export const ROOT_LOGGER = getLogger('root');

// Usage
ROOT_LOGGER.info('Application started');
ROOT_LOGGER.error('Critical error occurred');
```

### PERFORMANCE_LOGGER

For performance monitoring:

```typescript
export const PERFORMANCE_LOGGER = ROOT_LOGGER.extend('performance');

// Usage
const startTime = Date.now();
// ... operation ...
const duration = Date.now() - startTime;

PERFORMANCE_LOGGER.debug(() => `Operation took ${duration}ms`);
```

### RENDER_LOGGER

For render performance tracking:

```typescript
export const RENDER_LOGGER = PERFORMANCE_LOGGER.extend('render');

// Usage in BaseComponent
render() {
  const startTime = Date.now();
  const result = this.renderWidget(this.props);
  const duration = Date.now() - startTime;
  
  if (duration > 16) { // > 1 frame at 60fps
    RENDER_LOGGER.warn(
      `Slow render: ${this.constructor.name} took ${duration}ms`
    );
  }
  
  return result;
}
```

### Creating Custom Built-in Loggers

```typescript
// In your service/module
export const NETWORK_LOGGER = ROOT_LOGGER.extend('network');
export const API_LOGGER = NETWORK_LOGGER.extend('api');
export const WEBSOCKET_LOGGER = NETWORK_LOGGER.extend('websocket');

// Usage
API_LOGGER.info('API call started');
WEBSOCKET_LOGGER.debug('WebSocket message received');
```

---

## Logger Configuration

### Runtime Configuration

Set log levels at runtime:

```typescript
import loggerService from '@wavemaker/app-rn-runtime/core/logger';

// Set level for specific logger
loggerService.setLogLevel('root.component.button', 'debug');

// Set level for entire namespace
loggerService.setLogLevel('root.network', 'info');

// Set global level
loggerService.setLogLevel('root', 'warn');

// Reset to defaults
loggerService.reset(); // Sets all to 'error'
```

### Persistent Configuration

Logger levels are persisted to storage:

```typescript
class LoggerCollection {
  setLogLevel(name?: string, level?: string) {
    // ... set levels
    
    // Persist to storage
    StorageService.setItem(this.key, JSON.stringify(this.config));
  }

  init() {
    // Load from storage on app start
    StorageService.getItem(this.key).then((data) => {
      if (data) {
        this.config = JSON.parse(data as string);
        // Apply saved levels
        keys(this.config).forEach((k: string) => {
          this.loggerMap.get(k)?.setLevel(this.config[k].level);
        });
      }
    });
  }
}
```

**Flow**:
```
App Start
  └─→ loggerService.init()
      └─→ Load config from storage
          └─→ Apply saved log levels

User sets level
  └─→ loggerService.setLogLevel('logger', 'debug')
      └─→ Update logger level
      └─→ Save config to storage
          └─→ Persisted for next app launch
```

### Listing All Loggers

```typescript
// Get list of all registered loggers
const allLoggers = loggerService.list();

console.log('Registered loggers:');
allLoggers.forEach(name => {
  const logger = loggerService.get(name);
  console.log(`  - ${name}: level=${logger.level}`);
});

// Output:
// Registered loggers:
//   - root: level=error
//   - root.component: level=debug
//   - root.component.button: level=debug
//   - root.network: level=info
//   - ...
```

### Configuration UI

Create a debug menu for users:

```typescript
export default class DebugMenu extends BaseComponent {
  render() {
    const loggers = loggerService.list();
    
    return (
      <ScrollView>
        {loggers.map(name => (
          <View key={name}>
            <Text>{name}</Text>
            <Picker
              selectedValue={loggerService.get(name).level}
              onValueChange={(level) => {
                loggerService.setLogLevel(name, level);
                this.forceUpdate();
              }}>
              <Picker.Item label="Debug" value="debug" />
              <Picker.Item label="Info" value="info" />
              <Picker.Item label="Warn" value="warn" />
              <Picker.Item label="Error" value="error" />
            </Picker>
          </View>
        ))}
        
        <Button title="Reset All" onPress={() => {
          loggerService.reset();
          this.forceUpdate();
        }} />
      </ScrollView>
    );
  }
}
```

---

## Performance Tracing

### Trace-Enabled Style Checking

The `isNativeStyle` function includes traceEnabled parameter:

**File**: `src/core/utils.ts`

```typescript
export const isNativeStyle = (
  key: string,
  context: 'property' | 'path' = 'property',
  traceEnabled: boolean = true
): boolean => {
  const nativeStyleProperties = [
    'shadowOffset', 'shadowRadius', 'shadowColor', 'shadowOpacity',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    // ... more properties
  ];

  if (!traceEnabled) return true;

  if (context === 'path') {
    const parts = key.split('.');
    const property = parts[parts.length - 1];
    return nativeStyleProperties.includes(property);
  } else {
    return nativeStyleProperties.includes(key);
  }
};
```

**Usage**:
```typescript
// With tracing (validates property)
if (isNativeStyle('shadowOffset', 'property', true)) {
  // Apply shadow
}

// Without tracing (skip validation for performance)
if (isNativeStyle('shadowOffset', 'property', false)) {
  // Always true - skip validation
}
```

### Performance Timing

```typescript
export default class MyComponent extends BaseComponent {
  private perfLogger = PERFORMANCE_LOGGER.extend(this.constructor.name);

  async loadData() {
    const startTime = performance.now();
    
    try {
      const data = await this.fetchData();
      const duration = performance.now() - startTime;
      
      this.perfLogger.info(`loadData completed in ${duration.toFixed(2)}ms`);
      
      if (duration > 1000) {
        this.perfLogger.warn(
          `Slow data load: ${duration.toFixed(2)}ms exceeds threshold`
        );
      }
      
      return data;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.perfLogger.error(
        `loadData failed after ${duration.toFixed(2)}ms: ${error.message}`
      );
      throw error;
    }
  }
}
```

### Render Performance Monitoring

```typescript
export abstract class BaseComponent {
  private renderLogger = RENDER_LOGGER;

  render() {
    if (__DEV__) {
      const startTime = performance.now();
      const result = this._render();
      const duration = performance.now() - startTime;
      
      if (duration > 16) {
        this.renderLogger.warn(
          `${this.constructor.name}#${this.props.name || this.props.id} ` +
          `render took ${duration.toFixed(2)}ms (> 16ms frame budget)`
        );
      }
      
      return result;
    }
    
    return this._render();
  }

  private _render() {
    // Actual render logic
    return super.render();
  }
}
```

### Watcher Performance

```typescript
export class Watcher {
  private perfLogger = PERFORMANCE_LOGGER.extend('watcher');

  check() {
    const startTime = performance.now();
    
    this.expressions.forEach(expr => {
      const exprStart = performance.now();
      expr.check();
      const exprDuration = performance.now() - exprStart;
      
      if (exprDuration > 10) {
        this.perfLogger.warn(
          `Slow watch expression: ${exprDuration.toFixed(2)}ms`
        );
      }
    });
    
    this.children.forEach(c => c.check());
    
    const totalDuration = performance.now() - startTime;
    
    if (totalDuration > 50) {
      this.perfLogger.warn(
        `Slow watcher check: ${totalDuration.toFixed(2)}ms total`
      );
    }
  }
}
```

---

## Debugging Techniques

### Component Lifecycle Logging

```typescript
export default class MyComponent extends BaseComponent {
  private logger = loggerService.get('component.MyComponent');

  constructor(props: T) {
    super(props);
    this.logger.debug('Constructor called');
  }

  componentDidMount() {
    this.logger.debug('componentDidMount');
    super.componentDidMount();
  }

  componentDidUpdate(prevProps: T, prevState: S) {
    this.logger.debug(() => {
      const changedProps = Object.keys(this.props).filter(
        key => prevProps[key] !== this.props[key]
      );
      const changedState = Object.keys(this.state).filter(
        key => prevState[key] !== this.state[key]
      );
      
      return `componentDidUpdate:\n` +
        `  Props changed: ${changedProps.join(', ') || 'none'}\n` +
        `  State changed: ${changedState.join(', ') || 'none'}`;
    });
  }

  componentWillUnmount() {
    this.logger.debug('componentWillUnmount');
    super.componentWillUnmount();
  }
}
```

### Network Request Logging

```typescript
export default class DataService {
  private logger = loggerService.get('service.data');

  async fetchData(url: string) {
    const requestId = Math.random().toString(36).slice(2);
    
    this.logger.info(`[${requestId}] Request: GET ${url}`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch(url);
      const duration = Date.now() - startTime;
      
      this.logger.info(
        `[${requestId}] Response: ${response.status} (${duration}ms)`
      );
      
      const data = await response.json();
      
      this.logger.debug(() => 
        `[${requestId}] Data:\n${JSON.stringify(data, null, 2)}`
      );
      
      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error(
        `[${requestId}] Failed after ${duration}ms: ${error.message}`
      );
      
      throw error;
    }
  }
}
```

### State Change Logging

```typescript
export default class StatefulComponent extends BaseComponent {
  private logger = loggerService.get('component.StatefulComponent');

  updateState(newPartialState: S, callback?: () => void) {
    this.logger.debug(() => {
      const changes = Object.keys(newPartialState)
        .map(key => `${key}: ${this.state[key]} → ${newPartialState[key]}`)
        .join(', ');
      
      return `State update: ${changes}`;
    });
    
    super.updateState(newPartialState, callback);
  }
}
```

### Event Logging

```typescript
export default class EventComponent extends BaseComponent {
  private logger = loggerService.get('component.EventComponent');

  notify(event: string, args: any[], emitToParent = false) {
    this.logger.debug(() => 
      `notify: ${event} (emitToParent=${emitToParent})\n` +
      `  Args: ${JSON.stringify(args)}`
    );
    
    return super.notify(event, args, emitToParent);
  }

  subscribe(event: string, fn: Function) {
    this.logger.debug(`subscribe: ${event}`);
    return super.subscribe(event, fn);
  }
}
```

---

## Production Logging

### Recommended Levels

```typescript
// Development
loggerService.setLogLevel('root', 'debug');

// Staging
loggerService.setLogLevel('root', 'info');

// Production
loggerService.setLogLevel('root', 'error');

// Critical debugging in production (temporary)
loggerService.setLogLevel('root.component.problematicWidget', 'debug');
```

### Conditional Logging

```typescript
export default class MyComponent extends BaseComponent {
  private logger = loggerService.get('component.MyComponent');

  handleCriticalOperation() {
    // Always log errors
    try {
      this.performOperation();
    } catch (error) {
      // Error level - logged in production
      this.logger.error(`Operation failed: ${error.message}`);
      
      // Debug details - only in development
      this.logger.debug(() => `Stack trace:\n${error.stack}`);
    }
  }
}
```

### Performance Impact

```typescript
// Minimal impact - only evaluates when logging
logger.debug(() => expensiveOperation());

// High impact - always evaluates
logger.debug(expensiveOperation());
```

**Best practice**: Always use lazy evaluation for expensive operations.

---

## Best Practices

### DO

✓ **Use hierarchical logger names**:
```typescript
const logger = loggerService.get('module.submodule.component');
```

✓ **Use lazy evaluation for expensive operations**:
```typescript
logger.debug(() => JSON.stringify(largeObject));
```

✓ **Log at appropriate levels**:
```typescript
logger.debug('Detailed debugging info');
logger.info('Normal operations');
logger.warn('Unexpected but handled');
logger.error('Critical errors');
```

✓ **Include context in logs**:
```typescript
logger.info(`User ${userId} performed action ${actionName}`);
```

✓ **Use performance logging for slow operations**:
```typescript
if (duration > threshold) {
  perfLogger.warn(`Slow operation: ${duration}ms`);
}
```

✓ **Create module-specific loggers**:
```typescript
class MyService {
  private logger = loggerService.get('service.MyService');
}
```

### DON'T

✗ **Don't log sensitive data**:
```typescript
// BAD
logger.debug(`User password: ${password}`);

// GOOD
logger.debug('User authenticated successfully');
```

✗ **Don't use string concatenation for expensive operations**:
```typescript
// BAD
logger.debug('Data: ' + JSON.stringify(hugeObject));

// GOOD
logger.debug(() => 'Data: ' + JSON.stringify(hugeObject));
```

✗ **Don't log in hot paths without guards**:
```typescript
// BAD - logs on every render
render() {
  logger.debug('Rendering');
  return <View />;
}

// GOOD - only if debug enabled
render() {
  if (__DEV__ && logger.isEnabled('debug')) {
    logger.debug('Rendering');
  }
  return <View />;
}
```

✗ **Don't forget to namespace loggers**:
```typescript
// BAD
const logger = loggerService.get('logger');

// GOOD
const logger = loggerService.get('module.submodule.MyClass');
```

---

## Summary

The logging system provides:

- **Hierarchical Organization**: Namespace-based logger structure
- **Level Filtering**: Control verbosity (debug, info, warn, error)
- **Persistent Configuration**: Save log levels across app restarts
- **Lazy Evaluation**: Defer expensive operations until needed
- **Performance Tracing**: Monitor render times, watchers, operations
- **Production Ready**: Minimal overhead, conditional logging

Key features:
- Built-in loggers (ROOT, PERFORMANCE, RENDER)
- Runtime configuration
- Hierarchical level setting
- Storage-backed persistence
- Function-based lazy evaluation

Use logging effectively to:
- Debug during development
- Monitor performance
- Track production issues
- Analyze user behavior
- Identify bottlenecks

The logger system is essential for maintaining and troubleshooting WaveMaker React Native applications at scale.

