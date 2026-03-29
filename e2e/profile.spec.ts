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

test.describe('Profile Page', () => {
  test('should display name, email, role badge, and member since date', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    const displayName = 'Max Mustermann';
    await registerUser(page, email, password, displayName);
    await loginUser(page, email, password);

    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'Mein Profil' })).toBeVisible();
    await expect(page.locator('main').getByText(displayName)).toBeVisible();
    await expect(page.locator('main').getByText(email)).toBeVisible();
    await expect(page.locator('[data-testid="role-badge"]')).toBeVisible();
    await expect(page.getByText(/Mitglied seit/i)).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should logout from profile page', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    await registerUser(page, email, password);
    await loginUser(page, email, password);

    await page.goto('/profile');
    await page.getByRole('button', { name: /Abmelden/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});
