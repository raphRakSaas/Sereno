/* Configuration Supabase, injectée au build par @ngx-env/builder depuis .env
   (clés publiques côté client — pas des secrets). L'accès doit rester textuel
   (`import.meta.env.NG_APP_…`) pour que le remplacement au build s'applique ;
   sans .env l'expression n'est pas remplacée et lève à l'exécution — le
   try/catch garantit alors le démarrage en mode invité. Voir README.md. */
function readEnv(): { supabaseUrl: string; supabasePublishableKey: string } {
  try {
    return {
      supabaseUrl: import.meta.env.NG_APP_SUPABASE_URL || '',
      supabasePublishableKey: import.meta.env.NG_APP_SUPABASE_PUBLISHABLE_KEY || '',
    };
  } catch {
    return { supabaseUrl: '', supabasePublishableKey: '' };
  }
}

export const environment = readEnv();
