import { inject, Injectable } from '@angular/core';
import { NewTransaction, Transaction } from '../../domain/models/transaction.model';
import { TransactionFilter, TransactionRepository } from '../../domain/ports/transaction.repository';
import { DexieService } from './dexie.providers';

function nextMonth(month: string): string {
  const dateValue = new Date(month + 'T00:00:00');
  dateValue.setMonth(dateValue.getMonth() + 1);
  return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-01`;
}

@Injectable({ providedIn: 'root' })
export class DexieTransactionRepository implements TransactionRepository {
  private readonly db = inject(DexieService).db;

  async list(filter?: TransactionFilter): Promise<Transaction[]> {
    let rows: Transaction[];
    if (filter?.month) {
      rows = await this.db.transactions
        .where('date')
        .between(filter.month, nextMonth(filter.month), true, false)
        .toArray();
    } else {
      rows = await this.db.transactions.toArray();
    }
    rows = rows.map((row) => this.normalize(row));
    if (filter?.accountId) {
      rows = rows.filter(
        (transaction) =>
          transaction.accountId === filter.accountId ||
          transaction.transferToAccountId === filter.accountId,
      );
    }
    if (filter?.categoryId) {
      rows = rows.filter((transaction) => transaction.categoryId === filter.categoryId);
    }
    rows.sort(
      (left, right) =>
        right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt),
    );
    return filter?.limit ? rows.slice(0, filter.limit) : rows;
  }

  async getById(id: string): Promise<Transaction | null> {
    const row = await this.db.transactions.get(id);
    return row ? this.normalize(row) : null;
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const row: Transaction = {
      ...input,
      categoryId: input.categoryId ?? null,
      transferToAccountId: input.transferToAccountId ?? null,
      markerColor: input.markerColor ?? null,
      status: input.status ?? 'posted',
      recurringRuleId: input.recurringRuleId ?? null,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.db.transactions.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewTransaction>): Promise<Transaction> {
    await this.db.transactions.update(id, patch);
    const updated = await this.db.transactions.get(id);
    if (!updated) {
      throw new Error(`Transaction ${id} introuvable`);
    }
    return this.normalize(updated);
  }

  async remove(id: string): Promise<void> {
    await this.db.transactions.delete(id);
  }

  async count(): Promise<number> {
    return this.db.transactions.count();
  }

  private normalize(row: Transaction): Transaction {
    return {
      ...row,
      categoryId: row.categoryId ?? null,
      transferToAccountId: row.transferToAccountId ?? null,
      markerColor: row.markerColor ?? null,
      status: row.status ?? 'posted',
      recurringRuleId: row.recurringRuleId ?? null,
    };
  }
}
