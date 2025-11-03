# Variable System

## Overview

WaveMaker variables provide reactive state management for applications. Variables automatically update UI when their values change and can be bound to widgets for two-way data binding.

## Variable Types

### 1. Variable (wm.Variable)
Simple data storage.

```javascript
const myVar = createVariable({
  name: 'myVar',
  type: 'string',
  defaultValue: 'Hello World'
});

// Usage
myVar.setValue('New Value');
console.log(myVar.dataValue); // 'New Value'
```

**Use cases:**
- Store UI state
- Hold temporary data
- Form data
- Computed values

### 2. LiveVariable (wm.LiveVariable)
Database CRUD operations.

```javascript
const userVar = createLiveVariable({
  name: 'userVar',
  type: 'User',
  liveSource: 'hrdb',
  operation: 'read'
});

// Usage
await userVar.invoke(); // Fetch users
console.log(userVar.dataValue); // Array of users

// Update
userVar.setInput('id', 123);
await userVar.update({ name: 'John' });

// Delete
await userVar.delete(123);
```

**Use cases:**
- Fetch database records
- CRUD operations
- Entity management
- Data tables

### 3. ServiceVariable (wm.ServiceVariable)
REST API calls.

```javascript
const apiVar = createServiceVariable({
  name: 'apiVar',
  service: 'UserService',
  operation: 'getUsers',
  controller: 'UserController'
});

// Usage
apiVar.setInput('page', 1);
apiVar.setInput('size', 10);
await apiVar.invoke();
console.log(apiVar.dataValue); // API response
```

**Use cases:**
- REST API calls
- External service integration
- Backend operations
- Data fetching

### 4. DeviceVariable (wm.DeviceVariable)
Device feature access.

```javascript
const cameraVar = createDeviceVariable({
  name: 'cameraVar',
  operation: 'captureImage',
  service: 'CameraService'
});

// Usage
await cameraVar.invoke({
  quality: 0.8,
  allowsEditing: true
});

console.log(cameraVar.dataValue.uri); // Image URI
```

**Supported operations:**
- captureImage, captureVideo
- scanBarCode
- getCurrentGeoPosition
- getContacts
- getEvents, createEvent, deleteEvent
- upload, openFile
- getAppInfo, getDeviceInfo, getNetworkInfo
- vibrate

### 5. NavigationVariable (wm.NavigationVariable)
Page navigation.

```javascript
const navVar = createNavigationVariable({
  name: 'navVar',
  operation: 'gotoPage'
});

// Usage
navVar.setInput('pageName', 'UserProfile');
navVar.setInput('data', { userId: 123 });
await navVar.invoke();
```

**Operations:**
- gotoPage: Navigate to page
- goBack: Go back
- openLeftPanel: Open drawer
- closeLeftPanel: Close drawer

### 6. TimerVariable (wm.TimerVariable)
Scheduled actions.

```javascript
const timerVar = createTimerVariable({
  name: 'timerVar',
  delay: 5000, // 5 seconds
  repeating: true
});

// Start timer
timerVar.start();

// Stop timer
timerVar.stop();

// On fire callback
timerVar.onBeforefire = () => {
  console.log('Timer fired');
  refreshData();
};
```

## Variable Lifecycle

```
Create
  ↓
Initialize (set default value)
  ↓
Bind to widgets
  ↓
[Runtime Updates]
  ├─ setValue()
  ├─ invoke()
  ├─ update()
  └─ delete()
  ↓
Trigger callbacks
  ├─ onSuccess
  ├─ onError
  ├─ onBeforeUpdate
  └─ onResult
  ↓
Update bound widgets
  ↓
Destroy (on page unmount)
```

## Variable Properties

### Common Properties

```javascript
{
  name: 'variableName',          // Variable name
  type: 'string',                // Data type
  defaultValue: null,            // Initial value
  dataValue: null,               // Current value
  isList: false,                 // Array or single value
  startUpdate: false,            // Load on page load
  autoUpdate: false,             // Auto-refresh
  inFlightBehavior: 'cancel',    // Request handling
  // Callbacks
  onSuccess: function(data) {},
  onError: function(error) {},
  onBeforeUpdate: function() {},
  onResult: function(data) {}
}
```

### LiveVariable Properties

```javascript
{
  ...commonProperties,
  liveSource: 'hrdb',            // Database name
  type: 'User',                  // Entity type
  operation: 'read',             // CRUD operation
  maxResults: 20,                // Result limit
  orderBy: 'name',               // Sort field
  propertiesMap: {...},          // Field mappings
  relatedTables: {...}           // Relationships
}
```

### ServiceVariable Properties

```javascript
{
  ...commonProperties,
  service: 'UserService',        // Service name
  operation: 'getUsers',         // Service operation
  controller: 'UserController',  // Controller name
  method: 'GET',                 // HTTP method
  useDefaultSuccessHandler: true
}
```

## Variable Methods

### setValue(value)
Set variable value.

```javascript
myVar.setValue('New Value');
myVar.setValue({ name: 'John', age: 30 });
myVar.setValue([1, 2, 3]);
```

### getValue()
Get variable value.

```javascript
const value = myVar.getValue();
// or
const value = myVar.dataValue;
```

### setInput(key, value)
Set input parameter.

```javascript
userVar.setInput('id', 123);
userVar.setInput('filter', { status: 'active' });
```

### invoke(options?)
Execute variable operation.

```javascript
// Simple invoke
await myVar.invoke();

// With options
await myVar.invoke({
  inputFields: {
    page: 1,
    size: 10
  }
});
```

### update(data)
Update entity (LiveVariable).

```javascript
await userVar.update({
  id: 123,
  name: 'John Doe',
  email: 'john@example.com'
});
```

### delete(id)
Delete entity (LiveVariable).

```javascript
await userVar.delete(123);
```

### clearData()
Clear variable data.

```javascript
myVar.clearData();
console.log(myVar.dataValue); // null
```

### cancel()
Cancel in-flight request.

```javascript
myVar.invoke();
// ... later
myVar.cancel();
```

## Data Binding

### One-Way Binding
Widget reads from variable.

```typescript
// Variable to widget
<WmLabel caption={bind:myVar.dataValue} />

// Expression binding
<WmLabel caption={bind:"Hello " + myVar.dataValue} />

// Conditional binding
<WmButton show={bind:isLoggedIn} />
```

### Two-Way Binding
Widget reads and writes to variable.

```typescript
// Input widgets
<WmText datavalue={bind:myVar.dataValue} />
<WmCheckbox datavalue={bind:isChecked} />
<WmSelect datavalue={bind:selectedOption} />

// Updates happen automatically on user input
```

### List Binding
Bind arrays to list widgets.

```typescript
<WmList dataset={bind:usersVar.dataValue}>
  <WmListTemplate>
    <WmLabel caption={bind:$item.name} />
    <WmLabel caption={bind:$item.email} />
  </WmListTemplate>
</WmList>
```

## Variable Callbacks

### onSuccess
Called when operation succeeds.

```javascript
myVar.onSuccess = function(data) {
  console.log('Success:', data);
  fragment.Variables.anotherVar.setValue(data);
};
```

### onError
Called when operation fails.

```javascript
myVar.onError = function(error) {
  console.error('Error:', error);
  fragment.appConfig.ToastService.error('Failed to load data');
};
```

### onBeforeUpdate
Called before operation executes.

```javascript
myVar.onBeforeUpdate = function() {
  console.log('Loading...');
  fragment.appConfig.SpinnerService.show();
  return true; // Return false to cancel
};
```

### onResult
Called with operation result.

```javascript
myVar.onResult = function(data) {
  console.log('Result:', data);
  fragment.appConfig.SpinnerService.hide();
};
```

## Auto-Update Variables

### startUpdate
Load when page loads.

```javascript
const userVar = createLiveVariable({
  name: 'userVar',
  startUpdate: true // Auto-invoke on page load
});
```

### autoUpdate
Refresh periodically.

```javascript
const statusVar = createVariable({
  name: 'statusVar',
  autoUpdate: true,
  autoUpdateInterval: 30000 // Refresh every 30 seconds
});
```

## Variable Scopes

### App-Level Variables
Available across all pages.

```javascript
// In App.variables.js
export const AppVariables = {
  currentUser: createVariable({...}),
  appConfig: createVariable({...})
};

// Access from any page
fragment.App.Variables.currentUser.dataValue
```

### Page-Level Variables
Available only in specific page.

```javascript
// In Page.variables.js
export const PageVariables = {
  userList: createLiveVariable({...}),
  selectedUser: createVariable({...})
};

// Access
fragment.Variables.userList.dataValue
```

### Partial-Level Variables
Available only in partial.

```javascript
// In Partial.variables.js
export const PartialVariables = {
  partialData: createVariable({...})
};
```

## Variable Best Practices

### ✅ DO

1. **Use appropriate variable types:**
   ```javascript
   // ✅ LiveVariable for database
   const userVar = createLiveVariable({...});
   
   // ✅ ServiceVariable for APIs
   const apiVar = createServiceVariable({...});
   
   // ✅ Variable for UI state
   const uiState = createVariable({...});
   ```

2. **Handle errors:**
   ```javascript
   myVar.onError = (error) => {
     console.error(error);
     toastService.error('Failed to load');
   };
   ```

3. **Use callbacks for side effects:**
   ```javascript
   myVar.onSuccess = (data) => {
     processData(data);
     otherVar.invoke();
   };
   ```

4. **Clear data when needed:**
   ```javascript
   // On logout
   userVar.clearData();
   ```

### ❌ DON'T

1. **Don't create variables in render:**
   ```javascript
   // ❌ Wrong
   function MyComponent() {
     const myVar = createVariable({...});
     return <View />;
   }
   ```

2. **Don't ignore errors:**
   ```javascript
   // ❌ Wrong
   await myVar.invoke(); // No error handling
   
   // ✅ Correct
   try {
     await myVar.invoke();
   } catch (error) {
     handleError(error);
   }
   ```

3. **Don't store large objects in variables:**
   ```javascript
   // ❌ Bad performance
   myVar.setValue(hugeArray);
   
   // ✅ Better: paginate or filter
   myVar.setInput('maxResults', 20);
   ```

## Next Steps

- [Variable Types](./variable-types.md) - Detailed variable type documentation
- [Variable Transformation](./variable-transformation.md) - Code generation
- [Core Concepts](../runtime/core-concepts.md) - Runtime concepts

