import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { monthOf } from '../../../domain/models/budget.model';
import { Transaction } from '../../../domain/models/transaction.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { MonthSwitcherComponent } from '../../molecules/month-switcher/month-switcher.component';
import { TransactionListItemComponent } from '../../molecules/transaction-list-item/transaction-list-item.component';

interface DayGroup {
  date: string;
  label: string;
  items: Transaction[];
}

function dayLabel(date: string): string {
  const today = new Date();
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (date === toIso(today)) {
    return "Aujourd'hui";
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date === toIso(yesterday)) {
    return 'Hier';
  }
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(date + 'T00:00:00'),
  );
}

@Component({
  selector: 'app-transactions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, DatePipe, MonthSwitcherComponent, RouterLink, TransactionListItemComponent],
  templateUrl: './transactions.page.html',
  styleUrl: './transactions.page.scss',
})
export class TransactionsPage {
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);

  protected readonly month = signal(monthOf(new Date()));

  protected readonly monthTransactions = computed(() => {
    const prefix = this.month().slice(0, 7);
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

  protected readonly groups = computed<DayGroup[]>(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of this.monthTransactions()) {
      const list = map.get(t.date) ?? [];
      list.push(t);
      map.set(t.date, list);
    }
    return [...map.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({ date, label: dayLabel(date), items }));
  });
}
