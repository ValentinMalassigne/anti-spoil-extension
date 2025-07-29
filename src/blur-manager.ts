// Manages the blur functionality for YouTube elements
import { ChannelDetector } from './channel-detector';

export class BlurManager {
  private originalDurations: Map<Element, string> = new Map(); // Store original duration values
  private isBlurEnabled: boolean = true;
  private channelList: string[] = [];
  private hidePlayerControls: boolean = false;
  private lastVideoUrl: string = ''; // Track URL changes to detect new videos

  constructor(isBlurEnabled: boolean = true) {
    this.isBlurEnabled = isBlurEnabled;
    this.lastVideoUrl = window.location.href; // Initialize with current URL
  }

  public setBlurEnabled(enabled: boolean): void {
    this.isBlurEnabled = enabled;
  }

  public setPlayerControlsHidden(hidden: boolean): void {
    this.hidePlayerControls = hidden;
  }

  public getPlayerControlsHidden(): boolean {
    return this.hidePlayerControls;
  }

  public setChannelList(channelList: string[]): void {
    this.channelList = [...channelList];
  }

  public getChannelList(): string[] {
    return [...this.channelList];
  }

  public applyBlur(): void {
    this.checkForVideoChange(); // Check for video changes when applying blur too
    this.blurThumbnails();
    this.blurTitles();
    this.blurDurations();
  }

  public applyPlayerControlsHiding(): void {
    this.checkForVideoChange();
    this.hideVideoPlayerControls();
  }

  private checkForVideoChange(): void {
    const currentUrl = window.location.href;
    if (currentUrl !== this.lastVideoUrl) {
      // Video has changed, clear the duration cache
      this.clearDurationCache();
      this.lastVideoUrl = currentUrl;
      console.log('Video changed, cleared duration cache');
    }
  }

  private clearDurationCache(): void {
    // Remove the anti-spoil class from all previously hidden durations
    const hiddenDurations = document.querySelectorAll('.ytp-time-duration.anti-spoil-player-controls-hidden');
    hiddenDurations.forEach((duration: Element) => {
      duration.classList.remove('anti-spoil-player-controls-hidden');
    });
    
    // Clear the cache
    this.originalDurations.clear();
  }

  private hideVideoPlayerControls(): void {
    if (!this.hidePlayerControls) return;

    // Check if we should hide controls based on channel list
    if (!this.shouldHidePlayerControlsForCurrentVideo()) {
      // If we shouldn't hide controls for this video, make sure they're visible
      this.removePlayerControlsHiding();
      return;
    }

    // Hide progress bar elements
    const progressBarSelectors = [
      '.ytp-progress-bar-container', // Progress bar container
      '.ytp-scrubber-container', // Scrubber (timeline) container
      '.ytp-progress-bar-padding', // Progress bar padding
      '.ytp-progress-list' // Progress bar list
    ];

    progressBarSelectors.forEach(selector => {
      const controls = document.querySelectorAll(selector);
      controls.forEach((control: Element) => {
        const controlElement = control as HTMLElement;
        
        if (!controlElement.classList.contains('anti-spoil-player-controls-hidden')) {
          controlElement.classList.add('anti-spoil-player-controls-hidden');
          // Use opacity for progress bars to maintain functionality
          controlElement.style.opacity = '0';
          controlElement.style.pointerEvents = 'none';
        }
      });
    });

    // Replace duration text with "??"
    const durationSelectors = [
      '.ytp-time-duration' // Duration display only
    ];

    durationSelectors.forEach(selector => {
      const durations = document.querySelectorAll(selector);
      durations.forEach((duration: Element) => {
        const durationElement = duration as HTMLElement;
        
        if (!durationElement.classList.contains('anti-spoil-player-controls-hidden')) {
          // Always get the current text content as it may have changed for new videos
          const currentText = durationElement.textContent?.trim();
          
          // Only store and replace if the current text looks like a duration (not already ??)
          if (currentText && /^\d+:\d{2}(:\d{2})?$/.test(currentText)) {
            // Clear any old stored duration for this element and store the new one
            this.originalDurations.set(durationElement, currentText);
            
            durationElement.classList.add('anti-spoil-player-controls-hidden');
            durationElement.textContent = '??:??';
          } else if (currentText && currentText !== '??:??') {
            // If it's not a standard duration format but also not already hidden, store and hide it
            this.originalDurations.set(durationElement, currentText);
            durationElement.classList.add('anti-spoil-player-controls-hidden');
            durationElement.textContent = '??:??';
          }
        }
      });
    });
  }

  private shouldHidePlayerControlsForCurrentVideo(): boolean {
    if (this.channelList.length === 0) {
      // If no channels in list, don't hide controls
      return false;
    }

    // Try to detect the channel from various sources
    // First, check if we're on a video page by looking for the player
    const videoPlayer = document.querySelector('#movie_player, .html5-video-player');
    if (!videoPlayer) {
      console.log('BlurManager: No video player found, not hiding controls');
      return false;
    }

    // Method 1: Check if we're on a channel page
    const pageChannelName = this.detectChannelFromPageContext();
    if (pageChannelName) {
      const shouldHide = this.channelList.some(listedChannel => 
        listedChannel.toLowerCase() === pageChannelName.toLowerCase()
      );
      console.log('BlurManager: Channel page detected:', pageChannelName, 'Should hide controls:', shouldHide);
      return shouldHide;
    }

    // Method 2: Look for channel info in the video page
    const channelSelectors = [
      // Video page channel info
      'ytd-video-owner-renderer .ytd-channel-name a',
      '.ytd-channel-name a',
      '#channel-name a',
      '#owner-sub-count a',
      'a[href*="/@"]',
      '.yt-simple-endpoint[href*="/@"]'
    ];

    for (const selector of channelSelectors) {
      const channelLink = document.querySelector(selector) as HTMLAnchorElement;
      if (channelLink) {
        const channelName = this.extractChannelNameFromLink(channelLink);
        if (channelName) {
          const shouldHide = this.channelList.some(listedChannel => 
            listedChannel.toLowerCase() === channelName.toLowerCase()
          );
          console.log('BlurManager: Detected channel for player controls:', channelName, 'Should hide:', shouldHide);
          return shouldHide;
        }
      }
    }

    console.log('BlurManager: No channel detected for current video, not hiding controls');
    return false;
  }

  private extractChannelNameFromLink(channelLink: HTMLAnchorElement): string | null {
    // Try to get from href attribute (e.g., /@channelname)
    const href = channelLink.href;
    if (href) {
      const atMatch = href.match(/@([^/?]+)/);
      if (atMatch) {
        return `@${atMatch[1]}`;
      }
    }

    // Try to get from text content
    const text = channelLink.textContent?.trim();
    if (text) {
      // If it already starts with @, return as is
      if (text.startsWith('@')) {
        return text;
      }
      // Otherwise, add @ prefix
      return `@${text}`;
    }

    return null;
  }

  private detectChannelFromPageContext(): string | null {
    const currentUrl = window.location.href;

    // Check if we're on a channel page
    // Pattern 1: youtube.com/@channelname
    const channelMatch = currentUrl.match(/youtube\.com\/@([^/?#]+)/);
    if (channelMatch) {
      const result = `@${channelMatch[1]}`;
      console.log('BlurManager: Detected from URL pattern 1:', result);
      return result;
    }

    // Pattern 2: youtube.com/channel/UC... or youtube.com/c/channelname  
    const legacyMatch = currentUrl.match(/youtube\.com\/(?:channel\/UC[^/?#]+|c\/([^/?#]+))/);
    if (legacyMatch) {
      // For legacy URLs, try to get channel name from page header
      const channelHeader = document.querySelector('#channel-name .ytd-channel-name, .ytd-channel-name, [id="channel-name"]');
      if (channelHeader) {
        const channelText = channelHeader.textContent?.trim();
        if (channelText) {
          const result = channelText.startsWith('@') ? channelText : `@${channelText}`;
          console.log('BlurManager: Detected from legacy URL header:', result);
          return result;
        }
      }
    }

    return null;
  }

  public removeBlur(): void {
    // Remove blur from thumbnails
    const blurredThumbnails = document.querySelectorAll('.anti-spoil-blurred');
    blurredThumbnails.forEach((img: Element) => {
      const imgElement = img as HTMLImageElement;
      imgElement.style.filter = 'none';
      imgElement.classList.remove('anti-spoil-blurred');
    });

    // Remove blur from titles
    const blurredTitles = document.querySelectorAll('.anti-spoil-title-blurred');
    blurredTitles.forEach((title: Element) => {
      const titleElement = title as HTMLElement;
      titleElement.style.filter = 'none';
      titleElement.classList.remove('anti-spoil-title-blurred');
    });

    // Restore original durations
    const hiddenDurations = document.querySelectorAll('.anti-spoil-duration-hidden');
    hiddenDurations.forEach((duration: Element) => {
      const durationElement = duration as HTMLElement;
      const originalText = this.originalDurations.get(durationElement);
      if (originalText) {
        durationElement.textContent = originalText;
      }
      durationElement.classList.remove('anti-spoil-duration-hidden');
    });
  }

  public removePlayerControlsHiding(): void {
    // Show hidden progress bars
    const hiddenProgressBars = document.querySelectorAll('.ytp-progress-bar-container.anti-spoil-player-controls-hidden, .ytp-scrubber-container.anti-spoil-player-controls-hidden, .ytp-progress-bar-padding.anti-spoil-player-controls-hidden, .ytp-progress-list.anti-spoil-player-controls-hidden');
    hiddenProgressBars.forEach((control: Element) => {
      const controlElement = control as HTMLElement;
      controlElement.style.opacity = '';
      controlElement.style.pointerEvents = '';
      controlElement.classList.remove('anti-spoil-player-controls-hidden');
    });

    // Restore original duration text
    const hiddenDurations = document.querySelectorAll('.ytp-time-duration.anti-spoil-player-controls-hidden');
    hiddenDurations.forEach((duration: Element) => {
      const durationElement = duration as HTMLElement;
      const originalText = this.originalDurations.get(durationElement);
      if (originalText) {
        durationElement.textContent = originalText;
      }
      durationElement.classList.remove('anti-spoil-player-controls-hidden');
    });

    // Clear the duration cache since we're turning off the feature
    this.originalDurations.clear();
  }

  private blurThumbnails(): void {
    if (!this.isBlurEnabled) return;

    // YouTube thumbnail selectors
    const thumbnailSelectors = [
      'ytd-thumbnail img', // Main thumbnails
      '#thumbnail img', // Thumbnail in various contexts
      '.ytp-videowall-still-image', // End screen thumbnails
      'ytd-playlist-thumbnail img', // Playlist thumbnails
      'ytd-moving-thumbnail-renderer img', // Hover thumbnails
      // New layout selectors
      '.yt-core-image', // New layout thumbnails
      'yt-thumbnail-view-model img', // New layout container
      '.yt-lockup-view-model-wiz img' // Direct selector for new layout
    ];

    thumbnailSelectors.forEach(selector => {
      const thumbnails = document.querySelectorAll(selector);
      thumbnails.forEach((thumbnail: Element) => {
        const img = thumbnail as HTMLImageElement;
        
        // Check if this video has been watched (has progress bar)
        if (this.hasWatchProgress(img)) {
          return; // Skip blurring for watched videos
        }

        // Check if this video should be blurred based on channel list
        if (!ChannelDetector.shouldBlurVideo(img, this.channelList)) {
          // Remove blur if it was previously applied but shouldn't be anymore
          if (img.classList.contains('anti-spoil-blurred')) {
            img.style.filter = 'none';
            img.classList.remove('anti-spoil-blurred');
          }
          return;
        }
        
        if (!img.classList.contains('anti-spoil-blurred')) {
          img.classList.add('anti-spoil-blurred');
          img.style.filter = 'blur(10px)';
          img.style.transition = 'filter 0.3s ease';
          
          // Add hover effect to temporarily unblur
          img.addEventListener('mouseenter', () => {
            if (this.isBlurEnabled) {
              img.style.filter = 'blur(2px)';
            }
          });
          
          img.addEventListener('mouseleave', () => {
            if (this.isBlurEnabled) {
              img.style.filter = 'blur(10px)';
            }
          });
        }
      });
    });
  }

  private blurTitles(): void {
    if (!this.isBlurEnabled) return;

    // YouTube title selectors
    const titleSelectors = [
      '#video-title', // Video titles
      'h3.ytd-video-renderer', // Video titles in listings
      '.ytd-playlist-video-renderer #video-title', // Playlist video titles
      'h3.ytd-compact-video-renderer', // Sidebar video titles
      '.ytd-rich-grid-media #video-title', // Grid layout titles
      // New layout selectors - more specific to avoid metadata
      '.yt-lockup-metadata-view-model-wiz__title .yt-core-attributed-string', // Only title text within title container
      'h3.yt-lockup-metadata-view-model-wiz__heading-reset .yt-core-attributed-string', // Specific heading text
      '.yt-lockup-metadata-view-model-wiz__title' // Title container itself
    ];

    titleSelectors.forEach(selector => {
      const titles = document.querySelectorAll(selector);
      titles.forEach((title: Element) => {
        const titleElement = title as HTMLElement;
        
        // Check if this video has been watched (has progress bar)
        if (this.hasWatchProgress(titleElement)) {
          return; // Skip blurring for watched videos
        }

        // Check if this video should be blurred based on channel list
        if (!ChannelDetector.shouldBlurVideo(titleElement, this.channelList)) {
          // Remove blur if it was previously applied but shouldn't be anymore
          if (titleElement.classList.contains('anti-spoil-title-blurred')) {
            titleElement.style.filter = 'none';
            titleElement.classList.remove('anti-spoil-title-blurred');
          }
          return;
        }
        
        if (!titleElement.classList.contains('anti-spoil-title-blurred')) {
          titleElement.classList.add('anti-spoil-title-blurred');
          titleElement.style.filter = 'blur(5px)';
          titleElement.style.transition = 'filter 0.3s ease';
          
          // Add hover effect
          titleElement.addEventListener('mouseenter', () => {
            if (this.isBlurEnabled) {
              titleElement.style.filter = 'blur(1px)';
            }
          });
          
          titleElement.addEventListener('mouseleave', () => {
            if (this.isBlurEnabled) {
              titleElement.style.filter = 'blur(5px)';
            }
          });
        }
      });
    });
  }

  private blurDurations(): void {
    if (!this.isBlurEnabled) return;

    // YouTube duration selectors - target the text elements that contain duration
    const durationSelectors = [
      '.badge-shape-wiz__text', // Duration badge text
      'span.ytd-thumbnail-overlay-time-status-renderer', // Alternative duration selector
      '.ytp-time-duration' // Video player duration
    ];

    durationSelectors.forEach(selector => {
      const durations = document.querySelectorAll(selector);
      durations.forEach((duration: Element) => {
        const durationElement = duration as HTMLElement;
        const text = durationElement.textContent?.trim();
        
        // Check if this video has been watched (has progress bar)
        if (this.hasWatchProgress(durationElement)) {
          return; // Skip blurring for watched videos
        }

        // Check if this video should be blurred based on channel list
        if (!ChannelDetector.shouldBlurVideo(durationElement, this.channelList)) {
          // Restore original duration if it was previously hidden
          if (durationElement.classList.contains('anti-spoil-duration-hidden')) {
            const originalText = this.originalDurations.get(durationElement);
            if (originalText) {
              durationElement.textContent = originalText;
            }
            durationElement.classList.remove('anti-spoil-duration-hidden');
          }
          return;
        }
        
        // Check if the text looks like a duration (contains : and numbers)
        if (text && /^\d+:\d{2}(:\d{2})?$/.test(text) && !durationElement.classList.contains('anti-spoil-duration-hidden')) {
          // Store original duration if not already stored
          if (!this.originalDurations.has(durationElement)) {
            this.originalDurations.set(durationElement, text);
          }
          
          durationElement.classList.add('anti-spoil-duration-hidden');

          durationElement.textContent = '?? : ??';
          
          // Add hover effect to show real duration temporarily
          durationElement.addEventListener('mouseenter', () => {
            if (this.isBlurEnabled) {
              const originalText = this.originalDurations.get(durationElement);
              if (originalText) {
                durationElement.textContent = originalText;
              }
            }
          });
          
          durationElement.addEventListener('mouseleave', () => {
            if (this.isBlurEnabled) {
              durationElement.textContent = '?? : ??';
            }
          });
        }
      });
    });
  }

  private hasWatchProgress(element: Element): boolean {
    // Find the closest video container that might contain the progress bar
    const videoContainer = element.closest('ytd-rich-item-renderer') || 
                          element.closest('ytd-video-renderer') || 
                          element.closest('ytd-compact-video-renderer') ||
                          element.closest('ytd-playlist-video-renderer') ||
                          element.closest('ytd-grid-video-renderer') ||
                          element.closest('.yt-lockup-view-model-wiz'); // New layout

    if (!videoContainer) {
      return false;
    }

    // Look for the progress bar indicator
    const progressBar = videoContainer.querySelector('#progress') ||
                       videoContainer.querySelector('.ytd-thumbnail-overlay-resume-playback-renderer #progress') ||
                       videoContainer.querySelector('[id="progress"]');

    // Also check for other watched indicators
    const watchedIndicator = videoContainer.querySelector('.ytd-thumbnail-overlay-resume-playback-renderer') ||
                            videoContainer.querySelector('[aria-label*="watched"]') ||
                            videoContainer.querySelector('[aria-label*="Watched"]');

    return !!(progressBar || watchedIndicator);
  }
}
