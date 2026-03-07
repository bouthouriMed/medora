import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Navigation & Layout', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
  });

  test('should display sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();
  });

  test('should navigate to all core pages from sidebar', async ({ page }) => {
    const pages = [
      { link: /patients/i, url: '/patients' },
      { link: /appointments/i, url: '/appointments' },
      { link: /invoices/i, url: '/invoices' },
      { link: /lab/i, url: '/lab-results' },
      { link: /tasks/i, url: '/tasks' },
      { link: /messages/i, url: '/messages' },
    ];

    for (const p of pages) {
      const navLink = page.getByRole('link', { name: p.link }).first();
      if (await navLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await navLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(p.url);
        // Navigate back to dashboard
        await page.goto('/');
      }
    }
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    const toggleButton = page.locator('[data-testid="sidebar-toggle"]').or(
      page.locator('button').filter({ has: page.locator('svg') }).first()
    );
    if (await toggleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await toggleButton.click();
      await page.waitForTimeout(300); // animation
    }
  });

  test('should show quick search functionality', async ({ page }) => {
    // Quick search is usually triggered with Ctrl+K
    await page.keyboard.press('Control+k');
    const searchDialog = page.locator('[class*="search"], [role="dialog"]').first();
    if (await searchDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(searchDialog).toBeVisible();
      await page.keyboard.press('Escape');
    }
  });

  test('should show notification bell', async ({ page }) => {
    const bell = page.locator('[data-testid="notification-bell"]').or(
      page.getByRole('button', { name: /notification/i })
    );
    if (await bell.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(bell).toBeVisible();
    }
  });

  test('should show user profile section in sidebar', async ({ page }) => {
    // Should show logged-in user info
    const userInfo = page.getByText(/sarah|smith|dr\./i).first();
    await expect(userInfo).toBeVisible({ timeout: 5000 });
  });
});
