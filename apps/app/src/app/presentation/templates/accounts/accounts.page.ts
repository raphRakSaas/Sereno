import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../application/services/toast.service';
import { AccountsStore } from '../../../application/stores/accounts.store';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import {
  Account,
  ACCOUNT_TYPE_GROUPS,
  ACCOUNT_TYPE_LABELS,
  AccountType,
} from '../../../domain/models/account.model';
import { balanceForAccount } from '../../../domain/utils/account-balance.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';

const TYPE_ICONS: Record<AccountType, string> = {
  cash: 'wallet',
  bank: 'home',
  savings: 'sparkle',
  credit_card: 'repeat',
  debit_card: 'wallet',
  investment: 'sparkle',
  insurance: 'health',
  loan: 'repeat',
  overdraft: 'home',
  real_estate: 'home',
  other: 'dots',
};

interface AccountGroup {
  label: string;
  accounts: Account[];
}

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
  protected readonly showArchived = signal(false);
  protected readonly name = signal('');
  protected readonly type = signal<AccountType>('bank');
  protected readonly initialBalanceText = signal('0');
  protected readonly isArchived = signal(false);
  protected readonly excludeFromTotal = signal(false);
  protected readonly sortOrder = signal(0);
  protected readonly cardLimitText = signal('');
  protected readonly cardPaymentDay = signal<number | null>(null);
  protected readonly hint = signal('');
  protected readonly confirmingDelete = signal<string | null>(null);

  protected readonly balances = computed(() => {
    const transactions = this.transactions.items();
    const result = new Map<string, number>();
    for (const account of this.accounts.items()) {
      result.set(account.id, balanceForAccount(account, transactions));
    }
    return result;
  });

  protected readonly sortedAccounts = computed(() =>
    [...this.accounts.items()].sort((left, right) => {
      const leftOrder = left.sortOrder ?? 0;
      const rightOrder = right.sortOrder ?? 0;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return left.name.localeCompare(right.name, 'fr');
    }),
  );

  protected readonly visibleListAccounts = computed(() => {
    const items = this.sortedAccounts();
    return this.showArchived() ? items : items.filter((account) => !account.isArchived);
  });

  protected readonly groupedAccounts = computed((): AccountGroup[] => {
    const groups = new Map<string, Account[]>();
    for (const account of this.visibleListAccounts()) {
      const label = ACCOUNT_TYPE_GROUPS[account.type];
      const bucket = groups.get(label) ?? [];
      bucket.push(account);
      groups.set(label, bucket);
    }
    return [...groups.entries()].map(([label, groupAccounts]) => ({ label, accounts: groupAccounts }));
  });

  protected readonly canMoveUp = computed(() => {
    const editedId = this.editedId();
    if (!editedId) {
      return false;
    }
    const index = this.sortedAccounts().findIndex((account) => account.id === editedId);
    return index > 0;
  });

  protected readonly canMoveDown = computed(() => {
    const editedId = this.editedId();
    if (!editedId) {
      return false;
    }
    const items = this.sortedAccounts();
    const index = items.findIndex((account) => account.id === editedId);
    return index >= 0 && index < items.length - 1;
  });

  protected cardPaymentReminder(day: number | null): string {
    if (!day) {
      return '';
    }
    return `Rappel : paiement prévu autour du ${day} de chaque mois.`;
  }

  protected openCreate(): void {
    this.editedId.set(null);
    this.name.set('');
    this.type.set('bank');
    this.initialBalanceText.set('0');
    this.isArchived.set(false);
    this.excludeFromTotal.set(false);
    this.sortOrder.set(this.nextSortOrder());
    this.cardLimitText.set('');
    this.cardPaymentDay.set(null);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected openEdit(account: Account): void {
    this.editedId.set(account.id);
    this.name.set(account.name);
    this.type.set(account.type);
    this.initialBalanceText.set(account.initialBalance.toString().replace('.', ','));
    this.isArchived.set(account.isArchived ?? false);
    this.excludeFromTotal.set(account.excludeFromTotal ?? false);
    this.sortOrder.set(account.sortOrder ?? 0);
    this.cardLimitText.set(account.cardLimit?.toString().replace('.', ',') ?? '');
    this.cardPaymentDay.set(account.cardPaymentDay);
    this.hint.set('');
    this.formOpen.set(true);
  }

  protected async moveSortOrder(direction: -1 | 1): Promise<void> {
    const editedId = this.editedId();
    if (!editedId) {
      return;
    }
    const items = this.sortedAccounts();
    const index = items.findIndex((account) => account.id === editedId);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= items.length) {
      return;
    }
    const current = items[index];
    const neighbor = items[swapIndex];
    const currentOrder = current.sortOrder ?? index;
    const neighborOrder = neighbor.sortOrder ?? swapIndex;
    await this.accounts.update(current.id, { sortOrder: neighborOrder });
    await this.accounts.update(neighbor.id, { sortOrder: currentOrder });
    this.sortOrder.set(neighborOrder);
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

    const isCreditCard = this.type() === 'credit_card';
    let cardLimit: number | null = null;
    if (isCreditCard && this.cardLimitText().trim()) {
      cardLimit = Number.parseFloat(this.cardLimitText().replace(/\s/g, '').replace(',', '.'));
      if (!Number.isFinite(cardLimit) || cardLimit <= 0) {
        this.hint.set('Le plafond carte doit être un montant positif.');
        return;
      }
    }

    const paymentDay = this.cardPaymentDay();
    if (isCreditCard && paymentDay !== null && (paymentDay < 1 || paymentDay > 28)) {
      this.hint.set('Le jour de paiement doit être entre 1 et 28.');
      return;
    }

    const payload = {
      name,
      type: this.type(),
      initialBalance,
      currency: 'EUR',
      isArchived: this.isArchived(),
      excludeFromTotal: this.excludeFromTotal(),
      sortOrder: this.sortOrder(),
      groupId: null,
      cardLimit: isCreditCard ? cardLimit : null,
      cardPaymentDay: isCreditCard ? paymentDay : null,
    };

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

  private nextSortOrder(): number {
    const orders = this.accounts.items().map((account) => account.sortOrder ?? 0);
    return orders.length === 0 ? 0 : Math.max(...orders) + 1;
  }
}
