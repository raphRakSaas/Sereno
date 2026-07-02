import { inject, Injectable } from '@angular/core';
import { NewRecurringRule, RecurringRule } from '../../domain/models/recurring-rule.model';
import { RecurringRuleRepository } from '../../domain/ports/recurring-rule.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieRecurringRuleRepository implements RecurringRuleRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<RecurringRule[]> {
    return this.db.recurringRules.orderBy('nextRunDate').toArray();
  }

  async create(input: NewRecurringRule): Promise<RecurringRule> {
    const row: RecurringRule = { ...input, id: crypto.randomUUID() };
    await this.db.recurringRules.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewRecurringRule>): Promise<RecurringRule> {
    await this.db.recurringRules.update(id, patch);
    const updated = await this.db.recurringRules.get(id);
    if (!updated) {
      throw new Error(`Règle ${id} introuvable`);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.db.recurringRules.delete(id);
  }
}
