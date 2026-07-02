import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Account, NewAccount } from '../../domain/models/account.model';
import { ACCOUNT_REPOSITORY } from '../../domain/ports/tokens';

interface AccountsState {
  items: Account[];
  loaded: boolean;
  error: string | null;
}

const initialState: AccountsState = { items: [], loaded: false, error: null };

export const AccountsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    byId: computed(() => new Map(items().map((a) => [a.id, a]))),
    /** Somme des soldes de départ ; le solde vivant s'obtient en y ajoutant les transactions. */
    totalInitialBalance: computed(() => items().reduce((sum, a) => sum + a.initialBalance, 0)),
  })),
  withMethods((store) => {
    const repo = inject(ACCOUNT_REPOSITORY);
    return {
      async load(): Promise<void> {
        try {
          const items = await repo.list();
          patchState(store, { items, loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Les comptes ne se chargent pas. Réessaie dans un instant.' });
        }
      },

      async add(input: NewAccount): Promise<Account | null> {
        try {
          const created = await repo.create(input);
          patchState(store, { items: [...store.items(), created], error: null });
          return created;
        } catch {
          patchState(store, { error: "Le compte n'a pas pu être créé. Réessaie dans un instant." });
          return null;
        }
      },

      async update(id: string, patch: Partial<NewAccount>): Promise<boolean> {
        try {
          const updated = await repo.update(id, patch);
          patchState(store, {
            items: store.items().map((a) => (a.id === id ? updated : a)),
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
          patchState(store, { items: store.items().filter((a) => a.id !== id), error: null });
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
