import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface TrendBar {
  date: string;
  amount: number;
  label: string;
}

@Component({
  selector: 'app-trend-bars',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, RouterLink],
  template: `
    <div class="trend" role="img" [attr.aria-label]="ariaLabel()">
      <div class="bars">
        @for (bar of scaledBars(); track bar.date) {
          <a
            class="bar-col"
            [routerLink]="['/transactions']"
            [queryParams]="{ date: bar.date, mois: month() }"
            [attr.aria-label]="bar.label + ' : ' + bar.amount + ' euros'"
          >
            <span
              class="bar"
              [style.height.%]="bar.heightPercent"
              [style.--bar-color]="barColor()"
              [class.empty]="bar.amount <= 0"
            ></span>
            <span class="day">{{ bar.dayLabel }}</span>
          </a>
        }
      </div>
      @if (peakAmount() > 0) {
        <p class="peak">
          Pic :
          <app-amount [value]="peakAmount()" size="sm" />
        </p>
      }
    </div>
  `,
  styles: `
    .trend {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .bars {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 120px;
      overflow-x: auto;
      padding-bottom: 2px;
    }
    .bar-col {
      flex: 1 0 10px;
      min-width: 10px;
      max-width: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: inherit;
    }
    .bar {
      width: 100%;
      min-height: 2px;
      border-radius: 3px 3px 0 0;
      background: var(--bar-color, var(--accent));
      transition: opacity 0.15s ease;
    }
    .bar.empty {
      background: var(--line);
      opacity: 0.5;
    }
    @media (hover: hover) {
      .bar-col:hover .bar:not(.empty) {
        opacity: 0.75;
      }
    }
    .day {
      font-size: 9px;
      font-weight: 600;
      color: var(--ink-faint);
      line-height: 1;
    }
    .peak {
      margin: 0;
      font-size: 12.5px;
      color: var(--ink-soft);
      display: flex;
      align-items: center;
      gap: 6px;
    }
  `,
})
export class TrendBarsComponent {
  readonly bars = input.required<TrendBar[]>();
  readonly month = input.required<string>();
  readonly kind = input<'expense' | 'income' | 'net' | 'worth'>('expense');

  protected readonly peakAmount = computed(() =>
    this.bars().reduce((peak, bar) => Math.max(peak, bar.amount), 0),
  );

  protected readonly scaledBars = computed(() => {
    const bars = this.bars();
    if (this.kind() === 'net' || this.kind() === 'worth') {
      const amounts = bars.map((bar) => bar.amount);
      const maxAmount = Math.max(...amounts, 0);
      const minAmount = Math.min(...amounts, 0);
      const range = Math.max(maxAmount - minAmount, 1);
      return bars.map((bar) => ({
        ...bar,
        dayLabel: String(Number.parseInt(bar.date.slice(8, 10), 10)),
        heightPercent: Math.max(((bar.amount - minAmount) / range) * 100, bar.amount !== 0 ? 8 : 2),
      }));
    }

    const peak = this.peakAmount();
    return bars.map((bar) => ({
      ...bar,
      dayLabel: String(Number.parseInt(bar.date.slice(8, 10), 10)),
      heightPercent: peak > 0 ? Math.max((bar.amount / peak) * 100, bar.amount > 0 ? 8 : 2) : 2,
    }));
  });

  protected readonly ariaLabel = computed(() => {
    const kindLabel =
      this.kind() === 'income'
        ? 'revenus'
        : this.kind() === 'net'
          ? 'solde cumulé'
          : this.kind() === 'worth'
            ? 'patrimoine'
            : 'dépenses';
    return `Évolution des ${kindLabel} par jour`;
  });

  protected barColor(): string {
    if (this.kind() === 'income') {
      return 'var(--mist-deep)';
    }
    if (this.kind() === 'worth') {
      return 'var(--mist-deep)';
    }
    if (this.kind() === 'net') {
      return 'var(--sand)';
    }
    return 'var(--accent)';
  }
}
