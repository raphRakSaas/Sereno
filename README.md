# Sereno

**Vois clair dans ton argent, sans anxiété.**

Sereno est une PWA de gestion de budget personnel : tu notes tes dépenses en deux
gestes, tu vois où va ton argent (les « strates »), tu poses des budgets — et
l'app te parle calmement, jamais en rouge, jamais en te culpabilisant.

- **Mode invité** : fonctionne immédiatement, 100 % local (IndexedDB), sans compte
  ni configuration serveur.
- **Compte gratuit** : synchronisation Supabase, comptes multiples, catégories
  personnalisées, récurrences automatiques, budgets mensuels.
- **PWA** : installable, consultation hors-ligne.

## Stack

| Couche | Choix |
|---|---|
| Framework | Angular 21 (standalone components, zoneless) |
| State | NgRx Signal Store |
| Local (invité) | Dexie.js (IndexedDB) |
| Backend (connecté) | Supabase — Postgres + RLS, Auth, Edge Functions, pg_cron |
| PWA | @angular/service-worker (ngsw) |
| Config | @ngx-env/builder (`.env`, variables `NG_APP_*`) |
| Hébergement cible | Cloudflare Pages |

## Architecture

Séparation stricte en quatre couches — les composants et les stores ne
connaissent **jamais** Dexie ni Supabase, uniquement les interfaces du domain :

```
src/app/
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

## Démarrage rapide (mode invité, zéro config)

```bash
npm install
npm start          # http://localhost:4200
```

L'app tourne entièrement en local : compte par défaut et catégories créés au
premier lancement. Aucune variable d'environnement requise.

## Configuration Supabase (Phase 2+)

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Exécute `supabase/schema.sql` dans l'éditeur SQL (tables, RLS, trigger de
   profil, catégories globales seedées avec des UUID fixes — identiques à ceux
   du mode invité, ce qui rend la migration triviale).
3. Copie `.env.example` vers `.env` et renseigne :

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

```bash
npx ng build       # sortie : dist/sereno/browser
```

Sur Cloudflare Pages : *build command* `npx ng build`, *output directory*
`dist/sereno/browser`. Le fichier `public/_redirects` gère le fallback SPA, et
les variables `NG_APP_*` se définissent dans les settings du projet Pages.

Le service worker n'est actif qu'en production (`ng build`). Pour vérifier le
comportement PWA en local :

```bash
npx ng build && npx http-server dist/sereno/browser -p 8080
# puis Lighthouse (onglet Application/PWA) sur http://localhost:8080
```

Installabilité et lecture hors-ligne sont couvertes : app shell en cache-first,
données Supabase en network-first (`ngsw-config.json`).

## Design

La direction visuelle (« sérénité financière » : aplats calmes, montants traités
comme des titres éditoriaux, visualisation signature en strates de sédiment,
palette validée contraste + daltonisme) est documentée dans
[`docs/DESIGN.md`](docs/DESIGN.md).

## Hors périmètre v1 (structure prête, écrans absents)

Connexion bancaire directe, multi-devise (champ `currency` déjà en base),
partage de compte entre utilisateurs.
