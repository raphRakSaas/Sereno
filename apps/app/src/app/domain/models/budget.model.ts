export type BudgetPeriodType = 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

/** UUID sentinelle pour budget global invité (categoryId null côté Supabase). */
export const GLOBAL_BUDGET_CATEGORY_ID = '00000000-0000-0000-0000-000000000000';

export interface Budget {
  id: string;
  /** null ou GLOBAL_BUDGET_CATEGORY_ID = budget global toutes catégories. */
  categoryId: string | null;
  /** Premier jour du mois couvert, format `yyyy-MM-01`. */
  month: string;
  limitAmount: number;
  periodType: BudgetPeriodType;
  periodStart: string;
  periodEnd: string;
  alertThresholdPct: number;
}

export type NewBudget = Omit<Budget, 'id'>;

export const BUDGET_PERIOD_LABELS: Record<BudgetPeriodType, string> = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
  custom: 'Personnalisé',
};

/** Ramène une date quelconque au premier jour de son mois (`yyyy-MM-01`). */
export function monthOf(date: string | Date): string {
  const dateValue = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

export function isGlobalBudget(budget: Pick<Budget, 'categoryId'>): boolean {
  return !budget.categoryId || budget.categoryId === GLOBAL_BUDGET_CATEGORY_ID;
}

export function periodBoundsForMonth(month: string, periodType: BudgetPeriodType): { start: string; end: string } {
  const startDate = new Date(month + 'T00:00:00');
  if (periodType === 'monthly') {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);
    return { start: month, end: toIsoDate(endDate) };
  }
  if (periodType === 'weekly') {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return { start: month, end: toIsoDate(endDate) };
  }
  if (periodType === 'quarterly') {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);
    endDate.setDate(0);
    return { start: month, end: toIsoDate(endDate) };
  }
  if (periodType === 'yearly') {
    const endDate = new Date(startDate.getFullYear(), 11, 31);
    return { start: month, end: toIsoDate(endDate) };
  }
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  return { start: month, end: toIsoDate(endDate) };
}

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Projection linéaire fin de période à partir des dépenses actuelles. */
export function projectedSpend(spent: number, periodStart: string, periodEnd: string, todayIso: string): number {
  const start = new Date(periodStart + 'T00:00:00').getTime();
  const end = new Date(periodEnd + 'T00:00:00').getTime();
  const today = new Date(todayIso + 'T00:00:00').getTime();
  const totalDays = Math.max(1, Math.round((end - start) / 86_400_000) + 1);
  const elapsedDays = Math.max(1, Math.round((today - start) / 86_400_000) + 1);
  return (spent / elapsedDays) * totalDays;
}
