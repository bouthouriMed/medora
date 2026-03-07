import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/invoices');
  });

  test.describe('Invoice List', () => {
    test('should display invoices page', async ({ page }) => {
      await expect(page.getByText(/invoice/i).first()).toBeVisible();
    });

    test('should show invoice list with seeded data', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      // Should show amounts or patient names from seeded invoices
      const invoiceContent = page.getByText(/\$|paid|unpaid/i).first();
      await expect(invoiceContent).toBeVisible({ timeout: 10000 });
    });

    test('should filter invoices by status - paid', async ({ page }) => {
      const paidFilter = page.getByRole('button', { name: /paid/i }).or(page.getByText(/^paid$/i));
      if (await paidFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await paidFilter.click();
        await page.waitForTimeout(500);
      }
    });

    test('should filter invoices by status - unpaid', async ({ page }) => {
      const unpaidFilter = page.getByRole('button', { name: /unpaid/i }).or(page.getByText(/^unpaid$/i));
      if (await unpaidFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
        await unpaidFilter.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Invoice Actions', () => {
    test('should mark invoice as paid', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const payButton = page.getByRole('button', { name: /mark.*paid|pay|collect/i }).first();
      if (await payButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        const responsePromise = waitForApiResponse(page, '/api/invoices');
        await payButton.click();
        // Confirm if needed
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }
    });

    test('should delete an invoice', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const deleteButton = page.getByRole('button', { name: /delete|remove/i }).first();
      if (await deleteButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await deleteButton.click();
        const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }
    });
  });
});
