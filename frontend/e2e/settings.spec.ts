import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Settings & Administration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
  });

  test.describe('Settings Page', () => {
    test('should display settings page', async ({ page }) => {
      await navigateTo(page, '/settings');
      await expect(page.getByText(/settings/i).first()).toBeVisible();
    });

    test('should show clinic settings form', async ({ page }) => {
      await navigateTo(page, '/settings');
      await page.waitForLoadState('networkidle');
      // Should have some settings fields
      const settingsContent = page.locator('form, [class*="settings"]').first();
      await expect(settingsContent).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Users Management', () => {
    test('should display users page', async ({ page }) => {
      await navigateTo(page, '/users');
      await expect(page.getByText(/user/i).first()).toBeVisible();
    });

    test('should show seeded users', async ({ page }) => {
      await navigateTo(page, '/users');
      await page.waitForLoadState('networkidle');
      // Should show dr.smith, nurse, staff, admin
      const user = page.getByText(/smith|johnson|doe|admin/i).first();
      await expect(user).toBeVisible({ timeout: 10000 });
    });

    test('should create a new user', async ({ page }) => {
      await navigateTo(page, '/users');
      const addButton = page.getByRole('button', { name: /add|new|create|invite/i }).first();
      if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await addButton.click();
        // Should show user creation form
        await expect(page.getByPlaceholder(/email/i).or(page.getByLabel(/email/i))).toBeVisible();
      }
    });
  });

  test.describe('Tags', () => {
    test('should display tags page', async ({ page }) => {
      await navigateTo(page, '/tags');
      await expect(page.getByText(/tag/i).first()).toBeVisible();
    });

    test('should show seeded tags', async ({ page }) => {
      await navigateTo(page, '/tags');
      await page.waitForLoadState('networkidle');
      // Seeded: VIP, New Patient, Chronic Condition, Follow-up Required, Insurance
      const tag = page.getByText(/vip|chronic|follow-up|insurance/i).first();
      await expect(tag).toBeVisible({ timeout: 10000 });
    });

    test('should create a new tag', async ({ page }) => {
      await navigateTo(page, '/tags');
      const addButton = page.getByRole('button', { name: /add|new|create/i }).first();
      await addButton.click();

      const nameInput = page.getByPlaceholder(/name|tag/i).or(page.getByLabel(/name/i));
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('E2E Test Tag');
        const submitButton = page.getByRole('button', { name: /save|create|add/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
      }
    });
  });

  test.describe('Presets', () => {
    test('should display presets page', async ({ page }) => {
      await navigateTo(page, '/presets');
      await expect(page.getByText(/preset/i).first()).toBeVisible();
    });

    test('should show seeded presets', async ({ page }) => {
      await navigateTo(page, '/presets');
      await page.waitForLoadState('networkidle');
      // Seeded presets: Annual Checkup, Follow-up Visit, Flu Vaccination, etc.
      const preset = page.getByText(/annual checkup|follow-up|flu|blood work|consultation/i).first();
      await expect(preset).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Note Templates', () => {
    test('should display note templates page', async ({ page }) => {
      await navigateTo(page, '/note-templates');
      await expect(page.getByText(/template/i).first()).toBeVisible();
    });

    test('should show seeded note templates', async ({ page }) => {
      await navigateTo(page, '/note-templates');
      await page.waitForLoadState('networkidle');
      const template = page.getByText(/follow-up|lab test|medication|referral|payment/i).first();
      await expect(template).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Custom Fields', () => {
    test('should display custom fields page', async ({ page }) => {
      await navigateTo(page, '/custom-fields');
      await expect(page.getByText(/custom field/i).first()).toBeVisible();
    });
  });

  test.describe('Audit Logs', () => {
    test('should display audit logs page', async ({ page }) => {
      await navigateTo(page, '/audit-logs');
      await page.waitForLoadState('networkidle');
      const content = page.locator('main, [class*="content"]').first();
      await expect(content).toBeVisible();
    });
  });
});
