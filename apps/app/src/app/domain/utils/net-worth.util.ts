import { Account } from '../models/account.model';
import { impactOnAccount, Transaction } from '../models/transaction.model';
import { balanceForAccount } from './account-balance.util';

export interface DailyNetWorth {
  date: string;
  amount: number;
}

function scopedAccounts(accounts: Account[], accountId: string | null): Account[] {
  if (!accountId) {
    return accounts;
  }
  return accounts.filter((account) => account.id === accountId);
}

/** Patrimoine total (somme des soldes comptes). */
export function totalNetWorth(accounts: Account[], transactions: Transaction[], accountId: string | null): number {
  return scopedAccounts(accounts, accountId).reduce(
    (sum, account) => sum + balanceForAccount(account, transactions),
    0,
  );
}

/** Patrimoine juste avant une date (exclut les transactions du jour). */
export function netWorthBeforeDate(
  accounts: Account[],
  transactions: Transaction[],
  dateIso: string,
  accountId: string | null,
): number {
  return scopedAccounts(accounts, accountId).reduce((sum, account) => {
    let balance = account.initialBalance;
    for (const transaction of transactions) {
      if (transaction.date < dateIso) {
        balance += impactOnAccount(transaction, account.id);
      }
    }
    return sum + balance;
  }, 0);
}

/** Patrimoine cumulé à la fin de chaque jour du mois. */
export function cumulativeNetWorthByDay(
  accounts: Account[],
  transactions: Transaction[],
  days: string[],
  accountId: string | null,
): DailyNetWorth[] {
  if (days.length === 0) {
    return [];
  }

  const monthStart = days[0];
  const runningByAccount = new Map(
    scopedAccounts(accounts, accountId).map((account) => [account.id, account.initialBalance]),
  );

  for (const transaction of transactions) {
    if (transaction.date >= monthStart) {
      continue;
    }
    for (const account of scopedAccounts(accounts, accountId)) {
      runningByAccount.set(
        account.id,
        (runningByAccount.get(account.id) ?? account.initialBalance) +
          impactOnAccount(transaction, account.id),
      );
    }
  }

  return days.map((date) => {
    for (const transaction of transactions) {
      if (transaction.date !== date) {
        continue;
      }
      for (const account of scopedAccounts(accounts, accountId)) {
        runningByAccount.set(
          account.id,
          (runningByAccount.get(account.id) ?? account.initialBalance) +
            impactOnAccount(transaction, account.id),
        );
      }
    }
    let total = 0;
    for (const balance of runningByAccount.values()) {
      total += balance;
    }
    return { date, amount: total };
  });
}
