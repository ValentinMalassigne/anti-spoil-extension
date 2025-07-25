// Channel detection utility for YouTube video elements
export class ChannelDetector {
  private static pageChannelCache: string | null | undefined = undefined;
  private static lastUrl: string = '';
  
  /**
   * Gets the channel name from a YouTube video element
   * @param videoElement - The video container element 
   * @returns The channel name in @channelname format, or null if not found
   */
  public static getChannelNameFromVideoElement(videoElement: Element): string | null {
    // Common selectors for channel names/links on YouTube
    const channelSelectors = [
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

    console.log('ChannelDetector: Searching for channel in element:', videoElement.tagName, videoElement.className);

    for (const selector of channelSelectors) {
      const channelLink = videoElement.querySelector(selector) as HTMLAnchorElement;
      if (channelLink) {
        console.log('ChannelDetector: Found channel link with selector:', selector, channelLink.href);
        const channelName = this.extractChannelNameFromLink(channelLink);
        if (channelName) {
          console.log('ChannelDetector: Extracted channel name:', channelName);
          return channelName;
        }
      }
    }

    // Try to find channel name in text content as fallback
    const textResult = this.extractChannelNameFromText(videoElement);
    if (textResult) {
      console.log('ChannelDetector: Found channel from text:', textResult);
    }
    return textResult;
  }

  /**
   * Extracts channel name from a channel link element
   */
  private static extractChannelNameFromLink(channelLink: HTMLAnchorElement): string | null {
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

  /**
   * Attempts to find channel name in element text content as fallback
   */
  private static extractChannelNameFromText(element: Element): string | null {
    // Look for text that might be a channel name
    const textContent = element.textContent || '';
    
    // Look for @channelname pattern in text
    const atMatch = textContent.match(/@(\w+)/);
    if (atMatch) {
      return atMatch[0]; // Returns @channelname
    }

    return null;
  }

  /**
   * Finds the closest video container element for a given element
   * This helps us identify the scope to search for channel information
   */
  public static findVideoContainer(element: Element): Element | null {
    // Common YouTube video container selectors
    const containerSelectors = [
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
      // Additional containers that might be used
      '.ytd-video-renderer',
      '.ytd-rich-item-renderer'
    ];

    let current = element;
    
    // Traverse up the DOM tree to find a video container
    while (current && current !== document.body) {
      for (const selector of containerSelectors) {
        if (current.matches && current.matches(selector)) {
          console.log('ChannelDetector: Found video container:', selector);
          return current;
        }
      }
      current = current.parentElement!;
    }

    console.log('ChannelDetector: No video container found, element hierarchy:');
    let temp = element;
    let level = 0;
    while (temp && temp !== document.body && level < 10) {
      console.log(`  Level ${level}:`, temp.tagName, temp.className, temp);
      temp = temp.parentElement!;
      level++;
    }

    return null;
  }

  /**
   * Checks if a video should be blurred based on channel list
   * @param videoElement - The video element to check
   * @param channelList - List of channels that should be blurred
   * @returns true if the video should be blurred, false otherwise
   */
  public static shouldBlurVideo(videoElement: Element, channelList: string[]): boolean {
    if (channelList.length === 0) {
      // If no channels in list, don't blur anything
      return false;
    }

    // First check if we're on a channel page - if so, use page context
    const pageChannelName = this.detectChannelFromPageContext();
    if (pageChannelName) {
      const shouldBlurFromPage = channelList.some(listedChannel => 
        listedChannel.toLowerCase() === pageChannelName.toLowerCase()
      );
      console.log('ChannelDetector: Channel page detected:', pageChannelName, 'Should blur:', shouldBlurFromPage);
      return shouldBlurFromPage;
    }

    // For non-channel pages, use the original logic
    const videoContainer = this.findVideoContainer(videoElement);
    if (!videoContainer) {
      console.log('ChannelDetector: No video container found for element:', videoElement);
      return false;
    }

    const channelName = this.getChannelNameFromVideoElement(videoContainer);
    console.log('ChannelDetector: Detected channel name:', channelName, 'for container:', videoContainer);
    
    if (!channelName) {
      console.log('ChannelDetector: No channel name detected for container:', videoContainer);
      return false;
    }

    const shouldBlur = channelList.some(listedChannel => 
      listedChannel.toLowerCase() === channelName.toLowerCase()
    );
    
    console.log('ChannelDetector: Should blur video?', shouldBlur, 'Channel:', channelName, 'List:', channelList);
    return shouldBlur;
  }

  /**
   * Special detection for channel pages where videos don't have explicit channel info
   * On a channel page, we can infer the channel from the page URL or header
   */
  private static detectChannelFromPageContext(): string | null {
    // Cache channel detection for performance (clear cache when URL changes)
    const currentUrl = window.location.href;
    if (currentUrl !== this.lastUrl) {
      this.pageChannelCache = undefined;
      this.lastUrl = currentUrl;
    }
    
    if (this.pageChannelCache !== undefined) {
      return this.pageChannelCache;
    }

    // Check if we're on a channel page
    // Pattern 1: youtube.com/@channelname
    const channelMatch = currentUrl.match(/youtube\.com\/@([^/?#]+)/);
    if (channelMatch) {
      const result = `@${channelMatch[1]}`;
      console.log('ChannelDetector: Detected from URL pattern 1:', result);
      this.pageChannelCache = result;
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
          console.log('ChannelDetector: Detected from legacy URL header:', result);
          this.pageChannelCache = result;
          return result;
        }
      }
    }

    // Pattern 3: Check if current page has channel-specific indicators
    const isChannelPage = currentUrl.includes('/channel/') || 
                         currentUrl.includes('/@') || 
                         document.querySelector('ytd-channel-header-renderer') ||
                         document.querySelector('[page-subtype="channel"]');
    
    if (isChannelPage) {
      // Try to get channel name from page header or meta
      const channelSelectors = [
        '#channel-name .ytd-channel-name',
        '.ytd-channel-name',
        '[id="channel-name"]',
        'ytd-channel-header-renderer [id="text"]'
      ];

      for (const selector of channelSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent?.trim();
          if (text) {
            const result = text.startsWith('@') ? text : `@${text}`;
            console.log('ChannelDetector: Detected from channel page header:', result);
            this.pageChannelCache = result;
            return result;
          }
        }
      }

      // Try to get from page title
      const pageTitle = document.title;
      if (pageTitle.includes('@')) {
        const atMatch = pageTitle.match(/@(\w+)/);
        if (atMatch) {
          console.log('ChannelDetector: Detected from page title:', atMatch[0]);
          this.pageChannelCache = atMatch[0];
          return atMatch[0];
        }
      }
    }

    // Cache null result to avoid repeated DOM queries
    this.pageChannelCache = null;
    return null;
  }
}
