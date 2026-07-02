import { inject, Injectable } from '@angular/core';
import { NewTransaction, Transaction } from '../../domain/models/transaction.model';
import { TransactionFilter, TransactionRepository } from '../../domain/ports/transaction.repository';
import { DexieService } from './dexie.providers';

function nextMonth(month: string): string {
  const d = new Date(month + 'T00:00:00');
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
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
    if (filter?.accountId) {
      rows = rows.filter((t) => t.accountId === filter.accountId);
    }
    if (filter?.categoryId) {
      rows = rows.filter((t) => t.categoryId === filter.categoryId);
    }
    rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    return filter?.limit ? rows.slice(0, filter.limit) : rows;
  }

  async getById(id: string): Promise<Transaction | null> {
    return (await this.db.transactions.get(id)) ?? null;
  }

  async create(input: NewTransaction): Promise<Transaction> {
    const row: Transaction = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await this.db.transactions.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewTransaction>): Promise<Transaction> {
    await this.db.transactions.update(id, patch);
    const updated = await this.db.transactions.get(id);
    if (!updated) {
      throw new Error(`Transaction ${id} introuvable`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.db.transactions.delete(id);
  }

  async count(): Promise<number> {
    return this.db.transactions.count();
  }
}
