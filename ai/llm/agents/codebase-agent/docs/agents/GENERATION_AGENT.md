# Generation Agent - Detailed Documentation

## Overview

The **Generation Agent** is the expert on code generation from templates in WaveMaker React Native. It understands the Handlebars template system and how files are generated.

## Domain Expertise

### Core Responsibilities

1. **Template System**
   - Handlebars template engine
   - Template helpers
   - Template registration

2. **File Generation**
   - Component generation
   - Page generation
   - Service generation
   - Configuration generation

3. **Template Context**
   - Data preparation
   - Context building
   - Helper functions

## Handlebars Template System

### Template Engine

**Library**: `handlebars`

```typescript
import Handlebars from 'handlebars';

// Load template
const templateSource = fs.readFileSync('template.hbs', 'utf-8');
const template = Handlebars.compile(templateSource);

// Generate output
const context = {
  componentName: 'WmButton',
  props: ['caption', 'type', 'disabled']
};

const output = template(context);
```

### Template Syntax

```handlebars
{{!-- Variables --}}
{{componentName}}

{{!-- Conditionals --}}
{{#if hasProps}}
  Props: {{props}}
{{else}}
  No props
{{/if}}

{{!-- Loops --}}
{{#each props}}
  - {{this}}
{{/each}}

{{!-- Helpers --}}
{{capitalize componentName}}
{{join props ', '}}

{{!-- Partials --}}
{{> header}}

{{!-- Comments --}}
{{!-- This is a comment --}}
```

## Template Files

### Component Template

**Location**: `wavemaker-rn-codegen/src/templates/component/component.template`

```handlebars
import React from 'react';
import { {{imports}} } from 'react-native';
import { BaseComponent } from '@wavemaker/app-rn-runtime/core/base.component';
{{#each customImports}}
import { {{this.name}} } from '{{this.from}}';
{{/each}}

export class {{componentName}} extends BaseComponent<
  {{componentName}}Props,
  {{componentName}}State,
  {{componentName}}Styles
> {
  constructor(props: {{componentName}}Props) {
    super(props, DEFAULT_STYLES, '{{componentName}}');
  }
  
  {{#each methods}}
  {{this.name}}({{join this.params ', '}}) {
    {{this.body}}
  }
  {{/each}}
  
  public renderWidget(props: {{componentName}}Props): React.ReactNode {
    return (
      {{markup}}
    );
  }
}
```

### Page Template

**Location**: `wavemaker-rn-codegen/src/templates/component/component.template`

```handlebars
import React from 'react';
import { BasePage } from '@wavemaker/app-rn-runtime/runtime/base-page.component';
{{#each imports}}
import { {{name}} } from '{{from}}';
{{/each}}

export default class {{pageName}} extends BasePage<
  {{pageName}}Props,
  {{pageName}}State
> {
  constructor(props: any) {
    super(props);
    this.state = {
      ...this.state
    };
  }
  
  // Variables
  Variables = {
    {{#each variables}}
    {{this.name}}: new {{this.type}}({
      ...{{json this.config}}
    }),
    {{/each}}
  };
  
  // Widgets
  Widgets = {};
  
  // Methods
  {{#each methods}}
  {{this.name}}({{join this.params ', '}}) {
    {{this.body}}
  }
  {{/each}}
  
  // Render
  renderWidget(props: {{pageName}}Props): React.ReactNode {
    return (
      {{markup}}
    );
  }
}
```

## Handlebar Helpers

### Built-in Helpers

**Location**: `wavemaker-rn-codegen/src/handlebar-helpers.ts`

```typescript
import Handlebars from 'handlebars';

// Register helpers
Handlebars.registerHelper('capitalize', function(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('uppercase', function(str: string) {
  return str.toUpperCase();
});

Handlebars.registerHelper('lowercase', function(str: string) {
  return str.toLowerCase();
});

Handlebars.registerHelper('join', function(array: any[], separator: string) {
  return array.join(separator);
});

Handlebars.registerHelper('json', function(obj: any) {
  return JSON.stringify(obj, null, 2);
});

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('ne', function(a: any, b: any) {
  return a !== b;
});

Handlebars.registerHelper('and', function(...args: any[]) {
  return args.slice(0, -1).every(Boolean);
});

Handlebars.registerHelper('or', function(...args: any[]) {
  return args.slice(0, -1).some(Boolean);
});

Handlebars.registerHelper('not', function(value: any) {
  return !value;
});

// Custom helpers
Handlebars.registerHelper('prependSpace', function(str: string) {
  return str ? ' ' + str : '';
});

Handlebars.registerHelper('indent', function(str: string, spaces: number) {
  const indent = ' '.repeat(spaces);
  return str.split('\n').map(line => indent + line).join('\n');
});
```

### Usage in Templates

```handlebars
{{!-- Capitalize --}}
{{capitalize componentName}}

{{!-- Join array --}}
{{join props ', '}}

{{!-- JSON stringify --}}
const config = {{json variableConfig}};

{{!-- Conditionals --}}
{{#if (eq type 'button')}}
  Button type
{{/if}}

{{#if (and isEnabled isVisible)}}
  Render component
{{/if}}

{{!-- Indent code --}}
{{indent markup 2}}
```

## Generation Process

### App Generation

**Location**: `wavemaker-rn-codegen/src/app.generator.ts`

```typescript
export class AppGenerator {
  async generate(
    projectPath: string,
    outputPath: string,
    profile: Profile
  ): Promise<void> {
    // 1. Read project files
    const projectService = new ProjectService(projectPath);
    const pages = await projectService.getPages();
    const partials = await projectService.getPartials();
    const variables = await projectService.getVariables();
    
    // 2. Generate pages
    for (const page of pages) {
      await this.generatePage(page, outputPath);
    }
    
    // 3. Generate partials
    for (const partial of partials) {
      await this.generatePartial(partial, outputPath);
    }
    
    // 4. Generate app files
    await this.generateAppFiles(outputPath, profile);
    
    // 5. Generate configuration
    await this.generateConfiguration(outputPath);
  }
  
  private async generatePage(
    page: PageInfo,
    outputPath: string
  ): Promise<void> {
    // Read page files
    const markup = await fs.readFile(page.htmlPath, 'utf-8');
    const script = await fs.readFile(page.jsPath, 'utf-8');
    const variables = JSON.parse(await fs.readFile(page.variablesPath, 'utf-8'));
    
    // Transpile markup
    const transpiled = transpileMarkup(markup, this.rnConfig);
    
    // Build context
    const context = {
      pageName: page.name,
      markup: transpiled.markup,
      imports: transpiled.imports,
      variables: transformVariables(variables),
      methods: extractMethods(script),
      partials: transpiled.partials,
      prefabs: transpiled.prefabs
    };
    
    // Generate component
    const output = COMPONENT_TEMPLATE(context);
    
    // Write file
    const outputFile = path.join(outputPath, `src/pages/${page.name}/${page.name}.component.js`);
    await fs.writeFile(outputFile, output);
  }
}
```

### Template Loading

```typescript
export function loadTemplate(templatePath: string): HandlebarsTemplateDelegate {
  const source = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(source);
}

// Pre-compile templates
const COMPONENT_TEMPLATE = loadTemplate(__dirname + '/templates/component/component.template');
const PAGE_CONFIG_TEMPLATE = loadTemplate(__dirname + '/templates/pages-config.template');
const BOOTSTRAP_TEMPLATE = loadTemplate(__dirname + '/templates/bootstrap.template');
```

## Generated Files

### 1. Page Component

```javascript
// src/pages/HomePage/HomePage.component.js

import React from 'react';
import { View, Text } from 'react-native';
import { BasePage } from '@wavemaker/app-rn-runtime/runtime/base-page.component';
import { WmButton } from '@wavemaker/app-rn-runtime/components/basic/button';
import { ModelVariable } from '@wavemaker/app-rn-runtime/variables/model-variable';

export default class HomePage extends BasePage {
  constructor(props) {
    super(props);
  }
  
  Variables = {
    welcomeMessage: new ModelVariable({
      name: 'welcomeMessage',
      isList: false,
      dataSet: 'Welcome to WaveMaker!'
    })
  };
  
  onButtonClick() {
    this.NavigationService.navigate('ProfilePage');
  }
  
  renderWidget(props) {
    return (
      <View>
        <Text>{this.Variables.welcomeMessage.dataSet}</Text>
        <WmButton 
          caption="Go to Profile"
          onPress={() => this.onButtonClick()}
        />
      </View>
    );
  }
}
```

### 2. App.js

```javascript
// App.js

import React from 'react';
import { AppNavigator } from '@wavemaker/app-rn-runtime/runtime/App.navigator';
import { bootstrap } from './bootstrap';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    bootstrap();
  }
  
  render() {
    return <AppNavigator />;
  }
}
```

### 3. Pages Configuration

```javascript
// src/pages-config.js

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
  }
};
```

### 4. Bootstrap

```javascript
// bootstrap.js

import injector from '@wavemaker/app-rn-runtime/core/injector';
import NavigationService from '@wavemaker/app-rn-runtime/core/navigation.service';
// ... other services

export function bootstrap() {
  // Register services
  injector.register('NavigationService', NavigationService);
  injector.register('ModalService', ModalService);
  // ... other services
  
  // Initialize services
  NetworkService.init();
  
  // Load configuration
  loadConfiguration();
}
```

## Agent Capabilities

### 1. Explain Generation

**Query**: "How are pages generated?"

**Response**: Complete explanation of page generation process

### 2. Template Customization

**Query**: "How to customize component template?"

**Response**: Guide on modifying templates

### 3. Add Helpers

**Query**: "How to add custom Handlebars helper?"

**Response**: Step-by-step helper creation guide

## Best Practices

### Template Development

1. **Modular Templates**: Break into reusable partials
2. **Helper Functions**: Create helpers for complex logic
3. **Error Handling**: Handle missing data gracefully
4. **Formatting**: Use formatters for clean output

### Generation

1. **Validation**: Validate input data before generation
2. **Error Recovery**: Handle generation errors gracefully
3. **Performance**: Cache compiled templates
4. **Testing**: Test templates with various inputs

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Code Generation from Templates

