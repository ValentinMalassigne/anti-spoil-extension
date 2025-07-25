// Manages settings storage and retrieval for the extension
import { Settings } from './content-types';

export class SettingsManager {
  private settings: Settings = { blurEnabled: true, channelList: [], hidePlayerControls: false };

  public async loadSettings(): Promise<Settings> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Try to load from chrome.storage.sync first
        const syncResult = await chrome.storage.sync.get(['anti-spoil-settings']);
        if (syncResult['anti-spoil-settings']) {
          this.settings = { 
            blurEnabled: true, 
            channelList: [], 
            hidePlayerControls: false,
            ...syncResult['anti-spoil-settings'] 
          };
          return this.settings;
        }

        // Fallback to chrome.storage.local
        const localResult = await chrome.storage.local.get(['anti-spoil-settings']);
        if (localResult['anti-spoil-settings']) {
          this.settings = { 
            blurEnabled: true, 
            channelList: [], 
            hidePlayerControls: false,
            ...localResult['anti-spoil-settings'] 
          };
          // Migrate to sync storage
          await this.saveSettings();
          return this.settings;
        }

        // Default settings
        this.settings = { blurEnabled: true, channelList: [], hidePlayerControls: false };
        await this.saveSettings(); // Save default settings
        return this.settings;
      } else {
        // Fallback to localStorage for non-extension environments
        const stored = localStorage.getItem('anti-spoil-settings');
        if (stored) {
          this.settings = { 
            blurEnabled: true, 
            channelList: [], 
            hidePlayerControls: false,
            ...JSON.parse(stored) 
          };
        } else {
          this.settings = { blurEnabled: true, channelList: [], hidePlayerControls: false };
        }
        return this.settings;
      }
    } catch (error) {
      console.log('Error loading settings, using defaults:', error);
      this.settings = { blurEnabled: true, channelList: [], hidePlayerControls: false };
      return this.settings;
    }
  }

  public async saveSettings(): Promise<void> {
    try {
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

  public async resetSettings(): Promise<Settings> {
    try {
      this.settings = { blurEnabled: true, channelList: [], hidePlayerControls: false };
      await this.saveSettings();
      console.log('Settings reset to defaults');
      return this.settings;
    } catch (error) {
      console.log('Error resetting settings:', error);
      this.settings = { blurEnabled: true, channelList: [], hidePlayerControls: false };
      return this.settings;
    }
  }

  public getSettings(): Settings {
    return { ...this.settings };
  }

  public updateBlurEnabled(enabled: boolean): void {
    this.settings.blurEnabled = enabled;
  }

  public isBlurEnabled(): boolean {
    return this.settings.blurEnabled;
  }

  public updatePlayerControlsHidden(hidden: boolean): void {
    this.settings.hidePlayerControls = hidden;
  }

  public isPlayerControlsHidden(): boolean {
    return this.settings.hidePlayerControls;
  }

  // Channel management methods
  public addChannel(channelName: string): boolean {
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

  public removeChannel(channelName: string): boolean {
    const index = this.settings.channelList.indexOf(channelName);
    if (index === -1) {
      console.log('Channel not found in list:', channelName);
      return false;
    }

    this.settings.channelList.splice(index, 1);
    console.log('Channel removed:', channelName);
    return true;
  }

  public getChannels(): string[] {
    return [...this.settings.channelList];
  }

  public clearChannels(): void {
    this.settings.channelList = [];
    console.log('All channels cleared');
  }
}
