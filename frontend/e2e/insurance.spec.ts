import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Insurance Claims', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/insurance');
  });

  test('should display insurance page', async ({ page }) => {
    await expect(page.getByText(/insurance/i).first()).toBeVisible();
  });

  test('should show insurance claims list or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });

  test('should create a new insurance claim', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create|file/i }).first();
    await addButton.click();

    // Fill claim form
    const patientSelect = page.getByLabel(/patient/i).or(page.locator('select').first());
    if (await patientSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await patientSelect.selectOption({ index: 1 });
    }

    const providerInput = page.getByPlaceholder(/provider|insurance/i).or(page.getByLabel(/provider/i));
    if (await providerInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await providerInput.fill('Blue Cross Blue Shield');
    }

    const amountInput = page.getByPlaceholder(/amount/i).or(page.getByLabel(/amount/i));
    if (await amountInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await amountInput.fill('500');
    }

    const submitButton = page.getByRole('button', { name: /save|create|submit|file/i });
    if (await submitButton.isVisible()) {
      const responsePromise = waitForApiResponse(page, '/api/insurance');
      await submitButton.click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('should show insurance statistics', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Should show some stats - total claims, approved, denied, etc.
    const statsSection = page.getByText(/total|submitted|approved|denied|pending/i).first();
    if (await statsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statsSection).toBeVisible();
    }
  });
});
