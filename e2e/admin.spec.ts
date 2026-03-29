import { test, expect, Page } from '@playwright/test';

async function registerUser(page: Page, username: string, password: string) {
  await page.request.post('/api/auth/register', { data: { username, password } });
}

async function loginUser(page: Page, username: string, password: string) {
  await page.request.post('/api/auth/login', { data: { username, password } });
}

function uniqueUser() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

test.beforeEach(async ({ context }) => {
  await context.request.post('http://localhost:5001/api/test/reset');
  await context.clearCookies();
});

test.describe('Admin Dashboard', () => {
  test('admin should see a table with all users', async ({ page }) => {
    const adminUser = uniqueUser();
    const password = 'SecurePass123!';
    await registerUser(page, adminUser, password);

    const regularUser = uniqueUser();
    await registerUser(page, regularUser, password);

    await loginUser(page, adminUser, password);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: 'Admin Dashboard' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Benutzername/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Rolle/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /Registriert am/i })).toBeVisible();
    await expect(page.getByRole('cell', { name: adminUser })).toBeVisible();
    await expect(page.getByRole('cell', { name: regularUser })).toBeVisible();
  });

  test('non-admin user should see access denied message', async ({ page }) => {
    const adminUser = uniqueUser();
    await registerUser(page, adminUser, 'SecurePass123!');

    const regularUser = uniqueUser();
    const password = 'SecurePass123!';
    await registerUser(page, regularUser, password);
    await loginUser(page, regularUser, password);

    await page.goto('/admin');

    await expect(page.getByText('Zugriff verweigert')).toBeVisible();
    await expect(page.getByText('Du hast keine Berechtigung, diese Seite anzuzeigen.')).toBeVisible();
  });

  test('unauthenticated user should be redirected to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});
