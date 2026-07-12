import { describe, expect, it } from 'vitest';
import { Transaction } from '../models/transaction.model';
import {
  dayActivityLevel,
  formatDayIntensity,
  summarizeCalendarDays,
  sumTypeForDays,
  transactionsForDay,
} from './calendar.util';

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

describe('summarizeCalendarDays', () => {
  it('agrège dépenses et revenus par jour et ignore les virements', () => {
    const days = ['2026-07-01', '2026-07-02'];
    const transactions = [
      tx({ date: '2026-07-01', type: 'expense', amount: 10 }),
      tx({ date: '2026-07-01', type: 'income', amount: 100 }),
      tx({ date: '2026-07-01', type: 'transfer', amount: 500 }),
      tx({ date: '2026-07-02', type: 'expense', amount: 5 }),
    ];
    const summaries = summarizeCalendarDays(transactions, days);
    expect(summaries.get('2026-07-01')).toEqual({
      date: '2026-07-01',
      expense: 10,
      income: 100,
      transactionCount: 2,
    });
    expect(summaries.get('2026-07-02')?.expense).toBe(5);
  });

  it('initialise chaque jour même sans transaction', () => {
    const summaries = summarizeCalendarDays([], ['2026-07-01']);
    expect(summaries.get('2026-07-01')).toEqual({
      date: '2026-07-01',
      expense: 0,
      income: 0,
      transactionCount: 0,
    });
  });
});

describe('dayActivityLevel', () => {
  it('somme dépenses et revenus', () => {
    expect(
      dayActivityLevel({ date: '2026-07-01', expense: 30, income: 20, transactionCount: 2 }),
    ).toBe(50);
  });
});

describe('transactionsForDay', () => {
  it('filtre par date et trie par création décroissante', () => {
    const transactions = [
      tx({ id: 'a', date: '2026-07-01', createdAt: '2026-07-01T08:00:00.000Z' }),
      tx({ id: 'b', date: '2026-07-01', createdAt: '2026-07-01T10:00:00.000Z' }),
      tx({ id: 'c', date: '2026-07-02' }),
    ];
    expect(transactionsForDay(transactions, '2026-07-01').map((t) => t.id)).toEqual(['b', 'a']);
  });
});

describe('formatDayIntensity', () => {
  it('retourne 0 quand il n’y a pas d’activité ou pas de pic', () => {
    expect(formatDayIntensity(0, 100)).toBe(0);
    expect(formatDayIntensity(50, 0)).toBe(0);
  });

  it('borne l’intensité minimale à 0.12', () => {
    expect(formatDayIntensity(1, 1000)).toBe(0.12);
    expect(formatDayIntensity(50, 100)).toBe(0.5);
  });
});

describe('sumTypeForDays', () => {
  it('somme un type sur un ensemble de jours', () => {
    const transactions = [
      tx({ date: '2026-07-01', type: 'expense', amount: 10 }),
      tx({ date: '2026-07-02', type: 'expense', amount: 20 }),
      tx({ date: '2026-07-03', type: 'expense', amount: 5 }), // hors périmètre
      tx({ date: '2026-07-01', type: 'income', amount: 999 }),
    ];
    expect(sumTypeForDays(transactions, ['2026-07-01', '2026-07-02'], 'expense')).toBe(30);
  });
});
