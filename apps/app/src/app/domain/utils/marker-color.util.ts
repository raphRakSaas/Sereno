import { MARKER_COLORS } from '../data/marker-colors';

/** Choisit une couleur d'étiquette variée selon la catégorie, en évitant les
 *  couleurs récemment utilisées quand c'est possible. */
export function suggestMarkerColor(categoryId: string, recentlyUsed: readonly string[]): string {
  const available = MARKER_COLORS.filter((color) => !recentlyUsed.includes(color));
  const pool = available.length > 0 ? available : MARKER_COLORS;

  let hash = 0;
  for (const character of categoryId) {
    hash = (hash << 5) - hash + character.charCodeAt(0);
    hash |= 0;
  }

  return pool[Math.abs(hash) % pool.length]!;
}
