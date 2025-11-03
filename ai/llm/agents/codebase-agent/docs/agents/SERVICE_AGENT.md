# Service Agent - Detailed Documentation

## Overview

The **Service Agent** is the expert on runtime services and the service layer architecture in WaveMaker React Native. It has comprehensive knowledge of all services, dependency injection, and service patterns.

## Domain Expertise

### Core Responsibilities

1. **Service Architecture**
   - Dependency Injection container
   - Service lifecycle management
   - Service registration and resolution
   - Singleton pattern implementation

2. **Core Services**
   - Navigation Service
   - Modal Service
   - Security Service
   - Storage Service
   - Network Service
   - i18n Service
   - Logger
   - Toast/Spinner services

3. **Service APIs**
   - Method signatures
   - Usage patterns
   - Event handling
   - Error handling

4. **Service Integration**
   - Component integration
   - Service injection
   - Inter-service communication

## Knowledge Base

### Service Registry

```typescript
const SERVICE_REGISTRY = {
  // Navigation
  NavigationService: 'core/navigation.service.ts',
  
  // UI Services
  ModalService: 'core/modal.service.ts',
  ToastService: 'core/toast.service.ts',
  SpinnerService: 'core/spinner.service.ts',
  
  // Security & Storage
  SecurityService: 'core/security.service.ts',
  StorageService: 'core/storage.service.ts',
  SecureStorageService: 'core/secure-storage.service.ts',
  
  // Network & API
  NetworkService: 'core/network.service.ts',
  HttpService: 'variables/http.service.ts',
  
  // Internationalization
  I18nService: 'core/i18n.service.ts',
  
  // Device & Platform
  DeviceService: 'core/device/device.service.ts',
  ScreenCaptureProtectionService: 'core/screen-capture-protection.service.ts',
  
  // Data & Content
  PartialService: 'core/partial.service.ts',
  AssetProvider: 'core/asset.provider.ts',
  
  // Utilities
  Logger: 'core/logger.ts',
  DisplayManager: 'core/display.manager.ts',
  ConstantService: 'core/constant.service.ts',
  
  // App-level
  AppExtensionService: 'runtime/services/app-extension.service.tsx',
  LifecycleService: 'runtime/services/lifecycle.service.ts'
};
```

## Dependency Injection

### Injector Implementation

**Location**: `wavemaker-rn-runtime/src/core/injector.ts`

```typescript
class Injector {
  private services = new Map<string, any>();
  private factories = new Map<string, () => any>();
  
  /**
   * Register a service instance
   */
  register(name: string, instance: any): void {
    this.services.set(name, instance);
  }
  
  /**
   * Register a service factory (for lazy initialization)
   */
  registerFactory(name: string, factory: () => any): void {
    this.factories.set(name, factory);
  }
  
  /**
   * Get service instance
   */
  get<T = any>(name: string): T {
    // Check if already instantiated
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }
    
    // Check if factory exists
    if (this.factories.has(name)) {
      const factory = this.factories.get(name)!;
      const instance = factory();
      this.services.set(name, instance);
      return instance as T;
    }
    
    throw new Error(`Service '${name}' not found`);
  }
  
  /**
   * Check if service exists
   */
  has(name: string): boolean {
    return this.services.has(name) || this.factories.has(name);
  }
  
  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

export default new Injector();
```

### Service Registration

```typescript
// App initialization
import injector from '@wavemaker/app-rn-runtime/core/injector';
import NavigationService from '@wavemaker/app-rn-runtime/core/navigation.service';
import ModalService from '@wavemaker/app-rn-runtime/core/modal.service';
// ... other services

// Register services
injector.register('NavigationService', NavigationService);
injector.register('ModalService', ModalService);
injector.register('ToastService', ToastService);
injector.register('SpinnerService', SpinnerService);
// ...

// Or register with factories (lazy initialization)
injector.registerFactory('NavigationService', () => new NavigationService());
```

### Service Injection in Components

```typescript
// In BaseComponent
export class BaseComponent<T, S, L> {
  // Inject services via getter
  protected get NavigationService() {
    return injector.get('NavigationService');
  }
  
  protected get ModalService() {
    return injector.get('ModalService');
  }
  
  protected get ToastService() {
    return injector.get('ToastService');
  }
  
  // Usage in component
  private navigateToPage() {
    this.NavigationService.navigate('HomePage');
  }
}

// Or inject directly
const navigationService = injector.get('NavigationService');
navigationService.navigate('HomePage');
```

## Core Services

### 1. Navigation Service

**Location**: `wavemaker-rn-runtime/src/core/navigation.service.ts`

**Purpose**: Handle navigation between pages and screens

```typescript
class NavigationService {
  private navigationRef: any;
  
  /**
   * Set navigation reference
   */
  setNavigationRef(ref: any): void {
    this.navigationRef = ref;
  }
  
  /**
   * Navigate to a page
   */
  navigate(pageName: string, params?: any): void {
    if (this.navigationRef) {
      this.navigationRef.navigate(pageName, params);
    }
  }
  
  /**
   * Go back
   */
  goBack(): void {
    if (this.navigationRef && this.navigationRef.canGoBack()) {
      this.navigationRef.goBack();
    }
  }
  
  /**
   * Navigate and reset stack
   */
  reset(pageName: string, params?: any): void {
    if (this.navigationRef) {
      this.navigationRef.reset({
        index: 0,
        routes: [{ name: pageName, params }]
      });
    }
  }
  
  /**
   * Get current route
   */
  getCurrentRoute(): any {
    if (this.navigationRef) {
      return this.navigationRef.getCurrentRoute();
    }
    return null;
  }
  
  /**
   * Check if can go back
   */
  canGoBack(): boolean {
    return this.navigationRef ? this.navigationRef.canGoBack() : false;
  }
}

export default new NavigationService();
```

**Usage**:
```typescript
// Navigate to page
this.NavigationService.navigate('ProfilePage', { userId: 123 });

// Go back
this.NavigationService.goBack();

// Reset navigation
this.NavigationService.reset('LoginPage');

// Check current page
const currentRoute = this.NavigationService.getCurrentRoute();
console.log('Current page:', currentRoute.name);
```

### 2. Modal Service

**Location**: `wavemaker-rn-runtime/src/core/modal.service.ts`

**Purpose**: Display modals, alerts, confirms

```typescript
class ModalService {
  private modals = new Map<string, any>();
  
  /**
   * Show alert dialog
   */
  alert(message: string, title?: string): Promise<void> {
    return new Promise((resolve) => {
      Alert.alert(
        title || 'Alert',
        message,
        [{ text: 'OK', onPress: resolve }]
      );
    });
  }
  
  /**
   * Show confirm dialog
   */
  confirm(message: string, title?: string): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        title || 'Confirm',
        message,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'OK', onPress: () => resolve(true) }
        ]
      );
    });
  }
  
  /**
   * Show custom modal
   */
  showModal(name: string, params?: any): void {
    const modal = this.modals.get(name);
    if (modal) {
      modal.show(params);
    }
  }
  
  /**
   * Hide modal
   */
  hideModal(name: string): void {
    const modal = this.modals.get(name);
    if (modal) {
      modal.hide();
    }
  }
  
  /**
   * Register modal
   */
  registerModal(name: string, modal: any): void {
    this.modals.set(name, modal);
  }
}

export default new ModalService();
```

**Usage**:
```typescript
// Alert
await this.ModalService.alert('Operation completed', 'Success');

// Confirm
const confirmed = await this.ModalService.confirm(
  'Are you sure you want to delete this item?',
  'Confirm Delete'
);

if (confirmed) {
  // Delete item
}

// Custom modal
this.ModalService.showModal('CustomModal', { data: someData });
```

### 3. Toast Service

**Location**: `wavemaker-rn-runtime/src/core/toast.service.ts`

**Purpose**: Display temporary notifications

```typescript
class ToastService {
  /**
   * Show success toast
   */
  success(message: string, duration: number = 3000): void {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'bottom',
      visibilityTime: duration
    });
  }
  
  /**
   * Show error toast
   */
  error(message: string, duration: number = 3000): void {
    Toast.show({
      type: 'error',
      text1: message,
      position: 'bottom',
      visibilityTime: duration
    });
  }
  
  /**
   * Show info toast
   */
  info(message: string, duration: number = 3000): void {
    Toast.show({
      type: 'info',
      text1: message,
      position: 'bottom',
      visibilityTime: duration
    });
  }
  
  /**
   * Show warning toast
   */
  warning(message: string, duration: number = 3000): void {
    Toast.show({
      type: 'warning',
      text1: message,
      position: 'bottom',
      visibilityTime: duration
    });
  }
}

export default new ToastService();
```

**Usage**:
```typescript
// Success message
this.ToastService.success('Data saved successfully');

// Error message
this.ToastService.error('Failed to load data');

// Info message
this.ToastService.info('Loading...');

// Warning message
this.ToastService.warning('Please save your changes');
```

### 4. Spinner Service

**Location**: `wavemaker-rn-runtime/src/core/spinner.service.ts`

**Purpose**: Display loading spinner

```typescript
class SpinnerService {
  private visible = false;
  private listeners: Function[] = [];
  
  /**
   * Show spinner
   */
  show(message?: string): void {
    this.visible = true;
    this.notify({ visible: true, message });
  }
  
  /**
   * Hide spinner
   */
  hide(): void {
    this.visible = false;
    this.notify({ visible: false });
  }
  
  /**
   * Check if visible
   */
  isVisible(): boolean {
    return this.visible;
  }
  
  /**
   * Subscribe to changes
   */
  subscribe(listener: Function): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notify(state: any): void {
    this.listeners.forEach(listener => listener(state));
  }
}

export default new SpinnerService();
```

**Usage**:
```typescript
// Show spinner
this.SpinnerService.show('Loading data...');

try {
  await this.loadData();
} finally {
  // Always hide spinner
  this.SpinnerService.hide();
}
```

### 5. Storage Service

**Location**: `wavemaker-rn-runtime/src/core/storage.service.ts`

**Purpose**: Local data storage using AsyncStorage

```typescript
class StorageService {
  /**
   * Store data
   */
  async store(key: string, value: any): Promise<void> {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  }
  
  /**
   * Retrieve data
   */
  async retrieve(key: string): Promise<any> {
    const stringValue = await AsyncStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) : null;
  }
  
  /**
   * Remove data
   */
  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
  
  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    await AsyncStorage.clear();
  }
  
  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    return await AsyncStorage.getAllKeys();
  }
}

export default new StorageService();
```

**Usage**:
```typescript
// Store data
await this.StorageService.store('user', { name: 'John', id: 123 });

// Retrieve data
const user = await this.StorageService.retrieve('user');
console.log(user.name); // 'John'

// Remove data
await this.StorageService.remove('user');

// Clear all
await this.StorageService.clear();
```

### 6. Secure Storage Service

**Location**: `wavemaker-rn-runtime/src/core/secure-storage.service.ts`

**Purpose**: Secure storage for sensitive data (tokens, passwords)

```typescript
class SecureStorageService {
  /**
   * Store secure data
   */
  async store(key: string, value: any): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await SecureStore.setItemAsync(key, stringValue);
  }
  
  /**
   * Retrieve secure data
   */
  async retrieve(key: string): Promise<any> {
    const stringValue = await SecureStore.getItemAsync(key);
    if (!stringValue) return null;
    
    try {
      return JSON.parse(stringValue);
    } catch {
      return stringValue;
    }
  }
  
  /**
   * Remove secure data
   */
  async remove(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  }
}

export default new SecureStorageService();
```

**Usage**:
```typescript
// Store sensitive data
await this.SecureStorageService.store('authToken', 'abc123xyz');

// Retrieve sensitive data
const token = await this.SecureStorageService.retrieve('authToken');

// Remove sensitive data
await this.SecureStorageService.remove('authToken');
```

### 7. Security Service

**Location**: `wavemaker-rn-runtime/src/core/security.service.ts`

**Purpose**: Authentication, authorization, security

```typescript
class SecurityService {
  private currentUser: any = null;
  private token: string | null = null;
  
  /**
   * Login
   */
  async login(username: string, password: string): Promise<any> {
    // Call login API
    const response = await this.callLoginAPI(username, password);
    
    // Store token
    this.token = response.token;
    await SecureStorageService.store('authToken', this.token);
    
    // Store user
    this.currentUser = response.user;
    await StorageService.store('currentUser', this.currentUser);
    
    return this.currentUser;
  }
  
  /**
   * Logout
   */
  async logout(): Promise<void> {
    this.token = null;
    this.currentUser = null;
    
    await SecureStorageService.remove('authToken');
    await StorageService.remove('currentUser');
  }
  
  /**
   * Get current user
   */
  getCurrentUser(): any {
    return this.currentUser;
  }
  
  /**
   * Check if authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }
  
  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.token;
  }
  
  /**
   * Check user role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.roles?.includes(role) || false;
  }
}

export default new SecurityService();
```

**Usage**:
```typescript
// Login
await this.SecurityService.login('john@example.com', 'password123');

// Check authentication
if (this.SecurityService.isAuthenticated()) {
  // User is logged in
}

// Get current user
const user = this.SecurityService.getCurrentUser();

// Check role
if (this.SecurityService.hasRole('admin')) {
  // Show admin features
}

// Logout
await this.SecurityService.logout();
```

### 8. Network Service

**Location**: `wavemaker-rn-runtime/src/core/network.service.ts`

**Purpose**: Network status monitoring

```typescript
class NetworkService {
  private isConnected = true;
  private listeners: Function[] = [];
  
  /**
   * Initialize network monitoring
   */
  init(): void {
    NetInfo.addEventListener(state => {
      const wasConnected = this.isConnected;
      this.isConnected = state.isConnected || false;
      
      if (wasConnected !== this.isConnected) {
        this.notifyListeners(this.isConnected);
      }
    });
  }
  
  /**
   * Check if connected
   */
  isNetworkConnected(): boolean {
    return this.isConnected;
  }
  
  /**
   * Get network state
   */
  async getNetworkState(): Promise<any> {
    return await NetInfo.fetch();
  }
  
  /**
   * Subscribe to network changes
   */
  subscribe(listener: Function): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(isConnected: boolean): void {
    this.listeners.forEach(listener => listener(isConnected));
  }
}

export default new NetworkService();
```

**Usage**:
```typescript
// Check network status
if (this.NetworkService.isNetworkConnected()) {
  // Make API call
} else {
  this.ToastService.error('No internet connection');
}

// Subscribe to network changes
const unsubscribe = this.NetworkService.subscribe((isConnected) => {
  if (isConnected) {
    console.log('Network connected');
  } else {
    console.log('Network disconnected');
  }
});

// Cleanup
this.cleanup.push(unsubscribe);
```

### 9. i18n Service

**Location**: `wavemaker-rn-runtime/src/core/i18n.service.ts`

**Purpose**: Internationalization and localization

```typescript
class I18nService {
  private currentLocale = 'en';
  private messages: Map<string, any> = new Map();
  
  /**
   * Set locale
   */
  setLocale(locale: string): void {
    this.currentLocale = locale;
  }
  
  /**
   * Get current locale
   */
  getLocale(): string {
    return this.currentLocale;
  }
  
  /**
   * Load messages for locale
   */
  loadMessages(locale: string, messages: any): void {
    this.messages.set(locale, messages);
  }
  
  /**
   * Get localized message
   */
  getMessage(key: string, params?: any): string {
    const messages = this.messages.get(this.currentLocale) || {};
    let message = messages[key] || key;
    
    // Replace parameters
    if (params) {
      Object.keys(params).forEach(param => {
        message = message.replace(`{${param}}`, params[param]);
      });
    }
    
    return message;
  }
  
  /**
   * Alias for getMessage
   */
  t(key: string, params?: any): string {
    return this.getMessage(key, params);
  }
}

export default new I18nService();
```

**Usage**:
```typescript
// Set locale
this.I18nService.setLocale('es');

// Get message
const message = this.I18nService.getMessage('welcome.message');

// With parameters
const greeting = this.I18nService.getMessage('hello.user', { name: 'John' });
// If messages['hello.user'] = 'Hello, {name}!'
// Result: 'Hello, John!'

// Short alias
const text = this.I18nService.t('button.submit');
```

### 10. Logger

**Location**: `wavemaker-rn-runtime/src/core/logger.ts`

**Purpose**: Application logging

```typescript
class Logger {
  private namespace: string;
  
  constructor(namespace: string = 'App') {
    this.namespace = namespace;
  }
  
  /**
   * Create child logger
   */
  extend(namespace: string): Logger {
    return new Logger(`${this.namespace}:${namespace}`);
  }
  
  /**
   * Debug log
   */
  debug(...args: any[]): void {
    if (__DEV__) {
      console.log(`[${this.namespace}]`, ...args);
    }
  }
  
  /**
   * Info log
   */
  info(...args: any[]): void {
    console.info(`[${this.namespace}]`, ...args);
  }
  
  /**
   * Warning log
   */
  warn(...args: any[]): void {
    console.warn(`[${this.namespace}]`, ...args);
  }
  
  /**
   * Error log
   */
  error(...args: any[]): void {
    console.error(`[${this.namespace}]`, ...args);
  }
}

export const ROOT_LOGGER = new Logger('WM');
export const WIDGET_LOGGER = ROOT_LOGGER.extend('widget');
export const VARIABLE_LOGGER = ROOT_LOGGER.extend('variable');
```

**Usage**:
```typescript
import { ROOT_LOGGER } from '@wavemaker/app-rn-runtime/core/logger';

const logger = ROOT_LOGGER.extend('MyComponent');

logger.debug('Component mounted');
logger.info('Data loaded:', data);
logger.warn('Deprecated prop used');
logger.error('Failed to save:', error);
```

## Service Patterns

### Singleton Pattern

All services are singletons:

```typescript
class MyService {
  private static instance: MyService;
  
  private constructor() {
    // Private constructor
  }
  
  public static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService();
    }
    return MyService.instance;
  }
}

export default MyService.getInstance();
```

### Observer Pattern

Services use observer pattern for state changes:

```typescript
class StateService {
  private state: any = {};
  private listeners: Function[] = [];
  
  setState(newState: any): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }
  
  subscribe(listener: Function): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}
```

## Agent Capabilities

### 1. Service Lookup

**Query**: "What does NavigationService do?"

**Response**: Complete NavigationService documentation with methods and examples

### 2. Service Usage

**Query**: "How to use Modal service?"

**Response**: Complete guide with alert, confirm, and custom modal examples

### 3. Service Integration

**Query**: "How to inject services in components?"

**Response**: Dependency injection guide with examples

### 4. Custom Services

**Query**: "How to create a custom service?"

**Response**: Step-by-step guide with template

## Best Practices

### Service Development

1. **Singleton Pattern**: Use singleton for services
2. **Dependency Injection**: Register with injector
3. **Type Safety**: Use TypeScript interfaces
4. **Error Handling**: Handle errors gracefully
5. **Cleanup**: Provide cleanup methods

### Service Usage

1. **Inject via Injector**: Use injector.get()
2. **Check Availability**: Check service exists before use
3. **Handle Errors**: Wrap calls in try-catch
4. **Cleanup Subscriptions**: Unsubscribe on unmount

---

**Agent Version**: 1.0  
**Last Updated**: November 3, 2025  
**Domain**: Runtime Services & Service Architecture

