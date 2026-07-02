export interface Budget {
  id: string;
  categoryId: string;
  /** Premier jour du mois couvert, format `yyyy-MM-01`. */
  month: string;
  limitAmount: number;
}

export type NewBudget = Omit<Budget, 'id'>;

/** Ramène une date quelconque au premier jour de son mois (`yyyy-MM-01`). */
export function monthOf(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-01`;
}
