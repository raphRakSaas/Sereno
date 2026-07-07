import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ThemeTransitionService } from '../../../application/services/theme-transition.service';
import { UserPreferencesService } from '../../../application/services/user-preferences.service';
import { lerp, smoothstep } from '../../../domain/utils/theme-easing.util';

interface StarPoint {
  x: number;
  y: number;
  size: number;
  delay: number;
}

@Component({
  selector: 'app-sereno-sky',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="sky"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="preferences.isDark()"
      (click)="toggleRequested.emit()"
    >
      <svg class="scene" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <rect class="sky-fill" [attr.fill]="skyColor()" width="400" height="140" />

        @for (star of stars; track star.x) {
          <circle
            class="star"
            [attr.cx]="star.x"
            [attr.cy]="star.y"
            [attr.r]="star.size"
            [attr.opacity]="starOpacity(star.delay)"
            fill="#f4f1de"
          />
        }

        <circle class="sun" [attr.cx]="sunX()" [attr.cy]="sunY()" [attr.r]="sunRadius()" [attr.opacity]="sunOpacity()" fill="#f2c14e" />

        <g class="hills">
          <path [attr.d]="backHillPath" [attr.fill]="hillBackColor()" />
          <path [attr.d]="frontHillPath" [attr.fill]="hillFrontColor()" />
        </g>

        <g class="moon" [attr.opacity]="moonOpacity()">
          <circle [attr.cx]="moonX()" [attr.cy]="moonY()" r="13" fill="#eae6d6" />
          <circle [attr.cx]="moonMaskX()" [attr.cy]="moonY()" r="11" [attr.fill]="skyColor()" />
        </g>
      </svg>
    </button>
  `,
  styles: `
    :host {
      display: block;
    }

    .sky {
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .sky:focus-visible {
      outline: 2px solid var(--sage);
      outline-offset: 2px;
    }

    .scene {
      display: block;
      width: 100%;
      height: 148px;
    }

    .hills path {
      transition: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .scene * {
        transition: none !important;
      }
    }
  `,
})
export class SerenoSkyComponent {
  protected readonly preferences = inject(UserPreferencesService);
  private readonly themeTransition = inject(ThemeTransitionService);

  /** 0 = jour, 1 = nuit — synchronisé avec ThemeTransitionService. */
  readonly progress = input(0);

  readonly toggleRequested = output<void>();

  protected readonly stars: StarPoint[] = [
    { x: 52, y: 22, size: 1.2, delay: 0 },
    { x: 88, y: 16, size: 0.9, delay: 0.08 },
    { x: 118, y: 28, size: 1.1, delay: 0.14 },
    { x: 286, y: 18, size: 1, delay: 0.1 },
    { x: 318, y: 30, size: 0.8, delay: 0.18 },
    { x: 346, y: 14, size: 1.2, delay: 0.06 },
    { x: 372, y: 24, size: 0.9, delay: 0.16 },
  ];

  protected readonly backHillPath = 'M0 140 L0 78 L118 34 L210 68 L400 42 L400 140 Z';
  protected readonly frontHillPath = 'M0 140 L0 98 L156 62 L248 88 L400 72 L400 140 Z';

  protected readonly ariaLabel = computed(() =>
    this.preferences.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre',
  );

  protected readonly useLightenPath = computed(() => {
    if (this.themeTransition.animating()) {
      return !this.themeTransition.towardDark();
    }
    return this.progress() < 0.5;
  });

  protected readonly sunX = computed(() => {
    const themeProgress = this.progress();
    if (this.useLightenPath()) {
      return lerp(42, 200, 1 - themeProgress);
    }
    return lerp(200, 358, themeProgress);
  });
  protected readonly sunY = computed(() => {
    const themeProgress = this.progress();
    if (this.useLightenPath()) {
      return lerp(88, 34, 1 - themeProgress);
    }
    return lerp(34, 96, themeProgress);
  });
  protected readonly sunRadius = computed(() => lerp(15, 12, this.progress()));
  protected readonly sunOpacity = computed(() => {
    if (this.useLightenPath()) {
      return smoothstep(0.05, 0.55, 1 - this.progress());
    }
    return 1 - smoothstep(0.55, 0.95, this.progress());
  });

  protected readonly moonX = computed(() => {
    const themeProgress = this.progress();
    if (this.useLightenPath()) {
      return lerp(200, 372, 1 - themeProgress);
    }
    return lerp(28, 200, themeProgress);
  });
  protected readonly moonY = computed(() => {
    const themeProgress = this.progress();
    if (this.useLightenPath()) {
      return lerp(36, 104, 1 - themeProgress);
    }
    return lerp(104, 36, themeProgress);
  });
  protected readonly moonMaskX = computed(() => this.moonX() + 9);
  protected readonly moonOpacity = computed(() => smoothstep(0.08, 0.72, this.progress()));

  protected readonly skyColor = computed(() => this.mixHex('#d4e8f2', '#0e0f11', this.progress()));

  protected readonly hillBackColor = computed(() => this.mixHex('#6faf7b', '#2e4d3d', this.progress()));
  protected readonly hillFrontColor = computed(() => this.mixHex('#5a9a66', '#1e3328', this.progress()));

  protected starOpacity(delay: number): number {
    const themeProgress = this.progress();
    const base = smoothstep(0.35, 0.9, themeProgress);
    return Math.max(0, base - delay) * 0.85;
  }

  private mixHex(light: string, dark: string, amount: number): string {
    const lightChannels = this.parseHex(light);
    const darkChannels = this.parseHex(dark);
    const red = Math.round(lerp(lightChannels.red, darkChannels.red, amount));
    const green = Math.round(lerp(lightChannels.green, darkChannels.green, amount));
    const blue = Math.round(lerp(lightChannels.blue, darkChannels.blue, amount));
    return `rgb(${red} ${green} ${blue})`;
  }

  private parseHex(hex: string): { red: number; green: number; blue: number } {
    const normalized = hex.replace('#', '');
    return {
      red: Number.parseInt(normalized.slice(0, 2), 16),
      green: Number.parseInt(normalized.slice(2, 4), 16),
      blue: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }
}
