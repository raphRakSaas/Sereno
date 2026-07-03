import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  inject,
  isDevMode,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { AuthService } from './application/services/auth.service';
import { CategoriesStore } from './application/stores/categories.store';
import { routes } from './app.routes';
import { DexieService } from './infrastructure/dexie/dexie.providers';
import { provideInfrastructure } from './infrastructure/providers';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: LOCALE_ID, useValue: 'fr' },
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    ...provideInfrastructure(),
    // Ordre important : seed local d'abord (mode invité au premier lancement),
    // puis restauration de session (retour OAuth, migration éventuelle).
    provideAppInitializer(() => {
      const dexie = inject(DexieService);
      const auth = inject(AuthService);
      const categories = inject(CategoriesStore);
      return (async () => {
        await dexie.ensureSeeded();
        await auth.init();
        await categories.load();
      })();
    }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
