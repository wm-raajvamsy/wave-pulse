# Components Overview

## Introduction

WaveMaker Runtime provides 50+ pre-built React Native components (widgets) organized into logical categories. All components extend from `BaseComponent` and follow consistent patterns for props, styling, events, and lifecycle.

## Component Categories

### 1. Basic Widgets
Simple, fundamental UI elements.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmButton** | Clickable button | `caption`, `iconclass`, `onTap` |
| **WmLabel** | Text display | `caption`, `textAlignment` |
| **WmIcon** | Icon display | `iconclass`, `iconsize`, `iconcolor` |
| **WmAnchor** | Hyperlink | `caption`, `hyperlink`, `target` |
| **WmPicture** | Image display | `source`, `resizemode`, `aspectratio` |
| **WmMessage** | Alert/notification | `caption`, `type`, `hideclose` |
| **WmSpinner** | Loading indicator | `type`, `size` |
| **WmSkeleton** | Skeleton loader | `shape`, `width`, `height` |
| **WmProgressBar** | Progress bar | `datavalue`, `minvalue`, `maxvalue` |
| **WmProgressCircle** | Circular progress | `datavalue`, `caption` |
| **WmLottie** | Lottie animation | `source`, `autoplay`, `loop` |
| **WmAudio** | Audio player | `source`, `autoplay`, `controls` |
| **WmVideo** | Video player | `source`, `autoplay`, `controls` |
| **WmTooltip** | Tooltip | `content`, `position` |
| **WmCustom** | Custom content | Children content |

**Location:** `src/components/basic/`

### 2. Container Widgets
Layout and grouping components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmContainer** | Generic container | `height`, `width` |
| **WmPanel** | Panel with header/footer | `title`, `collapsible` |
| **WmTabs** | Tab container | `defaulttab`, `transition` |
| **WmAccordion** | Accordion panels | `closeothers` |
| **WmTile** | Grid tile | `columnwidth`, `itemsperrow` |
| **WmWizard** | Multi-step wizard | `currentstep`, `cancelable` |
| **WmLayoutGrid** | Grid layout | `columns` |
| **WmLinearlayout** | Linear layout | `direction`, `spacing` |

**Location:** `src/components/container/`

### 3. Input Widgets
Form input components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmText** | Text input | `datavalue`, `placeholder`, `type` |
| **WmTextarea** | Multi-line text | `datavalue`, `rows`, `maxchars` |
| **WmNumber** | Number input | `datavalue`, `minvalue`, `maxvalue` |
| **WmCurrency** | Currency input | `datavalue`, `currency`, `step` |
| **WmCheckbox** | Checkbox | `datavalue`, `checkedvalue` |
| **WmToggle** | Toggle switch | `datavalue` |
| **WmRadioset** | Radio buttons | `datavalue`, `dataset` |
| **WmCheckboxset** | Checkbox group | `datavalue`, `dataset` |
| **WmSelect** | Dropdown select | `datavalue`, `dataset`, `datafield` |
| **WmSlider** | Slider input | `datavalue`, `minvalue`, `maxvalue` |
| **WmRating** | Star rating | `datavalue`, `maxvalue` |
| **WmSwitch** | Switch | `datavalue` |
| **WmChips** | Chips input | `dataset` |
| **WmComposite** | Form field composite | `captionposition` |
| **WmDate** | Date picker | `datavalue`, `datepattern` |
| **WmTime** | Time picker | `datavalue`, `timepattern` |
| **WmDatetime** | Date/time picker | `datavalue`, `outputformat` |
| **WmCalendar** | Calendar view | `datavalue`, `controls` |
| **WmFileupload** | File upload | `multiple`, `accept` |

**Location:** `src/components/input/`

### 4. Data Widgets
Data-driven list and form components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmList** | Scrollable list | `dataset`, `itemsperrow`, `groupby` |
| **WmCard** | Data card | `dataset`, `title`, `subheading` |
| **WmForm** | Data form | `dataset`, `formdata` |
| **WmLiveform** | Live data form | `dataset`, `formdata` |

**Location:** `src/components/data/`

### 5. Chart Widgets
Data visualization components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmLineChart** | Line chart | `dataset`, `xaxisdatakey`, `yaxisdatakey` |
| **WmBarChart** | Bar chart | `dataset`, `xaxisdatakey`, `yaxisdatakey` |
| **WmColumnChart** | Column chart | `dataset`, `xaxisdatakey`, `yaxisdatakey` |
| **WmPieChart** | Pie chart | `dataset`, `datakey`, `labelkey` |
| **WmDonutChart** | Donut chart | `dataset`, `datakey`, `labelkey` |
| **WmAreaChart** | Area chart | `dataset`, `xaxisdatakey`, `yaxisdatakey` |
| **WmBubbleChart** | Bubble chart | `dataset`, `xdatakey`, `ydatakey`, `sizedatakey` |
| **WmStackChart** | Stacked bar chart | `dataset`, `xaxisdatakey`, `yaxisdatakey` |

**Location:** `src/components/chart/`

### 6. Navigation Widgets
Navigation and menu components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmMenu** | Menu | `dataset`, `menuposition` |
| **WmNavbar** | Navigation bar | `title`, `dataset` |
| **WmAppnavbar** | App navigation bar | `title`, `backbutton` |
| **WmNav** | Navigation item | `label`, `icon`, `link` |
| **WmNavitem** | Nav item | `label`, `icon`, `action` |
| **WmPopover** | Popover menu | `content`, `contentsource` |

**Location:** `src/components/navigation/`

### 7. Page Widgets
Page-level components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmPage** | Page container | `name`, `onLoad` |
| **WmContent** | Page content area | Children |
| **WmLeftPanel** | Left drawer | Children |
| **WmPageContent** | Page content wrapper | Children |
| **WmPartialContainer** | Partial host | `content` |
| **WmTabbar** | Bottom tab bar | `dataset` |

**Location:** `src/components/page/`

### 8. Device Widgets
Device feature access components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmCamera** | Camera interface | `capture-type`, `onSuccess`, `onError` |
| **WmBarcodescanner** | Barcode scanner | `onSuccess`, `onError` |

**Location:** `src/components/device/`

### 9. Dialog Widgets
Modal dialog components.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmDialog** | Custom dialog | `title`, `modal`, `oktext`, `canceltext` |
| **WmAlertdialog** | Alert dialog | `title`, `message`, `alerttype`, `oktext` |
| **WmConfirmdialog** | Confirm dialog | `title`, `message`, `oktext`, `canceltext` |
| **WmDialogcontent** | Dialog body | Children |
| **WmDialogactions** | Dialog buttons | Children |

**Location:** `src/components/dialogs/`

### 10. Advanced Widgets
Advanced functionality.

| Widget | Purpose | Key Props |
|--------|---------|-----------|
| **WmCarousel** | Image carousel | `dataset`, `autoplay`, `interval` |
| **WmLogin** | Login form | `username`, `password`, `onSuccess` |
| **WmNetworkInfoToaster** | Network status | `showtoaster` |
| **WmWebview** | Web view | `url`, `source` |
| **WmBottomsheet** | Bottom sheet | `content`, `height` |
| **WmModal** | Modal overlay | Children, `onClose` |
| **WmSearch** | Search widget | `dataset`, `searchkey`, `onSubmit` |

**Location:** `src/components/advanced/`

## Common Widget Features

### Props System

All widgets support:

```typescript
// Common props
<WmButton
  name="button1"                  // Widget name
  show={true}                     // Visibility
  disabled={false}                // Disabled state
  classname="custom-class"        // CSS class
  styles={{root: {...}}}          // Inline styles
  width="100"                     // Width
  height="50"                     // Height
  margin="10"                     // Margin
  padding="5"                     // Padding
  backgroundColor="red"           // Background
  color="white"                   // Text color
  showindevice={['xs', 'sm']}     // Responsive visibility
  showskeleton={true}             // Skeleton loader
  listener={{...}}                // Lifecycle callbacks
/>
```

### Event Handlers

Standard event props:

```typescript
<WmButton
  onTap={(event, widget) => {}}           // Tap/click
  onDoubletap={(event, widget) => {}}     // Double tap
  onLongpress={(event, widget) => {}}     // Long press
  onSwipeleft={(event, widget) => {}}     // Swipe left
  onSwiperight={(event, widget) => {}}    // Swipe right
  onSwipeup={(event, widget) => {}}       // Swipe up
  onSwipedown={(event, widget) => {}}     // Swipe down
/>
```

### Data Binding

Bind to variables:

```typescript
// One-way binding
<WmLabel caption={bind:myVariable.dataValue} />

// Two-way binding
<WmText datavalue={bind:myVariable.dataValue} />

// Conditional binding
<WmButton show={bind:isLoggedIn} />

// Expression binding
<WmLabel caption={bind:"Hello " + userName} />
```

### Styling

Multiple styling approaches:

```typescript
// 1. Class name
<WmButton classname="btn-primary" />

// 2. Inline styles
<WmButton styles={{
  root: {backgroundColor: 'blue', borderRadius: 5},
  text: {color: 'white', fontSize: 16}
}} />

// 3. Individual style props
<WmButton 
  width="100"
  height="50"
  backgroundcolor="blue"
  color="white"
/>

// 4. Dynamic styles
<WmButton backgroundcolor={bind:themeColor} />
```

### Accessibility

All widgets support accessibility props:

```typescript
<WmButton
  accessibilityLabel="Submit button"
  accessibilityHint="Tap to submit the form"
  accessibilityRole="button"
/>
```

### Test IDs

Automatic test ID generation:

```typescript
// Widget with name "submitBtn" in page "Login"
// Auto-generates testID="Login_submitBtn"

// Access in tests
await element(by.id('Login_submitBtn')).tap();
```

## Widget Lifecycle

All widgets follow the same lifecycle:

```
1. Constructor → Initialize props, state
2. render() → Generate JSX
3. componentDidMount() → Widget ready
4. Property changes → onPropertyChange() → re-render
5. componentWillUnmount() → Cleanup
```

## Widget Communication

### Parent to Child

```typescript
// Set child property
fragment.Widgets.childButton.caption = "New Text";

// Call child method
fragment.Widgets.childList.refresh();
```

### Child to Parent

```typescript
// Via events
<WmButton onTap={() => {
  // Notify parent
  this.props.onButtonClicked?.();
}} />

// Via callback
<WmList onSelectionchange={(event, widget) => {
  // Parent handles selection
  handleSelection(widget.selecteditem);
}} />
```

### Sibling to Sibling

```typescript
// Via parent/fragment
<WmButton onTap={() => {
  // Update sibling via fragment
  fragment.Widgets.siblingLabel.caption = "Updated";
  fragment.Widgets.siblingList.refresh();
}} />
```

## Performance Optimization

### Lazy Loading

```typescript
// Pages and partials are lazy-loaded by default
const Page1 = React.lazy(() => import('./pages/Page1'));
```

### Virtual Scrolling

```typescript
// Lists use FlatList for virtual scrolling
<WmList
  dataset={largeArray}
  windowSize={10}
  maxToRenderPerBatch={10}
/>
```

### Memoization

```typescript
// Widgets implement shouldComponentUpdate
// Only re-render when props/state actually change
```

## Custom Widgets

Create custom widgets by extending BaseComponent:

```typescript
import { BaseComponent } from '@wavemaker/app-rn-runtime/core/base.component';

export class WmCustomWidget extends BaseComponent<Props, State, Styles> {
  constructor(props) {
    super(props, 'app-custom-widget', defaultProps);
  }
  
  renderWidget(props: Props) {
    return (
      <View style={this.styles.root}>
        {/* Custom UI */}
      </View>
    );
  }
}
```

## Component Documentation

Detailed documentation for each category:

- [Basic Widgets](./basic-widgets.md) - Buttons, labels, icons, images
- [Container Widgets](./container-widgets.md) - Panels, tabs, accordions
- [Input Widgets](./input-widgets.md) - Text, select, date, file inputs
- [Data Widgets](./data-widgets.md) - Lists, cards, forms
- [Chart Widgets](./chart-widgets.md) - Line, bar, pie charts
- [Navigation Widgets](./navigation-widgets.md) - Menus, navbars
- [Device Widgets](./device-widgets.md) - Camera, barcode scanner
- [Dialog Widgets](./dialog-widgets.md) - Alerts, confirms, modals

## Next Steps

- [Basic Widgets](./basic-widgets.md) - Detailed basic widget documentation
- [Container Widgets](./container-widgets.md) - Container widget details
- [Input Widgets](./input-widgets.md) - Input widget reference

