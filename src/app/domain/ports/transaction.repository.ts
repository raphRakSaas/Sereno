import { NewTransaction, Transaction } from '../models/transaction.model';

export interface TransactionFilter {
  accountId?: string;
  categoryId?: string;
  /** Premier jour du mois (`yyyy-MM-01`) pour filtrer sur un mois entier. */
  month?: string;
  limit?: number;
}

export interface TransactionRepository {
  list(filter?: TransactionFilter): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(input: NewTransaction): Promise<Transaction>;
  update(id: string, patch: Partial<NewTransaction>): Promise<Transaction>;
  remove(id: string): Promise<void>;
  count(): Promise<number>;
}
