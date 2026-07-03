# Sereno — Audit UI/UX & plan d'action

> Audit mené en posture de **directeur artistique / designer produit senior**.
> Objectif : garder l'ADN « calme, clair, sans alarme » de Sereno tout en lui
> donnant **une âme, une identité et une expérience qui donne envie de rester**
> — et corriger d'abord les ruptures **mobile** visibles sur les captures.
>
> Principe directeur de tout le document : **on n'ajoute pas de la couleur
> partout. On ajoute de l'intention.** La différence entre « fade » et
> « épuré premium » ne tient pas au nombre de couleurs, mais à la hiérarchie,
> au rythme, aux détails et aux micro-moments.

---

## 0. Résumé en une page (pour aller vite)

**Le retour utilisateur (« trop simplard, rien n'attire, pas d'âme, trop
sérieux ») est juste — mais le diagnostic populaire est faux.** Le problème
n'est pas « manque de couleur ». Le problème est :

1. **Aucun point focal chaud.** Tout l'écran est dans la même famille
   grège/sauge, à la même intensité. L'œil n'a nulle part où se poser, donc
   tout paraît « éteint ». Il manque **1 à 2 accents chauds réservés aux
   moments clés** (pas partout).
2. **La signature (les strates) n'apparaît jamais tant qu'il n'y a pas de
   données.** Un nouvel utilisateur voit un dashboard 100 % gris et un
   formulaire administratif. **L'élément qui fait le charme de l'app est
   invisible au moment exact où il faut convaincre.**
3. **Le mobile a de vrais bugs de mise en page** (segment « Statut » cassé,
   en-tête du formulaire qui disparaît, palette de marqueurs en arc-en-ciel qui
   crie plus fort que le contenu principal, grille d'actions avec un orphelin,
   bandeau PWA qui colle la barre de navigation). Ce sont des **régressions P0**,
   pas des goûts.
4. **Le formulaire d'ajout est un mur de champs.** Or c'est le geste le plus
   fréquent de l'app. Il doit être le plus soigné, pas le plus austère.

**Ordre de bataille :** P0 mobile (bugs) → P1 système d'accent + états vides
vivants → P2 raffinement du parcours de saisie → P3 micro-détails & motion.

---

## 1. Diagnostic global — pourquoi ça paraît « sans âme »

Le design system (`docs/DESIGN.md`, `src/styles.scss`) est **cohérent et de bon
goût** : palette minérale, Fraunces + IBM Plex, aplats nets, chiffres
tabulaires. Ce n'est pas un mauvais design. C'est un design **sous-exploité**.

Trois causes techniques précises au ressenti « fade » :

### 1.1 Contraste tonal trop faible → l'écran « s'aplatit »
`--paper #ECE9DF`, `--surface #FBFAF6`, `--sage-pale #DCE3DA` sont tous des
tons clairs très proches en luminosité. Sur mobile, en lumière du jour, les
cartes se distinguent à peine du fond (le filet `--line` 1px ne suffit pas).
Résultat : pas de relief, tout « flotte ».

> On s'interdit les ombres portées (bon principe). Mais « pas d'ombre » ne veut
> pas dire « pas de séparation ». La solution est un **contraste de surface plus
> franc** (fond un cran plus profond, cartes plus claires) — pas du flou.

### 1.2 Zéro couleur chaude visible au repos
La palette de catégories (superbe, validée OKLCH) n'apparaît **que dans les
strates et les puces**. Tant qu'on n'a pas saisi de dépense, l'utilisateur ne
voit **aucune** de ces couleurs. Le vert sauge est une couleur d'action, pas
une couleur d'émotion : seul, il fait « sérieux / institutionnel / banque »,
exactement le reproche reçu.

### 1.3 Une seule graisse d'émotion : la typo Fraunces est trop discrète
Fraunces (le caractère « à âme » du duo) n'est utilisée que pour des titres de
20-26px assez sobres. La personnalité éditoriale du produit est là mais
murmurée. Sur les moments forts (solde, état vide, écran de bienvenue), elle
devrait **respirer plus grand** et porter la voix de la marque.

---

## 2. Le problème racine : pas de système d'accent, pas de hiérarchie émotionnelle

Aujourd'hui l'app a **une** couleur d'action (sauge) et **une** couleur
d'alerte douce (ambre). C'est trop pauvre pour créer des points focaux.

**Proposition : un système à 3 niveaux d'intensité, appliqué avec parcimonie.**

| Niveau | Rôle | Où (et SEULEMENT là) |
|---|---|---|
| **Calme** (actuel) | 95 % de l'UI | fonds, texte, cartes, filets |
| **Signature** | l'accent chaud de la marque | 1 moment par écran : solde hero, CTA principal, jour « aujourd'hui », halo de l'onglet actif |
| **Sémantique** | information | revenu (mist/bleu), dépense (encre), dépassement (ambre) |

Concrètement il manque **un accent chaud terracotta/argile** (cohérent avec la
palette catégories `#8D4826` / `#945818`) à doser **au compte-gouttes** :

```
--clay:      #B4603A;   /* accent chaud signature — usage rare, jamais en aplat plein écran */
--clay-soft: #F3E4DB;   /* fond très pâle pour un halo / une pastille */
```

Règle d'or : **l'accent chaud n'apparaît jamais deux fois sur le même écran.**
C'est ce qui fait qu'il « attire » sans « crier ». C'est la réponse directe à
« pas de couleur partout, mais il faut que quelque chose attire ».

---

## 3. Anomalies mobile — les bugs des captures (Priorité P0)

Ces points ne sont pas esthétiques : ce sont des défauts de mise en page qui
donnent l'impression d'une app « cassée ». À traiter en premier.

| # | Problème | Gravité | Effort | Fichier |
|---|---|---|---|---|
| B1 | Segment « Statut » cassé (3 boutons dans une grille 2 colonnes) | **Bloquant** | XS | `transaction-edit.page.scss` `.seg` |
| B2 | En-tête + montant du formulaire hors écran à l'arrivée | **Élevé** | S | `transaction-edit.page.*` |
| B3 | Palette de marqueurs en arc-en-ciel, trop dominante | **Élevé** | S | `marker-color-picker.component.ts` + form |
| B4 | Grille d'actions rapides : 7 items sur 3 colonnes → orphelin | Moyen | XS | `dashboard.page.scss` `.quick-actions` |
| B5 | Bandeau PWA collé à la barre de nav basse | Moyen | XS | `app.scss` / `pwa-banner` |
| B6 | Carte « rythme » : « CETTE SEMAINE » passe sur 2 lignes, montants désalignés | Faible | XS | `dashboard.page.scss` `.rhythm` |
| B7 | Cible tactile du bouton fermer/supprimer un peu juste (40px) | Faible | XS | `transaction-edit.page.scss` |

### B1 — Le segment « Statut » est visuellement cassé (capture 1 & 3)
`.seg` est figé en `grid-template-columns: 1fr 1fr`. Le type Dépense/Revenu a
2 boutons → OK. Mais **Statut a 3 boutons** (Brouillon / Validée / Annulée) :
le 3ᵉ retombe sur une 2ᵉ ligne, la sélection « Validée » déborde et l'ensemble
paraît défectueux.

```30:87:src/app/presentation/templates/transaction-edit/transaction-edit.page.scss
.seg {
  display: grid;
  grid-template-columns: 1fr 1fr;   /* ← faux pour 3 options */
  ...
}
```

**Solution** : rendre le segment agnostique au nombre d'items
(`grid-auto-flow: column; grid-auto-columns: 1fr`) **ou** créer une variante
`.seg--3`. Ajouter des filets verticaux entre segments et un rayon interne
propre sur l'option active pour un rendu « pilule » net.

> Détail senior : sur un contrôle à 3 états dont l'un est « Annulée »
> (destructif/neutre), envisager de sortir « Annulée » du segment et d'en faire
> une action secondaire — un segment sert à choisir *un mode par défaut*, pas à
> mélanger un état d'exception.

### B2 — L'en-tête et le champ montant disparaissent (captures 1 & 2)
Sur les deux captures du formulaire, on ne voit **ni** le bouton fermer, **ni**
le titre « Ajouter », **ni** le sélecteur Dépense/Revenu : juste un « 0 € »
fantôme en haut, puis directement la notice et les catégories. Le **geste
principal (saisir un montant) n'est pas visible au chargement**.

Causes probables cumulées :
- le focus auto sur `#amount` fait remonter le clavier et *scrolle* la page,
  poussant l'en-tête hors champ ;
- le champ montant est `text-align:right; width:60%` centré — sur mobile ça
  donne un chiffre perdu au milieu, sans ancrage visuel ni symbole € lisible.

**Solutions** :
1. **En-tête sticky léger** (fermer + titre + supprimer) qui reste en haut au
   scroll, pour ne jamais « perdre » l'utilisateur.
2. **Bloc montant traité comme un hero** : centré, très grand (déjà 52px), avec
   le type Dépense/Revenu **juste au-dessus et collé** au montant (ils forment
   une unité : « je saisis une *dépense* de *X* € »). Fond légèrement teinté
   selon le type (voir §4) pour donner immédiatement du sens et de la couleur.
3. Vérifier le comportement de `scrollIntoView` / autofocus pour que l'en-tête
   reste visible (ancrer le scroll en haut, pas sur l'input).

### B3 — La palette de marqueurs vole la vedette (capture 1)
Dans le formulaire, `app-marker-color-picker` affiche **12 pastilles de 32px en
arc-en-ciel** + « Aucune », **toujours dépliées**, pour un champ pourtant
étiqueté « facultatif ». C'est l'élément le plus coloré et le plus bruyant de
tout l'écran — en contradiction frontale avec l'ADN « calme » **et** avec la
hiérarchie (un champ optionnel ne doit jamais dominer).

**Solution** :
- Replier le marqueur derrière le lien « Date et note » (extras), il n'a rien à
  faire dans le flux principal de saisie rapide.
- Le réduire : pastilles plus petites (24px), sur **une seule ligne
  scrollable**, et **retirer les couleurs qui doublonnent** avec les couleurs de
  catégories (sinon confusion sémantique : le marqueur imite une catégorie).
- Renommer en clair : « Étiquette de couleur » et une phrase d'intention
  (« pour repérer d'un coup d'œil, ex. remboursable »).

### B4 — Grille d'actions rapides : l'orphelin (capture 3)
`.quick-actions` est `repeat(3, 1fr)` avec **7 actions** → 3 + 3 + 1 :
« Activité » se retrouve seule sur sa ligne, à gauche, ce qui déséquilibre le
bloc.

**Solutions** (au choix) :
- Réduire à **6 actions** dans la grille (déplacer « Activité » : elle est déjà
  dans la barre de nav basse — doublon) → grille 3×2 parfaite.
- Ou passer à **4 colonnes / 2 lignes** (8 emplacements) et hiérarchiser :
  Dépense/Revenu en primaire, le reste en secondaire.
- Détail : différencier visuellement Dépense/Revenu (les 2 gestes à 90 %
  d'usage) des raccourcis de navigation, au lieu de 7 boutons identiques.

### B5 — Le bandeau PWA étouffe la barre de nav (capture 3)
« Installe Sereno… » est posé juste au-dessus de la barre basse, les deux se
touchent, ça fait « pop-up qui gêne ». Ajouter une marge, l'ancrer proprement
(carte flottante avec respiration au-dessus de la nav) et le rendre plus
discret / dismiss mémorisé.

### B6 — Carte « rythme » : alignement (capture 3)
`AUJOURD'HUI / CETTE SEMAINE / CE MOIS-CI` : « CETTE SEMAINE » passe sur 2
lignes, donc son montant descend et se désaligne des deux autres. Réserver une
hauteur d'étiquette fixe (2 lignes min, `align-items` haut) ou raccourcir les
libellés (« Jour / Semaine / Mois » avec l'unité en `eyebrow`).

### B7 — Cibles tactiles
`.icon-btn` = 40×40px : sous la recommandation 44-48px pour du tactile
confortable, surtout en haut d'écran (zone du pouce difficile). Passer à 44px
minimum.

---

## 4. Direction couleur & âme (« attirer sans mettre de la couleur partout »)

L'objectif : que l'app **respire** et **accroche l'œil sur le bon élément**,
tout en restant sobre. Cinq leviers, du plus fort au plus subtil.

### 4.1 Approfondir le contraste de surface (levier n°1, invisible mais décisif)
Descendre le fond de page d'un cran et remonter les cartes pour créer un vrai
plan/relief **sans ombre** :
- `--paper` légèrement plus profond, `--surface` maintenu clair, `--line`
  un peu plus présent. Le simple fait de « décoller » les cartes du fond donne
  instantanément une impression de qualité et d'organisation.

### 4.2 Un accent chaud, un seul par écran (levier n°2, celui qui « attire »)
Introduire `--clay` (§2) et l'utiliser avec discipline :
- **Dashboard** : le bloc « Aujourd'hui » de la carte rythme, ou une fine barre
  d'accent sous le solde hero. Un seul point chaud.
- **Formulaire** : teinter très légèrement le bloc montant selon le type
  (dépense = grège chaud, revenu = brume froide). La couleur *porte du sens*.
- **Onglet actif** de la barre basse : pastille/halo `--clay` au lieu du simple
  changement de teinte sauge (aujourd'hui l'actif est peu lisible).

### 4.3 Faire vivre la couleur des catégories plus tôt
La plus belle ressource couleur de l'app est enfermée dans les strates. La
sortir un peu :
- **Puces de catégorie plus affirmées** dans la liste d'activité (pastille
  couleur plus grande / fond pastel léger de la catégorie).
- **États vides illustrés** avec un aperçu « fantôme » des strates (voir §5.1)
  → on montre la signature avant même la 1ʳᵉ donnée.

### 4.4 Élever la typo sur les moments forts
- Solde hero : agrandir, laisser Fraunces respirer, décimales/€ encore plus en
  retrait (l'entier doit dominer).
- États vides et écran de bienvenue : titres Fraunces plus grands + une phrase
  de voix de marque (déjà bien écrite : « couche après couche… »).

### 4.5 Dark mode : à revoir
Le dark actuel est `--paper: #000000` (noir pur) avec `--surface #111` : très
tranché, un peu dur, et il **perd toute la chaleur** de l'identité. Prévoir un
noir légèrement teinté (encre verte très sombre) pour rester « Sereno » la
nuit. (Non urgent, mais à noter.)

---

## 5. UX — parcours & clarté (« les gens ne lisent pas »)

Puisque personne ne lit, l'interface doit **guider par la structure, la
hiérarchie et les micro-récompenses**, pas par le texte.

### 5.1 Le premier lancement décide de tout (rétention)
Aujourd'hui, un nouvel utilisateur voit un dashboard **entièrement à zéro et
gris** (capture 4) : solde 0,00 €, rythmes 0, strates absentes. Rien ne se
passe, rien n'attire, rien ne montre *pourquoi* l'app est belle.

**Solutions :**
- **État vide qui montre la promesse** : à la place du vide, un aperçu
  « fantôme » des strates en couleurs douces + « Voilà à quoi ressemblera ton
  mois. Note ta première dépense. » → on *montre* la signature.
- **Première dépense = moment de célébration** : après le 1er enregistrement,
  micro-animation (les strates se déposent) + une phrase chaleureuse. C'est le
  moment qui crée l'attachement.
- **Un point de départ unique et évident** : un CTA primaire dominant
  « Noter une dépense » plutôt que 7 raccourcis équivalents.

### 5.2 Rendre le geste de saisie irréprochable
C'est l'action n°1. Elle doit être la plus fluide et la plus jolie (cf. §3-B2/B3).
- Montant en hero + type collé + catégories fréquentes en gros = **3 taps
  visibles sans scroll**.
- Tout le reste (statut, date, note, marqueur, reçu) **replié par défaut** sous
  « Plus d'options ». Un « brouillon/validée/annulée » n'a pas à être dans le
  flux express : par défaut « Validée », on n'affiche le choix que si besoin.
- **Pavé numérique implicite** : `inputmode="decimal"` est là, bon. Vérifier
  qu'aucun scroll parasite ne cache le montant (B2).

### 5.3 Réduire la charge du dashboard
Le dashboard mobile empile hero → rythme → 7 actions → strates → comptes →
budgets → activité. C'est beaucoup. Hiérarchiser : **solde + 1 accent**, puis
**la signature (strates)**, puis raccourcis condensés, puis le reste. « Ce que
je vois en premier » doit répondre à « où en suis-je ce mois-ci ? ».

### 5.4 Cohérence des libellés & tutoiement
La voix est excellente et cohérente (tutoiement, pas d'alarme). À préserver
absolument. Un pass rapide pour uniformiser les casses (« CE MOIS-CI » vs
« Ce mois-ci ») et raccourcir les libellés d'`eyebrow`.

### 5.5 Feedback & état de chargement
« Un instant… » sur le bouton est bien. Généraliser : squelettes de cartes au
chargement plutôt que sauts de contenu, transitions douces d'apparition
(cohérent avec la scène « strates qui se déposent » de `DESIGN.md`).

---

## 6. Micro-détails (la patte « senior »)

Petites choses qui, cumulées, font la différence entre « correct » et « soigné » :

- **Alignement optique** de l'euro `€` sur la baseline du gros chiffre (le hero
  et le champ montant doivent partager exactement le même traitement).
- **Cohérence des rayons** : cartes 10px, pilules 999px — vérifier que le
  segment actif et les inputs suivent bien (pas de coin qui dépasse, cf. B1).
- **Filets vs marges** : certains blocs se séparent par filet, d'autres par
  gap ; choisir une règle (ex. filet à l'intérieur d'une carte, gap entre
  cartes) et s'y tenir.
- **États de focus/hover/active** homogènes sur *tous* les éléments cliquables
  (les `quick-action` et `account-row` n'ont pas tous un `:active` visible).
- **Icônes** : vérifier l'optique (poids de trait, taille) pour qu'elles
  paraissent d'une même famille à travers nav, actions rapides et listes.
- **Nombres tabulaires partout** où il y a des colonnes de montants (déjà bien
  fait via `.amount` — vérifier les listes).
- **Safe-areas** : bien gérées (`--safe-top/bottom`), penser aussi au bandeau
  PWA (B5) et aux modales.
- **Accessibilité** : contraste `--ink-faint #8B948C` sur `--surface` est
  limite pour du texte petit — à vérifier au ratio AA ; cibles tactiles ≥ 44px
  (B7) ; `:focus-visible` déjà présent, bien.

---

## 7. Plan d'action priorisé

### Sprint 0 — Réparer le mobile (P0, ~½ journée) — ✅ fait
- [x] **B1** Segment « Statut » : `.seg` agnostique (`grid-auto-flow: column`),
      option active en pilule interne (choix : pilule plutôt que filets).
- [x] **B2** Formulaire : en-tête sticky + unité type/montant en hero
      (`.entry-hero`), autofocus avec `preventScroll`.
- [x] **B3** Marqueur → « Étiquette de couleur » : replié dans les extras,
      6 anneaux creux (la forme le distingue des pastilles de catégories —
      les 11 couleurs étaient TOUTES des couleurs de catégories ; le
      sous-ensemble conservé garde les données existantes valides).
- [x] **B4** Actions rapides : 6 items (« Activité » retirée), grille 3×2.
- [x] **B5** Bandeau PWA : décollé de la nav (80px) + box-shadow retirée
      (violait la règle « pas d'ombre »).
- [x] **B6** Carte rythme : `justify-content: space-between` — montants
      alignés même si un libellé passe sur 2 lignes.
- [x] **B7** Cibles tactiles 44px (transaction-edit, transfer-edit, auth).

### Sprint 1 — Donner de l'âme (P1, ~1-2 jours) — ✅ fait
- [x] Contraste de surface : `--paper #E4E0D0`, `--line #CFC9B8` (les cartes
      se décollent du fond, sans ombre).
- [x] `--clay #B4603A` / `--clay-soft #F3E4DB` (+ variantes dark) : barre fine
      sous le solde hero, pastille d'onglet actif (nav basse + side-nav,
      repère permanent hors décompte), bloc montant du formulaire teinté par
      type (dépense = grège chaud, revenu = brume froide). Gouvernance
      inscrite dans `DESIGN.md`.
- [x] États vides : `app-strata-ghost` (même langage de forme que le vrai
      chart, couleurs adoucies) sur dashboard, statistiques, activité.
- [x] Solde hero : entier en Fraunces 56px, décimales/€ en retrait (20px,
      opacité 0.5) — documenté dans `DESIGN.md` (typographie).

### Sprint 2 — Parcours & délice (P2, ~2-3 jours) — ✅ fait
- [x] Flux de saisie : statut (défaut « Validée ») et reçu repliés sous
      « Plus d'options » en création — le flux express (type, montant,
      catégorie, Enregistrer) tient sans scroll.
- [x] Célébration 1ʳᵉ dépense : toast « C'est noté — regarde ta première
      couche se déposer » + retour dashboard où la scène de dépôt des strates
      joue. Bonus : `close()` corrigé (arrivée directe via raccourci PWA ne
      sort plus de l'app après enregistrement).
- [x] Dashboard mobile réordonné : solde → rythme → strates (signature) →
      raccourcis condensés → le reste (`display: contents` + `order`,
      desktop inchangé).
- [x] Squelettes de chargement (pulse d'aplat calme, sans shimmer) : carte
      strates + activité récente + liste activité.

### Sprint 3 — Finitions (P3) — ✅ fait
- [x] Micro-détails (§6) : champ montant des 2 formulaires aligné sur le
      traitement hero (Fraunces), `.seg` promu dans le vocabulaire partagé
      (3 doublons supprimés), `:active` ajouté sur `.account-row`,
      `--ink-faint` passé de 3.0:1 à 4.9:1 (AA) sur `--surface`.
- [x] Dark mode réchauffé (§4.5) : encre verte très sombre (`#0C100D` /
      `#171B18`) au lieu du noir pur, `--sage` dark éclairci (`#7A9787`,
      liens 6:1 au lieu de 2.7:1), clay conservé. Tous les couples validés
      par calcul WCAG.
- [x] Libellés/casses (§5.4) : audit fait — deux familles cohérentes
      (eyebrows/rythme en capitales via CSS, labels `.k` en sentence case),
      rien à corriger.

**Reste ouvert (hors sprints)** : palette d'étiquettes véritablement
distincte des catégories (à générer/valider avec le validateur dataviz si
besoin — en attendant, la forme anneau fait la distinction) ; `--ink-faint`
sur `--paper` est à 3.9:1 (AA grand texte seulement) pour les mentions
« facultatif » ; squelettes à observer en conditions cloud réelles.

---

## 8. Tokens proposés (à ajouter dans `src/styles.scss` / `docs/DESIGN.md`)

```css
:root {
  /* Accent chaud signature — usage RARE (1× par écran max) */
  --clay:      #B4603A;
  --clay-soft: #F3E4DB;

  /* Contraste de surface renforcé (valeurs à caler visuellement) */
  /* --paper : un cran plus profond que #ECE9DF */
  /* --line  : un cran plus présent que #D8D4C6 */

  /* Élévation SANS ombre : filet + très léger décalage de teinte */
  --card-border: 1px solid var(--line);
}
```

> **Règle de gouvernance couleur** à inscrire dans `DESIGN.md` : `--clay`
> n'apparaît **jamais deux fois sur le même écran** et **jamais en aplat plein
> écran**. C'est la garantie qu'on « attire l'œil » sans retomber dans le
> « couleur partout » que le produit refuse.

---

## 9. Ce qu'il ne faut SURTOUT pas casser

L'app a déjà de vraies qualités — les préserver en priorité :
- La **voix calme** et le tutoiement (pas de rouge, pas de culpabilisation).
- Les **aplats nets sans dégradé ni ombre** (l'élégance vient de là).
- Les **strates** comme unique élément signature.
- Les **montants en chiffres tabulaires** comme gros titres.
- L'accessibilité (`:focus-visible`, `prefers-reduced-motion`, safe-areas).

Le but de cet audit n'est pas de changer l'identité de Sereno, mais de la
**révéler** : aujourd'hui elle est là, mais murmurée. On veut qu'elle se voie
au premier coup d'œil, sur mobile comme sur desktop.
```
