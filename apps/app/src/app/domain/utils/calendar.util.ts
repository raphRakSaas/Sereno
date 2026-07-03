import { CategoryKind } from '../models/category.model';
import { Transaction } from '../models/transaction.model';

export interface CalendarDaySummary {
  date: string;
  expense: number;
  income: number;
  transactionCount: number;
}

export function summarizeCalendarDays(
  transactions: Transaction[],
  days: string[],
): Map<string, CalendarDaySummary> {
  const summaries = new Map<string, CalendarDaySummary>();
  for (const date of days) {
    summaries.set(date, { date, expense: 0, income: 0, transactionCount: 0 });
  }
  for (const transaction of transactions) {
    const summary = summaries.get(transaction.date);
    if (!summary) {
      continue;
    }
    if (transaction.type === 'transfer') {
      continue;
    }
    summary.transactionCount += 1;
    if (transaction.type === 'expense') {
      summary.expense += transaction.amount;
    } else {
      summary.income += transaction.amount;
    }
  }
  return summaries;
}

export function dayActivityLevel(summary: CalendarDaySummary): number {
  return summary.expense + summary.income;
}

export function transactionsForDay(transactions: Transaction[], dateIso: string): Transaction[] {
  return transactions
    .filter((transaction) => transaction.date === dateIso)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function formatDayIntensity(level: number, peak: number): number {
  if (peak <= 0 || level <= 0) {
    return 0;
  }
  return Math.max(0.12, level / peak);
}

export function sumTypeForDays(
  transactions: Transaction[],
  days: string[],
  type: CategoryKind,
): number {
  const daySet = new Set(days);
  return transactions
    .filter((transaction) => transaction.type === type && daySet.has(transaction.date))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}
