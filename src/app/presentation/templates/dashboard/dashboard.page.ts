import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { monthOf } from '../../../domain/models/budget.model';
import { signedAmount } from '../../../domain/models/transaction.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';
import { StrataChartComponent, StrataSlice } from '../../organisms/strata-chart/strata-chart.component';

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
export class DashboardPage {
  protected readonly accounts = inject(AccountsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);

  protected readonly today = new Date();
  protected readonly month = monthOf(this.today);

  /** Solde vivant : soldes de départ + toutes les transactions. */
  protected readonly totalBalance = computed(
    () =>
      this.accounts.totalInitialBalance() +
      this.transactions.items().reduce((sum, t) => sum + signedAmount(t), 0),
  );

  protected readonly monthTransactions = computed(() => {
    const prefix = this.month.slice(0, 7);
    return this.transactions.items().filter((t) => t.date.startsWith(prefix));
  });

  protected readonly monthIncome = computed(() =>
    this.monthTransactions()
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
  );

  protected readonly monthExpense = computed(() =>
    this.monthTransactions()
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  );

  /** Une ligne de météo intérieure : un constat posé, jamais une alerte. */
  protected readonly weather = computed(() => {
    if (!this.transactions.loaded()) {
      return '';
    }
    if (this.transactions.count() === 0) {
      return 'Bienvenue. Note une première dépense pour commencer à y voir clair.';
    }
    const delta = this.monthIncome() - this.monthExpense();
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
    for (const t of this.monthTransactions()) {
      if (t.type !== 'expense') continue;
      byCategory.set(t.categoryId, (byCategory.get(t.categoryId) ?? 0) + t.amount);
    }
    const categories = this.categories.byId();
    return [...byCategory.entries()].map(([id, amount]) => {
      const category = categories.get(id);
      return {
        id,
        amount,
        name: category?.name ?? 'Sans catégorie',
        color: category?.color ?? '#8B948C',
      };
    });
  });

  protected readonly recent = computed(() => this.transactions.items().slice(0, 5));
}
