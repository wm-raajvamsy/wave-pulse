# Device Operations

## Overview

WaveMaker React Native provides comprehensive device feature integration through DeviceVariables and specialized widgets. The platform intelligently manages device permissions and includes only necessary plugins in the final build.

## Supported Device Features

### 1. Camera Operations

**Operations:**
- `captureImage`: Capture photo from camera
- `captureVideo`: Record video from camera

**Widget:** `WmCamera`

**DeviceVariable:**
```javascript
const cameraVar = createDeviceVariable({
  name: 'cameraVar',
  operation: 'captureImage',
  service: 'Camera'
});

// Invoke
await cameraVar.invoke({
  quality: 0.8,
  allowsEditing: true,
  aspect: [4, 3]
});

// Result
console.log(cameraVar.dataValue.uri);        // File URI
console.log(cameraVar.dataValue.width);      // Image width
console.log(cameraVar.dataValue.height);     // Image height
console.log(cameraVar.dataValue.fileSize);   // File size
```

**Packages Used:**
- `expo-camera`
- `expo-file-system`
- `expo-av`

**Permissions:**
- iOS: Camera usage description
- Android: CAMERA permission

### 2. Barcode Scanner

**Operation:** `scanBarCode`

**Widget:** `WmBarcodescanner`

**DeviceVariable:**
```javascript
const scanVar = createDeviceVariable({
  name: 'scanVar',
  operation: 'scanBarCode',
  service: 'Scan'
});

// Invoke
await scanVar.invoke({
  barcodeTypes: ['qr', 'ean13', 'code128']
});

// Result
console.log(scanVar.dataValue.type);    // 'qr'
console.log(scanVar.dataValue.data);    // Scanned data
```

**Packages Used:**
- `expo-camera`

**Permissions:**
- iOS: Camera usage description
- Android: CAMERA permission

### 3. Location Services

**Operation:** `getCurrentGeoPosition`

**DeviceVariable:**
```javascript
const locationVar = createDeviceVariable({
  name: 'locationVar',
  operation: 'getCurrentGeoPosition',
  service: 'Location'
});

// Invoke
await locationVar.invoke({
  accuracy: 'high',
  timeout: 10000
});

// Result
console.log(locationVar.dataValue.coords.latitude);
console.log(locationVar.dataValue.coords.longitude);
console.log(locationVar.dataValue.coords.altitude);
console.log(locationVar.dataValue.coords.accuracy);
console.log(locationVar.dataValue.timestamp);
```

**Packages Used:**
- `expo-location`

**Permissions:**
- iOS: Location usage descriptions
- Android: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION

### 4. Contacts

**Operation:** `getContacts`

**DeviceVariable:**
```javascript
const contactsVar = createDeviceVariable({
  name: 'contactsVar',
  operation: 'getContacts',
  service: 'Contacts'
});

// Invoke
await contactsVar.invoke({
  fields: ['name', 'phoneNumbers', 'emails']
});

// Result
contactsVar.dataValue.forEach(contact => {
  console.log(contact.name);
  console.log(contact.phoneNumbers);
  console.log(contact.emails);
});
```

**Packages Used:**
- `expo-contacts`

**Permissions:**
- iOS: Contacts usage description
- Android: READ_CONTACTS permission

### 5. Calendar

**Operations:**
- `getEvents`: Retrieve calendar events
- `createEvent`: Create calendar event
- `deleteEvent`: Delete calendar event

**DeviceVariable:**
```javascript
// Get events
const eventsVar = createDeviceVariable({
  name: 'eventsVar',
  operation: 'getEvents',
  service: 'Calendar'
});

await eventsVar.invoke({
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
});

// Create event
const createEventVar = createDeviceVariable({
  name: 'createEventVar',
  operation: 'createEvent',
  service: 'Calendar'
});

await createEventVar.invoke({
  title: 'Meeting',
  startDate: new Date('2024-06-15T10:00:00'),
  endDate: new Date('2024-06-15T11:00:00'),
  location: 'Office',
  notes: 'Important meeting'
});

// Delete event
const deleteEventVar = createDeviceVariable({
  name: 'deleteEventVar',
  operation: 'deleteEvent',
  service: 'Calendar'
});

await deleteEventVar.invoke({
  eventId: 'event123'
});
```

**Packages Used:**
- `expo-calendar`

**Permissions:**
- iOS: Calendar usage description
- Android: READ_CALENDAR, WRITE_CALENDAR

### 6. File Operations

**Operations:**
- `upload`: Pick and upload files
- `openFile`: Open/share files

**Widget:** `WmFileupload`

**DeviceVariable:**
```javascript
// Upload file
const uploadVar = createDeviceVariable({
  name: 'uploadVar',
  operation: 'upload',
  service: 'File'
});

await uploadVar.invoke({
  multiple: false,
  accept: 'image/*'
});

// Result
console.log(uploadVar.dataValue.uri);
console.log(uploadVar.dataValue.name);
console.log(uploadVar.dataValue.type);

// Open file
const openFileVar = createDeviceVariable({
  name: 'openFileVar',
  operation: 'openFile',
  service: 'File'
});

await openFileVar.invoke({
  uri: 'file:///path/to/file.pdf'
});
```

**Packages Used:**
- Upload: `expo-document-picker`
- Open: `expo-sharing`, `expo-file-system`

**Permissions:**
- iOS: Photo library usage (for images)
- Android: READ_EXTERNAL_STORAGE (for files)

### 7. Media Playback

**Operations:**
- `playAudio`: Play audio files
- `playVideo`: Play video files

**Widgets:** `WmAudio`, `WmVideo`

**DeviceVariable:**
```javascript
// Play audio
const audioVar = createDeviceVariable({
  name: 'audioVar',
  operation: 'playAudio',
  service: 'Audio'
});

await audioVar.invoke({
  source: 'https://example.com/audio.mp3',
  autoplay: true
});

// Play video
const videoVar = createDeviceVariable({
  name: 'videoVar',
  operation: 'playVideo',
  service: 'Video'
});

await videoVar.invoke({
  source: 'https://example.com/video.mp4',
  autoplay: true,
  controls: true
});
```

**Packages Used:**
- Audio: `expo-av`
- Video: `expo-video`

**Permissions:** None required for playback

### 8. Device Information

**Operations:**
- `getDeviceInfo`: Device details
- `getAppInfo`: App information
- `getNetworkInfo`: Network status
- `vibrate`: Vibrate device

**DeviceVariable:**
```javascript
// Device info
const deviceInfoVar = createDeviceVariable({
  name: 'deviceInfoVar',
  operation: 'getDeviceInfo',
  service: 'Device'
});

await deviceInfoVar.invoke();

console.log(deviceInfoVar.dataValue.brand);        // 'Apple', 'Samsung'
console.log(deviceInfoVar.dataValue.model);        // 'iPhone 14', 'Galaxy S21'
console.log(deviceInfoVar.dataValue.osName);       // 'iOS', 'Android'
console.log(deviceInfoVar.dataValue.osVersion);    // '16.0', '13.0'

// App info
const appInfoVar = createDeviceVariable({
  name: 'appInfoVar',
  operation: 'getAppInfo',
  service: 'Device'
});

await appInfoVar.invoke();

console.log(appInfoVar.dataValue.name);            // App name
console.log(appInfoVar.dataValue.version);         // App version
console.log(appInfoVar.dataValue.buildNumber);     // Build number

// Network info
const networkInfoVar = createDeviceVariable({
  name: 'networkInfoVar',
  operation: 'getNetworkInfo',
  service: 'Device'
});

await networkInfoVar.invoke();

console.log(networkInfoVar.dataValue.isConnected);     // true/false
console.log(networkInfoVar.dataValue.type);            // 'wifi', 'cellular'
console.log(networkInfoVar.dataValue.isInternetReachable);

// Vibrate
const vibrateVar = createDeviceVariable({
  name: 'vibrateVar',
  operation: 'vibrate',
  service: 'Device'
});

await vibrateVar.invoke({
  duration: 500  // milliseconds
});
```

**Packages Used:**
- Device: `expo-device`
- App: `expo-application`
- Network: `expo-network`, `@react-native-community/netinfo`
- Vibrate: React Native (built-in)

**Permissions:**
- Network: None
- Vibrate: VIBRATE (Android)

## Device Operation Patterns

### Using Widgets

```typescript
// Camera widget
<WmCamera
  name="camera1"
  capturetype="image"
  onSuccess={(event, widget) => {
    const imageUri = widget.datavalue.uri;
    fragment.Variables.photoVar.setValue(imageUri);
  }}
  onError={(event, widget) => {
    console.error('Camera error:', widget.error);
  }}
/>

// Barcode scanner widget
<WmBarcodescanner
  name="scanner1"
  onSuccess={(event, widget) => {
    const scannedData = widget.datavalue.data;
    fragment.Variables.barcodeVar.setValue(scannedData);
  }}
/>

// File upload widget
<WmFileupload
  name="fileupload1"
  multiple={false}
  accept="image/*"
  onSelect={(event, widget) => {
    const file = widget.datavalue;
    uploadFile(file);
  }}
/>
```

### Using DeviceVariables

```typescript
// In page script
export default {
  async capturePhoto() {
    try {
      await this.Variables.cameraVar.invoke({
        quality: 0.8,
        allowsEditing: true
      });
      
      const photo = this.Variables.cameraVar.dataValue;
      this.Variables.photoUrlVar.setValue(photo.uri);
      
      this.appConfig.ToastService.success('Photo captured!');
    } catch (error) {
      this.appConfig.ToastService.error('Failed to capture photo');
    }
  },
  
  async scanBarcode() {
    await this.Variables.scanVar.invoke();
    const barcode = this.Variables.scanVar.dataValue;
    
    if (barcode) {
      this.processBarcode(barcode.data);
    }
  },
  
  async getCurrentLocation() {
    this.appConfig.SpinnerService.show('Getting location...');
    
    try {
      await this.Variables.locationVar.invoke({
        accuracy: 'high'
      });
      
      const location = this.Variables.locationVar.dataValue;
      this.Variables.latitudeVar.setValue(location.coords.latitude);
      this.Variables.longitudeVar.setValue(location.coords.longitude);
    } finally {
      this.appConfig.SpinnerService.hide();
    }
  }
}
```

## Permission Management

### Automatic Permission Handling

The platform automatically:
1. Detects required permissions based on device operations used
2. Adds necessary permissions to app configuration
3. Requests permissions at runtime when needed
4. Handles permission denials gracefully

### Permission Flow

```
App starts
  ↓
User triggers device operation
  ↓
Check if permission granted
  ↓
No → Request permission from user
  ↓
Permission granted?
  ├─ Yes → Execute operation
  └─ No → Show error, cancel operation
```

### Manual Permission Check

```typescript
// Check permission status
import { PermissionService } from '@wavemaker/app-rn-runtime/runtime/services/device/permission-service';

const status = await PermissionService.checkCameraPermission();

if (status === 'granted') {
  // Permission granted
  capturePhoto();
} else if (status === 'denied') {
  // Permission denied
  showPermissionDeniedMessage();
} else {
  // Permission not requested yet
  const newStatus = await PermissionService.requestCameraPermission();
}
```

## Plugin Optimization

### Automatic Plugin Removal

The code generator automatically removes unused device plugins:

```typescript
// If app doesn't use camera:
// - expo-camera removed from package.json
// - Camera operations removed from device-operation-loader.js
// - Camera permissions removed from app.json
// Result: Smaller app size, faster builds
```

### Plugin Detection

The system detects plugin usage by:
1. Scanning for WmCamera, WmBarcodescanner widgets
2. Checking for DeviceVariables with camera/scan operations
3. Scanning JavaScript files for direct plugin imports

### Manual Plugin Inclusion

Force include a plugin even if not auto-detected:

```json
// wm_rn_config.json
{
  "plugins": [
    {
      "name": "expo-camera",
      "spec": "17.0.8"
    }
  ]
}
```

## Error Handling

### Common Error Scenarios

```typescript
// Permission denied
cameraVar.onError = (error) => {
  if (error.code === 'PERMISSION_DENIED') {
    toastService.error('Camera permission denied');
    // Show settings prompt
  }
};

// Operation cancelled
scanVar.onError = (error) => {
  if (error.code === 'USER_CANCELLED') {
    console.log('User cancelled scan');
  }
};

// Device not supported
locationVar.onError = (error) => {
  if (error.code === 'NOT_AVAILABLE') {
    toastService.error('Location not available on this device');
  }
};

// Timeout
locationVar.onError = (error) => {
  if (error.code === 'TIMEOUT') {
    toastService.error('Location request timed out');
  }
};
```

## Best Practices

### ✅ DO

1. **Request permissions appropriately:**
   ```typescript
   // Request when needed
   async onCapturePhoto() {
     await cameraVar.invoke();
   }
   ```

2. **Handle errors:**
   ```typescript
   cameraVar.onError = (error) => {
     console.error(error);
     showErrorMessage(error);
   };
   ```

3. **Provide feedback:**
   ```typescript
   spinnerService.show('Accessing camera...');
   await cameraVar.invoke();
   spinnerService.hide();
   ```

4. **Check availability:**
   ```typescript
   if (Platform.OS === 'web') {
     // Camera not available on web
     return;
   }
   ```

### ❌ DON'T

1. **Don't request permissions on app start:**
   ```typescript
   // ❌ Bad
   componentDidMount() {
     requestAllPermissions(); // Intrusive
   }
   ```

2. **Don't ignore permission denials:**
   ```typescript
   // ❌ Bad
   await cameraVar.invoke(); // No error handling
   ```

3. **Don't assume feature availability:**
   ```typescript
   // ❌ Bad
   await locationVar.invoke(); // Might not be available
   
   // ✅ Good
   if (await isLocationAvailable()) {
     await locationVar.invoke();
   }
   ```

## Next Steps

- [Plugin Management](./plugin-management.md) - Plugin system details
- [Permissions](./permissions.md) - Permission handling
- [Variable System](../variables/variable-system.md) - DeviceVariable details

