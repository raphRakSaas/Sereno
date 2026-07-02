import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../../domain/models/category.model';
import { Transaction } from '../../../domain/models/transaction.model';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-transaction-list-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, IconComponent, RouterLink],
  template: `
    <a class="row" [routerLink]="['/transactions', transaction().id]">
      <span class="badge" [style.background]="tint()" [style.color]="color()">
        <app-icon [name]="category()?.icon ?? 'dots'" [size]="19" />
      </span>
      <span class="text">
        <span class="name">{{ category()?.name ?? 'Sans catégorie' }}</span>
        @if (transaction().note) {
          <span class="note">{{ transaction().note }}</span>
        }
      </span>
      <span class="value" [class.income]="transaction().type === 'income'">
        <app-amount
          [value]="transaction().amount"
          [currency]="currency()"
          size="md"
          [sign]="transaction().type === 'income' ? '+' : '−'"
        />
      </span>
    </a>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 4px;
      text-decoration: none;
      color: var(--ink);
      border-radius: 8px;
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
  `,
})
export class TransactionListItemComponent {
  readonly transaction = input.required<Transaction>();
  readonly category = input.required<Category | undefined>();
  readonly currency = input('EUR');

  protected readonly color = computed(() => this.category()?.color ?? 'var(--ink-soft)');
  /** Aplat très clair dérivé de la couleur de catégorie (pas d'ombre, pas de flou). */
  protected readonly tint = computed(
    () => `color-mix(in srgb, ${this.category()?.color ?? '#8B948C'} 14%, var(--surface))`,
  );
}
