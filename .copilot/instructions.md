# Instructions pour GitHub Copilot - Anti-Spoil Extension

## 🎯 Contexte du projet
Cette extension Chrome permet aux utilisateurs d'enregistrer des chaînes YouTube dans une liste et de flouter automatiquement les miniatures et titres des vidéos de ces chaînes pour éviter les spoils.

## 🧠 Directives pour l'IA

### Avant chaque modification :
1. ✅ Lire `PROJECT_CONTEXT.md` pour le contexte global
2. ✅ Consulter `ARCHITECTURE.md` pour l'architecture technique
3. ✅ Vérifier `docs/features/` pour la fonctionnalité concernée
4. ✅ Consulter `DEVELOPMENT_LOG.md` pour l'historique récent

### Standards de code :
- **TypeScript** strict avec types explicites
- **API Chrome Extensions Manifest V3**
- **Structure modulaire** avec imports/exports typés
- **Documentation inline JSDoc** pour toutes les fonctions publiques
- **Interfaces et types** bien définis pour tous les objets de données
- **Gestion d'erreurs** typée et systématique
- **Code lisible par IA** : Noms explicites, commentaires détaillés, structure claire

### Structure de fichiers à respecter :
```
src/
├── content-scripts/    # Scripts YouTube
├── background/         # Service worker
├── popup/             # Interface utilisateur
├── storage/           # Gestion données
└── utils/             # Utilitaires
```

### Conventions de nommage :
- **Fichiers** : kebab-case (`youtube-blur.ts`)
- **Classes** : PascalCase (`ChannelManager`)
- **Interfaces/Types** : PascalCase avec préfixe (`IChannelData`, `TBlurSettings`)
- **Fonctions/variables** : camelCase (`blurThumbnail`)
- **Constants** : UPPER_SNAKE_CASE (`DEFAULT_BLUR_INTENSITY`)
- **Enums** : PascalCase (`BlurIntensity`, `MessageType`)

### Tags Git à utiliser :
- `[FEATURE-name]` pour nouvelles fonctionnalités
- `[BUG-area]` pour corrections
- `[REFACTOR-component]` pour refactoring
- `[DOCS]` pour documentation

## 🔍 Contexte technique important
- Extension Chrome Manifest V3
- **TypeScript strict** avec compilation vers ES2020
- Content Scripts pour injection YouTube
- Chrome Storage API pour persistance
- Messages passing typé entre composants
- Gestion permissions YouTube

## 🤖 Principes de Lisibilité IA/Humaine
Le code doit être **explicite et auto-documenté** pour faciliter la compréhension par l'IA :

### Code Explicite
```typescript
// ❌ Éviter
const d = data.filter(x => x.enabled);

// ✅ Préférer
const enabledChannels = channelList.filter(channel => channel.isEnabled);
```

### Types Détaillés
```typescript
// ✅ Interfaces complètes avec documentation
interface IChannelData {
  /** Identifiant unique YouTube (format: UC...) */
  readonly id: string;
  /** Nom d'affichage de la chaîne */
  name: string;
  /** URL de l'avatar de la chaîne */
  avatarUrl?: string;
  /** Date d'ajout au format ISO */
  addedDate: string;
  /** Statut d'activation du floutage */
  isEnabled: boolean;
}
```

### Fonctions Auto-Documentées
```typescript
/**
 * Floute une vidéo YouTube si sa chaîne est dans la liste bloquée
 * @param videoElement - Élément DOM de la vidéo à traiter
 * @param blockedChannelIds - Set des IDs de chaînes à flouter
 * @returns true si la vidéo a été floutée, false sinon
 */
async function processVideoForBlurring(
  videoElement: HTMLElement,
  blockedChannelIds: Set<string>
): Promise<boolean>
```

## 📝 Questions à poser si contexte manquant :
1. Quelle fonctionnalité spécifique modifier ?
2. Quel composant est concerné ?
3. Y a-t-il des contraintes particulières ?
4. Faut-il mettre à jour la documentation ?
