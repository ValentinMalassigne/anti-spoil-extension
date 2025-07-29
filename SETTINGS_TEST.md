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
3. Add a test channel to your list (e.g., @TestChannel)
4. Toggle player protection ON
5. Refresh the YouTube page
6. The blur should remain OFF and player protection should remain ON (settings persisted)
7. Close and reopen the browser tab
8. The settings should still be preserved (settings persisted across sessions)

## 3. Test Channel-Based Features
1. Add a specific channel to your list (e.g., @TestChannel)
2. Navigate to a video from that channel
3. Enable blur - should blur the video thumbnail/title
4. Enable player protection - should hide progress bar and duration
5. Navigate to a video from a different channel (not in your list)
6. Blur and player protection should NOT apply to videos from unlisted channels

## 4. Test Settings Sync
1. Toggle blur ON/OFF multiple times
2. Toggle player protection ON/OFF multiple times
3. Check browser console for "Settings saved:" messages
4. Settings are stored in both sync and local storage for redundancy

## 5. Test Error Handling
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
  "blurEnabled": true,
  "channelList": ["@channel1", "@channel2"],
  "hidePlayerControls": false
}
```

Both features (blur and player controls hiding) use the same channel list for consistency.
