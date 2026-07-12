# Sereno

**Vois clair dans ton argent, sans anxiété.**

Monorepo npm workspaces :

```
apps/app/        # la PWA Angular de gestion de budget
apps/website/    # le site public (Astro, FR/EN) — vitrine, blog, pages légales
packages/brand/  # tokens de marque + logos partagés
supabase/        # schéma Postgres, RLS, Edge Functions, cron
docs/            # DESIGN.md — direction visuelle commune app + site
```

## L'app (`apps/app`)

Sereno est une PWA de gestion de budget personnel : tu notes tes dépenses en deux
gestes, tu vois où va ton argent (les « strates »), tu poses des budgets — et
l'app te parle calmement, jamais en rouge, jamais en te culpabilisant.

- **Mode invité** : fonctionne immédiatement, 100 % local (IndexedDB), sans compte
  ni configuration serveur.
- **Compte gratuit** : synchronisation Supabase, comptes multiples, catégories
  personnalisées, récurrences automatiques, budgets mensuels.
- **PWA** : installable, consultation hors-ligne.

| Couche | Choix |
|---|---|
| Framework | Angular 21 (standalone components, zoneless) |
| State | NgRx Signal Store |
| Local (invité) | Dexie.js (IndexedDB) |
| Backend (connecté) | Supabase — Postgres + RLS, Auth, Edge Functions, pg_cron |
| PWA | @angular/service-worker (ngsw) |
| Config | @ngx-env/builder (`.env`, variables `NG_APP_*`) |
| Tests | Vitest (unitaire/intégration, jsdom) + Playwright (e2e) |
| Hébergement | Cloudflare Pages (`sereno-2qj.pages.dev`) |

Séparation stricte en quatre couches — les composants et les stores ne
connaissent **jamais** Dexie ni Supabase, uniquement les interfaces du domain :

```
apps/app/src/app/
├── presentation/     # composants (atomic design : atoms/molecules/organisms/templates)
├── application/      # NgRx Signal Stores + services métier (auth, migration, conversion)
├── domain/           # modèles + ports (TransactionRepository, AccountRepository, …)
└── infrastructure/   # DexieXxxRepository, SupabaseXxxRepository,
                      # SwitchingXxxRepository (bascule invité/connecté à chaud)
```

La bascule invité → connecté se fait **sans rechargement de page** : les
repositories « switching » routent chaque appel vers Dexie ou Supabase selon le
mode courant ; à l'inscription, les données locales sont migrées vers Supabase
(nouveaux UUID, rollback en cas d'échec réseau) puis le mode bascule.

## Démarrage rapide

```bash
npm install          # installe tous les workspaces
npm start            # l'app sur http://localhost:4200 (mode invité, zéro config)
npm test             # tests unitaires + intégration (Vitest)
npm run start:website   # le site sur http://localhost:4321
```

### Tests

```bash
npm test                 # unitaires + intégration (une passe)
npm run test:watch       # relance à chaque modification
npm run test:coverage    # rapport de couverture (coverage/)
npm run e2e:install      # une fois : télécharge Chromium pour Playwright
npm run e2e              # tests end-to-end (parcours utilisateur, mode invité)
```

Détail des niveaux de test, de la couverture et du dépannage :
[`TESTING.md`](TESTING.md).

L'app tourne entièrement en local : compte par défaut et catégories créés au
premier lancement. Aucune variable d'environnement requise.

## Configuration Supabase (compte cloud)

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Exécute `supabase/schema.sql` dans l'éditeur SQL (tables, RLS, trigger de
   profil, catégories globales seedées avec des UUID fixes — identiques à ceux
   du mode invité, ce qui rend la migration triviale).
3. Copie `apps/app/.env.example` vers `apps/app/.env` et renseigne :

   ```
   NG_APP_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
   NG_APP_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
   ```

   (Dashboard → Settings → API. Ce sont des clés **publiques** côté client ;
   la sécurité des données repose sur RLS.)

4. **Google OAuth** (optionnel) : Dashboard → Authentication → Providers →
   Google, avec un client OAuth Google Cloud. Ajoute l'URL de l'app aux
   *Redirect URLs* (Authentication → URL Configuration). Recommandé au passage :
   activer *Leaked password protection* (Authentication → Passwords).
5. **Récurrences** : déploie l'Edge Function puis planifie le cron :

   ```bash
   supabase functions deploy process-recurring
   # puis exécute supabase/cron.sql (remplace <PROJECT_REF> et <ANON_KEY>)
   ```

   La fonction est idempotente et rattrape les échéances manquées.

Laisser le `.env` vide est valide : l'app reste en mode invité et masque les
appels à un compte.

## Build & déploiement (Cloudflare Pages)

Deux workflows GitHub Actions, filtrés par chemins — un push qui ne touche que
le site ne redéploie pas l'app, et inversement :

- `.github/workflows/deploy-app.yml` → projet Pages `sereno`
  (`https://sereno-2qj.pages.dev`), artefact `apps/app/dist/sereno/browser`.
- `.github/workflows/deploy-website.yml` → projet Pages du site,
  artefact `apps/website/dist`.

Secrets à renseigner une fois dans *Settings → Secrets and variables → Actions*
du repo GitHub (**Repository secrets**, pas un Environment) :

| Secret | Où le trouver |
|---|---|
| `CLOUDFLARE_API_TOKEN` | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) — permission `Cloudflare Pages: Edit` |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard Cloudflare → colonne de droite de n'importe quelle page du compte |
| `NG_APP_SUPABASE_URL` | Même valeur que dans `apps/app/.env` |
| `NG_APP_SUPABASE_PUBLISHABLE_KEY` | Même valeur que dans `apps/app/.env` |

Le **nom du projet** Pages et l'**URL publique** peuvent différer : si
`<nom>.pages.dev` est déjà pris globalement, Cloudflare assigne un suffixe
(ex. `sereno-2qj.pages.dev`). L'URL stable est celle affichée sous *Domains*
dans le dashboard — pas les liens avec hash dans *All deployments*.

Le fichier `apps/app/public/_redirects` gère le fallback SPA une fois déployé.

Le service worker n'est actif qu'en production. Pour vérifier le comportement
PWA en local :

```bash
npm run build && npx http-server apps/app/dist/sereno/browser -p 8080
# puis Lighthouse (onglet Application/PWA) sur http://localhost:8080
```

Installabilité et lecture hors-ligne sont couvertes : app shell en cache-first,
données Supabase en network-first (`apps/app/ngsw-config.json`).

## Design

La direction visuelle (« sérénité financière » : aplats calmes, montants traités
comme des titres éditoriaux, visualisation signature en strates de sédiment,
palette validée contraste + daltonisme) est documentée dans
[`docs/DESIGN.md`](docs/DESIGN.md) — elle s'applique à l'app **et** au site.

## Hors périmètre v1 (structure prête, écrans absents)

Connexion bancaire directe, multi-devise (champ `currency` déjà en base),
partage de compte entre utilisateurs.
