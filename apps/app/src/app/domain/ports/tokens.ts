import { InjectionToken } from '@angular/core';
import { AccountRepository } from './account.repository';
import { BudgetRepository } from './budget.repository';
import { CategoryRepository } from './category.repository';
import { RecurringRuleRepository } from './recurring-rule.repository';
import { ReceiptRepository } from './receipt.repository';
import { TransactionRepository } from './transaction.repository';
import { TransactionTemplateRepository } from './transaction-template.repository';

/* Les composants et les stores n'injectent que ces tokens : jamais Dexie ni
   Supabase directement. L'implémentation active est choisie en infrastructure. */

export const TRANSACTION_REPOSITORY = new InjectionToken<TransactionRepository>(
  'TransactionRepository',
);
export const ACCOUNT_REPOSITORY = new InjectionToken<AccountRepository>('AccountRepository');
export const CATEGORY_REPOSITORY = new InjectionToken<CategoryRepository>('CategoryRepository');
export const BUDGET_REPOSITORY = new InjectionToken<BudgetRepository>('BudgetRepository');
export const RECURRING_RULE_REPOSITORY = new InjectionToken<RecurringRuleRepository>(
  'RecurringRuleRepository',
);
export const RECEIPT_REPOSITORY = new InjectionToken<ReceiptRepository>('ReceiptRepository');
export const TRANSACTION_TEMPLATE_REPOSITORY = new InjectionToken<TransactionTemplateRepository>(
  'TransactionTemplateRepository',
);
