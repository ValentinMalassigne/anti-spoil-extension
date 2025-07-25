// Interface for the main YouTubeBlurrer class to improve type safety
import { Settings } from './content-types';

export interface IYouTubeBlurrer {
  // Blur state management
  isBlurEnabled: boolean;
  toggleBlur(): Promise<void>;

  // Player controls management
  isPlayerControlsHidden: boolean;
  togglePlayerControls(): Promise<void>;

  // Settings management
  saveSettings(): Promise<void>;
  resetSettings(): Promise<void>;
  getSettings(): Settings;

  // Channel management
  addChannel(channelName: string): boolean;
  removeChannel(channelName: string): boolean;
  getChannels(): string[];
}
