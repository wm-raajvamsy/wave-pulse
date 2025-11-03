# WaveMaker React Native - Complete Documentation

## Welcome

This is the comprehensive technical documentation for the WaveMaker React Native platform, consisting of two primary projects:

- **wavemaker-rn-runtime** (`@wavemaker/app-rn-runtime`): React Native component library and runtime infrastructure
- **wavemaker-rn-codegen** (`@wavemaker/rn-codegen`): Code generation tool for transpiling WaveMaker projects

## Quick Start

- **New to WaveMaker RN?** Start with [System Overview](./architecture/system-overview.md)
- **Building apps?** See [Runtime Core Concepts](./runtime/core-concepts.md)
- **Extending the platform?** Check [BaseComponent API](./runtime/base-component.md)
- **Code generation?** Read [Codegen Overview](./codegen/overview.md)

## Documentation Structure

### 📐 Architecture

High-level system design and architecture.

- [System Overview](./architecture/system-overview.md) - Platform overview and key components
- [Runtime Architecture](./architecture/runtime-architecture.md) - Runtime system design
- [Codegen Architecture](./architecture/codegen-architecture.md) - Code generation architecture
- [Build Flow](./architecture/build-flow.md) - Complete build process

### ⚙️ Runtime Core

Core runtime infrastructure and concepts.

- [Core Concepts](./runtime/core-concepts.md) - Fundamental concepts and patterns
- [BaseComponent](./runtime/base-component.md) - Base component API reference
- [Component Lifecycle](./runtime/component-lifecycle.md) - Lifecycle hooks and management
- [Services](./runtime/services.md) - Service layer documentation
- [Navigation](./runtime/navigation.md) - Navigation system

### 🔬 Advanced Runtime Internals

Deep dive into internal mechanisms and optimizations.

- [Advanced Internals](./runtime/advanced-internals.md) - WmMemo, Watcher, State Updates, PropsProvider
- [Event System & Modals](./runtime/event-system-internals.md) - EventNotifier, subscriptions, modal architecture
- [Render Optimization](./runtime/render-optimization.md) - shouldComponentUpdate, memoization, render analysis
- [Data Binding Internals](./variables/data-binding-internals.md) - Watch expressions, change detection, performance
- [Fragment System](./runtime/fragment-internals.md) - Fragment architecture, hierarchy, lifecycle
- [Component Hierarchy](./runtime/component-hierarchy.md) - Parent-child relationships, tree traversal, coordination
- [Timeout Patterns](./runtime/timeout-patterns.md) - Debouncing, throttling, cleanup patterns
- [Cleanup Management](./runtime/cleanup-management.md) - Memory management, leak prevention, resource cleanup
- [Logging & Debugging](./runtime/logging-debugging.md) - Logger system, performance tracing, debugging techniques
- [Performance Profiling](./runtime/performance-profiling.md) - Profiling tools, optimization strategies, performance analysis
- [Proxy System](./runtime/proxy-system.md) - Proxy implementation, PropsProvider internals, performance impact

### 🧩 Components

Complete widget library (50+ components).

- [Overview](./components/overview.md) - All components at a glance
- [Basic Widgets](./components/basic-widgets.md) - Buttons, labels, icons, images
- [Container Widgets](./components/container-widgets.md) - Panels, tabs, accordions, grids
- [Input Widgets](./components/input-widgets.md) - Text, select, date, file inputs
- [Data Widgets](./components/data-widgets.md) - Lists, cards, forms
- [Chart Widgets](./components/chart-widgets.md) - Line, bar, pie, donut charts
- [Navigation Widgets](./components/navigation-widgets.md) - Menus, navbars, popovers
- [Device Widgets](./components/device-widgets.md) - Camera, barcode scanner
- [Dialog Widgets](./components/dialog-widgets.md) - Alerts, confirms, modals

### 🔄 Code Generation

Transpilation and code generation system.

- [Overview](./codegen/overview.md) - Code generation capabilities
- [Transpilation Process](./codegen/transpilation-process.md) - HTML to JSX transformation
- [Transformers](./codegen/transformers.md) - Widget-specific transformers
- [App Generator](./codegen/app-generator.md) - Main generation orchestrator
- [Project Service](./codegen/project-service.md) - Project file access
- [Profiles](./codegen/profiles.md) - Build profiles (native, web, preview)

### 🎨 Theming & Styling

Dynamic theming and styling system.

- [Theme System](./theming/theme-system.md) - Theme architecture and management
- [Styling Guide](./theming/styling-guide.md) - Complete styling reference
- [Style Definitions](./theming/style-definitions.md) - Component style definitions
- [Theme Compilation](./theming/theme-compilation.md) - LESS/CSS to RN compilation
- [CSS Support](./theming/css-support.md) - CSS variables, supported/unsupported properties, conversions

### 📊 Variables

Reactive state management system.

- [Variable System](./variables/variable-system.md) - Variable types and usage
- [Variable Types](./variables/variable-types.md) - Detailed type documentation
- [Variable Transformation](./variables/variable-transformation.md) - Code generation transformation

### 📱 Device Integration

Native device feature access.

- [Device Operations](./device-integration/device-operations.md) - Camera, location, contacts, etc.
- [Plugin Management](./device-integration/plugin-management.md) - Plugin system and optimization
- [Permissions](./device-integration/permissions.md) - Permission handling

### 🚀 Advanced Topics

Advanced features and customization.

- [Prefabs](./advanced/prefabs.md) - Reusable component bundles
- [WMX Components](./advanced/wmx-components.md) - Custom component development
- [Incremental Builds](./advanced/incremental-builds.md) - Fast iterative builds
- [Web Preview](./advanced/web-preview.md) - Web preview mode

### 📚 API Reference

Complete API documentation.

- [Runtime API](./api-reference/runtime-api.md) - Runtime API reference
- [Codegen API](./api-reference/codegen-api.md) - Code generation API
- [Component Props](./api-reference/component-props.md) - All component properties

### 📊 Architecture Diagrams

Visual architecture representations.

- [Architecture Overview](./diagrams/architecture-overview.md) - High-level architecture
- [Transpilation Flow](./diagrams/transpilation-flow.md) - Transpilation process flow
- [Component Hierarchy](./diagrams/component-hierarchy.md) - Component relationships
- [Build Process](./diagrams/build-process.md) - Complete build pipeline
- [Theme Compilation](./diagrams/theme-compilation.md) - Theme compilation flow

## Key Features

### Runtime Features

- **50+ Pre-built Components**: Complete widget library for mobile apps
- **Dynamic Theming**: Runtime theme switching with platform-specific styles
- **Service Layer**: Navigation, security, storage, device integration services
- **Two-Way Data Binding**: Reactive variable system
- **Multi-Platform**: Single codebase for iOS, Android, and Web
- **Accessibility**: Built-in screen reader and test ID support
- **Performance**: Lazy loading, virtual scrolling, memoization

### Code Generation Features

- **Smart Transpilation**: HTML to JSX with expression transformation
- **Style Compilation**: CSS/LESS to React Native StyleSheet
- **Variable Transformation**: WaveMaker variables to React hooks
- **Incremental Builds**: Only regenerate modified files
- **Plugin Optimization**: Remove unused device plugins
- **Multi-Profile**: Native, web, preview builds
- **Prefab Support**: Nested reusable components
- **WMX Integration**: Custom component compilation

## Technology Stack

### Runtime

- React Native 0.81.4
- Expo SDK 52.x
- React 19.1.0
- React Navigation 7.x
- TypeScript 5.1.3

### Codegen

- TypeScript 4.9.3
- Babel (parsing)
- Handlebars (templating)
- LESS (CSS preprocessing)
- Puppeteer (style computation)

## Project Structure

### wavemaker-rn-runtime

```
src/
├── components/       # 50+ UI widgets
├── core/            # Core infrastructure
├── runtime/         # App-level components
├── styles/          # Styling system
├── variables/       # Variable system
└── actions/         # Action handlers
```

### wavemaker-rn-codegen

```
src/
├── app.generator.ts    # Main generator
├── transpile/          # Transpilation engine
├── theme/              # Theme compilation
├── templates/          # Code templates
├── profiles/           # Build profiles
└── variables/          # Variable transformers
```

## Common Tasks

### For App Developers

1. **Understanding Components**
   - Start: [Components Overview](./components/overview.md)
   - Deep dive: Component-specific docs
   
2. **Working with Variables**
   - Start: [Variable System](./variables/variable-system.md)
   - Reference: [Variable Types](./variables/variable-types.md)
   
3. **Customizing Themes**
   - Start: [Theme System](./theming/theme-system.md)
   - Guide: [Styling Guide](./theming/styling-guide.md)

### For Platform Developers

1. **Creating Custom Widgets**
   - Start: [BaseComponent](./runtime/base-component.md)
   - Reference: [Component Lifecycle](./runtime/component-lifecycle.md)
   - Deep dive: [Advanced Internals](./runtime/advanced-internals.md)
   
2. **Extending Code Generation**
   - Start: [Codegen Architecture](./architecture/codegen-architecture.md)
   - Details: [Transformers](./codegen/transformers.md)
   
3. **Adding Device Features**
   - Start: [Device Operations](./device-integration/device-operations.md)
   - Guide: [Plugin Management](./device-integration/plugin-management.md)

4. **Performance Optimization**
   - Guide: [Render Optimization](./runtime/render-optimization.md)
   - Profiling: [Performance Profiling](./runtime/performance-profiling.md)
   - Patterns: [Timeout Patterns](./runtime/timeout-patterns.md)
   - Internals: [Data Binding](./variables/data-binding-internals.md)
   - Debugging: [Logging & Debugging](./runtime/logging-debugging.md)

### For Architects

1. **System Understanding**
   - Start: [System Overview](./architecture/system-overview.md)
   - Deep dive: All architecture docs
   
2. **Performance & Optimization**
   - Build: [Incremental Builds](./advanced/incremental-builds.md)
   - Runtime: Performance sections in component docs

## Version Information

- **Current Runtime Version**: 0.1.0
- **Current Codegen Version**: 1.0.0
- **React Native**: 0.81.4
- **Expo SDK**: 52.x
- **Node**: 18.x or higher

## Getting Help

### Documentation Issues

If you find issues in the documentation:
1. Check the relevant section for updates
2. Review the code in the repository
3. Contact the development team

### Code Issues

For runtime or codegen issues:
1. Check the relevant API documentation
2. Review examples in the docs
3. Debug using the logger system
4. Contact support

## Contributing

When contributing to the platform:

1. **Read Architecture Docs**: Understand system design
2. **Follow Patterns**: Use existing patterns and conventions
3. **Document Changes**: Update relevant documentation
4. **Add Tests**: Ensure code quality
5. **Update Examples**: Keep examples current

## Additional Resources

### External Documentation

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Related Projects

- WaveMaker Studio: Visual development environment
- WaveMaker Backend: Backend services
- WaveMaker CLI: Command-line tools

## Documentation Conventions

Throughout this documentation:

- **Code blocks**: Actual code examples
- **File paths**: Relative to project root
- **Interface definitions**: TypeScript interfaces
- **Component names**: PascalCase (e.g., WmButton)
- **Property names**: camelCase (e.g., caption, datavalue)
- **File names**: kebab-case (e.g., base-component.tsx)

## Quick Links

### Most Accessed Pages

1. [System Overview](./architecture/system-overview.md)
2. [BaseComponent API](./runtime/base-component.md)
3. [Components Overview](./components/overview.md)
4. [Variable System](./variables/variable-system.md)
5. [Theme System](./theming/theme-system.md)
6. [Codegen Overview](./codegen/overview.md)
7. [Build Flow](./architecture/build-flow.md)
8. [Services](./runtime/services.md)
9. [Advanced Internals](./runtime/advanced-internals.md) - NEW!
10. [Event System & Modals](./runtime/event-system-internals.md) - NEW!
11. [Component Hierarchy](./runtime/component-hierarchy.md) - NEW!
12. [Logging & Debugging](./runtime/logging-debugging.md) - NEW!
13. [Performance Profiling](./runtime/performance-profiling.md) - NEW!
14. [Proxy System](./runtime/proxy-system.md) - NEW!

### By Role

**Developers:**
- [Core Concepts](./runtime/core-concepts.md)
- [Components Overview](./components/overview.md)
- [Variable System](./variables/variable-system.md)

**Platform Engineers:**
- [Runtime Architecture](./architecture/runtime-architecture.md)
- [BaseComponent](./runtime/base-component.md)
- [Codegen Architecture](./architecture/codegen-architecture.md)
- [Advanced Internals](./runtime/advanced-internals.md) - NEW!
- [Render Optimization](./runtime/render-optimization.md) - NEW!
- [Event System](./runtime/event-system-internals.md) - NEW!
- [Component Hierarchy](./runtime/component-hierarchy.md) - NEW!
- [Logging & Debugging](./runtime/logging-debugging.md) - NEW!
- [Performance Profiling](./runtime/performance-profiling.md) - NEW!
- [Proxy System](./runtime/proxy-system.md) - NEW!

**Architects:**
- [System Overview](./architecture/system-overview.md)
- [Architecture Diagrams](./diagrams/architecture-overview.md)
- [Build Flow](./architecture/build-flow.md)

## Feedback

This documentation is continuously evolving. For suggestions or corrections, please contact the WaveMaker development team.

---

**Last Updated**: 2024  
**Documentation Version**: 1.0  
**Platform Version**: Runtime 0.1.0, Codegen 1.0.0

