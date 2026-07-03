import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/** Client Supabase unique. Absent (null) si l'environnement n'est pas
    configuré : Sereno fonctionne alors en mode invité uniquement. */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  readonly client: SupabaseClient | null =
    environment.supabaseUrl && environment.supabasePublishableKey
      ? createClient(environment.supabaseUrl, environment.supabasePublishableKey)
      : null;

  get isConfigured(): boolean {
    return this.client !== null;
  }

  require(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase n’est pas configuré (voir README, variables d’environnement).');
    }
    return this.client;
  }

  /** Id de l'utilisateur connecté — les repositories en ont besoin pour user_id. */
  async requireUserId(): Promise<string> {
    const { data } = await this.require().auth.getSession();
    const id = data.session?.user.id;
    if (!id) {
      throw new Error('Aucune session active.');
    }
    return id;
  }
}
