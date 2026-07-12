import { describe, expect, it } from 'vitest';
import { categoryIconInner, CATEGORY_ICON_PATHS } from './category-icon-paths';

describe('categoryIconInner', () => {
  it('renvoie le contenu SVG d’une icône connue', () => {
    expect(categoryIconInner('wallet')).toBe(CATEGORY_ICON_PATHS['wallet']);
  });

  it('retombe sur « dots » pour une icône inconnue', () => {
    expect(categoryIconInner('inexistante')).toBe(CATEGORY_ICON_PATHS['dots']);
  });

  it('toutes les icônes sont teintées par currentColor (effet duotone)', () => {
    for (const svg of Object.values(CATEGORY_ICON_PATHS)) {
      expect(svg).toContain('currentColor');
    }
  });
});
