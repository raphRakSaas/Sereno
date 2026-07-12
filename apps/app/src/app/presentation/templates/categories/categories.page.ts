import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../application/services/toast.service';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { Category, CategoryKind } from '../../../domain/models/category.model';
import { categoryDisplayName, isSubcategory } from '../../../domain/utils/category-tree.util';
import { CategoryIconComponent } from '../../atoms/category-icon/category-icon.component';
import { IconComponent } from '../../atoms/icon/icon.component';

/* Gamme validée (contraste + daltonisme, cf. docs/DESIGN.md) : les catégories
   personnalisées puisent dans les mêmes minéraux que les catégories Sereno. */
const COLOR_CHOICES = [
  '#1E6D9C', '#3694BC', '#196E44', '#018472', '#7D8F3A', '#A07417',
  '#6D9755', '#7B6CBF', '#8D4826', '#A85769', '#945818',
];

const ICON_CHOICES = [
  'dots', 'basket', 'home', 'dining', 'leisure', 'health', 'clothing',
  'transit', 'repeat', 'sparkle', 'work', 'wallet', 'calendar', 'user',
];

@Component({
  selector: 'app-categories-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryIconComponent, FormsModule, IconComponent],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.scss',
})
export class CategoriesPage {
  protected readonly categories = inject(CategoriesStore);
  private readonly toast = inject(ToastService);

  protected readonly colorChoices = COLOR_CHOICES;
  protected readonly iconChoices = ICON_CHOICES;

  protected readonly formOpen = signal(false);
  protected readonly editedId = signal<string | null>(null);
  protected readonly parentId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly type = signal<CategoryKind>('expense');
  protected readonly color = signal(COLOR_CHOICES[0]);
  protected readonly icon = signal('dots');
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  protected readonly parentCategory = computed(() => {
    const parentId = this.parentId();
    return parentId ? this.categories.byId().get(parentId) : undefined;
  });

  protected readonly isSubcategoryForm = computed(() => this.parentId() !== null);

  protected readonly formTitle = computed(() => {
    const edited = this.editedCategory();
    if (edited) {
      return isSubcategory(edited) ? 'Modifier la sous-catégorie' : 'Modifier la catégorie';
    }
    return this.isSubcategoryForm() ? 'Nouvelle sous-catégorie' : 'Nouvelle catégorie';
  });

  protected readonly editedCategory = computed(() => {
    const editedId = this.editedId();
    return editedId ? this.categories.byId().get(editedId) : undefined;
  });

  protected displayName(category: Category): string {
    return categoryDisplayName(category, this.categories.byId());
  }

  protected openCreate(parentId: string | null = null): void {
    this.editedId.set(null);
    this.parentId.set(parentId);
    this.name.set('');
    if (parentId) {
      const parent = this.categories.byId().get(parentId);
      this.type.set(parent?.type ?? 'expense');
      this.color.set(parent?.color ?? COLOR_CHOICES[0]);
    } else {
      this.type.set('expense');
      this.color.set(COLOR_CHOICES[0]);
    }
    this.icon.set('dots');
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(category: Category): void {
    if (category.isDefault) {
      return;
    }
    this.editedId.set(category.id);
    this.parentId.set(category.parentId);
    this.name.set(category.name);
    this.type.set(category.type);
    this.color.set(category.color);
    this.icon.set(category.icon);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    const name = this.name().trim();
    if (!name) {
      this.hint.set('Donne un nom à cette catégorie — par exemple « Animaux ».');
      return;
    }
    const payload = {
      name,
      type: this.type(),
      color: this.color(),
      icon: this.icon(),
      parentId: this.parentId(),
      displayOrder: this.editedCategory()?.displayOrder ?? this.nextDisplayOrder(),
      isArchived: this.editedCategory()?.isArchived ?? false,
    };
    const id = this.editedId();
    const success = id ? await this.categories.update(id, payload) : await this.categories.add(payload);
    if (success) {
      this.toast.show(id ? 'Catégorie mise à jour.' : 'Catégorie créée.');
      this.formOpen.set(false);
    }
  }

  protected async promote(): Promise<void> {
    const id = this.editedId();
    if (!id) {
      return;
    }
    const success = await this.categories.update(id, { parentId: null });
    if (success) {
      this.parentId.set(null);
      this.toast.show('Sous-catégorie promue en catégorie principale.');
    }
  }

  protected async toggleArchive(category: Category): Promise<void> {
    if (category.isDefault) {
      return;
    }
    const success = await this.categories.update(category.id, { isArchived: !(category.isArchived ?? false) });
    if (success) {
      this.toast.show(category.isArchived ? 'Catégorie réactivée.' : 'Catégorie archivée.');
    }
  }

  protected async moveDisplayOrder(category: Category, direction: -1 | 1): Promise<void> {
    if (category.isDefault) {
      return;
    }
    const siblings = this.siblingsFor(category);
    const index = siblings.findIndex((item) => item.id === category.id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= siblings.length) {
      return;
    }
    const current = siblings[index];
    const neighbor = siblings[swapIndex];
    const currentOrder = current.displayOrder ?? index;
    const neighborOrder = neighbor.displayOrder ?? swapIndex;
    await this.categories.update(current.id, { displayOrder: neighborOrder });
    await this.categories.update(neighbor.id, { displayOrder: currentOrder });
  }

  protected canMoveDisplayOrder(category: Category, direction: -1 | 1): boolean {
    if (category.isDefault) {
      return false;
    }
    const siblings = this.siblingsFor(category);
    const index = siblings.findIndex((item) => item.id === category.id);
    const swapIndex = index + direction;
    return index >= 0 && swapIndex >= 0 && swapIndex < siblings.length;
  }

  protected isArchived(category: Category): boolean {
    return category.isArchived ?? false;
  }

  private siblingsFor(category: Category): Category[] {
    return this.categories
      .customCategories()
      .filter((item) => item.parentId === category.parentId)
      .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0));
  }

  private nextDisplayOrder(): number {
    const siblings = this.categories.customCategories().filter((item) => item.parentId === this.parentId());
    if (siblings.length === 0) {
      return 0;
    }
    return Math.max(...siblings.map((item) => item.displayOrder ?? 0)) + 1;
  }

  protected async remove(id: string): Promise<void> {
    if (this.confirmingDelete() !== id) {
      this.confirmingDelete.set(id);
      return;
    }
    await this.categories.remove(id);
    this.confirmingDelete.set(null);
    this.formOpen.set(false);
    this.toast.show('Catégorie supprimée.');
  }
}
