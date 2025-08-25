// Centralized CSS selector constants for YouTube layouts

// Selectors to locate channel links within a video/listing container
export const CHANNEL_LINK_SELECTORS: readonly string[] = [
  // Main video page
  'ytd-video-owner-renderer .ytd-channel-name a',
  // Video listings/search results
  '.ytd-channel-name a',
  // Compact video renderer (sidebar)
  'ytd-compact-video-renderer .ytd-channel-name a',
  // Rich grid media (homepage)
  'ytd-rich-grid-media .ytd-channel-name a',
  // Video meta info
  '#channel-name a',
  '#owner-sub-count a',
  // Alternative selectors
  'a[href*="/channel/"], a[href*="/@"]',
  '.yt-simple-endpoint[href*="/@"]',
  // Channel page specific selectors
  '.ytd-grid-video-renderer .ytd-channel-name a',
  '.metadata-line a[href*="/@"]',
  '.ytd-video-meta-block a[href*="/@"]',
  // More generic selectors
  'a[href*="youtube.com/@"]',
  '[href*="/@"]'
];

// Selectors to identify the closest video container
export const VIDEO_CONTAINER_SELECTORS: readonly string[] = [
  'ytd-video-renderer',
  'ytd-compact-video-renderer',
  'ytd-rich-item-renderer',
  'ytd-playlist-video-renderer',
  'ytd-grid-video-renderer',
  'ytd-video-meta-block',
  // Channel page specific containers
  'ytd-grid-video-renderer',
  'ytd-channel-video-player-renderer',
  'ytd-shelf-renderer',
  // New layout containers
  'yt-lockup-view-model-wiz',
  '.yt-lockup-view-model-wiz',
  // Additional containers
  '.ytd-video-renderer',
  '.ytd-rich-item-renderer'
];

// Selectors used to detect channel name on channel pages (header or meta)
export const PAGE_CHANNEL_HEADER_SELECTORS: readonly string[] = [
  '#channel-name .ytd-channel-name',
  '.ytd-channel-name',
  '[id="channel-name"]',
  'ytd-channel-header-renderer [id="text"]'
];

// Selectors to detect channel on the video watch page (for player controls feature)
export const VIDEO_PAGE_CHANNEL_LINK_SELECTORS: readonly string[] = [
  'ytd-video-owner-renderer .ytd-channel-name a',
  '.ytd-channel-name a',
  '#channel-name a',
  '#owner-sub-count a',
  'a[href*="/@"]',
  '.yt-simple-endpoint[href*="/@"]'
];

// Player controls related selectors
export const PLAYER_PROGRESS_BAR_SELECTORS: readonly string[] = [
  '.ytp-progress-bar-container',
  '.ytp-scrubber-container',
  '.ytp-progress-bar-padding',
  '.ytp-progress-list'
];

export const PLAYER_DURATION_ONLY_SELECTORS: readonly string[] = [
  '.ytp-time-duration'
];

// Blur targets
export const THUMBNAIL_SELECTORS: readonly string[] = [
  'ytd-thumbnail img',
  '#thumbnail img',
  '.ytp-videowall-still-image',
  'ytd-playlist-thumbnail img',
  'ytd-moving-thumbnail-renderer img',
  // New layout
  '.yt-core-image',
  'yt-thumbnail-view-model img',
  '.yt-lockup-view-model-wiz img'
];

export const TITLE_SELECTORS: readonly string[] = [
  '#video-title',
  'h3.ytd-video-renderer',
  '.ytd-playlist-video-renderer #video-title',
  'h3.ytd-compact-video-renderer',
  '.ytd-rich-grid-media #video-title',
  // New layout specific
  '.yt-lockup-metadata-view-model-wiz__title .yt-core-attributed-string',
  'h3.yt-lockup-metadata-view-model-wiz__heading-reset .yt-core-attributed-string',
  '.yt-lockup-metadata-view-model-wiz__title'
];

export const DURATION_SELECTORS: readonly string[] = [
  '.badge-shape-wiz__text',
  'span.ytd-thumbnail-overlay-time-status-renderer',
  '.ytp-time-duration'
];

// Reusable CSS class names
export const CSS_CLASSES = {
  THUMBNAIL_BLURRED: 'anti-spoil-blurred',
  TITLE_BLURRED: 'anti-spoil-title-blurred',
  DURATION_HIDDEN: 'anti-spoil-duration-hidden',
  PLAYER_CONTROLS_HIDDEN: 'anti-spoil-player-controls-hidden',
} as const;

// Placeholder used when hiding durations in UI
export const DURATION_PLACEHOLDER = '??:??';

// Selectors indicating a video has been watched (progress overlay etc.)
export const WATCH_PROGRESS_INDICATOR_SELECTORS: readonly string[] = [
  '#progress',
  '.ytd-thumbnail-overlay-resume-playback-renderer #progress',
  '[id="progress"]',
  '.ytd-thumbnail-overlay-resume-playback-renderer',
  '[aria-label*="watched"]',
  '[aria-label*="Watched"]'
];
