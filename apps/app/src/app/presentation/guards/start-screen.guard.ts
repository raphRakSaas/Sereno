import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserPreferencesService } from '../../application/services/user-preferences.service';

/** Redirige l'accueil `/` vers l'écran de démarrage choisi dans les réglages. */
export const startScreenGuard: CanActivateFn = () => {
  const preferences = inject(UserPreferencesService);
  const router = inject(Router);
  const preferredRoute = preferences.startRoute();
  if (preferredRoute !== '/') {
    return router.createUrlTree([preferredRoute]);
  }
  return true;
};
