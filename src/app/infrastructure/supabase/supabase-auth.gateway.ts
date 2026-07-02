import { inject, Injectable } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { AuthGateway, AuthUser, SignUpResult } from '../../domain/ports/auth.gateway';
import { SupabaseClientService } from './supabase-client.service';

function toAuthUser(session: Session | null): AuthUser | null {
  const user = session?.user;
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: (user.user_metadata?.['display_name'] as string | undefined) ?? null,
  };
}

const CALM_AUTH_ERRORS: Record<string, string> = {
  invalid_credentials: 'Adresse ou mot de passe non reconnus. Vérifie et réessaie.',
  email_exists: 'Un compte existe déjà avec cette adresse. Connecte-toi plutôt.',
  user_already_exists: 'Un compte existe déjà avec cette adresse. Connecte-toi plutôt.',
  weak_password: 'Choisis un mot de passe d’au moins 6 caractères.',
  over_email_send_rate_limit: 'Un email vient de partir. Patiente une minute avant de réessayer.',
};

function calmError(code: string | undefined, fallback: string): Error {
  return new Error((code && CALM_AUTH_ERRORS[code]) || fallback);
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthGateway implements AuthGateway {
  private readonly supabase = inject(SupabaseClientService);

  get available(): boolean {
    return this.supabase.isConfigured;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.available) {
      return null;
    }
    const { data } = await this.supabase.require().auth.getSession();
    return toAuthUser(data.session);
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    if (!this.available) {
      return () => undefined;
    }
    const { data } = this.supabase.require().auth.onAuthStateChange((_event, session) => {
      callback(toAuthUser(session));
    });
    return () => data.subscription.unsubscribe();
  }

  async signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await this.supabase.require().auth.signUp({ email, password });
    if (error) {
      throw calmError(error.code, 'L’inscription n’a pas abouti. Réessaie dans un instant.');
    }
    return {
      user: toAuthUser(data.session),
      needsEmailConfirmation: data.session === null,
    };
  }

  async signInWithPassword(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await this.supabase.require().auth.signInWithPassword({ email, password });
    if (error) {
      throw calmError(error.code, 'La connexion n’a pas abouti. Réessaie dans un instant.');
    }
    const user = toAuthUser(data.session);
    if (!user) {
      throw new Error('La connexion n’a pas abouti. Réessaie dans un instant.');
    }
    return user;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await this.supabase.require().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      throw new Error('La connexion Google n’a pas abouti. Réessaie dans un instant.');
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.require().auth.signOut();
  }
}
