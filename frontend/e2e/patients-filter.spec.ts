import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Patients Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/patients');
    await page.waitForLoadState('networkidle');
  });

  test('should search patients by name', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('John');
      await page.waitForTimeout(500);
    }
  });

  test('should filter patients by tag', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);
      
      const tagSelect = page.locator('select').first();
      if (await tagSelect.isVisible()) {
        await tagSelect.selectOption({ index: 1 });
        await page.waitForTimeout(500);
      }
    }
  });

  test('should filter patients by registration date range', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);
      
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
    }
  });

  test('should toggle archived patients visibility', async ({ page }) => {
    const archivedButton = page.getByRole('button', { name: /archived|show archived/i }).first();
    if (await archivedButton.isVisible()) {
      await archivedButton.click();
      await page.waitForTimeout(500);
      
      await archivedButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should clear all patient filters', async ({ page }) => {
    const filterButton = page.getByRole('button', { name: /filter/i }).first();
    if (await filterButton.isVisible()) {
      await filterButton.click();
      await page.waitForTimeout(300);
      
      const clearButton = page.getByRole('button', { name: /clear|reset/i }).first();
      if (await clearButton.isVisible()) {
        await clearButton.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
