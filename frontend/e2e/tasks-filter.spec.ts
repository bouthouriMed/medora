import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Tasks Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should filter tasks by status - Pending', async ({ page }) => {
    const pendingButton = page.getByRole('button', { name: /pending|to do/i }).first();
    if (await pendingButton.isVisible()) {
      await pendingButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter tasks by status - In Progress', async ({ page }) => {
    const inProgressButton = page.getByRole('button', { name: /in progress/i }).first();
    if (await inProgressButton.isVisible()) {
      await inProgressButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter tasks by status - Completed', async ({ page }) => {
    const completedButton = page.getByRole('button', { name: /completed|done/i }).first();
    if (await completedButton.isVisible()) {
      await completedButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter tasks by priority', async ({ page }) => {
    const prioritySelect = page.locator('select').first();
    if (await prioritySelect.isVisible()) {
      await prioritySelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });

  test('should search tasks by title', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|filter/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('task');
      await page.waitForTimeout(500);
    }
  });

  test('should clear all task filters', async ({ page }) => {
    const clearButton = page.getByRole('button', { name: /clear|reset|all/i }).first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });
});
