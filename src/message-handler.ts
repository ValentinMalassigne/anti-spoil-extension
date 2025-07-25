// Message handler for Chrome extension communication
import { Message, Settings, MessageResponse } from './content-types';
import { IYouTubeBlurrer } from './interfaces';

export class MessageHandler {
  private blurrer: IYouTubeBlurrer;

  constructor(blurrer: IYouTubeBlurrer) {
    this.blurrer = blurrer;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: MessageResponse) => void) => {
        try {
          console.log('Content script received message:', message);
          return this.handleMessage(message, sendResponse);
        } catch (error) {
          console.error('Error handling message:', error);
          sendResponse({ success: false, error: 'Internal error: ' + (error as Error).message });
          return false;
        }
      });
    }
  }

  private handleMessage(message: Message, sendResponse: (response: MessageResponse) => void): boolean {
    switch (message.action) {
      case 'toggle-blur':
        return this.handleToggleBlur(message, sendResponse);
      
      case 'toggle-player-controls':
        return this.handleTogglePlayerControls(message, sendResponse);
      
      case 'get-status':
        sendResponse({ 
          enabled: this.blurrer.isBlurEnabled, 
          playerControlsHidden: this.blurrer.isPlayerControlsHidden,
          success: true 
        });
        return false;
      
      case 'get-settings':
        sendResponse({ success: true, settings: this.blurrer.getSettings() });
        return false;
      
      case 'reset-settings':
        return this.handleResetSettings(sendResponse);
      
      case 'add-channel':
        return this.handleAddChannel(message, sendResponse);
      
      case 'remove-channel':
        return this.handleRemoveChannel(message, sendResponse);
      
      case 'get-channels':
        sendResponse({ success: true, channels: this.blurrer.getChannels() });
        return false;
      
      default:
        sendResponse({ success: false, error: 'Unknown action: ' + message.action });
        return false;
    }
  }

  private handleToggleBlur(message: Message, sendResponse: (response: MessageResponse) => void): boolean {
    this.blurrer.isBlurEnabled = message.enabled || false;
    this.blurrer.toggleBlur().then(() => {
      sendResponse({ success: true, enabled: this.blurrer.isBlurEnabled });
    }).catch((error: Error) => {
      console.error('Error toggling blur:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the messaging channel open for async response
  }

  private handleTogglePlayerControls(message: Message, sendResponse: (response: MessageResponse) => void): boolean {
    this.blurrer.isPlayerControlsHidden = message.playerControlsHidden || false;
    this.blurrer.togglePlayerControls().then(() => {
      sendResponse({ 
        success: true, 
        playerControlsHidden: this.blurrer.isPlayerControlsHidden 
      });
    }).catch((error: Error) => {
      console.error('Error toggling player controls:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep the messaging channel open for async response
  }

  private handleResetSettings(sendResponse: (response: MessageResponse) => void): boolean {
    this.blurrer.resetSettings().then(() => {
      sendResponse({ 
        success: true, 
        enabled: this.blurrer.isBlurEnabled,
        playerControlsHidden: this.blurrer.isPlayerControlsHidden
      });
    }).catch((error: Error) => {
      console.error('Error resetting settings:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  private handleAddChannel(message: Message, sendResponse: (response: MessageResponse) => void): boolean {
    if (!message.channelName) {
      sendResponse({ success: false, error: 'Channel name is required' });
      return false;
    }
    
    const added = this.blurrer.addChannel(message.channelName);
    if (added) {
      this.blurrer.saveSettings().then(() => {
        sendResponse({ success: true, channels: this.blurrer.getChannels() });
      }).catch((error: Error) => {
        console.error('Error saving settings after adding channel:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'Failed to add channel (invalid format or already exists)' });
      return false;
    }
  }

  private handleRemoveChannel(message: Message, sendResponse: (response: MessageResponse) => void): boolean {
    if (!message.channelName) {
      sendResponse({ success: false, error: 'Channel name is required' });
      return false;
    }
    
    const removed = this.blurrer.removeChannel(message.channelName);
    if (removed) {
      this.blurrer.saveSettings().then(() => {
        sendResponse({ success: true, channels: this.blurrer.getChannels() });
      }).catch((error: Error) => {
        console.error('Error saving settings after removing channel:', error);
        sendResponse({ success: false, error: error.message });
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'Channel not found in list' });
      return false;
    }
  }
}
