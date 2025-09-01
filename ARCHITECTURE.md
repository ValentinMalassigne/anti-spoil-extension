# Architecture Technique - Anti-Spoil Extension

## 🏗️ Vue d'ensemble

L'extension suit une architecture modulaire basée sur les standards Chrome Extension Manifest V3, avec séparation claire des responsabilités entre les composants. **Le projet est développé en TypeScript** pour une meilleure robustesse, documentation du code et compréhension par l'IA.

## 📁 Structure des Fichiers

```
anti-spoil-extension/
├── 📋 manifest.json                 # Configuration extension
├── � tsconfig.json                 # Configuration TypeScript
├── 📋 package.json                  # Dépendances et scripts
├── �📁 src/
│   ├── 📁 background/
│   │   ├── service-worker.ts        # Service worker principal
│   │   └── channel-manager.ts       # Logique gestion chaînes
│   ├── 📁 content-scripts/
│   │   ├── youtube-detector.ts      # Détection contenu YouTube
│   │   ├── blur-manager.ts          # Gestion du floutage
│   │   └── ui-injector.ts           # Injection d'éléments UI
│   ├── 📁 popup/
│   │   ├── popup.html               # Interface popup
│   │   ├── popup.ts                 # Logique popup
│   │   └── popup.css                # Styles popup
│   ├── 📁 storage/
│   │   ├── storage-manager.ts       # API stockage
│   │   └── data-models.ts           # Modèles de données & types
│   ├── 📁 utils/
│   │   ├── dom-utils.ts             # Utilitaires DOM
│   │   ├── youtube-api.ts           # Helpers YouTube
│   │   ├── constants.ts             # Constantes globales
│   │   └── types.ts                 # Types TypeScript partagés
│   └── 📁 styles/
│       ├── blur-effects.css         # Effets de floutage
│       └── injection.css            # Styles injectés
├── 📁 dist/                         # Fichiers compilés pour Chrome
├── 📁 docs/                         # Documentation
└── 📁 assets/                       # Icônes et ressources
```

## 🔄 Flux de Communication

### 1. Background ↔ Content Scripts
```javascript
// Background vers Content
chrome.tabs.sendMessage(tabId, {
  type: 'UPDATE_CHANNELS',
  channels: channelList
});

// Content vers Background
chrome.runtime.sendMessage({
  type: 'ADD_CHANNEL',
  channelId: 'UC123...',
  channelName: 'Nom Chaîne'
});
```

### 2. Popup ↔ Background
```javascript
// Popup récupère les données
const response = await chrome.runtime.sendMessage({
  type: 'GET_CHANNELS'
});

// Background répond avec les données
return { channels: storedChannels };
```

## 🧩 Composants Détaillés

### Background Service Worker
**Fichier** : `src/background/service-worker.js`

**Responsabilités** :
- ✅ Coordination générale de l'extension
- ✅ Gestion des messages entre composants
- ✅ Surveillance des onglets YouTube
- ✅ Persistence des données

**APIs Chrome utilisées** :
- `chrome.runtime.onMessage`
- `chrome.tabs.onUpdated`
- `chrome.storage.local`
- `chrome.scripting.executeScript`

### Content Scripts YouTube
**Fichiers** : `src/content-scripts/`

**Responsabilités** :
- ✅ Détection des vidéos sur YouTube
- ✅ Application du floutage en temps réel
- ✅ Injection d'éléments UI (boutons)
- ✅ Observation des changements DOM

**Sélecteurs YouTube clés** :
```css
/* Miniatures vidéos */
ytd-thumbnail img
ytd-rich-item-renderer img

/* Titres vidéos */
#video-title
.ytd-video-meta-block h3

/* Chaînes */
ytd-channel-name a
.ytd-video-owner-renderer a
```

### Popup Interface
**Fichiers** : `src/popup/`

**Responsabilités** :
- ✅ Affichage de la liste des chaînes
- ✅ Ajout/suppression de chaînes
- ✅ Configuration des paramètres
- ✅ Import/export de données

**Interface Components** :
```html
<!-- Liste des chaînes -->
<div id="channel-list">
  <div class="channel-item">
    <img class="channel-avatar" />
    <span class="channel-name"></span>
    <button class="remove-btn">×</button>
  </div>
</div>

<!-- Formulaire ajout -->
<form id="add-channel-form">
  <input type="url" placeholder="URL de la chaîne YouTube" />
  <button type="submit">Ajouter</button>
</form>
```

### Storage Manager
**Fichiers** : `src/storage/`

**Structure des données** :
```javascript
{
  channels: [
    {
      id: 'UC123...',           // ID YouTube de la chaîne
      name: 'Nom de la chaîne', // Nom d'affichage
      avatarUrl: 'https://...',  // URL avatar
      addedDate: '2025-08-30',   // Date d'ajout
      enabled: true              // Actif/inactif
    }
  ],
  settings: {
    blurIntensity: 5,           // Intensité floutage (1-10)
    hoverToReveal: true,        // Défloutage au hover
    blurTitles: true,           // Flouter les titres
    blurThumbnails: true        // Flouter les miniatures
  }
}
```

## 🎨 Système de Floutage

### CSS Effects
```css
.anti-spoil-blurred {
  filter: blur(10px);
  transition: filter 0.3s ease;
}

.anti-spoil-blurred:hover {
  filter: blur(0px);
}

.anti-spoil-overlay {
  position: relative;
}

.anti-spoil-overlay::after {
  content: "🙈 Contenu masqué";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
}
```

### Détection Intelligente
```javascript
// Détection par URL de chaîne
const channelUrlPattern = /\/channel\/(UC[\w-]+)/;
const channelId = url.match(channelUrlPattern)?.[1];

// Détection par élément DOM
const channelLink = videoElement.querySelector('ytd-channel-name a');
const channelUrl = channelLink?.href;
```

## 🔒 Permissions Manifest

```json
{
  "permissions": [
    "storage",          // Stockage local
    "activeTab",        // Onglet actif
    "scripting"         // Injection scripts
  ],
  "host_permissions": [
    "*://*.youtube.com/*"  // Accès YouTube
  ]
}
```

## ⚡ Performance et Optimisations

### Lazy Loading
- Chargement conditionnel des modules
- Injection de scripts uniquement sur YouTube
- Cache des données de chaînes

### Debouncing
- Limitation des appels de détection
- Attente stabilisation DOM
- Batch processing des modifications

### Memory Management
- Nettoyage des event listeners
- Weak references pour DOM elements
- Garbage collection consciente

## 🧪 Points d'Extension Futurs

### APIs Externes
- YouTube Data API v3 (métadonnées enrichies)
- Synchronisation cloud (optionnelle)

### Fonctionnalités Avancées
- Floutage basé sur mots-clés
- Planification temporaire
- Statistiques d'utilisation
- Thèmes personnalisés
