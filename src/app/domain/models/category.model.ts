export type CategoryKind = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: CategoryKind;
  /** Catégorie parente, ou null pour une catégorie racine. */
  parentId: string | null;
  /** Nom d'un pictogramme interne (jamais un emoji). */
  icon: string;
  /** Couleur hexadécimale, tirée de la gamme minérale du design. */
  color: string;
  /** true = catégorie globale fournie par Sereno (user_id null côté Supabase). */
  isDefault: boolean;
  /** Ordre d'affichage (plus petit = plus haut). */
  displayOrder: number;
  /** Désactivée : masquée des pickers mais conservée pour l'historique. */
  isArchived: boolean;
}

export type NewCategory = Omit<Category, 'id' | 'isDefault'>;
