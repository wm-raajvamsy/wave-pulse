# Formatter Agent - Detailed Documentation

## Overview

The **Formatter Agent** is the expert on code formatting and data formatting in WaveMaker React Native. It understands how generated code is beautified and how data is formatted for display.

## Domain Expertise

### Core Responsibilities

1. **Code Formatting**
   - JavaScript/JSX formatting
   - Indentation rules
   - Line break rules
   - Spacing rules

2. **Data Formatting**
   - Number formatting
   - Date/time formatting
   - Currency formatting
   - Custom formatters

3. **Output Beautification**
   - Code prettification
   - Consistent styling
   - Readability optimization

## Code Formatting

### Formatter Implementation

**Location**: `wavemaker-rn-codegen/src/fomatter.ts`

```typescript
export function prependSpace(str: string): string {
  return str ? ' ' + str : '';
}

export function appendSpace(str: string): string {
  return str ? str + ' ' : '';
}

export function formatCode(code: string): string {
  // 1. Normalize whitespace
  code = code.replace(/\s+/g, ' ').trim();
  
  // 2. Add line breaks
  code = code.replace(/;/g, ';\n');
  code = code.replace(/{/g, '{\n');
  code = code.replace(/}/g, '\n}');
  
  // 3. Indent
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentedLines = lines.map(line => {
    line = line.trim();
    
    // Decrease indent for closing braces
    if (line.startsWith('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    // Apply indent
    const indented = '  '.repeat(indentLevel) + line;
    
    // Increase indent for opening braces
    if (line.endsWith('{')) {
      indentLevel++;
    }
    
    return indented;
  });
  
  return indentedLines.join('\n');
}

export function formatJSX(jsx: string): string {
  // 1. Add line breaks for readability
  jsx = jsx.replace(/<(\w+)/g, '\n<$1');
  jsx = jsx.replace(/><(\w+)/g, '>\n<$1');
  jsx = jsx.replace(/<\/(\w+)>/g, '</$1>\n');
  
  // 2. Indent
  const lines = jsx.split('\n').filter(line => line.trim());
  let indentLevel = 0;
  
  const formatted = lines.map(line => {
    const trimmed = line.trim();
    
    // Closing tag
    if (trimmed.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    
    const indented = '  '.repeat(indentLevel) + trimmed;
    
    // Opening tag
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      indentLevel++;
    }
    
    return indented;
  });
  
  return formatted.join('\n');
}
```

### Formatting Rules

```typescript
// Indentation: 2 spaces
const INDENT = '  ';

// Line length: 80-100 characters preferred
const MAX_LINE_LENGTH = 100;

// Brace style: same line for opening, new line for closing
if (condition) {
  // code
}

// Function declarations
function myFunction(param1, param2) {
  return result;
}

// Arrow functions
const myFunction = (param1, param2) => {
  return result;
};

// JSX formatting
<Component
  prop1="value1"
  prop2="value2"
>
  <ChildComponent />
</Component>

// Object literals
const obj = {
  key1: 'value1',
  key2: 'value2'
};

// Array literals
const arr = [
  'item1',
  'item2',
  'item3'
];
```

## Data Formatters

### Number Formatting

**Location**: `wavemaker-rn-runtime/src/core/formatters.ts`

```typescript
/**
 * Format number with thousand separators
 */
export function formatNumber(
  value: number,
  decimals: number = 0,
  decimalSeparator: string = '.',
  thousandSeparator: string = ','
): string {
  const fixed = value.toFixed(decimals);
  const parts = fixed.split('.');
  
  // Add thousand separators
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
  
  return parts.join(decimalSeparator);
}

/**
 * Format as currency
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * Format as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = 0
): string {
  return (value * 100).toFixed(decimals) + '%';
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return size.toFixed(2) + ' ' + units[unitIndex];
}

// Usage examples
formatNumber(1234567.89, 2);           // '1,234,567.89'
formatCurrency(99.99, 'USD');          // '$99.99'
formatPercentage(0.75, 0);             // '75%'
formatFileSize(1536);                  // '1.50 KB'
```

### Date/Time Formatting

```typescript
import moment from 'moment';

/**
 * Format date
 */
export function formatDate(
  date: Date | string,
  format: string = 'MM/DD/YYYY'
): string {
  return moment(date).format(format);
}

/**
 * Format time
 */
export function formatTime(
  date: Date | string,
  format: string = 'HH:mm:ss'
): string {
  return moment(date).format(format);
}

/**
 * Format date time
 */
export function formatDateTime(
  date: Date | string,
  format: string = 'MM/DD/YYYY HH:mm:ss'
): string {
  return moment(date).format(format);
}

/**
 * Parse date string
 */
export function toDate(
  value: string | Date,
  format?: string
): Date {
  if (value instanceof Date) {
    return value;
  }
  
  if (format) {
    return moment(value, format).toDate();
  }
  
  return moment(value).toDate();
}

/**
 * Relative time
 */
export function fromNow(date: Date | string): string {
  return moment(date).fromNow();
}

// Usage examples
formatDate(new Date(), 'YYYY-MM-DD');           // '2025-11-03'
formatTime(new Date(), 'hh:mm A');              // '02:30 PM'
formatDateTime(new Date());                     // '11/03/2025 02:30:45'
fromNow(new Date(2025, 10, 1));                // '2 days ago'
toDate('2025-11-03', 'YYYY-MM-DD');            // Date object
```

### String Formatting

```typescript
/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Title case
 */
export function titleCase(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

/**
 * Uppercase
 */
export function uppercase(str: string): string {
  return str.toUpperCase();
}

/**
 * Lowercase
 */
export function lowercase(str: string): string {
  return str.toLowerCase();
}

/**
 * Truncate with ellipsis
 */
export function truncate(
  str: string,
  length: number,
  ellipsis: string = '...'
): string {
  if (str.length <= length) {
    return str;
  }
  
  return str.substring(0, length - ellipsis.length) + ellipsis;
}

/**
 * Pluralize
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 1) {
    return `${count} ${singular}`;
  }
  
  return `${count} ${plural || singular + 's'}`;
}

// Usage examples
capitalize('hello world');              // 'Hello world'
titleCase('hello world');               // 'Hello World'
uppercase('hello');                     // 'HELLO'
lowercase('HELLO');                     // 'hello'
truncate('Long text here', 10);         // 'Long te...'
pluralize(1, 'item');                   // '1 item'
pluralize(5, 'item');                   // '5 items'
pluralize(2, 'child', 'children');      // '2 children'
```

## Custom Formatters

### Creating Custom Formatter

```typescript
/**
 * Custom phone number formatter
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return phone;
}

/**
 * Custom social security number formatter
 */
export function formatSSN(ssn: string): string {
  const cleaned = ssn.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{2})(\d{4})$/);
  
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  return ssn;
}

/**
 * Custom credit card formatter
 */
export function formatCreditCard(card: string): string {
  const cleaned = card.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g);
  
  return groups ? groups.join(' ') : card;
}

// Usage
formatPhoneNumber('1234567890');        // '(123) 456-7890'
formatSSN('123456789');                 // '123-45-6789'
formatCreditCard('1234567890123456');   // '1234 5678 9012 3456'
```

## Usage in Components

### Inline Formatting

```tsx
<WmLabel 
  caption={this.formatCurrency(100, 'USD')} 
/>

<WmLabel 
  caption={this.formatDate(new Date(), 'YYYY-MM-DD')} 
/>

<WmLabel 
  caption={this.formatNumber(1234567.89, 2)} 
/>
```

### Computed Properties

```typescript
class MyPage extends BasePage<...> {
  get formattedTotal(): string {
    const total = this.Variables.cart.dataSet.items
      .reduce((sum, item) => sum + item.price, 0);
    
    return this.formatCurrency(total, 'USD');
  }
  
  get formattedDate(): string {
    return this.formatDateTime(new Date());
  }
  
  renderWidget(props) {
    return (
      <View>
        <WmLabel caption={`Total: ${this.formattedTotal}`} />
        <WmLabel caption={`Date: ${this.formattedDate}`} />
      </View>
    );
  }
}
```

## Agent Capabilities

### 1. Explain Formatting

**Query**: "How is generated code formatted?"

**Response**: Complete explanation of code formatting rules

### 2. Data Formatting

**Query**: "How to format currency?"

**Response**: Currency formatting guide with examples

### 3. Custom Formatters

**Query**: "How to create custom formatter?"

**Response**: Step-by-step formatter creation guide

## Best Practices

### Code Formatting

1. **Consistency**: Use consistent formatting rules
2. **Readability**: Prioritize readability over brevity
3. **Automation**: Use formatters automatically
4. **Standards**: Follow JavaScript/React conventions

### Data Formatting

1. **Localization**: Support different locales
2. **Null Safety**: Handle null/undefined values
3. **Type Checking**: Validate input types
4. **Performance**: Cache formatted values when appropriate

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Code & Data Formatting

