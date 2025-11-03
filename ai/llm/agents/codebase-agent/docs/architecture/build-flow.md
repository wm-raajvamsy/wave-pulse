# Build Flow

## Overview

This document details the complete build process from a WaveMaker Studio project to a deployable React Native application. The build process involves multiple stages of transformation, compilation, and optimization.

## Build Command

```bash
wm-rn-codegen transpile <src> <dest> [options]
```

**Arguments:**
- `<src>`: Path to WaveMaker project or URL
- `<dest>`: Destination folder for generated app

**Options:**
- `--profile <name>`: Build profile (default: 'default')
- `--autoClean`: Clean destination before build
- `--page <name>`: Generate only specific page
- `--incrementalBuild`: Enable incremental builds
- `--rnAppPath <path>`: Custom RN app template path

## Complete Build Pipeline

```
┌─────────────────────────────────────────────────────────┐
│  1. Initialization                                       │
│     - Parse command arguments                           │
│     - Load build profile                                │
│     - Initialize services                               │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  2. Project Analysis                                     │
│     - Read WaveMaker project files                      │
│     - Parse page configurations                         │
│     - Identify prefabs and partials                     │
│     - Check for incremental build                       │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  3. Project Template Setup                               │
│     - Copy base React Native template                   │
│     - Initialize package.json                           │
│     - Setup folder structure                            │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  4. Page & Component Generation                          │
│     For each page/partial:                              │
│     - Transpile HTML → JSX                              │
│     - Transform variables                               │
│     - Generate component files                          │
│     - Process nested prefabs                            │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  5. App-Level Generation                                 │
│     - Generate App.js                                   │
│     - Generate bootstrap.js                             │
│     - Generate app.variables.js                         │
│     - Generate app.style.js                             │
│     - Generate app.config.json                          │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  6. Resource Processing                                  │
│     - Copy images and assets                            │
│     - Generate resource resolver                        │
│     - Process fonts                                     │
│     - Copy i18n files                                   │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  7. Theme Compilation                                    │
│     - Copy theme files                                  │
│     - Compile LESS to CSS                               │
│     - Convert CSS to RN styles                          │
│     - Generate theme loader                             │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  8. Device Integration                                   │
│     - Analyze device variable usage                     │
│     - Generate device operation loader                  │
│     - Setup plugin providers                            │
│     - Configure permissions                             │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  9. Package Optimization                                 │
│     - Scan for widget usage                             │
│     - Detect unused plugins                             │
│     - Remove unused dependencies                        │
│     - Merge custom plugins                              │
│     - Update package.json                               │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  10. Metadata Generation                                 │
│     - Generate entity metadata                          │
│     - Generate service definitions                      │
│     - Generate page config                              │
│     - Generate formatters                               │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  11. Code Formatting & Finalization                      │
│     - Run Prettier on generated files                   │
│     - Copy package-lock.json                            │
│     - Save build metadata                               │
└──────────────────────┬──────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────┐
│  12. Post-Build (Optional)                               │
│     - npm install (if dependencies changed)             │
│     - Generate web preview build                        │
│     - Run validation                                    │
└─────────────────────────────────────────────────────────┘
```

## Detailed Build Stages

### Stage 1: Initialization

```typescript
// 1.1 Parse CLI arguments
const args = yargs.argv;

// 1.2 Set build profile
if (args.profile === 'expo-preview') {
  setProfile(expoProfile);
} else if (args.profile === 'web-preview') {
  setProfile(webPreviewProfile);
}

// 1.3 Initialize services
registerTransformers();    // Register widget transformers
registerHelpers();         // Register Handlebars helpers
const projectService = getProjectService({ src: args.src });

// 1.4 Check incremental build
let incBuilder = undefined;
if (args.incrementalBuild && lastBuildData.exists) {
  incBuilder = new IncrementalBuilder(src, lastBuildData.time);
}
```

### Stage 2: Project Analysis

```typescript
// 2.1 Read project configuration
const rnConfig = await projectService.getRNConfig();
const pageConfigs = await projectService.getPageConfigs();
const prefabs = await projectService.getPrefabs();

// 2.2 Analyze dependencies
const appVariables = await projectService.getAppVariables();
const deviceVariables = extractDeviceVariables(appVariables);

// 2.3 Check what needs regeneration (incremental build)
if (incBuilder) {
  const modifiedPages = pageConfigs.filter(p => 
    incBuilder.isFragmentModified(p.name)
  );
  const modifiedPrefabs = prefabs.filter(p => 
    incBuilder.isPrefabModified(p)
  );
}
```

### Stage 3: Project Template Setup

```typescript
// 3.1 Copy base template (first build only)
if (!incBuilder) {
  fs.copySync(
    __dirname + '/templates/project',
    destPath
  );
}

// 3.2 Create folder structure
fs.mkdirpSync(`${destPath}/src/pages`);
fs.mkdirpSync(`${destPath}/src/partials`);
fs.mkdirpSync(`${destPath}/src/prefabs`);
fs.mkdirpSync(`${destPath}/theme`);
fs.mkdirpSync(`${destPath}/assets`);
fs.mkdirpSync(`${destPath}/metadata/entities`);
```

### Stage 4: Page & Component Generation

```typescript
// 4.1 For each page
for (const pageConfig of pageConfigs) {
  if (incBuilder && !incBuilder.isFragmentModified(pageConfig.name)) {
    continue; // Skip unchanged pages
  }
  
  // 4.2 Read page files
  const pageInfo = await projectService.getPageInfo(pageConfig.name);
  
  // 4.3 Transpile markup
  const transpiledOutput = transpileMarkup({
    markup: pageInfo.markup,
    isPartOfPrefab: false,
    rnConfig: rnConfig
  });
  
  // 4.4 Transform variables
  const variables = transformVariables(
    JSON.parse(pageInfo.variables),
    'Page'
  );
  
  // 4.5 Generate component files
  const componentCode = COMPONENT_TEMPLATE({
    name: pageConfig.name,
    type: 'PAGE',
    markup: transpiledOutput.markup,
    imports: transpiledOutput.imports,
    startUpVariables: extractStartupVars(variables),
    autoUpdateVariables: extractAutoUpdateVars(variables)
  });
  
  writeFile(
    `${destPath}/src/pages/${pageConfig.name}/${pageConfig.name}.component.js`,
    componentCode
  );
  
  // 4.6 Generate script file
  const scriptCode = SCRIPT_TEMPLATE({
    script: pageInfo.script
  });
  
  writeFile(
    `${destPath}/src/pages/${pageConfig.name}/${pageConfig.name}.script.js`,
    scriptCode
  );
  
  // 4.7 Generate style file
  const styles = transformStyle(pageInfo.styles);
  
  writeFile(
    `${destPath}/src/pages/${pageConfig.name}/${pageConfig.name}.style.js`,
    STYLE_TEMPLATE({ styles })
  );
  
  // 4.8 Generate variables file
  writeFile(
    `${destPath}/src/pages/${pageConfig.name}/${pageConfig.name}.variables.js`,
    VARIABLE_TEMPLATE({ variables })
  );
  
  // 4.9 Process nested prefabs
  for (const prefabName of transpiledOutput.prefabs) {
    await generatePrefabComponent(prefabName);
  }
}

// 4.10 Generate page config
const pageConfigCode = PAGE_CONFIG_TEMPLATE({
  pageConfigs: pageConfigs.filter(p => p.type === 'PAGE'),
  lazyload: profile.lazyloadPages
});

writeFile(`${destPath}/src/pages/pages-config.js`, pageConfigCode);
```

### Stage 5: App-Level Generation

```typescript
// 5.1 Generate App.js
const appCode = APP_TEMPLATE({
  script: await projectService.getAppJs(),
  startUpVariables: extractStartupVars(appVariables),
  autoUpdateVariables: extractAutoUpdateVars(appVariables),
  supportedLocales: getSupportedLocales(),
  animatedSplash: rnConfig.splash?.animationSrc ? true : false,
  sslPinning: rnConfig.sslPinning?.enabled ? rnConfig.sslPinning.domains : null,
  enableWavePulse: rnConfig.preferences.enableWavePulse
});

writeFile(`${destPath}/App.js`, appCode);

// 5.2 Generate bootstrap.js
const bootstrapCode = BOOTSTRAP_TEMPLATE({
  appUrl: appUrl,
  enableLogs: rnConfig.preferences.enableLogs,
  loader: rnConfig.loader || 'skeleton',
  prefabUsed: Object.keys(transpiledComponents.prefabs)
});

writeFile(`${destPath}/bootstrap.js`, bootstrapCode);

// 5.3 Generate app.variables.js
const appVariablesCode = prepareVariables(appVariables, 'App');
writeFile(`${destPath}/src/app.variables.js`, appVariablesCode);

// 5.4 Generate app.style.js
const appStyles = await projectService.getAppCss();
const transformedStyles = transformStyle(appStyles);
writeFile(`${destPath}/app.style.js`, STYLE_TEMPLATE({ styles: transformedStyles }));

// 5.5 Generate app.json (Expo config)
const appConfig = fs.readJsonSync(`${destPath}/app.json`);
appConfig.expo.name = rnConfig.name;
appConfig.expo.slug = rnConfig.name;
appConfig.expo.version = rnConfig.version;
appConfig.expo.android.package = rnConfig.id;
appConfig.expo.ios.bundleIdentifier = rnConfig.id;
appConfig.expo.icon = `./assets/${rnConfig.icon.src}`;
writeFile(`${destPath}/app.json`, JSON.stringify(appConfig, null, 2));

// 5.6 Generate wm_rn_config.json
writeFile(`${destPath}/wm_rn_config.json`, JSON.stringify(rnConfig, null, 4));

// 5.7 Generate babel.config.js
const babelConfig = BABEL_CONFIG_TEMPLATE({
  enableLogs: rnConfig.preferences.enableLogs,
  isWeb: profile.targetPlatform === 'web'
});
writeFile(`${destPath}/babel.config.js`, babelConfig);
```

### Stage 6: Resource Processing

```typescript
// 6.1 Copy resource files
const resourcesPath = await projectService.getResources();
if (resourcesPath) {
  fs.copySync(resourcesPath, `${destPath}/assets/resources`, {
    filter: (src) => {
      // Skip platform-specific files not needed
      if (profile.targetPlatform === 'web' && src.endsWith('.native.js')) {
        return false;
      }
      if (profile.targetPlatform === 'native' && src.endsWith('.web.js')) {
        return false;
      }
      return true;
    }
  });
}

// 6.2 Generate resource resolver
const resources = getAllResources(`${destPath}/assets/resources`);
const resourceResolverCode = RESOURCE_RESOLVER_TEMPLATE({
  resources: resources,
  path: '../../assets/'
});
writeFile(`${destPath}/src/resolve/resource.resolver.js`, resourceResolverCode);

// 6.3 Process fonts
const fontConfig = await projectService.getFontConfig();
writeFile(`${destPath}/font.config.js`, fontConfig);

// Generate icon font scripts
const fonts = parseFontConfig(fontConfig);
for (const font of fonts) {
  if (font.csspath) {
    await themeService.getIconFontScripts(
      `${destPath}/assets/${font.csspath}`
    );
  }
}

// 6.4 Copy i18n files (if web preview)
if (profile.useLocalMetadata) {
  const i18nPath = await projectService.geti18NFiles();
  if (i18nPath) {
    fs.copySync(i18nPath, `${destPath}/i18n`);
  }
  
  // Generate locale resolver
  const locales = getAllResources(`${destPath}/i18n`, 'i18n');
  const localeResolverCode = RESOURCE_RESOLVER_TEMPLATE({
    resources: locales,
    path: '../../'
  });
  writeFile(`${destPath}/src/resolve/locale.resolver.js`, localeResolverCode);
}
```

### Stage 7: Theme Compilation

```typescript
// 7.1 Get themes
const themes = await projectService.getThemes();

// 7.2 Copy and process each theme
for (const themePath of themes) {
  const themeName = path.basename(themePath);
  
  // Copy theme files
  fs.copySync(themePath, `${destPath}/theme/${themeName}`);
  
  // Generate asset resolvers for theme
  const themeAssets = getAllResources(
    `${destPath}/theme/${themeName}/android/assets`
  );
  
  const assetResolverCode = THEME_ASSET_RESOLVER_TEMPLATE({
    resources: themeAssets,
    path: './'
  });
  
  writeFile(
    `${destPath}/theme/${themeName}/android/asset.resolver.js`,
    assetResolverCode
  );
}

// 7.3 Generate theme loader
const selectedTheme = projectService.getSelectedTheme();
const themeLoaderCode = APP_THEME_TEMPLATE({
  themes: themes.map(t => path.basename(t)),
  selectedTheme: selectedTheme
});

writeFile(`${destPath}/app.theme.js`, themeLoaderCode);

// 7.4 Generate theme variables (if exists)
try {
  const themeVariables = await projectService.getAppThemeVariables();
  writeFile(`${destPath}/app.theme.variables.js`, themeVariables);
} catch (e) {
  // Theme variables are optional
}
```

### Stage 8: Device Integration

```typescript
// 8.1 Collect all device variables (app + pages)
const allDeviceVariables = [];

// App-level device variables
const appVars = await projectService.getAppVariables();
allDeviceVariables.push(...extractDeviceVariables(appVars));

// Page-level device variables
for (const pageConfig of pageConfigs) {
  const pageInfo = await projectService.getPageInfo(pageConfig.name);
  const pageVars = JSON.parse(pageInfo.variables);
  allDeviceVariables.push(...extractDeviceVariables(pageVars));
}

// 8.2 Map operations to plugins
const pluginOperationConfig = [];
allDeviceVariables.forEach(v => {
  const operation = operationMap[v.operation];
  pluginOperationConfig.push({
    operation: v.operation,
    service: operation.name,
    filename: operation.filename,
    method: operation.method,
    hasparams: operation.hasConstructorParams,
    type: operation.name
  });
});

// 8.3 Determine which plugins are actually used
const pluginsInApp = await getListOfPackagesUsedInGeneratedApp();

// 8.4 Generate device operation loader
const deviceLoaderCode = DEVICE_SERVICES_TEMPLATE({
  pluginOperationConfig: pluginOperationConfig,
  appVersion: rnConfig.version,
  expoCameraPlugin: pluginsInApp.hasCameraPlugin,
  scanPlugin: pluginsInApp.hasScanPlugin,
  locationPlugin: pluginsInApp.hasLocationPlugin,
  contactsPlugin: pluginsInApp.hasContactsPlugin,
  calendarPlugin: pluginsInApp.hasCalendarPlugin,
  fileUploadPlugin: pluginsInApp.hasUploadFilePlugin,
  audioPlugin: pluginsInApp.hasAudioPlugin,
  videoPlugin: pluginsInApp.hasVideoPlugin,
  openFilePlugin: pluginsInApp.hasOpenFilePlugin
});

writeFile(`${destPath}/src/device-operation-loader.js`, deviceLoaderCode);

// 8.5 Generate plugin service
const pluginServiceCode = DEVICE_PLUGIN_SERVICES_TEMPLATE({...pluginsInApp});
writeFile(`${destPath}/src/device-plugin-service.js`, pluginServiceCode);

// 8.6 Generate permission service
const permissionServiceCode = DEVICE_PERMISSION_SERVICE_TEMPLATE({...pluginsInApp});
writeFile(`${destPath}/src/device-permission-service.js`, permissionServiceCode);

// 8.7 Generate plugin provider
const pluginProviderCode = PLUGIN_PROVIDER_TEMPLATE({...pluginsInApp});
writeFile(`${destPath}/src/plugin-provider.js`, pluginProviderCode);
```

### Stage 9: Package Optimization

```typescript
// 9.1 Read base package.json
const packageJson = fs.readJsonSync(`${destPath}/package.json`);

// 9.2 Update app metadata
packageJson.name = rnConfig.name;
packageJson.version = rnConfig.version;
packageJson.description = rnConfig.description;

// 9.3 Add web dependencies if web build
if (profile.targetPlatform === 'web') {
  const webPackageJson = fs.readJsonSync(
    `${__dirname}/templates/package.web.json`
  );
  merge(packageJson, webPackageJson);
}

// 9.4 Add WMX components if present
if (wmxComponents.length > 0) {
  // Compile WMX component library
  await compileXComponentLib();
  
  // Add to dependencies
  packageJson.dependencies['@wavemaker/wmx-component'] = 'file:wmx-components';
  
  // Add postinstall script
  packageJson.scripts.postinstall = 'npm install ./wmx-components';
}

// 9.5 Scan for widget usage
const widgetImports = await getWidgetImports();

// 9.6 Scan JS files for direct plugin imports
scanJSFilesForImports();

// 9.7 Remove unused plugins
const dependencies = [...projectPackageDependencies];
const pluginsInApp = await getListOfPackagesUsedInGeneratedApp();

for (const dep of dependencies) {
  const isUsed = checkIfOperationIsUsed(dep, pluginsInApp, widgetImports);
  
  if (!isUsed && dep.removePlugin) {
    // Check if any package is imported in JS files
    const hasImportsInJS = dep.packages.some(pkg => 
      jsFileImports.has(pkg)
    );
    
    if (!hasImportsInJS) {
      // Remove unused packages
      dep.packages.forEach(pkg => {
        delete packageJson.dependencies[pkg];
        console.log(`Removed unused package: ${pkg}`);
      });
    }
  }
}

// 9.8 Add custom plugins from wm_rn_config.json
const customPlugins = rnConfig.plugins || [];
customPlugins.forEach(plugin => {
  if (plugin.spec) {
    packageJson.dependencies[plugin.name] = plugin.spec;
  }
});

// 9.9 Merge package.json overrides from project
const packageOverride = await projectService.getPackageJSONOverride();
if (packageOverride) {
  merge(packageJson, packageOverride);
}

// 9.10 Write final package.json
writeFile(`${destPath}/package.json`, JSON.stringify(packageJson, null, 4));

// 9.11 Install dependencies if changed
if (shouldNpmInstall) {
  await npmInstall(destPath);
}
```

### Stage 10: Metadata Generation

```typescript
// 10.1 Generate entity metadata
const liveSources = {};

liveVariables.forEach(lv => {
  const liveSource = lv.liveSource;
  const entityName = lv.type;
  
  if (!liveSources[liveSource]) {
    liveSources[liveSource] = {};
  }
  
  if (!liveSources[liveSource][entityName]) {
    liveSources[liveSource][entityName] = {
      propertiesMap: lv.propertiesMap,
      relatedTables: lv.relatedTables
    };
  }
});

// Write entity files
Object.keys(liveSources).forEach(liveSource => {
  writeFile(
    `${destPath}/metadata/entities/${liveSource}.json`,
    JSON.stringify(liveSources[liveSource], null, 4)
  );
});

// Generate entity provider
const entityProviderCode = ENTITY_PROVIDER_TEMPLATE({
  liveSources: Object.keys(liveSources)
});
writeFile(
  `${destPath}/metadata/entities/entity-provider.js`,
  entityProviderCode
);

// 10.2 Generate service definitions
const serviceDefs = await projectService.getServiceDefs();
const serviceDefsCode = SERVICE_DEFINITIONS({
  serviceDefs: JSON.stringify(serviceDefs)
});
writeFile(`${destPath}/src/service-definitions.js`, serviceDefsCode);

// 10.3 Generate formatters
const formattersScript = await projectService.getFormatters();
const formattersCode = FORMATTERS_TEMPLATE({
  script: formattersScript
});
writeFile(`${destPath}/src/extensions/formatters.js`, formattersCode);
```

### Stage 11: Code Formatting & Finalization

```typescript
// 11.1 Run Prettier on generated files
await prettify(`${destPath}/(src/**/*.js|App.js|app.style.js|bootstrap.js)`);

// 11.2 Copy package-lock.json (if exists)
if (!fs.existsSync(`${destPath}/package-lock.json`)) {
  if (profile.packageLockFilePath && fs.existsSync(profile.packageLockFilePath)) {
    fs.copySync(
      profile.packageLockFilePath,
      `${destPath}/package-lock.json`
    );
  }
}

// 11.3 Copy npm packages (if any)
await projectService.copyNpmPackages(destPath);

// 11.4 Handle screen capture protection plugin
await copyScreenCapturePluginIfNeeded();

// 11.5 Save build metadata
const buildData = {
  lastBuildTime: Date.now(),
  profile: args.profile,
  version: rnConfig.version
};
writeFile(`${destPath}/.build`, JSON.stringify(buildData));

console.log(`Code generated at ${destPath}`);
```

### Stage 12: Post-Build (Optional)

```typescript
// 12.1 If web preview profile
if (profile.generateWeb) {
  console.time('web preview build');
  
  // Prepare esbuild libraries
  await execa('node', ['./esbuild/esbuild.script.js', '--prepare-lib'], {
    cwd: destPath
  });
  
  // Build web bundle
  await execa('node', ['esbuild/esbuild.script.js'], {
    cwd: destPath
  });
  
  // Fix asset paths for relative serving
  const indexHtml = fs.readFileSync(`${destPath}/web-build/index.html`, 'utf-8');
  const fixedHtml = indexHtml.replace(/"/static/g, '"./static');
  fs.writeFileSync(`${destPath}/web-build/index.html`, fixedHtml);
  
  // Copy to source rn-bundle folder
  if (!src.startsWith('http')) {
    fs.copySync(`${destPath}/web-build`, `${src}/rn-bundle`);
  }
  
  console.timeEnd('web preview build');
}
```

## Build Profiles in Detail

### Default Profile (Native Production)

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

- Full native app build
- Lazy load pages and partials for performance
- Resources embedded in app
- Metadata fetched from server

### Development Profile

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

- Similar to default but with local metadata
- Faster development iteration
- No server required for metadata

### Web Preview Profile

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

- Generates web bundle using esbuild
- No lazy loading (web handles it differently)
- Resources loaded via URL
- Outputs to `/web-build` and `/rn-bundle`

### Expo Preview Profile

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

- Optimized for Expo Go
- Quick preview on devices
- Local metadata for offline work

## Incremental Build Process

When `--incrementalBuild` is enabled:

```typescript
// 1. Load previous build data
const buildData = fs.readJsonSync(`${destPath}/.build`);
const lastBuildTime = buildData.lastBuildTime;

// 2. Initialize incremental builder
const incBuilder = new IncrementalBuilder(src, lastBuildTime);

// 3. Check each file's modification time
incBuilder.trackModifications(src);

// 4. Only process modified files
if (incBuilder.isFragmentModified('Page1')) {
  await generatePageComponent('Page1');
} else {
  console.log('Page1 unchanged, skipping');
}

// 5. Update build timestamp
buildData.lastBuildTime = Date.now();
writeFile(`${destPath}/.build`, JSON.stringify(buildData));
```

**Tracks modifications for:**
- Pages and partials
- Prefabs
- App-level files (app.js, app.css, app.variables.json)
- Theme files
- Configuration (wm_rn_config.json)
- Resources
- Fonts
- i18n files
- WMX components

## Error Handling

```typescript
try {
  await generateApp();
} catch (error) {
  console.error('Build failed:', error);
  
  // If web preview, show error page
  if (profile.generateWeb) {
    fs.mkdirpSync(`${src}/rn-bundle`);
    fs.copyFileSync(
      `${buildInfo}/error.html`,
      `${src}/rn-bundle/index.html`
    );
  }
  
  throw error;
}
```

## Performance Metrics

Typical build times (on modern hardware):

- **Full build**: 30-60 seconds
- **Incremental build (1 page changed)**: 5-10 seconds
- **Incremental build (styles only)**: 2-3 seconds
- **Web preview build**: +20-30 seconds

## Build Outputs

### Generated App Structure

```
generated-app/
├── node_modules/          # Installed after npm install
├── .build                 # Build metadata for incremental builds
├── App.js                 # Main app entry (1 file)
├── app.json              # Expo config (1 file)
├── app.style.js          # Global styles (1 file)
├── app.theme.js          # Theme loader (1 file)
├── app.theme.variables.js # Theme variables (1 file, optional)
├── bootstrap.js          # App initialization (1 file)
├── font.config.js        # Font configuration (1 file)
├── package.json          # Dependencies (1 file)
├── babel.config.js       # Babel configuration (1 file)
├── wm_rn_config.json     # WaveMaker RN config (1 file)
├── src/
│   ├── pages/            # ~N component files (N pages × 4 files each)
│   ├── partials/         # ~M component files (M partials × 4 files each)
│   ├── prefabs/          # ~P component files (P prefabs × ...)
│   ├── app.variables.js  # (1 file)
│   ├── service-definitions.js  # (1 file)
│   ├── device-operation-loader.js # (1 file)
│   ├── device-plugin-service.js   # (1 file)
│   ├── device-permission-service.js # (1 file)
│   ├── plugin-provider.js         # (1 file)
│   ├── extensions/
│   │   └── formatters.js # (1 file)
│   └── resolve/
│       ├── resource.resolver.js  # (1 file)
│       └── locale.resolver.js    # (1 file, if web preview)
├── theme/                # Theme files
├── assets/               # Images, icons, resources
├── metadata/
│   └── entities/         # Entity metadata
└── (other config files)

Total files generated: ~50-200+ depending on app complexity
```

## Next Steps

- [System Overview](./system-overview.md) - Back to overview
- [Transpilation Process](../codegen/transpilation-process.md) - Detailed transpilation
- [App Generator](../codegen/app-generator.md) - Generator API reference

