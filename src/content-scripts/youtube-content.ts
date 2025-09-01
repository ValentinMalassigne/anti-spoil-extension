/**
 * Anti-Spoil Extension - Content Script YouTube TypeScript
 * Injecté sur YouTube pour détecter et flouter les chaînes bloquées
 */

import { MESSAGES, YOUTUBE_SELECTORS } from '../utils/constants.js';
import type { 
  IChannelData, 
  IVideoInfo, 
  TChannelId 
} from '../types/index.js';

/**
 * Gestionnaire principal du content script YouTube
 */
class YouTubeContentScript {
  private blockedChannels: Set<TChannelId> = new Set();
  private observer: MutationObserver | null = null;
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Initialise le content script
   */
  private async init(): Promise<void> {
    try {
      console.log('[Anti-Spoil Content] Initialisation sur YouTube');
      
      // Charge la liste des chaînes bloquées
      await this.loadBlockedChannels();
      
      // Configure l'observation des changements DOM
      this.setupMutationObserver();
      
      // Traite le contenu initial
      this.processCurrentContent();
      
      this.isInitialized = true;
      console.log('[Anti-Spoil Content] Initialisé avec', this.blockedChannels.size, 'chaînes bloquées');
      
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur initialisation:', error);
    }
  }

  /**
   * Charge la liste des chaînes bloquées depuis le background script
   */
  private async loadBlockedChannels(): Promise<void> {
    try {
      const response = await this.sendMessage({ type: MESSAGES.GET_CHANNELS });
      
      if (response.success && response.data) {
        const channels = response.data as IChannelData[];
        this.blockedChannels.clear();
        
        channels
          .filter(channel => channel.isEnabled !== false)
          .forEach(channel => this.blockedChannels.add(channel.id));
          
        console.log('[Anti-Spoil Content] Chargé', this.blockedChannels.size, 'chaînes actives');
      }
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur chargement chaînes:', error);
    }
  }

  /**
   * Configure l'observateur de mutations DOM
   */
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Vérifie si c'est un élément vidéo ou de navigation
              if (this.isVideoElement(element) || element.querySelector(YOUTUBE_SELECTORS.VIDEO_CONTAINERS)) {
                shouldProcess = true;
                break;
              }
            }
          }
        }
        
        if (shouldProcess) break;
      }
      
      if (shouldProcess) {
        // Délai pour permettre au DOM de se stabiliser
        setTimeout(() => this.processCurrentContent(), 100);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Vérifie si un élément est un conteneur vidéo
   */
  private isVideoElement(element: Element): boolean {
    return element.matches(YOUTUBE_SELECTORS.VIDEO_CONTAINERS) ||
           element.matches('ytd-video-renderer') ||
           element.matches('ytd-grid-video-renderer') ||
           element.matches('ytd-compact-video-renderer');
  }

  /**
   * Traite tout le contenu visible de la page
   */
  private processCurrentContent(): void {
    try {
      // Trouve tous les conteneurs vidéo
      const videoContainers = document.querySelectorAll(YOUTUBE_SELECTORS.VIDEO_CONTAINERS);
      
      videoContainers.forEach(container => {
        this.processVideoContainer(container as HTMLElement);
      });
      
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur traitement contenu:', error);
    }
  }

  /**
   * Traite un conteneur vidéo individuel
   */
  private processVideoContainer(container: HTMLElement): void {
    try {
      const videoInfo = this.extractVideoInfo(container);
      
      if (videoInfo && this.shouldBlurVideo(videoInfo)) {
        this.applyBlur(container, videoInfo);
      }
      
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur traitement vidéo:', error);
    }
  }

  /**
   * Extrait les informations d'une vidéo
   */
  private extractVideoInfo(container: HTMLElement): IVideoInfo | null {
    try {
      // Cherche le lien de la chaîne
      const channelLink = container.querySelector(YOUTUBE_SELECTORS.CHANNEL_LINKS) as HTMLAnchorElement;
      if (!channelLink) return null;

      // Extrait l'ID de la chaîne depuis l'URL
      const channelId = this.extractChannelIdFromUrl(channelLink.href);
      if (!channelId) return null;

      // Cherche le titre et la miniature
      const titleElement = container.querySelector(YOUTUBE_SELECTORS.TITLES) as HTMLElement;
      const thumbnailElement = container.querySelector(YOUTUBE_SELECTORS.THUMBNAILS) as HTMLElement;

      return {
        videoUrl: '', // À implémenter si nécessaire
        videoId: '', // À implémenter si nécessaire
        channelId,
        channelName: channelLink.textContent?.trim() || 'Chaîne inconnue',
        title: titleElement?.textContent?.trim() || 'Titre inconnu',
        element: container,
        pageType: 'home' as const
      };
      
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur extraction info vidéo:', error);
      return null;
    }
  }

  /**
   * Extrait l'ID de chaîne depuis une URL YouTube
   */
  private extractChannelIdFromUrl(url: string): TChannelId | null {
    try {
      // Gère les différents formats d'URL de chaîne
      const patterns = [
        /\/channel\/(UC[a-zA-Z0-9_-]{22})/,  // /channel/UCxxxxx
        /\/c\/([a-zA-Z0-9_-]+)/,              // /c/channel-name
        /\/@([a-zA-Z0-9_-]+)/,                // /@handle
        /\/user\/([a-zA-Z0-9_-]+)/            // /user/username
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) {
          return match[1] as TChannelId;
        }
      }

      return null;
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur extraction ID chaîne:', error);
      return null;
    }
  }

  /**
   * Détermine si une vidéo doit être floutée
   */
  private shouldBlurVideo(videoInfo: IVideoInfo): boolean {
    return this.blockedChannels.has(videoInfo.channelId);
  }

  /**
   * Applique le flou à un conteneur vidéo
   */
  private applyBlur(container: HTMLElement, videoInfo: IVideoInfo): void {
    try {
      // Évite de traiter plusieurs fois le même élément
      if (container.dataset.antiSpoilProcessed === 'true') {
        return;
      }

      container.dataset.antiSpoilProcessed = 'true';
      container.classList.add('anti-spoil-blurred');

      // Floute la miniature
      const thumbnail = container.querySelector(YOUTUBE_SELECTORS.THUMBNAILS) as HTMLElement;
      if (thumbnail) {
        thumbnail.style.filter = 'blur(20px)';
        thumbnail.style.transition = 'filter 0.3s ease';
      }

      // Floute le titre
      const title = container.querySelector(YOUTUBE_SELECTORS.TITLES) as HTMLElement;
      if (title) {
        title.style.filter = 'blur(5px)';
        title.style.transition = 'filter 0.3s ease';
      }

      // Ajoute un overlay avec informations
      this.addBlurOverlay(container, videoInfo);

      // Signale la détection au background script
      this.reportChannelDetection(videoInfo.channelId);

      console.log('[Anti-Spoil Content] Vidéo floutée:', videoInfo.channelName);
      
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur application flou:', error);
    }
  }

  /**
   * Ajoute un overlay informatif sur le contenu flouté
   */
  private addBlurOverlay(container: HTMLElement, videoInfo: IVideoInfo): void {
    const overlay = document.createElement('div');
    overlay.className = 'anti-spoil-overlay';
    overlay.innerHTML = `
      <div class="anti-spoil-message">
        <div class="anti-spoil-icon">👁️‍🗨️</div>
        <div class="anti-spoil-text">
          <strong>Contenu masqué</strong><br>
          Chaîne bloquée : ${this.escapeHtml(videoInfo.channelName)}
        </div>
        <button class="anti-spoil-reveal" type="button">Révéler</button>
      </div>
    `;

    // Style de l'overlay
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      text-align: center;
      border-radius: 8px;
    `;

    // Bouton de révélation
    const revealButton = overlay.querySelector('.anti-spoil-reveal') as HTMLButtonElement;
    revealButton.style.cssText = `
      margin-top: 10px;
      padding: 6px 12px;
      background: #ff6b35;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    `;

    revealButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.revealContent(container);
    });

    // Position relative pour l'overlay
    if (getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    container.appendChild(overlay);
  }

  /**
   * Révèle temporairement le contenu flouté
   */
  private revealContent(container: HTMLElement): void {
    const overlay = container.querySelector('.anti-spoil-overlay') as HTMLElement;
    const thumbnail = container.querySelector(YOUTUBE_SELECTORS.THUMBNAILS) as HTMLElement;
    const title = container.querySelector(YOUTUBE_SELECTORS.TITLES) as HTMLElement;

    if (overlay) overlay.style.display = 'none';
    if (thumbnail) thumbnail.style.filter = 'none';
    if (title) title.style.filter = 'none';

    // Remasque après 3 secondes
    setTimeout(() => {
      if (overlay) overlay.style.display = 'flex';
      if (thumbnail) thumbnail.style.filter = 'blur(20px)';
      if (title) title.style.filter = 'blur(5px)';
    }, 3000);
  }

  /**
   * Signale la détection d'une chaîne au background script
   */
  private async reportChannelDetection(channelId: TChannelId): Promise<void> {
    try {
      await this.sendMessage({
        type: MESSAGES.CHANNEL_DETECTED,
        data: { channelId }
      });
    } catch (error) {
      console.error('[Anti-Spoil Content] Erreur signalement détection:', error);
    }
  }

  /**
   * Envoie un message au background script
   */
  private async sendMessage(message: { type: string; data?: any }): Promise<{ success: boolean; data?: any; error?: string }> {
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
   * Nettoie les ressources avant déchargement
   */
  public cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * Recharge la liste des chaînes bloquées (méthode publique)
   */
  public async reloadChannels(): Promise<void> {
    await this.loadBlockedChannels();
    this.processCurrentContent();
  }
}

// Messages du background script pour mettre à jour les chaînes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === MESSAGES.UPDATE_BLOCKED_CHANNELS) {
    // Recharge les chaînes bloquées
    if ((window as any).antiSpoilContentScript) {
      ((window as any).antiSpoilContentScript as YouTubeContentScript).reloadChannels();
    }
  }
});

// Initialisation
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    (window as any).antiSpoilContentScript = new YouTubeContentScript();
  });
} else {
  (window as any).antiSpoilContentScript = new YouTubeContentScript();
}

// Nettoyage avant déchargement
window.addEventListener('beforeunload', () => {
  if ((window as any).antiSpoilContentScript) {
    ((window as any).antiSpoilContentScript as YouTubeContentScript).cleanup();
  }
});
