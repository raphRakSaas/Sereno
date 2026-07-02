import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { ToastService } from '../../../application/services/toast.service';
import { CategoryKind } from '../../../domain/models/category.model';
import { IconComponent } from '../../atoms/icon/icon.component';
import { CategoryPickerComponent } from '../../molecules/category-picker/category-picker.component';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Montant saisi à la française : "12,50" comme "12.50". */
function parseAmount(text: string): number | null {
  const value = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

@Component({
  selector: 'app-transaction-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CategoryPickerComponent, FormsModule, IconComponent],
  templateUrl: './transaction-edit.page.html',
  styleUrl: './transaction-edit.page.scss',
})
export class TransactionEditPage {
  protected readonly accounts = inject(AccountsStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly transactions = inject(TransactionsStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly editedId = signal<string | null>(null);

  protected readonly type = signal<CategoryKind>('expense');
  protected readonly amountText = signal('');
  protected readonly categoryId = signal<string | null>(null);
  protected readonly accountId = signal<string | null>(null);
  protected readonly date = signal(todayIso());
  protected readonly note = signal('');

  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal(false);

  protected readonly pickableCategories = computed(() =>
    this.type() === 'expense' ? this.categories.expenseCategories() : this.categories.incomeCategories(),
  );

  private populated = false;

  constructor() {
    // Mode édition : la route porte un id → on remplit le formulaire dès que
    // le store est chargé (une seule fois).
    effect(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id || this.populated || !this.transactions.loaded()) {
        return;
      }
      const existing = this.transactions.items().find((t) => t.id === id);
      if (!existing) {
        return;
      }
      this.populated = true;
      this.editedId.set(id);
      this.type.set(existing.type);
      this.amountText.set(existing.amount.toString().replace('.', ','));
      this.categoryId.set(existing.categoryId);
      this.accountId.set(existing.accountId);
      this.date.set(existing.date);
      this.note.set(existing.note ?? '');
    });

    // Compte par défaut dès que les comptes sont chargés.
    effect(() => {
      const first = this.accounts.items()[0];
      if (first && this.accountId() === null) {
        this.accountId.set(first.id);
      }
    });
  }

  protected setType(type: CategoryKind): void {
    this.type.set(type);
    const selected = this.categoryId();
    if (selected && !this.pickableCategories().some((c) => c.id === selected)) {
      this.categoryId.set(null);
    }
  }

  protected async save(): Promise<void> {
    const amount = parseAmount(this.amountText());
    if (amount === null) {
      this.hint.set('Indique un montant supérieur à zéro — par exemple 12,50.');
      return;
    }
    const categoryId = this.categoryId();
    if (!categoryId) {
      this.hint.set('Choisis une catégorie pour savoir où ranger cette transaction.');
      return;
    }
    const accountId = this.accountId();
    if (!accountId) {
      this.hint.set('Aucun compte disponible pour le moment. Réessaie dans un instant.');
      return;
    }
    this.hint.set('');

    const payload = {
      accountId,
      categoryId,
      amount,
      type: this.type(),
      date: this.date(),
      note: this.note().trim() || null,
      recurringRuleId: null,
    };

    const id = this.editedId();
    const success = id ? await this.transactions.update(id, payload) : await this.transactions.add(payload);
    if (success) {
      this.toast.show(id ? 'Modifié. Tout est à jour.' : 'C’est noté.');
      this.close();
    }
  }

  protected async remove(): Promise<void> {
    const id = this.editedId();
    if (!id) {
      return;
    }
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    await this.transactions.remove(id);
    this.toast.show('Supprimé. Ton historique est à jour.');
    this.close();
  }

  protected close(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/');
    }
  }
}
