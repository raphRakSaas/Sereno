/** Palette minérale pour marquer une transaction (cf. docs/DESIGN.md). */
export const MARKER_COLORS = [
  '#1E6D9C',
  '#3694BC',
  '#196E44',
  '#018472',
  '#7D8F3A',
  '#A07417',
  '#6D9755',
  '#7B6CBF',
  '#8D4826',
  '#A85769',
  '#945818',
] as const;

export type MarkerColor = (typeof MARKER_COLORS)[number];

export function isMarkerColor(value: string): value is MarkerColor {
  return (MARKER_COLORS as readonly string[]).includes(value);
}
