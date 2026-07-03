import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* Blog/guides : un dossier par langue (src/content/blog/fr/…, …/en/…).
   `translationOf` relie les versions FR/EN d'un même article pour le
   sélecteur de langue et les hreflang. */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    lang: z.enum(['fr', 'en']),
    /** Slug (sans préfixe de langue) de la traduction de cet article. */
    translationOf: z.string().optional(),
  }),
});

export const collections = { blog };
