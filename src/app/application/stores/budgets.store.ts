import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Budget, monthOf, NewBudget } from '../../domain/models/budget.model';
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

      async upsert(input: NewBudget): Promise<Budget | null> {
        try {
          const saved = await repo.upsert(input);
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

      dismissError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
