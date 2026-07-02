import { inject, Injectable } from '@angular/core';
import { Budget, NewBudget, periodBoundsForMonth } from '../../domain/models/budget.model';
import { BudgetRepository } from '../../domain/ports/budget.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieBudgetRepository implements BudgetRepository {
  private readonly db = inject(DexieService).db;

  async listAll(): Promise<Budget[]> {
    const rows = await this.db.budgets.toArray();
    return rows.map((row) => this.normalize(row));
  }

  async listByMonth(month: string): Promise<Budget[]> {
    const rows = await this.db.budgets.where('month').equals(month).toArray();
    return rows.map((row) => this.normalize(row));
  }

  async upsert(input: NewBudget): Promise<Budget> {
    const normalizedInput = this.normalize({
      ...input,
      id: '',
    });
    const existing = await this.db.budgets
      .filter(
        (budget) =>
          budget.categoryId === normalizedInput.categoryId && budget.month === normalizedInput.month,
      )
      .first();
    if (existing) {
      const updated: Budget = {
        ...this.normalize(existing),
        limitAmount: normalizedInput.limitAmount,
        periodType: normalizedInput.periodType,
        periodStart: normalizedInput.periodStart,
        periodEnd: normalizedInput.periodEnd,
        alertThresholdPct: normalizedInput.alertThresholdPct,
      };
      await this.db.budgets.put(updated);
      return updated;
    }
    const row: Budget = { ...normalizedInput, id: crypto.randomUUID() };
    await this.db.budgets.add(row);
    return row;
  }

  async remove(id: string): Promise<void> {
    await this.db.budgets.delete(id);
  }

  private normalize(row: Budget): Budget {
    const periodType = row.periodType ?? 'monthly';
    const bounds =
      row.periodStart && row.periodEnd
        ? { start: row.periodStart, end: row.periodEnd }
        : periodBoundsForMonth(row.month, periodType);
    return {
      ...row,
      categoryId: row.categoryId ?? null,
      periodType,
      periodStart: bounds.start,
      periodEnd: bounds.end,
      alertThresholdPct: row.alertThresholdPct ?? 80,
    };
  }
}
