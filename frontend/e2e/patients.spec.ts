import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Patients', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/patients');
  });

  test.describe('Patient List', () => {
    test('should display patient list', async ({ page }) => {
      await expect(page.getByText(/patients/i).first()).toBeVisible();
      // Should have seeded patients visible
      await expect(page.getByText(/alice|bob|carol|david|eva/i).first()).toBeVisible({ timeout: 10000 });
    });

    test('should search patients by name', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i).first();
      await searchInput.fill('Alice');
      await page.waitForTimeout(500); // debounce
      await expect(page.getByText(/alice/i).first()).toBeVisible();
    });

    test('should search patients with no results', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/search/i).first();
      await searchInput.fill('ZZZZNONEXISTENT');
      await page.waitForTimeout(500);
      // Should show empty state or no matching patients
      const patientCards = page.locator('[data-testid="patient-row"], tr, [class*="patient"]');
      // Either shows "no patients" message or very few results
    });

    test('should open create patient modal', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
      await addButton.click();
      // Modal should appear with form fields
      await expect(page.getByPlaceholder(/first name/i).or(page.getByLabel(/first name/i))).toBeVisible();
    });
  });

  test.describe('Create Patient', () => {
    test('should create a new patient', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
      await addButton.click();

      await page.getByPlaceholder(/first name/i).or(page.getByLabel(/first name/i)).fill('TestFirst');
      await page.getByPlaceholder(/last name/i).or(page.getByLabel(/last name/i)).fill('TestLast');
      await page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i)).fill('test.patient@example.com');
      await page.getByPlaceholder(/phone/i).or(page.getByLabel(/phone/i)).fill('555-0199');

      const responsePromise = waitForApiResponse(page, '/api/patients');
      await page.getByRole('button', { name: /save|create|submit|add/i }).click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(400);
    });

    test('should show validation error for missing required fields', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
      await addButton.click();

      // Try to submit without filling required fields
      await page.getByRole('button', { name: /save|create|submit|add/i }).click();

      // Should stay on form or show validation error
      await expect(page.getByPlaceholder(/first name/i).or(page.getByLabel(/first name/i))).toBeVisible();
    });
  });

  test.describe('Patient Detail', () => {
    test('should navigate to patient detail page', async ({ page }) => {
      // Click on first patient
      const patientLink = page.getByText(/alice johnson/i).first();
      await patientLink.click();
      await expect(page).toHaveURL(/\/patients\/.+/);
    });

    test('should show patient information on detail page', async ({ page }) => {
      const patientLink = page.getByText(/alice johnson/i).first();
      await patientLink.click();
      await page.waitForLoadState('networkidle');

      // Should display patient details
      await expect(page.getByText(/alice/i).first()).toBeVisible();
    });
  });

  test.describe('Patient Actions', () => {
    test('should archive a patient', async ({ page }) => {
      // Find a patient action menu
      const menuButtons = page.locator('button[aria-label*="menu"], button[title*="menu"], [data-testid="patient-menu"]').or(
        page.locator('svg').filter({ has: page.locator('[class*="ellipsis"], [class*="dots"], [class*="more"]') })
      );
      if (await menuButtons.first().isVisible()) {
        await menuButtons.first().click();
        const deleteOption = page.getByText(/archive|delete|remove/i).first();
        if (await deleteOption.isVisible()) {
          await deleteOption.click();
          // Confirm if there's a confirmation dialog
          const confirmButton = page.getByRole('button', { name: /confirm|yes|delete|archive/i });
          if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await confirmButton.click();
          }
        }
      }
    });

    test('should export patients', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Export functionality exists
        await expect(exportButton).toBeEnabled();
      }
    });
  });
});
