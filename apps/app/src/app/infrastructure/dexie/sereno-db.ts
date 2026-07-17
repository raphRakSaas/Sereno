import Dexie, { Table } from 'dexie';
import { DEFAULT_CATEGORIES } from '../../domain/data/default-categories';
import { Account } from '../../domain/models/account.model';
import { Budget, periodBoundsForMonth } from '../../domain/models/budget.model';
import { Category } from '../../domain/models/category.model';
import { Receipt } from '../../domain/models/receipt.model';
import { RecurringRule } from '../../domain/models/recurring-rule.model';
import { SavingsGoal } from '../../domain/models/savings-goal.model';
import { Transaction } from '../../domain/models/transaction.model';
import { TransactionTemplate } from '../../domain/models/transaction-template.model';

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
  receipts!: Table<Receipt & { blob: Blob }, string>;
  transactionTemplates!: Table<TransactionTemplate, string>;
  savingsGoals!: Table<SavingsGoal, string>;
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
    this.version(2)
      .stores({
        categories: 'id, type, parentId',
      })
      .upgrade(async (transaction) => {
        await transaction
          .table('categories')
          .toCollection()
          .modify((category: Category) => {
            if (category.parentId === undefined) {
              category.parentId = null;
            }
          });
      });
    this.version(3).stores({
      receipts: 'id, transactionId, status, createdAt',
    });
    this.version(4).stores({
      transactionTemplates: 'id, isPinned, sortOrder, type',
    });
    this.version(5).upgrade(async (transaction) => {
      await transaction.table('accounts').toCollection().modify((account: Account) => {
        if (account.isArchived === undefined) {
          account.isArchived = false;
        }
        if (account.excludeFromTotal === undefined) {
          account.excludeFromTotal = false;
        }
        if (account.sortOrder === undefined) {
          account.sortOrder = 0;
        }
        if (account.groupId === undefined) {
          account.groupId = null;
        }
        if (account.cardLimit === undefined) {
          account.cardLimit = null;
        }
        if (account.cardPaymentDay === undefined) {
          account.cardPaymentDay = null;
        }
      });

      let categoryOrder = 0;
      await transaction.table('categories').toCollection().modify((category: Category) => {
        if (category.displayOrder === undefined) {
          category.displayOrder = categoryOrder;
          categoryOrder += 1;
        }
        if (category.isArchived === undefined) {
          category.isArchived = false;
        }
      });

      await transaction.table('transactions').toCollection().modify((tx: Transaction) => {
        if (tx.status === undefined) {
          tx.status = 'posted';
        }
      });

      await transaction.table('budgets').toCollection().modify((budget: Budget) => {
        const periodType = budget.periodType ?? 'monthly';
        if (budget.periodType === undefined) {
          budget.periodType = periodType;
        }
        if (budget.periodStart === undefined || budget.periodEnd === undefined) {
          const bounds = periodBoundsForMonth(budget.month, periodType);
          if (budget.periodStart === undefined) {
            budget.periodStart = bounds.start;
          }
          if (budget.periodEnd === undefined) {
            budget.periodEnd = bounds.end;
          }
        }
        if (budget.alertThresholdPct === undefined) {
          budget.alertThresholdPct = 80;
        }
      });

      await transaction.table('recurringRules').toCollection().modify((rule: RecurringRule) => {
        if (rule.endDate === undefined) {
          rule.endDate = null;
        }
      });
    });
    this.version(6).upgrade(async (transaction) => {
      const table = transaction.table('categories');
      const existingIds = new Set((await table.toArray()).map((category: Category) => category.id));
      const missing = DEFAULT_CATEGORIES.filter((category) => !existingIds.has(category.id));
      if (missing.length > 0) {
        await table.bulkAdd(missing);
      }
      for (const category of DEFAULT_CATEGORIES) {
        await table.update(category.id, {
          name: category.name,
          icon: category.icon,
          color: category.color,
          displayOrder: category.displayOrder,
          isArchived: category.isArchived,
        });
      }
    });
    this.version(7).stores({
      savingsGoals: 'id, createdAt',
    });
  }
}

export const META_FIRST_LAUNCH = 'firstLaunchAt';
