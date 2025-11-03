# App Agent - Detailed Documentation

## Overview

The **App Agent** is the expert on application architecture and the complete build flow in WaveMaker React Native. It understands how the entire app is generated, structured, and initialized.

## Domain Expertise

### Core Responsibilities

1. **App Generation Process**
   - Complete build flow
   - File generation orchestration
   - Dependency management
   - Build profiles

2. **App Structure**
   - Entry point (App.js)
   - Navigation setup
   - Page registration
   - Service initialization

3. **Build Profiles**
   - Development profile
   - Production profile
   - Web preview profile
   - Expo preview profile

4. **Configuration**
   - App configuration
   - Bootstrap process
   - Environment setup

## App Generation Flow

### Complete Build Pipeline

```
Studio Project Files
    ↓
┌─────────────────────────────────┐
│   Project Service               │
│   - Read project files          │
│   - Parse configurations        │
│   - Extract metadata            │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Transpilation                 │
│   - HTML → JSX                  │
│   - Bind expressions            │
│   - Style transformation        │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Variable Transformation       │
│   - Variable generation         │
│   - Service integration         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Theme Compilation             │
│   - CSS → RN StyleSheet         │
│   - Theme generation            │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Code Generation               │
│   - Pages                       │
│   - Partials                    │
│   - Services                    │
│   - Configuration files         │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Asset Processing              │
│   - Images                      │
│   - Fonts                       │
│   - Resources                   │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│   Final Project Structure       │
│   - App.js                      │
│   - bootstrap.js                │
│   - src/ (pages, services)      │
│   - package.json                │
└─────────────────────────────────┘
    ↓
React Native / Expo App
```

## App Generator

### Main Generator Class

**Location**: `wavemaker-rn-codegen/src/app.generator.ts`

```typescript
export class AppGenerator {
  private projectService: ProjectService;
  private profile: Profile;
  private rnConfig: any;
  
  constructor(projectPath: string, profile: Profile) {
    this.projectService = new ProjectService(projectPath);
    this.profile = profile;
  }
  
  /**
   * Main generation method
   */
  async generate(outputPath: string): Promise<void> {
    console.log('Starting app generation...');
    
    // 1. Initialize output directory
    await this.initializeOutputDirectory(outputPath);
    
    // 2. Generate pages
    await this.generatePages(outputPath);
    
    // 3. Generate partials
    await this.generatePartials(outputPath);
    
    // 4. Generate services
    await this.generateServices(outputPath);
    
    // 5. Generate app files
    await this.generateAppFiles(outputPath);
    
    // 6. Generate configuration
    await this.generateConfiguration(outputPath);
    
    // 7. Copy resources
    await this.copyResources(outputPath);
    
    // 8. Compile theme
    await this.compileTheme(outputPath);
    
    // 9. Generate package.json
    await this.generatePackageJson(outputPath);
    
    // 10. Install dependencies (if profile requires)
    if (this.profile.installDependencies) {
      await this.installDependencies(outputPath);
    }
    
    console.log('App generation complete!');
  }
  
  /**
   * Generate all pages
   */
  private async generatePages(outputPath: string): Promise<void> {
    const pages = await this.projectService.getPages();
    
    for (const page of pages) {
      await this.generatePage(page, outputPath);
    }
  }
  
  /**
   * Generate single page
   */
  private async generatePage(
    page: PageInfo,
    outputPath: string
  ): Promise<void> {
    console.log(`Generating page: ${page.name}`);
    
    // Read page files
    const markup = await fs.readFile(page.htmlPath, 'utf-8');
    const script = await fs.readFile(page.jsPath, 'utf-8');
    const variables = JSON.parse(await fs.readFile(page.variablesPath, 'utf-8'));
    
    // Transpile markup
    const transpiled = transpileMarkup(markup, this.rnConfig);
    
    // Transform variables
    const transformedVars = transformVariables(variables);
    
    // Extract methods from script
    const methods = extractMethods(script);
    
    // Build context
    const context = {
      pageName: page.name,
      markup: transpiled.markup,
      imports: transpiled.imports,
      variables: transformedVars,
      methods,
      partials: transpiled.partials,
      prefabs: transpiled.prefabs
    };
    
    // Generate component
    const component = COMPONENT_TEMPLATE(context);
    
    // Generate props
    const props = PROPS_TEMPLATE(context);
    
    // Generate styles
    const styles = STYLES_TEMPLATE(context);
    
    // Write files
    const pageDir = path.join(outputPath, `src/pages/${page.name}`);
    await fs.ensureDir(pageDir);
    await fs.writeFile(path.join(pageDir, `${page.name}.component.js`), component);
    await fs.writeFile(path.join(pageDir, `${page.name}.props.js`), props);
    await fs.writeFile(path.join(pageDir, `${page.name}.styles.js`), styles);
  }
  
  /**
   * Generate app-level files
   */
  private async generateAppFiles(outputPath: string): Promise<void> {
    // Generate App.js
    const appJs = APP_TEMPLATE({
      pages: await this.projectService.getPages(),
      landingPage: this.rnConfig.landingPage
    });
    await fs.writeFile(path.join(outputPath, 'App.js'), appJs);
    
    // Generate bootstrap.js
    const bootstrap = BOOTSTRAP_TEMPLATE({
      services: this.getRequiredServices(),
      config: this.rnConfig
    });
    await fs.writeFile(path.join(outputPath, 'bootstrap.js'), bootstrap);
    
    // Generate pages-config.js
    const pagesConfig = PAGES_CONFIG_TEMPLATE({
      pages: await this.projectService.getPages()
    });
    await fs.writeFile(path.join(outputPath, 'src/pages-config.js'), pagesConfig);
  }
}
```

## Generated App Structure

### Complete File Structure

```
generated-expo-app/
├── App.js                          # Main app entry point
├── bootstrap.js                    # App initialization
├── app.config.js                   # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── metro.config.js                 # Metro bundler config
│
├── assets/                         # App assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── src/
│   ├── pages-config.js            # Page registry
│   │
│   ├── pages/                     # All pages
│   │   ├── HomePage/
│   │   │   ├── HomePage.component.js
│   │   │   ├── HomePage.props.js
│   │   │   └── HomePage.styles.js
│   │   ├── ProfilePage/
│   │   └── [other pages...]
│   │
│   ├── partials/                  # Reusable partials
│   │   ├── Header/
│   │   └── Footer/
│   │
│   ├── services/                  # App services
│   │   └── UserService.js
│   │
│   └── extensions/                # Custom code
│       └── formatters.js
│
└── theme/                         # Theme files
    ├── theme.js                   # Compiled theme
    └── variables.js               # Theme variables
```

## Key Generated Files

### 1. App.js

```javascript
import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from '@wavemaker/app-rn-runtime/styles/theme';
import NavigationService from '@wavemaker/app-rn-runtime/core/navigation.service';

import { bootstrap } from './bootstrap';
import { PAGES_CONFIG } from './src/pages-config';
import THEME from './theme/theme';

const Stack = createStackNavigator();

export default class App extends React.Component {
  constructor(props) {
    super(props);
    
    // Initialize app
    bootstrap();
  }
  
  render() {
    return (
      <SafeAreaProvider>
        <ThemeProvider theme={THEME}>
          <NavigationContainer
            ref={(ref) => NavigationService.setNavigationRef(ref)}
          >
            <Stack.Navigator
              initialRouteName="HomePage"
              screenOptions={{ headerShown: false }}
            >
              {Object.keys(PAGES_CONFIG).map(pageName => (
                <Stack.Screen
                  key={pageName}
                  name={pageName}
                  component={PAGES_CONFIG[pageName].component()}
                />
              ))}
            </Stack.Navigator>
          </NavigationContainer>
        </ThemeProvider>
        <StatusBar barStyle="dark-content" />
      </SafeAreaProvider>
    );
  }
}
```

### 2. bootstrap.js

```javascript
import injector from '@wavemaker/app-rn-runtime/core/injector';
import NavigationService from '@wavemaker/app-rn-runtime/core/navigation.service';
import ModalService from '@wavemaker/app-rn-runtime/core/modal.service';
import ToastService from '@wavemaker/app-rn-runtime/core/toast.service';
import SpinnerService from '@wavemaker/app-rn-runtime/core/spinner.service';
import SecurityService from '@wavemaker/app-rn-runtime/core/security.service';
import StorageService from '@wavemaker/app-rn-runtime/core/storage.service';
import NetworkService from '@wavemaker/app-rn-runtime/core/network.service';
import I18nService from '@wavemaker/app-rn-runtime/core/i18n.service';

// Import app services
import UserService from './src/services/UserService';

export function bootstrap() {
  console.log('Bootstrapping app...');
  
  // Register runtime services
  injector.register('NavigationService', NavigationService);
  injector.register('ModalService', ModalService);
  injector.register('ToastService', ToastService);
  injector.register('SpinnerService', SpinnerService);
  injector.register('SecurityService', SecurityService);
  injector.register('StorageService', StorageService);
  injector.register('NetworkService', NetworkService);
  injector.register('I18nService', I18nService);
  
  // Register app services
  injector.register('UserService', new UserService());
  
  // Initialize services
  NetworkService.init();
  
  // Load configuration
  loadAppConfig();
  
  console.log('App bootstrapped successfully');
}

function loadAppConfig() {
  // Load app configuration
  const config = {
    apiUrl: 'https://api.example.com',
    appName: 'WaveMaker App',
    version: '1.0.0'
  };
  
  injector.register('AppConfig', config);
}
```

### 3. pages-config.js

```javascript
export const PAGES_CONFIG = {
  HomePage: {
    name: 'HomePage',
    component: () => require('./pages/HomePage/HomePage.component').default,
    params: {}
  },
  
  ProfilePage: {
    name: 'ProfilePage',
    component: () => require('./pages/ProfilePage/ProfilePage.component').default,
    params: {}
  },
  
  SettingsPage: {
    name: 'SettingsPage',
    component: () => require('./pages/SettingsPage/SettingsPage.component').default,
    params: {}
  }
};
```

## Build Profiles

### Profile Structure

```typescript
interface Profile {
  name: string;
  target: 'native' | 'web';
  mode: 'development' | 'production' | 'preview';
  installDependencies: boolean;
  copyResources: boolean;
  optimizeBuild: boolean;
  lazyLoading: boolean;
}
```

### 1. Development Profile

```typescript
export const DevelopmentProfile: Profile = {
  name: 'development',
  target: 'native',
  mode: 'development',
  installDependencies: true,
  copyResources: true,
  optimizeBuild: false,
  lazyLoading: false
};
```

### 2. Production Profile

```typescript
export const ProductionProfile: Profile = {
  name: 'production',
  target: 'native',
  mode: 'production',
  installDependencies: true,
  copyResources: true,
  optimizeBuild: true,
  lazyLoading: true
};
```

### 3. Web Preview Profile

```typescript
export const WebPreviewProfile: Profile = {
  name: 'web-preview',
  target: 'web',
  mode: 'development',
  installDependencies: false,
  copyResources: false,
  optimizeBuild: false,
  lazyLoading: false
};
```

## Incremental Build

### Incremental Builder

**Location**: `wavemaker-rn-codegen/src/increment-builder.ts`

```typescript
export class IncrementalBuilder {
  private changeTracker: Map<string, string>;
  
  constructor() {
    this.changeTracker = new Map();
  }
  
  /**
   * Check if file has changed
   */
  hasChanged(filePath: string): boolean {
    const currentHash = this.getFileHash(filePath);
    const previousHash = this.changeTracker.get(filePath);
    
    if (currentHash !== previousHash) {
      this.changeTracker.set(filePath, currentHash);
      return true;
    }
    
    return false;
  }
  
  /**
   * Build only changed files
   */
  async buildIncremental(
    projectPath: string,
    outputPath: string
  ): Promise<void> {
    const pages = await this.getPages(projectPath);
    
    for (const page of pages) {
      if (this.hasChanged(page.htmlPath) || this.hasChanged(page.jsPath)) {
        console.log(`Rebuilding ${page.name} (changed)`);
        await this.generatePage(page, outputPath);
      } else {
        console.log(`Skipping ${page.name} (unchanged)`);
      }
    }
  }
  
  private getFileHash(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex');
  }
}
```

## Agent Capabilities

### 1. Explain Build Flow

**Query**: "How is the app generated?"

**Response**: Complete explanation of the generation pipeline

### 2. App Structure

**Query**: "What is the generated app structure?"

**Response**: Complete file structure with explanations

### 3. Build Profiles

**Query**: "What are build profiles?"

**Response**: Explanation of all profiles and when to use them

### 4. Incremental Builds

**Query**: "How do incremental builds work?"

**Response**: Explanation of incremental build system

## Best Practices

### App Generation

1. **Profile Selection**: Choose appropriate profile for use case
2. **Incremental Builds**: Use incremental builds during development
3. **Clean Builds**: Perform clean builds before production
4. **Validation**: Validate generated app structure

### Performance

1. **Lazy Loading**: Enable for production builds
2. **Resource Optimization**: Optimize images and assets
3. **Bundle Size**: Monitor and minimize bundle size
4. **Caching**: Cache unchanged files in incremental builds

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Application Architecture & Build Flow

