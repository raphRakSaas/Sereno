import { Injectable, signal } from '@angular/core';
import { easeOutSereno } from '../../domain/utils/theme-easing.util';

const DURATION_MS = 700;

@Injectable({ providedIn: 'root' })
export class ThemeTransitionService {
  /** 0 = jour, 1 = nuit. Pilote le ciel et le fondu global de l'interface. */
  readonly progress = signal(0);
  readonly animating = signal(false);
  /** Sens de l'animation en cours (soleil/lune suivent des trajectoires distinctes). */
  readonly towardDark = signal(true);

  private animationFrame = 0;

  /** Applique l'état final sans mouvement (chargement, reduced-motion, mode système). */
  setInstant(isDark: boolean): void {
    this.cancel();
    const value = isDark ? 1 : 0;
    this.progress.set(value);
    this.animating.set(false);
    this.applyProgress(value);
  }

  /** Anime vers le jour ou la nuit, puis exécute le callback à la fin. */
  animateTo(isDark: boolean, onComplete?: () => void): void {
    if (this.prefersReducedMotion()) {
      this.setInstant(isDark);
      onComplete?.();
      return;
    }

    const from = this.progress();
    const to = isDark ? 1 : 0;
    if (from === to) {
      onComplete?.();
      return;
    }

    this.cancel();
    this.animating.set(true);
    this.towardDark.set(isDark);
    const startedAt = performance.now();

    const tick = (now: number): void => {
      const elapsed = now - startedAt;
      const linear = Math.min(1, elapsed / DURATION_MS);
      const eased = easeOutSereno(linear);
      const value = from + (to - from) * eased;
      this.progress.set(value);
      this.applyProgress(value);

      if (linear < 1) {
        this.animationFrame = requestAnimationFrame(tick);
        return;
      }

      this.progress.set(to);
      this.applyProgress(to);
      this.animating.set(false);
      onComplete?.();
    };

    this.animationFrame = requestAnimationFrame(tick);
  }

  private applyProgress(value: number): void {
    document.documentElement.style.setProperty('--theme-t', value.toFixed(4));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      return;
    }
    const lightSky = '#d4e8f2';
    const darkSky = '#0e0f11';
    const blend = Math.round(value * 100);
    meta.setAttribute(
      'content',
      `color-mix(in srgb, ${lightSky} ${100 - blend}%, ${darkSky})`,
    );
  }

  private cancel(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = 0;
    }
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
}
