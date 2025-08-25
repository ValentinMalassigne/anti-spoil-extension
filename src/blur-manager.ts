// Manages the blur functionality for YouTube elements
import { ChannelDetector } from './channel-detector';
import {
  PLAYER_PROGRESS_BAR_SELECTORS,
  PLAYER_DURATION_ONLY_SELECTORS,
  VIDEO_PAGE_CHANNEL_LINK_SELECTORS,
  THUMBNAIL_SELECTORS,
  TITLE_SELECTORS,
  DURATION_SELECTORS,
  CSS_CLASSES,
  DURATION_PLACEHOLDER,
  WATCH_PROGRESS_INDICATOR_SELECTORS,
} from './constants';

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
    const hiddenDurations = document.querySelectorAll(`.ytp-time-duration.${CSS_CLASSES.PLAYER_CONTROLS_HIDDEN}`);
    hiddenDurations.forEach((duration: Element) => {
      duration.classList.remove(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN);
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
    const progressBarSelectors = PLAYER_PROGRESS_BAR_SELECTORS;

    progressBarSelectors.forEach(selector => {
      const controls = document.querySelectorAll(selector);
      controls.forEach((control: Element) => {
        const controlElement = control as HTMLElement;
        
        if (!controlElement.classList.contains(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN)) {
          controlElement.classList.add(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN);
          // Use opacity for progress bars to maintain functionality
          controlElement.style.opacity = '0';
          controlElement.style.pointerEvents = 'none';
        }
      });
    });

    // Replace duration text with placeholder
    const durationSelectors = PLAYER_DURATION_ONLY_SELECTORS;

    durationSelectors.forEach(selector => {
      const durations = document.querySelectorAll(selector);
      durations.forEach((duration: Element) => {
        const durationElement = duration as HTMLElement;
        
        if (!durationElement.classList.contains(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN)) {
          // Always get the current text content as it may have changed for new videos
          const currentText = durationElement.textContent?.trim();
          
          // Only store and replace if the current text looks like a duration (not already placeholder)
          if (currentText && /^\d+:\d{2}(:\d{2})?$/.test(currentText)) {
            this.originalDurations.set(durationElement, currentText);
            durationElement.classList.add(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN);
            durationElement.textContent = DURATION_PLACEHOLDER;
          } else if (currentText && currentText !== DURATION_PLACEHOLDER) {
            this.originalDurations.set(durationElement, currentText);
            durationElement.classList.add(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN);
            durationElement.textContent = DURATION_PLACEHOLDER;
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

    // First, check if we're on a video page by looking for the player
    const videoPlayer = document.querySelector('#movie_player, .html5-video-player');
    if (!videoPlayer) {
      console.log('BlurManager: No video player found, not hiding controls');
      return false;
    }

    // Method 1: Check if we're on a channel page
    const pageChannelName = ChannelDetector.detectChannelFromPageContext();
    if (pageChannelName) {
      const shouldHide = this.channelList.some(listedChannel => 
        listedChannel.toLowerCase() === pageChannelName.toLowerCase()
      );
      console.log('BlurManager: Channel page detected:', pageChannelName, 'Should hide controls:', shouldHide);
      return shouldHide;
    }

    // Method 2: Look for channel info in the video page
    const channelSelectors = VIDEO_PAGE_CHANNEL_LINK_SELECTORS;

    for (const selector of channelSelectors) {
      const channelLink = document.querySelector(selector) as HTMLAnchorElement;
      if (channelLink) {
        const channelName = ChannelDetector.extractChannelNameFromLink(channelLink);
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

  public removeBlur(): void {
    // Remove blur from thumbnails
    const blurredThumbnails = document.querySelectorAll(`.${CSS_CLASSES.THUMBNAIL_BLURRED}`);
    blurredThumbnails.forEach((img: Element) => {
      const imgElement = img as HTMLImageElement;
      imgElement.style.filter = 'none';
      imgElement.classList.remove(CSS_CLASSES.THUMBNAIL_BLURRED);
    });

    // Remove blur from titles
    const blurredTitles = document.querySelectorAll(`.${CSS_CLASSES.TITLE_BLURRED}`);
    blurredTitles.forEach((title: Element) => {
      const titleElement = title as HTMLElement;
      titleElement.style.filter = 'none';
      titleElement.classList.remove(CSS_CLASSES.TITLE_BLURRED);
    });

    // Restore original durations
    const hiddenDurations = document.querySelectorAll(`.${CSS_CLASSES.DURATION_HIDDEN}`);
    hiddenDurations.forEach((duration: Element) => {
      const durationElement = duration as HTMLElement;
      const originalText = this.originalDurations.get(durationElement);
      if (originalText) {
        durationElement.textContent = originalText;
      }
      durationElement.classList.remove(CSS_CLASSES.DURATION_HIDDEN);
    });
  }

  public removePlayerControlsHiding(): void {
    // Show hidden progress bars
    const hiddenProgressBars = document.querySelectorAll(`.ytp-progress-bar-container.${CSS_CLASSES.PLAYER_CONTROLS_HIDDEN}, .ytp-scrubber-container.${CSS_CLASSES.PLAYER_CONTROLS_HIDDEN}, .ytp-progress-bar-padding.${CSS_CLASSES.PLAYER_CONTROLS_HIDDEN}, .ytp-progress-list.${CSS_CLASSES.PLAYER_CONTROLS_HIDDEN}`);
    hiddenProgressBars.forEach((control: Element) => {
      const controlElement = control as HTMLElement;
      controlElement.style.opacity = '';
      controlElement.style.pointerEvents = '';
      controlElement.classList.remove(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN);
    });

    // Restore original duration text
    const hiddenDurations = document.querySelectorAll(`.ytp-time-duration.${CSS_CLASSES.PLAYER_CONTROLS_HIDDEN}`);
    hiddenDurations.forEach((duration: Element) => {
      const durationElement = duration as HTMLElement;
      const originalText = this.originalDurations.get(durationElement);
      if (originalText) {
        durationElement.textContent = originalText;
      }
      durationElement.classList.remove(CSS_CLASSES.PLAYER_CONTROLS_HIDDEN);
    });

    // Clear the duration cache since we're turning off the feature
    this.originalDurations.clear();
  }

  private blurThumbnails(): void {
    if (!this.isBlurEnabled) return;

    const thumbnailSelectors = THUMBNAIL_SELECTORS;

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
          if (img.classList.contains(CSS_CLASSES.THUMBNAIL_BLURRED)) {
            img.style.filter = 'none';
            img.classList.remove(CSS_CLASSES.THUMBNAIL_BLURRED);
          }
          return;
        }
        
        if (!img.classList.contains(CSS_CLASSES.THUMBNAIL_BLURRED)) {
          img.classList.add(CSS_CLASSES.THUMBNAIL_BLURRED);
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

    const titleSelectors = TITLE_SELECTORS;

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
          if (titleElement.classList.contains(CSS_CLASSES.TITLE_BLURRED)) {
            titleElement.style.filter = 'none';
            titleElement.classList.remove(CSS_CLASSES.TITLE_BLURRED);
          }
          return;
        }
        
        if (!titleElement.classList.contains(CSS_CLASSES.TITLE_BLURRED)) {
          titleElement.classList.add(CSS_CLASSES.TITLE_BLURRED);
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

    const durationSelectors = DURATION_SELECTORS;

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
          if (durationElement.classList.contains(CSS_CLASSES.DURATION_HIDDEN)) {
            const originalText = this.originalDurations.get(durationElement);
            if (originalText) {
              durationElement.textContent = originalText;
            }
            durationElement.classList.remove(CSS_CLASSES.DURATION_HIDDEN);
          }
          return;
        }
        
        // Check if the text looks like a duration (contains : and numbers)
        if (text && /^\d+:\d{2}(:\d{2})?$/.test(text) && !durationElement.classList.contains(CSS_CLASSES.DURATION_HIDDEN)) {
          // Store original duration if not already stored
          if (!this.originalDurations.has(durationElement)) {
            this.originalDurations.set(durationElement, text);
          }
          
          durationElement.classList.add(CSS_CLASSES.DURATION_HIDDEN);
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
    const container = element.closest('ytd-rich-item-renderer') || 
                      element.closest('ytd-video-renderer') || 
                      element.closest('ytd-compact-video-renderer') ||
                      element.closest('ytd-playlist-video-renderer') ||
                      element.closest('ytd-grid-video-renderer') ||
                      element.closest('.yt-lockup-view-model-wiz');

    if (!container) return false;

    const progressBar = WATCH_PROGRESS_INDICATOR_SELECTORS
      .map(sel => container.querySelector(sel))
      .find(Boolean);

    return !!progressBar;
  }
}
