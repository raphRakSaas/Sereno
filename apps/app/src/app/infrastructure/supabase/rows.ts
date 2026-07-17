import { Account, AccountType } from '../../domain/models/account.model';
import { Budget, BudgetPeriodType, GLOBAL_BUDGET_CATEGORY_ID, periodBoundsForMonth } from '../../domain/models/budget.model';
import { Category, CategoryKind } from '../../domain/models/category.model';
import { Frequency, RecurringRule } from '../../domain/models/recurring-rule.model';
import { Receipt, ReceiptExtractedData, ReceiptStatus } from '../../domain/models/receipt.model';
import { SavingsGoal } from '../../domain/models/savings-goal.model';
import { Transaction, TransactionStatus, TransactionType } from '../../domain/models/transaction.model';
import { TransactionTemplate } from '../../domain/models/transaction-template.model';

/* Conversion lignes Postgres (snake_case) ↔ modèles du domain (camelCase). */

export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  initial_balance: number | string;
  currency: string;
  is_archived: boolean;
  exclude_from_total: boolean;
  sort_order: number;
  group_id: string | null;
  card_limit: number | string | null;
  card_payment_day: number | null;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryKind;
  icon: string;
  color: string;
  parent_id: string | null;
  display_order: number;
  is_archived: boolean;
}

export interface TransactionRow {
  id: string;
  account_id: string;
  category_id: string | null;
  transfer_to_account_id: string | null;
  amount: number | string;
  type: TransactionType;
  date: string;
  note: string | null;
  marker_color: string | null;
  status: TransactionStatus;
  recurring_rule_id: string | null;
  created_at: string;
}

export interface BudgetRow {
  id: string;
  category_id: string | null;
  month: string;
  limit_amount: number | string;
  period_type: BudgetPeriodType;
  period_start: string;
  period_end: string;
  alert_threshold_pct: number | string;
}

export interface RecurringRuleRow {
  id: string;
  account_id: string;
  category_id: string;
  amount: number | string;
  frequency: Frequency;
  next_run_date: string;
  end_date: string | null;
  active: boolean;
}

export interface ReceiptRow {
  id: string;
  user_id: string;
  transaction_id: string | null;
  storage_path: string;
  mime_type: string;
  file_size_bytes: number;
  status: ReceiptStatus;
  extracted_data: ReceiptExtractedData | null;
  ocr_provider: string;
  ocr_processed_at: string | null;
  created_at: string;
}

export interface TransactionTemplateRow {
  id: string;
  user_id: string;
  name: string;
  type: CategoryKind;
  amount: number | string;
  category_id: string | null;
  account_id: string | null;
  note: string | null;
  is_pinned: boolean;
  sort_order: number;
  created_at: string;
}

export interface SavingsGoalRow {
  id: string;
  user_id: string;
  name: string;
  target_amount: number | string;
  current_amount: number | string;
  created_at: string;
}

/** numeric Postgres arrive en string via PostgREST. */
function num(value: number | string): number {
  return typeof value === 'number' ? value : Number.parseFloat(value);
}

function numOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return num(value);
}

export function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initialBalance: num(row.initial_balance),
    currency: row.currency,
    isArchived: row.is_archived ?? false,
    excludeFromTotal: row.exclude_from_total ?? false,
    sortOrder: row.sort_order ?? 0,
    groupId: row.group_id ?? null,
    cardLimit: numOrNull(row.card_limit),
    cardPaymentDay: row.card_payment_day ?? null,
    createdAt: row.created_at,
  };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    parentId: row.parent_id ?? null,
    icon: row.icon,
    color: row.color,
    isDefault: row.user_id === null,
    displayOrder: row.display_order ?? 0,
    isArchived: row.is_archived ?? false,
  };
}

export function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    transferToAccountId: row.transfer_to_account_id,
    amount: num(row.amount),
    type: row.type,
    date: row.date,
    note: row.note,
    markerColor: row.marker_color ?? null,
    status: row.status ?? 'posted',
    recurringRuleId: row.recurring_rule_id,
    createdAt: row.created_at,
  };
}

export function toBudget(row: BudgetRow): Budget {
  const periodType = row.period_type ?? 'monthly';
  const bounds =
    row.period_start && row.period_end
      ? { start: row.period_start, end: row.period_end }
      : periodBoundsForMonth(row.month, periodType);
  const rawCategoryId = row.category_id;
  const categoryId =
    rawCategoryId === null || rawCategoryId === GLOBAL_BUDGET_CATEGORY_ID ? null : rawCategoryId;
  return {
    id: row.id,
    categoryId,
    month: row.month,
    limitAmount: num(row.limit_amount),
    periodType,
    periodStart: bounds.start,
    periodEnd: bounds.end,
    alertThresholdPct: row.alert_threshold_pct !== undefined ? num(row.alert_threshold_pct) : 80,
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
    endDate: row.end_date ?? null,
    active: row.active,
  };
}

export function toReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    status: row.status,
    extractedData: row.extracted_data,
    ocrProvider: row.ocr_provider,
    ocrProcessedAt: row.ocr_processed_at,
    createdAt: row.created_at,
  };
}

export function toTransactionTemplate(row: TransactionTemplateRow): TransactionTemplate {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    amount: num(row.amount),
    categoryId: row.category_id,
    accountId: row.account_id,
    note: row.note,
    isPinned: row.is_pinned,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function toSavingsGoal(row: SavingsGoalRow): SavingsGoal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: num(row.target_amount),
    currentAmount: num(row.current_amount),
    createdAt: row.created_at,
  };
}
