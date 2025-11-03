# Theme System

## Overview

WaveMaker React Native uses a powerful theming system that allows dynamic theme switching, platform-specific styles, and CSS-like styling converted to React Native StyleSheet.

## Theme Architecture

```
Theme System
  ├── Theme Files (LESS/CSS)
  │   ├── variables.less       # Theme variables
  │   ├── styles.less          # Style rules
  │   └── assets/              # Theme-specific assets
  │
  ├── Compilation Process
  │   ├── LESS → CSS           # Compile LESS
  │   ├── CSS → AST            # Parse CSS
  │   └── AST → RN Styles      # Convert to RN
  │
  └── Runtime
      ├── Theme Manager         # Load and switch themes
      ├── Style Resolution      # Merge style layers
      └── Component Application # Apply to widgets
```

## Theme Structure

### Directory Layout

```
theme/
└── native-mobile/                    # Mobile theme
    ├── android/
    │   ├── styles.js                 # Compiled RN styles
    │   ├── asset.resolver.js         # Asset loader
    │   └── assets/
    │       ├── images/
    │       └── fonts/
    ├── ios/
    │   ├── styles.js                 # Compiled RN styles
    │   ├── asset.resolver.js         # Asset loader
    │   └── assets/
    │       ├── images/
    │       └── fonts/
    └── common/
        └── variables.js              # Theme variables
```

### Theme Files

#### variables.less
Define theme variables:

```less
// Brand colors
@brand-primary: #007bff;
@brand-success: #28a745;
@brand-danger: #dc3545;
@brand-warning: #ffc107;
@brand-info: #17a2b8;

// Typography
@base-font-family: 'Roboto';
@base-font-size: 14px;
@heading-font-family: 'Roboto';

// Spacing
@base-padding: 10px;
@base-margin: 10px;
@base-border-radius: 4px;

// Component-specific
@button-padding: 10px 20px;
@button-border-radius: 5px;
@input-height: 40px;
```

#### styles.less
Define style rules:

```less
.app-button {
  background-color: @brand-primary;
  color: white;
  padding: @button-padding;
  border-radius: @button-border-radius;
  
  &-disabled {
    opacity: 0.5;
  }
  
  &-success {
    background-color: @brand-success;
  }
}

.app-label {
  color: #333;
  font-size: @base-font-size;
  font-family: @base-font-family;
}
```

## Theme Compilation

### Compilation Process

```typescript
class ThemeService {
  async compile(themePath: string) {
    // 1. Read LESS files
    const lessContent = readFile(`${themePath}/styles.less`);
    const variables = readFile(`${themePath}/variables.less`);
    
    // 2. Compile LESS to CSS
    const css = await less.render(lessContent + variables);
    
    // 3. Parse CSS to AST
    const ast = cssParser.parse(css);
    
    // 4. Convert to React Native styles
    const rnStyles = this.convertToReactNative(ast);
    
    // 5. Write compiled output
    writeFile(`${themePath}/artifact/styles.js`, rnStyles);
  }
}
```

### CSS to React Native Conversion

```typescript
// CSS Property → RN Property
'background-color' → backgroundColor
'margin-top' → marginTop
'padding-left' → paddingLeft
'border-radius' → borderRadius
'font-size' → fontSize

// Value Conversions
'10px' → 10
'1rem' → 16 (based on base font size)
'#007bff' → '#007bff' (colors unchanged)
'bold' → 'bold' (font weights unchanged)

// Shorthand Expansion
'padding: 10px 20px' → {
  paddingTop: 10,
  paddingBottom: 10,
  paddingLeft: 20,
  paddingRight: 20
}
```

## Theme Manager

### Loading Themes

```typescript
// app.theme.js
import androidStyles from './theme/native-mobile/android/styles';
import iosStyles from './theme/native-mobile/ios/styles';
import { Platform } from 'react-native';

const themes = {
  'native-mobile': Platform.OS === 'ios' ? iosStyles : androidStyles
};

export default themes;
```

### Theme Provider

```typescript
// In App.tsx
import { ThemeProvider } from '@wavemaker/app-rn-runtime/styles/theme';
import themes from './app.theme';

function App() {
  const [selectedTheme, setSelectedTheme] = useState('native-mobile');
  
  return (
    <ThemeProvider value={themes[selectedTheme]}>
      <AppContent />
    </ThemeProvider>
  );
}
```

### Theme Consumer

```typescript
// In component
import { ThemeConsumer } from '@wavemaker/app-rn-runtime/styles/theme';

<ThemeConsumer>
  {(theme) => {
    const styles = theme.getStyle('app-button');
    return <TouchableOpacity style={styles.root} />;
  }}
</ThemeConsumer>

// Or in BaseComponent (automatic)
this.theme.getStyle('app-button');
```

## Style Resolution

### Style Merging Order

Components merge styles from multiple sources:

```typescript
const finalStyles = theme.mergeStyle(
  theme.getStyle('app-button'),           // 1. Default widget style
  theme.getStyle('app-button-en'),        // 2. Locale-specific
  theme.getStyle('app-button-disabled'),  // 3. State styles
  theme.getStyle('app-button-rtl'),       // 4. RTL styles
  theme.getStyle('btn-primary'),          // 5. Custom class
  props.styles,                           // 6. Inline styles
  styleOverrides                          // 7. Dynamic overrides
);
```

### Custom Classes

Define custom reusable styles:

```less
// In theme
.btn-primary {
  background-color: @brand-primary;
  color: white;
}

.btn-large {
  padding: 15px 30px;
  font-size: 18px;
}

.text-center {
  text-align: center;
}
```

Usage:

```typescript
<WmButton classname="btn-primary btn-large" />
<WmLabel classname="text-center" />
```

## Theme Variables

### JavaScript Theme Variables

```javascript
// app.theme.variables.js
export default {
  // Colors
  primaryColor: '#007bff',
  successColor: '#28a745',
  dangerColor: '#dc3545',
  
  // Typography
  baseFont: 'Roboto',
  baseFontSize: 14,
  headingFont: 'Roboto-Bold',
  
  // Spacing
  basePadding: 10,
  baseMargin: 10,
  borderRadius: 4,
  
  // Custom
  headerHeight: 60,
  footerHeight: 50
};
```

### Using Theme Variables

```typescript
import ThemeVariables from './app.theme.variables';

const styles = {
  container: {
    padding: ThemeVariables.basePadding,
    backgroundColor: ThemeVariables.primaryColor
  },
  text: {
    fontFamily: ThemeVariables.baseFont,
    fontSize: ThemeVariables.baseFontSize
  }
};
```

## Platform-Specific Styling

### Platform Selection

```typescript
// Automatically uses correct platform styles
const theme = Platform.OS === 'ios' 
  ? require('./theme/native-mobile/ios/styles')
  : require('./theme/native-mobile/android/styles');
```

### Platform-Specific Rules

```less
// In theme
.app-button {
  padding: 10px 20px;
  
  // iOS-specific (via custom naming)
  &-ios {
    border-radius: 8px;
  }
  
  // Android-specific
  &-android {
    border-radius: 4px;
    elevation: 2;
  }
}
```

## Dynamic Theme Switching

### Runtime Theme Change

```typescript
// Theme switcher
function ThemeSwitcher() {
  const [theme, setTheme] = useState('light');
  
  const switchTheme = (newTheme) => {
    setTheme(newTheme);
    // All components automatically re-render with new theme
  };
  
  return (
    <ThemeProvider value={themes[theme]}>
      <App />
    </ThemeProvider>
  );
}
```

### Theme Change Notifications

```typescript
// Components listen for theme changes
this.cleanup.push(
  this.theme.subscribe(ThemeEvent.CHANGE, () => {
    this.forceUpdate(); // Re-render with new theme
  })
);
```

## Responsive Styling

### Device-Specific Classes

```less
// Responsive visibility classes
.d-xs-flex { display: flex; } // Extra small devices
.d-sm-flex { display: flex; } // Small devices
.d-md-flex { display: flex; } // Medium devices
.d-lg-flex { display: flex; } // Large devices
.d-xl-flex { display: flex; } // Extra large devices

.d-all-none { display: none; } // Hide on all
```

Usage:

```typescript
// Show only on small and medium devices
<WmButton showindevice={['sm', 'md']} />
```

### Media Query Alternative

```typescript
import { useWindowDimensions } from 'react-native';

function ResponsiveComponent() {
  const { width } = useWindowDimensions();
  
  const styles = {
    container: {
      padding: width < 768 ? 10 : 20,
      flexDirection: width < 768 ? 'column' : 'row'
    }
  };
  
  return <View style={styles.container} />;
}
```

## RTL (Right-to-Left) Support

### RTL Styles

```less
// Auto-generated RTL styles
.app-button-rtl {
  // Flipped for RTL languages (Arabic, Hebrew, etc.)
  text-align: right;
  flex-direction: row-reverse;
}
```

### RTL Detection

```typescript
import { I18nService } from '@wavemaker/app-rn-runtime/core/i18n.service';

if (I18nService.isRTLLocale()) {
  // Apply RTL-specific logic
}
```

## Theme Assets

### Asset Management

```
theme/native-mobile/android/assets/
├── images/
│   ├── logo.png
│   ├── background.jpg
│   └── icon-set/
└── fonts/
    ├── CustomFont-Regular.ttf
    └── CustomFont-Bold.ttf
```

### Asset Resolution

```typescript
// Automatic asset resolution
<WmPicture source="theme/images/logo.png" />

// Runtime resolution
const logo = assetResolver.resolve('theme/images/logo.png');
```

## Best Practices

### ✅ DO

1. **Use theme variables for consistency:**
   ```less
   .custom-widget {
     color: @brand-primary;
     padding: @base-padding;
   }
   ```

2. **Create reusable classes:**
   ```less
   .btn-primary, .btn-success, .btn-danger {
     /* Common button styles */
   }
   ```

3. **Leverage LESS features:**
   ```less
   @import "variables.less";
   @import "mixins.less";
   
   .button-variant(@color) {
     background-color: @color;
     &:hover {
       background-color: darken(@color, 10%);
     }
   }
   ```

### ❌ DON'T

1. **Don't use unsupported CSS properties:**
   ```less
   /* ❌ Not supported in RN */
   .widget {
     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
     float: left;
     position: absolute;
   }
   
   /* ✅ Use RN equivalents */
   .widget {
     shadow-offset: { width: 0, height: 2 };
     shadow-opacity: 0.1;
   }
   ```

2. **Don't hardcode values:**
   ```less
   /* ❌ Bad */
   .widget {
     padding: 10px;
     color: #007bff;
   }
   
   /* ✅ Good */
   .widget {
     padding: @base-padding;
     color: @brand-primary;
   }
   ```

## Next Steps

- [Styling Guide](./styling-guide.md) - Complete styling reference
- [Style Definitions](./style-definitions.md) - Component style definitions
- [Theme Compilation](./theme-compilation.md) - Compilation details

