import { MERCHANT_BRANDS, MerchantBrand } from '../data/merchant-brands';

/** Normalise un libellé pour la recherche : minuscules, sans accents ni ponctuation. */
export function normalizeMerchantText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(fragment: string): string {
  return fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Vrai si l'alias apparaît comme mot entier ou sous-chaîne suffisamment longue. */
function matchesAlias(normalizedHaystack: string, alias: string): boolean {
  const needle = normalizeMerchantText(alias);
  if (!needle) {
    return false;
  }
  if (needle.length <= 3) {
    return new RegExp(`(?:^|\\s)${escapeRegExp(needle)}(?:\\s|$)`).test(normalizedHaystack);
  }
  return normalizedHaystack.includes(needle);
}

/** Cherche une marque connue dans une ou plusieurs chaînes (note, catégorie, titre…). */
export function resolveMerchantBrand(...texts: Array<string | null | undefined>): MerchantBrand | null {
  const normalizedHaystack = normalizeMerchantText(
    texts.filter((text): text is string => !!text && text.trim().length > 0).join(' '),
  );
  if (!normalizedHaystack) {
    return null;
  }

  let bestMatch: { brand: MerchantBrand; aliasLength: number } | null = null;

  for (const brand of MERCHANT_BRANDS) {
    for (const alias of brand.aliases) {
      if (!matchesAlias(normalizedHaystack, alias)) {
        continue;
      }
      const aliasLength = normalizeMerchantText(alias).length;
      if (!bestMatch || aliasLength > bestMatch.aliasLength) {
        bestMatch = { brand, aliasLength };
      }
    }
  }

  return bestMatch?.brand ?? null;
}
