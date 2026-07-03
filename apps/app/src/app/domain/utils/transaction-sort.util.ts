import { TransactionSort } from '../../application/services/user-preferences.service';
import { Transaction } from '../models/transaction.model';

export function sortTransactions(transactions: Transaction[], sort: TransactionSort): Transaction[] {
  const copy = [...transactions];
  switch (sort) {
    case 'date_asc':
      return copy.sort(
        (left, right) => left.date.localeCompare(right.date) || left.createdAt.localeCompare(right.createdAt),
      );
    case 'amount_desc':
      return copy.sort((left, right) => right.amount - left.amount || right.date.localeCompare(left.date));
    case 'amount_asc':
      return copy.sort((left, right) => left.amount - right.amount || right.date.localeCompare(left.date));
    case 'category':
      return copy.sort(
        (left, right) =>
          (left.categoryId ?? '').localeCompare(right.categoryId ?? '') || right.date.localeCompare(left.date),
      );
    case 'date_desc':
    default:
      return copy.sort(
        (left, right) => right.date.localeCompare(left.date) || right.createdAt.localeCompare(left.createdAt),
      );
  }
}

export const TRANSACTION_SORT_LABELS: Record<TransactionSort, string> = {
  date_desc: 'Date (récent)',
  date_asc: 'Date (ancien)',
  amount_desc: 'Montant (↓)',
  amount_asc: 'Montant (↑)',
  category: 'Catégorie',
};
