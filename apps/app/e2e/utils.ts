import { expect, Page } from '@playwright/test';
import { ONBOARDING_DONE_KEY } from './constants';

/** Marque l'onboarding comme terminé avant tout chargement de page, pour
 *  atterrir directement sur le tableau de bord sans rejouer les deux étapes. */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(
    (key) => window.localStorage.setItem(key, '1'),
    ONBOARDING_DONE_KEY,
  );
}

export interface OnboardingInput {
  /** Revenu mensuel ; laisser vide/undefined pour tester le cas « revenu plus tard » (P3). */
  income?: string;
  expenseName: string;
  expenseAmount: string;
}

/** Rejoue l'onboarding invité via l'UI et laisse l'utilisateur sur le dashboard. */
export async function completeOnboarding(page: Page, input: OnboardingInput): Promise<void> {
  await page.goto('/bienvenue');
  await expect(page.getByRole('heading', { name: 'Bienvenue sur Sereno' })).toBeVisible();

  if (input.income) {
    await page.locator('#income').fill(input.income);
  }
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'Ta plus grosse dépense fixe' })).toBeVisible();
  await page.locator('#expense-name').fill(input.expenseName);
  await page.locator('#expense-amount').fill(input.expenseAmount);
  await page.getByRole('button', { name: "C'est parti" }).click();

  await expect(page.locator('.hero-card')).toBeVisible();
}
