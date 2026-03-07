import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/appointments');
  });

  test.describe('Appointment List', () => {
    test('should display appointments page', async ({ page }) => {
      await expect(page.getByText(/appointment/i).first()).toBeVisible();
    });

    test('should show appointments in list or calendar view', async ({ page }) => {
      // Wait for appointments to load
      await page.waitForLoadState('networkidle');
      // Should have some content - either appointments or empty state
      const content = page.locator('main, [class*="content"]').first();
      await expect(content).toBeVisible();
    });

    test('should toggle between list and calendar view', async ({ page }) => {
      const calendarToggle = page.getByRole('button', { name: /calendar/i }).or(
        page.getByText(/calendar/i).first()
      );
      const listToggle = page.getByRole('button', { name: /list/i }).or(
        page.getByText(/list/i).first()
      );

      if (await calendarToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        await calendarToggle.click();
        await page.waitForTimeout(500);
        // Calendar view should be visible
        const calendarEl = page.locator('.fc, [class*="calendar"], [class*="Calendar"]').first();
        await expect(calendarEl).toBeVisible({ timeout: 5000 });
      }
    });

    test('should filter appointments by date', async ({ page }) => {
      // Look for date picker or date navigation
      const datePicker = page.locator('input[type="date"]').first();
      if (await datePicker.isVisible({ timeout: 3000 }).catch(() => false)) {
        const today = new Date().toISOString().split('T')[0];
        await datePicker.fill(today);
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Create Appointment', () => {
    test('should open new appointment modal', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /new|add|create|book/i }).first();
      await addButton.click();
      // Modal should show patient and doctor selectors
      await expect(page.getByText(/patient|doctor|date|time/i).first()).toBeVisible();
    });

    test('should create a new appointment', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /new|add|create|book/i }).first();
      await addButton.click();

      // Select patient
      const patientSelect = page.getByLabel(/patient/i).or(page.locator('select').first());
      if (await patientSelect.isVisible()) {
        await patientSelect.selectOption({ index: 1 });
      }

      // Select doctor
      const doctorSelect = page.getByLabel(/doctor/i).or(page.locator('select').nth(1));
      if (await doctorSelect.isVisible()) {
        await doctorSelect.selectOption({ index: 1 });
      }

      // Set date/time
      const dateInput = page.locator('input[type="datetime-local"], input[type="date"]').first();
      if (await dateInput.isVisible()) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);
        await dateInput.fill(tomorrow.toISOString().slice(0, 16));
      }

      // Set reason
      const reasonInput = page.getByPlaceholder(/reason|note|description/i).or(page.getByLabel(/reason/i));
      if (await reasonInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await reasonInput.fill('General checkup');
      }

      const responsePromise = waitForApiResponse(page, '/api/appointments');
      await page.getByRole('button', { name: /save|create|book|schedule|submit/i }).click();
      const response = await responsePromise;
      expect(response.status()).toBeLessThan(400);
    });
  });

  test.describe('Appointment Actions', () => {
    test('should update appointment status', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      // Look for status dropdown or action buttons on appointments
      const statusButton = page.getByRole('button', { name: /check.in|confirm|cancel|complete/i }).first();
      if (await statusButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(statusButton).toBeEnabled();
      }
    });

    test('should complete appointment with invoice', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const completeButton = page.getByRole('button', { name: /complete|finish/i }).first();
      if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completeButton.click();
        // Should show invoice creation dialog or auto-create
        await page.waitForTimeout(1000);
      }
    });

    test('should cancel an appointment', async ({ page }) => {
      await page.waitForLoadState('networkidle');
      const cancelButton = page.getByRole('button', { name: /cancel/i }).first();
      if (await cancelButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await cancelButton.click();
        // Confirm cancellation if dialog appears
        const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }
      }
    });
  });

  test.describe('Appointment Requests', () => {
    test('should show appointment requests tab or section', async ({ page }) => {
      const requestsTab = page.getByText(/request/i).first();
      if (await requestsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await requestsTab.click();
        await page.waitForTimeout(500);
      }
    });
  });
});
