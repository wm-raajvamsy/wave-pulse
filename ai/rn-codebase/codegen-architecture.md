# Code Generation Architecture

## Overview

The wavemaker-rn-codegen package (`@wavemaker/rn-codegen`) is a sophisticated transpilation and code generation system that transforms WaveMaker Studio projects into complete, runnable React Native applications. It handles markup transformation, style compilation, variable management, and project scaffolding.

## Architecture Layers

```
┌──────────────────────────────────────────────────────────┐
│                CLI Layer (index.ts)                       │
│        Command parsing and orchestration                  │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│           App Generator (app.generator.ts)                │
│     Main orchestration of all generation tasks            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ - generateApp()           │ - generateAppTheme()  │  │
│  │ - generatePagesAndPartials()                       │  │
│  │ - generateVariables()     │ - generateServiceDefs()│  │
│  │ - mergePackageJson()      │ - removeUnusedPlugins()│  │
│  └────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────┘
                     │
         ┌───────────┼──────────────┐
         │           │              │
         ▼           ▼              ▼
┌────────────┐  ┌───────────┐  ┌──────────────┐
│ Transpiler │  │  Theme    │  │   Variable   │
│  Engine    │  │  Service  │  │ Transformer  │
└────────────┘  └───────────┘  └──────────────┘
         │           │              │
         └───────────┼──────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│          Project Service (project.service.ts)             │
│          Reads WaveMaker project files                    │
└──────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│              WaveMaker Project Files                      │
│  (HTML, CSS, JS, JSON, LESS, Resources)                  │
└──────────────────────────────────────────────────────────┘
```

## Core Components

### 1. CLI Layer (`index.ts`)

Entry point for the code generator. Handles:

#### Commands

**transpile**: Main command to generate React Native app

```bash
wm-rn-codegen transpile <src> <dest> [options]
```

**Options:**
- `--profile`: Build profile (default, development, web-preview, expo-preview)
- `--autoClean`: Clean destination before generation
- `--page`: Generate only specific page
- `--incrementalBuild`: Only regenerate modified files

**theme**: Theme management commands

```bash
# Generate new theme
wm-rn-codegen theme generate <name> [path]

# Compile theme
wm-rn-codegen theme compile [path]

# Update theme platform files
wm-rn-codegen theme update [path]
```

#### Configuration Extraction

Extracts build configuration from environment variables:

```javascript
// From Maven command line
MAVEN_CMD_LINE_ARGS="-Dmobile.appId=com.app -Dmobile.serverUrl=https://api.com"

// Extracted to options
{
  appId: "com.app",
  serverUrl: "https://api.com"
}
```

### 2. App Generator (`app.generator.ts`)

Central orchestrator that manages the entire generation process.

#### Generation Pipeline

```typescript
class AppGenerator {
  generateApp(): Promise<void> {
    // 1. Copy project template
    fs.copySync(templatePath, destPath);
    
    // 2. Generate pages and partials
    await this.generatePagesAndPartials();
    
    // 3. Generate app-level files
    await this.generateAppScript();
    await this.generateAppStyles();
    await this.generateAppVariables();
    await this.generateAppConfig();
    
    // 4. Generate resources and themes
    await this.generateResourceResolver();
    await this.generateAppTheme();
    
    // 5. Generate metadata
    await this.generateEntityMetadata();
    await this.generateServiceDefs();
    
    // 6. Generate device operations
    await this.prepareDeviceOperationLoader();
    
    // 7. Package management
    await this.mergePackageJson();
    await this.checkWidgetUsageInComponentFiles();
    await this.removeUnusedPackages();
    
    // 8. Prettify and finalize
    await this.prettify();
  }
}
```

#### Key Methods

**generateComponent()**
Generates a page/partial/prefab component:

```typescript
async generateComponent(info: PageInfo, type: string, name: string) {
  // 1. Transpile markup to JSX
  const transpiledOutput = transpileMarkup({
    markup: info.markup,
    isPartOfPrefab: this.isPrefabApp,
    rnConfig: this.rnConfig
  });
  
  // 2. Transform variables
  const variables = this.prepareVariables(
    JSON.parse(info.variables), 
    type
  );
  
  // 3. Generate component files
  writeFile(`${dest}/${name}.component.js`, componentCode);
  writeFile(`${dest}/${name}.script.js`, scriptCode);
  writeFile(`${dest}/${name}.style.js`, styleCode);
  writeFile(`${dest}/${name}.variables.js`, variableCode);
  
  // 4. Process nested prefabs
  await Promise.all(
    transpiledOutput.prefabs.map(p => this.generatePrefabComponent(p))
  );
}
```

**mergePackageJson()**
Combines template package.json with project-specific dependencies:

```typescript
async mergePackageJson() {
  const template = readJSON('template/package.json');
  const config = await this.projectService.getRNConfig();
  
  // Merge dependencies
  packageJson.name = config.name;
  packageJson.version = config.version;
  
  // Add WMX components if present
  if (this.wmxComponents.length > 0) {
    packageJson.dependencies['@wavemaker/wmx-component'] = 'file:wmx-components';
  }
  
  // Apply overrides from project
  const override = await this.projectService.getPackageJSONOverride();
  merge(packageJson, override);
  
  writeJSON('package.json', packageJson);
}
```

**removeUnusedPackages()**
Optimizes bundle size by removing unused device plugins:

```typescript
async removeUnusedPackages() {
  // 1. Scan all generated files for widget usage
  const widgetImports = await this.getWidgetImports();
  
  // 2. Check device variables
  const deviceVariables = await this.getDeviceVariables();
  
  // 3. Scan JS files for direct imports
  this.scanJSFilesForImports();
  
  // 4. Determine which plugins are used
  const pluginsInApp = await this.getListOfPackagesUsedInGeneratedApp();
  
  // 5. Remove unused packages from package.json
  // Example: Remove expo-camera if WmCamera widget not used
  Object.entries(operationMap).forEach(([operation, config]) => {
    if (!pluginsInApp[operation] && config.removePlugin) {
      config.packages.forEach(pkg => {
        delete packageJson.dependencies[pkg];
      });
    }
  });
}
```

### 3. Transpiler Engine (`transpile/transpile.ts`)

Converts WaveMaker HTML markup to React Native JSX.

#### Transpilation Process

```typescript
class Transpiler {
  transpile(element: HTMLElement): TranspiledOutput {
    // 1. Pre-process markup
    this.preTranspile(element);
    
    // 2. Get transformer for tag
    const transformer = this.transformers.get(element.tagName);
    
    // 3. Generate imports
    result.imports.push(...transformer.imports(element, context));
    
    // 4. Generate opening tag
    result.markup += transformer.pre(element, context);
    
    // 5. Recursively process children
    element.childNodes.forEach(child => {
      const childResult = this.transpile(child);
      result.markup += childResult.markup;
      result.imports.push(...childResult.imports);
    });
    
    // 6. Generate closing tag
    result.markup += transformer.post(element, context);
    
    // 7. Extract referenced prefabs/partials
    result.prefabs.push(...transformer.prefabs(element, context));
    result.partials.push(...transformer.partials(element, context));
    
    return result;
  }
}
```

#### Pre-Transpilation

Normalizes markup before transformation:

```typescript
preTranspile(element: HTMLElement) {
  // 1. Transform event handlers
  // on-click="doSomething()" → onTap={() => {doSomething();}}
  
  // 2. Transform data bindings
  // bind:caption="Users[0].name" → {fragment.Users[0].name}
  
  // 3. Normalize widget types
  // <wm-checkbox type="toggle"> → <wm-toggle>
  // <wm-chart type="Line"> → <wm-line-chart>
  
  // 4. Handle page scroll behavior
  if (element.tagName === 'wm-page') {
    this.transpileForPageScroll(element);
  }
  
  // Recurse to children
  element.childNodes.forEach(child => this.preTranspile(child));
}
```

#### Attribute Transformation

```typescript
transformAttrs(element: HTMLElement, context: TranspilationContext) {
  // 1. Transform styles
  const {styles, classname} = this.transformStyles(element, context);
  
  // 2. Transform each attribute
  Object.keys(element.attributes).forEach(name => {
    let value = element.attributes[name];
    
    if (name.startsWith('on-')) {
      // Event handler: on-tap="handler($event)"
      name = 'onTap';
      value = `{($event) => {${value}}}`;
    }
    else if (value.startsWith('bind:')) {
      // Data binding: bind:caption="variable"
      value = `{${value.substring(5)}}`;
    }
    else {
      // Static value: caption="Hello"
      value = `"${value}"`;
    }
    
    element.setAttribute(name, value);
  });
  
  return attributes;
}
```

#### Style Transformation

```typescript
transformStyles(element: HTMLElement, context: TranspilationContext) {
  // 1. Parse style attributes (width, height, color, etc.)
  const styleObj = transformStyleAttrs(element);
  
  // 2. Handle dynamic styles
  Object.keys(styleObj).forEach(key => {
    if (styleObj[key].startsWith('bind:')) {
      // Dynamic: width="bind:myWidth"
      styleObj[key] = `{watch(() => ${styleObj[key].substring(5)})}`;
    }
  });
  
  // 3. Handle conditional classes
  let classes = element.getAttribute('class');
  const conditionalClass = element.getAttribute('conditionalclass');
  
  if (conditionalClass) {
    // conditionalclass="active: isActive, disabled: !isEnabled"
    // → {'active ' + (isActive ? 'active' : '') + ' ' + (!isEnabled ? 'disabled' : '')}
    classes = this.parseConditionalClasses(conditionalClass, classes);
  }
  
  return {
    styles: JSON.stringify(styleObj),
    classname: classes
  };
}
```

### 4. Transformer Registry

Each widget type has a transformer that defines how it should be converted.

#### Transformer Interface

```typescript
interface Transformer {
  // Generate opening tag
  pre: (element: HTMLElement, context: TranspilationContext) => string;
  
  // Generate closing tag
  post: (element: HTMLElement, context: TranspilationContext) => string;
  
  // Required imports
  imports: (element: HTMLElement, context: TranspilationContext) => Import[];
  
  // Referenced partials
  partials?: (element: HTMLElement, context: TranspilationContext) => string[];
  
  // Referenced prefabs
  prefabs?: (element: HTMLElement, context: TranspilationContext) => string[];
  
  // Referenced WMX components
  xcomponents?: (element: HTMLElement, context: TranspilationContext) => string[];
  
  // Create inline component
  createComponent?: (element: HTMLElement, context: TranspilationContext) => any;
  
  // Check if property is a style property
  isStyleProperty?: (propName: string, element: HTMLElement, context: TranspilationContext) => boolean;
}
```

#### Example: Button Transformer

```typescript
// src/transpile/components/basic/button.transformer.ts
export default {
  pre: (element, context) => {
    const attrs = context.transformer.transformAttrs(element, context);
    return `<WmButton ${attrs}>`;
  },
  
  post: (element, context) => {
    return `</WmButton>`;
  },
  
  imports: (element, context) => {
    return [{
      name: 'WmButton',
      from: '@wavemaker/app-rn-runtime/components/basic/button'
    }];
  }
};
```

#### Complex Transformer: List

```typescript
export default {
  pre: (element, context) => {
    // Extract template markup
    const template = element.querySelector('wm-list-template');
    
    // Create render function
    const renderItemFn = context.transpiler.createComponent(template, context);
    
    return `<WmList 
      renderItem={${renderItemFn}}
      ${context.transformer.transformAttrs(element, context)}
    >`;
  },
  
  post: () => '</WmList>',
  
  imports: () => [{
    name: 'WmList',
    from: '@wavemaker/app-rn-runtime/components/data/list'
  }]
};
```

### 5. Theme Service (`theme/theme.service.ts`)

Handles theme compilation from LESS/CSS to React Native styles.

#### Theme Compilation Pipeline

```typescript
class ThemeService {
  async compile(themePath: string) {
    // 1. Read LESS files
    const lessContent = fs.readFileSync(`${themePath}/styles.less`);
    const variablesContent = fs.readFileSync(`${themePath}/variables.less`);
    
    // 2. Compile LESS to CSS
    const css = await less.render(lessContent);
    
    // 3. Parse CSS to AST
    const cssTree = cssParser.parse(css);
    
    // 4. Convert CSS to React Native styles
    const rnStyles = this.generateReactNativeStyles(cssTree);
    
    // 5. Write output
    fs.writeFileSync(`${themePath}/artifact/styles.js`, rnStyles);
    
    // 6. Generate web styles (for web preview)
    const webStyles = this.generateStudioStyles(cssTree);
    fs.writeFileSync(`${themePath}/artifact/styles.css`, webStyles);
  }
  
  generateReactNativeStyles(css: string): string {
    // 1. Parse CSS selectors
    const rules = this.parseCSSRules(css);
    
    // 2. Convert each rule
    const rnRules = rules.map(rule => {
      const className = rule.selector.replace('.', '');
      const styles = this.convertPropertiesToRN(rule.properties);
      
      return {
        [className]: styles
      };
    });
    
    // 3. Generate JavaScript module
    return `
      import { StyleSheet } from 'react-native';
      
      export default StyleSheet.create({
        ${JSON.stringify(rnRules, null, 2)}
      });
    `;
  }
}
```

#### CSS to React Native Conversion

```typescript
convertPropertiesToRN(properties: CSSProperties): RNStyle {
  const rnStyle = {};
  
  for (const [prop, value] of Object.entries(properties)) {
    // Convert property names
    // background-color → backgroundColor
    const rnProp = this.camelCase(prop);
    
    // Convert values
    if (prop === 'background-image') {
      rnStyle.backgroundImage = this.parseImageUrl(value);
    }
    else if (prop.includes('margin') || prop.includes('padding')) {
      // Handle shorthand: "10px 20px" → {top: 10, right: 20, bottom: 10, left: 20}
      Object.assign(rnStyle, this.parseBoxModel(prop, value));
    }
    else if (value.endsWith('px')) {
      rnStyle[rnProp] = parseFloat(value);
    }
    else if (value.endsWith('rem') || value.endsWith('em')) {
      rnStyle[rnProp] = this.convertRelativeUnit(value);
    }
    else {
      rnStyle[rnProp] = value;
    }
  }
  
  return rnStyle;
}
```

### 6. Variable Transformer (`variables/variable.transformer.ts`)

Converts WaveMaker variable definitions to React state/hooks.

```typescript
function transformVariable(variableJSON: any, scope: string, appUrl: string) {
  const type = variableJSON.category;
  
  if (type === 'wm.Variable') {
    return transformDataVariable(variableJSON);
  }
  else if (type === 'wm.LiveVariable') {
    return transformLiveVariable(variableJSON, appUrl);
  }
  else if (type === 'wm.ServiceVariable') {
    return transformServiceVariable(variableJSON, appUrl);
  }
  else if (type === 'wm.DeviceVariable') {
    return transformDeviceVariable(variableJSON);
  }
  else if (type === 'wm.TimerVariable') {
    return transformTimerVariable(variableJSON);
  }
  
  return null;
}
```

### 7. Project Service (`project.service.ts`)

Abstracts access to WaveMaker project files.

```typescript
class ProjectService {
  constructor(public path: string) {}
  
  // Read project files
  async getAppJs(): Promise<string>;
  async getAppCss(): Promise<string>;
  async getAppVariables(): Promise<any>;
  async getRNConfig(): Promise<string>;
  
  // Read page files
  async getPageConfigs(): Promise<PageConfig[]>;
  async getPageInfo(pageName: string): Promise<PageInfo>;
  
  // Read prefabs
  async getPrefabs(): Promise<string[]>;
  async getPrefabInfo(prefabName: string): Promise<PrefabInfo>;
  
  // Read themes
  async getThemes(): Promise<string[]>;
  
  // Read resources
  async getResources(): Promise<string>;
  async getFontConfig(): Promise<string>;
}
```

## Build Profiles

Different profiles for different use cases:

```typescript
// profiles/profile.ts
interface Profile {
  targetPlatform: 'native' | 'web';
  generateWeb: boolean;
  lazyloadPages: boolean;
  lazyloadPartials: boolean;
  copyResources: boolean;
  useLocalMetadata: boolean;
  packageLockFilePath?: string;
}

// profiles/development.profile.ts
export default {
  targetPlatform: 'native',
  generateWeb: false,
  lazyloadPages: true,
  lazyloadPartials: true,
  copyResources: true,
  useLocalMetadata: true
};
```

## Incremental Builds

Tracks file modifications for faster rebuilds:

```typescript
class IncrementalBuilder {
  constructor(srcPath: string, lastBuildTime: number) {
    this.lastBuildTime = lastBuildTime;
    this.trackModifications(srcPath);
  }
  
  isFragmentModified(name: string): boolean {
    return this.modifiedFragments.has(name);
  }
  
  isPrefabModified(name?: string): boolean {
    return this.modifiedPrefabs.has(name);
  }
  
  isResourceModified(): boolean {
    return this.resourcesModified;
  }
}
```

## Template System

Uses Handlebars for code templates:

```handlebars
{{!-- templates/component/component.template --}}
import React, { useState } from 'react';
{{#each eagerImports}}
import {{name}} from '{{from}}';
{{/each}}

export default function {{name}}Component(props) {
  const [state, setState] = useState({});
  
  // Variables
  const Variables = {
    {{#each startUpVariables}}
    {{this}}: use{{this}}(),
    {{/each}}
  };
  
  return (
    {{{markup}}}
  );
}
```

## Output Structure

Generated project structure:

```
generated-app/
├── App.js                      # Main app entry
├── app.json                    # Expo configuration
├── app.style.js                # Global styles
├── app.theme.js                # Theme loader
├── bootstrap.js                # App initialization
├── package.json                # Dependencies
├── src/
│   ├── pages/                  # Page components
│   │   ├── Main/
│   │   │   ├── Main.component.js
│   │   │   ├── Main.script.js
│   │   │   ├── Main.style.js
│   │   │   └── Main.variables.js
│   │   └── pages-config.js
│   ├── partials/               # Partial components
│   │   └── partial-config.js
│   ├── prefabs/                # Prefab components
│   ├── app.variables.js        # App variables
│   ├── service-definitions.js  # API definitions
│   └── device-operation-loader.js
├── theme/                      # Compiled themes
├── assets/                     # Resources
└── metadata/                   # Entity metadata
```

## Next Steps

- [Build Flow](./build-flow.md) - Complete build process
- [Transpilation Process](../codegen/transpilation-process.md) - Detailed transpilation
- [Transformers](../codegen/transformers.md) - Widget transformers

