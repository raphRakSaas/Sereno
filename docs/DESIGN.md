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
| `--paper` | `#ECE9DF` | Fond de page (grège chaud) |
| `--surface` | `#FBFAF6` | Cartes, feuilles |
| `--sage` | `#3F5548` | Action primaire, sélection |
| `--sage-pale` | `#DCE3DA` | Plan d'accueil, fonds doux |
| `--mist` | `#8FA9B8` | Revenus, information |
| `--sand` | `#C2B28F` | Accent chaud discret |
| `--amber` | `#A97C2F` | Dépassement de budget (visible, pas alarmant) |
| `--line` | `#D8D4C6` | Filets, séparateurs |

Rayon : 10px (cartes), 999px uniquement pour les puces de catégorie.

## Typographie

- **Display** : Fraunces (variable, optical size). Titres de pages, marque, états vides.
  Utilisée avec retenue.
- **Texte & chiffres** : IBM Plex Sans 400/500/600. Montants toujours en
  `font-feature-settings: "tnum"`.

## Couleurs de catégories (tons minéraux, désaturés)

`#5C7A6B` `#7C9885` `#5F7E93` `#8FA9B8` `#A89A77` `#C2B28F` `#7E7F6B` `#96837B`
`#6E6A8A` `#4E5D5A`

## Motion

Une seule scène orchestrée : les strates « se déposent » à l'arrivée du dashboard
(300 ms, ease-out, décalage 40 ms par couche). `prefers-reduced-motion` : aucun
mouvement, apparition directe.
