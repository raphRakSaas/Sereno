import { inject, Injectable } from '@angular/core';
import { Account, NewAccount } from '../../domain/models/account.model';
import { AccountRepository } from '../../domain/ports/account.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieAccountRepository implements AccountRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<Account[]> {
    const rows = await this.db.accounts.toArray();
    return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(id: string): Promise<Account | null> {
    return (await this.db.accounts.get(id)) ?? null;
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
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.db.transaction('rw', [this.db.accounts, this.db.transactions], async () => {
      await this.db.transactions.where('accountId').equals(id).delete();
      await this.db.accounts.delete(id);
    });
  }
}
