import { test, expect } from '@playwright/test';
import { login, TEST_USERS } from './helpers';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should show login page when not authenticated', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL('/login');
    });

    test('should login successfully as doctor', async ({ page }) => {
      await login(page, 'doctor');
      await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    });

    test('should login successfully as admin', async ({ page }) => {
      await login(page, 'admin');
      await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    });

    test('should login successfully as nurse', async ({ page }) => {
      await login(page, 'nurse');
      await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    });

    test('should login successfully as staff', async ({ page }) => {
      await login(page, 'staff');
      await expect(page.getByText(/dashboard/i).first()).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.getByPlaceholder(/email/i).fill('wrong@email.com');
      await page.getByPlaceholder(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|log in|login/i }).click();
      await expect(page.getByText(/invalid|error|incorrect|failed/i)).toBeVisible({ timeout: 5000 });
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /sign in|log in|login/i }).click();
      // HTML5 validation or custom validation should prevent submission
      const emailInput = page.getByPlaceholder(/email/i);
      await expect(emailInput).toBeVisible();
    });

    test('should redirect to dashboard if already logged in', async ({ page }) => {
      await login(page, 'doctor');
      await page.goto('/login');
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Registration', () => {
    test('should show registration page', async ({ page }) => {
      await page.goto('/register');
      await expect(page.getByPlaceholder(/email/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i).first()).toBeVisible();
    });

    test('should show validation errors for incomplete registration', async ({ page }) => {
      await page.goto('/register');
      await page.getByRole('button', { name: /register|sign up|create/i }).click();
      // Should not navigate away
      await expect(page).toHaveURL('/register');
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login for /patients when not authenticated', async ({ page }) => {
      await page.goto('/patients');
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to login for /appointments when not authenticated', async ({ page }) => {
      await page.goto('/appointments');
      await expect(page).toHaveURL('/login');
    });

    test('should redirect to login for /invoices when not authenticated', async ({ page }) => {
      await page.goto('/invoices');
      await expect(page).toHaveURL('/login');
    });
  });
});
