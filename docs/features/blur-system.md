# Feature: Système de Floutage YouTube

## 🎯 Objectif
Flouter automatiquement les miniatures et titres des vidéos provenant des chaînes YouTube enregistrées dans la liste anti-spoil.

## 📋 Spécifications Fonctionnelles

### UC001 : Détection Automatique des Vidéos
**Acteur** : Système
**Déclencheur** : Page YouTube chargée ou mise à jour

**Flux principal** :
1. Content script s'exécute sur toute page YouTube
2. Système scanne tous les éléments vidéo visibles
3. Pour chaque vidéo, extraction de l'ID de la chaîne source
4. Vérification si la chaîne est dans la liste anti-spoil
5. Application du floutage si chaîne trouvée

**Pages YouTube concernées** :
- ✅ Page d'accueil (feed principal)
- ✅ Résultats de recherche
- ✅ Pages de chaînes (autres vidéos)
- ✅ Playlists
- ✅ Vidéos suggérées (sidebar)
- ✅ Page de lecture (vidéos suivantes)

### UC002 : Application du Floutage
**Acteur** : Système
**Prérequis** : Vidéo détectée d'une chaîne bloquée

**Éléments à flouter** :
1. **Miniature** : Image de prévisualisation
2. **Titre** : Texte du titre de la vidéo
3. **Durée** : Affichage optionnel du temps (paramétrable)
4. **Vues/Stats** : Informations optionnelles (paramétrable)

**Techniques de floutage** :
- CSS `filter: blur(Npx)` pour l'effet visuel
- Overlay avec texte informatif
- Animation de transition fluide
- Respect des performances YouTube

### UC003 : Défloutage Interactif
**Acteur** : Utilisateur
**Prérequis** : Contenu flouté visible

**Options de défloutage** :
1. **Hover temporaire** : Défloutage au survol de la souris
2. **Clic pour révéler** : Clic permanent jusqu'à actualisation
3. **Double-clic permanent** : Défloutage définitif pour cette vidéo
4. **Bouton de contrôle** : Icône overlay pour actions

**Règles métier** :
- ✅ Défloutage instantané (< 200ms)
- ✅ Refloutage automatique si hover désactivé
- ✅ Mémorisation des choix utilisateur par session
- ✅ Feedback visuel sur les actions

## 🔧 Spécifications Techniques

### Sélecteurs DOM YouTube
```css
/* Miniatures principales */
ytd-thumbnail img,
ytd-playlist-thumbnail img,
ytd-rich-item-renderer img

/* Titres de vidéos */
#video-title,
.ytd-video-meta-block h3,
ytd-rich-grid-media h3,
.ytd-playlist-video-renderer h3

/* Métadonnées */
.ytd-video-meta-block #metadata-line,
ytd-video-meta-block span.ytd-video-meta-block

/* Chaînes sources */
ytd-channel-name a,
.ytd-video-owner-renderer a,
.ytd-playlist-byline-renderer a
```

### Classes CSS de Floutage
```css
/* Effet de flou principal */
.anti-spoil-blur {
  filter: blur(8px);
  transition: filter 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

/* Défloutage au hover */
.anti-spoil-blur:hover {
  filter: blur(0px);
}

/* Overlay informatif */
.anti-spoil-blur::after {
  content: "🙈 Contenu masqué";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 100;
}

.anti-spoil-blur:hover::after {
  opacity: 1;
}

/* États spéciaux */
.anti-spoil-revealed {
  filter: none !important;
}

.anti-spoil-permanent {
  filter: none !important;
  opacity: 0.8;
}
```

### API de Détection
```javascript
class YouTubeDetector {
  constructor() {
    this.observer = null;
    this.blockedChannels = new Set();
  }
  
  // Démarre la surveillance DOM
  startWatching() {
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // Analyse les nouveaux éléments
  handleMutations(mutations) {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          this.scanForVideos(node);
        }
      });
    });
  }
  
  // Recherche et traite les vidéos
  scanForVideos(container) {
    const videoElements = container.querySelectorAll([
      'ytd-rich-item-renderer',
      'ytd-video-renderer',
      'ytd-playlist-video-renderer',
      'ytd-grid-video-renderer'
    ].join(','));
    
    videoElements.forEach(this.processVideoElement.bind(this));
  }
  
  // Traite un élément vidéo individuel
  processVideoElement(videoEl) {
    const channelId = this.extractChannelId(videoEl);
    if (this.blockedChannels.has(channelId)) {
      this.applyBlur(videoEl);
    }
  }
  
  // Extrait l'ID de la chaîne
  extractChannelId(videoEl) {
    const channelLink = videoEl.querySelector('ytd-channel-name a');
    if (channelLink) {
      const url = channelLink.href;
      const match = url.match(/\/channel\/(UC[\w-]+)/);
      return match ? match[1] : null;
    }
    return null;
  }
  
  // Applique le floutage
  applyBlur(videoEl) {
    // Flouter la miniature
    const thumbnail = videoEl.querySelector('ytd-thumbnail img');
    if (thumbnail) {
      thumbnail.classList.add('anti-spoil-blur');
    }
    
    // Flouter le titre
    const title = videoEl.querySelector('#video-title');
    if (title) {
      title.classList.add('anti-spoil-blur');
    }
    
    // Ajouter contrôles interactifs
    this.addControls(videoEl);
  }
}
```

### Gestion des Performances
```javascript
// Debouncing pour éviter les appels excessifs
const debouncedScan = debounce(() => {
  detector.scanForVideos(document.body);
}, 100);

// Intersection Observer pour les éléments visibles uniquement
const intersectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      detector.processVideoElement(entry.target);
    }
  });
});

// Cache des résultats de détection
const channelCache = new Map(); // channelId -> isBlocked
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

## 🎨 Paramètres de Personnalisation

### Intensité du Floutage
- **Léger** : blur(3px) - Contenu partiellement visible
- **Moyen** : blur(8px) - Standard recommandé
- **Fort** : blur(15px) - Masquage complet
- **Personnalisé** : 1-20px au choix utilisateur

### Options de Défloutage
```javascript
const blurSettings = {
  hoverToReveal: true,        // Défloutage au hover
  clickToReveal: false,       // Défloutage au clic
  doubleClickPermanent: true, // Défloutage permanent
  showControls: true,         // Boutons de contrôle
  animationSpeed: 300         // Vitesse transition (ms)
};
```

### Éléments à Flouter
```javascript
const elementSettings = {
  blurThumbnails: true,    // Miniatures
  blurTitles: true,        // Titres
  blurDuration: false,     // Durée des vidéos
  blurViews: false,        // Nombre de vues
  blurDescription: true    // Description (si visible)
};
```

## 🧪 Cas de Tests

### Tests de Détection
1. **Page d'accueil** : Chargement → Scan automatique → Floutage correct
2. **Recherche** : Saisie → Résultats → Détection temps réel
3. **Navigation** : Clic page → Nouveau contenu → Scan différentiel
4. **Scroll infini** : Défilement → Nouveaux éléments → Application flou

### Tests d'Interaction
1. **Hover** : Survol → Défloutage → Refloutage
2. **Clic simple** : Clic → Défloutage temporaire
3. **Double-clic** : Double-clic → Défloutage permanent
4. **Boutons contrôle** : Clic bouton → Action correspondante

### Tests de Performance
1. **Charge CPU** : < 2% en utilisation normale
2. **Mémoire** : < 10MB d'impact additionnel
3. **Temps de réponse** : < 100ms pour appliquer flou
4. **Compatibilité** : Pas d'interférence avec YouTube

## 📊 Monitoring et Analytics

### Métriques de Performance
```javascript
const metrics = {
  detectionTime: 0,        // Temps de détection moyenne
  blurApplicationTime: 0,  // Temps d'application flou
  elementsProcessed: 0,    // Nombre d'éléments traités
  falsePositives: 0,       // Détections incorrectes
  cacheHitRate: 0          // Taux de succès cache
};
```

### Logs de Débogage
- Détections de chaînes (succès/échec)
- Applications de floutage
- Interactions utilisateur (hover, clic)
- Erreurs et exceptions

## 🚀 Évolutions Futures

### Phase 2
- ✅ Floutage basé sur mots-clés dans les titres
- ✅ Délai configurable avant floutage
- ✅ Zones d'exclusion personnalisables
- ✅ Effets de floutage alternatifs (pixelisation, etc.)

### Phase 3
- ✅ IA pour détection de spoils contextuels
- ✅ Floutage prédictif basé sur l'historique
- ✅ Intégration avec d'autres plateformes vidéo
