import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function registerUser(page: Page, email: string, password: string, displayName = 'Test User') {
  await page.request.post('/api/auth/register', { data: { email, password, displayName } });
}

async function loginUser(page: Page, email: string, password: string) {
  await page.request.post('/api/auth/login', { data: { email, password } });
}

test.beforeEach(async ({ context }) => {
  await context.request.post('http://localhost:5001/api/test/reset');
  await context.clearCookies();
});

test.describe('Admin Dashboard', () => {
  test('admin should see a table with all users', async ({ page }) => {
    const adminEmail = uniqueEmail();
    const password = 'SecurePass123!';
    await registerUser(page, adminEmail, password, 'Admin User');

    const regularEmail = uniqueEmail();
    await registerUser(page, regularEmail, password, 'Regular User');

    await loginUser(page, adminEmail, password);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /E-Mail/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Rolle/i })).toBeVisible();
    await expect(page.getByRole('cell', { name: adminEmail })).toBeVisible();
    await expect(page.getByRole('cell', { name: regularEmail })).toBeVisible();
  });

  test('non-admin user should see access denied message', async ({ page }) => {
    const adminEmail = uniqueEmail();
    await registerUser(page, adminEmail, 'SecurePass123!', 'Admin');

    const regularEmail = uniqueEmail();
    const password = 'SecurePass123!';
    await registerUser(page, regularEmail, password, 'Regular');
    await loginUser(page, regularEmail, password);

    await page.goto('/admin');

    await expect(page.getByText('Zugriff verweigert')).toBeVisible();
    await expect(page.getByText('Du hast keine Berechtigung, diese Seite anzuzeigen.')).toBeVisible();
  });

  test('unauthenticated user should be redirected to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
