import { inject, Injectable } from '@angular/core';
import { NewSavingsGoal, SavingsGoal } from '../../domain/models/savings-goal.model';
import { SavingsGoalRepository } from '../../domain/ports/savings-goal.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieSavingsGoalRepository implements SavingsGoalRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<SavingsGoal[]> {
    return this.db.savingsGoals.orderBy('createdAt').toArray();
  }

  async create(input: NewSavingsGoal): Promise<SavingsGoal> {
    const row: SavingsGoal = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await this.db.savingsGoals.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewSavingsGoal>): Promise<SavingsGoal> {
    await this.db.savingsGoals.update(id, patch);
    const updated = await this.db.savingsGoals.get(id);
    if (!updated) {
      throw new Error(`Objectif ${id} introuvable`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.db.savingsGoals.delete(id);
  }
}
