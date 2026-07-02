import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../application/services/toast.service';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { Category, CategoryKind } from '../../../domain/models/category.model';
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
  imports: [FormsModule, IconComponent],
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
  protected readonly name = signal('');
  protected readonly type = signal<CategoryKind>('expense');
  protected readonly color = signal(COLOR_CHOICES[0]);
  protected readonly icon = signal('dots');
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  protected openCreate(): void {
    this.editedId.set(null);
    this.name.set('');
    this.type.set('expense');
    this.color.set(COLOR_CHOICES[0]);
    this.icon.set('dots');
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(category: Category): void {
    if (category.isDefault) {
      return;
    }
    this.editedId.set(category.id);
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
      this.hint.set('Donne un nom à cette catégorie — par exemple "Animaux".');
      return;
    }
    const payload = { name, type: this.type(), color: this.color(), icon: this.icon() };
    const id = this.editedId();
    const success = id ? await this.categories.update(id, payload) : await this.categories.add(payload);
    if (success) {
      this.toast.show(id ? 'Catégorie mise à jour.' : 'Catégorie créée.');
      this.formOpen.set(false);
    }
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
