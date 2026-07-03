import { CategoryKind } from './category.model';

export type TransactionType = CategoryKind | 'transfer';

export type TransactionStatus = 'draft' | 'posted' | 'void';

export interface Transaction {
  id: string;
  /** Compte source (ou compte unique pour revenu/dépense). */
  accountId: string;
  categoryId: string | null;
  /** Compte destination pour un virement. */
  transferToAccountId: string | null;
  /** Toujours positif ; le sens est porté par `type`. */
  amount: number;
  type: TransactionType;
  /** Date comptable au format ISO `yyyy-MM-dd`. */
  date: string;
  note: string | null;
  /** Couleur de marqueur visuel, ou null si aucune. */
  markerColor: string | null;
  /** Brouillon, validée (posted) ou annulée (void). Seules les posted comptent dans les totaux. */
  status: TransactionStatus;
  recurringRuleId: string | null;
  createdAt: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>;

export function isTransfer(transaction: Pick<Transaction, 'type'>): boolean {
  return transaction.type === 'transfer';
}

export function isPosted(transaction: Pick<Transaction, 'status'>): boolean {
  return transaction.status === 'posted';
}

/** Contribution signée d'une transaction revenu/dépense à un solde. */
export function signedAmount(transaction: Pick<Transaction, 'amount' | 'type'>): number {
  if (transaction.type === 'transfer') {
    return 0;
  }
  return transaction.type === 'income' ? transaction.amount : -transaction.amount;
}

/** Impact d'une transaction (y compris virement) sur un compte donné. */
export function impactOnAccount(
  transaction: Pick<Transaction, 'accountId' | 'transferToAccountId' | 'amount' | 'type' | 'status'>,
  accountId: string,
): number {
  if (!isPosted(transaction)) {
    return 0;
  }
  if (transaction.type === 'transfer') {
    if (transaction.accountId === accountId) {
      return -transaction.amount;
    }
    if (transaction.transferToAccountId === accountId) {
      return transaction.amount;
    }
    return 0;
  }
  if (transaction.accountId !== accountId) {
    return 0;
  }
  return signedAmount(transaction);
}
