// Popup script for the extension
interface Settings {
  blurEnabled: boolean;
  channelList: string[]; // Array of channel names in format "@name"
  // Future settings can be added here
}

interface MessageResponse {
  success?: boolean;
  enabled?: boolean;
  error?: string;
  settings?: Settings;
  channels?: string[];
}

class PopupController {
  private toggleButton: HTMLButtonElement | null = null;
  private statusText: HTMLSpanElement | null = null;
  private channelInput: HTMLInputElement | null = null;
  private addChannelBtn: HTMLButtonElement | null = null;
  private channelSearch: HTMLInputElement | null = null;
  private channelList: HTMLUListElement | null = null;
  private noChannelsDiv: HTMLDivElement | null = null;
  private allChannels: string[] = [];
  private filteredChannels: string[] = [];

  constructor() {
    this.init();
  }

  private init(): void {
    // Check if DOM is already loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupUI();
        this.getCurrentStatus();
        this.loadChannels();
      });
    } else {
      // DOM is already loaded
      this.setupUI();
      this.getCurrentStatus();
      this.loadChannels();
    }
  }

  private setupUI(): void {
    // Main blur controls
    this.toggleButton = document.getElementById('toggle-blur') as HTMLButtonElement;
    this.statusText = document.getElementById('status-text') as HTMLSpanElement;

    // Channel management elements
    this.channelInput = document.getElementById('channel-input') as HTMLInputElement;
    this.addChannelBtn = document.getElementById('add-channel-btn') as HTMLButtonElement;
    this.channelSearch = document.getElementById('channel-search') as HTMLInputElement;
    this.channelList = document.getElementById('channel-list') as HTMLUListElement;
    this.noChannelsDiv = document.getElementById('no-channels') as HTMLDivElement;

    if (!this.toggleButton || !this.statusText) {
      console.error('Main UI elements not found in DOM');
      return;
    }

    // Setup event listeners
    this.toggleButton.addEventListener('click', () => {
      this.toggleBlur();
    });

    if (this.addChannelBtn && this.channelInput) {
      this.addChannelBtn.addEventListener('click', () => {
        this.addChannel();
      });

      this.channelInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addChannel();
        }
      });
    }

    if (this.channelSearch) {
      this.channelSearch.addEventListener('input', () => {
        this.filterChannels();
      });
    }
  }

  private async getCurrentStatus(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.id) {
        this.showError('No active tab found');
        return;
      }

      if (!activeTab.url?.includes('youtube.com')) {
        this.showError('Please navigate to YouTube to use this extension');
        return;
      }

      // Add a small delay to ensure content script is loaded
      setTimeout(async () => {
        try {
          const response = await chrome.tabs.sendMessage(activeTab.id!, { action: 'get-status' }) as MessageResponse;
          
          if (response && response.success) {
            this.updateUI(response.enabled || false);
          } else {
            console.error('Failed to get status:', response?.error);
            this.showError('Extension not ready. Please refresh the page.');
          }
        } catch (error) {
          console.error('Error communicating with content script:', error);
          this.showError('Extension not loaded. Please refresh the page.');
        }
      }, 100);
    } catch (error) {
      console.error('Error getting status:', error);
      this.showError('Extension not available on this page');
    }
  }

  private async toggleBlur(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab || !activeTab.id) {
        this.showError('No active tab found');
        return;
      }

      if (!activeTab.url?.includes('youtube.com')) {
        this.showError('Please navigate to YouTube to use this extension');
        return;
      }

      try {
        // First get current status
        const statusResponse = await chrome.tabs.sendMessage(activeTab.id, { action: 'get-status' }) as MessageResponse;
        
        if (!statusResponse || !statusResponse.success) {
          this.showError('Extension not ready. Please refresh the page.');
          return;
        }

        const currentStatus = statusResponse.enabled || false;
        const newStatus = !currentStatus;

        // Toggle the blur
        const toggleResponse = await chrome.tabs.sendMessage(activeTab.id, { 
          action: 'toggle-blur', 
          enabled: newStatus 
        }) as MessageResponse;

        if (toggleResponse && toggleResponse.success) {
          this.updateUI(newStatus);
        } else {
          this.showError('Failed to toggle blur: ' + (toggleResponse?.error || 'Unknown error'));
        }
      } catch (error) {
        console.error('Error communicating with content script:', error);
        this.showError('Extension not loaded. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error toggling blur:', error);
      this.showError('Error communicating with extension');
    }
  }

  private async loadChannels(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (!activeTab?.id || !activeTab.url?.includes('youtube.com')) {
        // Try to load from storage directly if not on YouTube
        const result = await chrome.storage.local.get(['channelList']);
        this.allChannels = result.channelList || [];
        this.updateChannelList();
        return;
      }

      // Get channels from content script
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'get-channels' }) as MessageResponse;
        
        if (response && response.success && response.channels) {
          this.allChannels = response.channels;
          this.updateChannelList();
        } else {
          // Fallback to storage
          const result = await chrome.storage.local.get(['channelList']);
          this.allChannels = result.channelList || [];
          this.updateChannelList();
        }
      } catch (error) {
        console.error('Error getting channels from content script:', error);
        // Fallback to storage
        const result = await chrome.storage.local.get(['channelList']);
        this.allChannels = result.channelList || [];
        this.updateChannelList();
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      this.allChannels = [];
      this.updateChannelList();
    }
  }

  private async addChannel(): Promise<void> {
    if (!this.channelInput) return;

    let channelName = this.channelInput.value.trim();
    
    if (!channelName) {
      alert('Please enter a channel name');
      return;
    }

    // Ensure channel name starts with @
    if (!channelName.startsWith('@')) {
      channelName = '@' + channelName;
    }

    // Check if channel already exists
    if (this.allChannels.includes(channelName)) {
      alert('Channel already exists in the list');
      return;
    }

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (activeTab?.id && activeTab.url?.includes('youtube.com')) {
        // Add via content script
        const response = await chrome.tabs.sendMessage(activeTab.id, { 
          action: 'add-channel', 
          channel: channelName 
        }) as MessageResponse;

        if (response && response.success) {
          this.allChannels.push(channelName);
          this.channelInput.value = '';
          this.updateChannelList();
        } else {
          alert('Failed to add channel: ' + (response?.error || 'Unknown error'));
        }
      } else {
        // Add to storage directly
        this.allChannels.push(channelName);
        await chrome.storage.local.set({ channelList: this.allChannels });
        await chrome.storage.sync.set({ channelList: this.allChannels });
        
        this.channelInput.value = '';
        this.updateChannelList();
      }
    } catch (error) {
      console.error('Error adding channel:', error);
      alert('Error adding channel');
    }
  }

  private async removeChannel(channelName: string): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (activeTab?.id && activeTab.url?.includes('youtube.com')) {
        // Remove via content script
        const response = await chrome.tabs.sendMessage(activeTab.id, { 
          action: 'remove-channel', 
          channel: channelName 
        }) as MessageResponse;

        if (response && response.success) {
          this.allChannels = this.allChannels.filter(c => c !== channelName);
          this.updateChannelList();
        } else {
          alert('Failed to remove channel: ' + (response?.error || 'Unknown error'));
        }
      } else {
        // Remove from storage directly
        this.allChannels = this.allChannels.filter(c => c !== channelName);
        await chrome.storage.local.set({ channelList: this.allChannels });
        await chrome.storage.sync.set({ channelList: this.allChannels });
        
        this.updateChannelList();
      }
    } catch (error) {
      console.error('Error removing channel:', error);
      alert('Error removing channel');
    }
  }

  private filterChannels(): void {
    if (!this.channelSearch) return;

    const searchTerm = this.channelSearch.value.toLowerCase().trim();
    
    if (!searchTerm) {
      this.filteredChannels = [...this.allChannels];
    } else {
      this.filteredChannels = this.allChannels.filter(channel => 
        channel.toLowerCase().includes(searchTerm)
      );
    }

    this.renderChannelList();
  }

  private updateChannelList(): void {
    this.filteredChannels = [...this.allChannels];
    this.renderChannelList();
  }

  private renderChannelList(): void {
    if (!this.channelList || !this.noChannelsDiv) return;

    // Clear existing list
    this.channelList.innerHTML = '';

    if (this.filteredChannels.length === 0) {
      this.channelList.style.display = 'none';
      this.noChannelsDiv.style.display = 'block';
      this.noChannelsDiv.textContent = this.allChannels.length === 0 ? 
        'No channels added yet' : 'No channels match your search';
    } else {
      this.channelList.style.display = 'block';
      this.noChannelsDiv.style.display = 'none';

      this.filteredChannels.forEach(channel => {
        const li = document.createElement('li');
        li.className = 'channel-item';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'channel-name';
        nameSpan.textContent = channel;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove channel';
        removeBtn.addEventListener('click', () => {
          this.removeChannel(channel);
        });

        li.appendChild(nameSpan);
        li.appendChild(removeBtn);
        
        // Double check that channelList is not null before appending
        if (this.channelList) {
          this.channelList.appendChild(li);
        }
      });
    }
  }

  private showError(message: string): void {
    if (this.statusText) {
      this.statusText.textContent = message;
      this.statusText.className = 'status-error';
    }
    
    if (this.toggleButton) {
      this.toggleButton.disabled = true;
      this.toggleButton.textContent = 'Error';
      this.toggleButton.className = 'btn btn-disabled';
    }
  }

  private updateUI(enabled: boolean): void {
    if (this.toggleButton && this.statusText) {
      // Re-enable button in case it was disabled due to error
      this.toggleButton.disabled = false;
      
      if (enabled) {
        this.toggleButton.textContent = 'Disable Blur';
        this.toggleButton.className = 'btn btn-danger';
        this.statusText.textContent = 'Blur is ON';
        this.statusText.className = 'status-on';
      } else {
        this.toggleButton.textContent = 'Enable Blur';
        this.toggleButton.className = 'btn btn-success';
        this.statusText.textContent = 'Blur is OFF';
        this.statusText.className = 'status-off';
      }
    }
  }
}

// Initialize popup controller
new PopupController();
