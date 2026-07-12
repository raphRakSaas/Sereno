import { describe, expect, it } from 'vitest';
import { Account } from '../models/account.model';
import { Category } from '../models/category.model';
import { Transaction } from '../models/transaction.model';
import {
  applyActivityFilters,
  countActiveFilters,
  EMPTY_ACTIVITY_FILTERS,
  parseOptionalAmount,
  transactionMatchesSearch,
} from './transaction-filter.util';

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

function account(overrides: Partial<Account>): Account {
  return {
    id: 'acc-1',
    name: 'Courant',
    type: 'bank',
    initialBalance: 0,
    currency: 'EUR',
    isArchived: false,
    excludeFromTotal: false,
    sortOrder: 0,
    groupId: null,
    cardLimit: null,
    cardPaymentDay: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('parseOptionalAmount', () => {
  it('parse un montant français ou anglais', () => {
    expect(parseOptionalAmount('12,50')).toBe(12.5);
    expect(parseOptionalAmount('12.50')).toBe(12.5);
    expect(parseOptionalAmount(' 1 000 ')).toBe(1000); // tous les espaces sont retirés
    expect(parseOptionalAmount('1000')).toBe(1000);
  });

  it('retourne null pour une entrée vide ou invalide', () => {
    expect(parseOptionalAmount('')).toBeNull();
    expect(parseOptionalAmount('abc')).toBeNull();
    expect(parseOptionalAmount('12,999')).toBeNull(); // plus de 2 décimales
  });
});

describe('countActiveFilters', () => {
  it('vaut 0 pour des filtres vides', () => {
    expect(countActiveFilters(EMPTY_ACTIVITY_FILTERS)).toBe(0);
  });

  it('compte chaque filtre actif', () => {
    expect(
      countActiveFilters({
        ...EMPTY_ACTIVITY_FILTERS,
        searchQuery: 'café',
        type: 'expense',
        amountMin: 5,
        markerColor: '#FF0000',
      }),
    ).toBe(4);
  });
});

describe('transactionMatchesSearch', () => {
  it('retourne vrai quand la requête est vide', () => {
    expect(transactionMatchesSearch(tx({}), '', undefined, undefined)).toBe(true);
  });

  it('cherche dans la note, la catégorie et le compte, en ignorant les accents', () => {
    const transaction = tx({ note: 'Marché du samedi' });
    const cat = category({ name: 'Courses' });
    const acc = account({ name: 'Compte courant' });
    expect(transactionMatchesSearch(transaction, 'marche', cat, acc)).toBe(true);
    expect(transactionMatchesSearch(transaction, 'courses', cat, acc)).toBe(true);
    expect(transactionMatchesSearch(transaction, 'introuvable', cat, acc)).toBe(false);
  });

  it('cherche par montant', () => {
    const transaction = tx({ amount: 42.5 });
    expect(transactionMatchesSearch(transaction, '42,50', undefined, undefined)).toBe(true);
    expect(transactionMatchesSearch(transaction, '42', undefined, undefined)).toBe(true);
  });
});

describe('applyActivityFilters', () => {
  const categoriesById = new Map([['cat-1', category({})]]);
  const accountsById = new Map([['acc-1', account({})]]);

  it('ne garde que les transactions validées', () => {
    const transactions = [tx({ id: 'ok' }), tx({ id: 'draft', status: 'draft' })];
    const result = applyActivityFilters(
      transactions,
      EMPTY_ACTIVITY_FILTERS,
      categoriesById,
      accountsById,
    );
    expect(result.map((t) => t.id)).toEqual(['ok']);
  });

  it('filtre par type, plage de montant et récurrence', () => {
    const transactions = [
      tx({ id: 'a', type: 'expense', amount: 10 }),
      tx({ id: 'b', type: 'income', amount: 100 }),
      tx({ id: 'c', type: 'expense', amount: 500, recurringRuleId: 'r1' }),
    ];
    const result = applyActivityFilters(
      transactions,
      { ...EMPTY_ACTIVITY_FILTERS, type: 'expense', amountMin: 50 },
      categoriesById,
      accountsById,
    );
    expect(result.map((t) => t.id)).toEqual(['c']);
  });

  it('filtre par présence de reçu', () => {
    const transactions = [tx({ id: 'with' }), tx({ id: 'without' })];
    const withReceipt = new Set(['with']);
    const result = applyActivityFilters(
      transactions,
      { ...EMPTY_ACTIVITY_FILTERS, photoFilter: 'yes' },
      categoriesById,
      accountsById,
      withReceipt,
    );
    expect(result.map((t) => t.id)).toEqual(['with']);
  });

  it('filtre par étiquette de couleur', () => {
    const transactions = [
      tx({ id: 'red', markerColor: '#FF0000' }),
      tx({ id: 'none', markerColor: null }),
    ];
    expect(
      applyActivityFilters(
        transactions,
        { ...EMPTY_ACTIVITY_FILTERS, markerColor: 'none' },
        categoriesById,
        accountsById,
      ).map((t) => t.id),
    ).toEqual(['none']);
    expect(
      applyActivityFilters(
        transactions,
        { ...EMPTY_ACTIVITY_FILTERS, markerColor: '#FF0000' },
        categoriesById,
        accountsById,
      ).map((t) => t.id),
    ).toEqual(['red']);
  });
});
