import { NewTransactionTemplate, TransactionTemplate } from '../models/transaction-template.model';

export interface TransactionTemplateRepository {
  list(): Promise<TransactionTemplate[]>;
  create(input: NewTransactionTemplate): Promise<TransactionTemplate>;
  update(id: string, patch: Partial<NewTransactionTemplate>): Promise<TransactionTemplate>;
  remove(id: string): Promise<void>;
}
