import { inject, Injectable } from '@angular/core';
import { Budget, NewBudget } from '../../domain/models/budget.model';
import { BudgetRepository } from '../../domain/ports/budget.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieBudgetRepository implements BudgetRepository {
  private readonly db = inject(DexieService).db;

  async listByMonth(month: string): Promise<Budget[]> {
    return this.db.budgets.where('month').equals(month).toArray();
  }

  async upsert(input: NewBudget): Promise<Budget> {
    const existing = await this.db.budgets
      .where('[categoryId+month]')
      .equals([input.categoryId, input.month])
      .first();
    if (existing) {
      const updated: Budget = { ...existing, limitAmount: input.limitAmount };
      await this.db.budgets.put(updated);
      return updated;
    }
    const row: Budget = { ...input, id: crypto.randomUUID() };
    await this.db.budgets.add(row);
    return row;
  }

  async remove(id: string): Promise<void> {
    await this.db.budgets.delete(id);
  }
}
