import { describe, expect, it } from 'vitest';
import { RecurringRule } from '../models/recurring-rule.model';
import { planRecurringOccurrences } from './recurring-generation.util';

function rule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    amount: 42,
    frequency: 'monthly',
    nextRunDate: '2026-05-01',
    endDate: null,
    active: true,
    ...overrides,
  };
}

describe('planRecurringOccurrences', () => {
  it('rattrape les échéances manquées et avance nextRunDate', () => {
    const result = planRecurringOccurrences({
      rule: rule({ nextRunDate: '2026-05-01', frequency: 'monthly' }),
      categoryType: 'expense',
      todayIso: '2026-07-15',
      existingOccurrenceDates: new Set(),
    });

    expect(result.transactionsToCreate.map((transaction) => transaction.date)).toEqual([
      '2026-05-01',
      '2026-06-01',
      '2026-07-01',
    ]);
    expect(result.nextRunDate).toBe('2026-08-01');
    expect(result.deactivate).toBe(false);
    expect(result.transactionsToCreate[0]?.type).toBe('expense');
    expect(result.transactionsToCreate[0]?.amount).toBe(42);
    expect(result.transactionsToCreate[0]?.idempotencyKey).toBe('rule-1:2026-05-01');
  });

  it('reste idempotent quand des dates existent déjà', () => {
    const result = planRecurringOccurrences({
      rule: rule({ nextRunDate: '2026-05-01', frequency: 'monthly' }),
      categoryType: 'income',
      todayIso: '2026-07-15',
      existingOccurrenceDates: new Set(['2026-05-01', '2026-06-01']),
    });

    expect(result.transactionsToCreate.map((transaction) => transaction.date)).toEqual(['2026-07-01']);
    expect(result.transactionsToCreate[0]?.type).toBe('income');
    expect(result.nextRunDate).toBe('2026-08-01');
  });

  it('désactive la règle quand endDate est dépassée', () => {
    const result = planRecurringOccurrences({
      rule: rule({ nextRunDate: '2026-06-01', endDate: '2026-06-15', frequency: 'monthly' }),
      categoryType: 'expense',
      todayIso: '2026-07-15',
      existingOccurrenceDates: new Set(),
    });

    expect(result.transactionsToCreate.map((transaction) => transaction.date)).toEqual(['2026-06-01']);
    expect(result.nextRunDate).toBe('2026-07-01');
    expect(result.deactivate).toBe(true);
  });

  it('ne génère rien pour une règle inactive', () => {
    const result = planRecurringOccurrences({
      rule: rule({ active: false, nextRunDate: '2026-01-01' }),
      categoryType: 'expense',
      todayIso: '2026-07-15',
      existingOccurrenceDates: new Set(),
    });

    expect(result.transactionsToCreate).toEqual([]);
    expect(result.nextRunDate).toBe('2026-01-01');
    expect(result.deactivate).toBe(false);
  });
});
