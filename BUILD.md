# Instructions de Build - Anti-Spoil Extension

## 🛠️ Configuration TypeScript

Cette extension est développée en **TypeScript** pour garantir :
- **Type safety** et détection d'erreurs à la compilation
- **Meilleure documentation** du code via les types
- **Compréhension facilitée** pour l'IA et les développeurs
- **Refactoring sécurisé** et maintenance simplifiée

## 📦 Installation des Dépendances

```bash
# Installation des dépendances de développement
npm install

# Ou avec yarn
yarn install
```

## 🚀 Scripts de Développement

### Développement avec Watch Mode
```bash
# Compile TypeScript et copie les assets automatiquement
npm run dev

# Lance la compilation en mode watch + copie des assets
npm run build:watch
```

### Build de Production
```bash
# Build complet pour distribution
npm run build

# Build + package en ZIP
npm run package
```

### Outils de Qualité
```bash
# Vérification TypeScript
npm run type-check

# Linting du code
npm run lint
npm run lint:fix

# Formatage du code
npm run format
npm run format:check

# Tests
npm run test
npm run test:watch
npm run test:coverage
```

## 📁 Structure de Build

```
├── src/                    # Sources TypeScript
│   ├── *.ts               # Fichiers source
│   ├── *.html             # Templates HTML
│   └── *.css              # Styles CSS
├── dist/                   # Fichiers compilés pour Chrome
│   ├── background/        # JS compilé depuis src/background/*.ts
│   ├── content-scripts/   # JS compilé depuis src/content-scripts/*.ts
│   ├── popup/            # HTML + CSS + JS compilé
│   ├── utils/            # Utilitaires compilés
│   ├── styles/           # CSS copiés
│   ├── assets/           # Assets copiés
│   └── manifest.json     # Manifest copié
```

## 🔧 Configuration de Build

### TypeScript (`tsconfig.json`)
- **Target** : ES2020 pour compatibilité Chrome moderne
- **Module** : ES2020 avec résolution Node
- **Strict mode** : Activé pour maximum de sécurité
- **Source maps** : Générées pour debugging
- **Path mapping** : Aliases pour imports simplifiés

### ESLint (`.eslintrc.js`)
- **TypeScript ESLint** : Rules spécifiques TypeScript
- **Prettier integration** : Formatage automatique
- **Code quality** : Rules pour code explicite et maintenable
- **JSDoc enforcement** : Documentation obligatoire

### Prettier (`.prettierrc`)
- **Consistent formatting** : Style uniforme
- **Multiple file types** : TS, JS, JSON, HTML, CSS, MD
- **Line length** : 80 chars pour lisibilité

## 🎯 Workflow de Développement

### 1. Développement Initial
```bash
# Clone et setup
git clone <repo>
cd anti-spoil-extension
npm install

# Démarre le mode développement
npm run dev
```

### 2. Test en Chrome
```bash
# Dans Chrome, aller à chrome://extensions/
# Activer "Mode développeur"
# Cliquer "Charger l'extension non empaquetée"
# Sélectionner le dossier /dist
```

### 3. Développement Itératif
- Modifier les fichiers `.ts` dans `/src`
- Le build watch recompile automatiquement
- Recharger l'extension dans Chrome (bouton ↻)
- Tester les modifications

### 4. Validation Qualité
```bash
# Avant commit
npm run type-check    # Vérification types
npm run lint         # Vérification code style
npm run test         # Tests unitaires
npm run format       # Formatage automatique
```

### 5. Build de Production
```bash
npm run build        # Build optimisé
npm run package      # Création du ZIP pour distribution
```

## 🚨 Points d'Attention

### Imports TypeScript
```typescript
// ✅ Utiliser les path mappings
import { IChannelData } from '@types';
import { YOUTUBE_SELECTORS } from '@utils/constants';

// ❌ Éviter les imports relatifs longs
import { IChannelData } from '../../../types';
```

### Documentation JSDoc
```typescript
/**
 * Floute une vidéo YouTube en fonction des paramètres
 * @param videoElement - Élément DOM de la vidéo
 * @param settings - Configuration de floutage
 * @returns true si la vidéo a été floutée avec succès
 */
export async function blurYouTubeVideo(
  videoElement: HTMLElement,
  settings: IBlurSettings
): Promise<boolean> {
  // Implémentation...
}
```

### Gestion d'Erreurs Typée
```typescript
// ✅ Types d'erreur explicites
type TOperationResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  errorCode: TErrorCode;
};
```

## 🧪 Tests et Debugging

### Source Maps
Les source maps permettent de debugger le TypeScript directement dans Chrome DevTools :
- Ouvrir Chrome DevTools
- Aller dans Sources
- Les fichiers `.ts` originaux sont visibles

### Hot Reload
Le mode watch recompile automatiquement, mais il faut recharger l'extension manuellement :
1. Modifier un fichier `.ts`
2. Attendre la recompilation (terminal)
3. Aller à `chrome://extensions/`
4. Cliquer sur ↻ à côté de l'extension

### Debug Console
```typescript
// Utiliser des logs typés pour debugging
console.log('[AntiSpoil:BlurManager]', 'Video blurred:', videoInfo);
```

## 📊 Métriques de Build

Le build vérifie automatiquement :
- **Type coverage** : 100% des éléments typés
- **ESLint compliance** : 0 erreur, warnings acceptables
- **Build size** : Extension < 1MB
- **Performance** : Compilation < 30 secondes

## 🔄 CI/CD (Futur)

Configuration prête pour GitHub Actions :
```yaml
# .github/workflows/ci.yml
- name: Install dependencies
  run: npm ci
- name: Type check
  run: npm run type-check
- name: Lint
  run: npm run lint
- name: Test
  run: npm run test
- name: Build
  run: npm run build
```
