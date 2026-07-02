import { Provider } from '@angular/core';
import { AUTH_GATEWAY } from '../domain/ports/auth.gateway';
import {
  ACCOUNT_REPOSITORY,
  BUDGET_REPOSITORY,
  CATEGORY_REPOSITORY,
  RECURRING_RULE_REPOSITORY,
  RECEIPT_REPOSITORY,
  TRANSACTION_REPOSITORY,
  TRANSACTION_TEMPLATE_REPOSITORY,
} from '../domain/ports/tokens';
import { SupabaseAuthGateway } from './supabase/supabase-auth.gateway';
import {
  SwitchingAccountRepository,
  SwitchingBudgetRepository,
  SwitchingCategoryRepository,
  SwitchingRecurringRuleRepository,
  SwitchingReceiptRepository,
  SwitchingTransactionRepository,
  SwitchingTransactionTemplateRepository,
} from './switching/switching.repositories';

/* Liaison des ports du domain vers l'infrastructure : les repositories
   "switching" routent chaque appel vers Dexie (invité) ou Supabase (connecté)
   selon le mode courant — la bascule est transparente pour stores et composants. */
export function provideInfrastructure(): Provider[] {
  return [
    { provide: TRANSACTION_REPOSITORY, useExisting: SwitchingTransactionRepository },
    { provide: TRANSACTION_TEMPLATE_REPOSITORY, useExisting: SwitchingTransactionTemplateRepository },
    { provide: ACCOUNT_REPOSITORY, useExisting: SwitchingAccountRepository },
    { provide: CATEGORY_REPOSITORY, useExisting: SwitchingCategoryRepository },
    { provide: BUDGET_REPOSITORY, useExisting: SwitchingBudgetRepository },
    { provide: RECURRING_RULE_REPOSITORY, useExisting: SwitchingRecurringRuleRepository },
    { provide: RECEIPT_REPOSITORY, useExisting: SwitchingReceiptRepository },
    { provide: AUTH_GATEWAY, useExisting: SupabaseAuthGateway },
  ];
}
  