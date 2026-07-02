import { Category } from '../models/category.model';

export interface CategoryTreeNode {
  category: Category;
  children: Category[];
}

function compareCategories(left: Category, right: Category): number {
  return left.displayOrder - right.displayOrder || left.name.localeCompare(right.name, 'fr');
}

function activeCategories(categories: Category[]): Category[] {
  return categories.filter((category) => !category.isArchived);
}

/** Libellé d'affichage avec parent, ex. « Alimentation · Courses ». */
export function categoryDisplayName(category: Category, categoriesById: Map<string, Category>): string {
  if (!category.parentId) {
    return category.name;
  }
  const parent = categoriesById.get(category.parentId);
  return parent ? `${parent.name} · ${category.name}` : category.name;
}

export function isSubcategory(category: Category): boolean {
  return category.parentId !== null;
}

/** Catégories racine (sans parent), actives uniquement. */
export function rootCategories(categories: Category[]): Category[] {
  return activeCategories(categories).filter((category) => !category.parentId);
}

export function subcategoriesOf(categories: Category[], parentId: string): Category[] {
  return activeCategories(categories)
    .filter((category) => category.parentId === parentId)
    .sort(compareCategories);
}

/** Arborescence triée pour l'écran Catégories. */
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  return rootCategories(categories)
    .sort(compareCategories)
    .map((category) => ({
      category,
      children: subcategoriesOf(categories, category.id),
    }));
}

/** Empêche plus d'un niveau de profondeur. */
export function canBeParent(candidate: Category): boolean {
  return !candidate.parentId;
}

/** Liste à plat pour les pickers (racines puis sous-catégories par parent). */
export function categoriesForPicker(categories: Category[]): Category[] {
  const tree = buildCategoryTree(categories);
  const flattened: Category[] = [];
  for (const node of tree) {
    flattened.push(node.category);
    flattened.push(...node.children);
  }
  return flattened;
}
