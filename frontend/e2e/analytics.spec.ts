import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Analytics & Insights', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
  });

  test.describe('Analytics Page', () => {
    test('should display analytics page', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await expect(page.getByText(/analytics/i).first()).toBeVisible();
    });

    test('should show charts or metrics', async ({ page }) => {
      await navigateTo(page, '/analytics');
      await page.waitForLoadState('networkidle');
      // Should show some chart containers or metric cards
      const chart = page.locator('svg, canvas, [class*="chart"], [class*="metric"]').first();
      await expect(chart).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Doctor Ratings', () => {
    test('should display doctor ratings page', async ({ page }) => {
      await navigateTo(page, '/doctor-ratings');
      await expect(page.getByText(/rating/i).first()).toBeVisible();
    });
  });
});
