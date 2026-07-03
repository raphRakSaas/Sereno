import { describe, expect, it } from 'vitest';
import { Category } from '../models/category.model';
import { Transaction } from '../models/transaction.model';
import {
  breakdownByCategory,
  compareMonthTotals,
  cumulativeNetByDay,
  dailyTotalsByType,
  filterTransactionsForPeriod,
  rankedAccounts,
  sumByType,
  topCategories,
} from './stats.util';

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: overrides.id ?? crypto.randomUUID(),
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
    id: overrides.id ?? 'cat-1',
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

describe('filterTransactionsForPeriod', () => {
  it('garde uniquement les transactions du mois demandé', () => {
    const transactions = [
      tx({ id: 'a', date: '2026-07-05' }),
      tx({ id: 'b', date: '2026-06-30' }),
      tx({ id: 'c', date: '2026-07-31' }),
    ];
    const result = filterTransactionsForPeriod(transactions, '2026-07-01', null);
    expect(result.map((t) => t.id)).toEqual(['a', 'c']);
  });

  it('filtre par compte source, et inclut le compte destination d’un virement', () => {
    const transactions = [
      tx({ id: 'source', accountId: 'acc-1', type: 'expense' }),
      tx({ id: 'other', accountId: 'acc-2', type: 'expense' }),
      tx({ id: 'transfer-in', accountId: 'acc-2', transferToAccountId: 'acc-1', type: 'transfer' }),
    ];
    const result = filterTransactionsForPeriod(transactions, '2026-07-01', 'acc-1');
    expect(result.map((t) => t.id)).toEqual(['source', 'transfer-in']);
  });
});

describe('sumByType', () => {
  it('additionne uniquement les transactions du type demandé', () => {
    const transactions = [
      tx({ type: 'expense', amount: 30 }),
      tx({ type: 'income', amount: 100 }),
      tx({ type: 'expense', amount: 12 }),
    ];
    expect(sumByType(transactions, 'expense')).toBe(42);
    expect(sumByType(transactions, 'income')).toBe(100);
  });

  it('retourne 0 sur une liste vide', () => {
    expect(sumByType([], 'expense')).toBe(0);
  });
});

describe('breakdownByCategory / topCategories', () => {
  it('regroupe par catégorie, trie décroissant et étiquette les transactions sans catégorie', () => {
    const categoriesById = new Map([
      ['cat-a', category({ id: 'cat-a', name: 'Courses', color: '#018472' })],
      ['cat-b', category({ id: 'cat-b', name: 'Loisirs', color: '#7B6CBF' })],
    ]);
    const transactions = [
      tx({ categoryId: 'cat-a', amount: 20, type: 'expense' }),
      tx({ categoryId: 'cat-a', amount: 30, type: 'expense' }),
      tx({ categoryId: 'cat-b', amount: 15, type: 'expense' }),
      tx({ categoryId: null, amount: 999, type: 'expense' }),
      tx({ categoryId: 'cat-a', amount: 1000, type: 'income' }),
    ];

    const breakdown = breakdownByCategory(transactions, 'expense', categoriesById);
    expect(breakdown).toEqual([
      { id: 'cat-a', name: 'Courses', color: '#018472', amount: 50 },
      { id: 'cat-b', name: 'Loisirs', color: '#7B6CBF', amount: 15 },
    ]);
  });

  it('topCategories limite le nombre de lignes retournées', () => {
    const categoriesById = new Map([
      ['cat-a', category({ id: 'cat-a', name: 'A' })],
      ['cat-b', category({ id: 'cat-b', name: 'B' })],
      ['cat-c', category({ id: 'cat-c', name: 'C' })],
    ]);
    const transactions = [
      tx({ categoryId: 'cat-a', amount: 5 }),
      tx({ categoryId: 'cat-b', amount: 50 }),
      tx({ categoryId: 'cat-c', amount: 25 }),
    ];
    const top = topCategories(transactions, 'expense', categoriesById, 2);
    expect(top.map((line) => line.id)).toEqual(['cat-b', 'cat-c']);
  });
});

describe('rankedAccounts', () => {
  it('classe les comptes par montant total décroissant', () => {
    const accountsById = new Map([
      ['acc-1', { id: 'acc-1', name: 'Courant' }],
      ['acc-2', { id: 'acc-2', name: 'Épargne' }],
    ]);
    const transactions = [
      tx({ accountId: 'acc-1', amount: 10 }),
      tx({ accountId: 'acc-2', amount: 500 }),
      tx({ accountId: 'acc-1', amount: 20 }),
    ];
    const ranked = rankedAccounts(transactions, accountsById, 5);
    expect(ranked).toEqual([
      { id: 'acc-2', label: 'Épargne', amount: 500 },
      { id: 'acc-1', label: 'Courant', amount: 30 },
    ]);
  });
});

describe('dailyTotalsByType', () => {
  it('retourne 0 pour les jours sans transaction et ignore les dates hors périmètre', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    const transactions = [
      tx({ date: '2026-07-01', amount: 10, type: 'expense' }),
      tx({ date: '2026-07-01', amount: 5, type: 'expense' }),
      tx({ date: '2026-07-02', amount: 7, type: 'income' }),
      tx({ date: '2026-08-01', amount: 999, type: 'expense' }),
    ];
    expect(dailyTotalsByType(transactions, 'expense', days)).toEqual([
      { date: '2026-07-01', amount: 15 },
      { date: '2026-07-02', amount: 0 },
      { date: '2026-07-03', amount: 0 },
    ]);
  });
});

describe('compareMonthTotals', () => {
  it('calcule le delta entre le mois courant et le mois précédent', () => {
    const transactions = [
      tx({ date: '2026-07-10', amount: 100, type: 'expense' }),
      tx({ date: '2026-06-10', amount: 60, type: 'expense' }),
    ];
    const result = compareMonthTotals(transactions, '2026-07-01', 'expense', null);
    expect(result).toEqual({ current: 100, previous: 60, delta: 40 });
  });
});

describe('cumulativeNetByDay', () => {
  it('cumule revenus positivement et dépenses négativement jour après jour', () => {
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    const transactions = [
      tx({ date: '2026-07-01', amount: 100, type: 'income' }),
      tx({ date: '2026-07-02', amount: 30, type: 'expense' }),
    ];
    expect(cumulativeNetByDay(transactions, days)).toEqual([
      { date: '2026-07-01', amount: 100 },
      { date: '2026-07-02', amount: 70 },
      { date: '2026-07-03', amount: 70 },
    ]);
  });
});
