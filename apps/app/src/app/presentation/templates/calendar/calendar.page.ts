import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserPreferencesService } from '../../../application/services/user-preferences.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { monthOf } from '../../../domain/models/budget.model';
import {
  dayActivityLevel,
  formatDayIntensity,
  summarizeCalendarDays,
  transactionsForDay,
} from '../../../domain/utils/calendar.util';
import {
  daysInMonth,
  daysInWeek,
  monthGridLeadingBlanks,
  toIsoDate,
  weekStartIso,
  weekdayLabels,
} from '../../../domain/utils/period.utils';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';

interface CalendarCell {
  date: string | null;
  expense: number;
  income: number;
  transactionCount: number;
  intensity: number;
  isToday: boolean;
  isSelected: boolean;
}

export type CalendarViewMode = 'month' | 'week';

@Component({
  selector: 'app-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    DatePipe,
    MonthSwitcherComponent,
    RouterLink,
    TransactionListItemComponent,
  ],
  templateUrl: './calendar.page.html',
  styleUrl: './calendar.page.scss',
})
export class CalendarPage {
  protected readonly categories = inject(CategoriesStore);
  protected readonly accounts = inject(AccountsStore);
  protected readonly transactions = inject(TransactionsStore);
  protected readonly preferences = inject(UserPreferencesService);

  protected readonly todayIso = toIsoDate(new Date());
  protected readonly month = signal(monthOf(new Date()));
  protected readonly selectedDate = signal<string | null>(toIsoDate(new Date()));
  protected readonly viewMode = signal<CalendarViewMode>('month');
  protected readonly weekStartDate = signal(
    weekStartIso(new Date(), this.preferences.weekStartsMonday()),
  );

  protected readonly weekdayLabels = computed(() =>
    weekdayLabels(this.preferences.weekStartsMonday()),
  );

  protected readonly monthDays = computed(() => daysInMonth(this.month()));

  protected readonly weekDays = computed(() => daysInWeek(this.weekStartDate()));

  protected readonly weekRangeLabel = computed(() => {
    const days = this.weekDays();
    const formatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
    const start = formatter.format(new Date(days[0] + 'T00:00:00'));
    const end = formatter.format(new Date(days[6] + 'T00:00:00'));
    return `${start} – ${end}`;
  });

  protected readonly scopedTransactions = computed(() => {
    if (this.viewMode() === 'week') {
      const daySet = new Set(this.weekDays());
      return this.transactions.items().filter((transaction) => daySet.has(transaction.date));
    }
    const prefix = this.month().slice(0, 7);
    return this.transactions.items().filter((transaction) => transaction.date.startsWith(prefix));
  });

  protected readonly activeDays = computed(() =>
    this.viewMode() === 'week' ? this.weekDays() : this.monthDays(),
  );

  protected readonly daySummaries = computed(() =>
    summarizeCalendarDays(this.scopedTransactions(), this.activeDays()),
  );

  protected readonly activityPeak = computed(() => {
    let peak = 0;
    for (const summary of this.daySummaries().values()) {
      peak = Math.max(peak, dayActivityLevel(summary));
    }
    return peak;
  });

  protected readonly gridCells = computed((): CalendarCell[] => {
    const selectedDate = this.selectedDate();
    const peak = this.activityPeak();
    const cells: CalendarCell[] = [];

    if (this.viewMode() === 'month') {
      const leadingBlanks = monthGridLeadingBlanks(this.month());
      for (let index = 0; index < leadingBlanks; index++) {
        cells.push({
          date: null,
          expense: 0,
          income: 0,
          transactionCount: 0,
          intensity: 0,
          isToday: false,
          isSelected: false,
        });
      }
    }

    for (const date of this.activeDays()) {
      const summary = this.daySummaries().get(date)!;
      cells.push({
        date,
        expense: summary.expense,
        income: summary.income,
        transactionCount: summary.transactionCount,
        intensity: formatDayIntensity(dayActivityLevel(summary), peak),
        isToday: date === this.todayIso,
        isSelected: date === selectedDate,
      });
    }

    return cells;
  });

  protected readonly selectedTransactions = computed(() => {
    const dateIso = this.selectedDate();
    if (!dateIso) {
      return [];
    }
    return transactionsForDay(this.scopedTransactions(), dateIso);
  });

  protected readonly selectedDayExpense = computed(() =>
    this.selectedTransactions()
      .filter((transaction) => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected readonly selectedDayIncome = computed(() =>
    this.selectedTransactions()
      .filter((transaction) => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  );

  protected setViewMode(mode: CalendarViewMode): void {
    this.viewMode.set(mode);
    if (mode === 'week') {
      const anchor = this.selectedDate() ?? this.todayIso;
      this.weekStartDate.set(weekStartIso(new Date(anchor + 'T00:00:00'), this.preferences.weekStartsMonday()));
    }
  }

  protected shiftWeek(delta: number): void {
    const start = new Date(this.weekStartDate() + 'T00:00:00');
    start.setDate(start.getDate() + delta * 7);
    this.weekStartDate.set(toIsoDate(start));
  }

  protected selectDay(dateIso: string): void {
    this.selectedDate.set(dateIso);
  }

  protected addTransactionQuery(): Record<string, string> {
    const dateIso = this.selectedDate() ?? this.todayIso;
    return { date: dateIso };
  }
}
