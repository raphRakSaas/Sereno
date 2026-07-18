import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppModeService } from '../../../application/services/app-mode.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { BudgetsStore } from '../../../application/stores/budgets.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { SavingsGoalsStore } from '../../../application/stores/savings-goals.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { accountBalanceLines } from '../../../domain/utils/account-balance.util';
import { isGlobalBudget, monthOf } from '../../../domain/models/budget.model';
import { savingsGoalProgressPct } from '../../../domain/models/savings-goal.model';
import { Transaction, isPosted } from '../../../domain/models/transaction.model';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { savingsRatePercent } from '../../../domain/utils/stats.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { CategoryIconComponent } from '../../atoms/category-icon/category-icon.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { LogoComponent } from '../../atoms/logo/logo.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';

@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    CategoryIconComponent,
    IconComponent,
    LogoComponent,
    MonthSwitcherComponent,
    RouterLink,
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
  protected readonly savingsGoals = inject(SavingsGoalsStore);

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
    if (hour >= 5 && hour < 12) {
      return 'Bonjour';
    }
    if (hour >= 12 && hour < 18) {
      return 'Bon après-midi';
    }
    if (hour >= 18 && hour < 22) {
      return 'Bonsoir';
    }
    return 'Bonne nuit';
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

  /** Solde négatif : teinte ambre douce (jamais rouge), convention commune à l'app. */
  protected readonly isBalanceNegative = computed(() => this.monthRemaining() < 0);

  /** Onboarding « revenu plus tard » : un solde brut négatif n'a pas de sens ici,
     on invite à saisir le revenu plutôt que d'afficher un gros nombre négatif. */
  protected readonly needsIncome = computed(
    () => this.transactions.loaded() && this.monthIncome() === 0 && this.monthExpense() > 0,
  );

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

  /** Uniquement les catégories avec une dépense réelle ce mois-ci — jamais de 0 €. */
  private readonly categorySpend = computed(() => {
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
    return byCategory;
  });

  private readonly expenseSlices = computed(() => {
    const categories = this.categories.byId();
    return [...this.categorySpend().entries()]
      .map(([categoryId, amount]) => {
        const category = categories.get(categoryId);
        return {
          id: categoryId,
          name: category?.name ?? 'Sans catégorie',
          color: category?.color ?? '#6B7280',
          icon: category?.icon ?? 'dots',
          amount,
        };
      })
      .sort((left, right) => right.amount - left.amount);
  });

  /** Carte "Top catégories" — 3 max, part du total dépensé ce mois-ci. */
  protected readonly topCategories = computed(() => {
    const slices = this.expenseSlices();
    const total = slices.reduce((sum, slice) => sum + slice.amount, 0) || 1;
    return slices.slice(0, 3).map((slice) => ({
      ...slice,
      pct: Math.round((slice.amount / total) * 100),
    }));
  });

  /** Bannière de dépassement — la catégorie budgétée la plus au-dessus de sa limite ce mois-ci. */
  protected readonly overBudgetCategory = computed(() => {
    const spend = this.categorySpend();
    const categories = this.categories.byId();
    const worst = this.budgets
      .items()
      .filter((budget) => !isGlobalBudget(budget) && budget.categoryId && budget.limitAmount > 0)
      .map((budget) => {
        const spent = spend.get(budget.categoryId!) ?? 0;
        return { budget, spent, overPct: Math.round(((spent - budget.limitAmount) / budget.limitAmount) * 100) };
      })
      .filter((entry) => entry.spent > entry.budget.limitAmount)
      .sort((left, right) => right.overPct - left.overPct)[0];
    if (!worst) {
      return null;
    }
    return {
      name: categories.get(worst.budget.categoryId!)?.name ?? 'Catégorie',
      overPct: worst.overPct,
      overAmount: worst.spent - worst.budget.limitAmount,
    };
  });

  protected readonly savingsGoal = computed(() => {
    const goal = this.savingsGoals.items()[0];
    if (!goal) {
      return null;
    }
    return { ...goal, progressPct: savingsGoalProgressPct(goal) };
  });

  protected readonly recent = computed(() => this.transactions.items().slice(0, 5));

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
