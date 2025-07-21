// Manages DOM observation for detecting dynamic content changes
export class ObserverManager {
  private observerInstance: MutationObserver | null = null;
  private onContentChange: () => void;
  private isEnabled: boolean = false;

  constructor(onContentChange: () => void) {
    this.onContentChange = onContentChange;
  }

  public startObserving(): void {
    if (this.observerInstance) {
      return; // Already observing
    }

    this.isEnabled = true;
    this.observerInstance = new MutationObserver((mutations) => {
      let shouldTriggerChange = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes are meaningful (not just text nodes or small elements)
          const hasSignificantChanges = Array.from(mutation.addedNodes).some(node => {
            return node.nodeType === Node.ELEMENT_NODE && 
                   (node as Element).children.length > 0;
          });
          
          if (hasSignificantChanges) {
            shouldTriggerChange = true;
          }
        }
      });

      if (shouldTriggerChange && this.isEnabled) {
        // Debounce the content change callback
        this.debounceContentChange();
      }
    });

    this.observerInstance.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('DOM observer started');
  }

  public stopObserving(): void {
    if (this.observerInstance) {
      this.observerInstance.disconnect();
      this.observerInstance = null;
      this.isEnabled = false;
      console.log('DOM observer stopped');
    }
  }

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  public isObserving(): boolean {
    return this.observerInstance !== null;
  }

  private debounceTimer: number | null = null;

  private debounceContentChange(): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = window.setTimeout(() => {
      this.onContentChange();
      this.debounceTimer = null;
    }, 500);
  }
}
