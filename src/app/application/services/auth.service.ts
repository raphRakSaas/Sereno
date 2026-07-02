import { computed, inject, Injectable, signal } from '@angular/core';
import { AUTH_GATEWAY, AuthUser } from '../../domain/ports/auth.gateway';
import { MigrationService } from './migration.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly gateway = inject(AUTH_GATEWAY);
  private readonly migration = inject(MigrationService);

  private readonly _user = signal<AuthUser | null>(null);
  readonly user = this._user.asReadonly();
  readonly isSignedIn = computed(() => this._user() !== null);

  /** true si un backend est configuré (sinon : mode invité uniquement). */
  get available(): boolean {
    return this.gateway.available;
  }

  /** Au démarrage : restaure la session (retour OAuth compris) et déclenche
      migration + bascule si nécessaire. */
  async init(): Promise<void> {
    if (!this.gateway.available) {
      return;
    }
    const user = await this.gateway.getCurrentUser();
    this._user.set(user);
    if (user) {
      await this.migration.completeSignIn();
    }
    this.gateway.onAuthStateChange((changed) => this._user.set(changed));
  }

  async signUp(email: string, password: string): Promise<{ needsEmailConfirmation: boolean }> {
    const result = await this.gateway.signUpWithPassword(email, password);
    if (result.user) {
      this._user.set(result.user);
      await this.migration.completeSignIn();
    }
    return { needsEmailConfirmation: result.needsEmailConfirmation };
  }

  async signIn(email: string, password: string): Promise<void> {
    const user = await this.gateway.signInWithPassword(email, password);
    this._user.set(user);
    await this.migration.completeSignIn();
  }

  /** Redirection navigateur ; le retour est géré par init(). */
  async signInWithGoogle(): Promise<void> {
    await this.gateway.signInWithGoogle();
  }

  async signOut(): Promise<void> {
    await this.gateway.signOut();
    this._user.set(null);
    await this.migration.resetToGuest();
  }
}
