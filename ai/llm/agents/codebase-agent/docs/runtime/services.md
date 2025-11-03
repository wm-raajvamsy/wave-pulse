# Services Documentation

## Overview

WaveMaker Runtime provides a comprehensive service layer for common application needs. Services are accessed via dependency injection through the `injector` singleton.

## Service Access Pattern

```typescript
import injector from '@wavemaker/app-rn-runtime/core/injector';

// Get service instance
const navigationService = injector.NavigationService.get();
const modalService = injector.ModalService.get();
```

## Core Services

### NavigationService

**Location:** `src/core/navigation.service.ts`

Page and screen navigation management.

```typescript
interface NavigationService {
  // Navigate to page
  goToPage(pageName: string, params?: any, transition?: string): void;
  goToPage(pageName: string, params?: any, options?: NavigationOptions): void;
  
  // Navigation stack
  goBack(): void;
  canGoBack(): boolean;
  
  // Drawer
  openDrawer(): void;
  closeDrawer(): void;
  toggleDrawer(): void;
  
  // State
  getCurrentPage(): string;
  getNavigationState(): any;
}
```

**Usage:**

```typescript
// Navigate to page
navigationService.goToPage('UserProfile', { userId: 123 });

// Go back
navigationService.goBack();

// Open left panel
navigationService.openDrawer();
```

### ModalService

**Location:** `src/core/modal.service.ts`

Display modal dialogs and bottom sheets.

```typescript
interface ModalService {
  showModal(component: ReactNode, config?: ModalConfig): Promise<any>;
  hideModal(): void;
}

interface ModalConfig {
  centered?: boolean;
  showheader?: boolean;
  title?: string;
  oktext?: string;
  canceltext?: string;
  onOk?: Function;
  onCancel?: Function;
  onClose?: Function;
}
```

**Usage:**

```typescript
// Show modal
await modalService.showModal(
  <MyModalContent />,
  {
    title: 'Confirm Action',
    showheader: true,
    centered: true
  }
);

// Hide modal
modalService.hideModal();
```

### ToastService

**Location:** `src/core/toast.service.ts`

Show toast notifications.

```typescript
interface ToastService {
  show(message: string, duration?: number, type?: 'success' | 'error' | 'info' | 'warning'): void;
  success(message: string, duration?: number): void;
  error(message: string, duration?: number): void;
  info(message: string, duration?: number): void;
  warning(message: string, duration?: number): void;
}
```

**Usage:**

```typescript
// Show toast
toastService.show('Operation successful', 3000, 'success');

// Convenience methods
toastService.success('Saved!');
toastService.error('Failed to save');
toastService.info('New message');
toastService.warning('Low battery');
```

### SpinnerService

**Location:** `src/core/spinner.service.ts`

Display loading spinners.

```typescript
interface SpinnerService {
  show(message?: string): void;
  hide(): void;
}
```

**Usage:**

```typescript
// Show spinner
spinnerService.show('Loading...');

// Hide spinner
spinnerService.hide();

// Automatic hide after async operation
spinnerService.show('Saving...');
try {
  await saveData();
} finally {
  spinnerService.hide();
}
```

### SecurityService

**Location:** `src/core/security.service.ts`

Authentication and authorization.

```typescript
interface SecurityService {
  isAuthenticated(): boolean;
  login(credentials: any): Promise<any>;
  logout(): Promise<void>;
  getUser(): any;
  hasAccessToWidget(roles: string): boolean;
  hasRole(role: string): boolean;
}
```

**Usage:**

```typescript
// Check authentication
if (securityService.isAuthenticated()) {
  // User is logged in
}

// Login
await securityService.login({
  username: 'user',
  password: 'pass'
});

// Check widget access
if (securityService.hasAccessToWidget('admin,manager')) {
  // Show admin widget
}

// Logout
await securityService.logout();
```

### StorageService

**Location:** `src/core/storage.service.ts`

Persistent local storage using AsyncStorage.

```typescript
interface StorageService {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
}
```

**Usage:**

```typescript
// Save data
await storageService.setItem('user_preferences', JSON.stringify(prefs));

// Load data
const prefs = JSON.parse(await storageService.getItem('user_preferences'));

// Remove data
await storageService.removeItem('temp_data');

// Clear all
await storageService.clear();
```

### SecureStorageService

**Location:** `src/core/secure-storage.service.ts`

Encrypted storage for sensitive data using Expo SecureStore.

```typescript
interface SecureStorageService {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
}
```

**Usage:**

```typescript
// Store sensitive data (encrypted)
await secureStorageService.setItem('auth_token', token);
await secureStorageService.setItem('api_key', apiKey);

// Retrieve sensitive data
const token = await secureStorageService.getItem('auth_token');

// Remove sensitive data
await secureStorageService.removeItem('auth_token');
```

### I18nService

**Location:** `src/core/i18n.service.ts`

Internationalization and localization.

```typescript
interface I18nService {
  getSelectedLocale(): string;
  setLocale(locale: string): Promise<void>;
  isRTLLocale(): boolean;
  get(key: string, defaultValue?: string): string;
  getMessages(): any;
}
```

**Usage:**

```typescript
// Get current locale
const locale = i18nService.getSelectedLocale(); // 'en', 'ar', etc.

// Change locale
await i18nService.setLocale('ar');

// Check RTL
if (i18nService.isRTL Locale()) {
  // Apply RTL layout
}

// Get translated message
const welcomeMsg = i18nService.get('WELCOME_MESSAGE', 'Welcome');
```

### NetworkService

**Location:** `src/core/network.service.ts`

Network connectivity monitoring.

```typescript
interface NetworkService {
  isConnected(): Promise<boolean>;
  getNetworkState(): Promise<NetworkState>;
  onNetworkChange(callback: (state: NetworkState) => void): Function;
}

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: 'none' | 'wifi' | 'cellular' | 'unknown';
}
```

**Usage:**

```typescript
// Check connectivity
const connected = await networkService.isConnected();

// Get detailed state
const state = await networkService.getNetworkState();
console.log(state.type); // 'wifi', 'cellular', etc.

// Monitor changes
const unsubscribe = networkService.onNetworkChange((state) => {
  if (!state.isConnected) {
    toastService.warning('No internet connection');
  }
});

// Cleanup
unsubscribe();
```

### PartialService

**Location:** `src/core/partial.service.ts`

Manage partial components.

```typescript
interface PartialService {
  showPartial(partialName: string, params?: any): void;
  hidePartial(partialName: string): void;
  isPartialVisible(partialName: string): boolean;
}
```

**Usage:**

```typescript
// Show partial
partialService.showPartial('HeaderPartial', { title: 'Dashboard' });

// Hide partial
partialService.hidePartial('HeaderPartial');

// Check visibility
if (partialService.isPartialVisible('HeaderPartial')) {
  // Partial is visible
}
```

## Device Services

Device-specific functionality.

### CameraService

**Location:** `src/core/device/camera-service.ts`

Camera and image capture.

```typescript
interface CameraService {
  captureImage(options?: CameraOptions): Promise<ImageResult>;
  captureVideo(options?: VideoOptions): Promise<VideoResult>;
}

interface CameraOptions {
  quality?: number; // 0-1
  allowsEditing?: boolean;
  aspect?: [number, number];
}
```

**Usage:**

```typescript
// Capture photo
const result = await cameraService.captureImage({
  quality: 0.8,
  allowsEditing: true
});

console.log(result.uri); // File URI
console.log(result.width, result.height);

// Capture video
const video = await cameraService.captureVideo({
  quality: 'high'
});
```

### LocationService

**Location:** `src/core/device/location-service.ts`

GPS and location services.

```typescript
interface LocationService {
  getCurrentPosition(options?: LocationOptions): Promise<Position>;
  watchPosition(callback: (position: Position) => void, errorCallback?: Function): Function;
}

interface Position {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    speed: number | null;
  };
  timestamp: number;
}
```

**Usage:**

```typescript
// Get current position
const position = await locationService.getCurrentPosition({
  accuracy: 'high'
});

console.log(position.coords.latitude, position.coords.longitude);

// Watch position changes
const stopWatching = locationService.watchPosition(
  (position) => {
    console.log('New position:', position.coords);
  },
  (error) => {
    console.error('Location error:', error);
  }
);

// Stop watching
stopWatching();
```

### ContactsService

**Location:** `src/core/device/contacts-service.ts`

Access device contacts.

```typescript
interface ContactsService {
  getContacts(options?: ContactOptions): Promise<Contact[]>;
}

interface Contact {
  id: string;
  name: string;
  phoneNumbers: PhoneNumber[];
  emails: Email[];
}
```

**Usage:**

```typescript
// Get all contacts
const contacts = await contactsService.getContacts();

// Get specific fields
const contacts = await contactsService.getContacts({
  fields: ['name', 'phoneNumbers']
});

contacts.forEach(contact => {
  console.log(contact.name, contact.phoneNumbers);
});
```

### CalendarService

**Location:** `src/core/device/calendar-service.ts`

Calendar and event management.

```typescript
interface CalendarService {
  getEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  createEvent(event: CalendarEvent): Promise<string>;
  updateEvent(eventId: string, event: Partial<CalendarEvent>): Promise<void>;
  deleteEvent(eventId: string): Promise<void>;
}
```

**Usage:**

```typescript
// Get events
const events = await calendarService.getEvents(
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Create event
const eventId = await calendarService.createEvent({
  title: 'Meeting',
  startDate: new Date('2024-06-15T10:00:00'),
  endDate: new Date('2024-06-15T11:00:00'),
  location: 'Office'
});

// Delete event
await calendarService.deleteEvent(eventId);
```

## Using Services in Components

### In Generated Code

```typescript
// App.js or Page component
export default function MyPage(props) {
  const fragment = {
    // Services available via fragment
    appConfig: {
      NavigationService: injector.NavigationService.get(),
      ModalService: injector.ModalService.get(),
      ToastService: injector.ToastService.get(),
      // ... other services
    }
  };
  
  return <PageContent fragment={fragment} />;
}
```

### In Widget Event Handlers

```typescript
<WmButton onTap={() => {
  // Access via fragment
  fragment.appConfig.ToastService.success('Button clicked!');
  fragment.appConfig.NavigationService.goToPage('Details');
}} />
```

### In Page Script

```typescript
// Page.script.js
export default {
  onButtonClick(event, widget) {
    const {appConfig} = this; // 'this' is fragment
    
    appConfig.SpinnerService.show('Loading...');
    
    // Do work...
    
    appConfig.SpinnerService.hide();
    appConfig.ToastService.success('Done!');
  }
}
```

## Creating Custom Services

```typescript
// custom.service.ts
class CustomService {
  private data: any = {};
  
  setData(key: string, value: any) {
    this.data[key] = value;
  }
  
  getData(key: string) {
    return this.data[key];
  }
}

// Register with injector
injector.CustomService = {
  _instance: null,
  get() {
    if (!this._instance) {
      this._instance = new CustomService();
    }
    return this._instance;
  }
};

// Use it
const customService = injector.CustomService.get();
customService.setData('myKey', 'myValue');
```

## Service Best Practices

### ✅ DO

1. **Use services for cross-cutting concerns:**
   ```typescript
   // Navigation, storage, network, etc.
   navigationService.goToPage('Page2');
   ```

2. **Handle async properly:**
   ```typescript
   async function save() {
     try {
       spinnerService.show();
       await api.save(data);
       toastService.success('Saved!');
     } catch (error) {
       toastService.error('Failed to save');
     } finally {
       spinnerService.hide();
     }
   }
   ```

3. **Clean up subscriptions:**
   ```typescript
   const unsubscribe = networkService.onNetworkChange(callback);
   // Later...
   unsubscribe();
   ```

### ❌ DON'T

1. **Don't create multiple instances:**
   ```typescript
   // ❌ Wrong
   const service1 = new NavigationService();
   const service2 = new NavigationService();
   
   // ✅ Correct
   const service = injector.NavigationService.get();
   ```

2. **Don't forget error handling:**
   ```typescript
   // ❌ Wrong
   await storageService.setItem(key, value);
   
   // ✅ Correct
   try {
     await storageService.setItem(key, value);
   } catch (error) {
     console.error('Storage error:', error);
   }
   ```

## Next Steps

- [Navigation](./navigation.md) - Navigation system details
- [Core Concepts](./core-concepts.md) - Back to core concepts
- [Device Integration](../device-integration/device-operations.md) - Device operations

