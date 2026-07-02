export type CategoryKind = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryKind;
  /** Nom d'un pictogramme interne (jamais un emoji). */
  icon: string;
  /** Couleur hexadécimale, tirée de la gamme minérale du design. */
  color: string;
  /** true = catégorie globale fournie par Sereno (user_id null côté Supabase). */
  isDefault: boolean;
}

export type NewCategory = Omit<Category, 'id' | 'isDefault'>;
