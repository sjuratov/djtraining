import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function loginUser(page: Page, email: string, password: string) {
  await page.request.post('/api/auth/login', { data: { email, password } });
}

async function createVerifiedUser(page: Page, email: string, password: string, displayName = 'Test User') {
  await page.request.post('http://localhost:5001/api/test/create-user', {
    data: { email, password, displayName },
  });
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
    await createVerifiedUser(page, email, password, displayName);
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
    await createVerifiedUser(page, email, password);
    await loginUser(page, email, password);

    await page.goto('/profile');
    await page.getByRole('button', { name: /Abmelden/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Profile Form', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:5001/api/test/reset');
    await request.post('http://localhost:5001/api/test/create-user', {
      data: { email: 'profil@test.de', displayName: 'Test Profil', password: 'test1234' },
    });
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('profil@test.de');
    await page.getByLabel('Passwort').fill('test1234');
    await page.getByRole('button', { name: 'Anmelden' }).click();
    await page.waitForURL('/');
    await page.goto('/profile');
  });

  test('shows profile form with tabs', async ({ page }) => {
    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('tab-personal')).toBeVisible();
    await expect(page.getByTestId('tab-fitness')).toBeVisible();
    await expect(page.getByTestId('tab-membership')).toBeVisible();
  });

  test('can fill and save personal data', async ({ page }) => {
    await page.getByTestId('tab-personal').click();
    await page.getByTestId('field-firstName').fill('Anna');
    await page.getByTestId('field-lastName').fill('Müller');
    await page.getByTestId('field-phone').fill('+41 79 123 4567');
    await page.getByTestId('save-profile').click();
    await expect(page.getByTestId('save-success')).toBeVisible();
  });

  test('can fill fitness profile', async ({ page }) => {
    await page.getByTestId('tab-fitness').click();
    await page.getByTestId('field-trainingGoal').selectOption('muskelaufbau');
    await page.getByTestId('field-experienceLevel').selectOption('anfänger');
    await page.getByTestId('field-healthNotes').fill('Keine Einschränkungen');
    await page.getByTestId('save-profile').click();
    await expect(page.getByTestId('save-success')).toBeVisible();
  });

  test('can fill membership details', async ({ page }) => {
    await page.getByTestId('tab-membership').click();
    await page.getByTestId('field-trainingType').selectOption('personal');
    await page.getByTestId('field-sessionsPerWeek').fill('3');
    await page.getByTestId('field-preferredTimes-morgens').check();
    await page.getByTestId('field-preferredTimes-abends').check();
    await page.getByTestId('save-profile').click();
    await expect(page.getByTestId('save-success')).toBeVisible();
  });

  test('profile data persists after page reload', async ({ page }) => {
    await page.getByTestId('tab-personal').click();
    await page.getByTestId('field-firstName').fill('Maria');
    await page.getByTestId('save-profile').click();
    await expect(page.getByTestId('save-success')).toBeVisible();

    await page.reload();
    await page.getByTestId('tab-personal').click();
    await expect(page.getByTestId('field-firstName')).toHaveValue('Maria');
  });
});
