import { describe, expect, it } from 'vitest';
import {
  impactOnAccount,
  isPosted,
  isTransfer,
  signedAmount,
  Transaction,
} from './transaction.model';

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 'tx-1',
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

describe('isTransfer / isPosted', () => {
  it('détecte un virement', () => {
    expect(isTransfer(tx({ type: 'transfer' }))).toBe(true);
    expect(isTransfer(tx({ type: 'expense' }))).toBe(false);
  });

  it('détecte une transaction validée', () => {
    expect(isPosted(tx({ status: 'posted' }))).toBe(true);
    expect(isPosted(tx({ status: 'draft' }))).toBe(false);
    expect(isPosted(tx({ status: 'void' }))).toBe(false);
  });
});

describe('signedAmount', () => {
  it('positif pour un revenu, négatif pour une dépense, nul pour un virement', () => {
    expect(signedAmount(tx({ type: 'income', amount: 100 }))).toBe(100);
    expect(signedAmount(tx({ type: 'expense', amount: 40 }))).toBe(-40);
    expect(signedAmount(tx({ type: 'transfer', amount: 40 }))).toBe(0);
  });
});

describe('impactOnAccount', () => {
  it('ignore les transactions non validées', () => {
    expect(impactOnAccount(tx({ status: 'draft', amount: 50 }), 'acc-1')).toBe(0);
  });

  it('applique le montant signé au compte source d’un revenu/dépense', () => {
    expect(impactOnAccount(tx({ type: 'income', amount: 100 }), 'acc-1')).toBe(100);
    expect(impactOnAccount(tx({ type: 'expense', amount: 30 }), 'acc-1')).toBe(-30);
  });

  it('n’impacte pas un compte qui n’est pas concerné', () => {
    expect(impactOnAccount(tx({ type: 'expense', amount: 30, accountId: 'acc-1' }), 'acc-2')).toBe(0);
  });

  it('débite la source et crédite la destination d’un virement', () => {
    const transfer = tx({
      type: 'transfer',
      amount: 200,
      accountId: 'acc-1',
      transferToAccountId: 'acc-2',
      categoryId: null,
    });
    expect(impactOnAccount(transfer, 'acc-1')).toBe(-200);
    expect(impactOnAccount(transfer, 'acc-2')).toBe(200);
    expect(impactOnAccount(transfer, 'acc-3')).toBe(0);
  });
});
