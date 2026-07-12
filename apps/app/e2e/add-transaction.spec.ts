import { expect, test } from '@playwright/test';
import { skipOnboarding } from './utils';

test.describe('Formulaire d’ajout — catégories de revenu', () => {
  test.beforeEach(async ({ page }) => {
    await skipOnboarding(page);
    await page.goto('/transactions/nouvelle?type=income');
    await expect(page.locator('app-category-picker button[role="option"]').first()).toBeVisible();
  });

  test('P4 — chaque catégorie de revenu affiche une icône', async ({ page }) => {
    const options = page.locator('app-category-picker button[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index++) {
      await expect(options.nth(index).locator('svg')).toBeVisible();
    }
  });

  test('P5 — seuls les revenus fréquents sont visibles, « Plus de catégories » révèle le reste', async ({
    page,
  }) => {
    const options = page.locator('app-category-picker button[role="option"]');
    const more = page.locator('app-category-picker button.more');

    const collapsedCount = await options.count();
    expect(collapsedCount).toBeGreaterThanOrEqual(4);
    await expect(more).toHaveText(/Plus de catégories/);

    await more.click();

    const expandedCount = await options.count();
    expect(expandedCount).toBeGreaterThan(collapsedCount);
    await expect(page.locator('app-category-picker button.more')).toHaveText(/Moins de catégories/);
  });

  test('replier ramène à la liste courte', async ({ page }) => {
    const options = page.locator('app-category-picker button[role="option"]');
    const collapsedCount = await options.count();

    await page.locator('app-category-picker button.more').click();
    await page.locator('app-category-picker button.more').click();

    await expect(options).toHaveCount(collapsedCount);
  });
});
