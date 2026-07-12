import { describe, expect, it } from 'vitest';
import { MARKER_COLORS } from '../data/marker-colors';
import { suggestMarkerColor } from './marker-color.util';

describe('suggestMarkerColor', () => {
  it('retourne toujours une couleur de la palette', () => {
    expect(MARKER_COLORS).toContain(suggestMarkerColor('cat-abc', []));
  });

  it('est déterministe pour un même identifiant de catégorie', () => {
    const first = suggestMarkerColor('categorie-stable', []);
    const second = suggestMarkerColor('categorie-stable', []);
    expect(first).toBe(second);
  });

  it('évite les couleurs récemment utilisées quand c’est possible', () => {
    const recentlyUsed = MARKER_COLORS.slice(0, MARKER_COLORS.length - 1);
    const suggestion = suggestMarkerColor('nimporte', recentlyUsed);
    expect(suggestion).toBe(MARKER_COLORS.at(-1));
  });

  it('retombe sur la palette complète si toutes les couleurs sont utilisées', () => {
    const suggestion = suggestMarkerColor('cat-xyz', [...MARKER_COLORS]);
    expect(MARKER_COLORS).toContain(suggestion);
  });
});
