import { Budget, NewBudget } from '../models/budget.model';

export interface BudgetRepository {
  /** Tous les budgets (export, migration). */
  listAll(): Promise<Budget[]>;
  /** Budgets du mois donné (`yyyy-MM-01`). */
  listByMonth(month: string): Promise<Budget[]>;
  /** Crée ou remplace le budget (catégorie, mois) — une seule limite par couple. */
  upsert(input: NewBudget): Promise<Budget>;
  remove(id: string): Promise<void>;
}
