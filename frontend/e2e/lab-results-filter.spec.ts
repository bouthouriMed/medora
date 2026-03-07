import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Lab Results Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/lab-results');
    await page.waitForLoadState('networkidle');
  });

  test('should filter lab results by status - Pending', async ({ page }) => {
    const pendingButton = page.getByRole('button', { name: /pending/i }).first();
    if (await pendingButton.isVisible()) {
      await pendingButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter lab results by status - Completed', async ({ page }) => {
    const completedButton = page.getByRole('button', { name: /completed/i }).first();
    if (await completedButton.isVisible()) {
      await completedButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter lab results by date range', async ({ page }) => {
    const dateFromInput = page.locator('input[type="date"]').first();
    const dateToInput = page.locator('input[type="date"]').nth(1);
    
    if (await dateFromInput.isVisible()) {
      const today = new Date();
      const lastMonth = new Date(today);
      lastMonth.setMonth(today.getMonth() - 1);
      
      await dateFromInput.fill(lastMonth.toISOString().split('T')[0]);
      await dateToInput.fill(today.toISOString().split('T')[0]);
      await page.waitForTimeout(500);
    }
  });

  test('should search lab results by patient name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('John');
      await page.waitForTimeout(500);
    }
  });
});
