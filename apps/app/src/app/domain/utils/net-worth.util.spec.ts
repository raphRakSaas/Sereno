import { describe, expect, it } from 'vitest';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { cumulativeNetWorthByDay, netWorthBeforeDate, totalNetWorth } from './net-worth.util';

function account(overrides: Partial<Account>): Account {
  return {
    id: overrides.id ?? 'acc-1',
    name: 'Compte courant',
    type: 'bank',
    initialBalance: 1000,
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

describe('totalNetWorth', () => {
  it('additionne les soldes de tous les comptes en tenant compte des transactions postées', () => {
    const accounts = [
      account({ id: 'acc-1', initialBalance: 1000 }),
      account({ id: 'acc-2', initialBalance: 500 }),
    ];
    const transactions = [
      tx({ accountId: 'acc-1', amount: 100, type: 'expense' }),
      tx({ accountId: 'acc-2', amount: 50, type: 'income' }),
    ];
    expect(totalNetWorth(accounts, transactions, null)).toBe(1000 - 100 + 500 + 50);
  });

  it('ignore les transactions non postées (brouillon/annulée)', () => {
    const accounts = [account({ id: 'acc-1', initialBalance: 100 })];
    const transactions = [tx({ accountId: 'acc-1', amount: 999, type: 'expense', status: 'draft' })];
    expect(totalNetWorth(accounts, transactions, null)).toBe(100);
  });

  it('se limite au compte demandé quand un filtre est fourni', () => {
    const accounts = [account({ id: 'acc-1', initialBalance: 100 }), account({ id: 'acc-2', initialBalance: 500 })];
    const transactions: Transaction[] = [];
    expect(totalNetWorth(accounts, transactions, 'acc-2')).toBe(500);
  });

  it('répercute un virement : débit sur la source, crédit sur la destination', () => {
    const accounts = [account({ id: 'acc-1', initialBalance: 200 }), account({ id: 'acc-2', initialBalance: 0 })];
    const transactions = [
      tx({ accountId: 'acc-1', transferToAccountId: 'acc-2', amount: 80, type: 'transfer' }),
    ];
    expect(totalNetWorth(accounts, transactions, null)).toBe(200);
    expect(totalNetWorth(accounts, transactions, 'acc-1')).toBe(120);
    expect(totalNetWorth(accounts, transactions, 'acc-2')).toBe(80);
  });
});

describe('netWorthBeforeDate', () => {
  it('exclut les transactions du jour donné', () => {
    const accounts = [account({ id: 'acc-1', initialBalance: 0 })];
    const transactions = [
      tx({ accountId: 'acc-1', date: '2026-07-09', amount: 50, type: 'income' }),
      tx({ accountId: 'acc-1', date: '2026-07-10', amount: 999, type: 'income' }),
    ];
    expect(netWorthBeforeDate(accounts, transactions, '2026-07-10', null)).toBe(50);
  });
});

describe('cumulativeNetWorthByDay', () => {
  it('retourne un tableau vide sans jours', () => {
    expect(cumulativeNetWorthByDay([], [], [], null)).toEqual([]);
  });

  it('cumule le patrimoine jour après jour à partir du solde initial', () => {
    const accounts = [account({ id: 'acc-1', initialBalance: 100 })];
    const days = ['2026-07-01', '2026-07-02', '2026-07-03'];
    const transactions = [
      tx({ accountId: 'acc-1', date: '2026-07-02', amount: 40, type: 'income' }),
    ];
    expect(cumulativeNetWorthByDay(accounts, transactions, days, null)).toEqual([
      { date: '2026-07-01', amount: 100 },
      { date: '2026-07-02', amount: 140 },
      { date: '2026-07-03', amount: 140 },
    ]);
  });

  it('inclut les transactions antérieures au premier jour dans le solde de départ', () => {
    const accounts = [account({ id: 'acc-1', initialBalance: 100 })];
    const days = ['2026-07-01', '2026-07-02'];
    const transactions = [tx({ accountId: 'acc-1', date: '2026-06-15', amount: 30, type: 'expense' })];
    expect(cumulativeNetWorthByDay(accounts, transactions, days, null)).toEqual([
      { date: '2026-07-01', amount: 70 },
      { date: '2026-07-02', amount: 70 },
    ]);
  });
});
