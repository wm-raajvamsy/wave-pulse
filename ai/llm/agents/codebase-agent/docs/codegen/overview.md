# Code Generation Overview

## Introduction

The wavemaker-rn-codegen package transforms WaveMaker Studio projects into React Native applications through a sophisticated transpilation and code generation process.

## Key Capabilities

### 1. Markup Transpilation
Converts WaveMaker HTML markup to React Native JSX:

```html
<!-- WaveMaker markup -->
<wm-button caption="Submit" on-tap="submitForm($event)"></wm-button>

<!-- Transpiled to React Native -->
<WmButton 
  caption="Submit" 
  onTap={($event) => {submitForm($event);}}
  listener={fragment}
/>
```

### 2. Style Transformation
Transforms CSS/LESS styles to React Native StyleSheet:

```css
/* WaveMaker CSS */
.app-button {
  background-color: #007bff;
  padding: 10px 20px;
  border-radius: 5px;
}

/* Transpiled to RN */
{
  root: {
    backgroundColor: '#007bff',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 5
  }
}
```

### 3. Variable Transformation
Converts WaveMaker variables to React hooks/state:

```json
// WaveMaker variable
{
  "name": "userVar",
  "category": "wm.LiveVariable",
  "type": "User",
  "liveSource": "hrdb"
}

// Generated code
const userVar = useLiveVariable({
  name: 'userVar',
  type: 'User',
  liveSource: 'hrdb'
});
```

### 4. Complete App Scaffolding
Generates full React Native/Expo project structure with:
- App entry point (App.js)
- Page components
- Navigation setup
- Theme configuration
- Build configuration

## Transpilation Pipeline

```
Input: WaveMaker Project
  ├── pages/*.html, *.css, *.js, *.json
  ├── app.js, app.css, app.variables.json
  ├── themes/*.less
  ├── resources/
  └── wm_rn_config.json

       ↓ (Read by ProjectService)

Parse & Analyze
  ├── Parse HTML to AST
  ├── Parse CSS to AST
  ├── Parse variables JSON
  └── Identify dependencies

       ↓ (Transpilers)

Transform
  ├── HTML → JSX (Transpiler + Transformers)
  ├── CSS → RN Styles (ThemeService)
  ├── Variables → Hooks (VariableTransformer)
  └── Scripts → Components

       ↓ (AppGenerator)

Generate
  ├── Component files (.component.js, .style.js, .script.js, .variables.js)
  ├── App-level files (App.js, bootstrap.js, etc.)
  ├── Theme files
  └── Configuration files

       ↓ (Code Formatting & Optimization)

Output: React Native App
  ├── src/pages/
  ├── src/partials/
  ├── theme/
  ├── assets/
  ├── App.js
  ├── package.json
  └── Ready to run!
```

## Command-Line Interface

### Main Command: transpile

```bash
wm-rn-codegen transpile <src> <dest> [options]
```

**Arguments:**
- `<src>`: WaveMaker project path or URL
- `<dest>`: Output directory for generated app

**Options:**
- `--profile <name>`: Build profile (default, development, web-preview, expo-preview)
- `--page <name>`: Generate only specific page
- `--incrementalBuild`: Only regenerate modified files
- `--autoClean`: Clean destination before generation
- `--rnAppPath <path>`: Custom RN app template

**Examples:**

```bash
# Full build
wm-rn-codegen transpile ./my-wm-project ./generated-app

# Development build
wm-rn-codegen transpile ./my-wm-project ./generated-app --profile development

# Generate single page
wm-rn-codegen transpile ./my-wm-project ./generated-app --page Dashboard

# Incremental build
wm-rn-codegen transpile ./my-wm-project ./generated-app --incrementalBuild

# Web preview
wm-rn-codegen transpile ./my-wm-project ./generated-app --profile web-preview
```

### Theme Commands

```bash
# Generate new theme
wm-rn-codegen theme generate <name> [path]

# Compile theme
wm-rn-codegen theme compile [path]

# Update theme platform files
wm-rn-codegen theme update [path]
```

## Build Profiles

### default (Production Native)
```typescript
{
  targetPlatform: 'native',
  generateWeb: false,
  lazyloadPages: true,
  lazyloadPartials: true,
  copyResources: true,
  useLocalMetadata: false
}
```
- Production-ready native app
- Resources embedded
- Metadata from server

### development
```typescript
{
  targetPlatform: 'native',
  generateWeb: false,
  lazyloadPages: true,
  lazyloadPartials: true,
  copyResources: true,
  useLocalMetadata: true
}
```
- Development build
- Local metadata
- Faster iteration

### web-preview
```typescript
{
  targetPlatform: 'web',
  generateWeb: true,
  lazyloadPages: false,
  lazyloadPartials: false,
  copyResources: false,
  useLocalMetadata: true
}
```
- Web bundle generation
- Preview in browser
- No lazy loading

### expo-preview
```typescript
{
  targetPlatform: 'native',
  generateWeb: false,
  lazyloadPages: true,
  lazyloadPartials: true,
  copyResources: true,
  useLocalMetadata: true
}
```
- Expo Go compatible
- Quick device preview

## Generated Project Structure

```
generated-app/
├── App.js                          # Main app entry
├── app.json                        # Expo configuration
├── app.style.js                    # Global styles
├── app.theme.js                    # Theme loader
├── bootstrap.js                    # App initialization
├── package.json                    # Dependencies
├── babel.config.js                 # Babel config
├── wm_rn_config.json               # WM RN config
│
├── src/
│   ├── pages/                      # Page components
│   │   ├── Main/
│   │   │   ├── Main.component.js   # Component
│   │   │   ├── Main.script.js      # Page script
│   │   │   ├── Main.style.js       # Styles
│   │   │   └── Main.variables.js   # Variables
│   │   └── pages-config.js         # Page configuration
│   │
│   ├── partials/                   # Partial components
│   │   └── partial-config.js
│   │
│   ├── prefabs/                    # Prefab components
│   │
│   ├── app.variables.js            # App variables
│   ├── service-definitions.js      # API definitions
│   ├── device-operation-loader.js  # Device operations
│   ├── device-plugin-service.js    # Plugin services
│   ├── device-permission-service.js # Permissions
│   ├── plugin-provider.js          # Plugin provider
│   │
│   ├── extensions/
│   │   └── formatters.js           # Custom formatters
│   │
│   └── resolve/
│       ├── resource.resolver.js    # Resource loader
│       └── locale.resolver.js      # Locale loader
│
├── theme/                          # Compiled themes
│   └── native-mobile/
│       ├── android/
│       │   ├── styles.js
│       │   └── assets/
│       └── ios/
│           ├── styles.js
│           └── assets/
│
├── assets/                         # Resources
│   ├── resources/
│   ├── icon.png
│   └── splash.png
│
└── metadata/
    └── entities/                   # Entity metadata
        └── entity-provider.js
```

## Code Generation Features

### 1. Component Generation
Each page/partial/prefab generates 4 files:

```javascript
// PageName.component.js - Component definition
export default function PageNameComponent(props) {
  // Component logic
  return <View>{/* UI */}</View>;
}

// PageName.script.js - Page script
export default {
  onLoad() {
    // Page load logic
  }
}

// PageName.style.js - Styles
export default {
  root: { /* styles */ },
  text: { /* styles */ }
}

// PageName.variables.js - Variables
export const Variables = {
  myVar: createVariable({...})
}
```

### 2. Prefab Support
Nested prefabs are recursively generated:

```
App
  └── Page1
      ├── Prefab1
      │   └── NestedPrefab
      └── Prefab2
```

All prefabs automatically generated.

### 3. WMX Component Support
Custom components are compiled and integrated:

```javascript
// extensions/components/src/my-widget/index.js
export default function MyWidget(props) {
  return <View>{/* custom UI */}</View>;
}

// Automatically compiled and available as:
<WmxMyWidget {...props} />
```

### 4. Plugin Optimization
Unused device plugins automatically removed:

```javascript
// If WmCamera not used in app:
// - expo-camera removed from package.json
// - Camera operations removed
// - Permissions removed
// Result: Smaller bundle size
```

### 5. Incremental Builds
Only regenerate modified files:

```bash
# First build: 60 seconds
wm-rn-codegen transpile ./src ./dest

# Change one page
# Incremental build: 5 seconds
wm-rn-codegen transpile ./src ./dest --incrementalBuild
```

## Advanced Features

### Expression Transformation
Complex expressions are transformed:

```javascript
// WaveMaker expression
bind:"Users[0].name + ' (' + Users[0].email + ')'"

// Transformed to
{fragment.Users[0].name + ' (' + fragment.Users[0].email + ')'}
```

### Event Handler Transformation
Event handlers with parameters:

```html
<!-- WaveMaker -->
<wm-button on-tap="doSomething($event, $item, customArg)"></wm-button>

<!-- Transpiled -->
<WmButton onTap={($event, $item) => {doSomething($event, $item, customArg);}} />
```

### Conditional Class Transformation
```html
<!-- WaveMaker -->
<wm-label conditionalclass="active: isActive, disabled: !isEnabled"></wm-label>

<!-- Transpiled -->
<WmLabel classname={
  (isActive ? 'active' : '') + ' ' + (!isEnabled ? 'disabled' : '')
} />
```

## Error Handling

Code generation includes robust error handling:

```typescript
try {
  await generateApp();
} catch (error) {
  console.error('Generation failed:', error);
  
  // If web preview, show error page
  if (profile.generateWeb) {
    generateErrorPage(error);
  }
  
  throw error;
}
```

## Performance Metrics

Typical generation times:

| Operation | Time |
|-----------|------|
| Full build (10 pages) | 30-60s |
| Incremental (1 page changed) | 5-10s |
| Theme compilation | 5-10s |
| Web preview build | +20-30s |
| Package optimization | 2-5s |

## Next Steps

- [Transpilation Process](./transpilation-process.md) - Detailed transpilation
- [Transformers](./transformers.md) - Widget transformers
- [App Generator](./app-generator.md) - Generation API
- [Project Service](./project-service.md) - Project access
- [Profiles](./profiles.md) - Build profiles

