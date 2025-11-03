# StyleDefinition Agent

## Overview
The **StyleDefinition Agent** specializes in understanding and managing widget style definitions in the WaveMaker React Native ecosystem. This agent focuses on the declarative style definition system that defines styling capabilities, states, and variants for each widget type, serving as the blueprint for theme compilation and widget styling.

## Domain Expertise

### Primary Focus
- Widget style definition structure and patterns
- Style selector mapping (RN ↔ Studio)
- Style states and variants (focused, disabled, invalid, etc.)
- Theme variable usage in style definitions
- Component-specific styling capabilities
- Style definition provider and registration

### Secondary Knowledge
- Theme compilation process
- LESS variable integration
- Platform-specific style definitions
- Style inheritance patterns
- Default style configurations

---

## Core Responsibilities

### 1. **Style Definition Structure**
Understanding the anatomy and structure of widget style definitions:
- `StyleDefinition` interface and properties
- `ComponentStyle` interface implementation
- Style selector mappings
- Theme variable references
- State-specific style definitions

### 2. **Widget Style Patterns**
Knowledge of different style definition patterns:
- Simple widgets (Button, Label, Icon)
- Input widgets with states (Text, Checkbox, Switch)
- Container widgets (Panel, Tabs, Accordion)
- Data widgets (List, Form, Card)
- Complex widgets (Calendar, Chart, Carousel)

### 3. **Style Selector System**
Managing the mapping between platforms:
- `className`: CSS class name for theme compilation
- `rnStyleSelector`: React Native style path
- `studioStyleSelector`: WaveMaker Studio CSS selector
- Nested selector patterns

### 4. **State Management**
Defining styles for widget states:
- Focus states (focused, active)
- Validation states (invalid, valid)
- Interaction states (disabled, readonly)
- Loading states (skeleton)
- Custom states (floating labels, badges)

---

## Key Files and Locations

### Core Interfaces
```
wavemaker-rn-codegen/src/theme/components/
├── base-style-definition.ts          # StyleDefinition & ComponentStyle interfaces
├── style-definition.provider.ts      # Registry of all widget style definitions
└── [category]/
    └── *.styledef.ts                 # Individual widget style definitions
```

### Widget Style Definitions
```
wavemaker-rn-codegen/src/theme/components/
├── basic/
│   ├── button.styledef.ts           # Button with variants (primary, danger, etc.)
│   ├── label.styledef.ts            # Label styling
│   ├── icon.styledef.ts             # Icon styling
│   ├── picture.styledef.ts          # Picture/Image styling
│   └── ...
├── input/
│   ├── text.styledef.ts             # Text input with states
│   ├── checkbox.styledef.ts         # Checkbox styling
│   ├── select.styledef.ts           # Select/Dropdown styling
│   ├── baseinput.styledef.ts        # Base input styles
│   └── ...
├── container/
│   ├── panel.styledef.ts            # Panel container
│   ├── tabs.styledef.ts             # Tabs container
│   ├── accordion.styledef.ts        # Accordion container
│   └── ...
├── data/
│   ├── list.styledef.ts             # List widget
│   ├── form.styledef.ts             # Form widget
│   ├── card.styledef.ts             # Card widget
│   └── ...
├── navigation/
│   ├── navbar.styledef.ts           # Navigation bar
│   ├── menu.styledef.ts             # Menu component
│   └── ...
└── page/
    ├── page.styledef.ts             # Page container
    ├── page-content.styledef.ts     # Page content area
    └── ...
```

---

## StyleDefinition Interface

### Structure
```typescript
export interface StyleDefinition {
    className: string;              // CSS class name
    rnStyleSelector?: string;       // React Native style path
    studioStyleSelector?: string;   // WaveMaker Studio selector
    style?: any;                    // Style properties
}

export interface ComponentStyle {
    getStyleDefs(): StyleDefinition[];
}
```

### Properties

#### `className`
- **Purpose**: CSS class name used in theme compilation
- **Format**: `.app-{widgetname}[-{element}][-{state}]`
- **Examples**:
  - `.app-button` - Root button class
  - `.app-button-text` - Button text element
  - `.btn-primary.app-button` - Primary button variant
  - `.app-text-focused` - Focused text input

#### `rnStyleSelector`
- **Purpose**: Maps to React Native style object path
- **Format**: `app-{widgetname}.{property}`
- **Examples**:
  - `app-button.root` - Root button styles
  - `app-button.text` - Button text styles
  - `app-text.focused` - Text input focused styles

#### `studioStyleSelector`
- **Purpose**: Maps to WaveMaker Studio CSS selector
- **Used for**: Studio preview consistency
- **Examples**:
  - `.app-button` - Studio button selector
  - `.app-textbox.focused` - Studio focused textbox

#### `style`
- **Purpose**: Default style properties and theme variables
- **Format**: Object with CSS properties
- **Theme Variables**: Prefixed with `@`
- **Examples**:
  ```typescript
  {
      'background-color': '@buttonPrimaryColor',
      'color': '@buttonPrimaryTextColor',
      'border-width': '1px',
      'padding': '10px'
  }
  ```

---

## Style Definition Patterns

### Pattern 1: Simple Widget
Basic widget with root and element styles.

**Example: Label**
```typescript
export default {
    getStyleDefs: () => ([{
        className: '.app-label',
        rnStyleSelector: 'app-label.root',
        studioStyleSelector: '.app-label',
        style: {}
    }, {
        className: '.app-label-text',
        rnStyleSelector: 'app-label.text',
        studioStyleSelector: '.app-label',
        style: {
            color: '@labelTextColor'
        }
    }])
} as ComponentStyle;
```

### Pattern 2: Widget with Variants
Widget with multiple style variants (primary, danger, success, etc.).

**Example: Button**
```typescript
const getButtonStyle = (
    className: string, 
    bgColor: string, 
    color: string, 
    borderColor = bgColor
): StyleDefinition[] => ([{
    className: `.${className}.app-button`,
    style: {
        'border-color': borderColor,
        'background-color': bgColor
    }
}, {
    className: `.${className}.app-button-text`,
    style: {
        color: color
    }
}, {
    className: `.${className}.app-button-badge`,
    style: {
        'background-color': color,
        'color': bgColor,
        'border-color': bgColor
    }
}]);

export default {
    getStyleDefs: () => ([
        // Base styles
        {
            className: '.app-button',
            rnStyleSelector: 'app-button.root',
            style: {}
        },
        // Variant styles
        ...getButtonStyle('btn-primary', '@buttonPrimaryColor', '@buttonPrimaryTextColor'),
        ...getButtonStyle('btn-danger', '@buttonDangerColor', '@buttonDangerTextColor'),
        ...getButtonStyle('btn-success', '@buttonSuccessColor', '@buttonSuccessTextColor'),
        ...getButtonStyle('btn-warning', '@buttonWarningColor', '@buttonWarningTextColor')
    ])
} as ComponentStyle;
```

### Pattern 3: Widget with States
Input widget with focus, invalid, and disabled states.

**Example: Text Input**
```typescript
export default {
    getStyleDefs: () => ([{
        className: '.app-text',
        rnStyleSelector: 'app-text.root',
        style: {
            'border-color': '@inputBorderColor',
            'background-color': '@inputBackgroundColor'
        }
    }, {
        className: '.app-text-text',
        rnStyleSelector: 'app-text.text',
        style: {}
    }, {
        className: '.app-text-focused',
        rnStyleSelector: 'app-text.focused',
        style: {
            'border-color': '@inputFocusBorderColor'
        }
    }, {
        className: '.app-text-invalid',
        rnStyleSelector: 'app-text.invalid',
        style: {
            'border-bottom-color': '@inputInvalidBorderColor'
        }
    }, {
        className: '.app-text-disabled',
        rnStyleSelector: 'app-text-disabled.root',
        style: {}
    }, {
        className: '.app-text-skeleton',
        rnStyleSelector: 'app-text.skeleton',
        style: {}
    }])
} as ComponentStyle;
```

### Pattern 4: Container Widget
Container with multiple child element styles.

**Example: Panel**
```typescript
export default {
    getStyleDefs: () => ([{
        className: '.app-panel',
        rnStyleSelector: 'app-panel.root',
        style: {
            'background-color': '@panelBackgroundColor',
            'border-color': '@panelBorderColor'
        }
    }, {
        className: '.app-panel-heading',
        rnStyleSelector: 'app-panel.heading',
        style: {
            'background-color': '@panelHeaderBackgroundColor'
        }
    }, {
        className: '.app-panel-heading-text',
        rnStyleSelector: 'app-panel.headingText',
        style: {
            color: '@panelHeaderTextColor'
        }
    }, {
        className: '.app-panel-content',
        rnStyleSelector: 'app-panel.content',
        style: {}
    }, {
        className: '.app-panel-footer',
        rnStyleSelector: 'app-panel.footer',
        style: {
            'background-color': '@panelFooterBackgroundColor'
        }
    }])
} as ComponentStyle;
```

### Pattern 5: Nested Components
Widgets with complex nested structure.

**Example: List with Templates**
```typescript
export default {
    getStyleDefs: () => ([{
        className: '.app-list',
        rnStyleSelector: 'app-list.root',
        style: {}
    }, {
        className: '.app-list-item',
        rnStyleSelector: 'app-list.item',
        style: {
            'background-color': '@listItemBackgroundColor',
            'border-bottom-color': '@listItemBorderColor'
        }
    }, {
        className: '.app-list-item-selected',
        rnStyleSelector: 'app-list.itemSelected',
        style: {
            'background-color': '@listItemSelectedBackgroundColor'
        }
    }, {
        className: '.app-list-template',
        rnStyleSelector: 'app-list.template',
        style: {}
    }, {
        className: '.app-list-action-template',
        rnStyleSelector: 'app-list.actionTemplate',
        style: {}
    }])
} as ComponentStyle;
```

---

## Style Selector Naming Conventions

### Class Name Patterns
```typescript
// Root element
'.app-{widgetname}'
// Example: .app-button, .app-text, .app-panel

// Child elements
'.app-{widgetname}-{element}'
// Example: .app-button-text, .app-panel-heading

// States
'.app-{widgetname}-{state}'
// Example: .app-text-focused, .app-button-disabled

// Variants with root
'.{variant}.app-{widgetname}'
// Example: .btn-primary.app-button, .btn-danger.app-button

// Nested elements
'.app-{parent}-{child}-{element}'
// Example: .app-button-icon .app-icon
```

### RN Style Selector Patterns
```typescript
// Root styles
'app-{widgetname}.root'
// Example: app-button.root, app-text.root

// Element styles
'app-{widgetname}.{element}'
// Example: app-button.text, app-panel.heading

// State styles
'app-{widgetname}.{state}'
// Example: app-text.focused, app-text.invalid

// Nested styles
'app-{widgetname}.{parent}.{child}'
// Example: app-list.item.selected
```

---

## Theme Variable Integration

### Variable Naming Convention
```typescript
// Widget-specific variables
@{widgetName}{Property}Color
// Examples:
'@buttonPrimaryColor'
'@buttonPrimaryTextColor'
'@inputBorderColor'
'@inputFocusBorderColor'

// General purpose variables
@{category}{Property}
// Examples:
'@primaryColor'
'@textColor'
'@borderColor'
'@backgroundColor'

// State-specific variables
@{widgetName}{State}{Property}
// Examples:
'@inputFocusBorderColor'
'@inputInvalidBorderColor'
'@buttonHoverColor'
```

### Using Theme Variables
```typescript
// In style definitions
{
    className: '.app-button',
    style: {
        'background-color': '@buttonPrimaryColor',  // Theme variable
        'color': '@buttonPrimaryTextColor',         // Theme variable
        'border-width': '1px',                      // Static value
        'padding': '10px 20px'                      // Static value
    }
}

// With fallbacks
{
    style: {
        'color': '@customTextColor || @textColor',  // Fallback
        'background-color': '@customBg || transparent'
    }
}
```

---

## Style Definition Provider

### Registration System
All widget style definitions are registered in `style-definition.provider.ts`:

```typescript
import ButtonStyleDef from './basic/button.styledef';
import TextStyleDef from './input/text.styledef';
import PanelStyleDef from './container/panel.styledef';
// ... more imports

export class StyleDefinitionProvider {
    private static definitions = new Map<string, ComponentStyle>();

    static {
        // Register all style definitions
        this.register('wm-button', ButtonStyleDef);
        this.register('wm-text', TextStyleDef);
        this.register('wm-panel', PanelStyleDef);
        // ... more registrations
    }

    static register(widgetName: string, styleDef: ComponentStyle) {
        this.definitions.set(widgetName, styleDef);
    }

    static get(widgetName: string): ComponentStyle | undefined {
        return this.definitions.get(widgetName);
    }

    static getAllStyleDefs(): StyleDefinition[] {
        const allDefs: StyleDefinition[] = [];
        this.definitions.forEach(def => {
            allDefs.push(...def.getStyleDefs());
        });
        return allDefs;
    }
}
```

---

## Common Style Definition Elements

### Root Container
Every widget defines a root container style:
```typescript
{
    className: '.app-{widgetname}',
    rnStyleSelector: 'app-{widgetname}.root',
    studioStyleSelector: '.app-{widgetname}',
    style: {
        // Root container styles
    }
}
```

### Text Content
Widgets with text define text styles:
```typescript
{
    className: '.app-{widgetname}-text',
    rnStyleSelector: 'app-{widgetname}.text',
    style: {
        color: '@{widget}TextColor',
        'font-size': '@{widget}FontSize',
        'font-weight': '@{widget}FontWeight'
    }
}
```

### Icons
Widgets with icons define icon styles:
```typescript
{
    className: '.app-{widgetname}-icon',
    rnStyleSelector: 'app-{widgetname}.icon',
    style: {
        color: '@{widget}IconColor',
        'font-size': '@{widget}IconSize'
    }
}
```

### Skeleton/Loading
Widgets support skeleton loading states:
```typescript
{
    className: '.app-{widgetname}-skeleton',
    rnStyleSelector: 'app-{widgetname}.skeleton',
    studioStyleSelector: '.app-{widgetname}-skeleton',
    style: {
        'background-color': '@skeletonBackgroundColor'
    }
}
```

---

## Widget Categories and Patterns

### Basic Widgets
**Characteristics**: Simple, single-purpose widgets
**Examples**: Button, Label, Icon, Picture, Anchor

**Common Elements**:
- `.root` - Main container
- `.text` - Text content
- `.icon` - Icon element
- `.skeleton` - Loading state

### Input Widgets
**Characteristics**: Form inputs with states
**Examples**: Text, Checkbox, Select, Switch, Slider

**Common Elements**:
- `.root` - Input container
- `.text` - Input text
- `.focused` - Focus state
- `.invalid` - Validation state
- `.disabled` - Disabled state
- `.floatingLabel` - Floating label
- `.skeleton` - Loading state

### Container Widgets
**Characteristics**: Layout containers with children
**Examples**: Panel, Tabs, Accordion, LinearLayout

**Common Elements**:
- `.root` - Container root
- `.heading` - Header area
- `.content` - Content area
- `.footer` - Footer area
- `.separator` - Dividers
- `.skeleton` - Loading state

### Data Widgets
**Characteristics**: Data-driven widgets
**Examples**: List, Form, Card, Table

**Common Elements**:
- `.root` - Widget container
- `.item` - Individual items
- `.template` - Item template
- `.header` - Header section
- `.footer` - Footer section
- `.empty` - Empty state
- `.skeleton` - Loading state

### Navigation Widgets
**Characteristics**: Navigation and routing
**Examples**: NavBar, Menu, TabBar, AppNavBar

**Common Elements**:
- `.root` - Nav container
- `.item` - Nav items
- `.active` - Active item
- `.disabled` - Disabled item
- `.separator` - Dividers

---

## Advanced Patterns

### Dynamic Style Functions
For widgets with many variants, use helper functions:

```typescript
// Helper function for button variants
const getButtonStyle = (
    variant: string,
    bgColor: string,
    textColor: string,
    borderColor?: string
): StyleDefinition[] => {
    return [{
        className: `.${variant}.app-button`,
        style: {
            'background-color': bgColor,
            'border-color': borderColor || bgColor
        }
    }, {
        className: `.${variant}.app-button-text`,
        style: {
            color: textColor
        }
    }];
};

// Use helper to generate variants
export default {
    getStyleDefs: () => ([
        ...baseStyles,
        ...getButtonStyle('btn-primary', '@primary', '@white'),
        ...getButtonStyle('btn-danger', '@danger', '@white'),
        ...getButtonStyle('btn-success', '@success', '@white')
    ])
} as ComponentStyle;
```

### Conditional Styles
Styles that apply based on conditions:

```typescript
{
    getStyleDefs: () => {
        const defs: StyleDefinition[] = [{
            className: '.app-widget',
            style: {}
        }];

        // Add platform-specific styles
        if (Platform.OS === 'ios') {
            defs.push({
                className: '.app-widget-ios',
                style: { /* iOS-specific */ }
            });
        }

        return defs;
    }
}
```

### Style Inheritance
Base styles inherited by variants:

```typescript
// Base input styles
const baseInputStyles: StyleDefinition[] = [{
    className: '.app-input',
    style: {
        'border-width': '1px',
        'padding': '10px'
    }
}];

// Text input extends base
export default {
    getStyleDefs: () => ([
        ...baseInputStyles,
        {
            className: '.app-text',
            style: {
                // Specific to text input
            }
        }
    ])
} as ComponentStyle;
```

### Composite Selectors
Multiple selectors for the same element:

```typescript
{
    className: '.app-button.app-button-primary.app-button-large',
    style: {
        // Styles for large primary button
    }
}
```

---

## Style Definition Best Practices

### 1. Naming Consistency
- **Root**: Always name root element `.app-{widgetname}`
- **Elements**: Use descriptive names `.app-{widgetname}-{element}`
- **States**: Use standard state names (focused, disabled, invalid)
- **Variants**: Use semantic names (primary, danger, success)

### 2. Selector Mapping
- **Always map** `rnStyleSelector` to match widget implementation
- **Keep consistent** naming between className and rnStyleSelector
- **Document** any special selector patterns

### 3. Theme Variables
- **Use theme variables** for colors, fonts, spacing
- **Name variables** semantically (`@buttonPrimaryColor` not `@blue`)
- **Provide defaults** in theme files
- **Document** all custom variables

### 4. State Management
- **Define all states** the widget supports
- **Use consistent** state naming across widgets
- **Include skeleton** states for loading
- **Document** state transitions

### 5. Modularity
- **Break down** complex widgets into sub-styles
- **Reuse patterns** across similar widgets
- **Create helpers** for repetitive patterns
- **Keep DRY** (Don't Repeat Yourself)

### 6. Documentation
- **Comment** complex style definitions
- **Document** special cases and platform-specific styles
- **Explain** theme variable usage
- **Provide** examples for each pattern

---

## Integration with Theme System

### Theme Compilation Flow
```
1. Style Definitions (.styledef.ts)
   ↓
2. StyleDefinitionProvider
   ↓
3. Theme Generator
   ↓
4. LESS Compilation
   ↓
5. CSS to RN Styles Conversion
   ↓
6. Runtime Style Objects
```

### Usage in Widget Implementation
```typescript
// In widget component
import { BaseComponent } from '@wavemaker/app-rn-runtime/core';

class WmButton extends BaseComponent {
    // Runtime uses compiled styles
    renderWidget() {
        return (
            <TouchableOpacity
                style={[
                    this.styles.root,           // From .app-button
                    this.props.class === 'btn-primary' && 
                        this.styles.primary,     // From .btn-primary.app-button
                    this.state.focused && 
                        this.styles.focused      // From .app-button-focused
                ]}
            >
                <Text style={this.styles.text}>
                    {this.props.caption}
                </Text>
            </TouchableOpacity>
        );
    }
}
```

---

## Common Questions

### Q: When should I create a new style definition?
**A:** Create a new style definition when:
- Adding a new widget type
- Widget has unique styling needs
- Widget cannot reuse existing style patterns

### Q: How do I handle platform-specific styles?
**A:** Use conditional logic in `getStyleDefs()`:
```typescript
getStyleDefs: () => {
    const defs = [...commonStyles];
    if (Platform.OS === 'ios') {
        defs.push(...iosStyles);
    }
    return defs;
}
```

### Q: Should I define styles for every widget state?
**A:** Define styles for:
- States users can see (focused, disabled, invalid)
- Loading states (skeleton)
- Interactive states (hover, pressed) if applicable
- Skip states that have no visual representation

### Q: How do I override styles from parent widgets?
**A:** Use more specific selectors:
```typescript
// Parent
{ className: '.app-panel .app-button', style: {...} }

// Override with more specific selector
{ className: '.app-form .app-panel .app-button', style: {...} }
```

### Q: Can I use CSS-in-JS in style definitions?
**A:** No, style definitions use CSS properties that are converted to RN styles. Stick to standard CSS properties that have RN equivalents.

---

## Usage Examples

### Example 1: Creating a New Widget Style Definition
```typescript
// components/custom/badge.styledef.ts
import { ComponentStyle, StyleDefinition } from '../base-style-definition';

export default {
    getStyleDefs: () => ([{
        className: '.app-badge',
        rnStyleSelector: 'app-badge.root',
        studioStyleSelector: '.app-badge',
        style: {
            'background-color': '@badgeBackgroundColor',
            'border-radius': '12px',
            'padding': '4px 8px'
        }
    }, {
        className: '.app-badge-text',
        rnStyleSelector: 'app-badge.text',
        style: {
            color: '@badgeTextColor',
            'font-size': '@badgeFontSize',
            'font-weight': 'bold'
        }
    }, {
        className: '.app-badge-dot',
        rnStyleSelector: 'app-badge.dot',
        style: {
            'width': '8px',
            'height': '8px',
            'border-radius': '4px',
            'background-color': '@badgeDotColor'
        }
    }])
} as ComponentStyle;
```

### Example 2: Adding States to Existing Widget
```typescript
// Extend text input with new state
export default {
    getStyleDefs: () => ([
        ...existingDefs,
        {
            className: '.app-text-success',
            rnStyleSelector: 'app-text.success',
            style: {
                'border-color': '@successColor',
                'background-color': '@successBackgroundColor'
            }
        }
    ])
} as ComponentStyle;
```

### Example 3: Creating Style Variants
```typescript
// Size variants for button
const getButtonSizeStyle = (
    size: string,
    fontSize: string,
    padding: string
): StyleDefinition[] => ([{
    className: `.btn-${size}.app-button`,
    style: { padding }
}, {
    className: `.btn-${size}.app-button-text`,
    style: { 'font-size': fontSize }
}]);

export default {
    getStyleDefs: () => ([
        ...baseStyles,
        ...getButtonSizeStyle('small', '12px', '5px 10px'),
        ...getButtonSizeStyle('medium', '14px', '8px 16px'),
        ...getButtonSizeStyle('large', '16px', '12px 24px')
    ])
} as ComponentStyle;
```

---

## Interaction with Other Agents

### Style Agent
- **StyleDefinition Agent** defines the structure
- **Style Agent** compiles and processes the styles
- Style Agent uses definitions from StyleDefinition Agent

### Component Agent
- **Component Agent** implements widgets that use styles
- **StyleDefinition Agent** defines available style classes
- Component Agent references style selectors defined here

### Transformer Agent
- **Transformer Agent** applies style classes during transpilation
- **StyleDefinition Agent** defines valid class names
- Transformer ensures applied classes have definitions

### Generation Agent
- **Generation Agent** uses style definitions in templates
- **StyleDefinition Agent** provides metadata for generation
- Generation Agent creates widget code using defined styles

### Parser Agent
- **Parser Agent** validates style references
- **StyleDefinition Agent** provides valid style names
- Parser checks against defined selectors

---

## Troubleshooting

### Issue: Styles not appearing in compiled theme
**Cause**: Style definition not registered in provider
**Solution**: Add import and registration in `style-definition.provider.ts`

### Issue: Runtime style warnings about missing selectors
**Cause**: `rnStyleSelector` doesn't match widget implementation
**Solution**: Ensure `rnStyleSelector` matches widget's style path

### Issue: Theme variables not resolving
**Cause**: Variable not defined in theme LESS files
**Solution**: Add variable definition to theme variables file

### Issue: State styles not applying
**Cause**: Incorrect className pattern
**Solution**: Verify className matches widget's applied classes

### Issue: Styles different in Studio vs Runtime
**Cause**: `studioStyleSelector` doesn't match `rnStyleSelector`
**Solution**: Align selectors or adjust Studio preview styles

---

## Summary

The **StyleDefinition Agent** is your expert for:
- ✅ Defining widget style structures
- ✅ Creating style variants and states
- ✅ Mapping selectors between platforms
- ✅ Integrating theme variables
- ✅ Establishing style naming conventions
- ✅ Registering widget style definitions

**Key Takeaways**:
1. Every widget has a style definition file (`.styledef.ts`)
2. Style definitions use `StyleDefinition` and `ComponentStyle` interfaces
3. Selectors map CSS classes to React Native style paths
4. Theme variables provide dynamic theming
5. States and variants extend base widget styles
6. All definitions are registered in the provider

For theme compilation and runtime styling, consult the **Style Agent**. For widget implementation details, consult the **Component Agent**.

