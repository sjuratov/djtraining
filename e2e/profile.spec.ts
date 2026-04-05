import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill(email);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.waitForURL('/');
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
    await page.getByTestId('user-menu-button').click();
    await page.getByRole('button', { name: /Abmelden/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should render empty profile selects without console errors', async ({ page }) => {
    // Validates: specs/frd-auth.md, Profile Management AC
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          email: 'profil@test.de',
          displayName: 'Test Profil',
          role: 'user',
          authProvider: 'local',
          createdAt: '2026-01-01T00:00:00.000Z',
        }),
      });
    });

    await page.route('**/api/profile', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            firstName: '',
            lastName: '',
            phone: '',
            birthDate: '',
            gender: null,
            trainingGoal: null,
            experienceLevel: null,
            healthNotes: '',
            trainingType: null,
            sessionsPerWeek: '',
            preferredTimes: [],
          }),
        });
        return;
      }

      await route.continue();
    });

    await page.goto('/profile');

    await expect(page.getByTestId('field-gender')).toHaveValue('');
    await page.getByTestId('tab-fitness').click();
    await expect(page.getByTestId('field-trainingGoal')).toHaveValue('');
    await expect(page.getByTestId('field-experienceLevel')).toHaveValue('');
    await page.getByTestId('tab-membership').click();
    await expect(page.getByTestId('field-trainingType')).toHaveValue('');

    expect(
      consoleErrors.some((message) =>
        message.includes('`value` prop on `%s` should not be null'),
      ),
    ).toBe(false);
  });
});

test.describe('Profile Form', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:5101/api/test/reset');
    await request.post('http://localhost:5101/api/test/create-user', {
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

  test('shows a success confirmation after saving personal profile changes', async ({ page }) => {
    // Validates: specs/frd-auth.md, Profile Management AC
    await page.getByTestId('tab-personal').click();
    await page.getByTestId('field-firstName').fill('Anna');
    await page.getByTestId('save-profile').click();
    await expect(page.getByTestId('save-success')).toBeVisible();
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
