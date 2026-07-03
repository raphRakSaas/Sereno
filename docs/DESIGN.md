# Sereno — Direction design

« Sereno » : ciel dégagé. L'app apporte de la clarté sur l'argent, sans anxiété.

## Principes

- **Aplats nets, zéro dégradé, zéro ombre portée.** Les surfaces se distinguent par
  des plans de couleur et des filets 1px (`--line`), pas par du flou ni de la profondeur.
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
| `--paper` | `#E4E0D0` | Fond de page (grège chaud, un cran plus profond que les cartes) |
| `--surface` | `#FBFAF6` | Cartes, feuilles |
| `--sage` | `#3F5548` | Action primaire, sélection |
| `--sage-pale` | `#DCE3DA` | Plan d'accueil, fonds doux |
| `--mist` | `#8FA9B8` | Revenus, information |
| `--sand` | `#C2B28F` | Accent chaud discret |
| `--amber` | `#A97C2F` | Dépassement de budget (visible, pas alarmant) |
| `--clay` | `#B4603A` | Accent chaud signature (terracotta) — voir gouvernance |
| `--clay-soft` | `#F3E4DB` | Halo / pastille pâle de l'accent signature |
| `--line` | `#CFC9B8` | Filets, séparateurs |

Rayon : 10px (cartes), 999px uniquement pour les puces de catégorie.

**Mode sombre** : encre verte très sombre (`--paper #0C100D`, `--surface
#171B18`), jamais un noir neutre — Sereno garde sa chaleur la nuit (`--clay
#CD8258`). Tous les couples texte/fond sont validés ≥ 4.5:1 (AA), y compris
`--ink-faint`.

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

## Motion

Une seule scène orchestrée : les strates « se déposent » à l'arrivée du dashboard
(300 ms, ease-out, décalage 40 ms par couche). `prefers-reduced-motion` : aucun
mouvement, apparition directe.
