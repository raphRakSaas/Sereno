import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Budget, monthOf, NewBudget, periodBoundsForMonth } from '../../domain/models/budget.model';
import { shiftMonth } from '../../domain/utils/period.utils';
import { BUDGET_REPOSITORY } from '../../domain/ports/tokens';

interface BudgetsState {
  /** Mois affiché, format `yyyy-MM-01`. */
  month: string;
  items: Budget[];
  loaded: boolean;
  error: string | null;
}

const initialState: BudgetsState = {
  month: monthOf(new Date()),
  items: [],
  loaded: false,
  error: null,
};

export const BudgetsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const repo = inject(BUDGET_REPOSITORY);
    return {
      async load(month?: string): Promise<void> {
        const target = month ?? store.month();
        try {
          const items = await repo.listByMonth(target);
          patchState(store, { month: target, items, loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Les budgets ne se chargent pas. Réessaie dans un instant.' });
        }
      },

      async upsert(
        input: Pick<NewBudget, 'categoryId' | 'month' | 'limitAmount'> & Partial<Omit<NewBudget, 'categoryId' | 'month' | 'limitAmount'>>,
      ): Promise<Budget | null> {
        try {
          const periodType = input.periodType ?? 'monthly';
          const bounds = periodBoundsForMonth(input.month, periodType);
          const saved = await repo.upsert({
            ...input,
            periodType,
            periodStart: bounds.start,
            periodEnd: bounds.end,
            alertThresholdPct: input.alertThresholdPct ?? 80,
          });
          const others = store.items().filter((b) => b.id !== saved.id);
          patchState(store, { items: [...others, saved], error: null });
          return saved;
        } catch {
          patchState(store, { error: "Le budget n'a pas pu être enregistré. Réessaie dans un instant." });
          return null;
        }
      },

      async remove(id: string): Promise<void> {
        try {
          await repo.remove(id);
          patchState(store, { items: store.items().filter((b) => b.id !== id), error: null });
        } catch {
          patchState(store, { error: "La suppression n'a pas abouti. Réessaie dans un instant." });
        }
      },

      /** Recopie les budgets du mois précédent vers le mois affiché. */
      async copyFromPreviousMonth(): Promise<number | null> {
        const targetMonth = store.month();
        const previousMonth = shiftMonth(targetMonth, -1);
        try {
          const previousBudgets = await repo.listByMonth(previousMonth);
          if (previousBudgets.length === 0) {
            return 0;
          }
          for (const budget of previousBudgets) {
            await repo.upsert({
              categoryId: budget.categoryId,
              month: targetMonth,
              limitAmount: budget.limitAmount,
              periodType: budget.periodType ?? 'monthly',
              periodStart: budget.periodStart,
              periodEnd: budget.periodEnd,
              alertThresholdPct: budget.alertThresholdPct ?? 80,
            });
          }
          const items = await repo.listByMonth(targetMonth);
          patchState(store, { items, error: null });
          return previousBudgets.length;
        } catch {
          patchState(store, { error: 'La copie des budgets n’a pas abouti. Réessaie dans un instant.' });
          return null;
        }
      },

      dismissError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
