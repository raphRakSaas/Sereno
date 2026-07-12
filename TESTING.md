# Tests — Sereno

Trois niveaux de tests, tous exécutés depuis la **racine du monorepo** (les
scripts délèguent au workspace `@sereno/app`).

| Niveau | Outil | Emplacement | Ce que ça vérifie |
|---|---|---|---|
| Unitaire | Vitest (builder natif Angular, jsdom) | `apps/app/src/**/*.spec.ts` | fonctions pures du `domain/` (utils, modèles), logique des stores |
| Intégration | Vitest + Angular `TestBed` | `apps/app/src/**/*.spec.ts` | composants rendus (picker, montant), garde d'onboarding |
| E2E | Playwright (Chromium) | `apps/app/e2e/*.spec.ts` | parcours utilisateur réels sur l'app en mode invité |

## Commandes

### Unitaires + intégration (rapides, aucun navigateur requis)

```bash
npm test                 # lance toute la suite une fois (CI-friendly)
npm run test:watch       # relance à chaque modification (dev)
npm run test:coverage    # génère un rapport de couverture (dossier coverage/)
```

`npm test` compile puis exécute les fichiers `*.spec.ts` sous `apps/app/src`.
Aucune configuration ni `.env` n'est nécessaire.

### End-to-end (Playwright)

À faire **une fois** pour télécharger le navigateur Chromium :

```bash
npm run e2e:install      # télécharge Chromium pour Playwright (~90 Mo)
```

Puis :

```bash
npm run e2e              # lance tous les tests e2e (headless)
npm run e2e:ui           # mode interactif (time-travel, sélecteurs) — pratique en debug
npm run e2e:report       # ouvre le dernier rapport HTML (si généré)
```

Le serveur de dev est géré automatiquement : Playwright réutilise un
`http://localhost:4200` déjà lancé, sinon il exécute `npm start` et attend qu'il
soit prêt (voir `apps/app/playwright.config.ts`). Chaque test démarre dans un
contexte navigateur vierge (IndexedDB + localStorage remis à zéro), ce qui permet
de rejouer l'onboarding invité à volonté.

## Couverture des correctifs récents

Les tests verrouillent les huit correctifs UI/UX et accessibilité :

| # | Correctif | Test |
|---|---|---|
| P1 | Contraste de la barre « Taux d'épargne » | audit CSS (voir `docs/DESIGN.md`) — structure figée par les tests de tokens |
| P2 | Convention couleur solde +/− | `amount.component.spec.ts` (signe), `dashboard.spec.ts` (solde ambre négatif) |
| P3 | Invitation à saisir le revenu après onboarding partiel | `onboarding.spec.ts` |
| P4 | Icônes sur toutes les catégories de revenu | `default-categories.spec.ts`, `add-transaction.spec.ts` |
| P5 | Révélation progressive des catégories de revenu | `category-picker.component.spec.ts`, `add-transaction.spec.ts` |
| P6 | Accès aux Budgets depuis le dashboard | `dashboard.spec.ts` |
| P7 | Contraste du vert (mode sombre) | tokens `--mist-deep` validés (voir `styles.scss`) |
| P8 | Créneaux horaires de la salutation | `dashboard.spec.ts` |

## Conventions

- **Descriptions en français**, comme le reste du produit.
- Chaque fichier de test fournit ses propres *factories* (`tx()`, `category()`,
  `account()`) pour construire des objets valides sans dépendre d'autres tests.
- Les tests de composants passent les inputs signaux via
  `fixture.componentRef.setInput(...)`.
- Les tests e2e n'utilisent aucun backend : tout tourne en mode invité (Dexie /
  IndexedDB), donc ils sont déterministes et hors-ligne.

## Dépannage

- **`Cannot find module @rollup/rollup-darwin-arm64`** (ou autre binaire natif) :
  bug npm connu sur les dépendances optionnelles après un ajout de paquet.
  Correctif : `rm -rf node_modules package-lock.json && npm install`.
- **Playwright : navigateur introuvable** : relancer `npm run e2e:install`.
- **E2E qui échoue à démarrer le serveur** : vérifier qu'un `npm start` sain
  répond sur `http://localhost:4200`, ou laisser Playwright le démarrer seul.
- Le service worker n'est actif qu'en build de production ; les tests e2e tournent
  contre le serveur de dev, sans SW — c'est voulu.
