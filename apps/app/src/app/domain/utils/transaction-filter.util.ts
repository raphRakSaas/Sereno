import { Account } from '../models/account.model';
import { Category, CategoryKind } from '../models/category.model';
import { Transaction, TransactionType } from '../models/transaction.model';

export type RecurringFilter = 'all' | 'yes' | 'no';
export type TypeFilter = 'all' | TransactionType;
export type PhotoFilter = 'all' | 'yes' | 'no';

export type MarkerColorFilter = 'all' | 'none' | string;

export interface ActivityFilters {
  searchQuery: string;
  type: TypeFilter;
  accountId: string | null;
  categoryId: string | null;
  amountMin: number | null;
  amountMax: number | null;
  recurring: RecurringFilter;
  /** Borne basse inclusive (`yyyy-MM-dd`). */
  dateFrom: string | null;
  /** Borne haute inclusive (`yyyy-MM-dd`). */
  dateTo: string | null;
  /** Filtre présence d’un reçu / photo jointe. */
  photoFilter: PhotoFilter;
  /** Compte carte (crédit ou débit) concerné par la transaction. */
  cardAccountId: string | null;
  /** `all` = toutes, `none` = sans marqueur, sinon hex `#RRGGBB`. */
  markerColor: MarkerColorFilter;
}

export const EMPTY_ACTIVITY_FILTERS: ActivityFilters = {
  searchQuery: '',
  type: 'all',
  accountId: null,
  categoryId: null,
  amountMin: null,
  amountMax: null,
  recurring: 'all',
  dateFrom: null,
  dateTo: null,
  photoFilter: 'all',
  cardAccountId: null,
  markerColor: 'all',
};

export function parseOptionalAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    return null;
  }
  return Number.parseFloat(normalized);
}

export function countActiveFilters(filters: ActivityFilters): number {
  let count = 0;
  if (filters.searchQuery.trim()) {
    count++;
  }
  if (filters.type !== 'all') {
    count++;
  }
  if (filters.accountId) {
    count++;
  }
  if (filters.categoryId) {
    count++;
  }
  if (filters.amountMin !== null) {
    count++;
  }
  if (filters.amountMax !== null) {
    count++;
  }
  if (filters.recurring !== 'all') {
    count++;
  }
  if (filters.dateFrom) {
    count++;
  }
  if (filters.dateTo) {
    count++;
  }
  if (filters.photoFilter !== 'all') {
    count++;
  }
  if (filters.cardAccountId) {
    count++;
  }
  if (filters.markerColor !== 'all') {
    count++;
  }
  return count;
}

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function formatAmountForSearch(amount: number): string[] {
  const fixed = amount.toFixed(2);
  return [fixed, fixed.replace('.', ','), String(Math.round(amount))];
}

export function transactionMatchesSearch(
  transaction: Transaction,
  query: string,
  category: Category | undefined,
  account: Account | undefined,
  destinationAccount?: Account,
): boolean {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return true;
  }

  const haystackParts = [
    transaction.note ?? '',
    category?.name ?? '',
    account?.name ?? '',
    destinationAccount?.name ?? '',
    transaction.type === 'transfer' ? 'transfert virement' : '',
    transaction.date,
    ...formatAmountForSearch(transaction.amount),
  ].map(normalizeText);

  if (haystackParts.some((part) => part.includes(normalizedQuery))) {
    return true;
  }

  const amountQuery = parseOptionalAmount(query);
  return amountQuery !== null && Math.abs(transaction.amount - amountQuery) < 0.005;
}

export function applyActivityFilters(
  transactions: Transaction[],
  filters: ActivityFilters,
  categoriesById: Map<string, Category>,
  accountsById: Map<string, Account>,
  transactionIdsWithReceipt: ReadonlySet<string> = new Set(),
): Transaction[] {
  return transactions.filter((transaction) => {
    if (transaction.status !== 'posted') {
      return false;
    }
    if (filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }
    if (filters.accountId) {
      const matchesSource = transaction.accountId === filters.accountId;
      const matchesDestination =
        transaction.type === 'transfer' && transaction.transferToAccountId === filters.accountId;
      if (!matchesSource && !matchesDestination) {
        return false;
      }
    }
    if (filters.cardAccountId) {
      const matchesSource = transaction.accountId === filters.cardAccountId;
      const matchesDestination =
        transaction.type === 'transfer' && transaction.transferToAccountId === filters.cardAccountId;
      if (!matchesSource && !matchesDestination) {
        return false;
      }
    }
    if (filters.categoryId && transaction.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.amountMin !== null && transaction.amount < filters.amountMin) {
      return false;
    }
    if (filters.amountMax !== null && transaction.amount > filters.amountMax) {
      return false;
    }
    if (filters.recurring === 'yes' && !transaction.recurringRuleId) {
      return false;
    }
    if (filters.recurring === 'no' && transaction.recurringRuleId) {
      return false;
    }
    if (filters.dateFrom && transaction.date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && transaction.date > filters.dateTo) {
      return false;
    }
    if (filters.photoFilter === 'yes' && !transactionIdsWithReceipt.has(transaction.id)) {
      return false;
    }
    if (filters.photoFilter === 'no' && transactionIdsWithReceipt.has(transaction.id)) {
      return false;
    }
    if (filters.markerColor === 'none' && transaction.markerColor) {
      return false;
    }
    if (
      filters.markerColor !== 'all' &&
      filters.markerColor !== 'none' &&
      transaction.markerColor !== filters.markerColor
    ) {
      return false;
    }

    const category = transaction.categoryId ? categoriesById.get(transaction.categoryId) : undefined;
    const account = accountsById.get(transaction.accountId);
    const destinationAccount = transaction.transferToAccountId
      ? accountsById.get(transaction.transferToAccountId)
      : undefined;
    return transactionMatchesSearch(
      transaction,
      filters.searchQuery,
      category,
      account,
      destinationAccount,
    );
  });
}
