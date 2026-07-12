import { expect, test } from '@playwright/test';
import { completeOnboarding } from './utils';

test.describe('Onboarding invité', () => {
  test('un nouvel utilisateur est redirigé vers /bienvenue', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/bienvenue$/);
    await expect(page.getByRole('heading', { name: 'Bienvenue sur Sereno' })).toBeVisible();
  });

  test('P3 — passer le revenu puis noter une dépense affiche l’invitation à saisir le revenu', async ({
    page,
  }) => {
    // Revenu volontairement omis, une dépense est enregistrée.
    await completeOnboarding(page, { expenseName: 'Loyer', expenseAmount: '800' });

    await expect(page.locator('.balance-prompt')).toHaveText(/Ajoute ton revenu/);
    await expect(page.getByRole('link', { name: /Ajouter mon revenu/ })).toBeVisible();
    // Pas de gros solde négatif affiché à la place.
    await expect(page.locator('.balance-value')).toHaveCount(0);
  });

  test('l’invitation revenu pointe vers le formulaire de revenu', async ({ page }) => {
    await completeOnboarding(page, { expenseName: 'Loyer', expenseAmount: '800' });
    await page.getByRole('link', { name: /Ajouter mon revenu/ }).click();
    await expect(page).toHaveURL(/\/transactions\/nouvelle\?type=income$/);
  });
});
