import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { ToastService } from '../../../application/services/toast.service';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Réglages</h1>

      <section class="card block">
        <div class="block-head">
          <app-icon [name]="auth.isSignedIn() ? 'cloud' : 'user'" />
          <h2>Tes données</h2>
        </div>
        @if (auth.isSignedIn()) {
          <p>
            Connecté en tant que <strong>{{ auth.user()?.email }}</strong
            >. Tes données sont synchronisées et te suivent d’un appareil à l’autre.
          </p>
          <button type="button" class="btn btn-ghost" (click)="signOut()" [disabled]="busy()">
            <app-icon name="log-out" [size]="18" />
            {{ busy() ? 'Un instant…' : 'Me déconnecter' }}
          </button>
          <p class="fine">Tes données restent en sécurité dans ton compte.</p>
        } @else {
          <p>
            Tu utilises Sereno en mode invité : tout vit sur cet appareil, rien ne part ailleurs.
            Un compte gratuit synchronise tes données et ouvre les comptes multiples, les budgets
            et les récurrences.
          </p>
          @if (auth.available) {
            <a routerLink="/compte" class="btn btn-primary">Créer un compte gratuit</a>
          } @else {
            <p class="fine">Synchronisation non configurée sur cette installation (voir README).</p>
          }
        }
      </section>

      <section class="card block">
        <div class="block-head">
          <app-icon name="sparkle" />
          <h2>À propos</h2>
        </div>
        <p>
          Sereno t’aide à voir où va ton argent, calmement. Pas de rouge, pas de culpabilisation :
          des chiffres clairs et des constats posés.
        </p>
        <p class="fine">Version 1.0</p>
      </section>
    </div>
  `,
  styles: `
    .block {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
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
    .fine {
      color: var(--ink-faint);
      font-size: 13px;
    }
  `,
})
export class SettingsPage {
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly busy = signal(false);

  protected async signOut(): Promise<void> {
    this.busy.set(true);
    try {
      await this.auth.signOut();
      this.toast.show('À bientôt. Tu es repassé en mode invité.');
    } finally {
      this.busy.set(false);
    }
  }
}
