# Architecture Overview Diagrams

## Purpose

This document describes the key architecture diagrams for WaveMaker React Native. These diagrams provide visual representations of the system's structure, data flow, and component relationships.

## Diagram 1: High-Level System Architecture

### Description

Shows the complete WaveMaker React Native ecosystem from design to deployment.

### Components

```
┌──────────────────────────────────────────────────────────┐
│           WaveMaker Studio (Design Tool)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ • Visual Page Designer                              │  │
│  │ • Component Palette                                 │  │
│  │ • Property Inspector                                │  │
│  │ • Variable Designer                                 │  │
│  │ • Script Editor                                     │  │
│  │ • Theme Editor                                      │  │
│  └────────────────────────────────────────────────────┘  │
│                      │ Exports                            │
│                      ▼                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ WaveMaker Project Files                            │  │
│  │ • pages/*.html, *.css, *.js, *.json               │  │
│  │ • app.js, app.css, app.variables.json             │  │
│  │ • themes/*.less                                    │  │
│  │ • resources/ (images, fonts)                       │  │
│  │ • wm_rn_config.json                                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│        wavemaker-rn-codegen (Build Tool)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │ CLI Layer                                          │  │
│  │  └─ Command Parser & Orchestrator                 │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ AppGenerator                                       │  │
│  │  └─ Orchestrates entire generation                │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Transpilation Engine                               │  │
│  │  ├─ HTML → JSX Transpiler                         │  │
│  │  ├─ Widget Transformers (50+)                     │  │
│  │  ├─ Expression Transformer                        │  │
│  │  └─ Property Parser                               │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Theme Service                                      │  │
│  │  ├─ LESS Compiler                                 │  │
│  │  ├─ CSS Parser                                    │  │
│  │  └─ RN Style Generator                            │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Variable Transformer                               │  │
│  │  └─ Variable → React Hooks                        │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Template Engine (Handlebars)                      │  │
│  │  └─ Component/App Templates                       │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ ProjectService                                     │  │
│  │  └─ Read WM Project Files                         │  │
│  └────────────────────────────────────────────────────┘  │
│                      │ Generates                          │
│                      ▼                                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Generated React Native App                         │  │
│  │ • Complete Expo/RN project                         │  │
│  │ • Transpiled components                            │  │
│  │ • Compiled styles                                  │  │
│  │ • Transformed variables                            │  │
│  │ • App configuration                                │  │
│  │ • Dependencies (package.json)                      │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│         wavemaker-rn-runtime (Component Library)          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Component Layer (50+ Widgets)                      │  │
│  │  ├─ Basic (Button, Label, Icon, Picture)          │  │
│  │  ├─ Container (Panel, Tabs, Accordion)            │  │
│  │  ├─ Input (Text, Select, Date, Upload)            │  │
│  │  ├─ Data (List, Card, Form)                       │  │
│  │  ├─ Chart (Line, Bar, Pie, Donut)                 │  │
│  │  ├─ Navigation (Menu, Navbar, Popover)            │  │
│  │  ├─ Device (Camera, Barcode Scanner)              │  │
│  │  └─ Dialog (Alert, Confirm, Modal)                │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Core Infrastructure                                │  │
│  │  ├─ BaseComponent (Abstract base class)           │  │
│  │  ├─ PropsProvider (Property management)           │  │
│  │  ├─ EventNotifier (Event system)                  │  │
│  │  ├─ Theme System (Dynamic theming)                │  │
│  │  └─ Component Tree (Hierarchy management)         │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Service Layer                                      │  │
│  │  ├─ NavigationService                             │  │
│  │  ├─ ModalService                                  │  │
│  │  ├─ ToastService                                  │  │
│  │  ├─ SpinnerService                                │  │
│  │  ├─ SecurityService                               │  │
│  │  ├─ StorageService                                │  │
│  │  ├─ I18nService                                   │  │
│  │  └─ Device Services (Camera, Location, etc.)     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ Runtime System                                     │  │
│  │  ├─ App Component                                 │  │
│  │  ├─ Navigation Setup                              │  │
│  │  ├─ Fragment System (State management)            │  │
│  │  └─ Variable System (Reactive data)               │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              React Native / Expo                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │ • React Native Core                                │  │
│  │ • Expo SDK                                         │  │
│  │ • React Navigation                                 │  │
│  │ • Third-party Libraries                            │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                Target Platforms                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │    iOS      │  │   Android   │  │     Web     │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└──────────────────────────────────────────────────────────┘
```

### Key Flows

1. **Design Flow**: Studio → Export → Project Files
2. **Build Flow**: Project Files → Codegen → Generated App
3. **Runtime Flow**: Generated App → Runtime → React Native → Platform
4. **Development Iteration**: Modify → Incremental Build → Test

## Diagram 2: Data Flow

### Description

Shows how data flows through the system from user interaction to backend and back.

```
┌─────────────┐
│    User     │
│ Interaction │
└──────┬──────┘
       │ (1) Tap/Input
       ▼
┌─────────────────────┐
│  Widget Component   │
│  (e.g., WmButton)   │
└──────┬──────────────┘
       │ (2) Event Handler
       │     (onTap)
       ▼
┌─────────────────────┐
│   Page Script       │
│  or Event Handler   │
└──────┬──────────────┘
       │ (3) Variable Operation
       │     (invoke/setValue)
       ▼
┌─────────────────────┐
│     Variable        │
│ (Live/Service Var)  │
└──────┬──────────────┘
       │ (4) API Call
       ▼
┌─────────────────────┐
│  Backend Service    │
│  (REST API/DB)      │
└──────┬──────────────┘
       │ (5) Response
       ▼
┌─────────────────────┐
│     Variable        │
│  (dataValue updated)│
└──────┬──────────────┘
       │ (6) Data Binding
       │     (auto-update)
       ▼
┌─────────────────────┐
│  Widget Component   │
│  (Re-renders)       │
└──────┬──────────────┘
       │ (7) Display
       ▼
┌─────────────┐
│    User     │
│   Sees      │
│  Updated UI │
└─────────────┘
```

## Diagram 3: Component Hierarchy

### Description

Shows the component inheritance and composition structure.

```
                    ┌─────────────────┐
                    │ React.Component │
                    └────────┬────────┘
                             │ extends
                             ▼
                    ┌─────────────────┐
                    │  BaseComponent  │
                    │  (Abstract)     │
                    └────────┬────────┘
                             │ extends
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
    ┌───────────────┐ ┌───────────┐ ┌───────────────┐
    │ WmBasicWidget │ │WmContainer│ │  WmInputWidget│
    └───────┬───────┘ └─────┬─────┘ └───────┬───────┘
            │               │               │
    ┌───────┼───────┐       │       ┌───────┼────────┐
    │       │       │       │       │       │        │
    ▼       ▼       ▼       ▼       ▼       ▼        ▼
┌────────┐ ┌─────┐ ┌────┐ ┌────┐ ┌────┐ ┌──────┐ ┌──────┐
│WmButton│ │WmLabel│WmIcon│WmPanel│WmText│WmSelect│WmDate│
└────────┘ └─────┘ └────┘ └────┘ └────┘ └──────┘ └──────┘

Composition:
┌──────────┐
│  WmPage  │ Contains
└─────┬────┘
      │
      ├─► ┌───────────┐
      │   │ WmPanel   │ Contains
      │   └─────┬─────┘
      │         │
      │         ├─► ┌──────────┐
      │         │   │ WmButton │
      │         │   └──────────┘
      │         │
      │         └─► ┌─────────┐
      │             │ WmLabel │
      │             └─────────┘
      │
      └─► ┌──────────┐
          │  WmList  │ Contains
          └─────┬────┘
                │
                └─► ┌──────────────┐
                    │ List Template│
                    └──────────────┘
```

## Diagram 4: Build Process Flow

### Description

Detailed build pipeline from source to output.

```
Start Build
     │
     ▼
┌─────────────────────────┐
│ Read WM Project Files   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Parse & Analyze         │
│ • HTML → AST            │
│ • CSS → AST             │
│ • Variables → Objects   │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│ Transpile Markup        │
│ • Apply Transformers    │
│ • Convert to JSX        │
│ • Extract Dependencies  │
└──────────┬──────────────┘
           │
           ├─────────────────┐
           │                 │
           ▼                 ▼
┌──────────────────┐   ┌─────────────────┐
│ Transform Styles │   │Transform Variables│
│ • LESS → CSS     │   │ • Create Hooks  │
│ • CSS → RN       │   │ • Setup State   │
└────────┬─────────┘   └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    │
                    ▼
           ┌─────────────────────┐
           │ Generate Components │
           │ • .component.js     │
           │ • .style.js         │
           │ • .script.js        │
           │ • .variables.js     │
           └──────────┬──────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │ Generate App Files  │
           │ • App.js            │
           │ • bootstrap.js      │
           │ • app.variables.js  │
           └──────────┬──────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │ Optimize & Package  │
           │ • Remove unused     │
           │ • Merge package.json│
           │ • Prettify code     │
           └──────────┬──────────┘
                      │
                      ▼
              ┌────────────┐
              │ Complete   │
              │ React Native│
              │ App        │
              └────────────┘
```

## Diagram 5: Theme System

### Description

Theme compilation and application flow.

```
Theme Source (.less)
         │
         ▼
┌─────────────────────┐
│  LESS Compiler      │
│  • Process variables│
│  • Compile to CSS   │
└──────────┬──────────┘
           │
           ▼
    CSS Stylesheet
           │
           ▼
┌─────────────────────┐
│   CSS Parser        │
│   • Parse rules     │
│   • Build AST       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RN Style Generator  │
│ • Convert props     │
│ • Handle shortcuts  │
│ • Platform-specific │
└──────────┬──────────┘
           │
           ▼
  RN StyleSheet (styles.js)
           │
           ▼
┌─────────────────────┐
│   Theme Manager     │
│   (Runtime)         │
└──────────┬──────────┘
           │
           ├────────────┬────────────┐
           │            │            │
           ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │Component1│ │Component2│ │Component3│
    └──────────┘ └──────────┘ └──────────┘
           │            │            │
           └────────────┴────────────┘
                        │
                        ▼
                Styled Components
                   (Rendered)
```

## Diagram Usage

### For Developers
- Use Component Hierarchy to understand widget relationships
- Use Data Flow to understand how data moves through the app
- Use Build Process for understanding code generation

### For Architects
- Use High-Level Architecture for system understanding
- Use Theme System for styling architecture
- Use all diagrams for comprehensive system overview

### For DevOps
- Use Build Process for CI/CD pipeline understanding
- Use High-Level Architecture for deployment planning

## Creating Visual Diagrams

These textual representations can be converted to visual diagrams using:

1. **Draw.io / Diagrams.net** - Free diagramming tool
2. **Lucidchart** - Professional diagramming
3. **PlantUML** - Code-based diagrams
4. **Mermaid** - Markdown-based diagrams
5. **Microsoft Visio** - Enterprise diagramming

## Next Steps

- [Transpilation Flow](./transpilation-flow.md) - Detailed transpilation
- [Component Hierarchy](./component-hierarchy.md) - Component relationships
- [Build Process](./build-process.md) - Build details
- [Theme Compilation](./theme-compilation.md) - Theme compilation details

