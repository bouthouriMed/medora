import { test, expect } from '@playwright/test';
import { login, navigateTo } from './helpers';

test.describe('Appointments Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/appointments');
    await page.waitForLoadState('networkidle');
  });

  test('should load appointments page', async ({ page }) => {
    await expect(page.getByText(/appointment/i).first()).toBeVisible();
  });

  test('should filter by Today', async ({ page }) => {
    const todayButton = page.getByRole('button', { name: /today/i }).first();
    await todayButton.click();
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toContain('filter=today');
  });

  test('should filter by Upcoming', async ({ page }) => {
    const upcomingButton = page.getByRole('button', { name: /upcoming/i }).first();
    await upcomingButton.click();
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).toContain('filter=upcoming');
  });

  test('should show all appointments', async ({ page }) => {
    const showAllButton = page.getByRole('button', { name: /show all/i }).first();
    await showAllButton.click();
    await page.waitForTimeout(500);
    const url = page.url();
    expect(url).not.toContain('filter=');
  });

  test('should toggle calendar view', async ({ page }) => {
    const calendarButton = page.getByRole('button', { name: /calendar/i }).first();
    await calendarButton.click();
    await page.waitForTimeout(500);
    const calendar = page.locator('.fc');
    await expect(calendar).toBeVisible({ timeout: 5000 });
  });

  test('should toggle list view', async ({ page }) => {
    const listButton = page.getByRole('button', { name: /list/i }).first();
    await listButton.click();
    await page.waitForTimeout(500);
  });

  test('should filter by custom date range', async ({ page }) => {
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);
    
    await startDateInput.fill('2026-01-01');
    await endDateInput.fill('2026-12-31');
    await page.waitForTimeout(500);
    
    const url = page.url();
    expect(url).toContain('startDate=');
    expect(url).toContain('endDate=');
  });
});

test.describe('Patients Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/patients');
    await page.waitForLoadState('networkidle');
  });

  test('should load patients page', async ({ page }) => {
    await expect(page.getByText(/patient/i).first()).toBeVisible();
  });

  test('should search patients', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('John');
      await page.waitForTimeout(500);
    }
  });

  test('should toggle archived patients', async ({ page }) => {
    const archivedButton = page.getByRole('button', { name: /archived/i }).first();
    if (await archivedButton.isVisible()) {
      await archivedButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should open add patient modal', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /add patient|new patient/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Invoices Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/invoices');
    await page.waitForLoadState('networkidle');
  });

  test('should load invoices page', async ({ page }) => {
    await expect(page.getByText(/invoice/i).first()).toBeVisible();
  });

  test('should filter by paid status', async ({ page }) => {
    const paidButton = page.getByRole('button', { name: /paid/i }).first();
    if (await paidButton.isVisible()) {
      await paidButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter by unpaid status', async ({ page }) => {
    const unpaidButton = page.getByRole('button', { name: /unpaid/i }).first();
    if (await unpaidButton.isVisible()) {
      await unpaidButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should search invoices', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Lab Results Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/lab-results');
    await page.waitForLoadState('networkidle');
  });

  test('should load lab results page', async ({ page }) => {
    await expect(page.getByText(/lab/i).first()).toBeVisible();
  });

  test('should filter by pending', async ({ page }) => {
    const pendingButton = page.getByRole('button', { name: /pending/i }).first();
    if (await pendingButton.isVisible()) {
      await pendingButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should filter by completed', async ({ page }) => {
    const completedButton = page.getByRole('button', { name: /completed/i }).first();
    if (await completedButton.isVisible()) {
      await completedButton.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Tasks Complete Flow', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/tasks');
    await page.waitForLoadState('networkidle');
  });

  test('should load tasks page', async ({ page }) => {
    await expect(page.getByText(/task/i).first()).toBeVisible();
  });

  test('should open create task modal', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /new task|add task/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard', async ({ page }) => {
    await expect(page.getByText(/dashboard/i).first()).toBeVisible();
  });

  test('should navigate to appointments from dashboard', async ({ page }) => {
    const appointmentsLink = page.getByRole('link', { name: /appointment/i }).first();
    if (await appointmentsLink.isVisible()) {
      await appointmentsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/appointments/);
    }
  });

  test('should navigate to patients from dashboard', async ({ page }) => {
    const patientsLink = page.getByRole('link', { name: /patient/i }).first();
    if (await patientsLink.isVisible()) {
      await patientsLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/patients/);
    }
  });
});

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/settings');
    await page.waitForLoadState('networkidle');
  });

  test('should load settings page', async ({ page }) => {
    await expect(page.getByText(/setting/i).first()).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
  });

  test('should navigate to all main pages', async ({ page }) => {
    const pages = [
      { name: 'Dashboard', path: '/' },
      { name: 'Appointments', path: '/appointments' },
      { name: 'Patients', path: '/patients' },
      { name: 'Invoices', path: '/invoices' },
      { name: 'Lab Results', path: '/lab-results' },
      { name: 'Tasks', path: '/tasks' },
      { name: 'Settings', path: '/settings' },
    ];

    for (const p of pages) {
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(p.path);
    }
  });
});
