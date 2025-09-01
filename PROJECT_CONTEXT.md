# Anti-Spoil Extension - Contexte du Projet

## 🎯 Vision et Objectif

**Mission** : Créer une extension Chrome qui protège les utilisateurs des spoils YouTube en floutant les contenus des chaînes qu'ils souhaitent éviter.

**Problème résolu** : Les utilisateurs veulent suivre certaines chaînes mais éviter les spoils dans les titres et miniatures des nouvelles vidéos.

## 🎮 Fonctionnalités Principales

### 1. Gestion des Chaînes
- ✅ Ajouter des chaînes YouTube à une liste de "spoil"
- ✅ Supprimer des chaînes de la liste
- ✅ Voir la liste des chaînes enregistrées
- ✅ Import/Export de listes

### 2. Détection et Floutage
- ✅ Détection automatique des vidéos des chaînes en liste
- ✅ Floutage des miniatures
- ✅ Floutage des titres
- ✅ Option de défloutage temporaire au hover/clic

### 3. Interface Utilisateur
- ✅ Popup d'extension pour gestion des chaînes
- ✅ Bouton d'ajout rapide sur les pages de chaînes
- ✅ Indicateurs visuels sur les vidéos floutées
- ✅ Paramètres de personnalisation

## 🏗️ Architecture Technique

### Technologies
- **Chrome Extension Manifest V3**
- **JavaScript ES6+** (modules)
- **HTML5/CSS3** pour l'interface
- **Chrome APIs** : storage, tabs, scripting

### Composants Principaux
1. **Background Script** : Gestion globale et messaging
2. **Content Script** : Injection et manipulation DOM YouTube
3. **Popup Interface** : Gestion utilisateur des chaînes
4. **Storage Manager** : Persistance des données

## 🎨 Expérience Utilisateur

### Workflow Principal
1. Utilisateur installe l'extension
2. Visite une chaîne YouTube qu'il veut éviter
3. Clique sur l'extension et ajoute la chaîne
4. Les futures vidéos de cette chaîne sont automatiquement floutées
5. Option de défloutage ponctuel si souhaité

### Principes UX
- **Non-intrusif** : Ne perturbe pas l'expérience YouTube normale
- **Discret** : Floutage subtil mais efficace
- **Flexible** : Options de personnalisation
- **Rapide** : Ajout/suppression de chaînes en un clic

## 🔧 Contraintes Techniques

### Performances
- Détection légère et rapide
- Pas de surcharge de YouTube
- Floutage CSS optimisé

### Compatibilité
- YouTube (toutes pages : accueil, recherche, chaînes, etc.)
- Chrome/Chromium navigateurs
- Responsive design pour différentes tailles

### Sécurité
- Permissions minimales nécessaires
- Pas de collecte de données utilisateur
- Storage local uniquement

## 🚀 Développement Dirigé par IA

### Principes
- Documentation extensive pour contexte IA
- Structure modulaire pour compréhension facile
- Tests et validation systématiques
- Journalisation des décisions

### Fichiers de Référence
- Ce fichier pour contexte global
- `ARCHITECTURE.md` pour détails techniques
- `docs/features/` pour spécifications détaillées
- `DEVELOPMENT_LOG.md` pour historique

## 📊 Métriques de Succès
- ✅ Installation facile (< 30 secondes)
- ✅ Ajout de chaîne (< 5 secondes)
- ✅ Floutage instantané (< 100ms)
- ✅ Pas d'impact performance YouTube
- ✅ Interface intuitive (pas de formation nécessaire)
