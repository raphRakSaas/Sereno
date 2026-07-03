import { describe, expect, it } from 'vitest';
import { isGlobalBudget, monthOf, periodBoundsForMonth, projectedSpend } from './budget.model';

describe('monthOf', () => {
  it('ramène une date au premier jour de son mois', () => {
    expect(monthOf('2026-07-17')).toBe('2026-07-01');
    expect(monthOf(new Date(2026, 0, 31))).toBe('2026-01-01');
  });
});

describe('isGlobalBudget', () => {
  it('considère null et le sentinel comme un budget global', () => {
    expect(isGlobalBudget({ categoryId: null })).toBe(true);
    expect(isGlobalBudget({ categoryId: '00000000-0000-0000-0000-000000000000' })).toBe(true);
    expect(isGlobalBudget({ categoryId: 'cat-1' })).toBe(false);
  });
});

describe('periodBoundsForMonth', () => {
  it('borne un mois de 31 jours', () => {
    expect(periodBoundsForMonth('2026-07-01', 'monthly')).toEqual({ start: '2026-07-01', end: '2026-07-31' });
  });

  it('gère février en année bissextile', () => {
    expect(periodBoundsForMonth('2028-02-01', 'monthly')).toEqual({ start: '2028-02-01', end: '2028-02-29' });
  });

  it('gère février en année non bissextile', () => {
    expect(periodBoundsForMonth('2026-02-01', 'monthly')).toEqual({ start: '2026-02-01', end: '2026-02-28' });
  });

  it('une semaine dure bien 7 jours', () => {
    expect(periodBoundsForMonth('2026-07-01', 'weekly')).toEqual({ start: '2026-07-01', end: '2026-07-07' });
  });

  it('un trimestre couvre 3 mois pleins', () => {
    expect(periodBoundsForMonth('2026-07-01', 'quarterly')).toEqual({ start: '2026-07-01', end: '2026-09-30' });
  });

  it('une année couvre jusqu’au 31 décembre', () => {
    expect(periodBoundsForMonth('2026-03-01', 'yearly')).toEqual({ start: '2026-03-01', end: '2026-12-31' });
  });

  it('un mois à cheval sur une année (décembre) reste correct', () => {
    expect(periodBoundsForMonth('2026-12-01', 'monthly')).toEqual({ start: '2026-12-01', end: '2026-12-31' });
  });
});

describe('projectedSpend', () => {
  it('projette linéairement la dépense sur toute la période', () => {
    // Période de 10 jours, 3 jours écoulés (inclus), 60 € dépensés → 20 €/jour.
    const result = projectedSpend(60, '2026-07-01', '2026-07-10', '2026-07-03');
    expect(result).toBe(200);
  });

  it('le premier jour de la période compte comme 1 jour écoulé (pas 0)', () => {
    const result = projectedSpend(10, '2026-07-01', '2026-07-10', '2026-07-01');
    expect(result).toBe(100);
  });

  it('à la fin de la période, la projection égale le dépensé réel', () => {
    const result = projectedSpend(80, '2026-07-01', '2026-07-10', '2026-07-10');
    expect(result).toBe(80);
  });

  it('ne divise jamais par zéro même avec des dates incohérentes', () => {
    expect(() => projectedSpend(50, '2026-07-01', '2026-07-01', '2026-07-01')).not.toThrow();
    expect(projectedSpend(50, '2026-07-01', '2026-07-01', '2026-07-01')).toBe(50);
  });
});
