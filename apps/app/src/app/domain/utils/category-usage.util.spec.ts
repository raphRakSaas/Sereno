import { describe, expect, it } from 'vitest';
import { Category } from '../models/category.model';
import { Transaction } from '../models/transaction.model';
import {
  categoriesWithoutFavorites,
  favoriteCategories,
  lastUsedCategoryId,
  suggestCategoryIdFromNote,
} from './category-usage.util';

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(),
    accountId: 'acc-1',
    categoryId: 'cat-1',
    transferToAccountId: null,
    amount: 10,
    type: 'expense',
    date: '2026-07-01',
    note: null,
    markerColor: null,
    status: 'posted',
    recurringRuleId: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function category(overrides: Partial<Category>): Category {
  return {
    id: 'cat-1',
    name: 'Courses',
    type: 'expense',
    parentId: null,
    icon: 'basket',
    color: '#018472',
    isDefault: true,
    displayOrder: 0,
    isArchived: false,
    ...overrides,
  };
}

describe('favoriteCategories', () => {
  it('classe par fréquence d’usage puis récence, pour le bon type', () => {
    const categories = [
      category({ id: 'a', name: 'A' }),
      category({ id: 'b', name: 'B' }),
      category({ id: 'inc', name: 'Salaire', type: 'income' }),
    ];
    const transactions = [
      tx({ categoryId: 'a', type: 'expense', date: '2026-07-01' }),
      tx({ categoryId: 'a', type: 'expense', date: '2026-07-02' }),
      tx({ categoryId: 'b', type: 'expense', date: '2026-07-10' }),
      tx({ categoryId: 'inc', type: 'income', date: '2026-07-05' }),
    ];
    const favorites = favoriteCategories(transactions, categories, 'expense');
    expect(favorites.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('respecte la limite demandée', () => {
    const categories = [
      category({ id: 'a', name: 'A' }),
      category({ id: 'b', name: 'B' }),
    ];
    const transactions = [tx({ categoryId: 'a' }), tx({ categoryId: 'b' })];
    expect(favoriteCategories(transactions, categories, 'expense', 1)).toHaveLength(1);
  });
});

describe('categoriesWithoutFavorites', () => {
  it('retire les favoris de la liste complète', () => {
    const all = [category({ id: 'a' }), category({ id: 'b' }), category({ id: 'c' })];
    const favorites = [category({ id: 'b' })];
    expect(categoriesWithoutFavorites(all, favorites).map((c) => c.id)).toEqual(['a', 'c']);
  });
});

describe('lastUsedCategoryId', () => {
  it('renvoie la première catégorie du type dans l’ordre de la liste', () => {
    const transactions = [
      tx({ categoryId: 'x', type: 'income' }),
      tx({ categoryId: 'y', type: 'expense' }),
      tx({ categoryId: 'z', type: 'expense' }),
    ];
    expect(lastUsedCategoryId(transactions, 'expense')).toBe('y');
    expect(lastUsedCategoryId(transactions, 'income')).toBe('x');
  });

  it('renvoie null si aucune transaction du type', () => {
    expect(lastUsedCategoryId([tx({ type: 'income' })], 'expense')).toBeNull();
  });
});

describe('suggestCategoryIdFromNote', () => {
  const categories = [
    category({ id: 'courses', name: 'Courses' }),
    category({ id: 'resto', name: 'Restaurants & cafés' }),
  ];

  it('suggère la catégorie dont le nom apparaît dans la note', () => {
    expect(suggestCategoryIdFromNote('marché et courses', categories)).toBe('courses');
  });

  it('privilégie le nom le plus long en cas de correspondance multiple', () => {
    const cats = [
      category({ id: 'cafe', name: 'Café' }),
      category({ id: 'cafe-resto', name: 'Café resto' }),
    ];
    expect(suggestCategoryIdFromNote('un café resto sympa', cats)).toBe('cafe-resto');
  });

  it('retourne null pour une note trop courte ou sans correspondance', () => {
    expect(suggestCategoryIdFromNote('a', categories)).toBeNull();
    expect(suggestCategoryIdFromNote('rien ici', categories)).toBeNull();
  });
});
