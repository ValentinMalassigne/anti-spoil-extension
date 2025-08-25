# Anti-Spoil Chrome Extension

A Chrome extension that blurs YouTube video thumbnails and titles to prevent spoilers while browsing. Perfect for avoiding spoilers for your favorite shows, movies, or gaming content.

## Features

- **Smart Blur**: Automatically blurs YouTube video thumbnails and titles from channels in your list
- **Channel-Based Filtering**: Only blur videos from specific channels you add to your list  
- **Player Progress Protection**: Hide progress bar and replace video duration with "??" for videos from channels in your list
- **Hover to Peek**: Hover over blurred content to temporarily reduce blur for quick previews
- **Toggle Control**: Easy on/off toggle via the extension popup
- **Persistent Settings**: Remembers your preferences and channel list across browser sessions
- **Dynamic Content**: Works with dynamically loaded YouTube content

## Installation

### From Source (Development)

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run build
   ```
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode" in the top right
6. Click "Load unpacked" and select the project folder
7. The extension should now be installed and active

## Usage

1. **Navigate to YouTube**: The extension automatically works on any YouTube page
2. **Add Channels**: Click the extension icon and add channel names (e.g., @channelname) to your blur list
3. **Toggle Blur**: Click the toggle button to enable/disable blurring for channels in your list
4. **Hide Progress & Duration**: Use the "Toggle Player Protection" to hide progress bar and duration for videos from channels in your list
5. **Preview Content**: Hover over blurred thumbnails or titles to peek at the content
6. **Settings**: Your blur preference, player controls setting, and channel list are automatically saved

## Development

### Scripts

- `npm run dev` - Start development build with watch mode
- `npm run build` - Create production build
- `npm run clean` - Clean build directory

### Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Language**: TypeScript
- **Build Tool**: Webpack
- **Target**: Modern Chrome browsers
- **Permissions**: `activeTab`, `storage`

### How It Works

1. **Content Script**: Injects into YouTube pages and scans for video thumbnails and titles
2. **Dynamic Detection**: Uses MutationObserver to detect new content as you scroll
3. **Smart Selectors**: Targets various YouTube elements including main feeds, sidebars, and playlists
4. **CSS Filtering**: Applies blur effects via CSS filters with smooth transitions
5. **User Control**: Popup interface communicates with content script via Chrome messaging API

## Browser Compatibility

- Chrome 88+
- Chromium-based browsers (Edge, Opera, etc.)

## Contributing

Feel free to open issues or submit pull requests to improve the extension.

## License

This project is open source and available under the MIT License.
