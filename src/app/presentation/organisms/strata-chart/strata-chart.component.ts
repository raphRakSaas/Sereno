import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface StrataSlice {
  id: string;
  name: string;
  color: string;
  amount: number;
}

interface Layer extends StrataSlice {
  y: number;
  height: number;
  share: number;
  index: number;
}

/* L'élément signature de Sereno : la répartition des dépenses vue comme des
   strates de sédiment. La plus grosse dépense forme le socle, l'épaisseur de
   chaque couche est sa part du total. Les couches se déposent à l'arrivée
   (40 ms d'écart, du socle vers la surface). */

const CHART_H = 224;
const LAYER_W = 96;
const GAP = 2;
const MIN_H = 9;

@Component({
  selector: 'app-strata-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, DecimalPipe],
  template: `
    <div class="strata">
      <svg
        [attr.width]="svgWidth"
        [attr.height]="chartHeight"
        [attr.viewBox]="'0 0 ' + svgWidth + ' ' + chartHeight"
        role="img"
        [attr.aria-label]="ariaLabel()"
      >
        @for (layer of layers(); track layer.id) {
          <rect
            class="layer"
            [class.dimmed]="selected() !== null && selected() !== layer.id"
            [class.selected]="selected() === layer.id"
            [attr.x]="0"
            [attr.y]="layer.y"
            [attr.width]="LAYER_W"
            [attr.height]="layer.height"
            rx="3"
            [attr.fill]="layer.color"
            [style.animation-delay.ms]="layer.index * 40"
            (click)="toggle(layer.id)"
            (keydown.enter)="toggle(layer.id)"
            (keydown.space)="toggle(layer.id); $event.preventDefault()"
            tabindex="0"
            role="button"
            [attr.aria-pressed]="selected() === layer.id"
            [attr.aria-label]="layer.name + ' : ' + (layer.share * 100).toFixed(0) + ' %'"
          />
        }
      </svg>

      <ul class="legend">
        @for (layer of layers(); track layer.id) {
          <li>
            <button
              type="button"
              [class.active]="selected() === layer.id"
              [class.dimmed]="selected() !== null && selected() !== layer.id"
              (click)="toggle(layer.id)"
            >
              <span class="swatch" [style.background]="layer.color"></span>
              <span class="name">{{ layer.name }}</span>
              <span class="share amount">{{ layer.share * 100 | number: '1.0-0' }} %</span>
              <app-amount [value]="layer.amount" [currency]="currency()" size="sm" />
            </button>
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .strata {
      display: flex;
      gap: var(--space-4);
      align-items: flex-end;
    }
    svg {
      flex: none;
      overflow: visible;
    }
    .layer {
      cursor: pointer;
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
      animation: settle 0.3s ease-out backwards;
      outline-offset: 3px;
    }
    .layer.dimmed {
      opacity: 0.32;
    }
    .layer.selected {
      transform: translateX(6px);
    }
    @keyframes settle {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .legend {
      list-style: none;
      margin: 0;
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .legend button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 7px 8px;
      background: none;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      color: var(--ink);
      transition: opacity 0.2s ease;
      min-width: 0;
    }
    .legend button.active {
      background: var(--sage-pale);
    }
    .legend button.dimmed {
      opacity: 0.45;
    }
    .swatch {
      flex: none;
      width: 10px;
      height: 10px;
      border-radius: 3px;
    }
    .name {
      font-size: 13.5px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
      flex: 1;
      text-align: left;
    }
    .share {
      font-size: 12px;
      color: var(--ink-faint);
      flex: none;
    }
    app-amount {
      flex: none;
    }
  `,
})
export class StrataChartComponent {
  readonly slices = input.required<StrataSlice[]>();
  readonly currency = input('EUR');
  /** Contexte pour lecteurs d'écran, ex. "juillet 2026". */
  readonly caption = input('');

  protected readonly LAYER_W = LAYER_W;
  protected readonly svgWidth = LAYER_W + 6;
  protected readonly chartHeight = CHART_H;

  protected readonly selected = signal<string | null>(null);

  protected readonly layers = computed<Layer[]>(() => {
    const sorted = [...this.slices()].filter((s) => s.amount > 0).sort((a, b) => b.amount - a.amount);
    const total = sorted.reduce((sum, s) => sum + s.amount, 0);
    if (total <= 0) {
      return [];
    }
    const available = CHART_H - GAP * Math.max(sorted.length - 1, 0);
    // Épaisseur proportionnelle, avec un minimum lisible ; on renormalise les
    // couches libres pour que la pile remplisse exactement la hauteur.
    let heights = sorted.map((s) => (s.amount / total) * available);
    for (let pass = 0; pass < 4; pass++) {
      const clampedSum = heights.filter((h) => h <= MIN_H).reduce((sum) => sum + MIN_H, 0);
      const freeSum = heights.filter((h) => h > MIN_H).reduce((sum, h) => sum + h, 0);
      const scale = freeSum > 0 ? (available - clampedSum) / freeSum : 1;
      heights = heights.map((h) => (h <= MIN_H ? MIN_H : h * scale));
    }
    // Le socle (plus gros montant) en bas : on empile depuis le bas du SVG.
    let y = CHART_H;
    return sorted.map((s, i) => {
      const height = heights[i];
      y -= height;
      const layer: Layer = { ...s, y, height, share: s.amount / total, index: i };
      y -= GAP;
      return layer;
    });
  });

  protected readonly ariaLabel = computed(() => {
    const parts = this.layers()
      .map((l) => `${l.name} ${(l.share * 100).toFixed(0)} %`)
      .join(', ');
    return `Répartition des dépenses${this.caption() ? ' — ' + this.caption() : ''} : ${parts}`;
  });

  protected toggle(id: string): void {
    this.selected.update((current) => (current === id ? null : id));
  }
}
