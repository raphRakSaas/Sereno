import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AppModeService } from '../../../application/services/app-mode.service';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div class="page">
      <h1 class="page-title">Réglages</h1>

      <section class="card block">
        <div class="block-head">
          <app-icon [name]="mode.isCloud() ? 'cloud' : 'user'" />
          <h2>Tes données</h2>
        </div>
        @if (mode.isCloud()) {
          <p>Ton compte est actif : tes données sont synchronisées et te suivent d’un appareil à l’autre.</p>
        } @else {
          <p>
            Tu utilises Sereno en mode invité : tout vit sur cet appareil, rien ne part ailleurs. Un compte
            gratuit permet de synchroniser tes données et d’ouvrir les comptes multiples, les budgets et les
            récurrences.
          </p>
        }
      </section>

      <section class="card block">
        <div class="block-head">
          <app-icon name="sparkle" />
          <h2>À propos</h2>
        </div>
        <p>
          Sereno t’aide à voir où va ton argent, calmement. Pas de rouge, pas de culpabilisation : des
          chiffres clairs et des constats posés.
        </p>
        <p class="version">Version 1.0</p>
      </section>
    </div>
  `,
  styles: `
    .block {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .block-head {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--sage-deep);
    }
    .block-head h2 {
      font-size: 18px;
    }
    p {
      margin: 0;
      font-size: 14.5px;
      color: var(--ink-soft);
      line-height: 1.55;
    }
    .version {
      color: var(--ink-faint);
      font-size: 13px;
    }
  `,
})
export class SettingsPage {
  protected readonly mode = inject(AppModeService);
}
