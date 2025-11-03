# CSS and Styling Support

This document covers CSS property support, conversion, variables, platform differences, and styling best practices in WaveMaker React Native.

## Table of Contents

1. [CSS Variables Support](#css-variables-support)
2. [Supported CSS Properties](#supported-css-properties)
3. [Unsupported CSS Properties](#unsupported-css-properties)
4. [CSS Property Conversion](#css-property-conversion)
5. [Shorthand Properties](#shorthand-properties)
6. [Platform-Specific Styles](#platform-specific-styles)
7. [Style Computation](#style-computation)
8. [Dynamic Style Updates](#dynamic-style-updates)

---

## CSS Variables Support

React Native doesn't natively support CSS custom properties (CSS variables), but WaveMaker implements a variable system for theming.

### Theme Variables

**File**: `src/styles/theme.variables.ts`

```typescript
export interface ThemeVariables {
  // Colors
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  
  // Typography
  baseFontSize: number;
  baseFontFamily: string;
  headingFontFamily: string;
  
  // Spacing
  baseSpacing: number;
  borderRadius: number;
  
  // Borders
  borderWidth: number;
  borderColor: string;
  
  // Shadows
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
}
```

### Using Theme Variables

Instead of CSS variables:
```css
/* CSS (Web) */
.button {
  background-color: var(--primary-color);
  font-size: var(--base-font-size);
}
```

Use theme functions in RN:
```typescript
// React Native
import { Theme } from '@wavemaker/app-rn-runtime/styles/theme';

const styles = Theme.compileStyles({
  button: {
    backgroundColor: '$primaryColor',  // Theme variable
    fontSize: '$baseFontSize'
  }
});
```

### Theme Variable Syntax

WaveMaker uses `$` prefix for theme variables in LESS/style definitions:

```less
// In .less file
.wm-button {
  background-color: $primaryColor;
  padding: $baseSpacing;
  border-radius: $borderRadius;
  color: $textColor;
}
```

**Compilation Process**:
1. LESS file with `$variables`
2. Puppeteer computes styles with theme values
3. Converts to React Native style objects
4. Theme variables replaced with actual values

### Runtime Theme Access

```typescript
export default class WmWidget extends BaseComponent {
  getThemedColor() {
    // Access current theme
    const theme = this.theme;
    return theme.variables.primaryColor;
  }

  render() {
    return (
      <ThemeConsumer>
        {(theme: Theme) => (
          <View style={{ backgroundColor: theme.variables.primaryColor }}>
            {/* Content */}
          </View>
        )}
      </ThemeConsumer>
    );
  }
}
```

### Custom Theme Variables

Define custom variables in theme configuration:

```typescript
// theme.config.ts
export const customTheme = {
  variables: {
    // Standard variables
    primaryColor: '#007AFF',
    accentColor: '#FF3B30',
    
    // Custom variables
    cardBackgroundColor: '#FFFFFF',
    cardBorderRadius: 12,
    cardShadowOpacity: 0.1,
    headerHeight: 60,
    footerHeight: 50
  }
};
```

Use in styles:
```typescript
const styles = {
  card: {
    backgroundColor: '$cardBackgroundColor',
    borderRadius: '$cardBorderRadius',
    shadowOpacity: '$cardShadowOpacity'
  }
};
```

---

## Supported CSS Properties

React Native supports a subset of CSS properties with some differences.

### Layout Properties

| CSS Property | RN Property | Support |
|--------------|-------------|---------|
| `display` | `display` | ✓ ('flex', 'none') |
| `flex` | `flex` | ✓ |
| `flex-direction` | `flexDirection` | ✓ |
| `flex-wrap` | `flexWrap` | ✓ |
| `flex-grow` | `flexGrow` | ✓ |
| `flex-shrink` | `flexShrink` | ✓ |
| `flex-basis` | `flexBasis` | ✓ |
| `justify-content` | `justifyContent` | ✓ |
| `align-items` | `alignItems` | ✓ |
| `align-self` | `alignSelf` | ✓ |
| `align-content` | `alignContent` | ✓ |
| `position` | `position` | ✓ ('relative', 'absolute') |
| `top` | `top` | ✓ |
| `right` | `right` | ✓ |
| `bottom` | `bottom` | ✓ |
| `left` | `left` | ✓ |
| `width` | `width` | ✓ |
| `height` | `height` | ✓ |
| `min-width` | `minWidth` | ✓ |
| `max-width` | `maxWidth` | ✓ |
| `min-height` | `minHeight` | ✓ |
| `max-height` | `maxHeight` | ✓ |

### Spacing Properties

| CSS Property | RN Property | Support |
|--------------|-------------|---------|
| `margin` | `margin` | ✓ |
| `margin-top` | `marginTop` | ✓ |
| `margin-right` | `marginRight` | ✓ |
| `margin-bottom` | `marginBottom` | ✓ |
| `margin-left` | `marginLeft` | ✓ |
| `padding` | `padding` | ✓ |
| `padding-top` | `paddingTop` | ✓ |
| `padding-right` | `paddingRight` | ✓ |
| `padding-bottom` | `paddingBottom` | ✓ |
| `padding-left` | `paddingLeft` | ✓ |

### Border Properties

| CSS Property | RN Property | Support |
|--------------|-------------|---------|
| `border-width` | `borderWidth` | ✓ |
| `border-color` | `borderColor` | ✓ |
| `border-style` | `borderStyle` | ✓ ('solid', 'dotted', 'dashed') |
| `border-radius` | `borderRadius` | ✓ |
| `border-top-width` | `borderTopWidth` | ✓ |
| `border-right-width` | `borderRightWidth` | ✓ |
| `border-bottom-width` | `borderBottomWidth` | ✓ |
| `border-left-width` | `borderLeftWidth` | ✓ |
| `border-top-left-radius` | `borderTopLeftRadius` | ✓ |
| `border-top-right-radius` | `borderTopRightRadius` | ✓ |
| `border-bottom-left-radius` | `borderBottomLeftRadius` | ✓ |
| `border-bottom-right-radius` | `borderBottomRightRadius` | ✓ |

### Background Properties

| CSS Property | RN Property | Support |
|--------------|-------------|---------|
| `background-color` | `backgroundColor` | ✓ |
| `opacity` | `opacity` | ✓ |

### Text Properties

| CSS Property | RN Property | Support | Component |
|--------------|-------------|---------|-----------|
| `color` | `color` | ✓ | Text |
| `font-family` | `fontFamily` | ✓ | Text |
| `font-size` | `fontSize` | ✓ | Text |
| `font-style` | `fontStyle` | ✓ | Text |
| `font-weight` | `fontWeight` | ✓ | Text |
| `line-height` | `lineHeight` | ✓ | Text |
| `text-align` | `textAlign` | ✓ | Text |
| `text-decoration-line` | `textDecorationLine` | ✓ | Text |
| `text-decoration-color` | `textDecorationColor` | ✓ | Text |
| `text-decoration-style` | `textDecorationStyle` | ✓ | Text |
| `text-transform` | `textTransform` | ✓ | Text |
| `letter-spacing` | `letterSpacing` | ✓ | Text |

### Shadow Properties

| CSS Property | RN Property | Support | Platform |
|--------------|-------------|---------|----------|
| `shadow-color` | `shadowColor` | ✓ | Both |
| `shadow-offset` | `shadowOffset` | ✓ | iOS |
| `shadow-opacity` | `shadowOpacity` | ✓ | iOS |
| `shadow-radius` | `shadowRadius` | ✓ | iOS |
| - | `elevation` | ✓ | Android |

### Transform Properties

| CSS Property | RN Property | Support |
|--------------|-------------|---------|
| `transform` | `transform` | ✓ (array format) |
| - | `translateX` | ✓ |
| - | `translateY` | ✓ |
| - | `scale` | ✓ |
| - | `scaleX` | ✓ |
| - | `scaleY` | ✓ |
| - | `rotate` | ✓ |
| - | `rotateX` | ✓ |
| - | `rotateY` | ✓ |
| - | `rotateZ` | ✓ |
| - | `skewX` | ✓ |
| - | `skewY` | ✓ |

---

## Unsupported CSS Properties

Many CSS properties don't work in React Native.

### Unsupported Layout Properties

| CSS Property | Why Unsupported | Alternative |
|--------------|-----------------|-------------|
| `float` | RN uses flexbox only | Use `flexDirection` |
| `clear` | No float support | Use flexbox |
| `display: block` | Only 'flex' and 'none' | Use `flexDirection: 'column'` |
| `display: inline` | Not supported | Use separate views |
| `display: grid` | Not supported | Use flexbox or FlatList |
| `z-index` | Limited support | Use `elevation` (Android) or render order |

### Unsupported Box Model

| CSS Property | Why Unsupported | Alternative |
|--------------|-----------------|-------------|
| `box-sizing` | Always border-box | N/A |
| `overflow: scroll` | Not on View | Use ScrollView |
| `overflow: auto` | Not supported | Use ScrollView |
| `overflow-x` | Not supported | ScrollView horizontal prop |
| `overflow-y` | Not supported | ScrollView vertical prop |

### Unsupported Typography

| CSS Property | Why Unsupported | Alternative |
|--------------|-----------------|-------------|
| `text-overflow: ellipsis` | Different prop | `numberOfLines` + `ellipsizeMode` |
| `white-space` | Not supported | Text wrapping automatic |
| `word-break` | Not supported | Limited control |
| `font-variant` | Limited | Use different fonts |

### Unsupported Visual Effects

| CSS Property | Why Unsupported | Alternative |
|--------------|-----------------|-------------|
| `box-shadow` | Different syntax | `shadowColor`, `shadowOffset`, etc. |
| `text-shadow` | Different syntax | `textShadowColor`, `textShadowOffset` |
| `background-image` | Not on View | Use Image or ImageBackground |
| `background-gradient` | Not supported | Use LinearGradient component |
| `filter` | Not supported | Use Animated or custom implementations |
| `backdrop-filter` | Not supported | Use BlurView component |

### Unsupported Pseudo-classes/elements

| CSS Feature | Why Unsupported | Alternative |
|-------------|-----------------|-------------|
| `:hover` | Touch interface | Use Pressable with pressed state |
| `:active` | Different model | Use Pressable |
| `:focus` | Different model | Use onFocus/onBlur handlers |
| `::before` | Not supported | Add separate View |
| `::after` | Not supported | Add separate View |
| `::placeholder` | Different prop | `placeholderTextColor` prop |

---

## CSS Property Conversion

How WaveMaker converts CSS to React Native styles.

### Conversion Process

```
┌─────────────────────────────────────────────────────────────┐
│              CSS TO RN CONVERSION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. LESS Source                                              │
│     .wm-button {                                             │
│       background-color: #007AFF;                             │
│       padding: 10px;                                         │
│       border-radius: 5px;                                    │
│     }                                                        │
│                                                              │
│  2. Puppeteer Computation                                    │
│     ├─→ Parse LESS                                           │
│     ├─→ Compute CSS values                                   │
│     └─→ Extract computed styles                              │
│                                                              │
│  3. Property Name Conversion                                 │
│     background-color → backgroundColor                       │
│     border-radius → borderRadius                             │
│                                                              │
│  4. Unit Conversion                                          │
│     10px → 10 (number)                                       │
│     1.5em → calculated pixel value                           │
│     50% → '50%' (string)                                     │
│                                                              │
│  5. Value Transformation                                     │
│     Colors, fonts, transforms, etc.                          │
│                                                              │
│  6. React Native Style Object                                │
│     {                                                        │
│       backgroundColor: '#007AFF',                            │
│       padding: 10,                                           │
│       borderRadius: 5                                        │
│     }                                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Name Conversion

CSS kebab-case to JavaScript camelCase:

```typescript
const propertyMap = {
  'background-color': 'backgroundColor',
  'border-radius': 'borderRadius',
  'border-top-width': 'borderTopWidth',
  'flex-direction': 'flexDirection',
  'justify-content': 'justifyContent',
  'align-items': 'alignItems',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'line-height': 'lineHeight',
  'margin-top': 'marginTop',
  'padding-left': 'paddingLeft',
  // ... etc
};
```

### Unit Conversion

```typescript
// Pixels: Remove 'px' suffix
'10px' → 10

// Percentages: Keep as string
'50%' → '50%'

// Em/Rem: Convert to pixels based on base font size
'1.5em' → 24  // If base font is 16px

// Other units: Convert or ignore
'10pt' → converted value
'10in' → converted value
'10vh' → may not work properly
```

### Color Conversion

```typescript
// Named colors
'red' → '#FF0000'

// Hex colors
'#007AFF' → '#007AFF'

// RGB
'rgb(0, 122, 255)' → 'rgb(0, 122, 255)'

// RGBA
'rgba(0, 122, 255, 0.5)' → 'rgba(0, 122, 255, 0.5)'

// HSL (converted to RGB/Hex)
'hsl(211, 100%, 50%)' → '#007AFF'
```

---

## Shorthand Properties

React Native supports some CSS shorthand properties.

### Margin and Padding

```typescript
// Shorthand
margin: 10  // All sides
margin: '10 20'  // Vertical Horizontal (NOT STANDARD, use separate)

// Expanded (Recommended)
marginTop: 10
marginRight: 10
marginBottom: 10
marginLeft: 10

// Better practice: Use individual properties or specific shorthands
marginVertical: 10  // Top and bottom
marginHorizontal: 20  // Left and right

paddingVertical: 10
paddingHorizontal: 20
```

### Border

```typescript
// NOT supported as shorthand
border: '1px solid #000'  // ✗

// Must use individual properties
borderWidth: 1
borderColor: '#000'
borderStyle: 'solid'
```

### Font

```typescript
// NOT supported as shorthand
font: '14px Arial'  // ✗

// Must use individual properties
fontSize: 14
fontFamily: 'Arial'
fontWeight: 'normal'
fontStyle: 'normal'
```

### Transform

```typescript
// Array format (RN specific)
transform: [
  { translateX: 10 },
  { translateY: 20 },
  { rotate: '45deg' },
  { scale: 1.5 }
]

// NOT supported
transform: 'translateX(10px) translateY(20px) rotate(45deg) scale(1.5)'  // ✗
```

### Shadow

```typescript
// iOS: Individual properties
shadowColor: '#000'
shadowOffset: { width: 0, height: 2 }
shadowOpacity: 0.25
shadowRadius: 3.84

// Android: Elevation
elevation: 5

// NOT supported
box-shadow: '0 2px 4px rgba(0,0,0,0.25)'  // ✗
```

---

## Platform-Specific Styles

Different styles for iOS and Android.

### Using Platform.select

```typescript
import { Platform } from 'react-native';

const styles = {
  container: {
    padding: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
};
```

### Platform-Specific Style Files

Create separate style files:

```
button.styles.ios.ts
button.styles.android.ts
button.styles.ts  // Common styles
```

Import automatically based on platform:
```typescript
import styles from './button.styles';  // Loads .ios or .android
```

### Common Platform Differences

| Feature | iOS | Android |
|---------|-----|---------|
| Shadows | shadowColor, shadowOffset, shadowOpacity, shadowRadius | elevation |
| Status Bar | Light content default | Dark content default |
| Navigation | Back swipe gesture | Hardware back button |
| Typography | San Francisco font | Roboto font |
| Ripple | Not supported | Native ripple effect |
| Date Picker | Inline picker | Modal dialog |

### Shadow Helper Function

```typescript
function createShadow(elevation: number) {
  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: elevation / 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: elevation,
    },
    android: {
      elevation,
    },
  });
}

// Usage
const styles = {
  card: {
    ...createShadow(5),
    backgroundColor: '#fff',
    borderRadius: 8,
  },
};
```

---

## Style Computation

How WaveMaker computes final styles.

### Puppeteer-Based Computation

**File**: `wavemaker-rn-codegen/src/theme/theme.service.ts`

1. **Launch Puppeteer**: Headless Chrome browser
2. **Load HTML**: Markup with styles
3. **Apply Theme**: Inject theme variables
4. **Compute Styles**: Get computed styles via `getComputedStyle()`
5. **Extract Properties**: Convert to RN-compatible format
6. **Generate Style Objects**: Write to TypeScript files

```typescript
async computeStyles(markup: string, theme: Theme) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load markup with theme
  await page.setContent(`
    <html>
      <head><style>${theme.css}</style></head>
      <body>${markup}</body>
    </html>
  `);
  
  // Compute styles for each element
  const styles = await page.evaluate(() => {
    const elements = document.querySelectorAll('[class]');
    const result = {};
    
    elements.forEach(el => {
      const computed = window.getComputedStyle(el);
      const className = el.className;
      
      result[className] = {
        backgroundColor: computed.backgroundColor,
        color: computed.color,
        fontSize: parseInt(computed.fontSize),
        padding: parseInt(computed.padding),
        // ... extract all properties
      };
    });
    
    return result;
  });
  
  await browser.close();
  return styles;
}
```

### Style Priority

Styles are merged with the following priority (highest to lowest):

1. **Inline Styles**: Passed directly to component
2. **Dynamic Styles**: Computed at runtime
3. **Component Styles**: From `.styles.ts` file
4. **Theme Styles**: From theme compilation
5. **Default Styles**: Component defaults

```typescript
const finalStyles = [
  defaultStyles,    // Lowest priority
  themeStyles,
  componentStyles,
  dynamicStyles,
  inlineStyles      // Highest priority
];
```

### Style Merging

```typescript
// Deep merge function
function deepMerge(...objects: any[]) {
  return objects.reduce((acc, obj) => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        acc[key] = deepMerge(acc[key] || {}, obj[key]);
      } else {
        acc[key] = obj[key];
      }
    });
    return acc;
  }, {});
}

// Usage
const merged = deepMerge(
  defaultStyles,
  themeStyles,
  componentStyles
);
```

---

## Dynamic Style Updates

Updating styles at runtime.

### setState for Dynamic Styles

```typescript
export default class WmWidget extends BaseComponent {
  handlePress() {
    // Update state to trigger style change
    this.updateState({ 
      isActive: true 
    });
  }

  render() {
    const dynamicStyles = this.state.isActive
      ? { backgroundColor: '#007AFF' }
      : { backgroundColor: '#CCCCCC' };
    
    return (
      <View style={[this.styles.root, dynamicStyles]}>
        {/* Content */}
      </View>
    );
  }
}
```

### Animated Styles

Using React Native Animated:

```typescript
import { Animated } from 'react-native';

export default class WmAnimatedWidget extends BaseComponent {
  private animatedValue = new Animated.Value(0);

  componentDidMount() {
    Animated.timing(this.animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  render() {
    const animatedStyle = {
      opacity: this.animatedValue,
      transform: [{
        scale: this.animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      }],
    };
    
    return (
      <Animated.View style={[this.styles.root, animatedStyle]}>
        {/* Content */}
      </Animated.View>
    );
  }
}
```

### Theme-Based Dynamic Styles

```typescript
export default class WmThemedWidget extends BaseComponent {
  render() {
    return (
      <ThemeConsumer>
        {(theme: Theme) => {
          const dynamicStyles = {
            backgroundColor: theme.variables.primaryColor,
            color: theme.variables.textColor,
          };
          
          return (
            <View style={[this.styles.root, dynamicStyles]}>
              {/* Content */}
            </View>
          );
        }}
      </ThemeConsumer>
    );
  }
}
```

### Responsive Styles

Based on viewport dimensions:

```typescript
import viewport from '@wavemaker/app-rn-runtime/core/viewport';

export default class WmResponsiveWidget extends BaseComponent {
  getResponsiveStyles() {
    const isLandscape = viewport.width > viewport.height;
    
    return isLandscape
      ? { flexDirection: 'row', padding: 20 }
      : { flexDirection: 'column', padding: 10 };
  }

  render() {
    return (
      <View style={[this.styles.root, this.getResponsiveStyles()]}>
        {/* Content */}
      </View>
    );
  }
}
```

---

## Best Practices

### 1. Use StyleSheet.create

```typescript
// Good: Optimized
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});

// Bad: Creates new object on every render
<View style={{ flex: 1, padding: 10 }} />
```

### 2. Extract Conditional Styles

```typescript
// Good
const dynamicStyle = isActive ? styles.active : styles.inactive;
<View style={[styles.base, dynamicStyle]} />

// Bad
<View style={[styles.base, isActive && styles.active, !isActive && styles.inactive]} />
```

### 3. Use Platform-Specific Shadows

```typescript
// Good: Works on both platforms
const shadowStyle = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  android: {
    elevation: 5,
  },
});
```

### 4. Avoid Deeply Nested Styles

```typescript
// Bad: Hard to maintain
const styles = {
  container: {
    view: {
      inner: {
        text: {
          // ...
        }
      }
    }
  }
};

// Good: Flat structure
const styles = {
  container: { /* ... */ },
  innerView: { /* ... */ },
  text: { /* ... */ },
};
```

### 5. Use Numeric Values When Possible

```typescript
// Good: Faster
fontSize: 16
padding: 10

// Bad: Slower (string parsing)
fontSize: '16px'
padding: '10px'
```

---

## Summary

CSS support in React Native:

- **No CSS Variables**: Use theme variables with `$` prefix
- **Limited Properties**: Subset of CSS supported
- **CamelCase Names**: `background-color` → `backgroundColor`
- **Numeric Values**: Numbers for pixels, strings for percentages
- **Platform Differences**: iOS shadows vs Android elevation
- **Puppeteer Computation**: Server-side style computation
- **Dynamic Updates**: Via state, themes, or Animated

Understanding these limitations and patterns enables effective styling in WaveMaker React Native applications.

