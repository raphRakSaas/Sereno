import { inject, Injectable } from '@angular/core';
import { AppModeService } from '../../application/services/app-mode.service';
import { NewAccount } from '../../domain/models/account.model';
import { NewBudget } from '../../domain/models/budget.model';
import { NewCategory } from '../../domain/models/category.model';
import { NewRecurringRule } from '../../domain/models/recurring-rule.model';
import { NewSavingsGoal } from '../../domain/models/savings-goal.model';
import { NewTransaction } from '../../domain/models/transaction.model';
import { NewTransactionTemplate } from '../../domain/models/transaction-template.model';
import { AccountRepository } from '../../domain/ports/account.repository';
import { BudgetRepository } from '../../domain/ports/budget.repository';
import { CategoryRepository } from '../../domain/ports/category.repository';
import { RecurringRuleRepository } from '../../domain/ports/recurring-rule.repository';
import { ReceiptRepository } from '../../domain/ports/receipt.repository';
import { SavingsGoalRepository } from '../../domain/ports/savings-goal.repository';
import { TransactionTemplateRepository } from '../../domain/ports/transaction-template.repository';
import { TransactionFilter, TransactionRepository } from '../../domain/ports/transaction.repository';
import { DexieAccountRepository } from '../dexie/dexie-account.repository';
import { DexieBudgetRepository } from '../dexie/dexie-budget.repository';
import { DexieCategoryRepository } from '../dexie/dexie-category.repository';
import { DexieRecurringRuleRepository } from '../dexie/dexie-recurring-rule.repository';
import { DexieReceiptRepository } from '../dexie/dexie-receipt.repository';
import { DexieSavingsGoalRepository } from '../dexie/dexie-savings-goal.repository';
import { DexieTransactionRepository } from '../dexie/dexie-transaction.repository';
import { DexieTransactionTemplateRepository } from '../dexie/dexie-transaction-template.repository';
import { SupabaseAccountRepository } from '../supabase/supabase-account.repository';
import { SupabaseBudgetRepository } from '../supabase/supabase-budget.repository';
import { SupabaseCategoryRepository } from '../supabase/supabase-category.repository';
import { SupabaseRecurringRuleRepository } from '../supabase/supabase-recurring-rule.repository';
import { SupabaseReceiptRepository } from '../supabase/supabase-receipt.repository';
import { SupabaseSavingsGoalRepository } from '../supabase/supabase-savings-goal.repository';
import { SupabaseTransactionRepository } from '../supabase/supabase-transaction.repository';
import { SupabaseTransactionTemplateRepository } from '../supabase/supabase-transaction-template.repository';

/* La bascule invité ↔ connecté, transparente pour le reste de l'app :
   chaque appel est routé à l'exécution vers Dexie ou Supabase selon le mode
   courant. Changer de backend ne demande donc ni rechargement de page ni
   nouvelle injection — seuls les stores doivent recharger leurs données. */

@Injectable({ providedIn: 'root' })
export class SwitchingTransactionRepository implements TransactionRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieTransactionRepository);
  private readonly supabase = inject(SupabaseTransactionRepository);

  private get active(): TransactionRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  list = (filter?: TransactionFilter) => this.active.list(filter);
  getById = (id: string) => this.active.getById(id);
  create = (input: NewTransaction) => this.active.create(input);
  update = (id: string, patch: Partial<NewTransaction>) => this.active.update(id, patch);
  remove = (id: string) => this.active.remove(id);
  count = () => this.active.count();
}

@Injectable({ providedIn: 'root' })
export class SwitchingAccountRepository implements AccountRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieAccountRepository);
  private readonly supabase = inject(SupabaseAccountRepository);

  private get active(): AccountRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  list = () => this.active.list();
  getById = (id: string) => this.active.getById(id);
  create = (input: NewAccount) => this.active.create(input);
  update = (id: string, patch: Partial<NewAccount>) => this.active.update(id, patch);
  remove = (id: string) => this.active.remove(id);
}

@Injectable({ providedIn: 'root' })
export class SwitchingCategoryRepository implements CategoryRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieCategoryRepository);
  private readonly supabase = inject(SupabaseCategoryRepository);

  private get active(): CategoryRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  list = () => this.active.list();
  create = (input: NewCategory) => this.active.create(input);
  update = (id: string, patch: Partial<NewCategory>) => this.active.update(id, patch);
  remove = (id: string) => this.active.remove(id);
}

@Injectable({ providedIn: 'root' })
export class SwitchingBudgetRepository implements BudgetRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieBudgetRepository);
  private readonly supabase = inject(SupabaseBudgetRepository);

  private get active(): BudgetRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  listAll = () => this.active.listAll();
  listByMonth = (month: string) => this.active.listByMonth(month);
  upsert = (input: NewBudget) => this.active.upsert(input);
  remove = (id: string) => this.active.remove(id);
}

@Injectable({ providedIn: 'root' })
export class SwitchingRecurringRuleRepository implements RecurringRuleRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieRecurringRuleRepository);
  private readonly supabase = inject(SupabaseRecurringRuleRepository);

  private get active(): RecurringRuleRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  list = () => this.active.list();
  create = (input: NewRecurringRule) => this.active.create(input);
  update = (id: string, patch: Partial<NewRecurringRule>) => this.active.update(id, patch);
  remove = (id: string) => this.active.remove(id);
}

@Injectable({ providedIn: 'root' })
export class SwitchingReceiptRepository implements ReceiptRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieReceiptRepository);
  private readonly supabase = inject(SupabaseReceiptRepository);

  private get active(): ReceiptRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  listByTransaction = (transactionId: string) => this.active.listByTransaction(transactionId);
  listTransactionIds = () => this.active.listTransactionIds();
  attach = (transactionId: string, file: File) => this.active.attach(transactionId, file);
  replace = (receiptId: string, file: File) => this.active.replace(receiptId, file);
  remove = (receiptId: string) => this.active.remove(receiptId);
  removeByTransaction = (transactionId: string) => this.active.removeByTransaction(transactionId);
  getPreviewUrl = (receiptId: string) => this.active.getPreviewUrl(receiptId);
  releasePreviewUrl = (url: string) => this.active.releasePreviewUrl(url);
  requestOcr = (receiptId: string) => this.active.requestOcr(receiptId);
  confirmExtraction = (receiptId: string) => this.active.confirmExtraction(receiptId);
}

@Injectable({ providedIn: 'root' })
export class SwitchingTransactionTemplateRepository implements TransactionTemplateRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieTransactionTemplateRepository);
  private readonly supabase = inject(SupabaseTransactionTemplateRepository);

  private get active(): TransactionTemplateRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  list = () => this.active.list();
  create = (input: NewTransactionTemplate) => this.active.create(input);
  update = (id: string, patch: Partial<NewTransactionTemplate>) => this.active.update(id, patch);
  remove = (id: string) => this.active.remove(id);
}

@Injectable({ providedIn: 'root' })
export class SwitchingSavingsGoalRepository implements SavingsGoalRepository {
  private readonly mode = inject(AppModeService);
  private readonly dexie = inject(DexieSavingsGoalRepository);
  private readonly supabase = inject(SupabaseSavingsGoalRepository);

  private get active(): SavingsGoalRepository {
    return this.mode.isCloud() ? this.supabase : this.dexie;
  }

  list = () => this.active.list();
  create = (input: NewSavingsGoal) => this.active.create(input);
  update = (id: string, patch: Partial<NewSavingsGoal>) => this.active.update(id, patch);
  remove = (id: string) => this.active.remove(id);
}
