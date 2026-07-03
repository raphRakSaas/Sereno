// Variables d'environnement injectées au build par @ngx-env/builder (.env).
declare interface Env {
  readonly NODE_ENV: string;
  /** URL du projet Supabase — vide = mode invité uniquement. */
  readonly NG_APP_SUPABASE_URL?: string;
  /** Clé publishable Supabase (publique côté client). */
  readonly NG_APP_SUPABASE_PUBLISHABLE_KEY?: string;
}

declare interface ImportMeta {
  readonly env: Env;
}
