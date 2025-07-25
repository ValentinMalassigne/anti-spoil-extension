# Testing the Channel-Based Blur Feature

The Anti-Spoil Extension now only blurs videos from channels you specifically add to your list. Here's how to test the new functionality:

## Setup Instructions

1. **Load the Extension**
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the `anti-spoil-extension` folder

2. **Navigate to YouTube**
   - Go to https://youtube.com
   - Browse to a page with multiple videos (homepage, search results, etc.)

## Testing Steps

### 1. Test Empty Channel List (Default Behavior)
1. Click the extension icon
2. Verify the channel list is empty
3. Toggle blur ON
4. **Expected**: No videos should be blurred (empty list = no blur)
5. Toggle blur OFF

### 2. Test Adding Channels
1. Find a YouTube video from a specific channel
2. Note the channel name (e.g., if the channel URL is `youtube.com/@TechReviews`, the name is `@TechReviews`)
3. In the extension popup, add the channel: `@TechReviews`
4. Toggle blur ON
5. **Expected**: Only videos from `@TechReviews` should be blurred
6. **Expected**: Videos from other channels should remain unblurred

### 3. Test Multiple Channels
1. Add 2-3 different channels to your list
2. Navigate to a YouTube page with videos from various channels
3. Toggle blur ON
4. **Expected**: Only videos from channels in your list are blurred
5. **Expected**: Other videos remain clear

### 4. Test Channel Detection
The extension tries to detect channel names from various YouTube layouts:
- **Homepage videos**: Grid layout with channel names below titles
- **Search results**: List view with channel info
- **Watch page sidebar**: Recommended videos with channel names
- **Channel pages**: Special handling - detects channel from page URL/context
  - On channel pages (e.g., youtube.com/@channelname), all videos are from that channel
  - See `CHANNEL_PAGE_TESTING.md` for detailed channel page testing instructions

### 5. Test Real-Time Updates
1. With blur enabled and some channels in your list
2. Add a new channel through the popup
3. **Expected**: Videos from the newly added channel should blur immediately
4. Remove a channel from the list
5. **Expected**: Videos from the removed channel should unblur immediately

## Troubleshooting

### If videos aren't blurring:
1. Check that the channel name format is correct (`@channelname`)
2. Verify the channel is actually in your list (check popup)
3. Make sure blur is toggled ON
4. Try refreshing the YouTube page

### If wrong videos are blurring:
1. The extension uses YouTube's displayed channel names
2. Some channels might have different display names vs URL names
3. Check the browser console for debug messages about channel detection

### Debug Mode
Open browser DevTools console to see debug information:
- Channel names being detected
- Which videos are being processed
- Any errors in channel name matching

## Expected Behavior Summary

- **Empty channel list + Blur ON**: No videos blurred
- **Channels in list + Blur ON**: Only videos from listed channels blurred  
- **Channels in list + Blur OFF**: No videos blurred
- **Hover over blurred content**: Temporarily reduces blur for preview
- **Channel list changes**: Immediately updates blur state without page refresh

## Test Cases to Verify

✅ Empty list blurs nothing  
✅ Single channel in list blurs only that channel's videos  
✅ Multiple channels blur videos from all listed channels  
✅ Removing channels immediately unblurs those videos  
✅ Adding channels immediately blurs those videos  
✅ Toggle works correctly with channel-based filtering  
✅ Settings persist across browser sessions  
✅ Works on different YouTube page layouts (home, search, watch, channel pages)
