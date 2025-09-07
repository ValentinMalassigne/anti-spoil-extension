/**
 * Types Chrome Extension API pour TypeScript strict
 * Version simplifiée pour les besoins immédiats de l'extension
 */

// Types pour chrome.storage
declare namespace chrome {
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | object | null): Promise<{ [key: string]: any }>;
      set(items: { [key: string]: any }): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
      clear(): Promise<void>;
    }

    interface StorageChange {
      oldValue?: any;
      newValue?: any;
    }

    interface StorageChangedEvent {
      addListener(
        callback: (changes: { [key: string]: StorageChange }, areaName: 'sync' | 'local' | 'managed') => void
      ): void;
      removeListener(
        callback: (changes: { [key: string]: StorageChange }, areaName: 'sync' | 'local' | 'managed') => void
      ): void;
    }

    const local: StorageArea;
    const sync: StorageArea;
    const managed: StorageArea;
    const onChanged: StorageChangedEvent;
  }

  // Types pour chrome.runtime
  namespace runtime {
    interface Port {
      name: string;
      disconnect(): void;
      onDisconnect: chrome.events.Event<(port: Port) => void>;
      onMessage: chrome.events.Event<(message: any, port: Port) => void>;
      postMessage(message: any): void;
      sender?: chrome.runtime.MessageSender;
    }

    interface MessageSender {
      tab?: chrome.tabs.Tab;
      frameId?: number;
      id?: string;
      url?: string;
      tlsChannelId?: string;
    }

    interface InstalledDetails {
      reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
      previousVersion?: string;
      id?: string;
    }

    interface StartupDetails {
    }

    const id: string;
    
    function sendMessage(message: any): Promise<any>;
    function sendMessage(extensionId: string, message: any): Promise<any>;
    
    function connect(connectInfo?: { name?: string }): Port;
    function connect(extensionId: string, connectInfo?: { name?: string }): Port;
    
    const onMessage: chrome.events.Event<(message: any, sender: MessageSender, sendResponse: (response?: any) => void) => boolean | void>;
    const onConnect: chrome.events.Event<(port: Port) => void>;
    const onInstalled: chrome.events.Event<(details: InstalledDetails) => void>;
    const onStartup: chrome.events.Event<(details: StartupDetails) => void>;
    const onSuspend: chrome.events.Event<() => void>;
    const onSuspendCanceled: chrome.events.Event<() => void>;
  }

  // Types pour chrome.tabs
  namespace tabs {
    interface Tab {
      id?: number;
      index: number;
      windowId: number;
      openerTabId?: number;
      selected: boolean;
      highlighted: boolean;
      active: boolean;
      pinned: boolean;
      audible?: boolean;
      discarded: boolean;
      autoDiscardable: boolean;
      mutedInfo?: MutedInfo;
      url?: string;
      title?: string;
      favIconUrl?: string;
      status?: 'loading' | 'complete';
      incognito: boolean;
      width?: number;
      height?: number;
      sessionId?: string;
    }

    interface MutedInfo {
      muted: boolean;
      reason?: 'user' | 'capture' | 'extension';
      extensionId?: string;
    }

    interface QueryInfo {
      active?: boolean;
      audible?: boolean;
      autoDiscardable?: boolean;
      currentWindow?: boolean;
      discarded?: boolean;
      highlighted?: boolean;
      index?: number;
      lastFocusedWindow?: boolean;
      muted?: boolean;
      pinned?: boolean;
      status?: 'loading' | 'complete';
      title?: string;
      url?: string | string[];
      windowId?: number;
      windowType?: 'normal' | 'popup' | 'panel' | 'app' | 'devtools';
    }

    interface UpdateProperties {
      url?: string;
      active?: boolean;
      highlighted?: boolean;
      selected?: boolean;
      pinned?: boolean;
      muted?: boolean;
      openerTabId?: number;
      autoDiscardable?: boolean;
    }

    interface TabActiveInfo {
      tabId: number;
      windowId: number;
    }

    interface TabChangeInfo {
      audible?: boolean;
      discarded?: boolean;
      favIconUrl?: string;
      mutedInfo?: MutedInfo;
      pinned?: boolean;
      status?: string;
      title?: string;
      url?: string;
    }

    function query(queryInfo: QueryInfo): Promise<Tab[]>;
    function get(tabId: number): Promise<Tab>;
    function create(createProperties: { url?: string; active?: boolean; index?: number; windowId?: number; openerTabId?: number; pinned?: boolean }): Promise<Tab>;
    function update(tabId: number, updateProperties: UpdateProperties): Promise<Tab>;
    function update(updateProperties: UpdateProperties): Promise<Tab>;
    function remove(tabIds: number | number[]): Promise<void>;
    function reload(tabId?: number, reloadProperties?: { bypassCache?: boolean }): Promise<void>;

    const onCreated: chrome.events.Event<(tab: Tab) => void>;
    const onUpdated: chrome.events.Event<(tabId: number, changeInfo: TabChangeInfo, tab: Tab) => void>;
    const onRemoved: chrome.events.Event<(tabId: number, removeInfo: { windowId: number; isWindowClosing: boolean }) => void>;
    const onActivated: chrome.events.Event<(activeInfo: TabActiveInfo) => void>;
  }

  // Types pour chrome.scripting
  namespace scripting {
    interface InjectionTarget {
      tabId: number;
      frameIds?: number[];
      documentIds?: string[];
      allFrames?: boolean;
    }

    interface ScriptInjection {
      target: InjectionTarget;
      files?: string[];
      func?: (...args: any[]) => any;
      args?: any[];
      world?: 'ISOLATED' | 'MAIN';
    }

    interface CSSInjection {
      target: InjectionTarget;
      files?: string[];
      css?: string;
    }

    interface InjectionResult {
      result?: any;
      error?: any;
      frameId: number;
      documentId?: string;
    }

    function executeScript(injection: ScriptInjection): Promise<InjectionResult[]>;
    function insertCSS(injection: CSSInjection): Promise<void>;
    function removeCSS(injection: CSSInjection): Promise<void>;
  }

  // Types génériques pour les événements
  namespace events {
    interface Event<T> {
      addListener(callback: T): void;
      removeListener(callback: T): void;
      hasListener(callback: T): boolean;
    }
  }
}

// Types spécifiques pour notre extension
export interface ChromeMessage {
  type: string;
  data?: any;
  tabId?: number;
  frameId?: number;
}

export interface ChromeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Exportation globale des types Chrome
export {};
