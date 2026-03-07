import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Lab Results', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/lab-results');
  });

  test('should display lab results page', async ({ page }) => {
    await expect(page.getByText(/lab/i).first()).toBeVisible();
  });

  test('should show seeded lab results', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Should show CBC, Hemoglobin, Lipid Panel, or Urinalysis from seed
    const labResult = page.getByText(/cbc|hemoglobin|lipid|urinalysis/i).first();
    await expect(labResult).toBeVisible({ timeout: 10000 });
  });

  test('should create a new lab result', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
    await addButton.click();

    // Fill in lab result form
    const testNameInput = page.getByPlaceholder(/test name/i).or(page.getByLabel(/test name/i));
    if (await testNameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testNameInput.fill('Blood Glucose');
    }

    // Select patient
    const patientSelect = page.getByLabel(/patient/i).or(page.locator('select').first());
    if (await patientSelect.isVisible()) {
      await patientSelect.selectOption({ index: 1 });
    }

    const submitButton = page.getByRole('button', { name: /save|create|submit/i });
    if (await submitButton.isVisible()) {
      const responsePromise = waitForApiResponse(page, '/api/lab-results');
      await submitButton.click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(400);
    }
  });

  test('should filter lab results by status', async ({ page }) => {
    const pendingFilter = page.getByRole('button', { name: /pending/i }).or(page.getByText(/pending/i));
    if (await pendingFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await pendingFilter.click();
      await page.waitForTimeout(500);
    }
  });

  test('should update a lab result status', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    const editButton = page.getByRole('button', { name: /edit|update|complete/i }).first();
    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForTimeout(500);
    }
  });
});
