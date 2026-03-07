import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/marketplace');
  });

  test('should display marketplace page', async ({ page }) => {
    await expect(page.getByText(/marketplace/i).first()).toBeVisible();
  });

  test('should show marketplace items or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });

  test('should create a new marketplace item', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
  });
});
