export type AccountType = 'cash' | 'bank' | 'savings' | 'credit_card';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Solde de départ du compte ; le solde courant = initialBalance + somme des transactions. */
  initialBalance: number;
  currency: string;
  createdAt: string;
}

export type NewAccount = Omit<Account, 'id' | 'createdAt'>;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Espèces',
  bank: 'Compte courant',
  savings: 'Épargne',
  credit_card: 'Carte de crédit',
};
