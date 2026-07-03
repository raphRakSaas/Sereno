import { inject, Injectable } from '@angular/core';
import { Category, NewCategory } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/ports/category.repository';
import { DexieService } from './dexie.providers';

function compareCategories(left: Category, right: Category): number {
  return left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, 'fr');
}

@Injectable({ providedIn: 'root' })
export class DexieCategoryRepository implements CategoryRepository {
  private readonly db = inject(DexieService).db;

  async list(): Promise<Category[]> {
    const rows = await this.db.categories.toArray();
    return rows.map((row) => this.normalize(row)).sort(compareCategories);
  }

  async create(input: NewCategory): Promise<Category> {
    const row: Category = {
      ...input,
      parentId: input.parentId ?? null,
      displayOrder: input.displayOrder ?? 0,
      isArchived: input.isArchived ?? false,
      id: crypto.randomUUID(),
      isDefault: false,
    };
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
    return this.normalize({ ...existing, ...patch });
  }

  async remove(id: string): Promise<void> {
    const existing = await this.db.categories.get(id);
    if (existing?.isDefault) {
      throw new Error('Les catégories par défaut ne sont pas supprimables');
    }
    const children = await this.db.categories.where('parentId').equals(id).toArray();
    for (const child of children) {
      await this.db.categories.update(child.id, { parentId: null });
    }
    await this.db.categories.delete(id);
  }

  private normalize(row: Category): Category {
    return {
      ...row,
      parentId: row.parentId ?? null,
      displayOrder: row.displayOrder ?? 0,
      isArchived: row.isArchived ?? false,
    };
  }
}
