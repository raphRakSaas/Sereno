import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppModeService } from '../../../application/services/app-mode.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { BudgetsStore } from '../../../application/stores/budgets.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import {
  Budget,
  GLOBAL_BUDGET_CATEGORY_ID,
  isGlobalBudget,
  monthOf,
} from '../../../domain/models/budget.model';
import { Category } from '../../../domain/models/category.model';
import { daysInMonth } from '../../../domain/utils/period.utils';
import {
  compareMonthTotals,
  dailyTotalsByType,
  filterTransactionsForPeriod,
  monthlyTotalsSeries,
  savingsRatePercent,
  sumByType,
  topCategories,
} from '../../../domain/utils/stats.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { CategoryIconComponent } from '../../atoms/category-icon/category-icon.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { BarChartComponent } from '../../molecules/bar-chart/bar-chart.component';
import { DonutChartComponent } from '../../molecules/donut-chart/donut-chart.component';
import { LineChartComponent } from '../../molecules/line-chart/line-chart.component';
import { MonthHeatmapComponent } from '../../molecules/month-heatmap/month-heatmap.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { StrataGhostComponent } from '../../molecules/strata-ghost/strata-ghost.component';

const HISTORY_MONTHS = 6;

function formatDeltaText(delta: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(Math.abs(delta));
  if (delta > 0) {
    return `+${formatted} vs mois dernier`;
  }
  if (delta < 0) {
    return `−${formatted} vs mois dernier`;
  }
  return 'Identique au mois dernier';
}

interface BudgetStatLine {
  budget: Budget;
  category: Category | undefined;
  label: string;
  spent: number;
  ratio: number;
  fillPercent: number;
  isOver: boolean;
  remaining: number;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-statistics-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    BarChartComponent,
    CategoryIconComponent,
    DatePipe,
    DonutChartComponent,
    IconComponent,
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
  protected readonly budgets = inject(BudgetsStore);
  protected readonly mode = inject(AppModeService);

  protected readonly month = signal(monthOf(new Date()));

  constructor() {
    effect(() => {
      const selectedMonth = this.month();
      if (this.mode.isCloud()) {
        void this.budgets.load(selectedMonth);
      }
    });
  }

  protected readonly monthDays = computed(() => daysInMonth(this.month()));

  protected readonly scopedTransactions = computed(() =>
    filterTransactionsForPeriod(this.transactions.items(), this.month(), null),
  );

  protected readonly monthIncome = computed(() => sumByType(this.scopedTransactions(), 'income'));
  protected readonly monthExpense = computed(() => sumByType(this.scopedTransactions(), 'expense'));
  protected readonly monthNet = computed(() => this.monthIncome() - this.monthExpense());

  protected readonly savingsRate = computed(() =>
    savingsRatePercent(this.monthIncome(), this.monthExpense()),
  );

  protected readonly expenseComparison = computed(() =>
    compareMonthTotals(this.transactions.items(), this.month(), 'expense', null),
  );

  protected readonly incomeComparison = computed(() =>
    compareMonthTotals(this.transactions.items(), this.month(), 'income', null),
  );

  protected readonly netComparison = computed(() => {
    const income = this.incomeComparison();
    const expense = this.expenseComparison();
    return {
      current: income.current - expense.current,
      previous: income.previous - expense.previous,
      delta: income.current - expense.current - (income.previous - expense.previous),
    };
  });

  protected readonly expenseSlices = computed(() =>
    topCategories(this.scopedTransactions(), 'expense', this.categories.byId(), 12).map((line) => ({
      id: line.id,
      name: line.label,
      color: line.color ?? '#8B948C',
      amount: line.amount,
    })),
  );

  protected readonly monthlySeries = computed(() =>
    monthlyTotalsSeries(this.transactions.items(), this.month(), HISTORY_MONTHS, null),
  );

  protected readonly netBalanceSeries = computed(() =>
    this.monthlySeries().map((entry) => ({
      date: entry.month,
      amount: entry.net,
      label: entry.label,
    })),
  );

  protected readonly barGroups = computed(() =>
    this.monthlySeries().map((entry) => ({
      label: entry.label,
      income: entry.income,
      expense: entry.expense,
    })),
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

  protected readonly spentByCategory = computed(() => {
    const prefix = this.month().slice(0, 7);
    const byId = this.categories.byId();
    const sums = new Map<string, number>();
    let totalExpenses = 0;
    for (const transaction of this.transactions.items()) {
      if (transaction.type !== 'expense' || !transaction.categoryId || !transaction.date.startsWith(prefix)) {
        continue;
      }
      totalExpenses += transaction.amount;
      const category = byId.get(transaction.categoryId);
      const budgetKey = category?.parentId ?? transaction.categoryId;
      sums.set(budgetKey, (sums.get(budgetKey) ?? 0) + transaction.amount);
    }
    sums.set(GLOBAL_BUDGET_CATEGORY_ID, totalExpenses);
    return sums;
  });

  protected readonly budgetLines = computed<BudgetStatLine[]>(() => {
    const byId = this.categories.byId();
    const spent = this.spentByCategory();
    return this.budgets
      .items()
      .map((budget) => {
        const budgetKey = isGlobalBudget(budget) ? GLOBAL_BUDGET_CATEGORY_ID : budget.categoryId!;
        const used = spent.get(budgetKey) ?? 0;
        const ratio = budget.limitAmount > 0 ? used / budget.limitAmount : 0;
        const category = budget.categoryId ? byId.get(budget.categoryId) : undefined;
        return {
          budget,
          category,
          label: isGlobalBudget(budget) ? 'Budget global' : (category?.name ?? 'Catégorie'),
          spent: used,
          ratio,
          fillPercent: Math.min(ratio, 1) * 100,
          isOver: ratio > 1,
          remaining: budget.limitAmount - used,
          color: category?.color ?? 'var(--accent)',
          icon: category?.icon ?? 'wallet',
        };
      })
      .sort((left, right) => right.ratio - left.ratio);
  });

  protected readonly hasAccounts = computed(() => this.accounts.items().length > 0);
  protected readonly hasAnyActivity = computed(() =>
    this.monthlySeries().some((entry) => entry.income > 0 || entry.expense > 0),
  );
  protected readonly showBudgets = computed(() => this.mode.isCloud() && this.budgetLines().length > 0);

  protected readonly incomeDeltaText = computed(() => formatDeltaText(this.incomeComparison().delta));
  protected readonly expenseDeltaText = computed(() => formatDeltaText(this.expenseComparison().delta));
  protected readonly netDeltaText = computed(() => formatDeltaText(this.netComparison().delta));

  protected budgetStatusText(line: BudgetStatLine): string {
    const format = (value: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    if (line.remaining < 0) {
      return `Dépassé de ${format(-line.remaining)} — ça arrive`;
    }
    return `Reste ${format(line.remaining)}`;
  }

  protected deltaClass(delta: number, favorableWhenPositive: boolean): string {
    if (delta === 0) {
      return 'neutral';
    }
    const favorable = favorableWhenPositive ? delta > 0 : delta < 0;
    return favorable ? 'positive' : 'caution';
  }
}
