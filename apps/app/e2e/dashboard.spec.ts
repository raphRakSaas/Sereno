import { expect, test } from '@playwright/test';
import { completeOnboarding, skipOnboarding } from './utils';

test.describe('Tableau de bord', () => {
  test('P2 — un solde disponible positif s’affiche sans invitation revenu', async ({ page }) => {
    await completeOnboarding(page, { income: '2000', expenseName: 'Logement', expenseAmount: '800' });

    await expect(page.locator('.balance-prompt')).toHaveCount(0);
    const balance = page.locator('.balance-value');
    await expect(balance).toBeVisible();
    await expect(balance).not.toHaveClass(/negative/);
    // 2000 − 800 = 1200 : pas de signe « moins ».
    await expect(balance.locator('.sign')).toHaveCount(0);
  });

  test('P2 — un solde négatif reste lisible (classe negative) avec le signe « − », jamais en rouge vif', async ({
    page,
  }) => {
    await completeOnboarding(page, { income: '500', expenseName: 'Logement', expenseAmount: '800' });

    const balance = page.locator('.balance-value');
    await expect(balance).toBeVisible();
    await expect(balance).toHaveClass(/negative/);
    await expect(balance.locator('.sign')).toHaveText('−');
    const color = await balance.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe('rgb(255, 0, 0)');
  });

  test('P8 — la salutation correspond à l’un des créneaux horaires attendus', async ({ page }) => {
    await completeOnboarding(page, { income: '2000', expenseName: 'Logement', expenseAmount: '800' });
    await expect(page.locator('.greeting')).toHaveText(
      /(Bonjour|Bon après-midi|Bonsoir|Bonne nuit)/,
    );
  });

  test('P6 — la carte budget du dashboard mène à l’écran Budgets', async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/');
    await expect(page.locator('.hero-card')).toBeVisible();

    await page.locator('a.budget-card').click();
    await expect(page).toHaveURL(/\/budgets$/);
    await expect(page.getByRole('heading', { name: /Budgets?/ }).first()).toBeVisible();
  });
});
