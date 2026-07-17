# Handoff: Sereno — Refonte visuelle (dashboard, onboarding, navigation, modales)

## Overview
Refonte du design de l'app Sereno (budget tracker perso) : nouvelle direction visuelle "sobre mais pas fade" (accent corail unique, montants dominants), nouvel onboarding en mode invité (sans compte), navigation par tab bar docked, modales d'action, et un écran de conversion vers un compte (paywall) déclenché par la limite du mode invité ou des fonctionnalités cloud/IA.

## About the Design Files
Le fichier **`Sereno App.dc.html`** est une **référence de design en HTML** — un prototype cliquable qui montre l'intention visuelle et les interactions, **pas du code à copier tel quel**. La tâche est de **recréer ce design dans l'environnement existant du repo Sereno** :
- Angular 18+ (standalone components, zoneless)
- NgRx Signal Store
- Dexie.js (mode invité) / Supabase (mode connecté), via les repositories "switching"
- Déploiement Cloudflare Pages

Le prototype encode toute la logique (navigation, state, données) en JS "à plat" dans une seule classe pour la démo — dans le vrai code, cette logique doit être répartie selon l'architecture en couches déjà en place (`presentation/` → composants, `application/stores/` → NgRx Signal Store, `domain/`, `infrastructure/`). Ne pas copier le HTML/CSS inline du prototype dans les templates Angular ; réécrire proprement en respectant les conventions du repo (SCSS séparé, `--custom-properties`, composants `app-*` existants).

## Fidelity
**Haute-fidélité (hifi)** pour la palette, la typographie, les espacements et les rayons de bordure — les valeurs ci-dessous (hex, px) sont à reprendre exactement. Les copies de texte (montants, libellés) sont des exemples de démonstration, pas du contenu final.

## Constat important sur l'existant (à corriger dans ce chantier)
Le repo a deux systèmes de design qui **divergent actuellement** :
- `docs/DESIGN.md` et `packages/brand/tokens.css` documentent une direction corail (#D14328) + Fraunces + une visualisation signature "strates de sédiment" (`app-strata-chart`).
- Le CSS réellement chargé (`apps/app/src/styles.scss`) utilise un accent bleu générique (#3a5cff) + Plus Jakarta Sans — c'est la dérive qui a motivé cette refonte.

Cette refonte **remplace les deux** par une troisième direction (corail plus vif `#FF4D6D`→`#FF7A56`, Sora + IBM Plex Sans, donut avec légendes). Il faudra mettre à jour `apps/app/src/styles.scss`, `packages/brand/tokens.css` et `docs/DESIGN.md` en cohérence, et décider si `app-strata-chart` (strates) est conservé, remplacé par le nouveau donut, ou les deux (strates sur le dashboard, donut sur la page Statistiques — c'est la répartition retenue dans le prototype).

## Design Tokens

**Couleurs**
- Encre principale : `#14151A`
- Encre secondaire : `#6B6E76`
- Encre discrète : `#9A9DA6`
- Fond de page : `#EDEBE4` (hors app, canvas de présentation) — dans l'app, fond blanc `#FFFFFF`
- Surface carte : `#F7F6F3`
- Ligne / bordure : `#E7E5DF`
- Accent unique (CTA + alertes de dépassement) : dégradé `linear-gradient(155deg, #FF4D6D 0%, #FF7A56 100%)` ; à plat `#FF4D6D`
- Revenu / positif : `#0E9F5C`
- Alerte dépassement (fond teinté) : `#FFEDEF` (icône badge `#FFD9DE`), texte `#B33A52`
- Objectif épargne (fond teinté) : `#FFF4E9` (badge `#FFE6C7`), texte `#8A6A38` / accent barre `#C6862F`
- Couleurs catégories (données, pas des accents UI) : `#3B82F6` (Logement), `#10B981` (Alimentation), `#8B5CF6` (Loisirs), `#F59E0B` (Abonnements), `#06B6D4` (Transport), `#EC4899` (Santé), `#6B7280` (Autre)

**Typographie**
- Display / chiffres / titres : **Sora** (600/700/800), tabulaire (`font-variant-numeric: tabular-nums`) pour tous les montants
- Texte courant : **IBM Plex Sans** (400/500/600)
- Le solde hero : Sora 800, ~46-54px selon écran, entier dominant / décimales+devise à 45-65% d'opacité

**Rayons**
- Cartes : 18-20px · Carte hero / conteneur mobile : 26-36px · Pills / boutons : 999px (pill) ou 12-16px · Badges d'icône : 9-11px

**Ombres**
- CTA corail : `0 8px 20px rgba(255,77,109,.3)`
- Conteneur mobile (device frame) : `0 24px 64px rgba(20,20,22,.18)`

**Logo**
- Monogramme "S" : carré arrondi (9-10px radius), fond `linear-gradient(155deg,#FF4D6D,#FF7A56)` (ou plein noir `#14151A` sur fond coral), lettre "S" Sora 800 blanche. Wordmark "Sereno" en Sora 800 à côté.

**Icônes**
- Set "3D" de Fluent Emoji (Microsoft, licence MIT) via `https://cdn.jsdelivr.net/gh/shuding/fluentui-emoji-unicode/assets/<emoji>_3d.png` — remplacer par un set d'icônes maison ou une lib d'icônes du projet si disponible ; sinon héberger ces PNG en local plutôt que de dépendre du CDN en prod.
- Illustrations Lottie : emplacements prévus (onboarding "bienvenue" et "prêt") mais **aucune URL n'a été codée en dur** — le développeur (ou le designer) doit fournir un fichier/lien Lottie réel et l'intégrer via `@lottiefiles/lottie-player` ou `lottie-web`.

## Screens / Views

### 1. Onboarding — 4 étapes (nouveau flux, remplace/complète `bienvenue.page`)
**Objectif** : arriver sur le dashboard avec le minimum d'info (revenu + dépenses principales), sans jamais forcer la création de compte.

1. **Accueil** (`onb-welcome`) : fond dégradé corail plein écran, logo + wordmark en haut, zone illustration (slot Lottie), titre "Vois clair dans ton argent.", sous-titre, CTA principal noir "Commencer sans compte", lien secondaire "J'ai déjà un compte" → écran Auth.
2. **Revenu** (`onb-income`) : header avec retour + barre de progression (3 points), question "Quel est ton revenu mensuel ?", affichage du montant en grand (Sora 800 48px) alimenté par un **clavier numérique custom** (grille 3×4), CTA "Continuer".
3. **Dépenses principales** (`onb-expenses`) — **important, UX revue** : rien n'est pré-rempli ni obligatoire. L'utilisateur **ajoute** les postes qu'il veut suivre via des puces "+ Catégorie" (roster complet des catégories), puis pour chaque poste ajouté un **champ numérique éditable à la main** (pas seulement des montants prédéfinis) + bouton de suppression (×). Lien "Passer cette étape" toujours visible sous le CTA "Continuer" pour rappeler que l'étape est facultative.
4. **Prêt** (`onb-ready`) : zone illustration (slot Lottie succès), récap "Revenu" / "Dépenses" calculés à partir des étapes précédentes, CTA "Aller à mon tableau de bord" → crée les transactions initiales et va au dashboard.

**Écran Auth** (`auth`, accessible depuis l'onboarding ou en conversion) : boutons "Continuer avec Google" / "Continuer avec Apple", séparateur "ou", champ e-mail, CTA corail "Continuer avec e-mail", lien "Continuer sans compte" toujours présent.

### 2. Dashboard (`dashboard`) — écran d'accueil, version retenue
Ordre vertical des blocs (padding horizontal 20px, gap ~16-20px entre blocs) :
1. Header : logo "S" + wordmark (petit, 24px), ligne "Bonsoir" + avatar rond (initiale, lien vers Réglages), sélecteur de mois `‹ Juillet 2026 ›`.
2. **Carte solde (hero)** : fond dégradé corail, coins 26px, label "Solde disponible" (uppercase, 11px), montant géant Sora 800 ~46px, ligne de tendance "+69 % ce mois-ci" en jaune pâle sur le dégradé.
3. **Carte Budget mensuel** : toute la carte est cliquable (→ page Budgets), fond `#F7F6F3`, montant dépensé/limite en en-tête, barre de progression noire, "% utilisé" en pied. **Pas de bouton "+ Ajouter" dans cette carte** — l'ajout se fait uniquement via le FAB (éviter la duplication d'action).
4. **Bannière alerte dépassement** : distincte visuellement de la carte budget — badge icône ⚠️ dans un carré arrondi coloré (`#FFD9DE`), fond `#FFEDEF`, texte du sous-titre en `#B33A52`, montant en accent corail à droite. Cliquable → Budgets.
5. **Top catégories** : liste compacte (3 max) avec mini barres de progression colorées par catégorie + lien "Voir les stats" → Statistiques. Remplace l'ancien camembert sur cet écran (le camembert complet est désormais sur la page Statistiques, voir plus bas) — décision UX : le donut avec légendes prenait trop de hauteur verticale pour un écran d'accueil.
6. **Carte Objectif épargne** : traitement dédié pour exister davantage — badge icône 🎯 sur fond ambre pâle `#FFF4E9`/`#FFE6C7`, barre de progression ambre `#C6862F`, montant courant / cible.
7. **Transactions récentes** (3 dernières) + lien "Tout voir" → page Transactions.
8. **FAB** (bouton rond flottant "+", coin bas-droit, fond corail, ombre) : seule et unique action d'ajout rapide de transaction visible sur cet écran. Si la limite du mode invité est atteinte, ouvre la modale de conversion (paywall) au lieu du formulaire.

### 3. Statistiques (`statistics`)
- Bloc "Revenus / Dépenses — 6 mois" : mini barres verticales (placeholder de données).
- **Bloc "Répartition par catégorie" — donut + légendes callout** (déplacé ici depuis le dashboard) :
  - Donut en `conic-gradient` (170px diamètre), trou central 98px avec le total dépensé au centre (label "Dépensé" + montant Sora 700).
  - Pour chaque catégorie : une ligne fine (`#D8D5CC`, 1.5px) part du bord du donut vers une étiquette callout positionnée en cercle autour (rayon ~115px), avec un point coloré à l'origine de la ligne. Étiquette = nom de la catégorie (ligne 1) + pourcentage (ligne 2, `#9A9DA6`).
  - Géométrie : cercle 300×300, centre (150,150), angle 0°= haut, sens horaire, angle proportionnel au % cumulé (comme un `conic-gradient` CSS standard). Le calcul des coordonnées (x,y = cx + r·sin(θ), cy − r·cos(θ)) et l'alignement du texte (gauche si sin(θ)≥0, droite sinon) sont détaillés dans `Sereno App.dc.html` (fonction `renderVals`, section "Pie chart geometry").

### 4. Transactions (`transactions`)
Puces de filtre "Tous / Dépenses / Revenus" (pill, actif = fond noir/texte blanc), liste de lignes (icône catégorie dans badge coloré clair, titre + catégorie·date, montant à droite en vert si revenu / noir si dépense).

### 5. Ajouter/modifier une transaction (`tx-edit`)
Segmented control Dépense/Revenu/Virement (actif = fond corail), montant géant Sora 800 alimenté par un clavier numérique custom, liste de lignes tappables : Catégorie (ouvre modale), Compte (ouvre modale), Marqueur couleur (ouvre modale), Joindre un reçu (ouvre modale avec option "Scanner automatiquement (IA)" → paywall IA si invité), champ note texte libre, CTA "Enregistrer" (pleine largeur, corail).

### 6. Virement entre comptes (`transfer-edit`)
Montant, sélection "Depuis" / "Vers" (cartes cliquables → modale compte dans la vraie implémentation), CTA "Confirmer le virement".

### 7. Budgets / Comptes / Catégories / Récurrences / Échéances / Modèles / Calendrier / Réglages / Menu "Plus"
Écrans secondaires en pile (header avec bouton retour + titre), voir le fichier prototype pour le détail de chaque liste. Points UX notables :
- **Comptes / Catégories / Récurrences** : le bouton "+" ouvre la **modale de conversion (paywall)**, raison `cloud` — ce sont de vraies fonctionnalités `cloudOnlyGuard` dans le repo (comptes multiples, catégories personnalisées, récurrences), donc ce comportement correspond à la vraie logique d'accès à reproduire avec les guards existants.
- **Calendrier** : grille 7 colonnes, jour sélectionné en fond noir, point corail sur les jours avec dépense, liste des transactions du jour sélectionné en dessous.
- **Réglages** : bannière "Mode invité" (dégradé corail) avec CTA "Créer un compte" → Auth, puis liste de réglages classiques.
- **Menu "Plus"** : liste d'accès aux écrans secondaires non présents dans la tab bar.

### 8. Navigation — Tab bar (docked, pas flottante)
Barre pleine largeur en bas, fond blanc, `border-top: 1px solid #E7E5DF`, padding bas incluant `env(safe-area-inset-bottom)`. 5 items à largeur égale (`flex:1`) : Accueil / Historique / Budgets / Stats / Plus. Item actif : icône pleine opacité + pastille de fond `#FFEDEF` + texte/icône en corail `#FF4D6D` ; inactif : icône à 55% d'opacité, texte gris `#9A9DA6`. Visible uniquement sur les 5 pages "racines" (masquée sur les écrans en pile avec bouton retour).

### 9. Modales (bottom sheet, coins arrondis en haut 24px)
Toutes partagent : overlay `rgba(20,20,22,.45)`, feuille blanche ancrée en bas, poignée grise centrée en haut (36×4px).
- **Sélecteur de catégorie** : grille 2 colonnes, icône dans badge de couleur pâle de la catégorie + nom.
- **Sélecteur de compte** : liste verticale, nom + solde.
- **Couleur de marqueur** : rangée de pastilles rondes (40px), anneau noir sur la sélection.
- **Pièce jointe / reçu** : zone de dépôt en pointillés (icône caméra), + bouton "Scanner automatiquement (IA)" qui déclenche le paywall IA en mode invité.
- **Confirmation de suppression** : titre + description + deux boutons (Annuler gris / Supprimer corail).
- **Partage / export** : 3 lignes d'options (CSV, PDF, lien).
- **Conversion de compte (paywall)** : icône + titre + texte contextuel selon la raison (`limit` = limite du mode invité atteinte, `cloud` = fonctionnalité liée à un compte, `ai` = scan IA), boutons Google/Apple/E-mail, lien "Plus tard" pour fermer sans forcer.

## Interactions & Behavior
- **Navigation** : pile de pages simple (`stack: string[]`) — `goTo(page)` empile, `goBack()` dépile, `setTab(page)` réinitialise la pile (comportement d'onglet). À recréer avec le routeur Angular existant (`app.routes.ts`) plutôt qu'un state client only.
- **Limite du mode invité** : compteur de transactions (`guestCount` / `guestLimit`, démo à 18/20). Au clic sur le FAB, si `guestCount >= guestLimit` → ouvre le paywall (raison `limit`) au lieu du formulaire. À remplacer par la vraie logique de comptage du repo si elle existe, ou à spécifier avec l'équipe produit.
- **Clavier numérique custom** : composant réutilisé pour le montant de transaction et le revenu de l'onboarding — touches 0-9, virgule, effacement (⌫).
- **Données dynamiques de l'onboarding → dashboard** : le revenu et les dépenses ajoutées pendant l'onboarding génèrent les transactions initiales et alimentent le solde, le "Top catégories" et le donut Statistiques (aucune catégorie à 0 € n'est affichée dans ces deux blocs — seules les catégories avec une dépense réelle apparaissent).
- **Répartition par catégorie** : uniquement les catégories avec `spent > 0` sont affichées dans le Top catégories (dashboard) et le donut (Statistiques) ; la page Catégories et les sélecteurs de catégorie affichent, eux, le roster complet.

## State Management (à répartir selon l'architecture du repo)
- `application/stores/` (NgRx Signal Store) : transactions, catégories, comptes, budgets — déjà en place (`transactions.store.ts`, `categories.store.ts`, `accounts.store.ts`, `budgets.store.ts`) ; ajouter l'état d'onboarding (étape courante, revenu saisi, dépenses ajoutées) probablement dans un nouveau store ou dans `user-preferences.service.ts`.
- État UI éphémère (modale ouverte, filtre actif, jour de calendrier sélectionné, montant en cours de saisie) : state local des composants standalone.
- Guards existants à réutiliser : `onboardingGuard`, `startScreenGuard`, `cloudOnlyGuard('...')`.

## Assets
- Aucune image bitmap propriétaire utilisée ; icônes = CDN Fluent Emoji 3D (à rapatrier en local pour la prod, licence MIT) ; illustrations Lottie = emplacements vides à remplir par le designer/produit.
- Polices : Sora et IBM Plex Sans, chargées via Google Fonts dans le prototype — à charger en self-hosted dans l'app (cohérent avec le repo qui utilise déjà `@fontsource-variable/...` pour les polices).

## Files
- `Sereno App.dc.html` — prototype cliquable complet (mobile) + panneau de référence bureau, toutes les pages et modales listées ci-dessus. Le calcul de géométrie du donut et toute la logique de navigation/state sont dans la balise `<script>` de ce fichier (classe `Component`).

## Fichiers du repo Sereno à modifier (repère rapide)
- `apps/app/src/styles.scss` — tokens globaux (couleurs, polices, rayons) à remplacer par les nouveaux.
- `packages/brand/tokens.css`, `docs/DESIGN.md` — à resynchroniser avec la nouvelle direction retenue.
- `apps/app/src/app/presentation/templates/dashboard/dashboard.page.html/.scss/.ts` — nouvelle disposition du dashboard.
- `apps/app/src/app/presentation/templates/onboarding/onboarding.page.*` (route `bienvenue`) — nouveau flux à 4 étapes.
- `apps/app/src/app/presentation/organisms/strata-chart/` — décider du sort de ce composant vs. le nouveau donut (probablement un nouveau composant `category-donut-chart` pour la page Statistiques).
- `apps/app/src/app/app.routes.ts` — si de nouvelles sous-routes d'onboarding sont nécessaires.
