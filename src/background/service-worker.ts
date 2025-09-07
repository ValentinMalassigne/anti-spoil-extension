/**
 * Anti-Spoil Extension - Service Worker Principal
 * Gère la coordination globale de l'extension et la communication entre composants
 */

import { ChannelManager } from './channel-manager.js';
import { MESSAGES, DEFAULT_SETTINGS } from '../utils/constants.js';
import type { 
  IBaseMessage, 
  IMessageResponse, 
  IExtensionSettings,
  TChannelId,
  IChannelInput,
  IChannelData 
} from '../types/index.js';

/**
 * Service Worker principal de l'extension Anti-Spoil
 * Centralise toute la logique métier et la communication
 */
class AntiSpoilServiceWorker {
  private channelManager: ChannelManager;
  private isInitialized: boolean = false;

  constructor() {
    this.channelManager = new ChannelManager();
    this.init();
  }

  /**
   * Initialise le service worker et configure les listeners
   */
  private init(): void {
    console.log('[Anti-Spoil] Service Worker démarré');
    
    // Écoute des messages des content scripts et popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indique une réponse asynchrone
    });
    
    // Surveillance des onglets YouTube
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // Installation de l'extension
    chrome.runtime.onInstalled.addListener(this.handleInstall.bind(this));
    
    this.isInitialized = true;
  }

  /**
   * Gère les messages entrants des différents composants
   * @param message - Message reçu avec type et données
   * @param sender - Informations sur l'expéditeur
   * @param sendResponse - Fonction de callback pour la réponse
   * @returns Promise de réponse ou true pour réponse asynchrone
   */
  private async handleMessage(
    message: IBaseMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: IMessageResponse) => void
  ): Promise<IMessageResponse | void> {
    console.log('[Anti-Spoil] Message reçu:', message.type);
    
    try {
      let response: IMessageResponse;

      switch (message.type) {
        case MESSAGES.GET_CHANNELS:
          response = await this.handleGetChannels();
          break;
          
        case MESSAGES.ADD_CHANNEL:
          response = await this.handleAddChannel(message.data as IChannelInput);
          break;
          
        case MESSAGES.REMOVE_CHANNEL:
          response = await this.handleRemoveChannel((message.data as { channelId: TChannelId }).channelId);
          break;
          
        case MESSAGES.IS_CHANNEL_BLOCKED:
          response = await this.handleIsChannelBlocked((message.data as { channelId: TChannelId }).channelId);
          break;
          
        case MESSAGES.GET_SETTINGS:
          response = await this.handleGetSettings();
          break;
          
        case MESSAGES.UPDATE_SETTINGS:
          response = await this.handleUpdateSettings(message.data as Partial<IExtensionSettings>);
          break;
          
        case MESSAGES.CHANNEL_DETECTED:
          response = await this.handleChannelDetected(message.data);
          break;
          
        default:
          console.warn('[Anti-Spoil] Type de message inconnu:', message.type);
          response = { 
            success: false, 
            error: 'Type de message non supporté',
            errorCode: 'INVALID_DATA'
          };
      }

      // Envoi de la réponse
      if (sendResponse) {
        sendResponse(response);
      }
      return response;

    } catch (error) {
      console.error('[Anti-Spoil] Erreur lors du traitement du message:', error);
      const errorResponse: IMessageResponse = { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
      
      if (sendResponse) {
        sendResponse(errorResponse);
      }
      return errorResponse;
    }
  }

  /**
   * Gère la récupération de toutes les chaînes
   */
  private async handleGetChannels(): Promise<IMessageResponse> {
    const channels = await this.channelManager.getChannels();
    return { success: true, data: channels };
  }

  /**
   * Gère l'ajout d'une nouvelle chaîne
   */
  private async handleAddChannel(channelData: IChannelInput): Promise<IMessageResponse> {
    if (!channelData?.id) {
      return { 
        success: false, 
        error: 'ID de chaîne requis',
        errorCode: 'INVALID_DATA'
      };
    }

    return await this.channelManager.addChannel(channelData);
  }

  /**
   * Gère la suppression d'une chaîne
   */
  private async handleRemoveChannel(channelId: TChannelId): Promise<IMessageResponse> {
    if (!channelId) {
      return { 
        success: false, 
        error: 'ID de chaîne requis',
        errorCode: 'INVALID_DATA'
      };
    }

    return await this.channelManager.removeChannel(channelId);
  }

  /**
   * Vérifie si une chaîne est bloquée
   */
  private async handleIsChannelBlocked(channelId: TChannelId): Promise<IMessageResponse> {
    const isBlocked = await this.channelManager.isChannelBlocked(channelId);
    return { success: true, data: { isBlocked } };
  }

  /**
   * Récupère les paramètres actuels
   */
  private async handleGetSettings(): Promise<IMessageResponse> {
    try {
      const result = await chrome.storage.local.get('settings');
      const settings = result.settings || DEFAULT_SETTINGS;
      return { success: true, data: settings };
    } catch (error) {
      console.error('[Anti-Spoil] Erreur récupération paramètres:', error);
      return { 
        success: false, 
        error: 'Erreur de lecture des paramètres',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Met à jour les paramètres de l'extension
   */
  private async handleUpdateSettings(newSettings: Partial<IExtensionSettings>): Promise<IMessageResponse> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings: IExtensionSettings = { 
        ...DEFAULT_SETTINGS,
        ...currentSettings, 
        ...newSettings 
      };
      
      await chrome.storage.local.set({ settings: updatedSettings });
      
      // Notifie tous les content scripts du changement
      await this.notifySettingsChange(updatedSettings);
      
      return { success: true, data: updatedSettings };
    } catch (error) {
      console.error('[Anti-Spoil] Erreur mise à jour paramètres:', error);
      return { 
        success: false, 
        error: 'Erreur de sauvegarde des paramètres',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Gère la détection d'une chaîne (pour analytics)
   */
  private async handleChannelDetected(data: any): Promise<IMessageResponse> {
    // Log de détection pour analytics futures
    console.log('[Anti-Spoil] Chaîne détectée:', data?.channelId);
    return { success: true };
  }

  /**
   * Gère les mises à jour d'onglets YouTube
   */
  private async handleTabUpdate(
    tabId: number, 
    changeInfo: chrome.tabs.TabChangeInfo, 
    tab: chrome.tabs.Tab
  ): Promise<void> {
    // Vérifie si c'est une page YouTube complètement chargée
    if (changeInfo.status === 'complete' && 
        tab.url && 
        tab.url.includes('youtube.com')) {
      
      console.log('[Anti-Spoil] Page YouTube détectée:', tab.url);
      
      try {
        // Récupère la liste des chaînes bloquées
        const channels = await this.channelManager.getChannels();
        const blockedChannelIds = channels
          .filter(channel => channel.isEnabled)
          .map(channel => channel.id);

        // Envoie la liste au content script
        await chrome.tabs.sendMessage(tabId, {
          type: MESSAGES.UPDATE_BLOCKED_CHANNELS,
          data: { channelIds: blockedChannelIds }
        });
        
      } catch (error) {
        // Content script peut ne pas être prêt, ce n'est pas grave
        console.log('[Anti-Spoil] Content script pas encore prêt:', error);
      }
    }
  }

  /**
   * Gère l'installation de l'extension
   */
  private async handleInstall(details: chrome.runtime.InstalledDetails): Promise<void> {
    if (details.reason === 'install') {
      console.log('[Anti-Spoil] Extension installée pour la première fois');
      
      // Initialise les paramètres par défaut
      await this.initializeDefaultSettings();
      
      // Optionnel : Ouvre la page de bienvenue
      // await chrome.tabs.create({
      //   url: chrome.runtime.getURL('welcome/welcome.html')
      // });
    }
  }

  /**
   * Initialise les paramètres par défaut lors de la première installation
   */
  private async initializeDefaultSettings(): Promise<void> {
    try {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
      console.log('[Anti-Spoil] Paramètres par défaut initialisés');
    } catch (error) {
      console.error('[Anti-Spoil] Erreur initialisation paramètres:', error);
    }
  }

  /**
   * Récupère les paramètres actuels (méthode interne)
   */
  private async getSettings(): Promise<IExtensionSettings> {
    try {
      const result = await chrome.storage.local.get('settings');
      return result.settings || DEFAULT_SETTINGS;
    } catch (error) {
      console.error('[Anti-Spoil] Erreur récupération paramètres:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Notifie tous les content scripts d'un changement de paramètres
   */
  private async notifySettingsChange(settings: IExtensionSettings): Promise<void> {
    try {
      const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
      
      const notifications = tabs.map(async (tab) => {
        if (tab.id) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: MESSAGES.SETTINGS_UPDATED,
              data: settings
            });
          } catch (error) {
            // Certains onglets peuvent ne pas avoir de content script
            console.log(`[Anti-Spoil] Impossible de notifier l'onglet ${tab.id}:`, error);
          }
        }
      });

      await Promise.allSettled(notifications);
      
    } catch (error) {
      console.error('[Anti-Spoil] Erreur notification paramètres:', error);
    }
  }
}

// Démarre le service worker
new AntiSpoilServiceWorker();
