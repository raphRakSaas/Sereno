/** Interpolation linéaire entre deux valeurs. */
export function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

/** Rampe douce 0→1 entre deux seuils. */
export function smoothstep(edgeStart: number, edgeEnd: number, value: number): number {
  const amount = Math.min(1, Math.max(0, (value - edgeStart) / (edgeEnd - edgeStart)));
  return amount * amount * (3 - 2 * amount);
}

/** Ease-out serein (~700ms), sans rebond — proche cubic-bezier(0.32, 0.72, 0, 1). */
export function easeOutSereno(progress: number): number {
  const clamped = Math.min(1, Math.max(0, progress));
  const inverse = 1 - clamped;
  return 1 - inverse * inverse * inverse * (1 - clamped * 0.35);
}

/** Mélange hex → hex via color-mix CSS (côté composant on utilise des %). */
export function mixChannel(light: number, dark: number, themeProgress: number): number {
  return Math.round(lerp(light, dark, themeProgress));
}
