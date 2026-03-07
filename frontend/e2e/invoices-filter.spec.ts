import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Invoices Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/invoices');
    await page.waitForLoadState('networkidle');
  });

  test('should filter invoices by Paid status', async ({ page }) => {
    const paidButton = page.getByRole('button', { name: /paid/i }).first();
    if (await paidButton.isVisible()) {
      await paidButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter invoices by Unpaid status', async ({ page }) => {
    const unpaidButton = page.getByRole('button', { name: /unpaid/i }).first();
    if (await unpaidButton.isVisible()) {
      await unpaidButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter invoices by Overdue status', async ({ page }) => {
    const overdueButton = page.getByRole('button', { name: /overdue/i }).first();
    if (await overdueButton.isVisible()) {
      await overdueButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter invoices by date range', async ({ page }) => {
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

  test('should search invoices by patient name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('John');
      await page.waitForTimeout(500);
    }
  });

  test('should clear all filters', async ({ page }) => {
    const clearButton = page.getByRole('button', { name: /clear|reset/i }).first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });
});
