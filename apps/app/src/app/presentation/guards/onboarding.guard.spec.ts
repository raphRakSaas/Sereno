import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransactionsStore } from '../../application/stores/transactions.store';
import { ONBOARDING_DONE_KEY, onboardingGuard } from './onboarding.guard';

interface TransactionsStoreStub {
  loaded: () => boolean;
  load: () => Promise<void>;
  items: () => unknown[];
}

function configure(stub: TransactionsStoreStub) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: TransactionsStore, useValue: stub }],
  });
}

describe('onboardingGuard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('laisse passer immédiatement si l’onboarding est déjà terminé', async () => {
    localStorage.setItem(ONBOARDING_DONE_KEY, '1');
    const load = vi.fn();
    configure({ loaded: () => false, load, items: () => [] });

    const result = await TestBed.runInInjectionContext(() =>
      onboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });

  it('redirige vers /bienvenue quand aucune transaction n’existe', async () => {
    configure({ loaded: () => true, load: vi.fn(), items: () => [] });

    const result = await TestBed.runInInjectionContext(() =>
      onboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/bienvenue');
  });

  it('laisse passer et mémorise le flag si des transactions existent déjà', async () => {
    configure({ loaded: () => true, load: vi.fn(), items: () => [{ id: 'tx-1' }] });

    const result = await TestBed.runInInjectionContext(() =>
      onboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
    expect(localStorage.getItem(ONBOARDING_DONE_KEY)).toBe('1');
  });

  it('charge les transactions si elles ne le sont pas encore', async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    configure({ loaded: () => false, load, items: () => [] });

    await TestBed.runInInjectionContext(() =>
      onboardingGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(load).toHaveBeenCalledOnce();
  });
});
