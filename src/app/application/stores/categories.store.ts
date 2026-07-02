import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { Category, NewCategory } from '../../domain/models/category.model';
import { CATEGORY_REPOSITORY } from '../../domain/ports/tokens';
import { buildCategoryTree, categoriesForPicker } from '../../domain/utils/category-tree.util';

interface CategoriesState {
  items: Category[];
  loaded: boolean;
  error: string | null;
}

const initialState: CategoriesState = { items: [], loaded: false, error: null };

export const CategoriesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items }) => ({
    byId: computed(() => new Map(items().map((category) => [category.id, category]))),
    expenseCategories: computed(() => categoriesForPicker(items().filter((category) => category.type === 'expense'))),
    incomeCategories: computed(() => categoriesForPicker(items().filter((category) => category.type === 'income'))),
    customCategories: computed(() => items().filter((category) => !category.isDefault)),
    tree: computed(() => buildCategoryTree(items())),
  })),
  withMethods((store) => {
    const repo = inject(CATEGORY_REPOSITORY);
    return {
      async load(): Promise<void> {
        try {
          const items = await repo.list();
          patchState(store, { items, loaded: true, error: null });
        } catch {
          patchState(store, { error: 'Les catégories ne se chargent pas. Réessaie dans un instant.' });
        }
      },

      async add(input: NewCategory): Promise<Category | null> {
        try {
          const created = await repo.create(input);
          patchState(store, { items: [...store.items(), created], error: null });
          return created;
        } catch {
          patchState(store, { error: "La catégorie n'a pas pu être créée. Réessaie dans un instant." });
          return null;
        }
      },

      async update(id: string, patch: Partial<NewCategory>): Promise<boolean> {
        try {
          const updated = await repo.update(id, patch);
          patchState(store, {
            items: store.items().map((c) => (c.id === id ? updated : c)),
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
          patchState(store, {
            items: store
              .items()
              .filter((category) => category.id !== id)
              .map((category) =>
                category.parentId === id ? { ...category, parentId: null } : category,
              ),
            error: null,
          });
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
