import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppModeService } from '../../../application/services/app-mode.service';
import { ConversionService } from '../../../application/services/conversion.service';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-budgets-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="page">
      <h1 class="page-title">Budgets</h1>

      @if (!mode.isCloud()) {
        <div class="card">
          <div class="empty">
            <span class="lock">
              <app-icon name="lock" [size]="26" />
            </span>
            <h3>Les budgets, en douceur</h3>
            <p>
              Fixe une limite par catégorie et Sereno te prévient posément quand tu t’en approches — jamais
              d’alarme rouge. Disponible avec un compte gratuit.
            </p>
            <button type="button" class="btn btn-primary" (click)="conversion.requestLockedFeature('les budgets')">
              Débloquer les budgets
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .lock {
      display: grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 999px;
      background: var(--sage-pale);
      color: var(--sage-deep);
    }
  `,
})
export class BudgetsPage {
  protected readonly mode = inject(AppModeService);
  protected readonly conversion = inject(ConversionService);

  constructor() {
    // Accéder à une fonctionnalité verrouillée est l'un des trois déclencheurs.
    this.conversion.requestLockedFeature('les budgets');
  }
}
