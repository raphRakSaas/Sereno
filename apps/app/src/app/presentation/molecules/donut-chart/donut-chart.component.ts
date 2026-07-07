import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface DonutSlice {
  id: string;
  name: string;
  color: string;
  amount: number;
}

interface Arc extends DonutSlice {
  dasharray: string;
  dashoffset: number;
  share: number;
}

/* Répartition en anneau : aplats nets, écarts de 2 px en couleur de surface
   entre les parts (jamais de contour), total au centre, légende toujours
   présente. Au-delà de 7 catégories, la traîne est repliée dans « Autres »
   (on n'invente jamais de teinte supplémentaire). */

const R = 60;
const STROKE = 26;
const CIRC = 2 * Math.PI * R;
const GAP = 2.5;
const MAX_SLICES = 7;
const OTHER_COLOR = '#77807a';

@Component({
  selector: 'app-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, DecimalPipe],
  template: `
    <div class="donut">
      <div class="ring">
        <svg viewBox="0 0 160 160" role="img" [attr.aria-label]="ariaLabel()">
          @for (arc of arcs(); track arc.id) {
            <circle
              class="slice"
              [class.dimmed]="hovered() !== null && hovered() !== arc.id"
              cx="80"
              cy="80"
              [attr.r]="R"
              fill="none"
              [style.stroke]="'color-mix(in srgb, ' + arc.color + ' var(--data-mix, 100%), white)'"
              [attr.stroke-width]="STROKE"
              [attr.stroke-dasharray]="arc.dasharray"
              [attr.stroke-dashoffset]="arc.dashoffset"
              (mouseenter)="hovered.set(arc.id)"
              (mouseleave)="hovered.set(null)"
            >
              <title>{{ arc.name }} : {{ arc.share * 100 | number: '1.0-0' }} %</title>
            </circle>
          }
        </svg>
        <div class="center" aria-hidden="true">
          <span class="center-label">{{ centerLabel() }}</span>
          <app-amount [value]="total()" [currency]="currency()" size="lg" />
        </div>
      </div>

      <ul class="legend" [class.hidden]="!showLegend()">
        @for (arc of arcs(); track arc.id) {
          <li
            [class.dimmed]="hovered() !== null && hovered() !== arc.id"
            (mouseenter)="hovered.set(arc.id)"
            (mouseleave)="hovered.set(null)"
          >
            <span
              class="swatch"
              [style.background]="'color-mix(in srgb, ' + arc.color + ' var(--data-mix, 100%), white)'"
            ></span>
            <span class="name">{{ arc.name }}</span>
            <span class="share amount">{{ arc.share * 100 | number: '1.0-0' }} %</span>
            <app-amount [value]="arc.amount" [currency]="currency()" size="sm" />
          </li>
        }
      </ul>
    </div>
  `,
  styles: `
    .donut {
      display: flex;
      align-items: center;
      gap: var(--space-5);
      flex-wrap: wrap;
    }
    .ring {
      position: relative;
      width: 160px;
      height: 160px;
      flex: none;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .slice {
      transition: opacity 0.15s ease;
      cursor: default;
    }
    .slice.dimmed {
      opacity: 0.3;
    }
    .center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      pointer-events: none;
    }
    .center-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-soft);
    }
    .legend.hidden {
      display: none;
    }
    .legend {
      list-style: none;
      margin: 0;
      padding: 0;
      flex: 1;
      min-width: 200px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .legend li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 2px;
      border-radius: 8px;
      transition: opacity 0.15s ease;
    }
    .legend li.dimmed {
      opacity: 0.4;
    }
    .swatch {
      width: 12px;
      height: 12px;
      border-radius: 4px;
      flex: none;
    }
    .name {
      flex: 1;
      min-width: 0;
      font-size: 14.5px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .share {
      font-size: 13px;
      color: var(--ink-faint);
    }
  `,
})
export class DonutChartComponent {
  protected readonly R = R;
  protected readonly STROKE = STROKE;

  readonly slices = input.required<DonutSlice[]>();
  readonly currency = input('EUR');
  readonly centerLabel = input('Total');
  /** Masque la légende latérale (accueil compact). */
  readonly showLegend = input(true);

  protected readonly hovered = signal<string | null>(null);

  protected readonly total = computed(() =>
    this.slices().reduce((sum, slice) => sum + slice.amount, 0),
  );

  /** Tri décroissant, traîne repliée dans « Autres » (gris neutre). */
  private readonly folded = computed<DonutSlice[]>(() => {
    const sorted = [...this.slices()].sort((a, b) => b.amount - a.amount);
    if (sorted.length <= MAX_SLICES + 1) {
      return sorted;
    }
    const head = sorted.slice(0, MAX_SLICES);
    const tail = sorted.slice(MAX_SLICES);
    return [
      ...head,
      {
        id: '__other__',
        name: `Autres (${tail.length})`,
        color: OTHER_COLOR,
        amount: tail.reduce((sum, slice) => sum + slice.amount, 0),
      },
    ];
  });

  protected readonly arcs = computed<Arc[]>(() => {
    const total = this.total();
    if (total <= 0) {
      return [];
    }
    const parts = this.folded();
    // L'écart n'a de sens qu'entre deux parts : une part unique = anneau plein.
    const gap = parts.length > 1 ? GAP : 0;
    let offset = 0;
    return parts.map((slice) => {
      const share = slice.amount / total;
      const len = Math.max(share * CIRC - gap, 1);
      const arc: Arc = {
        ...slice,
        share,
        dasharray: `${len} ${CIRC - len}`,
        dashoffset: -offset,
      };
      offset += share * CIRC;
      return arc;
    });
  });

  protected readonly ariaLabel = computed(() => {
    const parts = this.folded()
      .map((slice) => `${slice.name} ${Math.round((slice.amount / this.total()) * 100)} %`)
      .join(', ');
    return `Répartition : ${parts}`;
  });
}
