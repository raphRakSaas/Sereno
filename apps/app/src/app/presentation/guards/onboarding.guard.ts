import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TransactionsStore } from '../../application/stores/transactions.store';

export const ONBOARDING_DONE_KEY = 'sereno_onboarding_done';

/* Avant le premier passage sur l'accueil : si aucune transaction n'existe
   encore (guest tout neuf), on redirige vers /bienvenue pour partir d'un
   dashboard qui n'est pas vide. Ne se déclenche jamais une deuxième fois
   (flag localStorage), et jamais si des données existent déjà. */
export const onboardingGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const transactions = inject(TransactionsStore);

  if (localStorage.getItem(ONBOARDING_DONE_KEY) === '1') {
    return true;
  }

  if (!transactions.loaded()) {
    await transactions.load();
  }

  if (transactions.items().length > 0) {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    return true;
  }

  return router.parseUrl('/bienvenue');
};
