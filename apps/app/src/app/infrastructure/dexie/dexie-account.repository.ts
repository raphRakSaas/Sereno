import { inject, Injectable } from '@angular/core';
import { Account, NewAccount } from '../../domain/models/account.model';
import { AccountRepository } from '../../domain/ports/account.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieAccountRepository implements AccountRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<Account[]> {
    const rows = await this.db.accounts.toArray();
    return rows
      .map((row) => this.normalize(row))
      .sort(
        (left, right) =>
          left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt),
      );
  }

  async getById(id: string): Promise<Account | null> {
    const row = await this.db.accounts.get(id);
    return row ? this.normalize(row) : null;
  }

  async create(input: NewAccount): Promise<Account> {
    const row: Account = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    await this.db.accounts.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewAccount>): Promise<Account> {
    await this.db.accounts.update(id, patch);
    const updated = await this.db.accounts.get(id);
    if (!updated) {
      throw new Error(`Compte ${id} introuvable`);
    }
    return this.normalize(updated);
  }

  async remove(id: string): Promise<void> {
    await this.db.transaction('rw', [this.db.accounts, this.db.transactions], async () => {
      await this.db.transactions.where('accountId').equals(id).delete();
      await this.db.accounts.delete(id);
    });
  }

  private normalize(row: Account): Account {
    return {
      ...row,
      isArchived: row.isArchived ?? false,
      excludeFromTotal: row.excludeFromTotal ?? false,
      sortOrder: row.sortOrder ?? 0,
      groupId: row.groupId ?? null,
      cardLimit: row.cardLimit ?? null,
      cardPaymentDay: row.cardPaymentDay ?? null,
    };
  }
}
