import { Injectable } from '@angular/core';
import { DEFAULT_CATEGORIES } from '../../domain/data/default-categories';
import { META_FIRST_LAUNCH, SerenoDb } from './sereno-db';

@Injectable({ providedIn: 'root' })
export class DexieService {
  readonly db = new SerenoDb();

  /** Au premier lancement : un compte par défaut + les catégories globales. */
  async ensureSeeded(): Promise<void> {
    const first = await this.db.meta.get(META_FIRST_LAUNCH);
    if (first) {
      return;
    }
    await this.db.transaction('rw', [this.db.accounts, this.db.categories, this.db.meta], async () => {
      await this.db.accounts.add({
        id: crypto.randomUUID(),
        name: 'Compte courant',
        type: 'bank',
        initialBalance: 0,
        currency: 'EUR',
        createdAt: new Date().toISOString(),
      });
      await this.db.categories.bulkAdd(DEFAULT_CATEGORIES);
      await this.db.meta.add({ key: META_FIRST_LAUNCH, value: new Date().toISOString() });
    });
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
        this.db.meta,
      ],
      async () => {
        await Promise.all([
          this.db.accounts.clear(),
          this.db.categories.clear(),
          this.db.transactions.clear(),
          this.db.budgets.clear(),
          this.db.recurringRules.clear(),
          this.db.meta.clear(),
        ]);
      },
    );
  }
}
