import { inject } from '@angular/core';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { NewRecurringRule, RecurringRule } from '../../domain/models/recurring-rule.model';
import { RECURRING_RULE_REPOSITORY } from '../../domain/ports/tokens';

interface RecurringState {
  items: RecurringRule[];
  loaded: boolean;
  error: string | null;
}

const initialState: RecurringState = { items: [], loaded: false, error: null };

export const RecurringStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => {
    const repo = inject(RECURRING_RULE_REPOSITORY);
    return {
      async load(): Promise<void> {
        try {
          const items = await repo.list();
          patchState(store, { items, loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Les récurrences ne se chargent pas. Réessaie dans un instant.' });
        }
      },

      async add(input: NewRecurringRule): Promise<RecurringRule | null> {
        try {
          const created = await repo.create(input);
          patchState(store, { items: [...store.items(), created], error: null });
          return created;
        } catch {
          patchState(store, { error: "La récurrence n'a pas pu être créée. Réessaie dans un instant." });
          return null;
        }
      },

      async update(id: string, patch: Partial<NewRecurringRule>): Promise<boolean> {
        try {
          const updated = await repo.update(id, patch);
          patchState(store, {
            items: store.items().map((r) => (r.id === id ? updated : r)),
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
          patchState(store, { items: store.items().filter((r) => r.id !== id), error: null });
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
