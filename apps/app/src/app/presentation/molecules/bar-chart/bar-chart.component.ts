import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface BarGroup {
  label: string;
  income: number;
  expense: number;
}

/* Barres groupées revenus / dépenses : aplats nets, deux teintes par mois. */

const W = 600;
const H = 160;
const PAD_TOP = 12;
const PAD_BOTTOM = 4;

@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart" role="img" [attr.aria-label]="ariaLabel()">
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none">
        @for (bar of bars(); track bar.label) {
          <rect
            class="income"
            [attr.x]="bar.incomeX"
            [attr.y]="bar.incomeY"
            [attr.width]="bar.barWidth"
            [attr.height]="bar.incomeHeight"
          >
            <title>{{ bar.label }} — Revenus : {{ bar.income }}</title>
          </rect>
          <rect
            class="expense"
            [attr.x]="bar.expenseX"
            [attr.y]="bar.expenseY"
            [attr.width]="bar.barWidth"
            [attr.height]="bar.expenseHeight"
          >
            <title>{{ bar.label }} — Dépenses : {{ bar.expense }}</title>
          </rect>
        }
      </svg>
    </div>

    <div class="axis" aria-hidden="true">
      @for (group of groups(); track group.label) {
        <span>{{ group.label }}</span>
      }
    </div>
  `,
  styles: `
    .chart {
      height: 150px;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
    .income {
      fill: var(--income);
    }
    .expense {
      fill: var(--expense);
    }
    .axis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
      margin-top: 6px;
      font-size: 12px;
      color: var(--ink-faint);
      text-align: center;
      text-transform: capitalize;
    }
  `,
})
export class BarChartComponent {
  protected readonly W = W;
  protected readonly H = H;

  readonly groups = input.required<BarGroup[]>();

  private readonly maxValue = computed(() =>
    Math.max(...this.groups().flatMap((group) => [group.income, group.expense]), 1),
  );

  protected readonly bars = computed(() => {
    const groups = this.groups();
    const max = this.maxValue();
    const plotHeight = H - PAD_TOP - PAD_BOTTOM;
    const groupWidth = W / Math.max(groups.length, 1);
    const gap = 4;
    const barWidth = Math.max((groupWidth - gap * 3) / 2, 4);

    return groups.map((group, index) => {
      const center = groupWidth * index + groupWidth / 2;
      const incomeHeight = (group.income / max) * plotHeight;
      const expenseHeight = (group.expense / max) * plotHeight;
      const incomeX = center - gap / 2 - barWidth;
      const expenseX = center + gap / 2;
      const floor = H - PAD_BOTTOM;
      return {
        label: group.label,
        income: group.income,
        expense: group.expense,
        barWidth,
        incomeX,
        expenseX,
        incomeY: floor - incomeHeight,
        expenseY: floor - expenseHeight,
        incomeHeight: Math.max(incomeHeight, group.income > 0 ? 2 : 0),
        expenseHeight: Math.max(expenseHeight, group.expense > 0 ? 2 : 0),
      };
    });
  });

  protected readonly ariaLabel = computed(() => {
    const last = this.groups().at(-1);
    return last
      ? `Revenus et dépenses par mois, dernier mois : ${last.income} euros de revenus, ${last.expense} euros de dépenses`
      : 'Revenus et dépenses par mois';
  });
}
