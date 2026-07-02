import { inject, provideAppInitializer, Provider } from '@angular/core';
import {
  ACCOUNT_REPOSITORY,
  BUDGET_REPOSITORY,
  CATEGORY_REPOSITORY,
  RECURRING_RULE_REPOSITORY,
  TRANSACTION_REPOSITORY,
} from '../domain/ports/tokens';
import { DexieAccountRepository } from './dexie/dexie-account.repository';
import { DexieBudgetRepository } from './dexie/dexie-budget.repository';
import { DexieCategoryRepository } from './dexie/dexie-category.repository';
import { DexieRecurringRuleRepository } from './dexie/dexie-recurring-rule.repository';
import { DexieTransactionRepository } from './dexie/dexie-transaction.repository';
import { DexieService } from './dexie/dexie.providers';

/* Liaison des ports du domain vers les implémentations actives.
   Phase 1 : Dexie uniquement (mode invité). La bascule invité/connecté est
   introduite avec les repositories "switching" en Phase 2. */
export function provideInfrastructure(): (Provider | ReturnType<typeof provideAppInitializer>)[] {
  return [
    provideAppInitializer(() => inject(DexieService).ensureSeeded()),
    { provide: TRANSACTION_REPOSITORY, useExisting: DexieTransactionRepository },
    { provide: ACCOUNT_REPOSITORY, useExisting: DexieAccountRepository },
    { provide: CATEGORY_REPOSITORY, useExisting: DexieCategoryRepository },
    { provide: BUDGET_REPOSITORY, useExisting: DexieBudgetRepository },
    { provide: RECURRING_RULE_REPOSITORY, useExisting: DexieRecurringRuleRepository },
  ];
}
