/**
 * Anti-Spoil Extension - Constantes Globales TypeScript
 * Centralise toutes les constantes utilisées dans l'extension avec types stricts
 */

import type { 
  EMessageType, 
  TBlurIntensity, 
  TErrorCode, 
  TYouTubePageType,
  IExtensionSettings,
  TUITheme,
  TLanguage 
} from '../types';

// =============================================================================
// TYPES DE MESSAGES
// =============================================================================

/**
 * Types de messages pour la communication entre composants
 * Utilisés pour le message passing Chrome Extension
 */
export const MESSAGES = {
  // Background ↔ Content Scripts
  GET_CHANNELS: 'GET_CHANNELS' as const,
  ADD_CHANNEL: 'ADD_CHANNEL' as const,
  REMOVE_CHANNEL: 'REMOVE_CHANNEL' as const,
  IS_CHANNEL_BLOCKED: 'IS_CHANNEL_BLOCKED' as const,
  UPDATE_BLOCKED_CHANNELS: 'UPDATE_BLOCKED_CHANNELS' as const,
  CHANNEL_DETECTED: 'CHANNEL_DETECTED' as const,
  
  // Settings
  GET_SETTINGS: 'GET_SETTINGS' as const,
  UPDATE_SETTINGS: 'UPDATE_SETTINGS' as const,
  SETTINGS_UPDATED: 'SETTINGS_UPDATED' as const,
  
  // UI Actions
  TOGGLE_CHANNEL: 'TOGGLE_CHANNEL' as const,
  EXPORT_CHANNELS: 'EXPORT_CHANNELS' as const,
  IMPORT_CHANNELS: 'IMPORT_CHANNELS' as const,
  
  // Content Script Actions
  BLUR_VIDEO: 'BLUR_VIDEO' as const,
  UNBLUR_VIDEO: 'UNBLUR_VIDEO' as const,
  SCAN_PAGE: 'SCAN_PAGE' as const
} as const;

// Type pour les valeurs de MESSAGES
export type TMessageType = typeof MESSAGES[keyof typeof MESSAGES];

// =============================================================================
// SÉLECTEURS CSS YOUTUBE
// =============================================================================

/**
 * Sélecteurs CSS pour les différents éléments YouTube
 * Régulièrement mis à jour selon les changements de YouTube
 */
export const YOUTUBE_SELECTORS = {
  /**
   * Conteneurs de vidéos sur différentes pages YouTube
   */
  VIDEO_CONTAINERS: [
    'ytd-rich-item-renderer',           // Page d'accueil grille
    'ytd-video-renderer',               // Résultats de recherche
    'ytd-playlist-video-renderer',      // Vidéos dans playlist
    'ytd-grid-video-renderer',          // Grille de chaîne
    'ytd-compact-video-renderer',       // Sidebar suggestions
    'ytd-movie-renderer',               // Films
    'ytd-radio-renderer'                // Mix/Radio
  ].join(','),
  
  /**
   * Miniatures des vidéos YouTube
   */
  THUMBNAILS: [
    'ytd-thumbnail img',
    'ytd-playlist-thumbnail img',
    '.ytd-thumbnail img',
    'img.yt-core-image'
  ].join(','),
  
  /**
   * Titres de vidéos sur toutes les pages
   */
  TITLES: [
    '#video-title',
    '.ytd-video-meta-block h3',
    'ytd-rich-grid-media h3',
    '.ytd-playlist-video-renderer h3',
    '#video-title-link',
    'a#video-title'
  ].join(','),
  
  /**
   * Liens vers les chaînes YouTube
   */
  CHANNEL_LINKS: [
    'ytd-channel-name a',
    '.ytd-video-owner-renderer a',
    '.ytd-playlist-byline-renderer a',
    'ytd-channel-renderer a',
    '.yt-simple-endpoint.ytd-channel-name'
  ].join(','),
  
  /**
   * Métadonnées des vidéos (vues, durée, etc.)
   */
  METADATA: [
    '.ytd-video-meta-block #metadata-line',
    'ytd-video-meta-block span.ytd-video-meta-block',
    '.ytd-thumbnail-overlay-time-status-renderer',
    '#overlays ytd-thumbnail-overlay-time-status-renderer'
  ].join(','),
  
  // Pages spécifiques YouTube
  HOME_FEED: 'ytd-rich-grid-renderer',
  SEARCH_RESULTS: 'ytd-search ytd-video-renderer',
  CHANNEL_PAGE: 'ytd-browse[page-subtype="channel"]',
  WATCH_PAGE: 'ytd-watch-flexy'
} as const;

// =============================================================================
// EXPRESSIONS RÉGULIÈRES
// =============================================================================

/**
 * Expressions régulières pour l'extraction d'informations YouTube
 */
export const YOUTUBE_PATTERNS = {
  /** Extraction ID de chaîne YouTube (format UC...) */
  CHANNEL_ID: /\/channel\/(UC[\w-]{22})/,
  
  /** URL de chaîne avec nom personnalisé */
  CHANNEL_HANDLE: /\/@([\w.-]+)/,
  CHANNEL_USER: /\/user\/([\w.-]+)/,
  CHANNEL_C: /\/c\/([\w.-]+)/,
  
  /** Extraction ID de vidéo YouTube */
  VIDEO_ID: /[?&]v=([a-zA-Z0-9_-]{11})/,
  
  /** Validation URL YouTube complète */
  YOUTUBE_URL: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/
} as const;

// =============================================================================
// CLASSES CSS FLOUTAGE
// =============================================================================

/**
 * Classes CSS utilisées pour le système de floutage
 */
export const BLUR_CLASSES = {
  /** Classe principale appliquée aux éléments floutés */
  BLUR: 'anti-spoil-blur',
  
  /** États spéciaux du floutage */
  REVEALED: 'anti-spoil-revealed',
  PERMANENT: 'anti-spoil-permanent',
  HOVER_ACTIVE: 'anti-spoil-hover-active',
  
  /** Éléments de contrôle et overlay */
  OVERLAY: 'anti-spoil-overlay',
  CONTROLS: 'anti-spoil-controls',
  BUTTON: 'anti-spoil-button',
  
  /** Containers et wrappers */
  CONTAINER: 'anti-spoil-container',
  VIDEO_ITEM: 'anti-spoil-video-item'
} as const;

// =============================================================================
// CONFIGURATION PAR DÉFAUT
// =============================================================================

/**
 * Paramètres par défaut de l'extension
 * Utilisés lors de la première installation
 */
export const DEFAULT_SETTINGS: IExtensionSettings = {
  blur: {
    intensity: 8 as TBlurIntensity,
    hoverToReveal: true,
    clickToReveal: false,
    doubleClickPermanent: true,
    elements: {
      thumbnails: true,
      titles: true,
      duration: false,
      views: false,
      channelName: false,
      description: false
    },
    animationSpeed: 300
  },
  ui: {
    showOverlay: true,
    overlayText: '🙈 Contenu masqué',
    theme: 'auto' as TUITheme,
    showNotifications: true,
    language: 'fr' as TLanguage
  },
  performance: {
    debounceDelay: 100,
    maxElementsPerScan: 50,
    enableCache: true,
    cacheTTL: 5 * 60 * 1000 // 5 minutes
  },
  advanced: {
    autoUpdateChannels: true,
    enableLogs: false,
    enableStats: true,
    developerMode: false
  }
};

// =============================================================================
// VALEURS LIMITES
// =============================================================================

/**
 * Constantes de limitation pour la sécurité et les performances
 */
export const LIMITS = {
  /** Limites du floutage */
  MIN_BLUR_INTENSITY: 1 as TBlurIntensity,
  MAX_BLUR_INTENSITY: 20 as TBlurIntensity,
  
  /** Limites de performance */
  MAX_CHANNELS: 1000,
  MAX_SCAN_INTERVAL: 5000,    // 5 secondes
  MIN_SCAN_INTERVAL: 50,      // 50ms
  
  /** Cache et mémoire */
  CACHE_TTL: 5 * 60 * 1000,   // 5 minutes
  MAX_CACHE_SIZE: 100,
  
  /** Stockage Chrome */
  MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_CHANNEL_NAME_LENGTH: 100,
  MAX_IMPORT_FILE_SIZE: 1024 * 1024   // 1MB
} as const;

// =============================================================================
// MESSAGES D'ERREUR
// =============================================================================

/**
 * Messages d'erreur standardisés avec codes
 */
export const ERRORS: Record<TErrorCode, string> = {
  INVALID_URL: 'URL de chaîne YouTube invalide',
  CHANNEL_EXISTS: 'Cette chaîne est déjà dans votre liste',
  CHANNEL_NOT_FOUND: 'Chaîne non trouvée dans la liste',
  STORAGE_ERROR: 'Erreur de stockage des données',
  PERMISSION_DENIED: 'Permissions insuffisantes',
  NETWORK_ERROR: 'Erreur de connexion réseau',
  INVALID_DATA: 'Format de données invalide',
  QUOTA_EXCEEDED: 'Espace de stockage insuffisant'
} as const;

// =============================================================================
// ÉVÉNEMENTS PERSONNALISÉS
// =============================================================================

/**
 * Noms des événements personnalisés pour la communication interne
 */
export const EVENTS = {
  CHANNEL_ADDED: 'antispoil:channel:added',
  CHANNEL_REMOVED: 'antispoil:channel:removed',
  CHANNEL_TOGGLED: 'antispoil:channel:toggled',
  VIDEO_BLURRED: 'antispoil:video:blurred',
  VIDEO_REVEALED: 'antispoil:video:revealed',
  SETTINGS_CHANGED: 'antispoil:settings:changed',
  PAGE_SCANNED: 'antispoil:page:scanned'
} as const;

// =============================================================================
// URLS ET ENDPOINTS
// =============================================================================

/**
 * URLs de base et endpoints utilisés par l'extension
 */
export const URLS = {
  YOUTUBE_BASE: 'https://www.youtube.com',
  CHANNEL_BASE: 'https://www.youtube.com/channel/',
  API_BASE: 'https://www.googleapis.com/youtube/v3',
  
  // Pages internes de l'extension (dans dist/)
  POPUP: 'popup/popup.html',
  OPTIONS: 'options/options.html',
  WELCOME: 'welcome/welcome.html'
} as const;

// =============================================================================
// MÉTADONNÉES EXTENSION
// =============================================================================

/**
 * Informations sur l'extension (synchronisées avec package.json)
 */
export const EXTENSION_INFO = {
  NAME: 'Anti-Spoil Extension',
  VERSION: '1.0.0',
  DESCRIPTION: 'Protège contre les spoils YouTube',
  AUTHOR: 'ValentinMalassigne',
  HOMEPAGE: 'https://github.com/ValentinMalassigne/anti-spoil-extension'
} as const;

// =============================================================================
// CONFIGURATION DÉVELOPPEMENT
// =============================================================================

/**
 * Configuration pour le mode développement et debugging
 */
export const DEV_CONFIG = {
  ENABLE_CONSOLE_LOGS: true,
  ENABLE_PERFORMANCE_MONITORING: true,
  MOCK_CHANNELS: false,
  DEBUG_SELECTORS: false
} as const;

// =============================================================================
// TYPES DE PAGES YOUTUBE
// =============================================================================

/**
 * Mapping des types de pages YouTube pour la détection
 */
export const YOUTUBE_PAGE_TYPES: Record<string, TYouTubePageType> = {
  '/': 'home',
  '/results': 'search',
  '/channel/': 'channel',
  '/watch': 'watch',
  '/playlist': 'playlist',
  '/feed/trending': 'trending',
  '/shorts/': 'shorts'
} as const;

// =============================================================================
// EXPORT POUR COMPATIBILITÉ GLOBALE
// =============================================================================

/**
 * Expose les constantes en global pour compatibilité avec les content scripts
 * qui ne peuvent pas toujours utiliser les imports ES6
 */
if (typeof globalThis !== 'undefined') {
  (globalThis as any).AntiSpoilConstants = {
    MESSAGES,
    YOUTUBE_SELECTORS,
    YOUTUBE_PATTERNS,
    BLUR_CLASSES,
    DEFAULT_SETTINGS,
    LIMITS,
    ERRORS,
    EVENTS
  };
}
