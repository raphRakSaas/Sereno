import { CategoryKind } from './category.model';

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string;
  /** Toujours positif ; le sens est porté par `type`. */
  amount: number;
  type: CategoryKind;
  /** Date comptable au format ISO `yyyy-MM-dd`. */
  date: string;
  note: string | null;
  recurringRuleId: string | null;
  createdAt: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

/** Contribution signée d'une transaction à un solde. */
export function signedAmount(t: Pick<Transaction, 'amount' | 'type'>): number {
  return t.type === 'income' ? t.amount : -t.amount;
}
