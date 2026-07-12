import { describe, expect, it } from 'vitest';
import { Category } from '../models/category.model';
import {
  buildCategoryTree,
  canBeParent,
  categoriesForPicker,
  categoryDisplayName,
  isSubcategory,
  rootCategories,
  subcategoriesOf,
} from './category-tree.util';

function category(overrides: Partial<Category>): Category {
  return {
    id: 'cat-1',
    name: 'Courses',
    type: 'expense',
    parentId: null,
    icon: 'basket',
    color: '#018472',
    isDefault: true,
    displayOrder: 0,
    isArchived: false,
    ...overrides,
  };
}

describe('categoryDisplayName', () => {
  it('renvoie le nom seul pour une racine', () => {
    const root = category({ id: 'root', name: 'Alimentation' });
    expect(categoryDisplayName(root, new Map([[root.id, root]]))).toBe('Alimentation');
  });

  it('préfixe avec le parent pour une sous-catégorie', () => {
    const parent = category({ id: 'p', name: 'Alimentation' });
    const child = category({ id: 'c', name: 'Courses', parentId: 'p' });
    const map = new Map([
      [parent.id, parent],
      [child.id, child],
    ]);
    expect(categoryDisplayName(child, map)).toBe('Alimentation · Courses');
  });

  it('retombe sur le nom seul si le parent est introuvable', () => {
    const orphan = category({ id: 'c', name: 'Courses', parentId: 'missing' });
    expect(categoryDisplayName(orphan, new Map([[orphan.id, orphan]]))).toBe('Courses');
  });
});

describe('isSubcategory / canBeParent', () => {
  it('distingue racine et sous-catégorie', () => {
    expect(isSubcategory(category({ parentId: null }))).toBe(false);
    expect(isSubcategory(category({ parentId: 'p' }))).toBe(true);
    expect(canBeParent(category({ parentId: null }))).toBe(true);
    expect(canBeParent(category({ parentId: 'p' }))).toBe(false);
  });
});

describe('rootCategories / subcategoriesOf', () => {
  it('exclut les catégories archivées et garde les racines', () => {
    const categories = [
      category({ id: 'a', parentId: null }),
      category({ id: 'b', parentId: null, isArchived: true }),
      category({ id: 'c', parentId: 'a' }),
    ];
    expect(rootCategories(categories).map((c) => c.id)).toEqual(['a']);
  });

  it('trie les sous-catégories par displayOrder puis nom', () => {
    const categories = [
      category({ id: 'p', parentId: null }),
      category({ id: 'x', name: 'Zèbre', parentId: 'p', displayOrder: 1 }),
      category({ id: 'y', name: 'Abeille', parentId: 'p', displayOrder: 0 }),
    ];
    expect(subcategoriesOf(categories, 'p').map((c) => c.id)).toEqual(['y', 'x']);
  });
});

describe('buildCategoryTree / categoriesForPicker', () => {
  it('construit une arborescence racine → enfants triée', () => {
    const categories = [
      category({ id: 'p1', name: 'Alimentation', parentId: null, displayOrder: 0 }),
      category({ id: 'p2', name: 'Transport', parentId: null, displayOrder: 1 }),
      category({ id: 'c1', name: 'Courses', parentId: 'p1', displayOrder: 0 }),
    ];
    const tree = buildCategoryTree(categories);
    expect(tree.map((node) => node.category.id)).toEqual(['p1', 'p2']);
    expect(tree[0].children.map((c) => c.id)).toEqual(['c1']);
  });

  it('aplatit racines puis enfants pour les pickers', () => {
    const categories = [
      category({ id: 'p1', name: 'Alimentation', parentId: null, displayOrder: 0 }),
      category({ id: 'c1', name: 'Courses', parentId: 'p1', displayOrder: 0 }),
      category({ id: 'p2', name: 'Transport', parentId: null, displayOrder: 1 }),
    ];
    expect(categoriesForPicker(categories).map((c) => c.id)).toEqual(['p1', 'c1', 'p2']);
  });
});
