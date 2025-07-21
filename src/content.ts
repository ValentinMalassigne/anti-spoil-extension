// Content script that runs on YouTube pages
interface Message {
  action: 'toggle-blur' | 'get-status' | 'get-settings' | 'reset-settings' | 'add-channel' | 'remove-channel' | 'get-channels';
  enabled?: boolean;
  channelName?: string;
}

interface Settings {
  blurEnabled: boolean;
  channelList: string[]; // Array of channel names in format "@name"
  // Future settings can be added here
  // blurIntensity?: number;
  // skipWatchedVideos?: boolean;
}

interface MessageResponse {
  success?: boolean;
  enabled?: boolean;
  error?: string;
  settings?: Settings;
  channels?: string[];
}

class YouTubeBlurrer {
  private isBlurEnabled: boolean = true;
  private observerInstance: MutationObserver | null = null;
  private originalDurations: Map<Element, string> = new Map(); // Store original duration values
  private settings: Settings = { blurEnabled: true, channelList: [] }; // Default settings

  constructor() {
    console.log('YouTubeBlurrer instance created');
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
        try {
          console.log('Content script received message:', message);
          
          if (message.action === 'toggle-blur') {
            this.isBlurEnabled = message.enabled || false;
            this.toggleBlur().then(() => {
              sendResponse({ success: true, enabled: this.isBlurEnabled });
            }).catch((error) => {
              console.error('Error toggling blur:', error);
              sendResponse({ success: false, error: error.message });
            });
            return true; // Keep the messaging channel open for async response
          } else if (message.action === 'get-status') {
            sendResponse({ enabled: this.isBlurEnabled, success: true });
          } else if (message.action === 'get-settings') {
            sendResponse({ success: true, settings: this.getSettings() });
          } else if (message.action === 'reset-settings') {
            this.resetSettings().then(() => {
              sendResponse({ success: true, enabled: this.isBlurEnabled });
            }).catch((error) => {
              console.error('Error resetting settings:', error);
              sendResponse({ success: false, error: error.message });
            });
            return true;
          } else if (message.action === 'add-channel') {
            if (!message.channelName) {
              sendResponse({ success: false, error: 'Channel name is required' });
              return;
            }
            
            const added = this.addChannel(message.channelName);
            if (added) {
              this.saveSettings().then(() => {
                sendResponse({ success: true, channels: this.getChannels() });
              }).catch((error) => {
                console.error('Error saving settings after adding channel:', error);
                sendResponse({ success: false, error: error.message });
              });
              return true;
            } else {
              sendResponse({ success: false, error: 'Failed to add channel (invalid format or already exists)' });
            }
          } else if (message.action === 'remove-channel') {
            if (!message.channelName) {
              sendResponse({ success: false, error: 'Channel name is required' });
              return;
            }
            
            const removed = this.removeChannel(message.channelName);
            if (removed) {
              this.saveSettings().then(() => {
                sendResponse({ success: true, channels: this.getChannels() });
              }).catch((error) => {
                console.error('Error saving settings after removing channel:', error);
                sendResponse({ success: false, error: error.message });
              });
              return true;
            } else {
              sendResponse({ success: false, error: 'Channel not found in list' });
            }
          } else if (message.action === 'get-channels') {
            sendResponse({ success: true, channels: this.getChannels() });
          } else {
            sendResponse({ success: false, error: 'Unknown action: ' + message.action });
          }
        } catch (error) {
          console.error('Error handling message:', error);
          sendResponse({ success: false, error: 'Internal error: ' + (error as Error).message });
        }
      });
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Try to load from chrome.storage.sync first
        const syncResult = await chrome.storage.sync.get(['anti-spoil-settings']);
        if (syncResult['anti-spoil-settings']) {
          this.settings = { 
            blurEnabled: true, 
            channelList: [], 
            ...syncResult['anti-spoil-settings'] 
          };
          this.isBlurEnabled = this.settings.blurEnabled;
          return;
        }

        // Fallback to chrome.storage.local
        const localResult = await chrome.storage.local.get(['anti-spoil-settings']);
        if (localResult['anti-spoil-settings']) {
          this.settings = { 
            blurEnabled: true, 
            channelList: [], 
            ...localResult['anti-spoil-settings'] 
          };
          this.isBlurEnabled = this.settings.blurEnabled;
          // Migrate to sync storage
          await this.saveSettings();
          return;
        }

        // Default settings
        this.settings = { blurEnabled: true, channelList: [] };
        this.isBlurEnabled = true;
        await this.saveSettings(); // Save default settings
      } else {
        // Fallback to localStorage for non-extension environments
        const stored = localStorage.getItem('anti-spoil-settings');
        if (stored) {
          this.settings = { 
            blurEnabled: true, 
            channelList: [], 
            ...JSON.parse(stored) 
          };
        } else {
          this.settings = { blurEnabled: true, channelList: [] };
        }
        this.isBlurEnabled = this.settings.blurEnabled;
      }
    } catch (error) {
      console.log('Error loading settings, using defaults:', error);
      this.settings = { blurEnabled: true, channelList: [] };
      this.isBlurEnabled = true;
    }
  }

  private async saveSettings(): Promise<void> {
    try {
      // Update the settings object
      this.settings.blurEnabled = this.isBlurEnabled;
      // channelList is already managed by the channel methods

      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Save to both sync and local storage for redundancy
        await Promise.all([
          chrome.storage.sync.set({ 'anti-spoil-settings': this.settings }),
          chrome.storage.local.set({ 'anti-spoil-settings': this.settings })
        ]);
        console.log('Settings saved:', this.settings);
      } else {
        // Fallback to localStorage
        localStorage.setItem('anti-spoil-settings', JSON.stringify(this.settings));
      }
    } catch (error) {
      console.log('Error saving settings:', error);
    }
  }

  private async resetSettings(): Promise<void> {
    try {
      this.settings = { blurEnabled: true, channelList: [] };
      this.isBlurEnabled = true;
      await this.saveSettings();
      console.log('Settings reset to defaults');
    } catch (error) {
      console.log('Error resetting settings:', error);
    }
  }

  private getSettings(): Settings {
    return { ...this.settings };
  }

  // Channel management methods
  private addChannel(channelName: string): boolean {
    // Validate channel name format
    if (!channelName.startsWith('@') || channelName.length < 2) {
      console.error('Invalid channel name format. Must start with @ and have at least one character after.');
      return false;
    }

    // Check if channel already exists
    if (this.settings.channelList.includes(channelName)) {
      console.log('Channel already exists in list:', channelName);
      return false;
    }

    // Add channel to list
    this.settings.channelList.push(channelName);
    console.log('Channel added:', channelName);
    return true;
  }

  private removeChannel(channelName: string): boolean {
    const index = this.settings.channelList.indexOf(channelName);
    if (index === -1) {
      console.log('Channel not found in list:', channelName);
      return false;
    }

    this.settings.channelList.splice(index, 1);
    console.log('Channel removed:', channelName);
    return true;
  }

  private getChannels(): string[] {
    return [...this.settings.channelList];
  }

  private clearChannels(): void {
    this.settings.channelList = [];
    console.log('All channels cleared');
  }

  private applyBlur(): void {
    this.blurThumbnails();
    this.blurTitles();
    this.blurDurations();
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

  private async toggleBlur(): Promise<void> {
    // Save preference using the new saveSettings method
    await this.saveSettings();

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
}

// Initialize the blurrer when the script loads
console.log('Anti-Spoil Extension content script loading...');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Anti-Spoil Extension initialized on DOMContentLoaded');
    new YouTubeBlurrer();
  });
} else {
  console.log('Anti-Spoil Extension initialized immediately');
  new YouTubeBlurrer();
}
