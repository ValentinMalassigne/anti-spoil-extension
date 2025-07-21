# Extension Popup Error Troubleshooting Guide

## The Error You Encountered
The minified error you saw suggests there's a communication issue between the popup and content script.

## Updated Fixes Applied
1. **Better Error Handling**: Added comprehensive try-catch blocks
2. **Timing Issues**: Added small delay to ensure content script is loaded
3. **DOM Ready Check**: Improved popup initialization
4. **Debug Logging**: Added console logs to track script loading
5. **Null Checking**: Better validation of tab and element existence

## How to Debug

### Step 1: Check Content Script Loading
1. Go to YouTube.com
2. Open Developer Tools (F12)
3. Go to Console tab
4. You should see these messages:
   ```
   Anti-Spoil Extension content script loading...
   Anti-Spoil Extension initialized immediately (or on DOMContentLoaded)
   YouTubeBlurrer instance created
   ```

### Step 2: Test Popup Communication
1. Click the extension icon to open popup
2. Check both popup console and page console for errors
3. You should see: `Content script received message: {action: "get-status"}`

### Step 3: Manual Testing
Open browser console on YouTube and test:
```javascript
// Test if content script is responding
chrome.runtime.sendMessage({action: 'get-status'}, (response) => {
  console.log('Response:', response);
});
```

## Common Issues & Solutions

### Issue 1: "Extension not loaded. Please refresh the page."
**Solution**: 
- Refresh the YouTube page
- Make sure you're on a YouTube page (youtube.com)
- Check if content script console logs appear

### Issue 2: "Extension not ready. Please refresh the page."
**Solution**:
- Wait a moment after page load before opening popup
- Ensure the extension is properly loaded in chrome://extensions/

### Issue 3: DOM Elements Not Found
**Solution**:
- Check that popup.html has the correct element IDs:
  - `toggle-blur` (button)
  - `status-text` (span)

### Issue 4: Permission Issues
**Solution**:
- Make sure the extension has been granted permissions
- Try removing and re-adding the extension

## Testing Steps After Rebuild

1. **Reload Extension**:
   - Go to `chrome://extensions/`
   - Click the refresh icon on Anti-Spoil Extension
   
2. **Refresh YouTube Page**:
   - Go to any YouTube page
   - Refresh the page (F5)
   
3. **Check Console**:
   - Open DevTools (F12) → Console
   - Look for the initialization messages
   
4. **Test Popup**:
   - Click extension icon
   - Should show current blur status
   - Toggle should work without errors

## Advanced Debugging

### Enable Verbose Logging
The extension now logs all message communications. To see them:
1. Open DevTools on YouTube page
2. Click extension popup button
3. Watch console for detailed message logs

### Check Extension Background
1. Go to `chrome://extensions/`
2. Click "Details" on Anti-Spoil Extension
3. Click "Inspect views: popup" if available
4. Check popup console for errors

## Expected Behavior After Fix
- Popup opens without JavaScript errors
- Shows "Blur is ON/OFF" status immediately
- Toggle button works smoothly
- Console shows clear communication logs
- No minified error messages

If you still see errors after these fixes, please share the new error messages from the browser console!
