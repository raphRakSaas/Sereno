import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { Account, ACCOUNT_TYPE_LABELS, AccountType } from '../../../domain/models/account.model';
import { signedAmount } from '../../../domain/models/transaction.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';

const TYPE_ICONS: Record<AccountType, string> = {
  cash: 'wallet',
  bank: 'home',
  savings: 'sparkle',
  credit_card: 'repeat',
};

@Component({
  selector: 'app-accounts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, FormsModule, IconComponent],
  templateUrl: './accounts.page.html',
  styleUrl: './accounts.page.scss',
})
export class AccountsPage {
  protected readonly accounts = inject(AccountsStore);
  protected readonly transactions = inject(TransactionsStore);
  private readonly toast = inject(ToastService);

  protected readonly typeLabels = ACCOUNT_TYPE_LABELS;
  protected readonly typeIcons = TYPE_ICONS;
  protected readonly typeOptions = Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][];

  protected readonly formOpen = signal(false);
  protected readonly editedId = signal<string | null>(null);
  protected readonly name = signal('');
  protected readonly type = signal<AccountType>('bank');
  protected readonly initialBalanceText = signal('0');
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  /** Solde vivant par compte : solde de départ + transactions du compte. */
  protected readonly balances = computed(() => {
    const sums = new Map<string, number>();
    for (const t of this.transactions.items()) {
      sums.set(t.accountId, (sums.get(t.accountId) ?? 0) + signedAmount(t));
    }
    const result = new Map<string, number>();
    for (const account of this.accounts.items()) {
      result.set(account.id, account.initialBalance + (sums.get(account.id) ?? 0));
    }
    return result;
  });

  protected openCreate(): void {
    this.editedId.set(null);
    this.name.set('');
    this.type.set('bank');
    this.initialBalanceText.set('0');
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(account: Account): void {
    this.editedId.set(account.id);
    this.name.set(account.name);
    this.type.set(account.type);
    this.initialBalanceText.set(account.initialBalance.toString().replace('.', ','));
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async save(): Promise<void> {
    const name = this.name().trim();
    if (!name) {
      this.hint.set('Donne un nom à ce compte — par exemple "Livret A".');
      return;
    }
    const initialBalance = Number.parseFloat(this.initialBalanceText().replace(/\s/g, '').replace(',', '.'));
    if (!Number.isFinite(initialBalance)) {
      this.hint.set('Le solde de départ doit être un nombre — 0 si tu pars de zéro.');
      return;
    }
    const payload = { name, type: this.type(), initialBalance, currency: 'EUR' };
    const id = this.editedId();
    const success = id ? await this.accounts.update(id, payload) : await this.accounts.add(payload);
    if (success) {
      this.toast.show(id ? 'Compte mis à jour.' : 'Compte créé.');
      this.formOpen.set(false);
    }
  }

  protected async remove(id: string): Promise<void> {
    if (this.confirmingDelete() !== id) {
      this.confirmingDelete.set(id);
      return;
    }
    await this.accounts.remove(id);
    await this.transactions.load();
    this.confirmingDelete.set(null);
    this.formOpen.set(false);
    this.toast.show('Compte supprimé, transactions comprises.');
  }
}
