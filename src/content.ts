// Content script that runs on YouTube pages
import { Message, Settings, MessageResponse } from './content-types';
import { MessageHandler } from './message-handler';
import { BlurManager } from './blur-manager';
import { SettingsManager } from './settings-manager';
import { ObserverManager } from './observer-manager';
import { IYouTubeBlurrer } from './interfaces';

class YouTubeBlurrer implements IYouTubeBlurrer {
  public isBlurEnabled: boolean = true;
  public isPlayerControlsHidden: boolean = false;
  private messageHandler: MessageHandler;
  private blurManager: BlurManager;
  private settingsManager: SettingsManager;
  private observerManager: ObserverManager;

  constructor() {
    console.log('YouTubeBlurrer instance created');
    this.settingsManager = new SettingsManager();
    this.messageHandler = new MessageHandler(this);
    this.blurManager = new BlurManager(this.isBlurEnabled);
    this.observerManager = new ObserverManager(() => {
      this.applyBlur();
      if (this.isPlayerControlsHidden) {
        this.applyPlayerControlsHiding();
      }
    });
    this.init();
  }

  private init(): void {
    // Load user preference
    this.loadSettings().then(() => {
      if (this.isBlurEnabled) {
        this.applyBlur();
        this.observerManager.startObserving();
      }
      if (this.isPlayerControlsHidden) {
        this.applyPlayerControlsHiding();
        if (!this.observerManager.isObserving()) {
          this.observerManager.startObserving();
        }
      }
    });
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.settingsManager.loadSettings();
    this.isBlurEnabled = settings.blurEnabled;
    this.isPlayerControlsHidden = settings.hidePlayerControls;
    // Update BlurManager with the latest settings
    this.blurManager.setChannelList(settings.channelList);
    this.blurManager.setPlayerControlsHidden(settings.hidePlayerControls);
  }

  public async saveSettings(): Promise<void> {
    this.settingsManager.updateBlurEnabled(this.isBlurEnabled);
    this.settingsManager.updatePlayerControlsHidden(this.isPlayerControlsHidden);
    await this.settingsManager.saveSettings();
    // Update BlurManager with the latest settings
    this.blurManager.setChannelList(this.settingsManager.getChannels());
    this.blurManager.setPlayerControlsHidden(this.isPlayerControlsHidden);
  }

  public async resetSettings(): Promise<void> {
    const settings = await this.settingsManager.resetSettings();
    this.isBlurEnabled = settings.blurEnabled;
    this.isPlayerControlsHidden = settings.hidePlayerControls;
  }

  public getSettings(): Settings {
    return this.settingsManager.getSettings();
  }

  // Channel management methods
  public addChannel(channelName: string): boolean {
    const result = this.settingsManager.addChannel(channelName);
    if (result) {
      // Update BlurManager with the updated channel list
      this.blurManager.setChannelList(this.settingsManager.getChannels());
      // Re-apply blur logic to update any visible videos
      if (this.isBlurEnabled) {
        this.applyBlur();
      }
    }
    return result;
  }

  public removeChannel(channelName: string): boolean {
    const result = this.settingsManager.removeChannel(channelName);
    if (result) {
      // Update BlurManager with the updated channel list
      this.blurManager.setChannelList(this.settingsManager.getChannels());
      // Re-apply blur logic to update any visible videos
      if (this.isBlurEnabled) {
        this.applyBlur();
      }
    }
    return result;
  }

  public getChannels(): string[] {
    return this.settingsManager.getChannels();
  }

  private applyBlur(): void {
    this.blurManager.applyBlur();
  }

  private applyPlayerControlsHiding(): void {
    this.blurManager.applyPlayerControlsHiding();
  }

  public async toggleBlur(): Promise<void> {
    // Save preference using the new saveSettings method
    await this.saveSettings();
    
    // Update BlurManager state
    this.blurManager.setBlurEnabled(this.isBlurEnabled);

    if (this.isBlurEnabled) {
      this.applyBlur();
      if (!this.observerManager.isObserving()) {
        this.observerManager.startObserving();
      }
    } else {
      this.removeBlur();
      this.observerManager.stopObserving();
    }
  }

  public async togglePlayerControls(): Promise<void> {
    // Save preference using the saveSettings method
    await this.saveSettings();
    
    // Update BlurManager state
    this.blurManager.setPlayerControlsHidden(this.isPlayerControlsHidden);

    if (this.isPlayerControlsHidden) {
      this.applyPlayerControlsHiding();
      if (!this.observerManager.isObserving()) {
        this.observerManager.startObserving();
      }
    } else {
      this.removePlayerControlsHiding();
    }
  }

  private removeBlur(): void {
    this.blurManager.removeBlur();
  }

  private removePlayerControlsHiding(): void {
    this.blurManager.removePlayerControlsHiding();
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
