# Sereno — Direction design

« Sereno » : ciel dégagé. L'app apporte de la clarté sur l'argent, sans anxiété.

> **Refonte en cours (juillet 2026).** Ce document décrit la direction corail
> retenue lors du chantier de refonte visuelle (voir
> `design_handoff_sereno_redesign/`). Elle remplace à la fois l'ancienne
> direction « strates de sédiment + Fraunces + corail sourd » documentée ici
> auparavant et la dérive bleu/Plus Jakarta Sans qui s'était installée dans
> `apps/app/src/styles.scss`. Les tokens (`apps/app/src/styles.scss`,
> `packages/brand/tokens.css`) sont à jour ; les écrans de l'app sont migrés
> progressivement, un chantier à la fois (voir le handoff pour l'ordre prévu).

## Principes

- **La carte a son propre aplat.** Le fond de page reste blanc pur en clair /
  noir pur en sombre (`--paper`), mais les cartes se distinguent par leur
  propre surface neutre (`--surface`, `#F7F6F3` en clair) plutôt que par un
  simple filet — ceci remplace le principe historique « un seul fond ».
- **Les montants sont les gros titres.** Chiffres en Sora (display), `tnum`
  (tabulaires) partout. Le solde hero est le moment fort de la marque : Sora
  800, ~46-54px, l'entier domine, décimales et devise réduites (45-65 %
  d'opacité).
- **Un accent unique : Rausch.** Dégradé (`--accent-gradient`,
  `linear-gradient(155deg, #FF4D6D 0%, #FF7A56 100%)` — rose-corail vers
  orange, celui du handoff) sur les grandes surfaces (carte solde, bannières,
  logo) ; à plat (`--accent`, `#FF385C`) sur les CTA et petits éléments.
  Jamais les deux traitements sur un même écran. L'ancien sweep magenta
  (#E61E4D → #D70466) a été retiré : arrêts trop proches en teinte, il
  paraissait uni.
- **Voix calme.** Tutoiement, jamais de culpabilisation. Le dépassement de
  budget est un fait énoncé posément, pas une faute — voir la gouvernance des
  couleurs sémantiques ci-dessous.

## Tokens

Palette de marque alignée sur le **produit Airbnb actuel** (pas le Rausch
2014 `#FF5A5F`, trop terne) : `#FF385C` Rausch, dégradé signature
`#FF4D6D → #FF7A56` (handoff), `#E00B41` pressed, `#00A699` Babu,
`#FC642D` Arches, `#484848` Hof, `#767676` Foggy.

| Token | Valeur (clair) | Usage |
|---|---|---|
| `--ink` | `#484848` | Texte principal (Hof) |
| `--ink-solid` | `#000000` | Boutons/remplissages « noirs » (avatar, CTA sombre, jour sélectionné, pilules actives) — vrai noir en clair, encre claire en sombre |
| `--ink-soft` | `#767676` | Texte secondaire (Foggy) |
| `--ink-faint` | `#9A9A9A` | Texte tertiaire, placeholders |
| `--paper` | `#FFFFFF` | Fond de page |
| `--surface` | `#F7F6F3` | Cartes — aplat distinct du fond de page |
| `--surface-2` | `#EFECE6` | Éléments imbriqués (ex. bouton de suppression sur une carte) |
| `--line` | `#E7E5DF` | Filets, séparateurs |
| `--accent` / `--accent-2` | `#FF385C` / `#FF7A56` | À-plat CTA (Rausch) / arrêt orange du dégradé |
| `--accent-gradient` | `linear-gradient(155deg, #FF4D6D, #FF7A56)` | Grandes surfaces (hero, bannières, logo) — rose-corail → orange |
| `--accent-deep` | `#E00B41` | Pressed/hover sur à-plat Rausch |
| `--accent-pale` | `#FFD1DA` | Fonds teintés génériques (chips, lignes actives) |
| `--mist` / `--mist-deep` | `#00A699` / `#008C82` | Revenus, montants positifs (Babu) |
| `--sand` | `#767676` | Neutre tertiaire (virements, budgets proches de la limite) |
| `--amber` / `--amber-pale` | `#FC642D` / `#FFF0E8` | **Objectif d'épargne** (Arches) |
| `--goal-badge` / `--goal-text` | `#FFE0D0` / `#A84A20` | Objectif d'épargne (badge icône / texte) |
| `--overrun-bg` / `--overrun-badge` / `--overrun-text` | `#FFF0F3` / `#FFD1DA` / `#B0123C` | **Dépassement de budget** |
| `--red` / `--red-pale` | `#FF385C` / `#FFF0F3` | Alertes système réelles uniquement (sync, erreurs) — jamais le dépassement |

Rayons : `--radius` 14px (boutons/champs), `--radius-lg` 20px (cartes),
`--radius-hero` 28px (carte hero — 26-36px), `--radius-pill` 999px (pilules),
`--radius-badge` 10px (badges d'icône, 9-11px).

Ombres : les cartes sont en aplat pur, **sans ombre par défaut**
(`--shadow: none`). L'ombre ne sert plus qu'à l'accent : `--shadow-cta`
(`0 8px 20px rgba(255,56,92,.3)`) sur les CTA, `--shadow-fab`
(`0 10px 24px rgba(255,56,92,.4)`) sur le bouton flottant d'ajout.

**Mode sombre** : dérivé du même mécanisme `--theme-t` (color-mix continu),
best-effort en l'absence de valeurs sombres dans le handoff — fond noir pur,
carte légèrement plus claire que le fond (`#17181D`), accent Rausch éclairci
pour rester lisible sur noir. **À valider visuellement** (contraste,
lisibilité) avant de considérer le dark mode définitif sur cette direction.

### Gouvernance des couleurs sémantiques (dépassement vs objectif)

- **Dépassement de budget → corail/rose** (`--overrun-*`). C'est un changement
  assumé par rapport à l'ancienne règle « toujours ambre, jamais rouge » :
  cette direction reprend le traitement du prototype de handoff tel quel. Le
  ton reste calme dans la *formulation* (voir Voix calme ci-dessus) même si la
  couleur est plus affirmée que l'ancien ambre.
- **Objectif d'épargne → ambre** (`--amber` / `--goal-*`). L'ambre change donc
  de rôle : il ne signale plus un dépassement, il célèbre une progression
  d'épargne.
- Les écrans qui lisaient encore `--amber` pour un dépassement (dashboard,
  budgets, statistiques — voir l'audit de migration) seront basculés vers
  `--overrun-*` au fur et à mesure de leur refonte, écran par écran ; ce n'est
  pas fait dans la passe tokens.
- `--red` / `--red-pale` restent réservés aux erreurs système réelles (échec
  de sync, etc.) — jamais pour un dépassement de budget ou un solde négatif.

## Typographie

- **Display / chiffres / titres** : **Sora** (600/700/800), `tnum` obligatoire
  pour tous les montants.
- **Texte courant** : **IBM Plex Sans** (400/500/600).
- Chargées en self-hosted via `@fontsource-variable/sora` et
  `@fontsource/ibm-plex-sans` (cohérent avec le reste du repo).

## Couleurs de catégories (données)

Palette reprise du handoff, désormais **appliquée aux catégories par défaut**
(`domain/data/default-categories.ts` + seed `supabase/schema.sql`, couleurs
synchronisées au lancement via `syncDefaultCategories()`) — l'ancienne palette
sourde vert-de-gris est retirée. **Pas encore revalidée par calcul** (bande de
luminosité OKLCH, plancher de chroma, séparation daltonisme, contraste ≥ 3:1)
contrairement à l'ancienne palette à 11 couleurs. À revalider avec le
validateur dataviz avant de la considérer définitive.

Dépenses : `#3B82F6` Logement · `#10B981` Courses · `#06B6D4` Transports ·
`#F97316` Restaurants · `#EC4899` Santé · `#8B5CF6` Loisirs ·
`#F59E0B` Abonnements · `#D946EF` Vêtements · `#6B7280` Autres (aussi le
fallback « sans catégorie » dans le code).

Revenus (même gamme, teintes distinctes) : `#0EA5E9` Salaire · `#6366F1`
Freelance · `#A855F7` Allocations · `#14B8A6` APL · `#22C55E` Prestations ·
`#84CC16` Pension · `#EAB308` Locatif · `#0891B2` Dividendes · `#059669`
Plus-values · `#7C3AED` Remboursements · `#64748B` Autres.

Pastilles d'icônes (`app-merchant-badge`) : fond `color-mix(couleur 22 %,
--paper)`, icône à pleine couleur — plus de mélange 14 % sur fond grège qui
délavait tout.

**Icônes de catégories** : `app-category-icon` affiche les **Fluent Emoji 3D**
de Microsoft (licence MIT, github.com/microsoft/fluentui-emoji), téléchargés
dans `apps/app/public/emoji3d/` sous le nom de l'icône (`home` →
`emoji3d/home.png`, PNG 256×256). Rendu volumique et coloré, choisi pour rendre
chaque catégorie reconnaissable d'un coup d'œil (maison pour Logement, caddie
pour Courses…). Les pictogrammes d'interface (navigation, actions) restent au
trait via `app-icon` — deux registres distincts et assumés : trait pour
l'outil, couleur pour le contenu. Pour ajouter une icône de catégorie :
télécharger le PNG 3D correspondant dans `emoji3d/` et l'ajouter à
`CATEGORY_EMOJI_NAMES` (`category-icon.component.ts`).

## Dataviz

- **Dashboard — Top catégories** : liste compacte (3 max, uniquement les
  catégories avec `spent > 0`) avec mini barres de progression colorées par
  catégorie. Remplace l'ancien camembert sur cet écran — décision UX du
  handoff : un donut avec légendes prenait trop de hauteur pour un écran
  d'accueil.
- **Statistiques — donut + légendes callout** : nouvelle visualisation
  signature de cet écran. Donut en `conic-gradient` (170px, trou central 98px
  avec le total dépensé au centre), une ligne fine + point coloré partant du
  bord vers une étiquette callout par catégorie (nom + %). Géométrie et calcul
  des coordonnées détaillés dans `design_handoff_sereno_redesign/Sereno
  App.dc.html` (fonction `renderVals`, section « Pie chart geometry »).
- **Strates** : `app-strata-chart` a été retiré (plus aucun écran ne l'utilise)
  — le donut est désormais la seule visualisation signature. `app-strata-ghost`
  (illustration décorative d'état vide, un composant distinct) est conservé.
- **Mode sombre** : les couleurs de données restent éclaircies uniformément
  via `--data-mix` (85 % couleur + 15 % blanc) pour rester ≥ 3:1 sur
  `--surface` — mécanisme inchangé, à revalider avec les nouvelles couleurs de
  catégories une fois celles-ci confirmées.

## Motion

Non retouché dans cette passe. L'ancienne scène (strates qui « se déposent »,
300ms ease-out, décalage 40ms par couche) ne s'applique qu'si les strates sont
conservées ; l'équivalent pour le donut (ex. tracé progressif de l'arc) reste
à définir lors de l'implémentation de la page Statistiques.
`prefers-reduced-motion` : aucun mouvement, apparition directe — principe
inchangé.
