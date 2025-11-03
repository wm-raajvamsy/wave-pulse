# Style Agent - Detailed Documentation

## Overview

The **Style Agent** is the expert on theming, styling, and CSS/LESS compilation in WaveMaker React Native. It has comprehensive knowledge of how styles are defined, compiled, and applied at runtime.

## Domain Expertise

### Core Responsibilities

1. **Theme System Architecture**
   - Theme compilation process
   - Runtime theme management
   - Theme switching
   - Theme inheritance

2. **Style Compilation**
   - CSS/LESS → React Native StyleSheet
   - Property transformation
   - Responsive styles
   - Platform-specific styles

3. **Widget Style Definitions**
   - Style definitions for all 50+ widgets
   - Theme variables
   - Style inheritance
   - Custom styling

4. **Runtime Style Application**
   - Style merging and precedence
   - Dynamic style updates
   - Theme context
   - Style caching

## Knowledge Base

### Style Compilation Pipeline

```
Studio LESS/CSS Files
    ↓
LESS Compiler
    ↓
CSS Parser (css-tree)
    ↓
RN Stylesheet Transpiler
    ↓
    ├─→ Property transformation
    ├─→ Value conversion
    ├─→ Selector parsing
    └─→ Media query handling
    ↓
React Native StyleSheet
    ↓
Theme JavaScript File
    ↓
Runtime Application
```

### Style File Structure

```
Codegen (Style Definition):
theme/
├── theme.service.ts                 # Main theme compiler
├── rn-stylesheet.transpiler.ts      # CSS → RN transpiler
├── variables.ts                     # Theme variables
├── font-stylesheet.transpiler.ts    # Font handling
├── runtime-styles.generator.ts      # Runtime style gen
└── components/                      # Widget style definitions
    ├── button.ts                    # WmButton styles
    ├── label.ts                     # WmLabel styles
    ├── list.ts                      # WmList styles
    └── [50+ widget styles...]

Runtime (Style Application):
styles/
├── theme.tsx                        # Runtime theme system
├── theme.variables.ts               # Theme variables
├── style-props.ts                   # Style props utilities
├── background.component.tsx         # Background rendering
└── MediaQueryList.ts               # Media queries
```

## Theme System

### Theme Architecture

```typescript
// Theme structure
interface Theme {
  // Base variables
  variables: ThemeVariables;
  
  // Component styles
  WmButton?: NamedStyles<any>;
  WmLabel?: NamedStyles<any>;
  WmList?: NamedStyles<any>;
  // ... all components
  
  // Custom classes
  'btn-primary'?: ViewStyle;
  'custom-class'?: ViewStyle;
  
  // Media queries
  '@media'?: MediaQueries;
}

// Theme variables
interface ThemeVariables {
  // Colors
  primaryColor: string;
  successColor: string;
  dangerColor: string;
  warningColor: string;
  infoColor: string;
  
  // Typography
  baseFont: string;
  baseFontSize: number;
  
  // Spacing
  baseMargin: number;
  basePadding: number;
  
  // Border
  baseBorderRadius: number;
  baseBorderWidth: number;
  
  // Custom variables
  [key: string]: any;
}
```

### Theme Compilation

**Location**: `wavemaker-rn-codegen/src/theme/theme.service.ts`

```typescript
export class ThemeService {
  /**
   * Compile LESS/CSS theme to React Native
   */
  async compileTheme(
    themePath: string,
    outputPath: string
  ): Promise<void> {
    // 1. Read LESS files
    const lessContent = await this.readThemeFiles(themePath);
    
    // 2. Compile LESS to CSS
    const css = await less.render(lessContent);
    
    // 3. Parse CSS
    const ast = cssTree.parse(css.css);
    
    // 4. Transform to RN StyleSheet
    const rnStyles = this.transpiler.transform(ast);
    
    // 5. Generate theme file
    await this.generateThemeFile(rnStyles, outputPath);
  }
  
  /**
   * Transform CSS AST to RN styles
   */
  private transformToRN(ast: CssNode): Theme {
    const theme: Theme = {
      variables: {},
      '@media': {}
    };
    
    cssTree.walk(ast, {
      visit: 'Rule',
      enter: (node) => {
        const selector = this.parseSelector(node.prelude);
        const styles = this.parseDeclarations(node.block);
        
        // Map to theme structure
        if (selector.startsWith('.Wm')) {
          // Component style
          const componentName = selector.substring(1);
          theme[componentName] = styles;
        } else if (selector.startsWith('.')) {
          // Custom class
          theme[selector.substring(1)] = styles;
        }
      }
    });
    
    return theme;
  }
}
```

### RN Stylesheet Transpiler

**Location**: `wavemaker-rn-codegen/src/theme/rn-stylesheet.transpiler.ts`

```typescript
export class RNStylesheetTranspiler {
  /**
   * Transform CSS property to RN property
   */
  transformProperty(name: string, value: string): [string, any] {
    // Property name transformation
    const rnProperty = this.transformPropertyName(name);
    
    // Value transformation
    const rnValue = this.transformValue(name, value);
    
    return [rnProperty, rnValue];
  }
  
  /**
   * Transform CSS property name to RN camelCase
   */
  private transformPropertyName(cssProperty: string): string {
    // background-color → backgroundColor
    return cssProperty.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
  
  /**
   * Transform CSS value to RN value
   */
  private transformValue(property: string, cssValue: string): any {
    // Handle different value types
    
    // Numeric values (px, em, rem, %, etc.)
    if (this.isNumericValue(cssValue)) {
      return this.parseNumericValue(cssValue);
    }
    
    // Colors
    if (this.isColorValue(cssValue)) {
      return this.parseColor(cssValue);
    }
    
    // Enums (flex, absolute, etc.)
    if (this.isEnumValue(property, cssValue)) {
      return cssValue;
    }
    
    // Arrays (transform, boxShadow)
    if (this.isArrayValue(property)) {
      return this.parseArray(cssValue);
    }
    
    return cssValue;
  }
  
  /**
   * Parse numeric value (handle px, em, rem, %, etc.)
   */
  private parseNumericValue(value: string): number {
    // Remove units
    const numericValue = parseFloat(value);
    
    // Handle different units
    if (value.endsWith('px')) {
      return numericValue;
    } else if (value.endsWith('em') || value.endsWith('rem')) {
      // Convert to px (assuming 16px base)
      return numericValue * 16;
    } else if (value.endsWith('%')) {
      // Keep as percentage string for some properties
      return value;
    }
    
    return numericValue;
  }
}
```

## CSS Property Support

### Supported Properties

```typescript
// Layout
{
  display: 'flex' | 'none',
  flexDirection: 'row' | 'column' | 'row-reverse' | 'column-reverse',
  flexWrap: 'wrap' | 'nowrap' | 'wrap-reverse',
  justifyContent: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly',
  alignItems: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',
  alignSelf: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline',
  flex: number,
  flexGrow: number,
  flexShrink: number,
  flexBasis: number | string,
  
  // Dimensions
  width: number | string,
  height: number | string,
  minWidth: number | string,
  maxWidth: number | string,
  minHeight: number | string,
  maxHeight: number | string,
  
  // Spacing
  margin: number,
  marginTop: number,
  marginRight: number,
  marginBottom: number,
  marginLeft: number,
  marginVertical: number,
  marginHorizontal: number,
  padding: number,
  paddingTop: number,
  paddingRight: number,
  paddingBottom: number,
  paddingLeft: number,
  paddingVertical: number,
  paddingHorizontal: number,
  
  // Position
  position: 'relative' | 'absolute',
  top: number,
  right: number,
  bottom: number,
  left: number,
  zIndex: number,
  
  // Border
  borderWidth: number,
  borderTopWidth: number,
  borderRightWidth: number,
  borderBottomWidth: number,
  borderLeftWidth: number,
  borderColor: string,
  borderRadius: number,
  borderTopLeftRadius: number,
  borderTopRightRadius: number,
  borderBottomLeftRadius: number,
  borderBottomRightRadius: number,
  borderStyle: 'solid' | 'dotted' | 'dashed',
  
  // Background
  backgroundColor: string,
  
  // Text
  color: string,
  fontSize: number,
  fontWeight: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | 'normal' | 'bold',
  fontFamily: string,
  fontStyle: 'normal' | 'italic',
  lineHeight: number,
  textAlign: 'left' | 'center' | 'right' | 'justify',
  textDecorationLine: 'none' | 'underline' | 'line-through' | 'underline line-through',
  textDecorationStyle: 'solid' | 'double' | 'dotted' | 'dashed',
  textDecorationColor: string,
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize',
  letterSpacing: number,
  
  // Transform
  transform: Transform[],
  
  // Opacity
  opacity: number,
  
  // Overflow
  overflow: 'visible' | 'hidden' | 'scroll',
  
  // Shadow (iOS)
  shadowColor: string,
  shadowOffset: { width: number, height: number },
  shadowOpacity: number,
  shadowRadius: number,
  
  // Elevation (Android)
  elevation: number
}
```

### Unsupported Properties (Transformed or Ignored)

```typescript
// Properties that need transformation
{
  // box-shadow → shadowColor, shadowOffset, etc. (iOS)
  // box-shadow → elevation (Android)
  'box-shadow': 'transform to shadow/elevation',
  
  // background-image → BackgroundComponent
  'background-image': 'use BackgroundComponent',
  
  // gradient → linear-gradient in BackgroundComponent
  'background': 'transform to gradient',
  
  // float → not supported (use flexbox)
  'float': 'not supported',
  
  // CSS Grid → not supported (use flexbox)
  'grid-*': 'not supported',
  
  // Media queries → @media in theme
  '@media': 'special handling'
}
```

## Widget Style Definitions

### Style Definition Structure

**Location**: `wavemaker-rn-codegen/src/theme/components/button.ts`

```typescript
// Example: Button style definition
import { WidgetStyleDefinition } from '../widget-style-definition';

export const buttonStyleDef: WidgetStyleDefinition = {
  // Widget name
  widgetName: 'WmButton',
  
  // Style parts (named styles within the widget)
  parts: {
    root: {
      // Supported CSS properties for root element
      supportedProperties: [
        'backgroundColor',
        'borderColor',
        'borderWidth',
        'borderRadius',
        'paddingHorizontal',
        'paddingVertical',
        'minHeight',
        'minWidth',
        'opacity'
      ]
    },
    text: {
      supportedProperties: [
        'color',
        'fontSize',
        'fontWeight',
        'fontFamily',
        'textAlign',
        'textTransform',
        'letterSpacing'
      ]
    },
    icon: {
      supportedProperties: [
        'color',
        'fontSize',
        'marginRight',
        'marginLeft'
      ]
    }
  },
  
  // Default styles
  defaultStyles: {
    root: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 4,
      backgroundColor: '#007bff',
      minHeight: 40
    },
    text: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600'
    },
    icon: {
      marginRight: 8
    }
  },
  
  // Type variants
  variants: {
    primary: {
      root: { backgroundColor: '#007bff' },
      text: { color: '#ffffff' }
    },
    secondary: {
      root: { backgroundColor: '#6c757d' },
      text: { color: '#ffffff' }
    },
    success: {
      root: { backgroundColor: '#28a745' },
      text: { color: '#ffffff' }
    },
    danger: {
      root: { backgroundColor: '#dc3545' },
      text: { color: '#ffffff' }
    },
    warning: {
      root: { backgroundColor: '#ffc107' },
      text: { color: '#212529' }
    },
    info: {
      root: { backgroundColor: '#17a2b8' },
      text: { color: '#ffffff' }
    }
  },
  
  // States
  states: {
    disabled: {
      root: { opacity: 0.5 }
    },
    pressed: {
      root: { opacity: 0.8 }
    }
  }
};
```

## Runtime Theme System

### Theme Context

**Location**: `wavemaker-rn-runtime/src/styles/theme.tsx`

```typescript
// Theme context
export const ThemeContext = React.createContext<Theme>(BASE_THEME);

// Theme provider
export const ThemeProvider: React.FC<{ theme: Theme }> = ({ theme, children }) => {
  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme consumer HOC
export const ThemeConsumer = <P extends object>(
  Component: React.ComponentType<P & { theme: Theme }>
) => {
  return (props: P) => (
    <ThemeContext.Consumer>
      {(theme) => <Component {...props} theme={theme} />}
    </ThemeContext.Consumer>
  );
};

// useTheme hook
export const useTheme = (): Theme => {
  return React.useContext(ThemeContext);
};
```

### Theme Variables

**Location**: `wavemaker-rn-runtime/src/styles/theme.variables.ts`

```typescript
export default class ThemeVariables {
  private static _INSTANCE: ThemeVariables;
  
  // Core colors
  public primaryColor = '#007bff';
  public successColor = '#28a745';
  public dangerColor = '#dc3545';
  public warningColor = '#ffc107';
  public infoColor = '#17a2b8';
  public lightColor = '#f8f9fa';
  public darkColor = '#343a40';
  
  // Typography
  public baseFont = 'System';
  public baseFontSize = 14;
  public h1FontSize = 32;
  public h2FontSize = 28;
  public h3FontSize = 24;
  public h4FontSize = 20;
  public h5FontSize = 16;
  public h6FontSize = 14;
  
  // Spacing
  public baseMargin = 8;
  public basePadding = 8;
  
  // Border
  public baseBorderRadius = 4;
  public baseBorderWidth = 1;
  public baseBorderColor = '#dee2e6';
  
  // Singleton instance
  public static get INSTANCE(): ThemeVariables {
    if (!ThemeVariables._INSTANCE) {
      ThemeVariables._INSTANCE = new ThemeVariables();
    }
    return ThemeVariables._INSTANCE;
  }
  
  // Update variables
  public update(variables: Partial<ThemeVariables>): void {
    Object.assign(this, variables);
  }
}
```

## Style Application

### Component Style Merging

```typescript
// In BaseComponent
private createStyles(
  defaultStyles: L,
  defaultClass: string
): L {
  // 1. Default widget styles
  const base = defaultStyles;
  
  // 2. Theme styles for this widget
  const themeStyles = this.theme[defaultClass] || {};
  
  // 3. Custom classes from props
  const classStyles = this.getClassStyles(this.props.classname);
  
  // 4. Inline styles from props
  const inlineStyles = this.props.styles || {};
  
  // Merge with precedence: base < theme < classes < inline
  return StyleSheet.create({
    ...base,
    ...this.mergeStyles(base, themeStyles),
    ...this.mergeStyles(base, classStyles),
    ...inlineStyles
  }) as L;
}

// Get styles for custom classes
private getClassStyles(classname?: string): any {
  if (!classname) return {};
  
  const classes = classname.split(' ');
  const styles = {};
  
  classes.forEach(className => {
    const classStyle = this.theme[className];
    if (classStyle) {
      Object.assign(styles, classStyle);
    }
  });
  
  return styles;
}
```

### Style Precedence

```
Priority (lowest to highest):
1. Default widget styles
2. Theme styles (from theme file)
3. Custom CSS classes
4. Inline styles (from markup)

Example:
<WmButton 
  classname="btn-primary custom-button"    // Priority 3
  styles={{ root: { width: 100 } }}        // Priority 4
/>
```

## Responsive Styles

### Media Queries

```typescript
// In theme
{
  '@media': {
    '(max-width: 767px)': {
      '.container': {
        paddingHorizontal: 8
      }
    },
    '(min-width: 768px)': {
      '.container': {
        paddingHorizontal: 16
      }
    }
  }
}

// Runtime application
export class MediaQueryList {
  private queries: Map<string, MediaQuery> = new Map();
  
  constructor(mediaQueries: any) {
    Object.keys(mediaQueries).forEach(query => {
      const styles = mediaQueries[query];
      const mq = this.parseMediaQuery(query);
      this.queries.set(query, { ...mq, styles });
    });
  }
  
  getMatchingStyles(dimensions: { width: number, height: number }): any {
    const matchingStyles = {};
    
    this.queries.forEach(query => {
      if (this.matches(query, dimensions)) {
        Object.assign(matchingStyles, query.styles);
      }
    });
    
    return matchingStyles;
  }
}
```

### Responsive Properties

```tsx
// Widget with responsive visibility
<WmContainer 
  showindevice={['md', 'lg', 'xl']}  // Only on tablets and desktops
>
  <WmLabel caption="Desktop content" />
</WmContainer>

// Breakpoints
{
  xs: 0,      // Mobile portrait
  sm: 576,    // Mobile landscape
  md: 768,    // Tablet
  lg: 992,    // Desktop
  xl: 1200,   // Large desktop
  xxl: 1400   // Extra large
}
```

## Custom Styling

### Studio Markup with Styles

```xml
<!-- Class-based styling -->
<wm-button class="btn-primary custom-button">Submit</wm-button>

<!-- Inline styling -->
<wm-button 
  width="100" 
  height="50"
  backgroundcolor="#007bff"
  color="#ffffff">
  Submit
</wm-button>

<!-- Combined -->
<wm-button 
  class="btn-primary"
  width="100">
  Submit
</wm-button>
```

### Generated JSX with Styles

```tsx
// Class-based
<WmButton 
  classname="btn-primary custom-button"
/>

// Inline
<WmButton 
  styles={{
    root: [
      this.theme.WmButton?.root,
      { width: 100, height: 50, backgroundColor: '#007bff' }
    ],
    text: [
      this.theme.WmButton?.text,
      { color: '#ffffff' }
    ]
  }}
/>

// Combined
<WmButton 
  classname="btn-primary"
  styles={{
    root: [
      this.theme.WmButton?.root,
      this.theme['btn-primary'],
      { width: 100 }
    ]
  }}
/>
```

## Background Component

For advanced backgrounds (images, gradients):

```typescript
// BackgroundComponent
<BackgroundComponent 
  backgroundImage="url(image.png)"
  backgroundGradient={{
    colors: ['#ff0000', '#0000ff'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 }
  }}
>
  <View>{children}</View>
</BackgroundComponent>
```

## Agent Capabilities

### 1. Explain Theme System

**Query**: "How does the theme system work?"

**Response**: Complete explanation of theme compilation, structure, and runtime application

### 2. CSS Property Support

**Query**: "Is box-shadow supported?"

**Response**: Explanation of how box-shadow is transformed to React Native shadow properties

### 3. Widget Styling

**Query**: "How to style WmButton?"

**Response**: Complete guide with examples of theming, classes, and inline styles

### 4. Custom Themes

**Query**: "How to create a custom theme?"

**Response**: Step-by-step guide on creating custom themes

### 5. Debug Styles

**Query**: "My styles aren't applying"

**Response**: Diagnostic steps and common styling issues

## Best Practices

### Theme Development

1. **Use Theme Variables**: Define colors, fonts, spacing in variables
2. **Component Variants**: Create type variants (primary, success, etc.)
3. **Consistent Naming**: Use consistent class names
4. **Mobile-First**: Design for mobile, enhance for larger screens
5. **Test Platforms**: Test on both iOS and Android

### Performance

1. **Static Styles**: Define styles outside render methods
2. **StyleSheet.create**: Always use StyleSheet.create for styles
3. **Avoid Inline Objects**: Don't create new style objects in render
4. **Memoize Computed Styles**: Cache dynamically computed styles

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Theming, Styling & CSS Compilation

