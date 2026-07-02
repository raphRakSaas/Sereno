import { inject, Injectable } from '@angular/core';
import { Category, NewCategory } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/ports/category.repository';
import { DexieService } from './dexie.providers';

@Injectable({ providedIn: 'root' })
export class DexieCategoryRepository implements CategoryRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<Category[]> {
    const rows = await this.db.categories.toArray();
    return rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  async create(input: NewCategory): Promise<Category> {
    const row: Category = { ...input, id: crypto.randomUUID(), isDefault: false };
    await this.db.categories.add(row);
    return row;
  }

  async update(id: string, patch: Partial<NewCategory>): Promise<Category> {
    const existing = await this.db.categories.get(id);
    if (!existing) {
      throw new Error(`Catégorie ${id} introuvable`);
    }
    if (existing.isDefault) {
      throw new Error('Les catégories par défaut ne sont pas modifiables');
    }
    await this.db.categories.update(id, patch);
    return { ...existing, ...patch };
  }

  async remove(id: string): Promise<void> {
    const existing = await this.db.categories.get(id);
    if (existing?.isDefault) {
      throw new Error('Les catégories par défaut ne sont pas supprimables');
    }
    await this.db.categories.delete(id);
  }
}
