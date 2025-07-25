// Types and interfaces for the content script

export interface Message {
  action: 'toggle-blur' | 'get-status' | 'get-settings' | 'reset-settings' | 'add-channel' | 'remove-channel' | 'get-channels' | 'toggle-player-controls';
  enabled?: boolean;
  channelName?: string;
  playerControlsHidden?: boolean;
}

export interface Settings {
  blurEnabled: boolean;
  channelList: string[];
  hidePlayerControls: boolean;
}

export interface MessageResponse {
  success?: boolean;
  enabled?: boolean;
  error?: string;
  settings?: Settings;
  channels?: string[];
  playerControlsHidden?: boolean;
}
