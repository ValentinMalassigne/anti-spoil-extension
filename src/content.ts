// Content script that runs on YouTube pages
import { Message, Settings, MessageResponse } from './content-types';
import { MessageHandler } from './message-handler';
import { BlurManager } from './blur-manager';
import { SettingsManager } from './settings-manager';
import { ObserverManager } from './observer-manager';
import { IYouTubeBlurrer } from './interfaces';

class YouTubeBlurrer implements IYouTubeBlurrer {
  public isBlurEnabled: boolean = true;
  private messageHandler: MessageHandler;
  private blurManager: BlurManager;
  private settingsManager: SettingsManager;
  private observerManager: ObserverManager;

  constructor() {
    console.log('YouTubeBlurrer instance created');
    this.settingsManager = new SettingsManager();
    this.messageHandler = new MessageHandler(this);
    this.blurManager = new BlurManager(this.isBlurEnabled);
    this.observerManager = new ObserverManager(() => this.applyBlur());
    this.init();
  }

  private init(): void {
    // Load user preference
    this.loadSettings().then(() => {
      if (this.isBlurEnabled) {
        this.applyBlur();
        this.observerManager.startObserving();
      }
    });
  }

  private async loadSettings(): Promise<void> {
    const settings = await this.settingsManager.loadSettings();
    this.isBlurEnabled = settings.blurEnabled;
  }

  public async saveSettings(): Promise<void> {
    this.settingsManager.updateBlurEnabled(this.isBlurEnabled);
    await this.settingsManager.saveSettings();
  }

  public async resetSettings(): Promise<void> {
    const settings = await this.settingsManager.resetSettings();
    this.isBlurEnabled = settings.blurEnabled;
  }

  public getSettings(): Settings {
    return this.settingsManager.getSettings();
  }

  // Channel management methods
  public addChannel(channelName: string): boolean {
    return this.settingsManager.addChannel(channelName);
  }

  public removeChannel(channelName: string): boolean {
    return this.settingsManager.removeChannel(channelName);
  }

  public getChannels(): string[] {
    return this.settingsManager.getChannels();
  }

  private applyBlur(): void {
    this.blurManager.applyBlur();
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

  private removeBlur(): void {
    this.blurManager.removeBlur();
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
