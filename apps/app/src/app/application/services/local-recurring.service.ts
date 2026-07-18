import { inject, Injectable } from '@angular/core';
import { toIsoDate } from '../../domain/utils/period.utils';
import { planRecurringOccurrences } from '../../domain/utils/recurring-generation.util';
import { AppModeService } from './app-mode.service';
import { CategoriesStore } from '../stores/categories.store';
import { RecurringStore } from '../stores/recurring.store';
import { TransactionsStore } from '../stores/transactions.store';

/**
 * Génère localement les occurrences dues des règles récurrentes en mode
 * invité (Dexie). Idempotente par (ruleId, date). En mode cloud, la
 * génération reste côté serveur via process-recurring.
 */
@Injectable({ providedIn: 'root' })
export class LocalRecurringService {
  private readonly mode = inject(AppModeService);
  private readonly rules = inject(RecurringStore);
  private readonly transactions = inject(TransactionsStore);
  private readonly categories = inject(CategoriesStore);

  async processDue(todayIso = toIsoDate(new Date())): Promise<number> {
    if (this.mode.isCloud()) {
      return 0;
    }

    if (!this.rules.loaded()) {
      await this.rules.load();
    }
    if (!this.transactions.loaded()) {
      await this.transactions.load();
    }
    if (!this.categories.loaded()) {
      await this.categories.load();
    }

    const categoriesById = this.categories.byId();
    let createdCount = 0;

    for (const rule of this.rules.items()) {
      if (!rule.active || rule.nextRunDate > todayIso) {
        continue;
      }

      const existingOccurrenceDates = new Set(
        this.transactions
          .items()
          .filter((transaction) => transaction.recurringRuleId === rule.id)
          .map((transaction) => transaction.date),
      );

      const plan = planRecurringOccurrences({
        rule,
        categoryType: categoriesById.get(rule.categoryId)?.type ?? null,
        todayIso,
        existingOccurrenceDates,
      });

      for (const planned of plan.transactionsToCreate) {
        const { idempotencyKey: _idempotencyKey, ...payload } = planned;
        const created = await this.transactions.add(payload);
        if (created) {
          createdCount += 1;
        }
      }

      const nextPatch =
        plan.deactivate
          ? { nextRunDate: plan.nextRunDate, active: false }
          : { nextRunDate: plan.nextRunDate };

      if (plan.nextRunDate !== rule.nextRunDate || plan.deactivate) {
        await this.rules.update(rule.id, nextPatch);
      }
    }

    return createdCount;
  }
}
