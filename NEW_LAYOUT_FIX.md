# Anti-Spoil Extension: New Layout Support Fix

## Issue Fixed
The extension was not properly blurring videos and titles in the recommended videos section on YouTube video pages due to YouTube's new layout using different DOM structure.

## Changes Made

### 1. Updated Channel Detector (`src/channel-detector.ts`)

#### Added New Container Support
- Added `yt-lockup-view-model-wiz` and `.yt-lockup-view-model-wiz` to the container selectors in `findVideoContainer()` method
- This allows the extension to recognize the new layout containers

#### Added New Layout Channel Detection
- Created new method `extractChannelFromNewLayout()` to handle channel name extraction from the new layout
- The new layout stores channel names as plain text in `.yt-content-metadata-view-model-wiz__metadata-row` elements
- Added intelligent filtering to avoid matching view counts, timestamps, and other metadata as channel names
- Automatically adds `@` prefix to channel names that don't already have it

#### Enhanced Main Detection Logic
- Added special handling in `getChannelNameFromVideoElement()` to check for new layout and use the appropriate extraction method
- Maintains backward compatibility with existing layouts

### 2. Updated Blur Manager (`src/blur-manager.ts`)

#### Enhanced Thumbnail Selectors
Added new selectors to target thumbnails in the new layout:
- `.yt-core-image` - New layout thumbnail images
- `yt-thumbnail-view-model img` - New layout thumbnail containers
- `.yt-lockup-view-model-wiz img` - Direct selector for new layout

#### Enhanced Title Selectors
Added new selectors to target titles in the new layout while avoiding metadata:
- `.yt-lockup-metadata-view-model-wiz__title .yt-core-attributed-string` - New layout title text within title container only
- `h3.yt-lockup-metadata-view-model-wiz__heading-reset .yt-core-attributed-string` - Specific heading text
- `.yt-lockup-metadata-view-model-wiz__title` - New layout title container

**Important**: Removed overly broad selectors like `.yt-core-attributed-string` that were accidentally blurring channel metadata (channel names, view counts, publish dates)

#### Enhanced Watch Progress Detection
- Updated `hasWatchProgress()` method to include `.yt-lockup-view-model-wiz` containers
- This ensures watched videos are properly excluded from blurring in the new layout

#### Duration Blurring
- The existing `.badge-shape-wiz__text` selector already covered the new layout duration badges
- No additional changes needed for duration blurring

## Technical Details

### New Layout Structure
The new YouTube layout uses this structure:
```html
<div class="yt-lockup-view-model-wiz">
  <a class="yt-lockup-view-model-wiz__content-image">
    <yt-thumbnail-view-model>
      <img class="yt-core-image" src="...">
      <badge-shape>
        <div class="badge-shape-wiz__text">17:40</div>
      </badge-shape>
    </yt-thumbnail-view-model>
  </a>
  <div class="yt-lockup-view-model-wiz__metadata">
    <h3>
      <a class="yt-lockup-metadata-view-model-wiz__title">
        <span class="yt-core-attributed-string">Video Title</span>
      </a>
    </h3>
    <yt-content-metadata-view-model>
      <div class="yt-content-metadata-view-model-wiz__metadata-row">
        <span>ChannelName</span>
      </div>
      <div class="yt-content-metadata-view-model-wiz__metadata-row">
        <span>1.1k views • 49 minutes ago</span>
      </div>
    </yt-content-metadata-view-model>
  </div>
</div>
```

### Channel Name Detection Strategy
1. **First Priority**: Try existing selectors for channel links with `@` symbols or `/channel/` URLs
2. **Second Priority**: For new layout, extract channel name from first metadata row
3. **Third Priority**: Fallback to text content scanning for `@` patterns

### Filtering Logic
The new layout detection includes filtering to avoid false positives:
- Excludes text containing view counts ("vues", "views")
- Excludes timestamps ("il y a", "ago")
- Excludes delimiters ("•")
- Excludes pure numeric content

## Testing
- Created test HTML file (`test-new-layout.html`) to verify selector functionality
- All builds compile successfully
- Extension maintains backward compatibility with existing layouts

## Result
The extension now properly detects and blurs:
- ✅ Thumbnails in recommended videos on video pages
- ✅ Titles in recommended videos on video pages (but NOT channel metadata)
- ✅ Durations in recommended videos on video pages
- ✅ Channel names from the new layout structure for blur detection
- ✅ Maintains compatibility with all existing layouts

**What is NOT blurred** (as intended):
- ❌ Channel names in video metadata
- ❌ View counts (e.g., "1,1 k vues")  
- ❌ Publish dates (e.g., "il y a 49 minutes")
- ❌ Other video metadata text
