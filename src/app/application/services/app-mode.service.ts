import { computed, Injectable, signal } from '@angular/core';

export type BackendMode = 'guest' | 'cloud';

/** Source de vérité du backend actif. Les repositories "switching" de
    l'infrastructure lisent ce signal pour router chaque appel vers Dexie
    (invité) ou Supabase (connecté), sans rechargement de page. */
@Injectable({ providedIn: 'root' })
export class AppModeService {
  private readonly _mode = signal<BackendMode>('guest');

  readonly mode = this._mode.asReadonly();
  readonly isCloud = computed(() => this._mode() === 'cloud');

  setMode(mode: BackendMode): void {
    this._mode.set(mode);
  }
}
