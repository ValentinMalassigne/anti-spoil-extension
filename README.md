# 🙈 Anti-Spoil Extension

Extension Chrome qui protège contre les spoils YouTube en floutant automatiquement les miniatures et titres des chaînes que vous voulez éviter.

## 🎯 Fonctionnalités

- ✅ **Gestion de chaînes** : Ajoutez facilement des chaînes YouTube à votre liste anti-spoil
- ✅ **Floutage intelligent** : Détection automatique et floutage des vidéos des chaînes bloquées
- ✅ **Interface intuitive** : Popup simple pour gérer vos chaînes
- ✅ **Défloutage interactif** : Possibilité de dévoiler temporairement le contenu
- ✅ **Import/Export** : Sauvegardez et partagez vos listes de chaînes
- ✅ **Paramètres personnalisables** : Ajustez l'intensité du flou et les options d'affichage

## 🚀 Installation

### Prérequis
- **Node.js** 16+ et npm 8+ (pour le développement TypeScript)
- **Chrome** 88+ ou navigateur basé sur Chromium

### Installation en Mode Développeur

1. **Téléchargez et préparez le code**
   ```bash
   git clone https://github.com/ValentinMalassigne/anti-spoil-extension.git
   cd anti-spoil-extension
   
   # Installation des dépendances TypeScript
   npm install
   
   # Compilation du TypeScript vers JavaScript
   npm run build
   ```

2. **Ouvrez Chrome et accédez aux extensions**
   - Tapez `chrome://extensions/` dans la barre d'adresse
   - Ou allez dans Menu → Plus d'outils → Extensions

3. **Activez le mode développeur**
   - Activez l'interrupteur "Mode développeur" en haut à droite

4. **Chargez l'extension**
   - Cliquez sur "Charger l'extension non empaquetée"
   - Sélectionnez le dossier `dist` (pas le dossier racine !)

5. **Vérifiez l'installation**
   - L'icône 🙈 devrait apparaître dans la barre d'outils
   - L'extension est prête à être utilisée !

### Développement avec TypeScript

Pour le développement actif avec recompilation automatique :

```bash
# Mode développement avec watch
npm run dev

# Dans un autre terminal, rechargez l'extension après chaque modification
```

Consultez [BUILD.md](BUILD.md) pour plus de détails sur le développement TypeScript.

## 📖 Utilisation

### Ajouter une Chaîne

1. **Méthode Rapide** (sur une page de chaîne YouTube)
   - Cliquez sur l'icône de l'extension
   - Cliquez sur "Ajouter cette chaîne"

2. **Méthode Manuelle**
   - Cliquez sur l'icône de l'extension
   - Collez l'URL de la chaîne dans le champ
   - Cliquez sur "+"

### Gérer vos Chaînes

- **Voir la liste** : Ouvrez le popup pour voir toutes vos chaînes bloquées
- **Supprimer** : Cliquez sur "×" à côté d'une chaîne
- **Activer/Désactiver** : Cliquez sur l'icône œil pour toggle temporairement
- **Rechercher** : Utilisez l'icône 🔍 pour rechercher dans votre liste

### Paramètres

- **Intensité du flou** : Ajustez le niveau de floutage (1-20)
- **Défloutage au survol** : Active/désactive le défloutage temporaire
- **Éléments à flouter** : Choisissez quoi flouter (miniatures, titres, etc.)

## 🛠️ Développement

### Structure du Projet

```
anti-spoil-extension/
├── 📋 manifest.json              # Configuration Chrome Extension
├── � tsconfig.json              # Configuration TypeScript
├── 📋 package.json               # Dépendances et scripts npm
├── �📁 src/                       # Sources TypeScript
│   ├── 📁 background/           # Service Worker (.ts)
│   ├── 📁 content-scripts/      # Scripts YouTube (.ts)
│   ├── 📁 popup/               # Interface utilisateur (.ts + .html + .css)
│   ├── 📁 storage/             # Gestion données (.ts)
│   ├── 📁 utils/               # Utilitaires (.ts)
│   ├── 📁 types/               # Types TypeScript
│   └── 📁 styles/              # CSS
├── 📁 dist/                     # Fichiers compilés pour Chrome
├── 📁 docs/                    # Documentation
├── 📁 assets/                  # Icônes et ressources
├── 📝 README.md
└── 📝 BUILD.md                 # Instructions de build TypeScript
```

### Architecture IA-Friendly

Ce projet est conçu pour être développé collaborativement avec l'IA :

- **TypeScript strict** : Types explicites pour une meilleure compréhension IA
- **Documentation complète** : JSDoc sur toutes les fonctions publiques
- **Structure modulaire** : Code organisé en modules spécialisés avec types
- **Contexte centralisé** : Fichiers de contexte pour guider l'IA
- **Standards clairs** : Conventions de code et patterns établis
- **Code auto-documenté** : Noms explicites et interfaces détaillées

### Fichiers de Contexte Clés

- `PROJECT_CONTEXT.md` - Vision globale et objectifs
- `ARCHITECTURE.md` - Structure technique détaillée
- `docs/features/` - Spécifications par fonctionnalité
- `DEVELOPMENT_LOG.md` - Journal des développements
- `.copilot/instructions.md` - Directives pour l'IA
- `BUILD.md` - Instructions TypeScript et build
- `src/types/index.ts` - Types centralisés pour tout le projet

## 🧪 Tests

### Test Manuel

1. **Installation** : Chargez l'extension en mode développeur
2. **Ajout de chaîne** : Testez l'ajout via popup et page chaîne
3. **Floutage** : Vérifiez que les vidéos sont bien floutées
4. **Défloutage** : Testez le hover et les interactions
5. **Gestion** : Testez suppression, recherche, paramètres

### Pages YouTube à Tester

- Page d'accueil (feed principal)
- Résultats de recherche
- Pages de chaînes
- Playlists
- Page de lecture (suggestions)

## 🐛 Dépannage

### L'extension ne se charge pas
- Vérifiez que le mode développeur est activé
- Rechargez l'extension depuis `chrome://extensions/`
- Consultez la console pour les erreurs

### Le floutage ne fonctionne pas
- Vérifiez que des chaînes sont dans votre liste
- Actualisez la page YouTube
- Vérifiez les permissions de l'extension

### Problèmes de performance
- Réduisez le nombre de chaînes bloquées (max recommandé : 100)
- Ajustez les paramètres de performance
- Désactivez temporairement l'extension

## 📝 Contribuer

### Workflow de Développement

1. **Fork** le repository
2. **Créez une branche** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Documentez** : Mettez à jour la documentation appropriée
4. **Testez** : Vérifiez que tout fonctionne
5. **Commitez** : `git commit -m "[FEATURE-nom] Description"`
6. **Pull Request** : Soumettez vos modifications

### Conventions

- **Commits** : `[TYPE-area] Description`
  - Types : FEATURE, BUG, REFACTOR, DOCS
  - Exemples : `[FEATURE-blur] Add hover detection`, `[BUG-popup] Fix channel list scroll`

- **Code** : Suivez les conventions établies dans `.copilot/instructions.md`

## 🔒 Permissions

L'extension requiert les permissions suivantes :

- **storage** : Sauvegarde de votre liste de chaînes
- **activeTab** : Détection de la page YouTube courante
- **scripting** : Injection du système de floutage
- **host_permissions** : Accès aux pages YouTube uniquement

## 📊 Roadmap

### Version 1.0 (MVP)
- [x] Structure de base et documentation
- [ ] Gestion des chaînes (ajout/suppression)
- [ ] Système de floutage YouTube
- [ ] Interface popup fonctionnelle
- [ ] Import/Export basique

### Version 1.1
- [ ] Paramètres avancés
- [ ] Statistiques d'utilisation
- [ ] Recherche et filtres
- [ ] Améliorations UX

### Version 1.2
- [ ] Gestion par mots-clés
- [ ] Thèmes d'interface
- [ ] Synchronisation cloud
- [ ] API publique

## 📞 Support

- **Issues** : [GitHub Issues](https://github.com/ValentinMalassigne/anti-spoil-extension/issues)
- **Discussions** : [GitHub Discussions](https://github.com/ValentinMalassigne/anti-spoil-extension/discussions)
- **Email** : valentin.malassigne@example.com

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour les détails.

---

**Note** : Cette extension est développée principalement par et avec l'IA GitHub Copilot, dans le cadre d'un projet expérimental de développement collaboratif homme-machine.
