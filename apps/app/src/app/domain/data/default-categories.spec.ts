import { describe, expect, it } from 'vitest';
import { CATEGORY_EMOJI_NAMES } from '../../presentation/atoms/category-icon/category-icon.component';
import { DEFAULT_CATEGORIES } from './default-categories';

const KNOWN_EMOJI_NAMES = new Set<string>(CATEGORY_EMOJI_NAMES);

/* Ces catégories par défaut sont partagées avec le seed Supabase : leur
   structure (id unique, icône valide) est un invariant du produit. Les tests
   verrouillent aussi les correctifs P4 (icône sur chaque revenu) et P5
   (révélation progressive des revenus les plus fréquents). */

describe('DEFAULT_CATEGORIES', () => {
  it('a des identifiants uniques', () => {
    const ids = DEFAULT_CATEGORIES.map((category) => category.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('n’utilise que des UUID fixes et non vides', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(category.id).toMatch(/^c0000000-0000-4000-8000-[0-9a-f]+$/);
      expect(category.name.trim().length).toBeGreaterThan(0);
    }
  });

  it('P4 — chaque catégorie de revenu possède une icône rendue (pas de fallback)', () => {
    const incomeCategories = DEFAULT_CATEGORIES.filter((category) => category.type === 'income');
    expect(incomeCategories.length).toBeGreaterThan(0);
    for (const category of incomeCategories) {
      expect(KNOWN_EMOJI_NAMES.has(category.icon), `icône manquante: ${category.icon}`).toBe(true);
    }
  });

  it('toutes les catégories (revenus et dépenses) ont une icône connue', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(KNOWN_EMOJI_NAMES.has(category.icon), `icône manquante: ${category.icon}`).toBe(true);
    }
  });

  it('P5 — les revenus les plus fréquents existent bien parmi les catégories par défaut', () => {
    const commonIncomeNames = [
      'Salaire',
      'Freelance & indépendant',
      'Allocations & aides familiales',
      'Remboursements reçus',
      'Autres revenus',
    ];
    const incomeNames = new Set(
      DEFAULT_CATEGORIES.filter((category) => category.type === 'income').map((c) => c.name),
    );
    for (const name of commonIncomeNames) {
      expect(incomeNames.has(name), `revenu fréquent absent: ${name}`).toBe(true);
    }
  });
});
