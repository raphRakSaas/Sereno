import { Frequency } from '../models/recurring-rule.model';

/** Avance une date ISO d'un pas de fréquence (aligné sur process-recurring). */
export function advanceRecurringDate(dateIso: string, frequency: Frequency): string {
  const [year, month, day] = dateIso.split('-').map(Number);
  if (frequency === 'weekly') {
    const nextDate = new Date(Date.UTC(year, month - 1, day + 7));
    return nextDate.toISOString().slice(0, 10);
  }
  const targetYear = frequency === 'yearly' ? year + 1 : month === 12 ? year + 1 : year;
  const targetMonth = frequency === 'yearly' ? month : month === 12 ? 1 : month + 1;
  const daysInTargetMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const clampedDay = Math.min(day, daysInTargetMonth);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function upcomingOccurrences(
  nextRunDate: string,
  frequency: Frequency,
  count: number,
  active: boolean,
): string[] {
  if (!active || count <= 0) {
    return [];
  }
  const dates: string[] = [];
  let cursor = nextRunDate;
  for (let index = 0; index < count; index++) {
    dates.push(cursor);
    cursor = advanceRecurringDate(cursor, frequency);
  }
  return dates;
}

export function formatOccurrencePreview(dates: string[]): string {
  if (dates.length === 0) {
    return '';
  }
  const formatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  return dates.map((dateIso) => formatter.format(new Date(dateIso + 'T00:00:00'))).join(', ');
}
