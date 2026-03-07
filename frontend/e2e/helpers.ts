import { Page, expect } from '@playwright/test';

export const TEST_USERS = {
  doctor: { email: 'dr.smith@medora.com', password: 'password123' },
  nurse: { email: 'nurse@medora.com', password: 'password123' },
  staff: { email: 'staff@medora.com', password: 'password123' },
  admin: { email: 'admin@medora.com', password: 'password123' },
};

export async function login(page: Page, user: keyof typeof TEST_USERS = 'doctor') {
  const { email, password } = TEST_USERS[user];
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in|login/i }).click();
  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 10000 });
  await expect(page).toHaveURL('/');
}

export async function logout(page: Page) {
  // Click profile/avatar area in sidebar to trigger logout
  const profileMenu = page.locator('[data-testid="profile-menu"]').or(page.getByText(/sign out|logout/i));
  if (await profileMenu.isVisible()) {
    await profileMenu.click();
  }
}

export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

export async function waitForApiResponse(page: Page, urlPattern: string | RegExp) {
  return page.waitForResponse(
    (resp) => {
      const url = resp.url();
      if (typeof urlPattern === 'string') return url.includes(urlPattern);
      return urlPattern.test(url);
    },
    { timeout: 15000 }
  );
}

export async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    const input = page.getByLabel(label).or(page.getByPlaceholder(label));
    await input.fill(value);
  }
}

export async function selectOption(page: Page, label: string, value: string) {
  await page.getByLabel(label).or(page.locator(`select[name="${label}"]`)).selectOption(value);
}

export async function expectToastMessage(page: Page, text: string | RegExp) {
  const toast = page.locator('[class*="toast"], [role="alert"], [data-testid="toast"]');
  await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 5000 });
}

export async function clickAndWaitForApi(page: Page, locator: ReturnType<Page['getByRole']>, urlPattern: string) {
  const responsePromise = waitForApiResponse(page, urlPattern);
  await locator.click();
  return responsePromise;
}
