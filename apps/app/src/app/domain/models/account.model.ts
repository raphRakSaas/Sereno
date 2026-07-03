export type AccountType =
  | 'cash'
  | 'bank'
  | 'savings'
  | 'credit_card'
  | 'debit_card'
  | 'investment'
  | 'insurance'
  | 'loan'
  | 'overdraft'
  | 'real_estate'
  | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  /** Solde de départ du compte ; le solde courant = initialBalance + somme des transactions. */
  initialBalance: number;
  currency: string;
  /** Compte masqué des listes courantes. */
  isArchived: boolean;
  /** Exclu du total général (dashboard, patrimoine). */
  excludeFromTotal: boolean;
  sortOrder: number;
  groupId: string | null;
  /** Plafond carte crédit (optionnel). */
  cardLimit: number | null;
  /** Jour du mois pour le rappel de paiement carte (1–28). */
  cardPaymentDay: number | null;
  createdAt: string;
}

export type NewAccount = Omit<Account, 'id' | 'createdAt'>;

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Espèces',
  bank: 'Compte courant',
  savings: 'Épargne',
  credit_card: 'Carte de crédit',
  debit_card: 'Carte de débit',
  investment: 'Investissement',
  insurance: 'Assurance',
  loan: 'Prêt / dette',
  overdraft: 'Découvert',
  real_estate: 'Immobilier',
  other: 'Autre',
};

export const ACCOUNT_TYPE_GROUPS: Record<AccountType, string> = {
  cash: 'Espèces',
  bank: 'Banque',
  savings: 'Épargne',
  credit_card: 'Cartes',
  debit_card: 'Cartes',
  investment: 'Investissement',
  insurance: 'Assurance',
  loan: 'Emprunts',
  overdraft: 'Banque',
  real_estate: 'Patrimoine',
  other: 'Autre',
};

export function isCardAccount(type: AccountType): boolean {
  return type === 'credit_card' || type === 'debit_card';
}

export function isLiabilityAccount(type: AccountType): boolean {
  return type === 'credit_card' || type === 'loan' || type === 'overdraft';
}
