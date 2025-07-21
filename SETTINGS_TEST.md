# Settings Storage Test

To test the persistent settings functionality:

## 1. Load the Extension
1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked" 
4. Select the `anti-spoil-extension` folder

## 2. Test Settings Persistence
1. Go to YouTube.com
2. Click the extension icon and toggle blur OFF
3. Refresh the YouTube page
4. The blur should remain OFF (settings persisted)
5. Close and reopen the browser tab
6. The blur should still be OFF (settings persisted across sessions)

## 3. Test Settings Sync
1. Toggle blur ON/OFF multiple times
2. Check browser console for "Settings saved:" messages
3. Settings are stored in both sync and local storage for redundancy

## 4. Test Error Handling
1. Try using the extension on a non-YouTube page
2. The popup should show an appropriate error message
3. Navigate back to YouTube and functionality should restore

## Technical Details

### Storage Keys
- Primary: `anti-spoil-settings` (object containing all settings)
- Legacy: `blurEnabled` (automatically migrated to new format)

### Storage Locations
- `chrome.storage.sync` (syncs across devices)
- `chrome.storage.local` (local backup)
- `localStorage` (fallback for testing)

### Settings Object Structure
```json
{
  "blurEnabled": true
}
```

Future settings can be easily added to this object.
