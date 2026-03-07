import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Appointments Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/appointments');
    await page.waitForLoadState('networkidle');
  });

  test('should filter appointments by Today', async ({ page }) => {
    const todayButton = page.getByRole('button', { name: /today/i }).first();
    await todayButton.click();
    await page.waitForTimeout(500);
    
    const url = page.url();
    expect(url).toContain('filter=today');
  });

  test('should filter appointments by Upcoming', async ({ page }) => {
    const upcomingButton = page.getByRole('button', { name: /upcoming/i }).first();
    await upcomingButton.click();
    await page.waitForTimeout(500);
    
    const url = page.url();
    expect(url).toContain('filter=upcoming');
  });

  test('should show all appointments when clicking Show All', async ({ page }) => {
    const todayButton = page.getByRole('button', { name: /today/i }).first();
    await todayButton.click();
    await page.waitForTimeout(300);
    
    const showAllButton = page.getByRole('button', { name: /show all/i }).first();
    await showAllButton.click();
    await page.waitForTimeout(500);
    
    const url = page.url();
    expect(url).toContain('filter=all');
  });

  test('should filter appointments by date range', async ({ page }) => {
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    await startDateInput.fill(today.toISOString().split('T')[0]);
    await endDateInput.fill(nextWeek.toISOString().split('T')[0]);
    await page.waitForTimeout(500);
    
    const url = page.url();
    expect(url).toContain('startDate=');
    expect(url).toContain('endDate=');
  });

  test('should toggle between list and calendar view', async ({ page }) => {
    const calendarButton = page.getByRole('button', { name: /calendar/i }).first();
    if (await calendarButton.isVisible()) {
      await calendarButton.click();
      await page.waitForTimeout(500);
    }
    
    const listButton = page.getByRole('button', { name: /list/i }).first();
    if (await listButton.isVisible()) {
      await listButton.click();
      await page.waitForTimeout(500);
    }
  });
});
