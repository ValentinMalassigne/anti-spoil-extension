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
  private loadingElement: HTMLElement;
  private emptyState: HTMLElement;
  private channels: IChannelData[] = [];
  
  // Quick Add elements
  private quickAddSection: HTMLElement;
  private currentChannelName: HTMLElement;
  private addCurrentButton: HTMLButtonElement;
  private currentChannelData: IChannelInput | null = null;
  
  // Modal elements
  private modalOverlay: HTMLElement;
  private modalTitle: HTMLElement;
  private modalMessage: HTMLElement;
  private modalConfirm: HTMLButtonElement;
  private modalCancel: HTMLButtonElement;
  private modalClose: HTMLButtonElement;
  private modalConfirmCallback: (() => void) | null = null;

  constructor() {
    // Initialisation des éléments DOM
    this.channelInput = document.getElementById('channel-input') as HTMLInputElement;
    this.addButton = document.getElementById('add-btn') as HTMLButtonElement;
    this.channelsContainer = document.getElementById('channels-list') as HTMLElement;
    this.loadingElement = document.getElementById('loading-overlay') as HTMLElement;
    this.emptyState = document.getElementById('empty-state') as HTMLElement;
    
    // Quick Add elements
    this.quickAddSection = document.getElementById('quick-add-section') as HTMLElement;
    this.currentChannelName = document.getElementById('current-channel-name') as HTMLElement;
    this.addCurrentButton = document.getElementById('add-current-btn') as HTMLButtonElement;

    // Modal elements
    this.modalOverlay = document.getElementById('modal-overlay') as HTMLElement;
    this.modalTitle = document.getElementById('modal-title') as HTMLElement;
    this.modalMessage = document.getElementById('modal-message') as HTMLElement;
    this.modalConfirm = document.getElementById('modal-confirm') as HTMLButtonElement;
    this.modalCancel = document.getElementById('modal-cancel') as HTMLButtonElement;
    this.modalClose = document.getElementById('modal-close') as HTMLButtonElement;

    this.initializeEventListeners();
    this.loadChannels();
    this.detectCurrentChannel();
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
    
    // Bouton d'ajout rapide
    this.addCurrentButton.addEventListener('click', () => {
      this.handleAddCurrentChannel();
    });
    
    // Modal events
    this.modalCancel.addEventListener('click', () => {
      this.hideModal();
    });
    
    this.modalClose.addEventListener('click', () => {
      this.hideModal();
    });
    
    this.modalConfirm.addEventListener('click', () => {
      if (this.modalConfirmCallback) {
        this.modalConfirmCallback();
      }
      this.hideModal();
    });
    
    // Fermer la modal en cliquant sur l'overlay
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) {
        this.hideModal();
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
        // Re-détecte la chaîne courante après le chargement pour mettre à jour l'état
        this.detectCurrentChannel();
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
    let channelId: string;
    let url: string;
    
    // Expression régulière pour extraire l'ID de chaîne YouTube
    const ucIdMatch = input.match(/(UC[a-zA-Z0-9_-]{22})/);
    const channelUrlMatch = input.match(/youtube\.com\/channel\/([a-zA-Z0-9_-]+)/);
    const handleMatch = input.match(/youtube\.com\/@([a-zA-Z0-9_-]+)/);
    const simpleHandleMatch = input.match(/^@([a-zA-Z0-9_-]+)$/);
    
    if (ucIdMatch?.[1]) {
      // ID direct UC...
      channelId = ucIdMatch[1];
      url = `https://www.youtube.com/channel/${channelId}`;
    } else if (channelUrlMatch?.[1]) {
      // URL avec /channel/...
      channelId = channelUrlMatch[1];
      url = `https://www.youtube.com/channel/${channelId}`;
    } else if (handleMatch?.[1]) {
      // URL avec /@handle
      channelId = `@${handleMatch[1]}`;
      url = `https://www.youtube.com/@${handleMatch[1]}`;
    } else if (simpleHandleMatch?.[1]) {
      // Handle @username simple
      channelId = input;
      url = `https://www.youtube.com/${input}`;
    } else if (input.startsWith('@')) {
      // Handle @username quelconque
      channelId = input;
      url = `https://www.youtube.com/${input}`;
    } else {
      // Suppose que c'est un ID direct ou nom de chaîne
      channelId = input;
      url = input.includes('youtube.com') ? input : `https://www.youtube.com/channel/${channelId}`;
    }

    return {
      id: channelId,
      name: '', // Sera enrichi par le background script
      url: url,
      source: 'manual'
    };
  }

  /**
   * Détecte la chaîne courante sur la page YouTube active
   */
  private async detectCurrentChannel(): Promise<void> {
    try {
      // Récupère l'onglet actif
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab?.id || !tab.url?.includes('youtube.com')) {
        this.hideQuickAdd();
        return;
      }

      // Demande au content script d'analyser la page
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_CURRENT_CHANNEL'
      });

      if (response?.success && response.channelData) {
        this.currentChannelData = response.channelData;
        
        // Vérifier si la chaîne est déjà dans la liste
        const isAlreadyBlocked = this.channels.some(channel => 
          channel.id === response.channelData.id
        );
        
        if (isAlreadyBlocked) {
          this.showQuickAddAsAlreadyAdded(response.channelData.name || response.channelData.id);
        } else {
          this.currentChannelName.textContent = response.channelData.name || response.channelData.id;
          this.showQuickAdd();
        }
      } else {
        this.hideQuickAdd();
      }
    } catch (error) {
      console.error('[Popup] Erreur détection chaîne courante:', error);
      this.hideQuickAdd();
    }
  }

  /**
   * Gère l'ajout de la chaîne courante
   */
  private async handleAddCurrentChannel(): Promise<void> {
    if (!this.currentChannelData) {
      this.showMessage('Aucune chaîne détectée sur cette page', 'warning');
      return;
    }

    try {
      this.setCurrentButtonLoading(true);
      
      const response = await this.sendMessage({
        type: MESSAGES.ADD_CHANNEL,
        data: this.currentChannelData
      });

      if (response.success && response.data) {
        const result = response.data as { channel: IChannelData; totalChannels: number };
        this.channels.push(result.channel);
        this.renderChannels();
        this.showMessage(`Chaîne "${result.channel.name}" ajoutée avec succès`, 'success');
        // Affiche "déjà dans la liste" au lieu de masquer complètement
        this.showQuickAddAsAlreadyAdded(result.channel.name);
      } else {
        this.showMessage(response.error || 'Erreur lors de l\'ajout', 'error');
      }
    } catch (error) {
      console.error('[Popup] Erreur ajout chaîne courante:', error);
      this.showMessage('Erreur lors de l\'ajout de la chaîne', 'error');
    } finally {
      this.setCurrentButtonLoading(false);
    }
  }

  /**
   * Affiche la section d'ajout rapide
   */
  private showQuickAdd(): void {
    // Réafficher le bouton d'ajout et nettoyer le message "déjà ajoutée"
    this.addCurrentButton.style.display = 'flex';
    
    const alreadyAddedMessage = this.quickAddSection.querySelector('.already-added-message');
    if (alreadyAddedMessage) {
      alreadyAddedMessage.remove();
    }
    
    this.quickAddSection.style.display = 'block';
  }

  /**
   * Masque la section d'ajout rapide
   */
  private hideQuickAdd(): void {
    this.quickAddSection.style.display = 'none';
  }

  /**
   * Affiche la section d'ajout rapide avec le message "déjà ajoutée"
   */
  private showQuickAddAsAlreadyAdded(channelName: string): void {
    this.currentChannelName.textContent = channelName;
    this.addCurrentButton.style.display = 'none';
    
    // Créer ou mettre à jour le message "déjà ajoutée"
    let alreadyAddedMessage = this.quickAddSection.querySelector('.already-added-message') as HTMLElement;
    if (!alreadyAddedMessage) {
      alreadyAddedMessage = document.createElement('div');
      alreadyAddedMessage.className = 'already-added-message';
      alreadyAddedMessage.innerHTML = '<span style="color: #28a745; font-weight: 500;">✓ Déjà dans la liste</span>';
      this.quickAddSection.querySelector('.quick-add-content')?.appendChild(alreadyAddedMessage);
    }
    
    this.quickAddSection.style.display = 'block';
  }

  /**
   * Gère l'état de chargement du bouton d'ajout rapide
   */
  private setCurrentButtonLoading(loading: boolean): void {
    const btnText = this.addCurrentButton.querySelector('.btn-text') as HTMLElement;
    const btnLoading = this.addCurrentButton.querySelector('.btn-loading') as HTMLElement;
    
    this.addCurrentButton.disabled = loading;
    btnText.style.display = loading ? 'none' : 'inline';
    btnLoading.style.display = loading ? 'inline' : 'none';
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
        
        // Re-détecte la chaîne courante pour mettre à jour le Quick Add
        this.detectCurrentChannel();
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
          </div>
        </div>
      </div>
      <div class="channel-actions">
        <button class="remove-button" title="Supprimer la chaîne">✕</button>
      </div>
    `;

    // Événements
    const removeButton = div.querySelector('.remove-button') as HTMLButtonElement;
    removeButton.addEventListener('click', () => {
      this.showConfirmModal(
        'Supprimer la chaîne',
        `Êtes-vous sûr de vouloir supprimer "${channel.name}" de la liste des chaînes bloquées ?`,
        () => {
          this.removeChannel(channel.id);
        }
      );
    });

    return div;
  }

  /**
   * Met à jour le compteur de chaînes
   */
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
   * Affiche la modal de confirmation
   */
  private showConfirmModal(title: string, message: string, callback: () => void): void {
    this.modalTitle.textContent = title;
    this.modalMessage.textContent = message;
    this.modalConfirmCallback = callback;
    this.modalOverlay.style.display = 'flex';
  }

  /**
   * Masque la modal de confirmation
   */
  private hideModal(): void {
    this.modalOverlay.style.display = 'none';
    this.modalConfirmCallback = null;
  }

  /**
   * Échappe le HTML pour éviter les injections
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

}

// Initialisation du popup quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
