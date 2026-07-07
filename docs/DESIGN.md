# Sereno — Direction design

« Sereno » : ciel dégagé. L'app apporte de la clarté sur l'argent, sans anxiété.

## Principes

- **Un seul fond, blanc pur en clair / noir pur en sombre.** Les cartes se
  distinguent uniquement par un filet 1px (`--line`), jamais par un second
  plan de fond ni une ombre.
- **Les montants sont les gros titres.** Chiffres en IBM Plex Sans, `tnum` (tabulaires),
  gros corps, graisse 600. Le signe € et les décimales sont réduits pour laisser
  l'entier dominer.
- **Un seul élément signature : les strates.** La répartition des dépenses est un
  empilement de couches de sédiment (SVG custom) — la plus grosse dépense forme le
  socle. Épaisseur = part du total. Tout le reste de l'UI reste discipliné.
- **Voix calme.** Tutoiement, jamais de culpabilisation ni d'alarme rouge. Le
  dépassement de budget est un fait énoncé posément, pas une faute.

## Tokens

| Token | Valeur | Usage |
|---|---|---|
| `--ink` | `#1F2A24` | Texte principal (épicéa sombre) |
| `--ink-soft` | `#5A665E` | Texte secondaire |
| `--paper` | `#FFFFFF` | Fond de page — identique à `--surface`, un seul fond |
| `--surface` | `#FFFFFF` | Cartes, feuilles |
| `--sage` | `#D14328` | Action primaire, sélection (corail vif) |
| `--sage-pale` | `#F7DDD3` | Plan d'accueil, fonds doux |
| `--mist` | `#8FA9B8` | Revenus, information |
| `--sand` | `#C2B28F` | Accent chaud discret |
| `--amber` | `#A97C2F` | Dépassement de budget (visible, pas alarmant) |
| `--clay` | `#B4603A` | Accent chaud signature (terracotta) — voir gouvernance |
| `--clay-soft` | `#F3E4DB` | Halo / pastille pâle de l'accent signature |
| `--line` | `#CFC9B8` | Filets, séparateurs |

Rayon : 10px (cartes), 999px uniquement pour les puces de catégorie.

**Mode sombre** : `--paper`/`--surface` sont noir pur (`#000000`), même
principe de fond unique qu'en clair. `--sage` s'éclaircit en corail vif
(`#FF7A5C`) pour rester lisible sur le noir. Tous les couples texte/fond sont
validés ≥ 4.5:1 (AA), y compris `--ink-faint`.

### Gouvernance de l'accent chaud (`--clay`)

- **Un seul emploi fort par écran, jamais deux.** C'est ce qui fait qu'il
  attire sans crier. Exemples en place : barre fine sous le solde hero
  (dashboard), fond teinté du bloc montant selon le type (formulaire).
- **Jamais en aplat plein écran, jamais pour du texte courant.**
- Exception unique : la **pastille de l'onglet actif** (nav basse et side-nav)
  est le repère permanent « où je suis » — discrète, elle ne compte pas comme
  l'accent de l'écran.
- Le dépassement de budget reste `--amber`, les revenus restent `--mist` :
  `--clay` est un accent de marque, pas une couleur sémantique.

## Typographie

- **Display** : Fraunces (variable, optical size). Titres de pages, marque, états
  vides — et **l'entier du solde hero** (le moment fort où la voix de la marque
  doit respirer). Utilisée avec retenue partout ailleurs.
- **Texte & chiffres** : IBM Plex Sans 400/500/600. Montants en colonnes et en
  listes toujours en `font-feature-settings: "tnum"`.

## Couleurs de catégories (données)

Palette **validée par calcul** (validateur dataviz : bande de luminosité, plancher
de chroma OKLCH ≥ 0.10, séparation daltonisme toutes-paires ≥ 8 ΔE avec labels
directs obligatoires, contraste ≥ 3:1 sur `--surface`) :

`#1E6D9C` `#3694BC` `#196E44` `#018472` `#7D8F3A` `#A07417` `#6D9755` `#7B6CBF`
`#8D4826` `#A85769` `#945818`

Un cran plus affirmées que les accents UI — c'est voulu : les strates sont
l'élément signature, le reste de l'interface reste sourd autour.

**Étiquettes de couleur** (marqueurs de transaction) : 6 couleurs (une par
famille de teinte, sous-ensemble de la palette ci-dessus) rendues en **anneaux
creux** — la forme les distingue des pastilles pleines de catégories, pour
éviter toute confusion sémantique.

## Dataviz (page Statistiques)

- **La couleur suit l'entité** : les parts des donuts reprennent la couleur de
  la catégorie, jamais une teinte générée. Au-delà de 7 catégories, la traîne
  est repliée dans « Autres » (gris neutre).
- **Séquentiel = une teinte** : le calendrier de chaleur des dépenses utilise
  `--sage` (corail) du clair au foncé (4 pas), jamais d'arc-en-ciel.
- **Courbes** : ligne 2 px + aplat de la même teinte à 10 %, point de fin
  cerclé de surface, infobulle au survol — jamais un chiffre sur chaque point.
- **Mode sombre** : les couleurs de données sont éclaircies uniformément via
  `--data-mix` (85 % couleur + 15 % blanc) pour rester ≥ 3:1 sur `--surface`
  — le validateur de palette échouait sur `#196E44` et `#8D4826` en sombre.

## Motion

Une seule scène orchestrée : les strates « se déposent » à l'arrivée du dashboard
(300 ms, ease-out, décalage 40 ms par couche). `prefers-reduced-motion` : aucun
mouvement, apparition directe.
