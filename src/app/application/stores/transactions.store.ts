import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { NewTransaction, Transaction } from '../../domain/models/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/ports/tokens';

interface TransactionsState {
  items: Transaction[];
  loaded: boolean;
  error: string | null;
}

const initialState: TransactionsState = { items: [], loaded: false, error: null };

const CALM_ERROR = "L'enregistrement n'a pas abouti. Tes données sont intactes — réessaie dans un instant.";

function sorted(items: Transaction[]): Transaction[] {
  return [...items].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export const TransactionsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    count: computed(() => items().length),
  })),
  withMethods((store) => {
    const repo = inject(TRANSACTION_REPOSITORY);
    return {
      async load(): Promise<void> {
        try {
          const items = await repo.list();
          patchState(store, { items: sorted(items), loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Les transactions ne se chargent pas. Réessaie dans un instant.' });
        }
      },

      async add(input: NewTransaction): Promise<Transaction | null> {
        try {
          const created = await repo.create(input);
          patchState(store, { items: sorted([created, ...store.items()]), error: null });
          return created;
        } catch {
          patchState(store, { error: CALM_ERROR });
          return null;
        }
      },

      async update(id: string, patch: Partial<NewTransaction>): Promise<boolean> {
        try {
          const updated = await repo.update(id, patch);
          patchState(store, {
            items: sorted(store.items().map((t) => (t.id === id ? updated : t))),
            error: null,
          });
          return true;
        } catch {
          patchState(store, { error: CALM_ERROR });
          return false;
        }
      },

      async remove(id: string): Promise<void> {
        try {
          await repo.remove(id);
          patchState(store, { items: store.items().filter((t) => t.id !== id), error: null });
        } catch {
          patchState(store, { error: CALM_ERROR });
        }
      },

      dismissError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
