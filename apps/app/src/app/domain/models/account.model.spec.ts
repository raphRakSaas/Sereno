import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_TYPE_GROUPS,
  ACCOUNT_TYPE_LABELS,
  AccountType,
  isCardAccount,
  isLiabilityAccount,
} from './account.model';

describe('isCardAccount', () => {
  it('reconnaît les cartes de crédit et de débit', () => {
    expect(isCardAccount('credit_card')).toBe(true);
    expect(isCardAccount('debit_card')).toBe(true);
    expect(isCardAccount('bank')).toBe(false);
    expect(isCardAccount('cash')).toBe(false);
  });
});

describe('isLiabilityAccount', () => {
  it('reconnaît les comptes de passif (crédit, prêt, découvert)', () => {
    expect(isLiabilityAccount('credit_card')).toBe(true);
    expect(isLiabilityAccount('loan')).toBe(true);
    expect(isLiabilityAccount('overdraft')).toBe(true);
    expect(isLiabilityAccount('savings')).toBe(false);
    expect(isLiabilityAccount('debit_card')).toBe(false);
  });
});

describe('libellés de types de compte', () => {
  it('couvre tous les types déclarés (labels et groupes)', () => {
    const types: AccountType[] = [
      'cash',
      'bank',
      'savings',
      'credit_card',
      'debit_card',
      'investment',
      'insurance',
      'loan',
      'overdraft',
      'real_estate',
      'other',
    ];
    for (const type of types) {
      expect(ACCOUNT_TYPE_LABELS[type]).toBeTruthy();
      expect(ACCOUNT_TYPE_GROUPS[type]).toBeTruthy();
    }
  });
});
