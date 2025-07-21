// Manages the blur functionality for YouTube elements
export class BlurManager {
  private originalDurations: Map<Element, string> = new Map(); // Store original duration values
  private isBlurEnabled: boolean = true;

  constructor(isBlurEnabled: boolean = true) {
    this.isBlurEnabled = isBlurEnabled;
  }

  public setBlurEnabled(enabled: boolean): void {
    this.isBlurEnabled = enabled;
  }

  public applyBlur(): void {
    this.blurThumbnails();
    this.blurTitles();
    this.blurDurations();
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

  private blurThumbnails(): void {
    // YouTube thumbnail selectors
    const thumbnailSelectors = [
      'ytd-thumbnail img', // Main thumbnails
      '#thumbnail img', // Thumbnail in various contexts
      '.ytp-videowall-still-image', // End screen thumbnails
      'ytd-playlist-thumbnail img', // Playlist thumbnails
      'ytd-moving-thumbnail-renderer img' // Hover thumbnails
    ];

    thumbnailSelectors.forEach(selector => {
      const thumbnails = document.querySelectorAll(selector);
      thumbnails.forEach((thumbnail: Element) => {
        const img = thumbnail as HTMLImageElement;
        
        // Check if this video has been watched (has progress bar)
        if (this.hasWatchProgress(img)) {
          return; // Skip blurring for watched videos
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
    // YouTube title selectors
    const titleSelectors = [
      '#video-title', // Video titles
      'h3.ytd-video-renderer', // Video titles in listings
      '.ytd-playlist-video-renderer #video-title', // Playlist video titles
      'h3.ytd-compact-video-renderer', // Sidebar video titles
      '.ytd-rich-grid-media #video-title' // Grid layout titles
    ];

    titleSelectors.forEach(selector => {
      const titles = document.querySelectorAll(selector);
      titles.forEach((title: Element) => {
        const titleElement = title as HTMLElement;
        
        // Check if this video has been watched (has progress bar)
        if (this.hasWatchProgress(titleElement)) {
          return; // Skip blurring for watched videos
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
                          element.closest('ytd-grid-video-renderer');

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
