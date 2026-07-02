import Dexie, { Table } from 'dexie';
import { Account } from '../../domain/models/account.model';
import { Budget } from '../../domain/models/budget.model';
import { Category } from '../../domain/models/category.model';
import { RecurringRule } from '../../domain/models/recurring-rule.model';
import { Transaction } from '../../domain/models/transaction.model';

export interface MetaEntry {
  key: string;
  value: string;
}

/** Base locale IndexedDB du mode invité. Les lignes sont les modèles du domain. */
export class SerenoDb extends Dexie {
  accounts!: Table<Account, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  recurringRules!: Table<RecurringRule, string>;
  meta!: Table<MetaEntry, string>;

  constructor() {
    super('sereno');
    this.version(1).stores({
      accounts: 'id',
      categories: 'id, type',
      transactions: 'id, date, accountId, categoryId, createdAt',
      budgets: 'id, month, [categoryId+month]',
      recurringRules: 'id, nextRunDate',
      meta: 'key',
    });
  }
}

export const META_FIRST_LAUNCH = 'firstLaunchAt';
