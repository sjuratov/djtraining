import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
}

async function registerUser(page: Page, email: string, password: string, displayName = 'Test User') {
  await page.request.post('/api/auth/register', { data: { email, password, displayName } });
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

test.describe('Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display Google OAuth button', async ({ page }) => {
    await expect(page.getByText('Mit Google registrieren').or(page.getByText('Mit Google anmelden'))).toBeVisible();
  });

  test('should register a new user and redirect to login with success message', async ({ page }) => {
    await page.getByLabel('Dein Name').fill('Max Mustermann');
    await page.getByLabel('E-Mail').fill(uniqueEmail());
    await page.getByLabel('Passwort', { exact: true }).fill('SecurePass123!');
    await page.getByLabel('Passwort bestätigen').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Registrieren' }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/Bitte bestätige deine E-Mail-Adresse/i)).toBeVisible();
  });

  test('should show error when registering with duplicate email', async ({ page }) => {
    const email = uniqueEmail();
    await registerUser(page, email, 'SecurePass123!');

    await page.getByLabel('Dein Name').fill('Another User');
    await page.getByLabel('E-Mail').fill(email);
    await page.getByLabel('Passwort', { exact: true }).fill('SecurePass123!');
    await page.getByLabel('Passwort bestätigen').fill('SecurePass123!');
    await page.getByRole('button', { name: 'Registrieren' }).click();

    await expect(page.getByText(/bereits registriert/i)).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.getByLabel('Dein Name').fill('Test User');
    await page.getByLabel('E-Mail').fill(uniqueEmail());
    await page.getByLabel('Passwort', { exact: true }).fill('short');
    await page.getByLabel('Passwort bestätigen').fill('short');
    await page.getByRole('button', { name: 'Registrieren' }).click();

    await expect(page.getByText(/mindestens 8 Zeichen/i)).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await page.getByLabel('Dein Name').fill('Test User');
    await page.getByLabel('E-Mail').fill(uniqueEmail());
    await page.getByLabel('Passwort', { exact: true }).fill('SecurePass123!');
    await page.getByLabel('Passwort bestätigen').fill('DifferentPass456!');
    await page.getByRole('button', { name: 'Registrieren' }).click();

    await expect(page.getByText(/stimmen nicht überein/i)).toBeVisible();
  });

  test('should have a link to login page', async ({ page }) => {
    const loginLink = page.locator('main').getByRole('link', { name: /Anmelden/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display Google OAuth button', async ({ page }) => {
    await expect(page.getByText('Mit Google anmelden')).toBeVisible();
  });

  test('should login with valid credentials and redirect to home', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    await createVerifiedUser(page, email, password);

    await page.getByLabel('E-Mail').fill(email);
    await page.getByLabel('Passwort').fill(password);
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page).toHaveURL('/');
  });

  test('should show error for wrong password', async ({ page }) => {
    const email = uniqueEmail();
    await createVerifiedUser(page, email, 'SecurePass123!');

    await page.getByLabel('E-Mail').fill(email);
    await page.getByLabel('Passwort').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page.getByText(/Ungültige Anmeldedaten/i)).toBeVisible();
  });

  test('should show error for non-existent user', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('nobody@test.com');
    await page.getByLabel('Passwort').fill('SomePassword123!');
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page.getByText(/Ungültige Anmeldedaten/i)).toBeVisible();
  });

  test('should have a link to register page', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /registrieren/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show success message when redirected after registration', async ({ page }) => {
    await page.goto('/login?registered=true');
    await expect(page.getByText(/Bitte bestätige deine E-Mail-Adresse/i)).toBeVisible();
  });

  test('should block login until email is verified', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    await registerUser(page, email, password);

    await page.getByLabel('E-Mail').fill(email);
    await page.getByLabel('Passwort').fill(password);
    await page.getByRole('button', { name: 'Anmelden' }).click();

    await expect(page.getByText(/Bitte bestätige zuerst deine E-Mail-Adresse/i)).toBeVisible();
  });
});

test.describe('Logout', () => {
  test('should keep logout inside the user menu dropdown', async ({ page }) => {
    // Validates: specs/frd-auth.md, Logout AC + Navigation Integration AC
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    await createVerifiedUser(page, email, password);
    await loginUser(page, email, password);

    const userMenuButton = page.getByTestId('user-menu-button');
    const logoutAction = page.getByRole('button', { name: /^Abmelden$/ });
    await expect(userMenuButton).toContainText('Test User');
    await expect(userMenuButton).not.toContainText('Abmelden');
    await expect(logoutAction).toHaveCount(0);

    await userMenuButton.click();
    await expect(logoutAction).toHaveCount(1);
  });

  test('should logout and redirect to login', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    await createVerifiedUser(page, email, password);
    await loginUser(page, email, password);

    await page.goto('/profile');
    await page.getByTestId('user-menu-button').click();
    await page.getByRole('button', { name: /Abmelden/i }).click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when visiting profile after logout', async ({ page }) => {
    const email = uniqueEmail();
    const password = 'SecurePass123!';
    await createVerifiedUser(page, email, password);
    await loginUser(page, email, password);

    await page.goto('/profile');
    await page.getByTestId('user-menu-button').click();
    await page.getByRole('button', { name: /Abmelden/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });
});
