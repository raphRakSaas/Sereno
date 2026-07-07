import { CategoryKind } from '../models/category.model';
import { Category } from '../models/category.model';
import { isPosted, Transaction } from '../models/transaction.model';
import { shiftMonth } from './period.utils';

export interface CategoryBreakdownSlice {
  id: string;
  name: string;
  color: string;
  amount: number;
}

export interface RankedStatLine {
  id: string;
  label: string;
  amount: number;
  color?: string;
  detail?: string;
}

export interface DailyAmount {
  date: string;
  amount: number;
}

export interface MonthComparison {
  current: number;
  previous: number;
  delta: number;
}

export function filterTransactionsForPeriod(
  transactions: Transaction[],
  monthIso: string,
  accountId: string | null,
): Transaction[] {
  const monthPrefix = monthIso.slice(0, 7);
  return transactions.filter((transaction) => {
    if (!isPosted(transaction)) {
      return false;
    }
    if (!transaction.date.startsWith(monthPrefix)) {
      return false;
    }
    if (accountId) {
      const matchesSource = transaction.accountId === accountId;
      const matchesDestination =
        transaction.type === 'transfer' && transaction.transferToAccountId === accountId;
      if (!matchesSource && !matchesDestination) {
        return false;
      }
    }
    return true;
  });
}

export function sumByType(transactions: Transaction[], type: CategoryKind): number {
  return transactions
    .filter((transaction) => transaction.type === type && isPosted(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export function breakdownByCategory(
  transactions: Transaction[],
  type: CategoryKind,
  categoriesById: Map<string, Category>,
): CategoryBreakdownSlice[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== type || !transaction.categoryId || !isPosted(transaction)) {
      continue;
    }
    totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
  }
  return [...totals.entries()]
    .map(([categoryId, amount]) => {
      const category = categoriesById.get(categoryId);
      return {
        id: categoryId,
        name: category?.name ?? 'Sans catégorie',
        color: category?.color ?? '#8B948C',
        amount,
      };
    })
    .sort((left, right) => right.amount - left.amount);
}

export function topCategories(
  transactions: Transaction[],
  type: CategoryKind,
  categoriesById: Map<string, Category>,
  limit = 5,
): RankedStatLine[] {
  return breakdownByCategory(transactions, type, categoriesById)
    .slice(0, limit)
    .map((slice) => ({
      id: slice.id,
      label: slice.name,
      amount: slice.amount,
      color: slice.color,
    }));
}

export function rankedAccounts(
  transactions: Transaction[],
  accountsById: Map<string, { id: string; name: string }>,
  limit = 5,
): RankedStatLine[] {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    totals.set(transaction.accountId, (totals.get(transaction.accountId) ?? 0) + transaction.amount);
  }
  return [...totals.entries()]
    .map(([accountId, amount]) => {
      const account = accountsById.get(accountId);
      return {
        id: accountId,
        label: account?.name ?? 'Compte',
        amount,
      };
    })
    .sort((left, right) => right.amount - left.amount)
    .slice(0, limit);
}

export function dailyTotalsByType(
  transactions: Transaction[],
  type: CategoryKind,
  days: string[],
): DailyAmount[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    totals.set(day, 0);
  }
  for (const transaction of transactions) {
    if (transaction.type !== type || !isPosted(transaction)) {
      continue;
    }
    if (!totals.has(transaction.date)) {
      continue;
    }
    totals.set(transaction.date, (totals.get(transaction.date) ?? 0) + transaction.amount);
  }
  return days.map((date) => ({ date, amount: totals.get(date) ?? 0 }));
}

export function compareMonthTotals(
  allTransactions: Transaction[],
  monthIso: string,
  type: CategoryKind,
  accountId: string | null,
): MonthComparison {
  const current = sumByType(filterTransactionsForPeriod(allTransactions, monthIso, accountId), type);
  const previousMonth = shiftMonth(monthIso, -1);
  const previous = sumByType(filterTransactionsForPeriod(allTransactions, previousMonth, accountId), type);
  return { current, previous, delta: current - previous };
}

export function cumulativeNetByDay(transactions: Transaction[], days: string[]): DailyAmount[] {
  let runningTotal = 0;
  return days.map((date) => {
    for (const transaction of transactions) {
      if (transaction.date !== date || !isPosted(transaction)) {
        continue;
      }
      runningTotal += transaction.type === 'income' ? transaction.amount : -transaction.amount;
    }
    return { date, amount: runningTotal };
  });
}

export interface MonthlyTotals {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

const MONTH_LABEL = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

function monthLabel(monthIso: string): string {
  return MONTH_LABEL.format(new Date(monthIso + 'T00:00:00')).replace('.', '');
}

/** Revenus, dépenses et solde net pour une fenêtre de mois se terminant à `endMonth`. */
export function monthlyTotalsSeries(
  transactions: Transaction[],
  endMonth: string,
  count: number,
  accountId: string | null,
): MonthlyTotals[] {
  const series: MonthlyTotals[] = [];
  for (let offset = -(count - 1); offset <= 0; offset++) {
    const month = shiftMonth(endMonth, offset);
    const scoped = filterTransactionsForPeriod(transactions, month, accountId);
    const income = sumByType(scoped, 'income');
    const expense = sumByType(scoped, 'expense');
    series.push({
      month,
      label: monthLabel(month),
      income,
      expense,
      net: income - expense,
    });
  }
  return series;
}

/** Part des revenus épargnée ce mois-ci, bornée entre 0 et 100 %. */
export function savingsRatePercent(income: number, expense: number): number {
  if (income <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(((income - expense) / income) * 100)));
}
