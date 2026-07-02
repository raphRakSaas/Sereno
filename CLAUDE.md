# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Sereno — a personal budgeting PWA. The product thesis: financial anxiety comes
from not knowing where money goes, so the app answers with calm clarity, never
alarm. This shapes real code decisions: budget overrun UI uses amber, never
red; copy states facts plainly ("Dépassé de 50 € — ça arrive") instead of
warning/alerting; the guest-mode-to-account upsell is an invitation, never a
hard paywall or a "you've hit your limit" message.

Works fully offline/local with zero configuration (guest mode via IndexedDB);
an optional free account adds Supabase sync, multi-account, custom categories,
recurring transactions, and budgets.

## Commands

```bash
npm start            # dev server at http://localhost:4200 (guest mode needs no config)
npm run build        # production build → dist/sereno/browser
npm run watch        # dev-mode build, watching
npm test             # ng test (Karma/Jasmine) — note: no spec files exist yet
```

There is no lint script configured. `prettier` is a devDependency but no
script wraps it.

Build/serve use the `@ngx-env/builder` custom builders (not the stock
`@angular-devkit/build-angular`) so that `.env` variables become available via
`import.meta.env.NG_APP_*` — see Environment config below.

### Supabase (when working on backend features)

The `supabase` MCP skill/tools are the primary way to interact with the
project (`mcp__supabase__*`): `execute_sql` for iterating on schema changes,
`apply_migration` only when committing a finished migration, `get_advisors`
after any DDL change, `deploy_edge_function` for `process-recurring`. Prefer
these over guessing SQL CLI syntax from memory — Supabase conventions change
frequently.

- `supabase/schema.sql` — full schema, RLS policies, seed data. Source of
  truth; keep in sync with whatever is actually applied to the project.
- `supabase/cron.sql` — pg_cron + pg_net job that invokes the
  `process-recurring` edge function nightly. Contains placeholder
  `<PROJECT_REF>` / `<ANON_KEY>` — fill in before running against a project.
- `supabase/functions/process-recurring/` — idempotent recurring-transaction
  generator (catches up missed occurrences, never duplicates a (rule, date)
  pair). Deploy with `supabase functions deploy process-recurring`.

## Architecture

Strict four-layer separation, dependency direction top-to-bottom. **Components
and stores never import Dexie or Supabase directly — only `domain/ports`
interfaces.** This is the single most important invariant in the codebase:

```
presentation/   → components, atomic design: atoms/molecules/organisms/templates
      ↓
application/    → NgRx Signal Stores + cross-cutting services (auth, migration, conversion, toast)
      ↓
domain/         → models + repository/gateway interfaces ("ports") + injection tokens
      ↓
infrastructure/ → DexieXxxRepository, SupabaseXxxRepository, SwitchingXxxRepository
```

### The guest ↔ cloud switch

Every port (`TransactionRepository`, `AccountRepository`, `CategoryRepository`,
`BudgetRepository`, `RecurringRuleRepository`) has three implementations:

- `infrastructure/dexie/*` — IndexedDB via Dexie, used in guest mode.
- `infrastructure/supabase/*` — Postgres via supabase-js, used when signed in.
- `infrastructure/switching/switching.repositories.ts` — the one actually
  bound to the DI token (see `infrastructure/providers.ts`). Each method
  reads `AppModeService.isCloud()` at call time and delegates to Dexie or
  Supabase accordingly.

This means switching backends requires **no page reload and no re-injection**
— only `AppModeService.setMode()` changes, and stores re-`load()`. When adding
a new port/feature, follow this same three-file pattern (Dexie impl, Supabase
impl, Switching wrapper) rather than branching inside stores or components.

### Migration on sign-up (`application/services/migration.service.ts`)

When a guest signs up/in and Supabase is empty, local Dexie data is migrated:
new UUIDs are generated client-side for accounts/custom-categories/rules/
transactions/budgets (default categories keep their fixed UUIDs — identical
between `domain/data/default-categories.ts` and the seed in
`supabase/schema.sql`, so they need no remapping). Inserts are tracked in
order; if any step fails, everything inserted so far is deleted in reverse
order (client-side rollback) and the local Dexie data is left untouched. Only
after full success is Dexie cleared and `AppModeService` flipped to `cloud`.

### Conversion triggers (`application/services/conversion.service.ts`)

Three independent triggers open the same upsell modal (whichever fires
first): 20 transactions created, 14 days since first launch, or an attempt to
reach a cloud-only route. Cloud-only routes are guarded by
`presentation/guards/cloud-only.guard.ts` (`cloudOnlyGuard(featureName)`),
which redirects to `/reglages` and fires the "feature" trigger reason rather
than blocking navigation with an error. "Plus tard" snoozes automatic
(non-feature) triggers for 7 days via localStorage — don't remove or shorten
this without reason, it's what keeps the upsell from being naggy.

### Domain models vs. Supabase rows

Domain models (`domain/models/*.model.ts`) are camelCase and match what
components/stores work with. Supabase rows are snake_case Postgres shapes;
`infrastructure/supabase/rows.ts` holds the `toXxx()` mapper functions
(including numeric-string coercion, since PostgREST returns `numeric` columns
as strings). Never leak a raw Supabase row past the repository boundary.

### State: NgRx Signal Store, not classic NgRx

`application/stores/*.store.ts` use `signalStore()` from `@ngrx/signals`
(`withState`/`withComputed`/`withMethods`), each `providedIn: 'root'`. Store
methods call into the injected port token, catch failures, and set a calm
`error` message on the state (see `CALM_ERROR` constants) — error copy follows
the same "explain plainly, don't alarm" rule as the rest of the product.

### Environment config

`src/environments/environment.ts` reads `import.meta.env.NG_APP_SUPABASE_URL`
and `NG_APP_SUPABASE_PUBLISHABLE_KEY`, wrapped in try/catch — with no `.env`
file, `import.meta.env` access throws and the app falls back to guest-only
mode cleanly. Keep this access pattern textual (`import.meta.env.NG_APP_*`,
not computed/destructured) because `@ngx-env/builder` does a build-time string
replace, not a runtime lookup. `.env` is gitignored; `.env.example`
documents the two variables.

### Design system

`docs/DESIGN.md` is the source of truth for palette, typography, and the
signature "strata" visualization (spending breakdown as sediment layers,
`presentation/organisms/strata-chart/`, largest expense = base layer). Key
constraints worth preserving when touching UI:

- Flat color fills only — no gradients, no drop shadows, no glassmorphism.
- Category palette is validated computationally (OKLCH lightness band, chroma
  floor, colorblind-safe pairwise separation, contrast) — if adding/changing
  category colors, revalidate rather than eyeballing (the dataviz skill's
  `validate_palette.js` was used to generate the current set).
- Amounts use tabular numerals (`.amount` class / `AmountComponent`) — never
  plain text interpolation of currency values, since scanability of numbers
  is a core product requirement.
- Budget overrun state is amber (`--amber`), never red.

### PWA

`ngsw-config.json`: app shell is cache-first, Supabase REST/Edge Function
calls are network-first with a 6s timeout (`dataGroups`). Service worker is
only enabled in production builds (`provideServiceWorker(..., { enabled:
!isDevMode() })` in `app.config.ts`) — testing offline behavior requires a
production build served statically, not `ng serve`.
