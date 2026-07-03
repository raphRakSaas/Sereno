import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface HeatDay {
  date: string;
  amount: number;
  label: string;
}

interface HeatCell extends HeatDay {
  day: number;
  level: number;
  title: string;
}

/* Calendrier de chaleur du mois : une case par jour, une seule teinte (sauge)
   du clair au foncé — plus la journée a dépensé, plus la case est profonde.
   Toucher une case ouvre l'activité du jour. Séquentiel = magnitude, jamais
   d'arc-en-ciel. */
@Component({
  selector: 'app-month-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, RouterLink],
  template: `
    <div class="heatmap" role="img" [attr.aria-label]="ariaLabel()">
      <div class="weekdays" aria-hidden="true">
        @for (weekday of weekdays; track $index) {
          <span>{{ weekday }}</span>
        }
      </div>
      <div class="grid">
        @for (blank of blanks(); track $index) {
          <span class="cell blank" aria-hidden="true"></span>
        }
        @for (cell of cells(); track cell.date) {
          <a
            class="cell"
            [class.quiet]="cell.level === 0"
            [attr.data-level]="cell.level"
            [routerLink]="['/transactions']"
            [queryParams]="{ date: cell.date, mois: month() }"
            [attr.aria-label]="cell.title"
            [title]="cell.title"
          >
            {{ cell.day }}
          </a>
        }
      </div>
      <div class="scale" aria-hidden="true">
        <span>Moins</span>
        <span class="step" data-level="1"></span>
        <span class="step" data-level="2"></span>
        <span class="step" data-level="3"></span>
        <span class="step" data-level="4"></span>
        <span>Plus</span>
      </div>
      @if (peak(); as peakCell) {
        <p class="reading">
          Journée la plus dense : {{ peakCell.label }} —
          <app-amount [value]="peakCell.amount" [currency]="currency()" size="sm" />
        </p>
      }
    </div>
  `,
  styles: `
    .heatmap {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .weekdays,
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }
    .weekdays span {
      text-align: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--ink-faint);
    }
    .cell {
      aspect-ratio: 1;
      display: grid;
      place-items: center;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 500;
      text-decoration: none;
      color: var(--ink-soft);
      font-feature-settings: 'tnum';
    }
    .cell.blank {
      background: none;
    }
    .cell.quiet {
      background: var(--paper);
      color: var(--ink-faint);
    }
    .cell[data-level='1'] {
      background: color-mix(in srgb, var(--sage) 16%, var(--surface));
    }
    .cell[data-level='2'] {
      background: color-mix(in srgb, var(--sage) 36%, var(--surface));
    }
    .cell[data-level='3'] {
      background: color-mix(in srgb, var(--sage) 62%, var(--surface));
      color: var(--surface);
    }
    .cell[data-level='4'] {
      background: color-mix(in srgb, var(--sage) 88%, var(--surface));
      color: var(--surface);
    }
    .cell:not(.blank):active {
      outline: 2px solid var(--sage);
      outline-offset: 1px;
    }
    .scale {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11.5px;
      color: var(--ink-faint);
      margin-top: 2px;
    }
    .scale .step {
      width: 14px;
      height: 14px;
      border-radius: 4px;
    }
    .scale .step[data-level='1'] {
      background: color-mix(in srgb, var(--sage) 16%, var(--surface));
    }
    .scale .step[data-level='2'] {
      background: color-mix(in srgb, var(--sage) 36%, var(--surface));
    }
    .scale .step[data-level='3'] {
      background: color-mix(in srgb, var(--sage) 62%, var(--surface));
    }
    .scale .step[data-level='4'] {
      background: color-mix(in srgb, var(--sage) 88%, var(--surface));
    }
    .reading {
      margin: var(--space-2) 0 0;
      font-size: 13px;
      color: var(--ink-soft);
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-wrap: wrap;
    }
  `,
})
export class MonthHeatmapComponent {
  protected readonly weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  readonly days = input.required<HeatDay[]>();
  readonly month = input.required<string>();
  readonly currency = input('EUR');

  private readonly formatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  });

  private readonly max = computed(() =>
    this.days().reduce((peak, day) => Math.max(peak, day.amount), 0),
  );

  /** Cases vides avant le 1ᵉʳ du mois (semaine qui commence le lundi). */
  protected readonly blanks = computed(() => {
    const first = this.days()[0];
    if (!first) {
      return [];
    }
    const weekday = new Date(first.date + 'T00:00:00').getDay();
    return Array.from({ length: (weekday + 6) % 7 });
  });

  protected readonly cells = computed<HeatCell[]>(() => {
    const max = this.max();
    return this.days().map((day) => {
      const ratio = max > 0 ? day.amount / max : 0;
      const level = ratio === 0 ? 0 : ratio <= 0.25 ? 1 : ratio <= 0.5 ? 2 : ratio <= 0.75 ? 3 : 4;
      return {
        ...day,
        day: Number(day.date.slice(8, 10)),
        level,
        title:
          day.amount > 0
            ? `${day.label} — ${this.formatter.format(day.amount)}`
            : `${day.label} — aucune dépense`,
      };
    });
  });

  protected readonly peak = computed(() => {
    const max = this.max();
    if (max <= 0) {
      return null;
    }
    return this.cells().find((cell) => cell.amount === max) ?? null;
  });

  protected readonly ariaLabel = computed(
    () => `Calendrier des dépenses du mois, jour le plus dense : ${this.peak()?.title ?? 'aucun'}`,
  );
}
