// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL de prod : projet Cloudflare Pages du site. Pas de domaine custom pour
// l'instant — mettre à jour `site` le jour où un domaine est branché
// (canonical + sitemap en dépendent).
export default defineConfig({
  site: 'https://sereno-site.pages.dev',
  trailingSlash: 'never',
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      // FR à la racine (/fonctionnalites), EN préfixé (/en/features).
      prefixDefaultLocale: false,
    },
  },
  integrations: [sitemap()],
});
