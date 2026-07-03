import { Location } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { toIsoDate } from '../../../domain/utils/period.utils';
import { IconComponent } from '../../atoms/icon/icon.component';
import { MarkerColorPickerComponent } from '../../molecules/marker-color-picker/marker-color-picker.component';

function parseAmount(text: string): number | null {
  const amountValue = Number.parseFloat(text.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(amountValue) || amountValue <= 0) {
    return null;
  }
  return Math.round(amountValue * 100) / 100;
}

@Component({
  selector: 'app-transfer-edit-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent, MarkerColorPickerComponent],
  templateUrl: './transfer-edit.page.html',
  styleUrl: './transfer-edit.page.scss',
})
export class TransferEditPage {
  protected readonly accounts = inject(AccountsStore);
  protected readonly transactions = inject(TransactionsStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  private readonly amountInput = viewChild<ElementRef<HTMLInputElement>>('amountInput');

  protected readonly editedId = signal<string | null>(null);
  protected readonly isCreateMode = computed(() => this.editedId() === null);

  protected readonly fromAccountId = signal<string | null>(null);
  protected readonly toAccountId = signal<string | null>(null);
  protected readonly amountText = signal('');
  protected readonly date = signal(toIsoDate(new Date()));
  protected readonly note = signal('');
  protected readonly markerColor = signal<string | null>(null);
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal(false);
  protected readonly saving = signal(false);

  protected readonly destinationOptions = computed(() => {
    const sourceId = this.fromAccountId();
    return this.accounts.items().filter((account) => account.id !== sourceId);
  });

  private populated = false;

  constructor() {
    effect(() => {
      const transferId = this.route.snapshot.paramMap.get('id');
      if (!transferId || this.populated || !this.transactions.loaded()) {
        return;
      }
      const existing = this.transactions.items().find((transaction) => transaction.id === transferId);
      if (!existing || existing.type !== 'transfer') {
        return;
      }
      this.populated = true;
      this.editedId.set(transferId);
      this.fromAccountId.set(existing.accountId);
      this.toAccountId.set(existing.transferToAccountId);
      this.amountText.set(existing.amount.toString().replace('.', ','));
      this.date.set(existing.date);
      this.note.set(existing.note ?? '');
      this.markerColor.set(existing.markerColor);
    });

    effect(() => {
      const accountList = this.accounts.items();
      if (accountList.length === 0) {
        return;
      }
      if (this.fromAccountId() === null) {
        this.fromAccountId.set(accountList[0].id);
      }
      if (this.toAccountId() === null) {
        this.toAccountId.set(accountList[1]?.id ?? accountList[0].id);
      }
    });

    afterNextRender(() => {
      if (!this.editedId()) {
        this.focusAmountField();
      }
    });
  }

  protected setFromAccount(accountId: string): void {
    this.fromAccountId.set(accountId);
    if (this.toAccountId() === accountId) {
      this.toAccountId.set(this.destinationOptions()[0]?.id ?? null);
    }
  }

  protected async save(): Promise<void> {
    if (this.saving()) {
      return;
    }

    const amount = parseAmount(this.amountText());
    if (amount === null) {
      this.hint.set('Indique un montant supérieur à zéro — par exemple 50.');
      this.focusAmountField();
      return;
    }

    const sourceAccountId = this.fromAccountId();
    const destinationAccountId = this.toAccountId();
    if (!sourceAccountId || !destinationAccountId) {
      this.hint.set('Choisis les deux comptes concernés par ce virement.');
      return;
    }
    if (sourceAccountId === destinationAccountId) {
      this.hint.set('Le compte source et le compte destination doivent être différents.');
      return;
    }

    this.hint.set('');
    this.saving.set(true);
    const payload = {
      accountId: sourceAccountId,
      transferToAccountId: destinationAccountId,
      categoryId: null,
      amount,
      type: 'transfer' as const,
      date: this.date(),
      note: this.note().trim() || null,
      markerColor: this.markerColor(),
      status: 'posted' as const,
      recurringRuleId: null,
    };

    const transferId = this.editedId();
    const result = transferId
      ? await this.transactions.update(transferId, payload)
      : await this.transactions.add(payload);
    this.saving.set(false);

    if (!result) {
      return;
    }

    this.toast.show(transferId ? 'Virement modifié.' : 'Virement enregistré.');
    this.close();
  }

  protected async remove(): Promise<void> {
    const transferId = this.editedId();
    if (!transferId) {
      return;
    }
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    await this.transactions.remove(transferId);
    this.toast.show('Virement supprimé.');
    this.close();
  }

  protected close(): void {
    // navigationId > 1 : arrivée depuis l'app → retour naturel. Sinon,
    // back() sortirait de Sereno (arrivée directe) → on va à l'activité.
    const state = this.location.getState() as { navigationId?: number } | null;
    if ((state?.navigationId ?? 1) > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/transactions');
    }
  }

  protected accountName(accountId: string | null): string {
    if (!accountId) {
      return 'Compte';
    }
    return this.accounts.byId().get(accountId)?.name ?? 'Compte';
  }

  private focusAmountField(): void {
    queueMicrotask(() => this.amountInput()?.nativeElement.focus());
  }
}
