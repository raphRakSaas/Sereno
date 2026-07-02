import { inject, Injectable } from '@angular/core';
import { Category, NewCategory } from '../../domain/models/category.model';
import { CategoryRepository } from '../../domain/ports/category.repository';
import { CategoryRow, toCategory } from './rows';
import { SupabaseClientService } from './supabase-client.service';

function toRow(input: Partial<NewCategory>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row['name'] = input.name;
  if (input.type !== undefined) row['type'] = input.type;
  if (input.icon !== undefined) row['icon'] = input.icon;
  if (input.color !== undefined) row['color'] = input.color;
  if (input.parentId !== undefined) row['parent_id'] = input.parentId;
  if (input.displayOrder !== undefined) row['display_order'] = input.displayOrder;
  if (input.isArchived !== undefined) row['is_archived'] = input.isArchived;
  return row;
}

@Injectable({ providedIn: 'root' })
export class SupabaseCategoryRepository implements CategoryRepository {
  private readonly supabase = inject(SupabaseClientService);

  /** RLS renvoie les catégories globales (user_id null) + celles de l'utilisateur. */
  async list(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .require()
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return (data as CategoryRow[]).map(toCategory);
  }

  async create(input: NewCategory): Promise<Category> {
    const userId = await this.supabase.requireUserId();
    const { data, error } = await this.supabase
      .require()
      .from('categories')
      .insert({ ...toRow(input), user_id: userId })
      .select()
      .single();
    if (error) throw error;
    return toCategory(data as CategoryRow);
  }

  async update(id: string, patch: Partial<NewCategory>): Promise<Category> {
    const { data, error } = await this.supabase
      .require()
      .from('categories')
      .update(toRow(patch))
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return toCategory(data as CategoryRow);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.require().from('categories').delete().eq('id', id);
    if (error) throw error;
  }
}
