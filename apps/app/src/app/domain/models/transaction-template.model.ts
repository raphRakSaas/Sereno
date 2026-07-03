import { CategoryKind } from './category.model';

export interface TransactionTemplate {
  id: string;
  name: string;
  type: CategoryKind;
  amount: number;
  categoryId: string | null;
  accountId: string | null;
  note: string | null;
  isPinned: boolean;
  sortOrder: number;
  createdAt: string;
}

export type NewTransactionTemplate = Omit<TransactionTemplate, 'id' | 'createdAt'>;

export const PINNED_TEMPLATE_LIMIT = 8;
