import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InstallmentPlansService } from '../../../application/services/installment-plans.service';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { CategoriesStore } from '../../../application/stores/categories.store';
import {
  InstallmentFrequency,
  InstallmentOccurrence,
  InstallmentPlan,
} from '../../../domain/models/installment-plan.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';

const FREQUENCY_LABELS: Record<InstallmentFrequency, string> = {
  weekly: 'Hebdomadaire',
  monthly: 'Mensuelle',
};

@Component({
  selector: 'app-installments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, FormsModule, IconComponent, RouterLink],
  templateUrl: './installments.page.html',
  styleUrl: './installments.page.scss',
})
export class InstallmentsPage {
  protected readonly plansService = inject(InstallmentPlansService);
  protected readonly accounts = inject(AccountsStore);
  protected readonly categories = inject(CategoriesStore);
  private readonly toast = inject(ToastService);

  protected readonly frequencyLabels = FREQUENCY_LABELS;

  protected readonly formOpen = signal(false);
  protected readonly editedId = signal<string | null>(null);
  protected readonly label = signal('');
  protected readonly totalAmountText = signal('');
  protected readonly installmentCountText = signal('3');
  protected readonly frequency = signal<InstallmentFrequency>('monthly');
  protected readonly startDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly accountId = signal<string | null>(null);
  protected readonly categoryId = signal<string | null>(null);
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  protected readonly plans = computed(() =>
    [...this.plansService.plans()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  );

  protected readonly occurrencesByPlan = computed(() => {
    const map = new Map<string, InstallmentOccurrence[]>();
    for (const occurrence of this.plansService.occurrences()) {
      const bucket = map.get(occurrence.planId) ?? [];
      bucket.push(occurrence);
      map.set(occurrence.planId, bucket);
    }
    for (const [planId, items] of map) {
      map.set(
        planId,
        [...items].sort((left, right) => left.dueDate.localeCompare(right.dueDate)),
      );
    }
    return map;
  });

  protected openCreate(): void {
    this.editedId.set(null);
    this.label.set('');
    this.totalAmountText.set('');
    this.installmentCountText.set('3');
    this.frequency.set('monthly');
    this.startDate.set(new Date().toISOString().slice(0, 10));
    this.accountId.set(this.accounts.items()[0]?.id ?? null);
    this.categoryId.set(null);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(plan: InstallmentPlan): void {
    this.editedId.set(plan.id);
    this.label.set(plan.label);
    this.totalAmountText.set(plan.totalAmount.toString().replace('.', ','));
    this.installmentCountText.set(plan.installmentCount.toString());
    this.frequency.set(plan.frequency);
    this.startDate.set(plan.startDate);
    this.accountId.set(plan.accountId);
    this.categoryId.set(plan.categoryId);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    const labelValue = this.label().trim();
    if (!labelValue) {
      this.hint.set('Donne un nom à ce plan — par exemple « Canapé ».');
      return;
    }
    const totalAmount = Number.parseFloat(this.totalAmountText().replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      this.hint.set('Indique un montant total supérieur à zéro.');
      return;
    }
    const installmentCount = Number.parseInt(this.installmentCountText(), 10);
    if (!Number.isFinite(installmentCount) || installmentCount < 2) {
      this.hint.set('Il faut au moins 2 échéances.');
      return;
    }
    const accountId = this.accountId() ?? this.accounts.items()[0]?.id;
    if (!accountId) {
      this.hint.set('Aucun compte disponible pour le moment.');
      return;
    }

    const payload = {
      label: labelValue,
      totalAmount: Math.round(totalAmount * 100) / 100,
      installmentCount,
      frequency: this.frequency(),
      startDate: this.startDate(),
      accountId,
      categoryId: this.categoryId(),
    };

    const editedId = this.editedId();
    if (editedId) {
      this.plansService.update(editedId, payload);
      this.toast.show('Plan d’échéances mis à jour.');
    } else {
      this.plansService.create(payload);
      this.toast.show('Plan d’échéances créé.');
    }
    this.formOpen.set(false);
  }

  protected remove(id: string): void {
    if (this.confirmingDelete() !== id) {
      this.confirmingDelete.set(id);
      return;
    }
    this.plansService.remove(id);
    this.confirmingDelete.set(null);
    this.formOpen.set(false);
    this.toast.show('Plan supprimé.');
  }

  protected transactionLink(occurrence: InstallmentOccurrence, plan: InstallmentPlan): string[] {
    return ['/transactions/nouvelle'];
  }

  protected transactionQuery(occurrence: InstallmentOccurrence, plan: InstallmentPlan): Record<string, string> {
    return {
      type: 'expense',
      date: occurrence.dueDate,
    };
  }
}
