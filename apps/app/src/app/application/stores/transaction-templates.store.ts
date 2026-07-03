import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import {
  NewTransactionTemplate,
  PINNED_TEMPLATE_LIMIT,
  TransactionTemplate,
} from '../../domain/models/transaction-template.model';
import { TRANSACTION_TEMPLATE_REPOSITORY } from '../../domain/ports/tokens';

interface TemplatesState {
  items: TransactionTemplate[];
  loaded: boolean;
  error: string | null;
}

const initialState: TemplatesState = { items: [], loaded: false, error: null };

export const TransactionTemplatesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    pinned: computed(() => items().filter((template) => template.isPinned)),
    unpinned: computed(() => items().filter((template) => !template.isPinned)),
    byId: computed(() => new Map(items().map((template) => [template.id, template]))),
  })),
  withMethods((store) => {
    const repo = inject(TRANSACTION_TEMPLATE_REPOSITORY);

    const nextSortOrder = (): number => {
      const pinned = store.items().filter((template) => template.isPinned);
      if (pinned.length === 0) {
        return 0;
      }
      return Math.max(...pinned.map((template) => template.sortOrder)) + 1;
    };

    return {
      async load(): Promise<void> {
        try {
          const items = await repo.list();
          patchState(store, { items, loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Les modèles ne se chargent pas. Réessaie dans un instant.' });
        }
      },

      async add(input: NewTransactionTemplate): Promise<TransactionTemplate | null> {
        try {
          if (input.isPinned && store.items().filter((template) => template.isPinned).length >= PINNED_TEMPLATE_LIMIT) {
            patchState(store, {
              error: `Tu peux épingler ${PINNED_TEMPLATE_LIMIT} modèles au maximum dans la saisie rapide.`,
            });
            return null;
          }
          const created = await repo.create(input);
          patchState(store, { items: [...store.items(), created], error: null });
          return created;
        } catch {
          patchState(store, { error: 'Le modèle n’a pas pu être créé. Réessaie dans un instant.' });
          return null;
        }
      },

      async update(id: string, patch: Partial<NewTransactionTemplate>): Promise<boolean> {
        try {
          if (patch.isPinned) {
            const current = store.items().find((template) => template.id === id);
            const pinnedCount = store.items().filter((template) => template.isPinned).length;
            if (!current?.isPinned && pinnedCount >= PINNED_TEMPLATE_LIMIT) {
              patchState(store, {
                error: `Tu peux épingler ${PINNED_TEMPLATE_LIMIT} modèles au maximum dans la saisie rapide.`,
              });
              return false;
            }
          }
          const updated = await repo.update(id, patch);
          patchState(store, {
            items: store.items().map((template) => (template.id === id ? updated : template)),
            error: null,
          });
          return true;
        } catch {
          patchState(store, { error: 'La modification n’a pas abouti. Réessaie dans un instant.' });
          return false;
        }
      },

      async remove(id: string): Promise<void> {
        try {
          await repo.remove(id);
          patchState(store, {
            items: store.items().filter((template) => template.id !== id),
            error: null,
          });
        } catch {
          patchState(store, { error: 'La suppression n’a pas abouti. Réessaie dans un instant.' });
        }
      },

      async togglePin(id: string): Promise<boolean> {
        const template = store.items().find((item) => item.id === id);
        if (!template) {
          return false;
        }
        if (!template.isPinned) {
          return this.update(id, { isPinned: true, sortOrder: nextSortOrder() });
        }
        return this.update(id, { isPinned: false, sortOrder: 0 });
      },

      dismissError(): void {
        patchState(store, { error: null });
      },
    };
  }),
);
