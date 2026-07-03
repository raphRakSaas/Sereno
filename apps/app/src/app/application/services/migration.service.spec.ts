import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_GATEWAY, AuthGateway } from '../../domain/ports/auth.gateway';
import { DexieService } from '../../infrastructure/dexie/dexie.providers';
import { SupabaseClientService } from '../../infrastructure/supabase/supabase-client.service';
import { AccountsStore } from '../stores/accounts.store';
import { BudgetsStore } from '../stores/budgets.store';
import { CategoriesStore } from '../stores/categories.store';
import { RecurringStore } from '../stores/recurring.store';
import { TransactionTemplatesStore } from '../stores/transaction-templates.store';
import { TransactionsStore } from '../stores/transactions.store';
import { AppModeService } from './app-mode.service';
import { MigrationService } from './migration.service';

/** Fake client Supabase : enregistre chaque insert/delete et échoue sur une
    table donnée, pour vérifier le rollback en ordre inverse. */
function createFakeSupabaseClient(failTable: string) {
  const insertCalls: { table: string; rows: Record<string, unknown>[] }[] = [];
  const deleteCalls: { table: string; ids: string[] }[] = [];
  const client = {
    from(table: string) {
      return {
        select: () => Promise.resolve({ count: 0, error: null }),
        insert: (rows: Record<string, unknown>[]) => {
          insertCalls.push({ table, rows });
          if (table === failTable) {
            return Promise.resolve({ error: new Error(`insert failed: ${table}`) });
          }
          return Promise.resolve({ error: null });
        },
        delete: () => ({
          in: (_column: string, ids: string[]) => {
            deleteCalls.push({ table, ids });
            return Promise.resolve({ error: null });
          },
        }),
      };
    },
    auth: { getSession: () => Promise.resolve({ data: { session: { user: { id: 'user-1' } } } }) },
  };
  return { client, insertCalls, deleteCalls };
}

function createFakeDexie(data: {
  accounts?: Record<string, unknown>[];
  categories?: Record<string, unknown>[];
  transactions?: Record<string, unknown>[];
  budgets?: Record<string, unknown>[];
  recurringRules?: Record<string, unknown>[];
  transactionTemplates?: Record<string, unknown>[];
}) {
  const table = (rows: Record<string, unknown>[] = []) => ({
    toArray: () => Promise.resolve(rows),
    count: () => Promise.resolve(rows.length),
  });
  return {
    db: {
      accounts: table(data.accounts),
      categories: table(data.categories),
      transactions: table(data.transactions),
      budgets: table(data.budgets),
      recurringRules: table(data.recurringRules),
      transactionTemplates: table(data.transactionTemplates),
    },
    ensureSeeded: vi.fn().mockResolvedValue(undefined),
    clearAllData: vi.fn().mockResolvedValue(undefined),
  };
}

describe('MigrationService — rollback de migrateLocalData', () => {
  let gateway: AuthGateway;
  let mode: { setMode: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    gateway = {
      available: true,
      getCurrentUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signUpWithPassword: vi.fn(),
      signInWithPassword: vi.fn(),
      signInWithGoogle: vi.fn(),
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    mode = { setMode: vi.fn() };
  });

  it('supprime les tables déjà insérées en ordre inverse quand une insertion échoue, sans toucher Dexie local', async () => {
    const { client, insertCalls, deleteCalls } = createFakeSupabaseClient('transactions');
    const fakeDexie = createFakeDexie({
      accounts: [{ id: 'local-acc-1', name: 'Compte courant', type: 'bank', initialBalance: 0, currency: 'EUR', createdAt: '2026-01-01T00:00:00.000Z' }],
      categories: [{ id: 'local-cat-1', name: 'Perso', type: 'expense', icon: 'dots', color: '#000000', isDefault: false, parentId: null }],
      recurringRules: [{ id: 'local-rule-1', accountId: 'local-acc-1', categoryId: 'local-cat-1', amount: 10, frequency: 'monthly', nextRunDate: '2026-08-01', active: true }],
      transactions: [{ id: 'local-tx-1', accountId: 'local-acc-1', categoryId: 'local-cat-1', transferToAccountId: null, amount: 20, type: 'expense', date: '2026-07-01', note: null, markerColor: null, recurringRuleId: null, createdAt: '2026-07-01T00:00:00.000Z' }],
      budgets: [{ id: 'local-budget-1', categoryId: 'local-cat-1', month: '2026-07-01', limitAmount: 200 }],
      transactionTemplates: [{ id: 'local-template-1', name: 'Café', type: 'expense', amount: 3, categoryId: 'local-cat-1', accountId: 'local-acc-1', note: null, isPinned: false, sortOrder: 0, createdAt: '2026-07-01T00:00:00.000Z' }],
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: DexieService, useValue: fakeDexie },
        {
          provide: SupabaseClientService,
          useValue: { isConfigured: true, require: () => client, requireUserId: () => Promise.resolve('user-1') },
        },
        { provide: AUTH_GATEWAY, useValue: gateway },
        { provide: AppModeService, useValue: mode },
        { provide: AccountsStore, useValue: { load: vi.fn() } },
        { provide: CategoriesStore, useValue: { load: vi.fn() } },
        { provide: TransactionsStore, useValue: { load: vi.fn() } },
        { provide: BudgetsStore, useValue: { load: vi.fn(), loaded: () => false } },
        { provide: RecurringStore, useValue: { load: vi.fn(), loaded: () => false } },
        { provide: TransactionTemplatesStore, useValue: { load: vi.fn() } },
      ],
    });

    const migration = TestBed.inject(MigrationService);
    const result = await migration.completeSignIn();

    expect(result).toBe(false);
    expect(migration.phase()).toBe('error');

    // Les 3 premières tables sont insérées avec succès ; la migration s'arrête
    // net à 'transactions' (échec) sans jamais tenter 'budgets' ni
    // 'transaction_templates', bien qu'elles aient des lignes à insérer.
    expect(insertCalls.map((call) => call.table)).toEqual(['accounts', 'categories', 'recurring_rules', 'transactions']);

    // Rollback en ordre inverse de l'insertion : recurring_rules, puis categories, puis accounts.
    expect(deleteCalls.map((call) => call.table)).toEqual(['recurring_rules', 'categories', 'accounts']);

    // Chaque suppression cible exactement les ids insérés pour cette table.
    for (const del of deleteCalls) {
      const inserted = insertCalls.find((call) => call.table === del.table);
      expect(del.ids).toEqual(inserted?.rows.map((row) => row['id']));
    }

    // Les données locales ne sont jamais effacées après un échec de migration.
    expect(fakeDexie.clearAllData).not.toHaveBeenCalled();
    expect(fakeDexie.ensureSeeded).not.toHaveBeenCalled();

    // Retour à l'état invité, session fermée.
    expect(gateway.signOut).toHaveBeenCalled();
    expect(mode.setMode).toHaveBeenCalledWith('guest');
  });

  it('ne migre rien et renvoie false si Supabase n’est pas configuré', async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DexieService, useValue: createFakeDexie({}) },
        { provide: SupabaseClientService, useValue: { isConfigured: false } },
        { provide: AUTH_GATEWAY, useValue: gateway },
        { provide: AppModeService, useValue: mode },
        { provide: AccountsStore, useValue: {} },
        { provide: CategoriesStore, useValue: {} },
        { provide: TransactionsStore, useValue: {} },
        { provide: BudgetsStore, useValue: {} },
        { provide: RecurringStore, useValue: {} },
        { provide: TransactionTemplatesStore, useValue: {} },
      ],
    });

    const migration = TestBed.inject(MigrationService);
    const result = await migration.completeSignIn();

    expect(result).toBe(false);
    expect(mode.setMode).not.toHaveBeenCalled();
  });
});
