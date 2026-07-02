export type Frequency = 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  accountId: string;
  categoryId: string;
  /** Toujours positif ; le sens (revenu/dépense) est celui de la catégorie. */
  amount: number;
  frequency: Frequency;
  /** Prochaine date d'exécution, format `yyyy-MM-dd`. */
  nextRunDate: string;
  active: boolean;
}

export type NewRecurringRule = Omit<RecurringRule, 'id'>;

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Chaque semaine',
  monthly: 'Chaque mois',
  yearly: 'Chaque année',
};
