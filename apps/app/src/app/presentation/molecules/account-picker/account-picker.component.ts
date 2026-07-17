import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AmountComponent } from '../../atoms/amount/amount.component';

export interface AccountOption {
  id: string;
  name: string;
  balance: number;
}

/* Sélecteur de compte — liste verticale, nom + solde, utilisé dans la modale
   bottom-sheet de transaction-edit/transfer-edit. Voir docs/DESIGN.md. */
@Component({
  selector: 'app-account-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent],
  template: `
    <div class="list" role="listbox" aria-label="Compte">
      @for (account of accounts(); track account.id) {
        <button
          type="button"
          role="option"
          [attr.aria-selected]="account.id === selectedId()"
          [class.selected]="account.id === selectedId()"
          (click)="select.emit(account.id)"
        >
          <span class="name">{{ account.name }}</span>
          <app-amount [value]="account.balance" size="sm" />
        </button>
      }
    </div>
  `,
  styles: `
    .list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border: none;
      border-radius: 14px;
      background: var(--surface);
      color: var(--ink);
      cursor: pointer;
    }
    button.selected {
      background: var(--accent-pale);
      color: var(--accent-deep);
    }
    .name {
      font-size: 14px;
      font-weight: 600;
    }
  `,
})
export class AccountPickerComponent {
  readonly accounts = input.required<AccountOption[]>();
  readonly selectedId = input<string | null>(null);
  readonly select = output<string>();
}
