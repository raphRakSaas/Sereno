import { InjectionToken } from '@angular/core';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

export interface SignUpResult {
  user: AuthUser | null;
  /** true si l'utilisateur doit confirmer son adresse avant de pouvoir se connecter. */
  needsEmailConfirmation: boolean;
}

/** Port d'authentification. La présentation et l'application ne connaissent
    jamais Supabase : uniquement cette interface. */
export interface AuthGateway {
  /** false si aucun backend n'est configuré (mode invité seulement). */
  readonly available: boolean;
  getCurrentUser(): Promise<AuthUser | null>;
  /** Retourne une fonction de désabonnement. */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
  signUpWithPassword(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<AuthUser>;
  /** Démarre le flux OAuth Google (redirection navigateur). */
  signInWithGoogle(): Promise<void>;
  signOut(): Promise<void>;
}

export const AUTH_GATEWAY = new InjectionToken<AuthGateway>('AuthGateway');
