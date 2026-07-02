import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '../../atoms/icon/icon.component';

function shiftMonth(month: string, delta: number): string {
  const d = new Date(month + 'T00:00:00');
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

@Component({
  selector: 'app-month-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IconComponent],
  template: `
    <div class="switcher">
      <button type="button" (click)="monthChange.emit(previous())" aria-label="Mois précédent">
        <app-icon name="chevron-left" [size]="20" />
      </button>
      <span class="label">{{ month() + 'T00:00:00' | date: 'MMMM yyyy' }}</span>
      <button
        type="button"
        (click)="monthChange.emit(next())"
        [disabled]="isCurrent()"
        aria-label="Mois suivant"
      >
        <app-icon name="chevron-right" [size]="20" />
      </button>
    </div>
  `,
  styles: `
    .switcher {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    button {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border: none;
      background: none;
      color: var(--ink-soft);
      border-radius: 999px;
      cursor: pointer;
    }
    button:disabled {
      color: var(--line);
      cursor: default;
    }
    .label {
      font-size: 15px;
      font-weight: 600;
      min-width: 118px;
      text-align: center;
      text-transform: capitalize;
    }
  `,
})
export class MonthSwitcherComponent {
  /** Mois affiché, format `yyyy-MM-01`. */
  readonly month = input.required<string>();
  readonly monthChange = output<string>();

  protected readonly previous = computed(() => shiftMonth(this.month(), -1));
  protected readonly next = computed(() => shiftMonth(this.month(), 1));
  protected readonly isCurrent = computed(() => {
    const now = new Date();
    return this.month() >= `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  });
}
