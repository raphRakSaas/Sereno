import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import { RecurringStore } from '../../../application/stores/recurring.store';
import { Frequency, FREQUENCY_LABELS, RecurringRule } from '../../../domain/models/recurring-rule.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { CategoryPickerComponent } from '../../molecules/category-picker/category-picker.component';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-recurring-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, CategoryPickerComponent, DatePipe, FormsModule, IconComponent],
  templateUrl: './recurring.page.html',
  styleUrl: './recurring.page.scss',
})
export class RecurringPage {
  protected readonly recurring = inject(RecurringStore);
  protected readonly categories = inject(CategoriesStore);
  protected readonly accounts = inject(AccountsStore);
  private readonly toast = inject(ToastService);

  protected readonly frequencyLabels = FREQUENCY_LABELS;
  protected readonly frequencyOptions = Object.entries(FREQUENCY_LABELS) as [Frequency, string][];

  protected readonly formOpen = signal(false);
  protected readonly editedId = signal<string | null>(null);
  protected readonly categoryId = signal<string | null>(null);
  protected readonly accountId = signal<string | null>(null);
  protected readonly amountText = signal('');
  protected readonly frequency = signal<Frequency>('monthly');
  protected readonly nextRunDate = signal(todayIso());
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  constructor() {
    if (!this.recurring.loaded()) {
      void this.recurring.load();
    }
  }

  protected readonly categoryById = computed(() => this.categories.byId());

  protected openCreate(): void {
    this.editedId.set(null);
    this.categoryId.set(null);
    this.accountId.set(this.accounts.items()[0]?.id ?? null);
    this.amountText.set('');
    this.frequency.set('monthly');
    this.nextRunDate.set(todayIso());
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(rule: RecurringRule): void {
    this.editedId.set(rule.id);
    this.categoryId.set(rule.categoryId);
    this.accountId.set(rule.accountId);
    this.amountText.set(rule.amount.toString().replace('.', ','));
    this.frequency.set(rule.frequency);
    this.nextRunDate.set(rule.nextRunDate);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    const amount = Number.parseFloat(this.amountText().replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      this.hint.set('Indique un montant supérieur à zéro — par exemple 9,99.');
      return;
    }
    const categoryId = this.categoryId();
    if (!categoryId) {
      this.hint.set('Choisis la catégorie de cette récurrence.');
      return;
    }
    const accountId = this.accountId() ?? this.accounts.items()[0]?.id;
    if (!accountId) {
      this.hint.set('Aucun compte disponible pour le moment.');
      return;
    }
    const payload = {
      categoryId,
      accountId,
      amount: Math.round(amount * 100) / 100,
      frequency: this.frequency(),
      nextRunDate: this.nextRunDate(),
      active: true,
    };
    const id = this.editedId();
    const success = id ? await this.recurring.update(id, payload) : await this.recurring.add(payload);
    if (success) {
      this.toast.show(id ? 'Récurrence mise à jour.' : 'Récurrence créée. Sereno s’en occupe.');
      this.formOpen.set(false);
    }
  }

  protected async toggleActive(rule: RecurringRule): Promise<void> {
    await this.recurring.update(rule.id, { active: !rule.active });
  }

  protected async remove(id: string): Promise<void> {
    if (this.confirmingDelete() !== id) {
      this.confirmingDelete.set(id);
      return;
    }
    await this.recurring.remove(id);
    this.confirmingDelete.set(null);
    this.formOpen.set(false);
    this.toast.show('Récurrence supprimée. Les transactions passées restent.');
  }
}
