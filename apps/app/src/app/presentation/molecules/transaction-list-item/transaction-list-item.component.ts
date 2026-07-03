import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Account } from '../../../domain/models/account.model';
import { Category } from '../../../domain/models/category.model';
import { isTransfer, Transaction } from '../../../domain/models/transaction.model';
import { categoryDisplayName } from '../../../domain/utils/category-tree.util';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-transaction-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, IconComponent, RouterLink],
  template: `
    <a class="row" [class.marked]="!!transaction().markerColor" [routerLink]="editLink()">
      @if (transaction().markerColor; as marker) {
        <span class="marker" [style.background]="marker" aria-hidden="true"></span>
      }
      <span
        class="badge"
        [style.background]="tint()"
        [style.color]="isTransferRow() ? 'var(--sand)' : color()"
      >
        <app-icon [name]="isTransferRow() ? 'transit' : (category()?.icon ?? 'dots')" [size]="19" />
      </span>
      <span class="text">
        @if (isTransferRow()) {
          <span class="name">{{ transferLabel() }}</span>
          @if (transaction().note) {
            <span class="note">{{ transaction().note }}</span>
          } @else {
            <span class="note">Virement interne</span>
          }
        } @else {
          <span class="name">{{ categoryLabel() }}</span>
          @if (transaction().note) {
            <span class="note">{{ transaction().note }}</span>
          }
        }
      </span>
      <span class="value" [class.income]="transaction().type === 'income'" [class.transfer]="isTransferRow()">
        <app-amount
          [value]="transaction().amount"
          [currency]="currency()"
          size="md"
          [sign]="isTransferRow() ? '' : transaction().type === 'income' ? '+' : '−'"
        />
      </span>
    </a>
  `,
  styles: `
    .row {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 4px;
      text-decoration: none;
      color: var(--ink);
      border-radius: 8px;
    }
    .row.marked {
      padding-left: 10px;
    }
    .marker {
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 3px;
      border-radius: 2px;
    }
    .row:active {
      background: var(--sage-pale);
    }
    .badge {
      flex: none;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: grid;
      place-items: center;
    }
    .text {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .name {
      font-size: 15px;
      font-weight: 500;
    }
    .note {
      font-size: 13px;
      color: var(--ink-soft);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .value {
      flex: none;
    }
    .value.income {
      color: var(--mist-deep);
    }
    .value.transfer {
      color: var(--ink-soft);
    }
  `,
})
export class TransactionListItemComponent {
  readonly transaction = input.required<Transaction>();
  readonly category = input<Category | undefined>();
  readonly categoriesById = input<Map<string, Category>>(new Map());
  readonly accountsById = input<Map<string, Account>>(new Map());
  readonly currency = input('EUR');

  protected readonly isTransferRow = computed(() => isTransfer(this.transaction()));

  protected readonly categoryLabel = computed(() => {
    const category = this.category();
    if (!category) {
      return 'Sans catégorie';
    }
    return categoryDisplayName(category, this.categoriesById());
  });

  protected readonly editLink = computed(() =>
    this.isTransferRow()
      ? ['/transferts', this.transaction().id]
      : ['/transactions', this.transaction().id],
  );

  protected readonly color = computed(() => this.category()?.color ?? 'var(--ink-soft)');

  protected readonly tint = computed(() =>
    this.isTransferRow()
      ? 'color-mix(in srgb, var(--sand) 22%, var(--surface))'
      : `color-mix(in srgb, ${this.category()?.color ?? '#8B948C'} 14%, var(--surface))`,
  );

  protected transferLabel(): string {
    const transaction = this.transaction();
    const fromName = this.accountsById().get(transaction.accountId)?.name ?? 'Compte';
    const toName =
      this.accountsById().get(transaction.transferToAccountId ?? '')?.name ?? 'Compte';
    return `${fromName} → ${toName}`;
  }
}
