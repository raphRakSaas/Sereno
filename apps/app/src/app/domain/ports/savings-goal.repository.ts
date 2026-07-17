import { NewSavingsGoal, SavingsGoal } from '../models/savings-goal.model';

export interface SavingsGoalRepository {
  list(): Promise<SavingsGoal[]>;
  create(input: NewSavingsGoal): Promise<SavingsGoal>;
  update(id: string, patch: Partial<NewSavingsGoal>): Promise<SavingsGoal>;
  remove(id: string): Promise<void>;
}
