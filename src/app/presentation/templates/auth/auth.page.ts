import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../application/services/auth.service';
import { MigrationService } from '../../../application/services/migration.service';
import { ToastService } from '../../../application/services/toast.service';
import { IconComponent } from '../../atoms/icon/icon.component';

type AuthMode = 'signin' | 'signup';

@Component({
  selector: 'app-auth-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, IconComponent],
  templateUrl: './auth.page.html',
  styleUrl: './auth.page.scss',
})
export class AuthPage {
  protected readonly auth = inject(AuthService);
  protected readonly migration = inject(MigrationService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly mode = signal<AuthMode>('signup');
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly confirmationSentTo = signal('');

  constructor() {
    // Déjà connecté (ou connexion aboutie) → retour à l'accueil.
    effect(() => {
      if (this.auth.isSignedIn() && !this.busy() && this.migration.phase() !== 'running') {
        void this.router.navigateByUrl('/');
      }
    });
  }

  protected switchMode(mode: AuthMode): void {
    this.mode.set(mode);
    this.error.set('');
  }

  protected async submit(): Promise<void> {
    const email = this.email().trim();
    if (!email.includes('@')) {
      this.error.set('Indique une adresse email valide.');
      return;
    }
    if (this.password().length < 6) {
      this.error.set('Le mot de passe doit faire au moins 6 caractères.');
      return;
    }
    this.error.set('');
    this.busy.set(true);
    try {
      if (this.mode() === 'signup') {
        const { needsEmailConfirmation } = await this.auth.signUp(email, this.password());
        if (needsEmailConfirmation) {
          this.confirmationSentTo.set(email);
          return;
        }
      } else {
        await this.auth.signIn(email, this.password());
      }
      const migrationError = this.migration.error();
      if (migrationError) {
        this.error.set(migrationError);
        return;
      }
      this.toast.show(this.mode() === 'signup' ? 'Ton compte est prêt. Bienvenue.' : 'Content de te revoir.');
      void this.router.navigateByUrl('/');
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Ça n’a pas abouti. Réessaie dans un instant.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async continueWithGoogle(): Promise<void> {
    this.error.set('');
    this.busy.set(true);
    try {
      await this.auth.signInWithGoogle();
      // Redirection navigateur : le retour est géré au démarrage de l'app.
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Ça n’a pas abouti. Réessaie dans un instant.');
      this.busy.set(false);
    }
  }

  protected close(): void {
    void this.router.navigateByUrl('/');
  }
}
