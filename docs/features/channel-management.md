# Feature: Gestion des Chaînes YouTube

## 🎯 Objectif
Permettre aux utilisateurs d'ajouter, supprimer et gérer une liste de chaînes YouTube dont ils veulent éviter les spoils.

## 📋 Spécifications Fonctionnelles

### UC001 : Ajouter une Chaîne
**Acteur** : Utilisateur
**Prérequis** : Extension installée et activée
**Déclencheur** : Utilisateur souhaite ajouter une chaîne à la liste anti-spoil

**Flux principal** :
1. Utilisateur navigue sur une page de chaîne YouTube
2. Utilisateur clique sur l'icône de l'extension
3. Popup s'ouvre avec un bouton "Ajouter cette chaîne"
4. Utilisateur clique sur le bouton
5. Chaîne est ajoutée à la liste avec confirmation visuelle

**Flux alternatif - Ajout par URL** :
1. Utilisateur ouvre le popup de l'extension
2. Utilisateur colle l'URL d'une chaîne dans le champ prévu
3. Système valide l'URL et extrait les informations de la chaîne
4. Chaîne est ajoutée à la liste

**Règles métier** :
- ✅ Une chaîne ne peut être ajoutée qu'une seule fois
- ✅ Validation de l'URL YouTube obligatoire
- ✅ Extraction automatique du nom et de l'avatar de la chaîne
- ✅ Feedback utilisateur immédiat (succès/erreur)

### UC002 : Supprimer une Chaîne
**Acteur** : Utilisateur
**Prérequis** : Au moins une chaîne dans la liste

**Flux principal** :
1. Utilisateur ouvre le popup de l'extension
2. Liste des chaînes s'affiche
3. Utilisateur clique sur le bouton "×" d'une chaîne
4. Système demande confirmation
5. Chaîne est supprimée de la liste

**Règles métier** :
- ✅ Confirmation obligatoire avant suppression
- ✅ Suppression immédiate du floutage sur YouTube
- ✅ Action réversible via historique (optionnel)

### UC003 : Gérer la Liste des Chaînes
**Acteur** : Utilisateur

**Fonctionnalités** :
- ✅ Affichage de toutes les chaînes avec avatar et nom
- ✅ Recherche/filtrage dans la liste
- ✅ Activation/désactivation temporaire d'une chaîne
- ✅ Tri par nom ou date d'ajout
- ✅ Export de la liste (JSON)
- ✅ Import d'une liste existante

## 🔧 Spécifications Techniques

### Stockage des Données
```javascript
// Structure dans Chrome Storage
{
  channels: [
    {
      id: 'UC123456789',           // ID unique YouTube
      name: 'Nom de la Chaîne',    // Nom d'affichage
      avatarUrl: 'https://...',     // URL de l'avatar
      url: 'https://youtube.com/channel/UC123456789',
      addedDate: '2025-08-30T10:30:00Z',
      enabled: true,                // Actif/inactif
      lastSeen: '2025-08-30T15:45:00Z'  // Dernière détection
    }
  ]
}
```

### API Endpoints Internes
```javascript
// Background Script API
class ChannelManager {
  async addChannel(channelData) {}
  async removeChannel(channelId) {}
  async getChannels() {}
  async updateChannel(channelId, updates) {}
  async isChannelBlocked(channelId) {}
}
```

### Interface Utilisateur
```html
<!-- Popup Structure -->
<div class="popup-container">
  <header>
    <h2>Anti-Spoil Extension</h2>
    <div class="channel-count">3 chaînes bloquées</div>
  </header>
  
  <section class="add-channel">
    <input type="url" placeholder="URL de la chaîne ou nom" id="channel-input">
    <button id="add-btn">Ajouter</button>
  </section>
  
  <section class="channel-list">
    <div class="search-bar">
      <input type="text" placeholder="Rechercher..." id="search-input">
    </div>
    <div class="channels" id="channels-container">
      <!-- Chaînes générées dynamiquement -->
    </div>
  </section>
  
  <footer>
    <button id="export-btn">Exporter</button>
    <button id="import-btn">Importer</button>
    <a href="#" id="settings-link">Paramètres</a>
  </footer>
</div>
```

## 🎨 Design et UX

### États Visuels
- **Chaîne Active** : Icône œil barré, fond vert clair
- **Chaîne Désactivée** : Icône œil, fond gris, opacité réduite
- **Ajout en Cours** : Spinner + message "Ajout en cours..."
- **Erreur** : Bordure rouge + message d'erreur

### Responsive Design
- Popup : 320px × 500px (taille standard)
- Adaptation mobile pour futures versions web
- Accessibilité clavier complète

## 🧪 Cas de Tests

### Tests Fonctionnels
1. **Ajout chaîne valide** : URL → Extraction données → Ajout liste
2. **Ajout chaîne invalide** : URL incorrecte → Message d'erreur
3. **Ajout doublon** : Chaîne existante → Message "Déjà ajoutée"
4. **Suppression** : Clic × → Confirmation → Suppression
5. **Recherche** : Saisie → Filtrage temps réel
6. **Export/Import** : Export JSON → Import → Validation données

### Tests d'Intégration
1. **YouTube → Extension** : Page chaîne → Détection automatique
2. **Extension → YouTube** : Ajout chaîne → Floutage immédiat
3. **Persistance** : Redémarrage navigateur → Données conservées

## 📊 Métriques et Monitoring

### KPIs
- Temps d'ajout d'une chaîne (objectif < 5 secondes)
- Taux d'erreur lors de l'ajout (objectif < 2%)
- Nombre moyen de chaînes par utilisateur
- Fréquence d'utilisation de la recherche

### Logs d'Erreurs
```javascript
// Types d'erreurs à logger
- URL_INVALID: URL YouTube non valide
- CHANNEL_NOT_FOUND: Chaîne introuvable
- STORAGE_ERROR: Erreur de sauvegarde
- DUPLICATE_CHANNEL: Tentative d'ajout doublon
```

## 🚀 Évolutions Futures

### Phase 2
- ✅ Ajout par nom de chaîne (recherche)
- ✅ Catégorisation des chaînes (Gaming, Tech, etc.)
- ✅ Statistiques d'utilisation
- ✅ Synchronisation entre appareils

### Phase 3
- ✅ Partage de listes entre utilisateurs
- ✅ Listes pré-faites par communauté
- ✅ API publique pour développeurs tiers
