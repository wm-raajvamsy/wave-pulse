# Navigation System

## Overview

WaveMaker React Native uses React Navigation for managing app navigation with support for stack navigation, drawer navigation, and tab bars.

## Navigation Architecture

```
App.tsx
  └─ App.navigator.tsx
      ├─ DrawerNavigator (if leftpanel exists)
      │   └─ StackNavigator
      │       ├─ Page1
      │       ├─ Page2
      │       └─ Page3
      └─ StackNavigator (no leftpanel)
          ├─ Page1
          ├─ Page2
          └─ Page3
```

## Navigator Types

### Stack Navigator

Default navigation pattern for pages.

```typescript
<Stack.Navigator
  screenOptions={{
    headerShown: false,
    animation: 'default'
  }}
>
  <Stack.Screen name="Page1" component={Page1} />
  <Stack.Screen name="Page2" component={Page2} />
</Stack.Navigator>
```

### Drawer Navigator

Left/right panel navigation.

```typescript
<Drawer.Navigator
  drawerContent={(props) => <LeftPanel {...props} />}
  screenOptions={{
    drawerPosition: 'left',
    drawerType: 'front'
  }}
>
  <Drawer.Screen name="MainStack" component={StackNavigator} />
</Drawer.Navigator>
```

### Tab Navigator

Bottom tab bar navigation.

```typescript
<Tab.Navigator
  tabBar={(props) => <WmTabbar {...props} />}
>
  <Tab.Screen name="Home" component={HomePage} />
  <Tab.Screen name="Profile" component={ProfilePage} />
</Tab.Navigator>
```

## Navigation API

### NavigationService Methods

```typescript
// Navigate to page
NavigationService.goToPage(pageName: string, params?: any): void

// Go back
NavigationService.goBack(): void

// Check if can go back
NavigationService.canGoBack(): boolean

// Open drawer
NavigationService.openDrawer(): void

// Close drawer
NavigationService.closeDrawer(): void

// Toggle drawer
NavigationService.toggleDrawer(): void

// Get current page
NavigationService.getCurrentPage(): string
```

### Usage Examples

```typescript
// Navigate to page with parameters
NavigationService.goToPage('UserProfile', {
  userId: 123,
  tab: 'settings'
});

// Navigate back
if (NavigationService.canGoBack()) {
  NavigationService.goBack();
}

// Open left panel
NavigationService.openDrawer();
```

## Page Parameters

### Passing Parameters

```typescript
// From widget event
<WmButton onTap={() => {
  fragment.appConfig.NavigationService.goToPage('ProductDetails', {
    productId: item.id,
    category: item.category
  });
}} />

// From page script
export default {
  navigateToDetails() {
    this.appConfig.NavigationService.goToPage('Details', {
      data: this.Variables.selectedItem.dataValue
    });
  }
}
```

### Receiving Parameters

```typescript
// In page component
export default function ProductDetailsPage({ route }) {
  const { productId, category } = route.params || {};
  
  // Use parameters
  useEffect(() => {
    if (productId) {
      loadProduct(productId);
    }
  }, [productId]);
}

// In page script
export default {
  onPageReady() {
    // Access via this.routeParams
    const productId = this.routeParams.productId;
    this.Variables.productVar.setInput('id', productId);
    this.Variables.productVar.invoke();
  }
}
```

## Navigation Transitions

### Default Transitions

- **iOS:** Slide from right
- **Android:** Fade with slight slide
- **Web:** Fade

### Custom Transitions

```typescript
// In App.navigator.tsx
<Stack.Screen
  name="Page2"
  component={Page2}
  options={{
    animation: 'slide_from_bottom',
    // or: 'fade', 'slide_from_right', 'slide_from_left', 'none'
  }}
/>
```

## Navigation Guards

### Prevent Navigation

```typescript
// In page component
useEffect(() => {
  const unsubscribe = navigation.addListener('beforeRemove', (e) => {
    if (!saved) {
      // Prevent navigation
      e.preventDefault();
      
      // Show confirmation dialog
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes.',
        [
          { text: "Don't leave", style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action)
          }
        ]
      );
    }
  });
  
  return unsubscribe;
}, [navigation, saved]);
```

## Deep Linking

### Configuration

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "web": {
      "linking": {
        "prefixes": ["myapp://", "https://myapp.com"]
      }
    }
  }
}
```

### Linking Configuration

```typescript
// App.navigator.tsx
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      UserProfile: 'user/:userId',
      ProductDetails: 'product/:productId'
    }
  }
};

<NavigationContainer linking={linking}>
  {/* navigators */}
</NavigationContainer>
```

### Handling Deep Links

```
myapp://user/123
→ Navigates to UserProfile with userId=123

https://myapp.com/product/456
→ Navigates to ProductDetails with productId=456
```

## Page Lifecycle Events

### Navigation Events

```typescript
// In page component
useEffect(() => {
  // Page focused
  const focusUnsubscribe = navigation.addListener('focus', () => {
    console.log('Page focused');
    refreshData();
  });
  
  // Page blurred
  const blurUnsubscribe = navigation.addListener('blur', () => {
    console.log('Page blurred');
    saveState();
  });
  
  return () => {
    focusUnsubscribe();
    blurUnsubscribe();
  };
}, [navigation]);
```

### Available Events

- `focus`: Page comes into view
- `blur`: Page goes out of view
- `beforeRemove`: Before page is removed from stack
- `state`: Navigation state changed

## Back Button Handling

### Android Hardware Back Button

```typescript
// In page component
useEffect(() => {
  const backHandler = BackHandler.addEventListener(
    'hardwareBackPress',
    () => {
      if (shouldPreventBack) {
        // Handle back button
        return true; // Prevent default
      }
      return false; // Allow default
    }
  );
  
  return () => backHandler.remove();
}, [shouldPreventBack]);
```

## Navigation State

### Get Navigation State

```typescript
// Current page
const currentPage = NavigationService.getCurrentPage();

// Navigation state
const state = NavigationService.getNavigationState();
console.log(state.routes); // All routes in stack
```

### Reset Navigation

```typescript
// Reset to specific screen
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }]
});
```

## Best Practices

### ✅ DO

1. **Use NavigationService for navigation:**
   ```typescript
   NavigationService.goToPage('Page2');
   ```

2. **Pass minimal data in params:**
   ```typescript
   // ✅ Good
   goToPage('Details', { id: 123 });
   
   // ❌ Bad
   goToPage('Details', { fullObject: largeData });
   ```

3. **Handle navigation errors:**
   ```typescript
   try {
     NavigationService.goToPage('Page2');
   } catch (error) {
     console.error('Navigation failed:', error);
   }
   ```

### ❌ DON'T

1. **Don't navigate during render:**
   ```typescript
   // ❌ Wrong
   function MyComponent() {
     NavigationService.goToPage('Page2');
     return <View />;
   }
   
   // ✅ Correct
   function MyComponent() {
     useEffect(() => {
       NavigationService.goToPage('Page2');
     }, []);
     return <View />;
   }
   ```

2. **Don't store large objects in navigation params:**
   ```typescript
   // ❌ Wrong
   goToPage('Details', { data: hugeArray });
   
   // ✅ Correct: Store in variable or context
   Variables.selectedData.setValue(hugeArray);
   goToPage('Details', { id });
   ```

## Next Steps

- [Services](./services.md) - Service layer documentation
- [Core Concepts](./core-concepts.md) - Back to core concepts

