import { Category, CategoryKind } from '../models/category.model';
import { Transaction } from '../models/transaction.model';

const FAVORITE_LIMIT = 8;

/** Catégories les plus utilisées pour un type, triées par fréquence puis récence. */
export function favoriteCategories(
  transactions: Transaction[],
  categories: Category[],
  transactionType: CategoryKind,
  limit = FAVORITE_LIMIT,
): Category[] {
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const usageScores = new Map<string, { usageCount: number; lastUsedDate: string }>();

  for (const transaction of transactions) {
    if (transaction.type !== transactionType || !transaction.categoryId) continue;
    if (!categoriesById.has(transaction.categoryId)) continue;

    const previous = usageScores.get(transaction.categoryId) ?? { usageCount: 0, lastUsedDate: '' };
    usageScores.set(transaction.categoryId, {
      usageCount: previous.usageCount + 1,
      lastUsedDate:
        transaction.date > previous.lastUsedDate ? transaction.date : previous.lastUsedDate,
    });
  }

  return [...usageScores.entries()]
    .sort(
      (left, right) =>
        right[1].usageCount - left[1].usageCount ||
        right[1].lastUsedDate.localeCompare(left[1].lastUsedDate),
    )
    .slice(0, limit)
    .map(([categoryId]) => categoriesById.get(categoryId)!)
    .filter((category): category is Category => category !== undefined);
}

export function categoriesWithoutFavorites(
  allCategories: Category[],
  favorites: Category[],
): Category[] {
  const favoriteIds = new Set(favorites.map((category) => category.id));
  return allCategories.filter((category) => !favoriteIds.has(category.id));
}

/** Dernière catégorie utilisée pour un type de transaction. */
export function lastUsedCategoryId(
  transactions: Transaction[],
  transactionType: CategoryKind,
): string | null {
  for (const transaction of transactions) {
    if (transaction.type === transactionType && transaction.categoryId) {
      return transaction.categoryId;
    }
  }
  return null;
}

/** Suggère une catégorie si la note contient son nom (ex. « Courses » dans « Market courses »). */
export function suggestCategoryIdFromNote(note: string, categories: Category[]): string | null {
  const normalizedNote = note.trim().toLowerCase();
  if (normalizedNote.length < 2) {
    return null;
  }

  const byNameLength = [...categories].sort((left, right) => right.name.length - left.name.length);
  for (const category of byNameLength) {
    if (normalizedNote.includes(category.name.toLowerCase())) {
      return category.id;
    }
  }
  return null;
}
