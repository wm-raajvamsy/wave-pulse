# System Overview

## Introduction

WaveMaker React Native is a comprehensive platform for building cross-platform mobile applications from WaveMaker Studio projects. The platform consists of two primary components that work together to transform visual designs into fully functional React Native applications.

## Core Components

### 1. wavemaker-rn-runtime (`@wavemaker/app-rn-runtime`)

A React Native component library and runtime infrastructure that provides:

- **50+ Pre-built UI Widgets**: Complete set of mobile-ready components
- **Runtime Services**: Navigation, security, storage, device integration
- **Theming System**: Dynamic theme switching and styling
- **Data Binding**: Two-way data binding with variables
- **Platform Abstraction**: Unified API for iOS, Android, and Web

**Key Features:**
- Component-based architecture extending from `BaseComponent`
- Service injection via dependency injection container
- Theme-aware styling with CSS-like syntax
- Animation support via React Native Animatable
- Accessibility features and screen reader support

### 2. wavemaker-rn-codegen (`@wavemaker/rn-codegen`)

A code generation tool that transpiles WaveMaker projects into React Native applications:

- **Markup Transpilation**: Converts WaveMaker HTML markup to React Native JSX
- **App Generation**: Creates complete Expo/React Native project structure
- **Theme Compilation**: Transforms CSS/LESS to React Native styles
- **Variable Transformation**: Converts WaveMaker variables to React hooks/state
- **Incremental Builds**: Smart rebuilding of only modified components
- **Multi-profile Support**: Different build targets (native, web, preview)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WaveMaker Studio                          │
│  (Visual Design Tool - Produces HTML/CSS/JS/JSON)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Export/Build
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              wavemaker-rn-codegen                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │  1. Project Service (Read WM Project Files)        │    │
│  │  2. Transpilers (HTML → JSX Transformation)        │    │
│  │  3. Theme Service (CSS → RN Styles)                │    │
│  │  4. App Generator (Generate Complete App)          │    │
│  │  5. Template Engine (Handlebars)                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Generates
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            Generated React Native App                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │  - App.js (Entry point)                            │    │
│  │  - src/pages/*.component.js (Page components)      │    │
│  │  - src/partials/*.component.js (Partials)          │    │
│  │  - app.style.js (Global styles)                    │    │
│  │  - app.variables.js (App-level variables)          │    │
│  │  - theme/ (Theme files)                            │    │
│  │  - bootstrap.js (App configuration)                │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Uses at Runtime
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            wavemaker-rn-runtime                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Components:                                        │    │
│  │  - Basic (Button, Label, Icon, etc.)               │    │
│  │  - Container (Panel, Tabs, Accordion, etc.)        │    │
│  │  - Input (Text, Select, Date, etc.)                │    │
│  │  - Data (List, Card, Form, etc.)                   │    │
│  │  - Chart (Line, Bar, Pie, etc.)                    │    │
│  │  - Navigation (Menu, Navbar, etc.)                 │    │
│  │  - Device (Camera, Barcode Scanner, etc.)          │    │
│  │                                                      │    │
│  │  Services:                                          │    │
│  │  - Navigation, Modal, Toast, Spinner               │    │
│  │  - Security, Storage, Network                      │    │
│  │  - i18n, Theme, Device Services                    │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ Runs on
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              React Native / Expo                             │
│                 iOS / Android / Web                          │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Design Time (Code Generation)

1. **Input**: WaveMaker project files
   - Pages (HTML, CSS, JS, Variables JSON)
   - App configuration (wm_rn_config.json)
   - Themes (LESS files)
   - Resources (images, fonts, icons)

2. **Processing**: 
   - Parse HTML markup and transform to JSX using transformers
   - Convert CSS/LESS styles to React Native StyleSheet
   - Transform variables to React state/hooks
   - Generate component files from templates
   - Compile themes
   - Optimize and bundle resources

3. **Output**: Complete React Native/Expo project
   - Runnable on iOS, Android, or Web
   - Contains all transpiled components
   - Includes runtime dependencies

### Runtime (Application Execution)

1. **App Initialization**:
   - Load configuration from `wm_rn_config.json`
   - Initialize services (navigation, security, storage, etc.)
   - Load theme and apply styles
   - Setup navigation structure

2. **Page Rendering**:
   - Load page component
   - Initialize page variables
   - Execute startup actions
   - Render widget tree
   - Bind data to variables

3. **User Interaction**:
   - Handle events (tap, swipe, etc.)
   - Update variable values
   - Trigger actions
   - Navigate between pages
   - Call backend services

4. **Data Management**:
   - Variable lifecycle management
   - Backend API calls via axios
   - Local storage via AsyncStorage
   - State synchronization

## Key Technologies

### Runtime Dependencies

- **React Native**: Core mobile framework (v0.81+)
- **Expo**: Development and deployment platform
- **React Navigation**: Navigation management
- **React Native Paper**: Material Design components
- **Axios**: HTTP client
- **Moment**: Date/time manipulation
- **Lodash**: Utility functions
- **Victory Native**: Charts
- **Lottie**: Animations

### Codegen Dependencies

- **TypeScript**: Type-safe code generation
- **Babel**: JavaScript parsing and transformation
- **Handlebars**: Template engine
- **Node HTML Parser**: HTML parsing
- **CSS Tree**: CSS parsing
- **LESS**: Style preprocessing
- **Puppeteer**: Style computation
- **Prettier**: Code formatting

## Project Structure

### wavemaker-rn-runtime

```
wavemaker-rn-runtime/
├── src/
│   ├── components/           # All UI widgets
│   │   ├── basic/           # Button, Label, Icon, etc.
│   │   ├── container/       # Panel, Tabs, Accordion, etc.
│   │   ├── input/           # Text, Select, Date, etc.
│   │   ├── data/            # List, Card, Form, etc.
│   │   ├── chart/           # Line, Bar, Pie, etc.
│   │   ├── navigation/      # Menu, Navbar, Popover, etc.
│   │   ├── device/          # Camera, Barcode Scanner, etc.
│   │   └── page/            # Page, Partial containers
│   ├── core/                # Core infrastructure
│   │   ├── base.component.tsx    # Base widget class
│   │   ├── injector.ts           # DI container
│   │   ├── services/             # Runtime services
│   │   └── utils/                # Utilities
│   ├── runtime/             # App-level components
│   │   ├── App.tsx              # Main app component
│   │   ├── App.navigator.tsx    # Navigation setup
│   │   └── services/            # App services
│   ├── styles/              # Styling system
│   │   ├── theme.ts            # Theme management
│   │   └── style-props.ts      # Style utilities
│   ├── variables/           # Variable system
│   └── actions/             # Action handlers
├── lib/                     # Compiled output
└── test/                    # Unit tests
```

### wavemaker-rn-codegen

```
wavemaker-rn-codegen/
├── src/
│   ├── app.generator.ts          # Main app generation logic
│   ├── project.service.ts        # Read WM project files
│   ├── transpile/                # Transpilation engine
│   │   ├── transpile.ts          # Core transpiler
│   │   ├── components/           # Widget transformers
│   │   ├── property/             # Property parsers
│   │   └── style/                # Style parsers
│   ├── theme/                    # Theme compilation
│   │   ├── theme.service.ts      # Theme compiler
│   │   ├── rn-stylesheet.transpiler.ts
│   │   └── components/           # Style definitions
│   ├── templates/                # Handlebars templates
│   │   ├── project/              # Project template
│   │   ├── component/            # Component templates
│   │   └── theme/                # Theme templates
│   ├── profiles/                 # Build profiles
│   ├── variables/                # Variable transformers
│   └── utils.ts                  # Utilities
└── build/                        # Compiled CLI
```

## Build Profiles

The codegen supports multiple build profiles for different use cases:

1. **default**: Production native app build (iOS/Android)
2. **development**: Development build with debugging enabled
3. **web-preview**: Web-optimized preview build
4. **expo-preview**: Expo Go compatible preview
5. **expo-web-preview**: Expo web preview
6. **skip-build**: Skip code generation (validation only)

Each profile configures:
- Target platform (native/web)
- Resource copying strategy
- Lazy loading behavior
- Bundle optimization
- Development features

## Integration Points

### With WaveMaker Studio

- Studio exports project files in a standard format
- Codegen reads from these exported files
- Generated app can connect back to WaveMaker backend
- Supports incremental builds for faster iteration

### With Backend Services

- Generated app includes service definitions
- REST API integration via variables
- Authentication and security integration
- WebSocket support for real-time features

### With Device Features

- Camera, Location, Contacts, Calendar
- File system access
- Secure storage
- Network information
- Push notifications (via Expo)

## Deployment Options

Generated applications can be deployed via:

1. **Expo Go**: Quick preview on physical devices
2. **EAS Build**: Expo Application Services for production builds
3. **Native Builds**: Traditional React Native builds
4. **Web Build**: Progressive Web App deployment

## Performance Considerations

### Code Generation

- Incremental builds minimize generation time
- Only modified components are regenerated
- Template caching for faster builds
- Parallel processing where possible

### Runtime Performance

- Lazy loading of pages and components
- Virtual scrolling for large lists
- Image optimization and lazy loading
- Theme memoization
- Debounced event handlers

## Security Features

- SSL Pinning support
- Secure storage for sensitive data
- Screen capture protection
- Access control integration
- Role-based widget visibility
- XSS protection in variable binding

## Extensibility

### Custom Components (WMX)

- Build custom widgets using React Native
- Register via `wmx.json` configuration
- Automatic integration in codegen
- Style definition support

### Prefabs

- Reusable component bundles
- Nested prefab support
- Dynamic property binding
- Independent lifecycle

### Plugins

- Expo plugin integration
- Native module support
- Custom device operations
- Conditional plugin inclusion

## Version Compatibility

- **React Native**: 0.81.4
- **Expo SDK**: 52.x
- **React**: 19.1.0
- **Node**: 18.x or higher
- **TypeScript**: 5.1.3

## Next Steps

- [Runtime Architecture](./runtime-architecture.md) - Deep dive into runtime system
- [Codegen Architecture](./codegen-architecture.md) - Understanding code generation
- [Build Flow](./build-flow.md) - Complete build process details

