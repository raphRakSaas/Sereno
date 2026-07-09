import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppModeService } from '../../../application/services/app-mode.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { BudgetsStore } from '../../../application/stores/budgets.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { RecurringStore } from '../../../application/stores/recurring.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { accountBalanceLines } from '../../../domain/utils/account-balance.util';
import { GLOBAL_BUDGET_CATEGORY_ID, isGlobalBudget, monthOf } from '../../../domain/models/budget.model';
import { Transaction, isPosted } from '../../../domain/models/transaction.model';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { savingsRatePercent } from '../../../domain/utils/stats.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { ExpenseTileComponent } from '../../molecules/expense-tile/expense-tile.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { StrataGhostComponent } from '../../molecules/strata-ghost/strata-ghost.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';
import { StrataChartComponent } from '../../organisms/strata-chart/strata-chart.component';

interface ExpenseTileData {
  id: string;
  title: string;
  meta: string;
  amount: number;
  dueDate: string | null;
  merchantTexts: string[];
  icon: string;
  color: string;
  link: string | string[];
}

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    DatePipe,
    ExpenseTileComponent,
    IconComponent,
    MonthSwitcherComponent,
    RouterLink,
    StrataChartComponent,
    StrataGhostComponent,
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
  protected readonly recurring = inject(RecurringStore);
  protected readonly transactions = inject(TransactionsStore);

  protected readonly selectedMonth = signal(monthOf(new Date()));

  protected readonly todayIso = computed(() => {
    this.transactions.items();
    return toIsoDate(new Date());
  });

  constructor() {
    effect(() => {
      const month = this.selectedMonth();
      if (this.mode.isCloud()) {
        void this.budgets.load(month);
        if (!this.recurring.loaded()) {
          void this.recurring.load();
        }
      }
    });
  }

  ngOnInit(): void {
    if (this.mode.isCloud() && !this.budgets.loaded()) {
      void this.budgets.load(this.selectedMonth());
    }
  }

  protected readonly greeting = computed(() => {
    this.todayIso();
    const hour = new Date().getHours();
    if (hour < 18) {
      return 'Bonjour';
    }
    return 'Bonsoir';
  });

  protected readonly totalBalance = computed(() =>
    accountBalanceLines(this.accounts.items(), this.transactions.items(), {
      hideArchived: true,
      hideExcludedFromTotal: true,
    }).reduce((sum, line) => sum + line.balance, 0),
  );

  protected readonly monthTransactions = computed(() =>
    this.filterByMonthPrefix(this.transactions.items(), this.selectedMonth()),
  );

  protected readonly monthIncome = computed(() => this.sumByType(this.monthTransactions(), 'income'));

  protected readonly monthExpense = computed(() => this.sumByType(this.monthTransactions(), 'expense'));

  protected readonly monthRemaining = computed(() => this.monthIncome() - this.monthExpense());

  protected readonly savingsRate = computed(() =>
    savingsRatePercent(this.monthIncome(), this.monthExpense()),
  );

  protected readonly surplusText = computed(() => {
    if (!this.transactions.loaded() || this.monthIncome() <= 0) {
      return 'Note tes revenus et dépenses pour voir où tu en es ce mois-ci.';
    }
    const rate = this.savingsRate();
    if (rate <= 0) {
      return 'Les sorties dépassent les entrées ce mois-ci — tu sais où tu en es.';
    }
    return `Tu gardes ${rate} % de tes revenus ce mois-ci.`;
  });

  protected readonly savingsTrendText = computed(() => {
    if (!this.transactions.loaded() || this.monthIncome() <= 0) {
      return null;
    }
    const rate = this.savingsRate();
    const sign = rate > 0 ? '+' : '';
    return `${sign}${rate} % ce mois-ci`;
  });

  protected readonly globalBudget = computed(() => {
    if (!this.mode.isCloud()) {
      return null;
    }
    return this.budgets.items().find((budget) => isGlobalBudget(budget)) ?? null;
  });

  protected readonly globalBudgetRatio = computed(() => {
    const budget = this.globalBudget();
    if (!budget || budget.limitAmount <= 0) {
      return 0;
    }
    return this.monthExpense() / budget.limitAmount;
  });

  protected readonly globalBudgetPercent = computed(() => Math.min(this.globalBudgetRatio() * 100, 100));

  protected readonly globalBudgetNear = computed(() => {
    const ratio = this.globalBudgetRatio();
    return ratio >= 0.8 && ratio <= 1;
  });

  protected readonly globalBudgetOver = computed(() => this.globalBudgetRatio() > 1);

  /** Largeur de la jauge : budget présent → ratio réel, absent → proportion dépenses/revenus (indicatif). */
  protected readonly globalBudgetFill = computed(() => {
    if (this.globalBudget()) {
      return this.globalBudgetPercent();
    }
    if (this.monthIncome() <= 0) {
      return 0;
    }
    return Math.min((this.monthExpense() / this.monthIncome()) * 100, 100);
  });

  protected readonly budgetFloatHint = computed(() => {
    if (!this.mode.isCloud()) {
      return 'Tes revenus et dépenses du mois, en un coup d’œil.';
    }
    return 'Fixe un budget global pour suivre tes dépenses ce mois-ci.';
  });

  protected readonly expenseSlices = computed(() => {
    const byCategory = new Map<string, number>();
    for (const transaction of this.monthTransactions()) {
      if (transaction.type !== 'expense' || !transaction.categoryId) {
        continue;
      }
      byCategory.set(
        transaction.categoryId,
        (byCategory.get(transaction.categoryId) ?? 0) + transaction.amount,
      );
    }
    const categories = this.categories.byId();
    return [...byCategory.entries()]
      .map(([categoryId, amount]) => {
        const category = categories.get(categoryId);
        return {
          id: categoryId,
          name: category?.name ?? 'Sans catégorie',
          color: category?.color ?? '#8B948C',
          amount,
        };
      })
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);
  });

  protected readonly upcomingTiles = computed((): ExpenseTileData[] => {
    const categories = this.categories.byId();

    if (this.mode.isCloud() && this.recurring.items().length > 0) {
      return [...this.recurring.items()]
        .filter((rule) => rule.active)
        .sort((left, right) => left.nextRunDate.localeCompare(right.nextRunDate))
        .slice(0, 8)
        .map((rule) => {
          const category = categories.get(rule.categoryId);
          return {
            id: rule.id,
            title: category?.name ?? 'Récurrence',
            meta: 'Prochaine échéance',
            amount: rule.amount,
            dueDate: rule.nextRunDate,
            merchantTexts: [category?.name ?? ''],
            icon: category?.icon ?? 'repeat',
            color: category?.color ?? '#8B948C',
            link: '/recurrences',
          };
        });
    }

    return this.transactions
      .items()
      .filter((transaction) => transaction.type === 'expense' && isPosted(transaction))
      .slice(0, 8)
      .map((transaction) => {
        const category = transaction.categoryId ? categories.get(transaction.categoryId) : undefined;
        return {
          id: transaction.id,
          title: transaction.note?.trim() || category?.name || 'Dépense',
          meta: category?.name ?? 'Dépense',
          amount: transaction.amount,
          dueDate: transaction.date,
          merchantTexts: [transaction.note, category?.name].filter((text): text is string => !!text?.trim()),
          icon: category?.icon ?? 'dots',
          color: category?.color ?? '#8B948C',
          link: ['/transactions', transaction.id],
        };
      });
  });

  protected readonly upcomingTitle = computed(() =>
    this.mode.isCloud() && this.recurring.items().length > 0 ? 'À venir' : 'Dépenses récentes',
  );

  protected readonly recent = computed(() => this.transactions.items().slice(0, 4));

  private filterByMonthPrefix(transactions: Transaction[], monthStart: string): Transaction[] {
    const prefix = monthStart.slice(0, 7);
    return transactions.filter(
      (transaction) => transaction.date.startsWith(prefix) && isPosted(transaction),
    );
  }

  private sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
    return transactions
      .filter((transaction) => transaction.type === type && isPosted(transaction))
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  }
}
