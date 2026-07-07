import { describe, expect, it } from 'vitest';
import { normalizeMerchantText, resolveMerchantBrand } from './merchant-brand.util';

describe('normalizeMerchantText', () => {
  it('ignore casse, accents et ponctuation', () => {
    expect(normalizeMerchantText('SPotify Premium !')).toBe('spotify premium');
    expect(normalizeMerchantText('Électricité de France')).toBe('electricite de france');
  });
});

describe('resolveMerchantBrand', () => {
  it('reconnaît spotify malgré la casse', () => {
    expect(resolveMerchantBrand('SPotify')?.id).toBe('spotify');
    expect(resolveMerchantBrand('abonnement SPOTIFY premium')?.id).toBe('spotify');
  });

  it('reconnaît une marque dans la note ou le titre', () => {
    expect(resolveMerchantBrand(null, 'Netflix', 'Abonnements')?.id).toBe('netflix');
    expect(resolveMerchantBrand('Courses Carrefour city')?.id).toBe('carrefour');
  });

  it('retourne null si aucune marque connue', () => {
    expect(resolveMerchantBrand('Marché du samedi')).toBeNull();
    expect(resolveMerchantBrand('Karos')).toBeNull();
  });

  it('privilégie l alias le plus long', () => {
    expect(resolveMerchantBrand('uber eats commande')?.id).toBe('ubereats');
    expect(resolveMerchantBrand('course uber')?.id).toBe('uber');
  });
});
