import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface CategoryDonutSlice {
  id: string;
  name: string;
  color: string;
  amount: number;
}

interface Arc {
  id: string;
  color: string;
  dasharray: string;
  dashoffset: number;
}

interface Callout {
  id: string;
  name: string;
  color: string;
  pct: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  xText: number;
  yText: number;
  align: 'left' | 'right';
}

/* Donut + légendes callout — visualisation signature de la page Statistiques
   (remplace le donut+légende latérale générique sur cet écran précis).
   Géométrie reprise du handoff : cercle 300×300, centre (150,150), angle 0°
   en haut, sens horaire, proportionnel au % cumulé — comme un conic-gradient
   CSS standard. Voir docs/DESIGN.md §Dataviz. */

const CX = 150;
const CY = 150;
const R = 68;
const STROKE = 34;
const CIRC = 2 * Math.PI * R;
const LINE_START = 90;
const LINE_END = 105;
const LABEL_R = 115;
const MAX_SLICES = 7;
const OTHER_COLOR = '#9A9DA6';

@Component({
  selector: 'app-category-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent],
  template: `
    <div class="donut-wrap">
      <svg viewBox="0 0 300 300" role="img" [attr.aria-label]="ariaLabel()">
        <g transform="rotate(-90 150 150)">
          @for (arc of arcs(); track arc.id) {
            <circle
              [attr.cx]="CX"
              [attr.cy]="CY"
              [attr.r]="R"
              fill="none"
              [style.stroke]="'color-mix(in srgb, ' + arc.color + ' var(--data-mix, 100%), white)'"
              [attr.stroke-width]="STROKE"
              [attr.stroke-dasharray]="arc.dasharray"
              [attr.stroke-dashoffset]="arc.dashoffset"
            />
          }
        </g>
        @for (callout of callouts(); track callout.id) {
          <line
            [attr.x1]="callout.x1"
            [attr.y1]="callout.y1"
            [attr.x2]="callout.x2"
            [attr.y2]="callout.y2"
            stroke="var(--line)"
            stroke-width="1.5"
          />
          <circle [attr.cx]="callout.x1" [attr.cy]="callout.y1" r="3.5" [attr.fill]="callout.color" />
        }
      </svg>

      <div class="center">
        <span class="center-label">Dépensé</span>
        <app-amount [value]="total()" size="md" />
      </div>

      @for (callout of callouts(); track callout.id) {
        <div
          class="callout"
          [style.left.px]="callout.xText"
          [style.top.px]="callout.yText"
          [style.text-align]="callout.align"
        >
          <div class="callout-name">{{ callout.name }}</div>
          <div class="callout-pct">{{ callout.pct }}&nbsp;%</div>
        </div>
      }
    </div>
  `,
  styles: `
    .donut-wrap {
      position: relative;
      width: 300px;
      height: 300px;
      margin: 0 auto;
    }
    svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .center {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 98px;
      height: 98px;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      background: var(--surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    .center-label {
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--ink-faint);
    }
    .callout {
      position: absolute;
      width: 78px;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .callout-name {
      font-size: 12px;
      font-weight: 700;
      color: var(--ink);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .callout-pct {
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-faint);
    }
  `,
})
export class CategoryDonutChartComponent {
  protected readonly CX = CX;
  protected readonly CY = CY;
  protected readonly R = R;
  protected readonly STROKE = STROKE;

  readonly slices = input.required<CategoryDonutSlice[]>();

  protected readonly total = computed(() => this.slices().reduce((sum, slice) => sum + slice.amount, 0));

  /** Tri décroissant, traîne repliée dans « Autres » au-delà de 7 catégories. */
  private readonly folded = computed<CategoryDonutSlice[]>(() => {
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

  private readonly slicesWithShare = computed(() => {
    const total = this.total();
    if (total <= 0) {
      return [];
    }
    let cumPct = 0;
    return this.folded().map((slice) => {
      const pct = (slice.amount / total) * 100;
      const startPct = cumPct;
      cumPct += pct;
      return { ...slice, pct: Math.round(pct), startPct, endPct: cumPct };
    });
  });

  protected readonly arcs = computed<Arc[]>(() => {
    const parts = this.slicesWithShare();
    const gap = parts.length > 1 ? 2.5 : 0;
    return parts.map((slice) => {
      const sharePct = slice.endPct - slice.startPct;
      const len = Math.max((sharePct / 100) * CIRC - gap, 1);
      return {
        id: slice.id,
        color: slice.color,
        dasharray: `${len} ${CIRC - len}`,
        dashoffset: -((slice.startPct / 100) * CIRC),
      };
    });
  });

  protected readonly callouts = computed<Callout[]>(() =>
    this.slicesWithShare().map((slice) => {
      const midPct = (slice.startPct + slice.endPct) / 2;
      const rad = (midPct / 100) * 2 * Math.PI;
      const sin = Math.sin(rad);
      const cos = Math.cos(rad);
      return {
        id: slice.id,
        name: slice.name,
        color: slice.color,
        pct: slice.pct,
        x1: CX + LINE_START * sin,
        y1: CY - LINE_START * cos,
        x2: CX + LINE_END * sin,
        y2: CY - LINE_END * cos,
        xText: CX + LABEL_R * sin,
        yText: CY - LABEL_R * cos,
        align: sin >= 0 ? 'left' : 'right',
      };
    }),
  );

  protected readonly ariaLabel = computed(() => {
    const total = this.total();
    if (total <= 0) return 'Répartition par catégorie';
    const parts = this.slicesWithShare()
      .map((slice) => `${slice.name} ${slice.pct} %`)
      .join(', ');
    return `Répartition par catégorie : ${parts}`;
  });
}
