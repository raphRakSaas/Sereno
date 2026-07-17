import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ConversionService } from '../../../application/services/conversion.service';
import { TransactionsStore } from '../../../application/stores/transactions.store';
import { IconComponent } from '../../atoms/icon/icon.component';

/* Seule et unique action d'ajout rapide visible sur les pages racines
   (Accueil, Historique) — pas de "+" dupliqué dans la tab bar ni les cartes.
   Si la limite du mode invité est atteinte, ouvre le paywall au lieu du
   formulaire. Voir docs/DESIGN.md. */
@Component({
  selector: 'app-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button type="button" (click)="tapAdd()" aria-label="Ajouter une transaction">
      <app-icon name="plus" [size]="26" />
    </button>
  `,
  styles: `
    :host {
      position: fixed;
      right: 20px;
      bottom: calc(86px + var(--safe-bottom));
      z-index: 20;
    }
    @media (min-width: 768px) {
      :host {
        display: none;
      }
    }
    button {
      width: 56px;
      height: 56px;
      border: none;
      border-radius: 999px;
      background: var(--accent);
      color: var(--on-accent);
      display: grid;
      place-items: center;
      box-shadow: var(--shadow-fab);
      cursor: pointer;
    }
    button:active {
      opacity: 0.9;
    }
  `,
})
export class FabComponent {
  private readonly router = inject(Router);
  private readonly conversion = inject(ConversionService);
  private readonly transactions = inject(TransactionsStore);

  protected tapAdd(): void {
    if (this.conversion.guardTransactionLimit(this.transactions.count())) {
      return;
    }
    void this.router.navigateByUrl('/transactions/nouvelle');
  }
}
