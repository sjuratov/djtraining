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

async function createAdminUser(page: Page, email: string, password: string, displayName = 'Admin User') {
  await page.request.post('http://localhost:5101/api/test/create-user', {
    data: { email, password, displayName, role: 'admin' },
  });
}

async function createVerifiedUser(page: Page, email: string, password: string, displayName = 'Test User') {
  await page.request.post('http://localhost:5101/api/test/create-user', {
    data: { email, password, displayName },
  });
}

test.beforeEach(async ({ context }) => {
  await context.request.post('http://localhost:5101/api/test/reset');
  await context.clearCookies();
});

test.describe('Admin Dashboard', () => {
  test('admin should see a table with all users', async ({ page }) => {
    const adminEmail = uniqueEmail();
    const password = 'SecurePass123!';
    await createAdminUser(page, adminEmail, password, 'Admin User');

    const regularEmail = uniqueEmail();
    await createVerifiedUser(page, regularEmail, password, 'Regular User');

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
    await createAdminUser(page, adminEmail, 'SecurePass123!', 'Admin');

    const regularEmail = uniqueEmail();
    const password = 'SecurePass123!';
    await createVerifiedUser(page, regularEmail, password, 'Regular');
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

test.describe('Admin Member Profiles', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:5101/api/test/reset');
    await request.post('http://localhost:5101/api/test/create-user', {
      data: { email: 'admin@test.de', displayName: 'Admin Test', password: 'admin1234', role: 'admin' },
    });
    await request.post('http://localhost:5101/api/test/create-user', {
      data: { email: 'member@test.de', displayName: 'Member Test', password: 'member1234' },
    });
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('admin@test.de');
    await page.getByLabel('Passwort').fill('admin1234');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await page.waitForURL('/');
    await page.goto('/admin');
  });

  test('can search users', async ({ page }) => {
    await page.getByTestId('search-users').fill('member');
    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('member@test.de');
  });

  test('can view member profile', async ({ page }) => {
    const viewButtons = page.locator('[data-testid^="view-profile-"]');
    await viewButtons.nth(1).click();
    await expect(page.getByTestId('member-profile-panel')).toBeVisible();
  });
});
