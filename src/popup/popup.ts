/**
 * Anti-Spoil Extension - Popup TypeScript
 * Interface utilisateur pour gérer les chaînes YouTube bloquées
 */

import { MESSAGES } from '../utils/constants.js';
import type { 
  IChannelData, 
  IChannelInput, 
  IMessageResponse,
  TChannelId 
} from '../types/index.js';

/**
 * Gestionnaire principal du popup de l'extension
 */
class PopupManager {
  private channelInput: HTMLInputElement;
  private addButton: HTMLButtonElement;
  private channelsContainer: HTMLElement;
  private channelCount: HTMLElement;
  private loadingElement: HTMLElement;
  private emptyState: HTMLElement;
  private channels: IChannelData[] = [];

  constructor() {
    // Initialisation des éléments DOM
    this.channelInput = document.getElementById('channel-input') as HTMLInputElement;
    this.addButton = document.getElementById('add-btn') as HTMLButtonElement;
    this.channelsContainer = document.getElementById('channels-list') as HTMLElement;
    this.channelCount = document.getElementById('channel-count') as HTMLElement;
    this.loadingElement = document.getElementById('loading-overlay') as HTMLElement;
    this.emptyState = document.getElementById('empty-state') as HTMLElement;

    this.initializeEventListeners();
    this.loadChannels();
  }

  /**
   * Initialise les écouteurs d'événements
   */
  private initializeEventListeners(): void {
    // Formulaire d'ajout de chaîne
    const form = document.getElementById('add-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddChannel();
    });

    // Touche Entrée sur l'input
    this.channelInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleAddChannel();
      }
    });
  }

  /**
   * Charge la liste des chaînes depuis le background script
   */
  private async loadChannels(): Promise<void> {
    try {
      this.showLoading(true);
      
      const response = await this.sendMessage({ type: MESSAGES.GET_CHANNELS });
      
      if (response.success && response.data) {
        this.channels = response.data as IChannelData[];
        this.renderChannels();
      } else {
        this.showMessage('Erreur lors du chargement des chaînes', 'error');
      }
    } catch (error) {
      console.error('[Popup] Erreur chargement chaînes:', error);
      this.showMessage('Erreur de communication avec l\'extension', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Gère l'ajout d'une nouvelle chaîne
   */
  private async handleAddChannel(): Promise<void> {
    const input = this.channelInput.value.trim();
    
    if (!input) {
      this.showMessage('Veuillez entrer un ID ou URL de chaîne', 'warning');
      return;
    }

    try {
      this.setButtonLoading(true);
      
      const channelData = this.parseChannelInput(input);
      
      const response = await this.sendMessage({
        type: MESSAGES.ADD_CHANNEL,
        data: channelData
      });

      if (response.success && response.data) {
        const result = response.data as { channel: IChannelData; totalChannels: number };
        this.channels.push(result.channel);
        this.renderChannels();
        this.channelInput.value = '';
        this.showMessage(`Chaîne "${result.channel.name}" ajoutée avec succès`, 'success');
      } else {
        this.showMessage(response.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      console.error('[Popup] Erreur ajout chaîne:', error);
      this.showMessage('Erreur lors de l\'ajout de la chaîne', 'error');
    } finally {
      this.setButtonLoading(false);
    }
  }

  /**
   * Parse l'entrée utilisateur pour extraire les données de chaîne
   */
  private parseChannelInput(input: string): IChannelInput {
    // Expression régulière pour extraire l'ID de chaîne YouTube
    const channelIdMatch = input.match(/(?:channel\/|@)([a-zA-Z0-9_-]+)/);
    const ucIdMatch = input.match(/(UC[a-zA-Z0-9_-]{22})/);
    
    let channelId: string;
    let url: string;
    
    if (ucIdMatch?.[1]) {
      // ID direct UC...
      channelId = ucIdMatch[1];
      url = `https://www.youtube.com/channel/${channelId}`;
    } else if (channelIdMatch?.[1]) {
      // URL avec nom de chaîne ou @handle
      channelId = channelIdMatch[1];
      url = input.startsWith('http') ? input : `https://www.youtube.com/channel/${channelId}`;
    } else if (input.startsWith('@')) {
      // Handle @username
      channelId = input;
      url = `https://www.youtube.com/${input}`;
    } else {
      // Suppose que c'est un ID direct
      channelId = input;
      url = `https://www.youtube.com/channel/${channelId}`;
    }

    return {
      id: channelId,
      name: '', // Sera enrichi par le background script
      url: url,
      source: 'manual'
    };
  }

  /**
   * Supprime une chaîne
   */
  private async removeChannel(channelId: TChannelId): Promise<void> {
    try {
      const response = await this.sendMessage({
        type: MESSAGES.REMOVE_CHANNEL,
        data: { channelId }
      });

      if (response.success && response.data) {
        const result = response.data as { removedChannel: IChannelData; totalChannels: number };
        this.channels = this.channels.filter(ch => ch.id !== channelId);
        this.renderChannels();
        this.showMessage(`Chaîne "${result.removedChannel.name}" supprimée`, 'success');
      } else {
        this.showMessage(response.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('[Popup] Erreur suppression chaîne:', error);
      this.showMessage('Erreur lors de la suppression', 'error');
    }
  }

  /**
   * Affiche la liste des chaînes
   */
  private renderChannels(): void {
    this.updateChannelCount();
    
    if (this.channels.length === 0) {
      this.showEmptyState(true);
      return;
    }
    
    this.showEmptyState(false);
    
    this.channelsContainer.innerHTML = '';
    
    this.channels.forEach(channel => {
      const channelElement = this.createChannelElement(channel);
      this.channelsContainer.appendChild(channelElement);
    });
  }

  /**
   * Crée l'élément DOM pour une chaîne
   */
  private createChannelElement(channel: IChannelData): HTMLElement {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.dataset.channelId = channel.id;
    
    div.innerHTML = `
      <div class="channel-info">
        ${channel.avatarUrl ? `<img src="${channel.avatarUrl}" alt="Avatar" class="channel-avatar">` : ''}
        <div class="channel-details">
          <div class="channel-name">${this.escapeHtml(channel.name)}</div>
          <div class="channel-meta">
            <span class="channel-id">${this.escapeHtml(channel.id)}</span>
            <span class="channel-date">Ajoutée ${this.formatDate(channel.addedDate)}</span>
          </div>
        </div>
      </div>
      <div class="channel-actions">
        <button class="toggle-button" data-enabled="${channel.isEnabled}">
          ${channel.isEnabled ? 'Actif' : 'Inactif'}
        </button>
        <button class="remove-button" title="Supprimer">×</button>
      </div>
    `;

    // Événements
    const removeButton = div.querySelector('.remove-button') as HTMLButtonElement;
    removeButton.addEventListener('click', () => {
      if (confirm(`Supprimer la chaîne "${channel.name}" ?`)) {
        this.removeChannel(channel.id);
      }
    });

    return div;
  }

  /**
   * Met à jour le compteur de chaînes
   */
  private updateChannelCount(): void {
    this.channelCount.textContent = this.channels.length.toString();
  }

  /**
   * Affiche/cache l'état vide
   */
  private showEmptyState(show: boolean): void {
    this.emptyState.style.display = show ? 'block' : 'none';
    this.channelsContainer.style.display = show ? 'none' : 'block';
  }

  /**
   * Affiche/cache l'indicateur de chargement
   */
  private showLoading(show: boolean): void {
    this.loadingElement.style.display = show ? 'block' : 'none';
  }

  /**
   * Active/désactive le bouton d'ajout
   */
  private setButtonLoading(loading: boolean): void {
    this.addButton.disabled = loading;
    this.addButton.textContent = loading ? 'Ajout...' : 'Ajouter';
  }

  /**
   * Affiche un message à l'utilisateur
   */
  private showMessage(text: string, type: 'success' | 'error' | 'warning' = 'success'): void {
    // Sélectionne le bon toast selon le type
    let toastId = 'success-toast';
    if (type === 'error') {
      toastId = 'error-toast';
    }
    
    const toastElement = document.getElementById(toastId);
    const messageElement = toastElement?.querySelector('.toast-message');
    
    if (toastElement && messageElement) {
      messageElement.textContent = text;
      toastElement.style.display = 'block';
      
      setTimeout(() => {
        toastElement.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Envoie un message au background script
   */
  private async sendMessage(message: { type: string; data?: any }): Promise<IMessageResponse> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        resolve(response || { success: false, error: 'Pas de réponse' });
      });
    });
  }

  /**
   * Échappe le HTML pour éviter les injections
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Formate une date en français
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  }
}

// Initialisation du popup quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
