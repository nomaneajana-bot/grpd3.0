# Documentation Technique & DESIGN.md — Suite de 6 Écrans GRPD (iOS Native)

## 1. Principes Directeurs & Architecture Globale

Cette suite de 6 écrans s'inscrit en continuité stricte de la page d'accueil peaufinée GRPD. Elle respecte l'ADN d'une application native iPhone (**393 × 852pt**) développée pour **React Native / Expo** :
- **Ton & Langue :** Français naturel, tutoiement cohérent (« tu »).
- **Vocation non restrictive :** Les clubs et sorties ne sont pas restreints à la performance athlétique ; la conversation, la marche de quartier, le coucher de soleil et le lien social sont des cas d'usage de premier rang.
- **Indépendance Adhésion vs Inscription :** Être membre d'un club n'inscrit pas automatiquement aux sorties ; une sortie publique organisée par un club reste ouverte aux non-membres.
- **Honnêteté des données :** Aucun statut « vérifié » inventé, pas de météo factice, pas de faux compteurs d'allure imposée ou de rings d'activité non appuyés par des capteurs.

---

## 2. Tokens de Conception Système (CSS Variables & React Native)

### Palette Chromatique (`tokens.colors`)
```typescript
export const colors = {
  background: '#F9F9FA',         // Fond d'écran neutre chaud iOS
  surface: '#FFFFFF',            // Cartes et surfaces surélevées
  surfaceSubtle: '#F3F3F4',      // Fonds de champs et conteneurs secondaires
  surfaceMuted: '#EAEBEB',       // Pilules inactives
  border: '#E8E8E9',             // Séparateurs capillaires 1px
  borderSubtle: '#F0EFEF',
  text: {
    primary: '#181A1B',          // Texte principal et titres
    secondary: '#5A6067',        // Sous-titres et légendes
    tertiary: '#8E959E',         // Métadonnées et placeholders
    inverse: '#FFFFFF',          // Texte sur CTA vert
  },
  brand: {
    primary: '#167A47',          // Vert profond contrôlé signature
    primaryDark: '#0E5832',      // État pressé / actif
    primaryLight: '#EAF5EE',     // Badge d'inscription feutré
    primaryBorder: '#BFE3CE',
  },
  status: {
    pendingBg: '#FFF7E6',        // Badge jaune feutré demande en attente
    pendingText: '#9A6300',
    publicBg: '#EBF4FE',         // Badge bleu feutré visibilité publique
    publicText: '#185ABC',
    destructive: '#D9383A',      // Annulation / suppression
    destructiveBg: '#FDF2F2',
  }
};
```

### Typographie & Échelle de Texte (`tokens.typography`)
```typescript
export const typography = {
  largeTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, lineHeight: 38 },
  title2: { fontSize: 22, fontWeight: '700', letterSpacing: -0.3, lineHeight: 28 },
  headline: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2, lineHeight: 22 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 21 },
  subhead: { fontSize: 14, fontWeight: '500', lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  captionBold: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
};
```

### Espacements, Rayons & Safe Areas (`tokens.layout`)
```typescript
export const layout = {
  paddingHorizontal: 20,
  cardRadius: 16,
  buttonRadius: 14,
  pillRadius: 9999,
  inputRadius: 12,
  minTouchTarget: 44,
  tabBarHeight: 84,              // Inclut les 34pt de safe-area inférieure iPhone
  headerHeight: 44,
};
```

---

## 3. Matrice Complète des 6 Écrans du Parcours

| # | Écran | Type de Shell | Rôle dans le flux | Action principale (CTA) | Destination du CTA |
|---|---|---|---|---|---|
| **1** | **Détail de la sortie (Avant inscription)** | Subpage (`SHELL_47`) | Découverte du programme, lieu, club et participants | `Rejoindre la sortie` | Inscription immédiate & redirection vers *Mes sorties* |
| **2** | **Mes sorties** | Onglet Tab (`SHELL_44`) | Suivi des sorties confirmées, en attente et passées | Tap sur une carte / Annulation | Fiche détaillée ou modal de confirmation d'annulation |
| **3** | **Fiche Club (Les pas de Casa)** | Onglet Tab (`SHELL_45`) | Hub de la communauté : sorties, groupes et gestion | `+ Organiser une sortie` | Écran de création de sortie pré-rempli avec le club |
| **4** | **Créer un club** | Subpage (`SHELL_49`) | Formulaire épuré pour fonder un collectif local | `Créer le club` | Validation & redirection directe vers la nouvelle Fiche Club |
| **5** | **Organiser une sortie** | Subpage (`SHELL_48`) | Planification d'une sortie publique ou de club | `Publier la sortie` | Inset de confirmation & redirection |
| **6** | **Invitation & Adhésion Club** | Subpage (`SHELL_50`) | Acceptation de code ou lien d'invitation avec modération | `Envoyer ma demande` / `Approuver` | État d'attente ou approbation par l'administrateur |

---

## 4. Données Échantillons Unifiées (Sample Data)

Toutes les maquettes partagent rigoureusement le même jeu de données cohérent :
- **Club de référence :** *Les pas de Casa* (Marche & conversation, Casablanca, 48 membres, fondé par Mehdi Benjelloun).
- **Sortie de référence :** *Marche & conversation* (Samedi 1 juin, départ 18:30, RDV 18:15 à Anfa Park devant l'Esplanade, 4,5 km à allure libre, 14 inscrits, 6 places restantes).
- **Utilisatrice active :** Yasmine S. (Casablanca).
- **Candidat à l'adhésion :** Sarah Mansouri (demande d'adhésion au club Les pas de Casa).

---

## 5. Mapping des Composants React Native / Expo

| Composant HTML / CSS | Équivalent React Native (TypeScript) | Props & Spécifications |
|---|---|---|
| Conteneur global défilable | `<ScrollView contentContainerStyle={...} showsVerticalScrollIndicator={false}>` | `contentInsetAdjustmentBehavior="automatic"` |
| Barre d'onglets inférieure | `@react-navigation/bottom-tabs` (`<Tab.Navigator>`) | 4 destinations : `Accueil`, `MesSorties`, `Clubs`, `Profil` (hauteur 84pt) |
| Barre de navigation supérieure subpage | `<View style={styles.navBar}>` avec `<Pressable hitSlop={12}>` | Bouton retour/fermer avec `minHeight: 44, minWidth: 44` |
| Sélecteur de discipline (Pilules) | `<View style={styles.pillRow}>` avec `<Pressable accessibilityRole="radio">` | Transition de fond `#EAEBEB` vers `#167A47` |
| Carte d'information / de sortie | `<Pressable style={styles.card} android_ripple={{color: '#EEE'}}>` | `borderRadius: 16, backgroundColor: '#FFFFFF', padding: 16` |
| Bouton CTA fixe inférieur | `<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>` | Ancré au-dessus de la safe-area inférieure |
| Feuille d'annulation / modération | `@gorhom/bottom-sheet` ou `<Modal transparent animationType="slide">` | Fond semi-transparent sombre `#00000040` |
