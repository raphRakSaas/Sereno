import { Category, NewCategory } from '../models/category.model';

export interface CategoryRepository {
  /** Catégories globales par défaut + catégories personnelles de l'utilisateur. */
  list(): Promise<Category[]>;
  create(input: NewCategory): Promise<Category>;
  /** Seules les catégories personnelles (isDefault = false) sont modifiables. */
  update(id: string, patch: Partial<NewCategory>): Promise<Category>;
  remove(id: string): Promise<void>;
}
