import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AppModeService } from '../../application/services/app-mode.service';
import { ConversionService } from '../../application/services/conversion.service';

/* Les fonctionnalités compte-requis restent visibles mais verrouillées en mode
   invité : la tentative d'accès ouvre la modale de conversion (3e déclencheur)
   et ramène vers les réglages. */
export function cloudOnlyGuard(featureName: string): CanActivateFn {
  return () => {
    const mode = inject(AppModeService);
    if (mode.isCloud()) {
      return true;
    }
    inject(ConversionService).requestLockedFeature(featureName);
    return inject(Router).parseUrl('/reglages');
  };
}
