import { describe, expect, it } from 'vitest';
import {
  daysInMonth,
  daysInWeek,
  isOnOrAfter,
  monthGridLeadingBlanks,
  shiftMonth,
  toIsoDate,
  weekStartIso,
  weekdayLabels,
  weekdayMondayFirst,
} from './period.utils';

/* 2026-07-12 est un dimanche ; 2026-07-01 est un mercredi. Ces repères servent
   d'ancre déterministe pour les calculs de semaine et de grille. */

describe('toIsoDate', () => {
  it('formate une date locale en yyyy-MM-dd avec zéros de tête', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toIsoDate(new Date(2026, 6, 31))).toBe('2026-07-31');
    expect(toIsoDate(new Date(2026, 11, 9))).toBe('2026-12-09');
  });
});

describe('weekStartIso', () => {
  it('renvoie le lundi de la semaine quand la semaine commence le lundi', () => {
    expect(weekStartIso(new Date('2026-07-12T12:00:00'), true)).toBe('2026-07-06');
  });

  it('renvoie le dimanche quand la semaine commence le dimanche', () => {
    expect(weekStartIso(new Date('2026-07-12T12:00:00'), false)).toBe('2026-07-12');
  });

  it('un lundi reste son propre début de semaine (lundi)', () => {
    expect(weekStartIso(new Date('2026-07-06T12:00:00'), true)).toBe('2026-07-06');
  });
});

describe('isOnOrAfter', () => {
  it('compare lexicographiquement deux dates ISO', () => {
    expect(isOnOrAfter('2026-07-10', '2026-07-01')).toBe(true);
    expect(isOnOrAfter('2026-07-01', '2026-07-01')).toBe(true);
    expect(isOnOrAfter('2026-06-30', '2026-07-01')).toBe(false);
  });
});

describe('shiftMonth', () => {
  it('avance et recule d’un ou plusieurs mois', () => {
    expect(shiftMonth('2026-07-01', 1)).toBe('2026-08-01');
    expect(shiftMonth('2026-07-01', -1)).toBe('2026-06-01');
    expect(shiftMonth('2026-07-01', 3)).toBe('2026-10-01');
  });

  it('franchit les bornes d’année', () => {
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
  });
});

describe('daysInMonth', () => {
  it('retourne tous les jours d’un mois de 31 jours', () => {
    const days = daysInMonth('2026-07-01');
    expect(days).toHaveLength(31);
    expect(days[0]).toBe('2026-07-01');
    expect(days.at(-1)).toBe('2026-07-31');
  });

  it('gère février d’une année non bissextile (28 jours)', () => {
    expect(daysInMonth('2026-02-01')).toHaveLength(28);
  });

  it('gère février d’une année bissextile (29 jours)', () => {
    expect(daysInMonth('2028-02-01')).toHaveLength(29);
  });
});

describe('weekdayMondayFirst', () => {
  it('indexe lundi=0 … dimanche=6', () => {
    expect(weekdayMondayFirst('2026-07-06')).toBe(0); // lundi
    expect(weekdayMondayFirst('2026-07-12')).toBe(6); // dimanche
    expect(weekdayMondayFirst('2026-07-01')).toBe(2); // mercredi
  });
});

describe('monthGridLeadingBlanks', () => {
  it('compte les cases vides avant le 1er du mois (grille lundi→dimanche)', () => {
    expect(monthGridLeadingBlanks('2026-07-01')).toBe(2); // le 1er est un mercredi
  });
});

describe('daysInWeek', () => {
  it('retourne les 7 jours consécutifs à partir du premier', () => {
    expect(daysInWeek('2026-07-06')).toEqual([
      '2026-07-06',
      '2026-07-07',
      '2026-07-08',
      '2026-07-09',
      '2026-07-10',
      '2026-07-11',
      '2026-07-12',
    ]);
  });
});

describe('weekdayLabels', () => {
  it('ordonne les libellés selon le début de semaine', () => {
    expect(weekdayLabels(true)[0]).toBe('Lun');
    expect(weekdayLabels(false)[0]).toBe('Dim');
    expect(weekdayLabels(true)).toHaveLength(7);
  });
});
