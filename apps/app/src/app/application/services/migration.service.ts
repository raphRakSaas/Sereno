import { inject, Injectable, signal } from '@angular/core';
import { AUTH_GATEWAY } from '../../domain/ports/auth.gateway';
import { DexieService } from '../../infrastructure/dexie/dexie.providers';
import { SupabaseClientService } from '../../infrastructure/supabase/supabase-client.service';
import { AccountsStore } from '../stores/accounts.store';
import { BudgetsStore } from '../stores/budgets.store';
import { CategoriesStore } from '../stores/categories.store';
import { RecurringStore } from '../stores/recurring.store';
import { SavingsGoalsStore } from '../stores/savings-goals.store';
import { TransactionTemplatesStore } from '../stores/transaction-templates.store';
import { TransactionsStore } from '../stores/transactions.store';
import { AppModeService } from './app-mode.service';

export type MigrationPhase = 'idle' | 'running' | 'done' | 'error';

/* Migration Dexie → Supabase à l'arrivée d'une session (inscription, connexion,
   retour OAuth) :
   - le cloud est vierge et des données locales existent → on migre tout avec de
     nouveaux UUID, en "transaction" côté client : si une étape échoue, les
     lignes déjà insérées sont supprimées (rollback) et les données locales
     restent intactes ;
   - migration confirmée → on vide Dexie et on bascule l'adapter en mode cloud,
     sans rechargement de page ;
   - le cloud est vierge sans données locales → on crée le compte par défaut.
   Les catégories par défaut ont les mêmes UUID en local et dans Supabase :
   aucune table de correspondance à gérer pour elles. */
@Injectable({ providedIn: 'root' })
export class MigrationService {
  private readonly dexie = inject(DexieService);
  private readonly supabase = inject(SupabaseClientService);
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly mode = inject(AppModeService);

  private readonly accounts = inject(AccountsStore);
  private readonly categories = inject(CategoriesStore);
  private readonly transactions = inject(TransactionsStore);
  private readonly budgets = inject(BudgetsStore);
  private readonly recurring = inject(RecurringStore);
  private readonly templates = inject(TransactionTemplatesStore);
  private readonly savingsGoals = inject(SavingsGoalsStore);

  readonly phase = signal<MigrationPhase>('idle');
  readonly error = signal<string | null>(null);

  /** Point d'entrée unique après détection d'une session. */
  async completeSignIn(): Promise<boolean> {
    if (!this.supabase.isConfigured) {
      return false;
    }
    const client = this.supabase.require();

    let cloudAccounts: number;
    try {
      const { count, error } = await client.from('accounts').select('*', { count: 'exact', head: true });
      if (error) throw error;
      cloudAccounts = count ?? 0;
    } catch {
      // Hors-ligne : la session est valide, on passe en cloud sans migrer ;
      // la migration éventuelle se rejouera à la prochaine ouverture.
      this.mode.setMode('cloud');
      await this.reloadStores();
      return true;
    }

    if (cloudAccounts === 0) {
      const localTxCount = await this.dexie.db.transactions.count();
      if (localTxCount > 0) {
        this.phase.set('running');
        try {
          await this.migrateLocalData();
        } catch {
          this.phase.set('error');
          this.error.set(
            'La synchronisation n’a pas abouti. Tes données sont intactes sur cet appareil — réessaie dans un instant.',
          );
          await this.gateway.signOut();
          this.mode.setMode('guest');
          return false;
        }
        await this.dexie.clearAllData();
        await this.dexie.ensureSeeded();
      } else {
        // Compte neuf sans historique local : on prépare le compte par défaut.
        const userId = await this.supabase.requireUserId();
        await client.from('accounts').insert({
          user_id: userId,
          name: 'Compte courant',
          type: 'bank',
          initial_balance: 0,
          currency: 'EUR',
        });
      }
    }

    this.mode.setMode('cloud');
    await this.reloadStores();
    this.phase.set('done');
    this.error.set(null);
    return true;
  }

  /** Retour au mode invité (déconnexion) : re-seed local + rechargement. */
  async resetToGuest(): Promise<void> {
    this.mode.setMode('guest');
    await this.dexie.ensureSeeded();
    await this.reloadStores();
    this.phase.set('idle');
    this.error.set(null);
  }

  private async migrateLocalData(): Promise<void> {
    const client = this.supabase.require();
    const userId = await this.supabase.requireUserId();
    const db = this.dexie.db;

    const [
      localAccounts,
      localCategories,
      localTransactions,
      localBudgets,
      localRules,
      localTemplates,
      localGoals,
    ] = await Promise.all([
      db.accounts.toArray(),
      db.categories.toArray(),
      db.transactions.toArray(),
      db.budgets.toArray(),
      db.recurringRules.toArray(),
      db.transactionTemplates.toArray(),
      db.savingsGoals.toArray(),
    ]);

    // Nouveaux UUID générés côté client : on connaît chaque ligne insérée,
    // ce qui permet un rollback exact en cas d'échec.
    const accountIds = new Map(localAccounts.map((a) => [a.id, crypto.randomUUID()]));
    const customCategories = localCategories
      .filter((category) => !category.isDefault)
      .sort((left, right) => {
        if (left.parentId && !right.parentId) return 1;
        if (!left.parentId && right.parentId) return -1;
        return 0;
      });
    const categoryIds = new Map(customCategories.map((c) => [c.id, crypto.randomUUID()]));
    const mapCategory = (id: string) => categoryIds.get(id) ?? id; // défaut = même UUID
    const ruleIds = new Map(localRules.map((r) => [r.id, crypto.randomUUID()]));
    const templateIds = new Map(localTemplates.map((template) => [template.id, crypto.randomUUID()]));

    const inserted: { table: string; ids: string[] }[] = [];
    const insertAll = async (table: string, rows: Record<string, unknown>[]) => {
      if (rows.length === 0) return;
      const { error } = await client.from(table).insert(rows);
      if (error) throw error;
      inserted.unshift({ table, ids: rows.map((r) => r['id'] as string) });
    };

    try {
      await insertAll(
        'accounts',
        localAccounts.map((a) => ({
          id: accountIds.get(a.id),
          user_id: userId,
          name: a.name,
          type: a.type,
          initial_balance: a.initialBalance,
          currency: a.currency,
          created_at: a.createdAt,
        })),
      );
      await insertAll(
        'categories',
        customCategories.map((category) => ({
          id: categoryIds.get(category.id),
          user_id: userId,
          name: category.name,
          type: category.type,
          icon: category.icon,
          color: category.color,
          parent_id: category.parentId ? mapCategory(category.parentId) : null,
        })),
      );
      await insertAll(
        'recurring_rules',
        localRules.map((r) => ({
          id: ruleIds.get(r.id),
          user_id: userId,
          account_id: accountIds.get(r.accountId),
          category_id: mapCategory(r.categoryId),
          amount: r.amount,
          frequency: r.frequency,
          next_run_date: r.nextRunDate,
          active: r.active,
        })),
      );
      await insertAll(
        'transactions',
        localTransactions.map((transaction) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          account_id: accountIds.get(transaction.accountId),
          category_id: transaction.categoryId ? mapCategory(transaction.categoryId) : null,
          transfer_to_account_id: transaction.transferToAccountId
            ? accountIds.get(transaction.transferToAccountId)
            : null,
          amount: transaction.amount,
          type: transaction.type,
          date: transaction.date,
          note: transaction.note,
          marker_color: transaction.markerColor,
          recurring_rule_id: transaction.recurringRuleId
            ? (ruleIds.get(transaction.recurringRuleId) ?? null)
            : null,
          created_at: transaction.createdAt,
        })),
      );
      await insertAll(
        'budgets',
        localBudgets.map((b) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          category_id: b.categoryId ? mapCategory(b.categoryId) : null,
          month: b.month,
          limit_amount: b.limitAmount,
        })),
      );
      await insertAll(
        'transaction_templates',
        localTemplates.map((template) => ({
          id: templateIds.get(template.id),
          user_id: userId,
          name: template.name,
          type: template.type,
          amount: template.amount,
          category_id: template.categoryId ? mapCategory(template.categoryId) : null,
          account_id: template.accountId ? accountIds.get(template.accountId) : null,
          note: template.note,
          is_pinned: template.isPinned,
          sort_order: template.sortOrder,
          created_at: template.createdAt,
        })),
      );
      await insertAll(
        'savings_goals',
        localGoals.map((goal) => ({
          id: crypto.randomUUID(),
          user_id: userId,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          created_at: goal.createdAt,
        })),
      );
    } catch (cause) {
      // Rollback : suppression en ordre inverse de tout ce qui a été inséré.
      for (const step of inserted) {
        await client.from(step.table).delete().in('id', step.ids);
      }
      throw cause;
    }
  }

  private async reloadStores(): Promise<void> {
    await Promise.all([
      this.accounts.load(),
      this.categories.load(),
      this.transactions.load(),
      this.templates.load(),
      this.savingsGoals.load(),
      this.budgets.loaded() ? this.budgets.load() : Promise.resolve(),
      this.recurring.loaded() ? this.recurring.load() : Promise.resolve(),
    ]);
  }
}
