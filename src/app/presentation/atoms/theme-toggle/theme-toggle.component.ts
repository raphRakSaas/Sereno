import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { UserPreferencesService } from '../../../application/services/user-preferences.service';

@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.compact]': 'compact()',
  },
  template: `
    <button
      type="button"
      class="switch"
      role="switch"
      [class.is-dark]="preferences.isDark()"
      [attr.aria-checked]="preferences.isDark()"
      [attr.aria-label]="preferences.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'"
      (click)="preferences.toggleTheme()"
    >
      <span class="track" aria-hidden="true">
        @for (star of stars; track star.index) {
          <span
            class="star"
            [style.left.%]="star.left"
            [style.top.%]="star.top"
            [style.--star-size.px]="star.size"
            [style.--star-delay]="star.delay + 'ms'"
          ></span>
        }
      </span>

      <span class="knob" aria-hidden="true">
        <span class="sun">
          @for (ray of sunRays; track ray) {
            <span class="ray" [style.--ray-angle]="ray + 'deg'"></span>
          }
        </span>
        <span class="moon"></span>
      </span>
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      /* Dimensions paramétrables : la variante compacte (côté nav) réduit tout
         proportionnellement via ces variables. */
      --sw-w: 62px;
      --sw-h: 32px;
      --sw-knob: 24px;
    }

    :host(.compact) {
      --sw-w: 50px;
      --sw-h: 26px;
      --sw-knob: 20px;
    }

    .switch {
      position: relative;
      width: var(--sw-w);
      height: var(--sw-h);
      padding: 0;
      border: 1px solid color-mix(in srgb, var(--ink) 8%, transparent);
      border-radius: 999px;
      cursor: pointer;
      overflow: hidden;
      background: #bcd7e6;
      transition: background-color 0.55s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .switch.is-dark {
      background: #1b2a3a;
    }

    .switch:active {
      transform: scale(0.97);
    }

    .switch:focus-visible {
      outline: 2px solid var(--sage);
      outline-offset: 2px;
    }

    .track {
      position: absolute;
      inset: 0;
    }

    .star {
      position: absolute;
      width: var(--star-size, 3px);
      height: var(--star-size, 3px);
      border-radius: 999px;
      background: #f4f1de;
      opacity: 0;
      transform: scale(0.3);
      transition:
        opacity 0.4s ease,
        transform 0.4s ease;
      transition-delay: var(--star-delay, 0ms);
    }

    .switch.is-dark .star {
      opacity: 0.9;
      transform: scale(1);
      animation: twinkle 2.6s ease-in-out infinite;
      animation-delay: var(--star-delay, 0ms);
    }

    /* La pastille se déplace de gauche (jour) à droite (nuit). */
    .knob {
      position: absolute;
      top: calc((var(--sw-h) - var(--sw-knob)) / 2);
      left: calc((var(--sw-h) - var(--sw-knob)) / 2);
      width: var(--sw-knob);
      height: var(--sw-knob);
      transition: transform 0.55s cubic-bezier(0.34, 1.3, 0.5, 1);
    }

    .switch.is-dark .knob {
      transform: translateX(calc(var(--sw-w) - var(--sw-h)));
    }

    .sun,
    .moon {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      transition:
        opacity 0.4s ease,
        transform 0.55s cubic-bezier(0.34, 1.3, 0.5, 1);
    }

    /* Soleil : disque ambré + rayons courts. Se lève depuis la gauche. */
    .sun {
      background: #f2b33c;
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .switch.is-dark .sun {
      opacity: 0;
      transform: rotate(-40deg) scale(0.6);
    }

    .ray {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 2px;
      height: 4px;
      margin-left: -1px;
      margin-top: -1px;
      border-radius: 999px;
      background: #f2b33c;
      transform: rotate(var(--ray-angle)) translateY(calc(-1 * (var(--sw-knob) / 2 + 3px)));
      transform-origin: center 1px;
    }

    /* Lune : croissant obtenu par un disque décalé de la couleur du ciel de nuit. */
    .moon {
      background: #eae6d6;
      opacity: 0;
      transform: rotate(40deg) scale(0.6);
      overflow: hidden;
    }

    .switch.is-dark .moon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .moon::after {
      content: '';
      position: absolute;
      top: -2px;
      right: calc(-1 * var(--sw-knob) / 4.8);
      width: calc(var(--sw-knob) - 4px);
      height: calc(var(--sw-knob) - 4px);
      border-radius: 999px;
      background: #1b2a3a;
    }

    @keyframes twinkle {
      0%,
      100% {
        opacity: 0.4;
      }
      50% {
        opacity: 1;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .switch,
      .knob,
      .sun,
      .moon,
      .star {
        transition-duration: 0.01ms !important;
        animation: none !important;
      }
    }
  `,
})
export class ThemeToggleComponent {
  protected readonly preferences = inject(UserPreferencesService);

  /** Variante réduite (utilisée dans la barre latérale). */
  readonly compact = input(false);

  protected readonly sunRays = [0, 45, 90, 135, 180, 225, 270, 315];

  protected readonly stars = [
    { index: 0, left: 24, top: 28, size: 3, delay: 60 },
    { index: 1, left: 40, top: 22, size: 2, delay: 200 },
    { index: 2, left: 34, top: 52, size: 2.5, delay: 320 },
    { index: 3, left: 18, top: 58, size: 2, delay: 140 },
  ];
}
