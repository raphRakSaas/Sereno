export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  /** Horodatage de création, ISO 8601. */
  createdAt: string;
}

export type NewSavingsGoal = Omit<SavingsGoal, 'id' | 'createdAt'>;

export function savingsGoalProgressPct(goal: Pick<SavingsGoal, 'currentAmount' | 'targetAmount'>): number {
  if (goal.targetAmount <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
}
