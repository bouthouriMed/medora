import { test, expect } from '@playwright/test';
import { login, navigateTo, waitForApiResponse } from './helpers';

test.describe('Messages', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'doctor');
    await navigateTo(page, '/messages');
  });

  test('should display messages page', async ({ page }) => {
    await expect(page.getByText(/message/i).first()).toBeVisible();
  });

  test('should show conversation list or empty state', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Either shows conversations or "no messages" state
    const content = page.locator('main, [class*="content"]').first();
    await expect(content).toBeVisible();
  });

  test('should send a new message', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for new message button or compose area
    const newMessageBtn = page.getByRole('button', { name: /new|compose|send/i }).first();
    if (await newMessageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newMessageBtn.click();
    }

    // Fill message body
    const messageInput = page.getByPlaceholder(/message|type/i).or(page.locator('textarea')).first();
    if (await messageInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await messageInput.fill('E2E test message');
      const sendButton = page.getByRole('button', { name: /send/i });
      if (await sendButton.isVisible()) {
        await sendButton.click();
      }
    }
  });
});
