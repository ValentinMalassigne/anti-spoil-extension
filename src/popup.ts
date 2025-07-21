// Popup script for the extension
interface MessageResponse {
  success?: boolean;
  enabled?: boolean;
}

class PopupController {
  private toggleButton: HTMLButtonElement | null = null;
  private statusText: HTMLSpanElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    document.addEventListener('DOMContentLoaded', () => {
      this.setupUI();
      this.getCurrentStatus();
    });
  }

  private setupUI(): void {
    this.toggleButton = document.getElementById('toggle-blur') as HTMLButtonElement;
    this.statusText = document.getElementById('status-text') as HTMLSpanElement;

    if (this.toggleButton) {
      this.toggleButton.addEventListener('click', () => {
        this.toggleBlur();
      });
    }
  }

  private async getCurrentStatus(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (activeTab && activeTab.id) {
        const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'get-status' }) as MessageResponse;
        this.updateUI(response.enabled || false);
      }
    } catch (error) {
      console.error('Error getting status:', error);
      this.updateUI(false);
    }
  }

  private async toggleBlur(): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];

      if (activeTab && activeTab.id) {
        // First get current status
        const statusResponse = await chrome.tabs.sendMessage(activeTab.id, { action: 'get-status' }) as MessageResponse;
        const currentStatus = statusResponse.enabled || false;
        const newStatus = !currentStatus;

        // Toggle the blur
        await chrome.tabs.sendMessage(activeTab.id, { 
          action: 'toggle-blur', 
          enabled: newStatus 
        });

        this.updateUI(newStatus);
      }
    } catch (error) {
      console.error('Error toggling blur:', error);
    }
  }

  private updateUI(enabled: boolean): void {
    if (this.toggleButton && this.statusText) {
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
