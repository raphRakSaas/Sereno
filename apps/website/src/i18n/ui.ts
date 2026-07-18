/* i18n du site : FR à la racine, EN sous /en/.
   Les slugs sont traduits — routeMap fait la correspondance pour le sélecteur
   de langue et les alternates hreflang. */

export const languages = { fr: 'Français', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'fr';

/** L'app elle-même (CTA « Essayer gratuitement »). ?install=1 ouvre le choix d'installation sur mobile. */
export const APP_URL = 'https://sereno-2qj.pages.dev/?install=1';

export type RouteKey =
  | 'home'
  | 'features'
  | 'method'
  | 'support'
  | 'faq'
  | 'contact'
  | 'blog'
  | 'terms'
  | 'privacy'
  | 'legal';

export const routeMap: Record<RouteKey, Record<Lang, string>> = {
  home: { fr: '/', en: '/en' },
  features: { fr: '/fonctionnalites', en: '/en/features' },
  method: { fr: '/methode', en: '/en/method' },
  support: { fr: '/soutenir', en: '/en/support' },
  faq: { fr: '/faq', en: '/en/faq' },
  contact: { fr: '/contact', en: '/en/contact' },
  blog: { fr: '/blog', en: '/en/blog' },
  terms: { fr: '/cgu', en: '/en/terms' },
  privacy: { fr: '/confidentialite', en: '/en/privacy' },
  legal: { fr: '/mentions-legales', en: '/en/legal-notice' },
};

export const ui = {
  fr: {
    'site.tagline': 'Vois clair dans ton argent, sans anxiété.',
    'site.description':
      'Sereno est une app de budget calme : tu notes tes dépenses à la main, tu vois où va ton argent — gratuitement, sans alerte culpabilisante.',
    'nav.features': 'Fonctionnalités',
    'nav.method': 'À propos',
    'nav.support': 'Soutenir',
    'nav.faq': 'FAQ',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    'cta.openApp': 'Essayer gratuitement',
    'cta.openApp.aria': 'Essayer Sereno gratuitement, sans inscription',
    'footer.legal': 'Mentions légales',
    'footer.privacy': 'Confidentialité',
    'footer.terms': 'CGU',
    'footer.note': 'Gratuit pour toujours. Fonctionne aussi sans compte, en local sur ton appareil.',
    'lang.switch': 'English version',
    'blog.readMore': 'Lire',
    'blog.published': 'Publié le',
    'notfound.title': 'Page introuvable',
    'notfound.body': 'Cette page n’existe pas (ou plus). Rien de grave.',
    'notfound.back': 'Retour à l’accueil',
    'support.soon': 'Bientôt disponible',
  },
  en: {
    'site.tagline': 'See your money clearly, without the anxiety.',
    'site.description':
      'Sereno is a calm budgeting app: you log your spending by hand, you see where your money goes — free forever, no guilt trips.',
    'nav.features': 'Features',
    'nav.method': 'About',
    'nav.support': 'Support',
    'nav.faq': 'FAQ',
    'nav.blog': 'Blog',
    'nav.contact': 'Contact',
    'cta.openApp': 'Try for free',
    'cta.openApp.aria': 'Try Sereno for free, no sign-up required',
    'footer.legal': 'Legal notice',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.note': 'Free forever. Also works without an account, locally on your device.',
    'lang.switch': 'Version française',
    'blog.readMore': 'Read',
    'blog.published': 'Published on',
    'notfound.title': 'Page not found',
    'notfound.body': 'This page doesn’t exist (or no longer does). No harm done.',
    'notfound.back': 'Back to home',
    'support.soon': 'Coming soon',
  },
} as const;

export type UiKey = keyof (typeof ui)['fr'];

export function t(lang: Lang) {
  return (key: UiKey): string => ui[lang][key] ?? ui[defaultLang][key];
}

/** Chemin localisé d'une route logique. */
export function href(lang: Lang, key: RouteKey): string {
  return routeMap[key][lang];
}
