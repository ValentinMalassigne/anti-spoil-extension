// Content script that runs on YouTube pages
interface Message {
  action: string;
  enabled?: boolean;
}

interface MessageResponse {
  success?: boolean;
  enabled?: boolean;
}

class YouTubeBlurrer {
  private isBlurEnabled: boolean = true;
  private observerInstance: MutationObserver | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Load user preference
    this.loadSettings().then(() => {
      if (this.isBlurEnabled) {
        this.applyBlur();
        this.observeChanges();
      }
    });

    // Listen for messages from popup
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
        if (message.action === 'toggle-blur') {
          this.isBlurEnabled = message.enabled || false;
          this.toggleBlur();
          sendResponse({ success: true });
        } else if (message.action === 'get-status') {
          sendResponse({ enabled: this.isBlurEnabled });
        }
      });
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['blurEnabled']);
        this.isBlurEnabled = result.blurEnabled !== false; // Default to true
      } else {
        this.isBlurEnabled = true;
      }
    } catch (error) {
      console.log('Using default settings');
      this.isBlurEnabled = true;
    }
  }

  private applyBlur(): void {
    this.blurThumbnails();
    this.blurTitles();
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

  private observeChanges(): void {
    // Observe DOM changes to catch dynamically loaded content
    this.observerInstance = new MutationObserver((mutations) => {
      let shouldApplyBlur = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldApplyBlur = true;
        }
      });

      if (shouldApplyBlur && this.isBlurEnabled) {
        // Debounce the blur application
        setTimeout(() => {
          this.applyBlur();
        }, 500);
      }
    });

    this.observerInstance.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private toggleBlur(): void {
    // Save preference
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.sync.set({ blurEnabled: this.isBlurEnabled });
    }

    if (this.isBlurEnabled) {
      this.applyBlur();
      if (!this.observerInstance) {
        this.observeChanges();
      }
    } else {
      this.removeBlur();
      if (this.observerInstance) {
        this.observerInstance.disconnect();
        this.observerInstance = null;
      }
    }
  }

  private removeBlur(): void {
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
  }
}

// Initialize the blurrer when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new YouTubeBlurrer());
} else {
  new YouTubeBlurrer();
}
