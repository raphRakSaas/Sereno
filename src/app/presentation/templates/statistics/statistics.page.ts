import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { monthOf } from '../../../domain/models/budget.model';
import { daysInMonth } from '../../../domain/utils/period.utils';
import {
  compareMonthTotals,
  cumulativeNetByDay,
  dailyTotalsByType,
  filterTransactionsForPeriod,
  rankedAccounts,
  sumByType,
  topCategories,
} from '../../../domain/utils/stats.util';
import {
  cumulativeNetWorthByDay,
  netWorthBeforeDate,
  totalNetWorth,
} from '../../../domain/utils/net-worth.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { DonutChartComponent } from '../../molecules/donut-chart/donut-chart.component';
import { LineChartComponent } from '../../molecules/line-chart/line-chart.component';
import { MonthHeatmapComponent } from '../../molecules/month-heatmap/month-heatmap.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { StrataGhostComponent } from '../../molecules/strata-ghost/strata-ghost.component';

function formatDeltaText(delta: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Math.abs(delta));
  if (delta > 0) {
    return `+${formatted} vs mois précédent`;
  }
  if (delta < 0) {
    return `−${formatted} vs mois précédent`;
  }
  return 'Identique au mois précédent';
}

@Component({
  selector: 'app-statistics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    DatePipe,
    DonutChartComponent,
    FormsModule,
    LineChartComponent,
    MonthHeatmapComponent,
    MonthSwitcherComponent,
    RouterLink,
    StrataGhostComponent,
  ],
  templateUrl: './statistics.page.html',
  styleUrl: './statistics.page.scss',
})
export class StatisticsPage {
  protected readonly categories = inject(CategoriesStore);
  protected readonly accounts = inject(AccountsStore);
  protected readonly transactions = inject(TransactionsStore);

  protected readonly month = signal(monthOf(new Date()));
  protected readonly accountFilter = signal<string | null>(null);

  protected readonly monthDays = computed(() => daysInMonth(this.month()));

  protected readonly scopedTransactions = computed(() =>
    filterTransactionsForPeriod(this.transactions.items(), this.month(), this.accountFilter()),
  );

  protected readonly monthIncome = computed(() => sumByType(this.scopedTransactions(), 'income'));
  protected readonly monthExpense = computed(() => sumByType(this.scopedTransactions(), 'expense'));
  protected readonly monthNet = computed(() => this.monthIncome() - this.monthExpense());

  protected readonly expenseComparison = computed(() =>
    compareMonthTotals(this.transactions.items(), this.month(), 'expense', this.accountFilter()),
  );

  protected readonly incomeComparison = computed(() =>
    compareMonthTotals(this.transactions.items(), this.month(), 'income', this.accountFilter()),
  );

  protected readonly expenseSlices = computed(() =>
    topCategories(this.scopedTransactions(), 'expense', this.categories.byId(), 12).map((line) => ({
      id: line.id,
      name: line.label,
      color: line.color ?? '#8B948C',
      amount: line.amount,
    })),
  );

  protected readonly incomeSlices = computed(() =>
    topCategories(this.scopedTransactions(), 'income', this.categories.byId(), 12).map((line) => ({
      id: line.id,
      name: line.label,
      color: line.color ?? '#8B948C',
      amount: line.amount,
    })),
  );

  protected readonly topExpenseCategories = computed(() =>
    topCategories(this.scopedTransactions(), 'expense', this.categories.byId(), 5),
  );

  protected readonly topIncomeCategories = computed(() =>
    topCategories(this.scopedTransactions(), 'income', this.categories.byId(), 5),
  );

  protected readonly topAccounts = computed(() =>
    rankedAccounts(this.scopedTransactions(), this.accounts.byId(), 5),
  );

  /** « 3 juillet » plutôt qu'une date ISO dans les infobulles et les axes. */
  private readonly dayFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  private dayLabel(date: string): string {
    return this.dayFormatter.format(new Date(date + 'T00:00:00'));
  }

  protected readonly dailyExpenses = computed(() =>
    dailyTotalsByType(this.scopedTransactions(), 'expense', this.monthDays()).map((entry) => ({
      date: entry.date,
      amount: entry.amount,
      label: this.dayLabel(entry.date),
    })),
  );

  protected readonly cumulativeNet = computed(() =>
    cumulativeNetByDay(this.scopedTransactions(), this.monthDays()).map((entry) => ({
      date: entry.date,
      amount: entry.amount,
      label: this.dayLabel(entry.date),
    })),
  );

  protected readonly netWorthSeries = computed(() =>
    cumulativeNetWorthByDay(
      this.accounts.items(),
      this.transactions.items(),
      this.monthDays(),
      this.accountFilter(),
    ).map((entry) => ({
      date: entry.date,
      amount: entry.amount,
      label: this.dayLabel(entry.date),
    })),
  );

  protected readonly currentNetWorth = computed(() =>
    totalNetWorth(this.accounts.items(), this.transactions.items(), this.accountFilter()),
  );

  protected readonly monthNetWorthDelta = computed(() => {
    const monthStart = this.month();
    const beforeMonth = totalNetWorth(
      this.accounts.items(),
      this.transactions.items(),
      this.accountFilter(),
    );
    const startOfMonth = netWorthBeforeDate(
      this.accounts.items(),
      this.transactions.items(),
      monthStart,
      this.accountFilter(),
    );
    return beforeMonth - startOfMonth;
  });

  protected readonly netWorthDeltaText = computed(() => formatDeltaText(this.monthNetWorthDelta()));


  protected readonly hasAccounts = computed(() => this.accounts.items().length > 0);
  protected readonly hasMonthActivity = computed(() => this.scopedTransactions().length > 0);

  protected readonly expenseDeltaText = computed(() => formatDeltaText(this.expenseComparison().delta));
  protected readonly incomeDeltaText = computed(() => formatDeltaText(this.incomeComparison().delta));

  protected activityQuery(categoryId: string): Record<string, string> {
    const query: Record<string, string> = { categorie: categoryId, mois: this.month() };
    const accountId = this.accountFilter();
    if (accountId) {
      query['compte'] = accountId;
    }
    return query;
  }

  protected accountActivityQuery(accountId: string): Record<string, string> {
    return { compte: accountId, mois: this.month() };
  }
}
