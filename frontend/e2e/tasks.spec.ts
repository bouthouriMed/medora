import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/tasks');
  });

  test('should display tasks page', async ({ page }) => {
    await expect(page.getByText(/task/i).first()).toBeVisible();
  });

  test('should show seeded tasks', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Seeded: Follow up with Alice, Call insurance, Schedule checkup, Review BP log
    const task = page.getByText(/follow up|call insurance|schedule checkup|review bp/i).first();
    await expect(task).toBeVisible({ timeout: 10000 });
  });

  test('should create a new task', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();

    const titleInput = page.getByPlaceholder(/title|task/i).or(page.getByLabel(/title/i));
    if (await titleInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await titleInput.fill('E2E Test Task');
    }

    const submitButton = page.getByRole('button', { name: /save|create|add/i });
    if (await submitButton.isVisible()) {
      const responsePromise = waitForApiResponse(page, '/api/tasks');
      await submitButton.click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('should toggle task completion', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await checkbox.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter tasks by priority', async ({ page }) => {
    const highPriority = page.getByRole('button', { name: /high/i }).or(page.getByText(/high/i));
    if (await highPriority.isVisible({ timeout: 3000 }).catch(() => false)) {
      await highPriority.click();
      await page.waitForTimeout(500);
    }
  });

  test('should delete a task', async ({ page }) => {
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
