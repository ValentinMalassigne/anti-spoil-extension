/**
 * Types globaux pour l'extension Anti-Spoil
 * Centralise toutes les interfaces et types utilisés dans l'extension
 */

// =============================================================================
// TYPES DE BASE
// =============================================================================

/** Identifiant unique d'une chaîne YouTube (format: UC...) */
export type TChannelId = string;

/** URL YouTube valide */
export type TYouTubeUrl = string;

/** Date au format ISO 8601 */
export type TISODate = string;

/** Intensité du floutage (1-20 pixels) */
export type TBlurIntensity = number;

// =============================================================================
// DONNÉES DE CHAÎNES
// =============================================================================

/**
 * Données complètes d'une chaîne YouTube bloquée
 */
export interface IChannelData {
  /** Identifiant unique YouTube (format: UC...) */
  readonly id: TChannelId;
  
  /** Nom d'affichage de la chaîne */
  name: string;
  
  /** URL complète de la chaîne */
  url: TYouTubeUrl;
  
  /** URL de l'avatar de la chaîne (optionnel) */
  avatarUrl?: string;
  
  /** Date d'ajout de la chaîne à la liste */
  readonly addedDate: TISODate;
  
  /** Date de dernière modification */
  lastModified: TISODate;
  
  /** Statut d'activation du floutage pour cette chaîne */
  isEnabled: boolean;
  
  /** Source d'ajout de la chaîne */
  source: TChannelSource;
  
  /** Nombre de fois que la chaîne a été détectée */
  detectionCount: number;
  
  /** Date de dernière détection (optionnel) */
  lastSeen?: TISODate;
}

/**
 * Données minimales pour ajouter une nouvelle chaîne
 */
export interface IChannelInput {
  /** Identifiant de la chaîne */
  id: TChannelId;
  
  /** Nom de la chaîne */
  name: string;
  
  /** URL de la chaîne (optionnel, sera générée si absente) */
  url?: TYouTubeUrl;
  
  /** URL de l'avatar (optionnel) */
  avatarUrl?: string;
  
  /** Source d'ajout */
  source?: TChannelSource;
}

/**
 * Source d'ajout d'une chaîne
 */
export type TChannelSource = 
  | 'manual'        // Ajout manuel via URL
  | 'popup'         // Ajout via popup sur page chaîne
  | 'context-menu'  // Ajout via menu contextuel
  | 'import'        // Import depuis fichier
  | 'api';          // Ajout via API externe

// =============================================================================
// PARAMÈTRES DE L'EXTENSION
// =============================================================================

/**
 * Configuration complète de l'extension
 */
export interface IExtensionSettings {
  /** Configuration du floutage */
  blur: IBlurSettings;
  
  /** Configuration de l'interface utilisateur */
  ui: IUISettings;
  
  /** Configuration des performances */
  performance: IPerformanceSettings;
  
  /** Configuration avancée */
  advanced: IAdvancedSettings;
}

/**
 * Paramètres de floutage
 */
export interface IBlurSettings {
  /** Intensité du flou en pixels (1-20) */
  intensity: TBlurIntensity;
  
  /** Défloutage au survol de la souris */
  hoverToReveal: boolean;
  
  /** Défloutage au clic simple */
  clickToReveal: boolean;
  
  /** Défloutage permanent au double-clic */
  doubleClickPermanent: boolean;
  
  /** Éléments à flouter */
  elements: IBlurElements;
  
  /** Vitesse des animations en millisecondes */
  animationSpeed: number;
}

/**
 * Éléments spécifiques à flouter
 */
export interface IBlurElements {
  /** Flouter les miniatures des vidéos */
  thumbnails: boolean;
  
  /** Flouter les titres des vidéos */
  titles: boolean;
  
  /** Flouter la durée des vidéos */
  duration: boolean;
  
  /** Flouter le nombre de vues */
  views: boolean;
  
  /** Flouter le nom de la chaîne */
  channelName: boolean;
  
  /** Flouter la description (si visible) */
  description: boolean;
}

/**
 * Paramètres d'interface utilisateur
 */
export interface IUISettings {
  /** Afficher l'overlay informatif sur les éléments floutés */
  showOverlay: boolean;
  
  /** Texte à afficher dans l'overlay */
  overlayText: string;
  
  /** Thème de l'interface */
  theme: TUITheme;
  
  /** Afficher les notifications */
  showNotifications: boolean;
  
  /** Langue de l'interface */
  language: TLanguage;
}

/**
 * Thèmes disponibles pour l'interface
 */
export type TUITheme = 'light' | 'dark' | 'auto';

/**
 * Langues supportées
 */
export type TLanguage = 'fr' | 'en' | 'es' | 'de';

/**
 * Paramètres de performance
 */
export interface IPerformanceSettings {
  /** Délai anti-rebond pour le scan en millisecondes */
  debounceDelay: number;
  
  /** Nombre maximum d'éléments à traiter par scan */
  maxElementsPerScan: number;
  
  /** Utiliser le cache pour les détections */
  enableCache: boolean;
  
  /** Durée de vie du cache en millisecondes */
  cacheTTL: number;
}

/**
 * Paramètres avancés
 */
export interface IAdvancedSettings {
  /** Mise à jour automatique des informations de chaînes */
  autoUpdateChannels: boolean;
  
  /** Activer les logs de débogage */
  enableLogs: boolean;
  
  /** Collecter les statistiques d'utilisation */
  enableStats: boolean;
  
  /** Mode développeur */
  developerMode: boolean;
}

// =============================================================================
// MESSAGES ET COMMUNICATION
// =============================================================================

/**
 * Types de messages pour la communication entre composants
 */
export enum EMessageType {
  // Gestion des chaînes
  GET_CHANNELS = 'GET_CHANNELS',
  ADD_CHANNEL = 'ADD_CHANNEL',
  REMOVE_CHANNEL = 'REMOVE_CHANNEL',
  TOGGLE_CHANNEL = 'TOGGLE_CHANNEL',
  UPDATE_BLOCKED_CHANNELS = 'UPDATE_BLOCKED_CHANNELS',
  
  // Paramètres
  GET_SETTINGS = 'GET_SETTINGS',
  UPDATE_SETTINGS = 'UPDATE_SETTINGS',
  SETTINGS_UPDATED = 'SETTINGS_UPDATED',
  
  // Détection et floutage
  IS_CHANNEL_BLOCKED = 'IS_CHANNEL_BLOCKED',
  CHANNEL_DETECTED = 'CHANNEL_DETECTED',
  BLUR_VIDEO = 'BLUR_VIDEO',
  UNBLUR_VIDEO = 'UNBLUR_VIDEO',
  SCAN_PAGE = 'SCAN_PAGE',
  
  // Import/Export
  EXPORT_CHANNELS = 'EXPORT_CHANNELS',
  IMPORT_CHANNELS = 'IMPORT_CHANNELS'
}

/**
 * Structure de base pour tous les messages
 */
export interface IBaseMessage<T = unknown> {
  /** Type du message */
  type: EMessageType;
  
  /** Données du message (optionnel) */
  data?: T;
  
  /** Identifiant unique du message */
  messageId?: string;
  
  /** Timestamp du message */
  timestamp?: number;
}

/**
 * Réponse standard pour tous les messages
 */
export interface IMessageResponse<T = unknown> {
  /** Succès de l'opération */
  success: boolean;
  
  /** Données de réponse (en cas de succès) */
  data?: T;
  
  /** Message d'erreur (en cas d'échec) */
  error?: string;
  
  /** Code d'erreur (en cas d'échec) */
  errorCode?: TErrorCode;
}

/**
 * Codes d'erreur standardisés
 */
export type TErrorCode = 
  | 'INVALID_URL'
  | 'CHANNEL_EXISTS'
  | 'CHANNEL_NOT_FOUND'
  | 'STORAGE_ERROR'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'INVALID_DATA'
  | 'QUOTA_EXCEEDED';

// =============================================================================
// DONNÉES D'IMPORT/EXPORT
// =============================================================================

/**
 * Structure pour l'export de données
 */
export interface IExportData {
  /** Version du format d'export */
  version: string;
  
  /** Date d'export */
  exportDate: TISODate;
  
  /** Métadonnées de l'extension */
  metadata: IExportMetadata;
  
  /** Liste des chaînes exportées */
  channels: IChannelData[];
  
  /** Paramètres exportés (optionnel) */
  settings?: Partial<IExtensionSettings>;
}

/**
 * Métadonnées d'export
 */
export interface IExportMetadata {
  /** Version de l'extension */
  extensionVersion: string;
  
  /** Nombre total de chaînes */
  totalChannels: number;
  
  /** Nombre de chaînes actives */
  activeChannels: number;
  
  /** Plateforme d'export */
  platform: string;
}

// =============================================================================
// DÉTECTION YOUTUBE
// =============================================================================

/**
 * Informations d'une vidéo YouTube détectée
 */
export interface IVideoInfo {
  /** URL de la vidéo */
  videoUrl: string;
  
  /** ID de la vidéo */
  videoId: string;
  
  /** Titre de la vidéo */
  title: string;
  
  /** ID de la chaîne source */
  channelId: TChannelId;
  
  /** Nom de la chaîne source */
  channelName: string;
  
  /** Élément DOM de la vidéo */
  element: HTMLElement;
  
  /** Type de page où la vidéo a été trouvée */
  pageType: TYouTubePageType;
}

/**
 * Types de pages YouTube
 */
export type TYouTubePageType = 
  | 'home'        // Page d'accueil
  | 'search'      // Résultats de recherche
  | 'channel'     // Page de chaîne
  | 'watch'       // Page de lecture vidéo
  | 'playlist'    // Page de playlist
  | 'trending'    // Tendances
  | 'shorts';     // YouTube Shorts

// =============================================================================
// ÉVÉNEMENTS PERSONNALISÉS
// =============================================================================

/**
 * Données d'événement pour les actions sur les chaînes
 */
export interface IChannelEventData {
  /** Chaîne concernée */
  channel: IChannelData;
  
  /** Action effectuée */
  action: TChannelAction;
  
  /** Données supplémentaires (optionnel) */
  metadata?: Record<string, unknown>;
}

/**
 * Actions possibles sur les chaînes
 */
export type TChannelAction = 
  | 'added'
  | 'removed' 
  | 'toggled'
  | 'updated'
  | 'detected';

/**
 * Données d'événement pour les actions de floutage
 */
export interface IBlurEventData {
  /** Vidéo concernée */
  video: IVideoInfo;
  
  /** Action effectuée */
  action: TBlurAction;
  
  /** Paramètres de floutage utilisés */
  settings: IBlurSettings;
}

/**
 * Actions de floutage
 */
export type TBlurAction = 
  | 'blurred'
  | 'revealed'
  | 'permanently_revealed'
  | 'hover_revealed';

// =============================================================================
// CHROME APIS
// =============================================================================

/**
 * Extension des types Chrome pour TypeScript
 */
declare global {
  namespace chrome {
    namespace runtime {
      interface Message extends IBaseMessage {}
    }
  }
}
