import { Account } from '../models/account.model';
import { impactOnAccount, Transaction } from '../models/transaction.model';

/** Solde courant d'un compte = solde initial + transactions signées. */
export function balanceForAccount(account: Account, transactions: Transaction[]): number {
  const delta = transactions.reduce(
    (sum, transaction) => sum + impactOnAccount(transaction, account.id),
    0,
  );
  return account.initialBalance + delta;
}

export interface AccountBalanceLine {
  account: Account;
  balance: number;
}

export interface AccountBalanceFilter {
  /** Exclut les comptes archivés. */
  hideArchived?: boolean;
  /** Exclut les comptes marqués excludeFromTotal. */
  hideExcludedFromTotal?: boolean;
}

/** Comptes triés par solde décroissant. */
export function accountBalanceLines(
  accounts: Account[],
  transactions: Transaction[],
  filter?: AccountBalanceFilter,
): AccountBalanceLine[] {
  let visibleAccounts = accounts;
  if (filter?.hideArchived) {
    visibleAccounts = visibleAccounts.filter((account) => !account.isArchived);
  }
  if (filter?.hideExcludedFromTotal) {
    visibleAccounts = visibleAccounts.filter((account) => !account.excludeFromTotal);
  }
  return visibleAccounts
    .map((account) => ({
      account,
      balance: balanceForAccount(account, transactions),
    }))
    .sort((left, right) => right.balance - left.balance);
}
