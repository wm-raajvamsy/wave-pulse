# Variable Agent - Detailed Documentation

## Overview

The **Variable Agent** is the expert on state management and data flow in WaveMaker React Native. It has comprehensive knowledge of all variable types, their lifecycle, operations, and how they're generated from Studio definitions.

## Domain Expertise

### Core Responsibilities

1. **Variable System Architecture**
   - BaseVariable class and inheritance
   - Variable lifecycle and state management
   - Event system for variables
   - Data flow patterns

2. **Variable Types**
   - Model Variables (static data)
   - Live Variables (CRUD operations)
   - Service Variables (API calls)
   - Device Variables (device operations)

3. **Variable Transformation**
   - Studio JSON to React code generation
   - Variable initialization
   - Method generation
   - Event binding

4. **Data Operations**
   - CRUD operations
   - Data binding
   - Pagination
   - Filtering and sorting

## Knowledge Base

### Variable Type Registry

```typescript
const VARIABLE_TYPES = {
  // Model Variable - Static data holder
  model: {
    runtime: 'variables/model-variable.ts',
    transformer: 'variables/variable.transformer.ts',
    features: ['data storage', 'two-way binding', 'change events'],
    useCase: 'Form data, temporary state, client-side data'
  },
  
  // Live Variable - CRUD with backend
  live: {
    runtime: 'variables/live-variable.ts',
    transformer: 'variables/variable.transformer.ts',
    features: ['CRUD ops', 'pagination', 'backend sync', 'auto-invoke'],
    useCase: 'Database entities, REST APIs with CRUD'
  },
  
  // Service Variable - Custom API calls
  service: {
    runtime: 'variables/service-variable.ts',
    transformer: 'variables/variable.transformer.ts',
    features: ['custom API', 'parameter passing', 'response handling'],
    useCase: 'Custom REST endpoints, complex operations'
  },
  
  // Device Variable - Device operations
  device: {
    runtime: 'variables/device-variable.ts',
    transformer: 'variables/variable.transformer.ts',
    features: ['device APIs', 'permissions', 'platform-specific'],
    useCase: 'Camera, location, contacts, calendar'
  }
};
```

## BaseVariable Architecture

### Class Structure

```typescript
// Location: wavemaker-rn-runtime/src/variables/base-variable.ts

export abstract class BaseVariable<T extends VariableConfig> extends EventNotifier {
  // ============ Core Properties ============
  
  name: string = '';                    // Variable name
  params: any = {};                     // Request parameters
  dataSet: any = {};                    // Current data
  isList: boolean;                      // Is array data
  twoWayBinding: boolean;               // Enable two-way binding
  isExecuting: boolean = false;         // Execution state
  
  // ============ Constructor ============
  
  constructor(public config: T) {
    super(); // EventNotifier
    this.name = config.name;
    this.isList = config.isList;
    this.twoWayBinding = config.twoWayBinding;
    this.dataSet = this.isList ? [] : this.dataSet;
    
    // Subscribe to lifecycle events
    this.subscribe(VariableEvents.BEFORE_INVOKE, () => {
      this.isExecuting = true;
      VARIABLE_LOGGER.info(`Before Invoking variable ${this.name}`);
    });
    
    this.subscribe(VariableEvents.AFTER_INVOKE, () => {
      this.isExecuting = false;
      VARIABLE_LOGGER.info(`After Invoking variable ${this.name}`);
    });
  }
  
  // ============ Data Operations ============
  
  /**
   * Invoke the variable (fetch/execute)
   */
  public invoke(
    params?: any,
    onSuccess?: Function,
    onError?: Function
  ): Promise<BaseVariable<T>> {
    if (!params) {
      this.params = this.config.paramProvider();
    } else {
      this.params = params;
    }
    return Promise.resolve(this);
  }
  
  /**
   * Get current data
   */
  public getData(): any {
    return this.dataSet;
  }
  
  /**
   * Set data (with validation)
   */
  public setData(dataSet: any): any {
    if (DatasetUtil.isValidDataset(dataSet, this.isList)) {
      this.dataSet = dataSet;
    }
    return this.dataSet;
  }
  
  /**
   * Get value by key
   */
  getValue(key: string, index?: number): any {
    return DatasetUtil.getValue(this.dataSet, key, index, this.isList);
  }
  
  /**
   * Set value by key
   */
  setValue(key: string, value: any): any {
    return DatasetUtil.setValue(this.dataSet, key, value, this.isList);
  }
  
  /**
   * Get item by index (for lists)
   */
  getItem(index: number): any {
    return DatasetUtil.getItem(this.dataSet, index, this.isList);
  }
  
  /**
   * Set item by index (for lists)
   */
  setItem(index: number, value: any, options?: any): any {
    options = DatasetUtil.getChildDetails(this.dataSet, options, this.isList);
    return DatasetUtil.setItem(this.dataSet, index, value, this.isList, options);
  }
  
  /**
   * Add item (for lists)
   */
  addItem(value?: any, index?: number): any {
    return DatasetUtil.addItem(this.dataSet, value, index, this.isList);
  }
  
  /**
   * Remove item (for lists)
   */
  removeItem(index: number): any {
    return DatasetUtil.removeItem(this.dataSet, index, this.isList);
  }
  
  /**
   * Clear all data
   */
  clearData(): void {
    this.dataSet = this.isList ? [] : {};
  }
}
```

### Variable Events

```typescript
export enum VariableEvents {
  BEFORE_INVOKE = 'beforeInvoke',   // Before API call
  SUCCESS = 'success',               // On success
  ERROR = 'error',                   // On error
  AFTER_INVOKE = 'afterInvoke'      // After completion
}

// Usage:
variable.subscribe(VariableEvents.SUCCESS, (response) => {
  console.log('Variable succeeded:', response);
});
```

## Variable Types

### 1. Model Variable

**Purpose**: Static data storage, form data, temporary state

**Class**: `ModelVariable`

**Features**:
- Simple data container
- Two-way binding support
- No backend connection
- Client-side only

**Configuration**:
```typescript
interface ModelVariableConfig {
  name: string;
  isList: boolean;
  twoWayBinding: boolean;
  dataSet?: any;  // Initial data
}
```

**Example**:
```javascript
// Variable definition
Variables.userForm = new ModelVariable({
  name: 'userForm',
  isList: false,
  twoWayBinding: true,
  dataSet: {
    firstName: '',
    lastName: '',
    email: ''
  }
});

// Usage
Variables.userForm.setValue('firstName', 'John');
Variables.userForm.getValue('firstName'); // 'John'
Variables.userForm.setData({ firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' });
```

**Generated Code**:
```javascript
// In page.component.js
this.Variables.userForm = new ModelVariable({
  name: 'userForm',
  isList: false,
  twoWayBinding: true,
  dataSet: {
    firstName: '',
    lastName: '',
    email: ''
  }
});
```

### 2. Live Variable

**Purpose**: CRUD operations with backend entities

**Class**: `LiveVariable`

**Features**:
- Full CRUD operations (Create, Read, Update, Delete)
- Pagination support
- Server-side filtering/sorting
- Auto-invoke on page load
- Backend synchronization

**Configuration**:
```typescript
interface LiveVariableConfig {
  name: string;
  isList: boolean;
  twoWayBinding: boolean;
  service: string;         // Service name
  operation: string;       // Operation type (read, create, update, delete)
  autoUpdate: boolean;     // Auto-invoke on param change
  startUpdate: boolean;    // Auto-invoke on page load
  pagination: {
    page: number;
    size: number;
  };
}
```

**Operations**:
```javascript
// Create (Insert)
await variable.insertRecord({ name: 'John', age: 30 });

// Read (Fetch)
await variable.invoke();

// Update
await variable.updateRecord({ id: 1, name: 'Jane' });

// Delete
await variable.deleteRecord({ id: 1 });

// Pagination
await variable.setPage(2);
await variable.goToFirstPage();
await variable.goToLastPage();
await variable.goToNextPage();
await variable.goToPreviousPage();
```

**Example**:
```javascript
// Variable definition
Variables.employeesData = new LiveVariable({
  name: 'employeesData',
  isList: true,
  twoWayBinding: true,
  service: 'EmployeeService',
  operation: 'read',
  autoUpdate: false,
  startUpdate: true,
  pagination: {
    page: 1,
    size: 20
  }
});

// Usage
await Variables.employeesData.invoke();
const employees = Variables.employeesData.getData();

// Add new employee
await Variables.employeesData.insertRecord({
  firstName: 'John',
  lastName: 'Doe',
  department: 'Engineering'
});

// Update employee
await Variables.employeesData.updateRecord({
  id: 123,
  firstName: 'Jane'
});

// Delete employee
await Variables.employeesData.deleteRecord({ id: 123 });

// Pagination
await Variables.employeesData.goToNextPage();
```

**Generated Code**:
```javascript
// In page.component.js
this.Variables.employeesData = new LiveVariable({
  name: 'employeesData',
  isList: true,
  twoWayBinding: true,
  service: injector.get('EmployeeService'),
  operation: 'read',
  autoUpdate: false,
  startUpdate: true,
  pagination: {
    page: 1,
    size: 20
  },
  paramProvider: () => ({
    // Parameters
  }),
  onBefore: () => {
    // onBefore callback
  },
  onSuccess: (data) => {
    // onSuccess callback
  },
  onError: (error) => {
    // onError callback
  }
});
```

### 3. Service Variable

**Purpose**: Custom API calls, non-CRUD operations

**Class**: `ServiceVariable`

**Features**:
- Call any service method
- Pass custom parameters
- Handle any response format
- Flexible configuration

**Configuration**:
```typescript
interface ServiceVariableConfig {
  name: string;
  isList: boolean;
  twoWayBinding: boolean;
  service: string;         // Service name
  operation: string;       // Method name
  operationType: string;   // HTTP method
  parameters: any[];       // Parameter definitions
}
```

**Example**:
```javascript
// Variable definition
Variables.searchUsers = new ServiceVariable({
  name: 'searchUsers',
  isList: true,
  twoWayBinding: false,
  service: 'UserService',
  operation: 'searchUsers',
  operationType: 'GET',
  parameters: [
    { name: 'query', type: 'string' },
    { name: 'limit', type: 'number' }
  ]
});

// Usage
await Variables.searchUsers.invoke({
  query: 'john',
  limit: 10
});

const results = Variables.searchUsers.getData();
```

**Generated Code**:
```javascript
// In page.component.js
this.Variables.searchUsers = new ServiceVariable({
  name: 'searchUsers',
  isList: true,
  twoWayBinding: false,
  service: injector.get('UserService'),
  operation: 'searchUsers',
  operationType: 'GET',
  paramProvider: () => ({
    query: this.searchQuery,
    limit: 10
  }),
  onBefore: () => {
    this.SpinnerService.show();
  },
  onSuccess: (data) => {
    this.SpinnerService.hide();
    console.log('Search results:', data);
  },
  onError: (error) => {
    this.SpinnerService.hide();
    this.ToastService.error('Search failed: ' + error.message);
  }
});
```

### 4. Device Variable

**Purpose**: Device operations (camera, location, contacts, etc.)

**Class**: `DeviceVariable`

**Features**:
- Device API access
- Permission handling
- Platform-specific operations
- Async operations

**Configuration**:
```typescript
interface DeviceVariableConfig {
  name: string;
  operation: string;       // Operation name (captureImage, getCurrentGeoPosition, etc.)
  service: string;         // Device service name
}
```

**Operations**:
- `captureImage` - Capture photo
- `captureVideo` - Record video
- `scanBarCode` - Scan barcode/QR
- `getCurrentGeoPosition` - Get GPS location
- `getContacts` - Access contacts
- `getEvents` - Access calendar events
- `createEvent` - Create calendar event
- `upload` - Upload file

**Example**:
```javascript
// Variable definition
Variables.cameraCapture = new DeviceVariable({
  name: 'cameraCapture',
  operation: 'captureImage',
  service: 'CameraService'
});

// Usage
const photo = await Variables.cameraCapture.invoke({
  quality: 0.8,
  allowsEditing: true
});

console.log('Photo URI:', photo.uri);
```

**Generated Code**:
```javascript
// In page.component.js
this.Variables.cameraCapture = new DeviceVariable({
  name: 'cameraCapture',
  operation: 'captureImage',
  service: injector.get('CameraService'),
  paramProvider: () => ({
    quality: 0.8,
    allowsEditing: true
  }),
  onSuccess: (photo) => {
    this.Variables.userPhoto.setData(photo.uri);
  },
  onError: (error) => {
    this.ToastService.error('Camera error: ' + error.message);
  }
});
```

## Variable Lifecycle

### Lifecycle Flow

```
Variable Creation (in constructor)
    ↓
Configuration
    ↓
─── Page Load ───
    ↓
startUpdate: true → Auto-invoke
    ↓
BEFORE_INVOKE event
    ↓
onBefore callback
    ↓
isExecuting = true
    ↓
─── API Call / Operation ───
    ↓
Success Path              Error Path
    ↓                         ↓
SUCCESS event           ERROR event
    ↓                         ↓
onSuccess callback      onError callback
    ↓                         ↓
dataSet updated         error stored
    ↓                         ↓
────────────┬─────────────────┘
            ↓
    AFTER_INVOKE event
            ↓
    onComplete callback
            ↓
    isExecuting = false
```

### Lifecycle Events

```javascript
// Variable lifecycle hooks
Variables.myVariable = new LiveVariable({
  // ... config
  
  // 1. Before invoke
  onBefore: function() {
    console.log('About to fetch data');
    this.SpinnerService.show();
  },
  
  // 2. On success
  onSuccess: function(data) {
    console.log('Data fetched:', data);
    this.SpinnerService.hide();
  },
  
  // 3. On error
  onError: function(error) {
    console.error('Fetch failed:', error);
    this.SpinnerService.hide();
    this.ToastService.error('Failed to load data');
  },
  
  // 4. On complete (always called)
  onComplete: function() {
    console.log('Request completed');
  }
});

// Subscribe to events
Variables.myVariable.subscribe(VariableEvents.SUCCESS, (data) => {
  console.log('Success event:', data);
});
```

## Variable Transformation

How Studio variable definitions become React code:

### Studio JSON Definition

```json
{
  "employeesData": {
    "category": "wm.LiveVariable",
    "isList": true,
    "type": "com.myapp.Employee",
    "service": "EmployeeService",
    "operation": "read",
    "autoUpdate": false,
    "startUpdate": true,
    "pagination": {
      "page": 1,
      "size": 20
    },
    "orderBy": "lastName asc",
    "onBefore": "onEmployeesBeforeFetch",
    "onSuccess": "onEmployeesSuccess",
    "onError": "onEmployeesError"
  }
}
```

### Generated React Code

```javascript
// In page.component.js

// Variable instantiation
this.Variables.employeesData = new LiveVariable({
  name: 'employeesData',
  isList: true,
  twoWayBinding: true,
  service: injector.get('EmployeeService'),
  operation: 'read',
  operationType: 'read',
  autoUpdate: false,
  startUpdate: true,
  pagination: {
    page: 1,
    size: 20
  },
  orderBy: 'lastName asc',
  
  // Parameter provider
  paramProvider: () => {
    return {
      // Dynamic parameters
    };
  },
  
  // Event callbacks (bound to page)
  onBefore: () => {
    return this.onEmployeesBeforeFetch(this.Variables.employeesData);
  },
  
  onSuccess: (data) => {
    return this.onEmployeesSuccess(this.Variables.employeesData, data);
  },
  
  onError: (error) => {
    return this.onEmployeesError(this.Variables.employeesData, error);
  }
});

// Generated callback methods
onEmployeesBeforeFetch(variable) {
  // Custom logic
  this.SpinnerService.show();
}

onEmployeesSuccess(variable, data) {
  // Custom logic
  this.SpinnerService.hide();
  console.log('Loaded', data.length, 'employees');
}

onEmployeesError(variable, error) {
  // Custom logic
  this.SpinnerService.hide();
  this.ToastService.error('Failed to load employees');
}
```

### Transformation Process

```
Studio Variable JSON
    ↓
Variable Transformer (variable.transformer.ts)
    ↓
    ├─→ Extract configuration
    ├─→ Identify variable type
    ├─→ Generate constructor call
    ├─→ Generate parameter provider
    ├─→ Generate event callbacks
    └─→ Generate helper methods
    ↓
Generated JavaScript Code
    ↓
Included in page.component.js
```

## Variable Operations

### Data Manipulation

```javascript
// For Model and Live Variables

// Get/Set whole dataset
variable.setData({ name: 'John', age: 30 });
const data = variable.getData();

// Get/Set by key
variable.setValue('name', 'Jane');
const name = variable.getValue('name');

// Clear data
variable.clearData();
```

### List Operations

```javascript
// For list variables (isList: true)

// Get item by index
const firstItem = variable.getItem(0);

// Set item by index
variable.setItem(0, { name: 'Updated Name' });

// Add item
variable.addItem({ name: 'New Item' });
variable.addItem({ name: 'Insert at index' }, 2);

// Remove item
variable.removeItem(0);

// Get list length
const count = variable.getData().length;
```

### CRUD Operations (Live Variable)

```javascript
// Create (Insert)
await variable.insertRecord({ name: 'John', age: 30 });

// Read (already covered by invoke)
await variable.invoke();

// Update
await variable.updateRecord({ id: 1, name: 'Jane' });

// Delete
await variable.deleteRecord({ id: 1 });
```

### Pagination (Live Variable)

```javascript
// Current page info
const currentPage = variable.pagination.page;
const pageSize = variable.pagination.size;
const totalPages = variable.pagination.totalPages;

// Navigate pages
await variable.setPage(3);           // Go to specific page
await variable.goToFirstPage();      // Go to first page
await variable.goToLastPage();       // Go to last page
await variable.goToNextPage();       // Next page
await variable.goToPreviousPage();   // Previous page
```

### Filtering and Sorting (Live Variable)

```javascript
// Set filter
variable.filter = {
  department: 'Engineering',
  status: 'active'
};
await variable.invoke();

// Set sort order
variable.orderBy = 'lastName asc, firstName asc';
await variable.invoke();

// Clear filter
variable.filter = {};
await variable.invoke();
```

## Data Binding

Variables integrate with widgets through data binding:

### One-Way Binding (Display)

```xml
<!-- Studio Markup -->
<wm-label caption="bind:Variables.userName.dataSet.name"></wm-label>
```

```jsx
// Generated JSX
<WmLabel caption={this.Variables.userName.dataSet.name} />
```

### Two-Way Binding (Input)

```xml
<!-- Studio Markup -->
<wm-text datavalue="bind:Variables.userForm.dataSet.name"></wm-text>
```

```jsx
// Generated JSX
<WmText 
  datavalue={this.Variables.userForm.dataSet.name}
  onChange={(value) => {
    this.Variables.userForm.setValue('name', value);
  }}
/>
```

### List Binding

```xml
<!-- Studio Markup -->
<wm-list dataset="bind:Variables.employees.dataSet">
  <wm-list-template>
    <wm-label caption="bind:item.name"></wm-label>
  </wm-list-template>
</wm-list>
```

```jsx
// Generated JSX
<WmList dataset={this.Variables.employees.dataSet}>
  {(item, index) => (
    <WmLabel caption={item.name} />
  )}
</WmList>
```

## Agent Capabilities

### 1. Explain Variable Type

**Query**: "What is a LiveVariable?"

**Response**:
```markdown
# LiveVariable

## Purpose
LiveVariable is used for CRUD operations with backend entities. It automatically handles Create, Read, Update, and Delete operations.

## Key Features
- **CRUD Operations**: Full create, read, update, delete support
- **Pagination**: Built-in pagination with page navigation
- **Auto-Invoke**: Can automatically fetch data on page load
- **Backend Sync**: Keeps data synchronized with backend
- **Event Callbacks**: onSuccess, onError, onBefore hooks

## When to Use
- Database entities (User, Product, Order, etc.)
- REST APIs with CRUD endpoints
- Data that needs server-side pagination
- Data that requires backend persistence

## Example
```javascript
Variables.employees = new LiveVariable({
  name: 'employees',
  isList: true,
  service: 'EmployeeService',
  operation: 'read',
  startUpdate: true,  // Auto-fetch on page load
  pagination: { page: 1, size: 20 }
});

// Usage
await Variables.employees.invoke();
await Variables.employees.insertRecord({ name: 'John' });
await Variables.employees.updateRecord({ id: 1, name: 'Jane' });
await Variables.employees.deleteRecord({ id: 1 });
```

[... more details]
```

### 2. Compare Variables

**Query**: "Difference between ModelVariable and LiveVariable"

**Response**:
```markdown
# ModelVariable vs LiveVariable

| Feature | ModelVariable | LiveVariable |
|---------|---------------|--------------|
| **Purpose** | Static data storage | Backend CRUD operations |
| **Backend** | No backend connection | Connected to backend service |
| **CRUD** | No CRUD methods | Full CRUD support |
| **Persistence** | Client-side only | Server-side persistence |
| **Pagination** | No pagination | Built-in pagination |
| **Use Case** | Form data, temporary state | Database entities, REST APIs |

## When to Use ModelVariable
- Form data before submission
- Temporary UI state
- Client-side calculations
- Data that doesn't need backend persistence

## When to Use LiveVariable
- Database entities
- Data from REST APIs
- Data requiring CRUD operations
- Data with pagination

## Code Comparison

**ModelVariable**:
```javascript
Variables.userForm = new ModelVariable({
  name: 'userForm',
  isList: false,
  dataSet: { name: '', email: '' }
});

// Manual operations
Variables.userForm.setValue('name', 'John');
```

**LiveVariable**:
```javascript
Variables.users = new LiveVariable({
  name: 'users',
  isList: true,
  service: 'UserService',
  operation: 'read'
});

// Automatic backend sync
await Variables.users.invoke();
await Variables.users.insertRecord({ name: 'John' });
```
```

### 3. Debug Variable

**Query**: "My LiveVariable isn't loading data"

**Response**:
```markdown
# Debugging LiveVariable Data Loading

## Diagnostic Steps

### Step 1: Check Variable Configuration
```javascript
console.log('Variable config:', {
  name: Variables.myVar.name,
  service: Variables.myVar.config.service,
  operation: Variables.myVar.config.operation,
  startUpdate: Variables.myVar.config.startUpdate
});
```

### Step 2: Check Execution State
```javascript
console.log('Is executing:', Variables.myVar.isExecuting);
console.log('Data:', Variables.myVar.dataSet);
```

### Step 3: Check for Errors
Add error callback:
```javascript
Variables.myVar = new LiveVariable({
  // ... config
  onError: (error) => {
    console.error('Variable error:', error);
    console.error('Error details:', error.message, error.response);
  }
});
```

### Common Issues

#### Issue 1: startUpdate is false
**Symptom**: Variable never loads
**Solution**: Set `startUpdate: true` or manually invoke
```javascript
// In page onReady
this.Variables.myVar.invoke();
```

#### Issue 2: Service Not Found
**Symptom**: Error about service not being defined
**Solution**: Check service name and import
```javascript
// Verify service is injected
console.log('Service:', Variables.myVar.config.service);
```

#### Issue 3: Backend Error
**Symptom**: onError callback fires
**Solution**: Check backend API and parameters
```javascript
// Check request parameters
console.log('Parameters:', Variables.myVar.params);
```

#### Issue 4: Wrong Operation
**Symptom**: Wrong HTTP method or endpoint
**Solution**: Verify operation type
```javascript
console.log('Operation:', Variables.myVar.config.operation);
console.log('Operation type:', Variables.myVar.config.operationType);
```

[... more diagnostic steps]
```

### 4. Variable Usage Examples

**Query**: "Show me how to use variables in a form"

**Response**:
```markdown
# Using Variables in Forms

## Scenario: Employee Form with CRUD

### Step 1: Define Variables

```javascript
// Model variable for form data
Variables.employeeForm = new ModelVariable({
  name: 'employeeForm',
  isList: false,
  twoWayBinding: true,
  dataSet: {
    firstName: '',
    lastName: '',
    email: '',
    department: ''
  }
});

// Live variable for employees list
Variables.employeesList = new LiveVariable({
  name: 'employeesList',
  isList: true,
  service: 'EmployeeService',
  operation: 'read',
  startUpdate: true
});

// Service variable for save operation
Variables.saveEmployee = new ServiceVariable({
  name: 'saveEmployee',
  service: 'EmployeeService',
  operation: 'save'
});
```

### Step 2: Form Markup

```jsx
<WmForm>
  <WmText 
    name="firstName"
    datavalue={this.Variables.employeeForm.dataSet.firstName}
    onChange={(value) => {
      this.Variables.employeeForm.setValue('firstName', value);
    }}
  />
  
  <WmText 
    name="lastName"
    datavalue={this.Variables.employeeForm.dataSet.lastName}
    onChange={(value) => {
      this.Variables.employeeForm.setValue('lastName', value);
    }}
  />
  
  <WmButton 
    caption="Save"
    onPress={this.saveEmployee}
  />
</WmForm>

<WmList dataset={this.Variables.employeesList.dataSet}>
  {(item, index) => (
    <WmListItem onPress={() => this.editEmployee(item)}>
      <WmLabel caption={item.firstName + ' ' + item.lastName} />
    </WmListItem>
  )}
</WmList>
```

### Step 3: Form Operations

```javascript
// Save employee
async saveEmployee() {
  try {
    const formData = this.Variables.employeeForm.getData();
    
    await this.Variables.saveEmployee.invoke(formData);
    
    // Clear form
    this.Variables.employeeForm.clearData();
    
    // Refresh list
    await this.Variables.employeesList.invoke();
    
    this.ToastService.success('Employee saved');
  } catch (error) {
    this.ToastService.error('Save failed: ' + error.message);
  }
}

// Edit employee
editEmployee(employee) {
  this.Variables.employeeForm.setData(employee);
}

// Delete employee
async deleteEmployee(employee) {
  try {
    await this.Variables.employeesList.deleteRecord({ id: employee.id });
    this.ToastService.success('Employee deleted');
  } catch (error) {
    this.ToastService.error('Delete failed: ' + error.message);
  }
}
```

[... more examples]
```

## Best Practices

### Variable Usage

1. **Choose Right Type**: Use appropriate variable type for use case
2. **Name Clearly**: Use descriptive variable names
3. **Initialize Properly**: Set correct initial data and configuration
4. **Handle Errors**: Always add error callbacks
5. **Clean Data**: Clear or reset data when appropriate
6. **Avoid Over-Fetching**: Use pagination for large datasets

### Performance

1. **Lazy Loading**: Don't set startUpdate=true for all variables
2. **Debounce Invokes**: Debounce search/filter operations
3. **Cache Results**: Cache results when data doesn't change often
4. **Pagination**: Always use pagination for large lists
5. **Selective Updates**: Only update changed data

### Security

1. **Validate Input**: Validate data before sending to backend
2. **Handle Errors**: Properly handle and display errors
3. **Sanitize Data**: Sanitize user input
4. **Permission Checks**: Check permissions before operations

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Variable System & State Management

