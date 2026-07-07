import { describe, expect, it } from 'vitest';
import { easeOutSereno, lerp, smoothstep } from './theme-easing.util';

describe('theme easing', () => {
  it('interpole linéairement', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it('easeOutSereno commence à 0 et finit à 1 sans dépasser', () => {
    expect(easeOutSereno(0)).toBe(0);
    expect(easeOutSereno(1)).toBe(1);
    expect(easeOutSereno(0.5)).toBeGreaterThan(0.4);
    expect(easeOutSereno(0.5)).toBeLessThan(0.9);
  });

  it('smoothstep reste borné entre 0 et 1', () => {
    expect(smoothstep(0.2, 0.8, 0)).toBe(0);
    expect(smoothstep(0.2, 0.8, 1)).toBe(1);
    expect(smoothstep(0.2, 0.8, 0.5)).toBeCloseTo(0.5, 1);
  });
});
