import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionTemplatesStore } from '../../../application/stores/transaction-templates.store';
import { CategoryKind } from '../../../domain/models/category.model';
import { TransactionTemplate } from '../../../domain/models/transaction-template.model';
import { categoryDisplayName } from '../../../domain/utils/category-tree.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { CategoryPickerComponent } from '../../molecules/category-picker/category-picker.component';

function parseAmount(text: string): number | null {
  const amountValue = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return null;
  }
  return Math.round(amountValue * 100) / 100;
}

@Component({
  selector: 'app-templates-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AmountComponent,
    CategoryPickerComponent,
    FormsModule,
    IconComponent,
    RouterLink,
  ],
  templateUrl: './templates.page.html',
  styleUrl: './templates.page.scss',
})
export class TemplatesPage {
  protected readonly templates = inject(TransactionTemplatesStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly accounts = inject(AccountsStore);
  private readonly toast = inject(ToastService);

  protected readonly formOpen = signal(false);
  protected readonly editedId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly type = signal<CategoryKind>('expense');
  protected readonly amountText = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected readonly accountId = signal<string | null>(null);
  protected readonly note = signal('');
  protected readonly isPinned = signal(false);
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  protected readonly pickableCategories = computed(() =>
    this.type() === 'expense' ? this.categories.expenseCategories() : this.categories.incomeCategories(),
  );

  constructor() {
    if (!this.templates.loaded()) {
      void this.templates.load();
    }
  }

  protected categoryLabel(categoryId: string | null): string {
    if (!categoryId) {
      return 'Sans catégorie';
    }
    const category = this.categories.byId().get(categoryId);
    if (!category) {
      return 'Catégorie';
    }
    return categoryDisplayName(category, this.categories.byId());
  }

  protected accountLabel(accountId: string | null): string {
    if (!accountId) {
      return 'Compte par défaut';
    }
    return this.accounts.byId().get(accountId)?.name ?? 'Compte';
  }

  protected openCreate(): void {
    this.editedId.set(null);
    this.name.set('');
    this.type.set('expense');
    this.amountText.set('');
    this.categoryId.set(null);
    this.accountId.set(this.accounts.items()[0]?.id ?? null);
    this.note.set('');
    this.isPinned.set(false);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(template: TransactionTemplate): void {
    this.editedId.set(template.id);
    this.name.set(template.name);
    this.type.set(template.type);
    this.amountText.set(template.amount.toString().replace('.', ','));
    this.categoryId.set(template.categoryId);
    this.accountId.set(template.accountId);
    this.note.set(template.note ?? '');
    this.isPinned.set(template.isPinned);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    const templateName = this.name().trim();
    if (!templateName) {
      this.hint.set('Donne un nom à ce modèle — par exemple « Café du matin ».');
      return;
    }
    const amount = parseAmount(this.amountText());
    if (amount === null) {
      this.hint.set('Indique un montant supérieur à zéro.');
      return;
    }
    if (!this.categoryId()) {
      this.hint.set('Choisis une catégorie pour ce modèle.');
      return;
    }

    const payload = {
      name: templateName,
      type: this.type(),
      amount,
      categoryId: this.categoryId(),
      accountId: this.accountId(),
      note: this.note().trim() || null,
      isPinned: this.isPinned(),
      sortOrder: this.isPinned() ? 0 : 0,
    };

    const editedId = this.editedId();
    if (editedId) {
      const existing = this.templates.byId().get(editedId);
      if (existing?.isPinned && !this.isPinned()) {
        payload.sortOrder = 0;
      }
      if (!existing?.isPinned && this.isPinned()) {
        payload.sortOrder = this.templates.pinned().length;
      }
      const success = await this.templates.update(editedId, payload);
      if (success) {
        this.toast.show('Modèle mis à jour.');
        this.formOpen.set(false);
      }
      return;
    }

    if (this.isPinned()) {
      payload.sortOrder = this.templates.pinned().length;
    }
    const created = await this.templates.add(payload);
    if (created) {
      this.toast.show('Modèle créé.');
      this.formOpen.set(false);
    }
  }

  protected async togglePin(template: TransactionTemplate): Promise<void> {
    const success = await this.templates.togglePin(template.id);
    if (success) {
      this.toast.show(template.isPinned ? 'Modèle retiré des favoris.' : 'Modèle épinglé en saisie rapide.');
    }
  }

  protected async remove(id: string): Promise<void> {
    if (this.confirmingDelete() !== id) {
      this.confirmingDelete.set(id);
      return;
    }
    await this.templates.remove(id);
    this.confirmingDelete.set(null);
    this.formOpen.set(false);
    this.toast.show('Modèle supprimé.');
  }
}
