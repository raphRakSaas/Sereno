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
  /** Nom de la catégorie de dépense à ajouter (ex. "Logement") — le roster réel, pas un nom libre. */
  expenseName: string;
  expenseAmount: string;
}

async function tapDigits(page: Page, digits: string): Promise<void> {
  for (const digit of digits) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
}

/** Rejoue l'onboarding invité (4 étapes) via l'UI et laisse l'utilisateur sur le dashboard. */
export async function completeOnboarding(page: Page, input: OnboardingInput): Promise<void> {
  await page.goto('/bienvenue');
  await expect(page.getByRole('heading', { name: 'Vois clair dans' })).toBeVisible();
  await page.getByRole('button', { name: 'Commencer sans compte' }).click();

  await expect(page.getByRole('heading', { name: 'Quel est ton revenu mensuel' })).toBeVisible();
  if (input.income) {
    await tapDigits(page, input.income);
  }
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'Tes dépenses principales' })).toBeVisible();
  await page.getByRole('button', { name: new RegExp('\\+ ' + input.expenseName) }).click();
  await page.locator('.added-row input').first().fill(input.expenseAmount);
  await page.getByRole('button', { name: 'Continuer' }).click();

  await expect(page.getByRole('heading', { name: 'Ton tableau de bord est prêt' })).toBeVisible();
  await page.getByRole('button', { name: /Aller à mon tableau de bord/ }).click();

  await expect(page.locator('.hero-card')).toBeVisible();
}
