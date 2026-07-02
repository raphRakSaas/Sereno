export type AccountGroupKind =
  | 'bank'
  | 'cash'
  | 'cards'
  | 'savings'
  | 'investment'
  | 'other'
  | 'custom';

export interface AccountGroup {
  id: string;
  name: string;
  kind: AccountGroupKind;
  isVisible: boolean;
  includeInTotal: boolean;
  sortOrder: number;
  createdAt: string;
}

export type NewAccountGroup = Omit<AccountGroup, 'id' | 'createdAt'>;

export const ACCOUNT_GROUP_KIND_LABELS: Record<AccountGroupKind, string> = {
  bank: 'Banque',
  cash: 'Espèces',
  cards: 'Cartes',
  savings: 'Épargne',
  investment: 'Investissement',
  other: 'Autre',
  custom: 'Personnalisé',
};
