/** Palette d'étiquettes de couleur (cf. docs/DESIGN.md).
 *
 * Volontairement courte : une couleur par famille de teinte, pour que
 * l'étiquette reste un repère discret et ne concurrence jamais la palette des
 * catégories. Sous-ensemble des anciennes couleurs : les marqueurs déjà
 * enregistrés avec une couleur retirée restent affichés tels quels. */
export const MARKER_COLORS = [
  '#1E6D9C',
  '#018472',
  '#7D8F3A',
  '#A07417',
  '#7B6CBF',
  '#A85769',
] as const;

export type MarkerColor = (typeof MARKER_COLORS)[number];

export function isMarkerColor(value: string): value is MarkerColor {
  return (MARKER_COLORS as readonly string[]).includes(value);
}
