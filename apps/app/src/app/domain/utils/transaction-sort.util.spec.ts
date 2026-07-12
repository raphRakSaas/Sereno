import { describe, expect, it } from 'vitest';
import { Transaction } from '../models/transaction.model';
import { sortTransactions, TRANSACTION_SORT_LABELS } from './transaction-sort.util';

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

describe('sortTransactions', () => {
  const transactions = [
    tx({ id: 'a', date: '2026-07-01', amount: 30, categoryId: 'cat-b', createdAt: '2026-07-01T08:00:00.000Z' }),
    tx({ id: 'b', date: '2026-07-05', amount: 10, categoryId: 'cat-a', createdAt: '2026-07-05T08:00:00.000Z' }),
    tx({ id: 'c', date: '2026-07-03', amount: 20, categoryId: 'cat-c', createdAt: '2026-07-03T08:00:00.000Z' }),
  ];

  it('ne mute pas le tableau source', () => {
    const original = [...transactions];
    sortTransactions(transactions, 'amount_desc');
    expect(transactions).toEqual(original);
  });

  it('trie par date décroissante (défaut)', () => {
    expect(sortTransactions(transactions, 'date_desc').map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('trie par date croissante', () => {
    expect(sortTransactions(transactions, 'date_asc').map((t) => t.id)).toEqual(['a', 'c', 'b']);
  });

  it('trie par montant décroissant puis croissant', () => {
    expect(sortTransactions(transactions, 'amount_desc').map((t) => t.id)).toEqual(['a', 'c', 'b']);
    expect(sortTransactions(transactions, 'amount_asc').map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('trie par catégorie', () => {
    expect(sortTransactions(transactions, 'category').map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });

  it('expose un libellé pour chaque option de tri', () => {
    expect(Object.keys(TRANSACTION_SORT_LABELS)).toHaveLength(5);
    for (const label of Object.values(TRANSACTION_SORT_LABELS)) {
      expect(label).toBeTruthy();
    }
  });
});
