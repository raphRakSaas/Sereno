// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// URL de prod : projet Cloudflare Pages du site. Pas de domaine custom pour
// l'instant — mettre à jour `site` le jour où un domaine est branché
// (canonical + sitemap en dépendent).
export default defineConfig({
  site: 'https://sereno-site-aqy.pages.dev',
  trailingSlash: 'never',
  build: {
    // Fichiers plats (methode.html) plutôt que dossiers (methode/index.html) :
    // Cloudflare Pages sert alors /methode sans redirection 308 vers /methode/,
    // ce qui garde les URLs servies identiques aux canonicals sans slash.
    format: 'file',
  },
  redirects: {
    '/tarifs': '/soutenir',
    '/en/pricing': '/en/support',
  },
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
