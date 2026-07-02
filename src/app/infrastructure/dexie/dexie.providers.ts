import { Injectable } from '@angular/core';
import { DEFAULT_CATEGORIES } from '../../domain/data/default-categories';
import { META_FIRST_LAUNCH, SerenoDb } from './sereno-db';

@Injectable({ providedIn: 'root' })
export class DexieService {
  readonly db = new SerenoDb();

  /** Au premier lancement : un compte par défaut + les catégories globales. */
  async ensureSeeded(): Promise<void> {
    const first = await this.db.meta.get(META_FIRST_LAUNCH);
    if (!first) {
      await this.db.transaction('rw', [this.db.accounts, this.db.categories, this.db.meta], async () => {
        await this.db.accounts.add({
          id: crypto.randomUUID(),
          name: 'Compte courant',
          type: 'bank',
          initialBalance: 0,
          currency: 'EUR',
          isArchived: false,
          excludeFromTotal: false,
          sortOrder: 0,
          groupId: null,
          cardLimit: null,
          cardPaymentDay: null,
          createdAt: new Date().toISOString(),
        });
        await this.db.categories.bulkAdd(DEFAULT_CATEGORIES);
        await this.db.meta.add({ key: META_FIRST_LAUNCH, value: new Date().toISOString() });
      });
    }
    await this.syncDefaultCategories();
  }

  /** Ajoute les catégories globales manquantes et met à jour libellés / ordre. */
  async syncDefaultCategories(): Promise<void> {
    const existing = await this.db.categories.toArray();
    const existingIds = new Set(existing.map((category) => category.id));
    const missing = DEFAULT_CATEGORIES.filter((category) => !existingIds.has(category.id));
    if (missing.length > 0) {
      await this.db.categories.bulkAdd(missing);
    }
    for (const category of DEFAULT_CATEGORIES) {
      await this.db.categories.update(category.id, {
        name: category.name,
        icon: category.icon,
        color: category.color,
        displayOrder: category.displayOrder,
        isArchived: category.isArchived,
      });
    }
  }

  async firstLaunchAt(): Promise<Date | null> {
    const entry = await this.db.meta.get(META_FIRST_LAUNCH);
    return entry ? new Date(entry.value) : null;
  }

  /** Vide toutes les données locales (après migration réussie vers Supabase).
      La méta est vidée aussi : un prochain passage en mode invité repartira
      d'un environnement fraîchement seedé via ensureSeeded(). */
  async clearAllData(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        this.db.accounts,
        this.db.categories,
        this.db.transactions,
        this.db.budgets,
        this.db.recurringRules,
        this.db.receipts,
        this.db.transactionTemplates,
        this.db.meta,
      ],
      async () => {
        await Promise.all([
          this.db.accounts.clear(),
          this.db.categories.clear(),
          this.db.transactions.clear(),
          this.db.budgets.clear(),
          this.db.recurringRules.clear(),
          this.db.receipts.clear(),
          this.db.transactionTemplates.clear(),
          this.db.meta.clear(),
        ]);
      },
    );
  }
}
