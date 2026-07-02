import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppModeService } from '../../../application/services/app-mode.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { BudgetsStore } from '../../../application/stores/budgets.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { accountBalanceLines } from '../../../domain/utils/account-balance.util';
import { GLOBAL_BUDGET_CATEGORY_ID, isGlobalBudget, monthOf } from '../../../domain/models/budget.model';
import { Transaction } from '../../../domain/models/transaction.model';
import { isOnOrAfter, toIsoDate, weekStartIso } from '../../../domain/utils/period.utils';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';
import { StrataChartComponent, StrataSlice } from '../../organisms/strata-chart/strata-chart.component';

interface BudgetPreviewLine {
  categoryName: string;
  categoryColor: string;
  spent: number;
  limitAmount: number;
  ratio: number;
  fillPercent: number;
  statusText: string;
  isOver: boolean;
  isNear: boolean;
}

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    DatePipe,
    IconComponent,
    RouterLink,
    StrataChartComponent,
    TransactionListItemComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  protected readonly mode = inject(AppModeService);
  protected readonly accounts = inject(AccountsStore);
  protected readonly budgets = inject(BudgetsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);

  protected readonly today = new Date();
  protected readonly todayIso = toIsoDate(this.today);
  protected readonly month = monthOf(this.today);
  protected readonly weekStart = weekStartIso(this.today);

  ngOnInit(): void {
    if (this.mode.isCloud() && !this.budgets.loaded()) {
      void this.budgets.load(this.month);
    }
  }

  protected readonly totalBalance = computed(() =>
    accountBalanceLines(this.accounts.items(), this.transactions.items(), {
      hideArchived: true,
      hideExcludedFromTotal: true,
    }).reduce((sum, line) => sum + line.balance, 0),
  );

  protected readonly monthTransactions = computed(() =>
    this.filterByMonthPrefix(this.transactions.items(), this.month),
  );

  protected readonly monthIncome = computed(() => this.sumByType(this.monthTransactions(), 'income'));

  protected readonly monthExpense = computed(() => this.sumByType(this.monthTransactions(), 'expense'));

  protected readonly monthRemaining = computed(() => this.monthIncome() - this.monthExpense());

  protected readonly dayExpense = computed(() =>
    this.sumByType(
      this.transactions.items().filter((transaction) => transaction.date === this.todayIso),
      'expense',
    ),
  );

  protected readonly weekExpense = computed(() =>
    this.sumByType(
      this.transactions.items().filter(
        (transaction) =>
          transaction.type === 'expense' &&
          isOnOrAfter(transaction.date, this.weekStart) &&
          transaction.date <= this.todayIso,
      ),
      'expense',
    ),
  );

  protected readonly weather = computed(() => {
    if (!this.transactions.loaded()) {
      return '';
    }
    if (this.transactions.count() === 0) {
      return 'Bienvenue. Note une première dépense pour commencer à y voir clair.';
    }
    const delta = this.monthRemaining();
    if (delta >= 0) {
      return 'Ciel dégagé : ce mois-ci, il rentre plus qu’il ne sort.';
    }
    const formatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(-delta);
    return `Les sorties dépassent les entrées de ${formatted} ce mois-ci. Tu sais où tu en es.`;
  });

  protected readonly slices = computed<StrataSlice[]>(() => {
    const byCategory = new Map<string, number>();
    for (const transaction of this.monthTransactions()) {
      if (transaction.type !== 'expense' || !transaction.categoryId) continue;
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
      );
    }
    const categories = this.categories.byId();
    return [...byCategory.entries()].map(([categoryId, amount]) => {
      const category = categories.get(categoryId);
      return {
        id: categoryId,
        amount,
        name: category?.name ?? 'Sans catégorie',
        color: category?.color ?? '#8B948C',
      };
    });
  });

  protected readonly accountLines = computed(() =>
    accountBalanceLines(this.accounts.items(), this.transactions.items(), { hideArchived: true }).slice(0, 4),
  );

  protected readonly budgetPreviews = computed((): BudgetPreviewLine[] => {
    if (!this.mode.isCloud()) {
      return [];
    }
    const spentByCategory = this.spentByCategoryForMonth(this.month);
    const categories = this.categories.byId();
    let totalExpenses = 0;
    for (const transaction of this.filterByMonthPrefix(this.transactions.items(), this.month)) {
      if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      }
    }
    spentByCategory.set(GLOBAL_BUDGET_CATEGORY_ID, totalExpenses);
    return this.budgets
      .items()
      .map((budget) => {
        const budgetKey = isGlobalBudget(budget) ? GLOBAL_BUDGET_CATEGORY_ID : budget.categoryId!;
        const spent = spentByCategory.get(budgetKey) ?? 0;
        const ratio = budget.limitAmount > 0 ? spent / budget.limitAmount : 0;
        const category = budget.categoryId ? categories.get(budget.categoryId) : undefined;
        return {
          categoryName: isGlobalBudget(budget) ? 'Budget global' : (category?.name ?? 'Catégorie'),
          categoryColor: category?.color ?? '#8B948C',
          spent,
          limitAmount: budget.limitAmount,
          ratio,
          fillPercent: Math.min(ratio, 1) * 100,
          statusText: this.budgetStatusText(spent, budget.limitAmount, ratio),
          isOver: ratio > 1,
          isNear: ratio >= 0.8 && ratio <= 1,
        };
      })
      .sort((left, right) => right.ratio - left.ratio)
      .slice(0, 3);
  });

  protected readonly recent = computed(() => this.transactions.items().slice(0, 5));

  private filterByMonthPrefix(transactions: Transaction[], monthStart: string): Transaction[] {
    const prefix = monthStart.slice(0, 7);
    return transactions.filter((transaction) => transaction.date.startsWith(prefix));
  }

  private sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
    return transactions
      .filter((transaction) => transaction.type === type)
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }

  private spentByCategoryForMonth(monthStart: string): Map<string, number> {
    const sums = new Map<string, number>();
    const byId = this.categories.byId();
    for (const transaction of this.filterByMonthPrefix(this.transactions.items(), monthStart)) {
      if (transaction.type !== 'expense' || !transaction.categoryId) continue;
      const category = byId.get(transaction.categoryId);
      const budgetKey = category?.parentId ?? transaction.categoryId;
      sums.set(budgetKey, (sums.get(budgetKey) ?? 0) + transaction.amount);
    }
    return sums;
  }

  private budgetStatusText(spent: number, limitAmount: number, ratio: number): string {
    const remaining = limitAmount - spent;
    const format = (value: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    if (remaining < 0) {
      return `Dépassé de ${format(-remaining)}`;
    }
    if (ratio >= 0.8) {
      return `Il reste ${format(remaining)}`;
    }
    return `${Math.round(ratio * 100)} % utilisé`;
  }
}
