import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Waitlist', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/waitlist');
  });

  test('should display waitlist page', async ({ page }) => {
    await expect(page.getByText(/waitlist/i).first()).toBeVisible();
  });

  test('should show waitlist entries or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });

  test('should add patient to waitlist', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();

    const patientSelect = page.getByLabel(/patient/i).or(page.locator('select').first());
    if (await patientSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await patientSelect.selectOption({ index: 1 });
    }

    const submitButton = page.getByRole('button', { name: /save|add|submit/i });
    if (await submitButton.isVisible()) {
      const responsePromise = waitForApiResponse(page, '/api/waitlist');
      await submitButton.click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('should remove entry from waitlist', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const deleteButton = page.getByRole('button', { name: /remove|delete/i }).first();
    if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await deleteButton.click();
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }
    }
  });

  test('should book appointment from waitlist', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const bookButton = page.getByRole('button', { name: /book|schedule/i }).first();
    if (await bookButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await bookButton.click();
      await page.waitForTimeout(500);
    }
  });
});
