import { inject, Injectable } from '@angular/core';
import {
  NewTransactionTemplate,
  TransactionTemplate,
} from '../../domain/models/transaction-template.model';
import { TransactionTemplateRepository } from '../../domain/ports/transaction-template.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieTransactionTemplateRepository implements TransactionTemplateRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<TransactionTemplate[]> {
    const rows = await this.db.transactionTemplates.toArray();
    return rows.sort((left, right) => {
      if (left.isPinned !== right.isPinned) {
        return left.isPinned ? -1 : 1;
      }
      if (left.sortOrder !== right.sortOrder) {
        return left.sortOrder - right.sortOrder;
      }
      return left.name.localeCompare(right.name, 'fr');
    });
  }

  async create(input: NewTransactionTemplate): Promise<TransactionTemplate> {
    const row: TransactionTemplate = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.db.transactionTemplates.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewTransactionTemplate>): Promise<TransactionTemplate> {
    const existing = await this.db.transactionTemplates.get(id);
    if (!existing) {
      throw new Error(`Modèle ${id} introuvable`);
    }
    await this.db.transactionTemplates.update(id, patch);
    return { ...existing, ...patch };
  }

  async remove(id: string): Promise<void> {
    await this.db.transactionTemplates.delete(id);
  }
}
