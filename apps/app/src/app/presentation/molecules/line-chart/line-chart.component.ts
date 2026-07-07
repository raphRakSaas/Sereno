import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface LinePoint {
  date: string;
  amount: number;
  label: string;
}

/* Courbe calme : ligne 2 px, aplat de la même teinte à ~10 %, point de fin
   cerclé de surface, ligne de base zéro en filet. Le survol pose un repère
   vertical et une infobulle — jamais un chiffre sur chaque point. */

const W = 600;
const H = 160;
const PAD = 8;

@Component({
  selector: 'app-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent],
  template: `
    <div
      class="chart"
      (mousemove)="onMove($event)"
      (mouseleave)="hoverIndex.set(null)"
      (touchstart)="onTouch($event)"
      (touchmove)="onTouch($event)"
    >
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" role="img" [attr.aria-label]="ariaLabel()">
        @if (zeroY() !== null) {
          <line class="baseline" x1="0" [attr.y1]="zeroY()" [attr.x2]="W" [attr.y2]="zeroY()" />
        }
        <path class="area" [attr.d]="areaPath()" [style.fill]="'var(--' + hue() + ')'" />
        <path class="stroke" [attr.d]="linePath()" [style.stroke]="'var(--' + hue() + ')'" />
      </svg>

      @if (hoverPoint(); as hover) {
        <span class="cursor" [style.left.%]="hover.xPercent" aria-hidden="true"></span>
        <span class="dot hover-dot" [style.left.%]="hover.xPercent" [style.top.%]="hover.yPercent" [style.background]="'var(--' + hue() + ')'"></span>
        <div class="tooltip" [style.left.%]="hover.xPercent" [class.flip]="hover.xPercent > 62">
          <span class="tooltip-day">{{ hover.label }}</span>
          <app-amount [value]="hover.amount" [currency]="currency()" size="sm" />
        </div>
      } @else if (endPoint(); as end) {
        <span class="dot" [style.left.%]="end.xPercent" [style.top.%]="end.yPercent" [style.background]="'var(--' + hue() + ')'" aria-hidden="true"></span>
      }
    </div>

    <div class="axis" [class.all-labels]="showAllLabels()" aria-hidden="true">
      @if (showAllLabels()) {
        @for (point of points(); track point.date) {
          <span>{{ point.label }}</span>
        }
      } @else {
        <span>{{ firstDay() }}</span>
        <span>{{ lastDay() }}</span>
      }
    </div>

    @if (endPoint(); as end) {
      <p class="reading">
        {{ endLabel() }}
        <app-amount [value]="end.amount" [currency]="currency()" size="sm" />
      </p>
    }
  `,
  styles: `
    .chart {
      position: relative;
      height: 150px;
      touch-action: pan-y;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .stroke {
      fill: none;
      stroke-width: 2px;
      stroke-linejoin: round;
      stroke-linecap: round;
      vector-effect: non-scaling-stroke;
    }
    .area {
      opacity: 0.1;
    }
    .baseline {
      stroke: var(--line);
      stroke-width: 1px;
      vector-effect: non-scaling-stroke;
    }
    .dot {
      position: absolute;
      width: 9px;
      height: 9px;
      border-radius: 999px;
      border: 2px solid var(--surface);
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
    .cursor {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--line);
      pointer-events: none;
    }
    .tooltip {
      position: absolute;
      top: -4px;
      transform: translateX(8px);
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 5px 10px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: 8px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 2;
    }
    .tooltip.flip {
      transform: translateX(calc(-100% - 8px));
    }
    .tooltip-day {
      font-size: 12.5px;
      color: var(--ink-soft);
    }
    .axis {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 12px;
      color: var(--ink-faint);
    }
    .axis.all-labels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
      text-align: center;
      text-transform: capitalize;
    }
    .reading {
      margin: var(--space-3) 0 0;
      font-size: 13px;
      color: var(--ink-soft);
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
  `,
})
export class LineChartComponent {
  protected readonly W = W;
  protected readonly H = H;

  readonly points = input.required<LinePoint[]>();
  readonly currency = input('EUR');
  /** Teinte : un nom de token (mist-deep, sage…) — la couleur suit la série. */
  readonly hue = input('mist-deep');
  readonly endLabel = input('Fin de mois :');
  readonly zeroBaseline = input(false);
  /** Affiche chaque libellé sous l'axe (séries mensuelles). */
  readonly showAllLabels = input(false);

  protected readonly hoverIndex = signal<number | null>(null);

  private readonly domain = computed(() => {
    const values = this.points().map((point) => point.amount);
    let min = Math.min(...values);
    let max = Math.max(...values);
    if (this.zeroBaseline()) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }
    if (min === max) {
      // Série plate : on donne un peu d'air pour que la ligne reste au milieu.
      min -= 1;
      max += 1;
    }
    return { min, max };
  });

  private x(index: number): number {
    const count = this.points().length;
    return count <= 1 ? W / 2 : (index / (count - 1)) * W;
  }

  private y(value: number): number {
    const { min, max } = this.domain();
    return PAD + (1 - (value - min) / (max - min)) * (H - PAD * 2);
  }

  protected readonly linePath = computed(() =>
    this.points()
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${this.x(index).toFixed(1)} ${this.y(point.amount).toFixed(1)}`)
      .join(' '),
  );

  protected readonly areaPath = computed(() => {
    const points = this.points();
    if (points.length === 0) {
      return '';
    }
    const floor = this.zeroBaseline() ? this.y(0) : H - PAD;
    return `${this.linePath()} L${W} ${floor.toFixed(1)} L0 ${floor.toFixed(1)} Z`;
  });

  protected readonly zeroY = computed(() => {
    if (!this.zeroBaseline()) {
      return null;
    }
    return +this.y(0).toFixed(1);
  });

  private pointAt(index: number) {
    const point = this.points()[index];
    return {
      ...point,
      xPercent: (this.x(index) / W) * 100,
      yPercent: (this.y(point.amount) / H) * 100,
    };
  }

  protected readonly endPoint = computed(() => {
    const count = this.points().length;
    return count === 0 ? null : this.pointAt(count - 1);
  });

  protected readonly hoverPoint = computed(() => {
    const index = this.hoverIndex();
    return index === null ? null : this.pointAt(index);
  });

  protected readonly firstDay = computed(() => this.points()[0]?.label ?? '');
  protected readonly lastDay = computed(() => this.points().at(-1)?.label ?? '');

  protected readonly ariaLabel = computed(() => {
    const end = this.endPoint();
    return end ? `Courbe du mois, dernière valeur ${end.amount} euros` : 'Courbe du mois';
  });

  protected onMove(event: MouseEvent): void {
    this.setHoverFromX(event.clientX, event.currentTarget as HTMLElement);
  }

  protected onTouch(event: TouchEvent): void {
    const touch = event.touches[0];
    if (touch) {
      this.setHoverFromX(touch.clientX, event.currentTarget as HTMLElement);
    }
  }

  private setHoverFromX(clientX: number, host: HTMLElement): void {
    const rect = host.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    this.hoverIndex.set(Math.round(ratio * (this.points().length - 1)));
  }
}
