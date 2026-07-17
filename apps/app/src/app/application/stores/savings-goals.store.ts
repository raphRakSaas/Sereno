import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { NewSavingsGoal, SavingsGoal } from '../../domain/models/savings-goal.model';
import { SAVINGS_GOAL_REPOSITORY } from '../../domain/ports/tokens';

interface SavingsGoalsState {
  items: SavingsGoal[];
  loaded: boolean;
  error: string | null;
}

const initialState: SavingsGoalsState = { items: [], loaded: false, error: null };

export const SavingsGoalsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const repo = inject(SAVINGS_GOAL_REPOSITORY);
    return {
      async load(): Promise<void> {
        try {
          const items = await repo.list();
          patchState(store, { items, loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Ton objectif ne se charge pas. Réessaie dans un instant.' });
        }
      },

      async add(input: NewSavingsGoal): Promise<SavingsGoal | null> {
        try {
          const created = await repo.create(input);
          patchState(store, { items: [...store.items(), created], error: null });
          return created;
        } catch {
          patchState(store, { error: "L'objectif n'a pas pu être créé. Réessaie dans un instant." });
          return null;
        }
      },

      async update(id: string, patch: Partial<NewSavingsGoal>): Promise<boolean> {
        try {
          const updated = await repo.update(id, patch);
          patchState(store, {
            items: store.items().map((goal) => (goal.id === id ? updated : goal)),
            error: null,
          });
          return true;
        } catch {
          patchState(store, { error: "La modification n'a pas abouti. Réessaie dans un instant." });
          return false;
        }
      },

      async remove(id: string): Promise<void> {
        try {
          await repo.remove(id);
          patchState(store, { items: store.items().filter((goal) => goal.id !== id), error: null });
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
