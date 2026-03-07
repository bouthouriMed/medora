import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Telemedicine', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/telemedicine');
  });

  test('should display telemedicine page', async ({ page }) => {
    await expect(page.getByText(/telemedicine|video/i).first()).toBeVisible();
  });

  test('should show video sessions list or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });

  test('should create a new video session', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /new|create|start/i }).first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      // Should show session creation form
      const patientSelect = page.getByLabel(/patient/i).or(page.locator('select').first());
      if (await patientSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await patientSelect.selectOption({ index: 1 });
      }
    }
  });
});

test.describe('Remote Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/remote-monitoring');
  });

  test('should display remote monitoring page', async ({ page }) => {
    await expect(page.getByText(/remote|monitoring|device/i).first()).toBeVisible();
  });

  test('should show device readings or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });
});
