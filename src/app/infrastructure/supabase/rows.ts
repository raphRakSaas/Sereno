import { Account, AccountType } from '../../domain/models/account.model';
import { Budget } from '../../domain/models/budget.model';
import { Category, CategoryKind } from '../../domain/models/category.model';
import { Frequency, RecurringRule } from '../../domain/models/recurring-rule.model';
import { Transaction } from '../../domain/models/transaction.model';

/* Conversion lignes Postgres (snake_case) ↔ modèles du domain (camelCase). */

export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  initial_balance: number | string;
  currency: string;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryKind;
  icon: string;
  color: string;
}

export interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string;
  amount: number | string;
  type: CategoryKind;
  date: string;
  note: string | null;
  recurring_rule_id: string | null;
  created_at: string;
}

export interface BudgetRow {
  id: string;
  category_id: string;
  month: string;
  limit_amount: number | string;
}

export interface RecurringRuleRow {
  id: string;
  account_id: string;
  category_id: string;
  amount: number | string;
  frequency: Frequency;
  next_run_date: string;
  active: boolean;
}

/** numeric Postgres arrive en string via PostgREST. */
function num(value: number | string): number {
  return typeof value === 'number' ? value : Number.parseFloat(value);
}

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: num(row.initial_balance),
    currency: row.currency,
    createdAt: row.created_at,
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    icon: row.icon,
    color: row.color,
    isDefault: row.user_id === null,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    amount: num(row.amount),
    type: row.type,
    date: row.date,
    note: row.note,
    recurringRuleId: row.recurring_rule_id,
    createdAt: row.created_at,
  };
}

export function toBudget(row: BudgetRow): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    month: row.month,
    limitAmount: num(row.limit_amount),
  };
}

export function toRecurringRule(row: RecurringRuleRow): RecurringRule {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    amount: num(row.amount),
    frequency: row.frequency,
    nextRunDate: row.next_run_date,
    active: row.active,
  };
}
