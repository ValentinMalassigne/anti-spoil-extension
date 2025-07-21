// Types and interfaces for the content script

export interface Message {
  action: 'toggle-blur' | 'get-status' | 'get-settings' | 'reset-settings' | 'add-channel' | 'remove-channel' | 'get-channels';
  enabled?: boolean;
  channelName?: string;
}

export interface Settings {
  blurEnabled: boolean;
  channelList: string[];
}

export interface MessageResponse {
  success?: boolean;
  enabled?: boolean;
  error?: string;
  settings?: Settings;
  channels?: string[];
}
