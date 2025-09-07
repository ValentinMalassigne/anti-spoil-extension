/**
 * Anti-Spoil Extension - Gestionnaire des Chaînes TypeScript
 * Gère l'ajout, suppression et persistance des chaînes YouTube à bloquer
 */

import type { 
  IChannelData, 
  IChannelInput, 
  IMessageResponse, 
  TChannelId,
  IExportData,
  IExportMetadata,
  TChannelSource 
} from '../types';

/**
 * Gestionnaire centralisé pour toutes les opérations sur les chaînes YouTube
 */
export class ChannelManager {
  private readonly storageKey = 'blockedChannels';

  /**
   * Récupère toutes les chaînes bloquées depuis le storage Chrome
   * @returns Promise avec la liste des chaînes
   */
  public async getChannels(): Promise<IChannelData[]> {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      return result[this.storageKey] || [];
    } catch (error) {
      console.error('[ChannelManager] Erreur récupération chaînes:', error);
      return [];
    }
  }

  /**
   * Ajoute une nouvelle chaîne à la liste de blocage
   * @param channelData - Données de base de la chaîne à ajouter
   * @returns Résultat de l'opération avec la chaîne enrichie
   */
  public async addChannel(channelData: IChannelInput): Promise<IMessageResponse<{ channel: IChannelData; totalChannels: number }>> {
    try {
      // Validation des données d'entrée
      if (!channelData.id) {
        return {
          success: false,
          error: 'ID de chaîne requis',
          errorCode: 'INVALID_DATA'
        };
      }

      const channels = await this.getChannels();
      
      // Vérifie si la chaîne existe déjà
      const existingChannel = channels.find(channel => channel.id === channelData.id);
      if (existingChannel) {
        return { 
          success: false, 
          error: 'Cette chaîne est déjà dans la liste',
          errorCode: 'CHANNEL_EXISTS',
          data: { channel: existingChannel, totalChannels: channels.length }
        };
      }

      // Enrichit les données de la chaîne
      const enrichedChannel = await this.enrichChannelData(channelData);
      
      // Ajoute la chaîne
      channels.push(enrichedChannel);
      
      // Sauvegarde
      await chrome.storage.local.set({ [this.storageKey]: channels });
      
      console.log('[ChannelManager] Chaîne ajoutée:', enrichedChannel.name);
      
      return { 
        success: true, 
        data: {
          channel: enrichedChannel,
          totalChannels: channels.length
        }
      };
      
    } catch (error) {
      console.error('[ChannelManager] Erreur ajout chaîne:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Supprime une chaîne de la liste de blocage
   * @param channelId - ID de la chaîne à supprimer
   * @returns Résultat de l'opération
   */
  public async removeChannel(channelId: TChannelId): Promise<IMessageResponse<{ removedChannel: IChannelData; totalChannels: number }>> {
    try {
      if (!channelId) {
        return {
          success: false,
          error: 'ID de chaîne requis',
          errorCode: 'INVALID_DATA'
        };
      }

      const channels = await this.getChannels();
      const channelIndex = channels.findIndex(channel => channel.id === channelId);
      
      if (channelIndex === -1) {
        return { 
          success: false, 
          error: 'Chaîne non trouvée dans la liste',
          errorCode: 'CHANNEL_NOT_FOUND'
        };
      }

      const removedChannel = channels[channelIndex];
      if (!removedChannel) {
        return { 
          success: false, 
          error: 'Chaîne non trouvée',
          errorCode: 'CHANNEL_NOT_FOUND'
        };
      }
      
      channels.splice(channelIndex, 1);
      
      // Sauvegarde
      await chrome.storage.local.set({ [this.storageKey]: channels });
      
      console.log('[ChannelManager] Chaîne supprimée:', removedChannel.name);
      
      return { 
        success: true, 
        data: {
          removedChannel,
          totalChannels: channels.length
        }
      };
      
    } catch (error) {
      console.error('[ChannelManager] Erreur suppression chaîne:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Vérifie si une chaîne est bloquée et active
   * @param channelId - ID de la chaîne à vérifier
   * @returns true si la chaîne est bloquée et active
   */
  public async isChannelBlocked(channelId: TChannelId): Promise<boolean> {
    try {
      if (!channelId) return false;
      
      const channels = await this.getChannels();
      const channel = channels.find(ch => ch.id === channelId);
      
      return channel ? channel.isEnabled !== false : false;
    } catch (error) {
      console.error('[ChannelManager] Erreur vérification chaîne:', error);
      return false;
    }
  }

  /**
   * Active ou désactive une chaîne
   * @param channelId - ID de la chaîne
   * @param enabled - Nouvel état d'activation
   * @returns Résultat de l'opération avec la chaîne mise à jour
   */
  public async toggleChannel(channelId: TChannelId, enabled: boolean): Promise<IMessageResponse<{ channel: IChannelData }>> {
    try {
      const channels = await this.getChannels();
      const channel = channels.find(ch => ch.id === channelId);
      
      if (!channel) {
        return { 
          success: false, 
          error: 'Chaîne non trouvée',
          errorCode: 'CHANNEL_NOT_FOUND'
        };
      }

      channel.isEnabled = enabled;
      channel.lastModified = new Date().toISOString();
      
      await chrome.storage.local.set({ [this.storageKey]: channels });
      
      return { success: true, data: { channel } };
      
    } catch (error) {
      console.error('[ChannelManager] Erreur toggle chaîne:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Enrichit les données d'une chaîne avec informations complètes
   * @param channelData - Données de base de la chaîne
   * @returns Chaîne avec données enrichies
   */
  private async enrichChannelData(channelData: IChannelInput): Promise<IChannelData> {
    const now = new Date().toISOString();
    
    // Structure de base avec types stricts
    const enrichedChannel: IChannelData = {
      id: channelData.id,
      name: channelData.name || 'Chaîne Inconnue',
      url: channelData.url || `https://www.youtube.com/channel/${channelData.id}`,
      avatarUrl: channelData.avatarUrl,
      addedDate: now,
      lastModified: now,
      isEnabled: true,
      source: channelData.source || 'manual',
      detectionCount: 0
    };

    // Essaie d'extraire plus d'informations si pas fournies
    if (!channelData.avatarUrl || channelData.name === 'Chaîne Inconnue') {
      try {
        const additionalData = await this.fetchChannelMetadata(channelData.id);
        if (additionalData.name) enrichedChannel.name = additionalData.name;
        if (additionalData.avatarUrl) enrichedChannel.avatarUrl = additionalData.avatarUrl;
      } catch (error) {
        console.warn('[ChannelManager] Impossible de récupérer métadonnées:', error);
      }
    }

    return enrichedChannel;
  }

  /**
   * Récupère les métadonnées d'une chaîne (à implémenter)
   * @param channelId - ID de la chaîne
   * @returns Métadonnées basiques de la chaîne
   */
  private async fetchChannelMetadata(channelId: TChannelId): Promise<{ name?: string; avatarUrl?: string }> {
    // Note: Cette méthode sera implémentée pour extraire les infos
    // depuis la page YouTube courante ou via injection de script
    
    return {
      name: undefined,
      avatarUrl: undefined
    };
  }

  /**
   * Exporte la liste des chaînes au format JSON
   * @returns Données d'export structurées
   */
  public async exportChannels(): Promise<IMessageResponse<IExportData>> {
    try {
      const channels = await this.getChannels();
      
      const metadata: IExportMetadata = {
        extensionVersion: '1.0.0',
        totalChannels: channels.length,
        activeChannels: channels.filter(ch => ch.isEnabled).length,
        platform: 'Chrome Extension'
      };

      const exportData: IExportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        metadata,
        channels: channels.map(channel => ({
          id: channel.id,
          name: channel.name,
          url: channel.url,
          avatarUrl: channel.avatarUrl,
          addedDate: channel.addedDate,
          lastModified: channel.lastModified,
          isEnabled: channel.isEnabled,
          source: channel.source,
          detectionCount: channel.detectionCount,
          lastSeen: channel.lastSeen
        }))
      };
      
      return { success: true, data: exportData };
    } catch (error) {
      console.error('[ChannelManager] Erreur export:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Importe une liste de chaînes depuis des données JSON
   * @param importData - Données à importer
   * @param mergeMode - Mode d'import ('merge' ou 'replace')
   * @returns Résultat de l'import avec statistiques
   */
  public async importChannels(
    importData: IExportData, 
    mergeMode: 'merge' | 'replace' = 'merge'
  ): Promise<IMessageResponse<{ addedCount: number; skippedCount: number; totalChannels: number }>> {
    try {
      if (!importData.channels || !Array.isArray(importData.channels)) {
        return {
          success: false,
          error: 'Format de données invalide',
          errorCode: 'INVALID_DATA'
        };
      }

      const currentChannels = mergeMode === 'replace' ? [] : await this.getChannels();
      const currentIds = new Set(currentChannels.map(ch => ch.id));
      
      let addedCount = 0;
      let skippedCount = 0;
      
      for (const importChannel of importData.channels) {
        if (!currentIds.has(importChannel.id)) {
          const enrichedChannel = await this.enrichChannelData({
            id: importChannel.id,
            name: importChannel.name,
            url: importChannel.url,
            avatarUrl: importChannel.avatarUrl,
            source: 'import'
          });
          currentChannels.push(enrichedChannel);
          addedCount++;
        } else {
          skippedCount++;
        }
      }
      
      await chrome.storage.local.set({ [this.storageKey]: currentChannels });
      
      return { 
        success: true, 
        data: {
          addedCount, 
          skippedCount, 
          totalChannels: currentChannels.length
        }
      };
      
    } catch (error) {
      console.error('[ChannelManager] Erreur import:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }

  /**
   * Nettoie les chaînes obsolètes ou invalides
   * @returns Résultat du nettoyage avec statistiques
   */
  public async cleanupChannels(): Promise<IMessageResponse<{ removed: number; remaining: number }>> {
    try {
      const channels = await this.getChannels();
      const validChannels = channels.filter(channel => {
        // Garde seulement les chaînes avec ID valide
        return channel.id && channel.id.match(/^UC[\w-]{22}$/);
      });
      
      if (validChannels.length !== channels.length) {
        await chrome.storage.local.set({ [this.storageKey]: validChannels });
        console.log(`[ChannelManager] ${channels.length - validChannels.length} chaînes invalides supprimées`);
      }
      
      return { 
        success: true, 
        data: {
          removed: channels.length - validChannels.length,
          remaining: validChannels.length
        }
      };
      
    } catch (error) {
      console.error('[ChannelManager] Erreur nettoyage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        errorCode: 'STORAGE_ERROR'
      };
    }
  }
}
