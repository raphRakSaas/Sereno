import { describe, expect, it } from 'vitest';
import { Account } from '../models/account.model';
import { Transaction } from '../models/transaction.model';
import { accountBalanceLines, balanceForAccount } from './account-balance.util';

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

describe('balanceForAccount', () => {
  it('additionne le solde initial et les transactions signées validées', () => {
    const acc = account({ id: 'acc-1', initialBalance: 1000 });
    const transactions = [
      tx({ accountId: 'acc-1', type: 'income', amount: 500 }),
      tx({ accountId: 'acc-1', type: 'expense', amount: 200 }),
      tx({ accountId: 'acc-1', type: 'expense', amount: 50, status: 'draft' }), // ignorée
      tx({ accountId: 'acc-2', type: 'expense', amount: 999 }), // autre compte
    ];
    expect(balanceForAccount(acc, transactions)).toBe(1300);
  });

  it('prend en compte les virements entrants et sortants', () => {
    const source = account({ id: 'acc-1', initialBalance: 1000 });
    const target = account({ id: 'acc-2', initialBalance: 0 });
    const transfer = tx({
      type: 'transfer',
      amount: 300,
      accountId: 'acc-1',
      transferToAccountId: 'acc-2',
      categoryId: null,
    });
    expect(balanceForAccount(source, [transfer])).toBe(700);
    expect(balanceForAccount(target, [transfer])).toBe(300);
  });
});

describe('accountBalanceLines', () => {
  it('trie les comptes par solde décroissant', () => {
    const accounts = [
      account({ id: 'acc-1', name: 'Courant', initialBalance: 100 }),
      account({ id: 'acc-2', name: 'Épargne', initialBalance: 5000 }),
    ];
    const lines = accountBalanceLines(accounts, []);
    expect(lines.map((line) => line.account.id)).toEqual(['acc-2', 'acc-1']);
  });

  it('respecte les filtres archivé et exclu du total', () => {
    const accounts = [
      account({ id: 'a', initialBalance: 10 }),
      account({ id: 'b', initialBalance: 20, isArchived: true }),
      account({ id: 'c', initialBalance: 30, excludeFromTotal: true }),
    ];
    const lines = accountBalanceLines(accounts, [], {
      hideArchived: true,
      hideExcludedFromTotal: true,
    });
    expect(lines.map((line) => line.account.id)).toEqual(['a']);
  });
});
