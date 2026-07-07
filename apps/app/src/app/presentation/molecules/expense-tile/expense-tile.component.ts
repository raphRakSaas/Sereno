import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AmountComponent } from '../../atoms/amount/amount.component';
import { MerchantBadgeComponent } from '../../atoms/merchant-badge/merchant-badge.component';

/* Carte horizontale type « rappel de facture » : logo de marque reconnu ou
   icône de catégorie, libellé, montant, échéance. */
@Component({
  selector: 'app-expense-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AmountComponent, DatePipe, MerchantBadgeComponent, RouterLink],
  template: `
    <a class="tile" [routerLink]="link()">
      <app-merchant-badge
        [texts]="merchantTexts()"
        [fallbackIcon]="icon()"
        [fallbackColor]="color()"
        [size]="52"
        shape="round"
      />
      <span class="body">
        <span class="title">{{ title() }}</span>
        <span class="meta">{{ meta() }}</span>
        <app-amount [value]="amount()" size="md" />
        @if (dueDate()) {
          <span class="due">Échéance : {{ dueDate() + 'T00:00:00' | date: 'd MMM' }}</span>
        }
      </span>
    </a>
  `,
  styles: `
    .tile {
      flex: none;
      width: min(78vw, 280px);
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--line);
      border-radius: 16px;
      background: var(--surface);
      text-decoration: none;
      color: inherit;
    }
    .body {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .title {
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta {
      font-size: 12.5px;
      color: var(--ink-faint);
    }
    .due {
      margin-top: 2px;
      font-size: 12px;
      color: var(--ink-soft);
    }
  `,
})
export class ExpenseTileComponent {
  readonly title = input.required<string>();
  readonly meta = input('Montant');
  readonly amount = input.required<number>();
  readonly dueDate = input<string | null>(null);
  readonly merchantTexts = input<string[]>([]);
  readonly icon = input('dots');
  readonly color = input('#8B948C');
  readonly link = input<string | string[]>('/transactions');
}
