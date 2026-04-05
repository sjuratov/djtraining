import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'assert';
import { CustomWorld } from '../support/world';

async function createActiveUser(world: CustomWorld, params: {
  email: string;
  displayName: string;
  password: string;
  role?: 'admin' | 'user';
}) {
  const response = await fetch(`${world.apiBaseUrl}/api/test/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  assert.ok(response.ok, `Expected test user creation to succeed for ${params.email}`);
}

async function loginThroughApi(world: CustomWorld, email: string, password: string) {
  const response = await fetch(`${world.apiBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.ok(response.ok, `Expected login to succeed for ${email}`);
  const setCookies = response.headers.getSetCookie?.() ?? [];
  world.cookies = setCookies;
  for (const cookieStr of setCookies) {
    const [nameValue] = cookieStr.split(';');
    const [name, ...valueParts] = nameValue.split('=');
    await world.context.addCookies([{
      name: name.trim(),
      value: valueParts.join('=').trim(),
      url: world.webBaseUrl,
    }]);
  }
}

Given('I am logged in as admin', async function (this: CustomWorld) {
  const email = 'admin@example.com';
  const password = 'Password123!';
  await createActiveUser(this, {
    email,
    displayName: 'Admin User',
    password,
    role: 'admin',
  });
  await loginThroughApi(this, email, password);
});

Given('I am logged in as a regular user', async function (this: CustomWorld) {
  const email = 'member@example.com';
  const password = 'Password123!';
  await createActiveUser(this, {
    email,
    displayName: 'Regular User',
    password,
    role: 'user',
  });
  await loginThroughApi(this, email, password);
});

Given('I am on the registration page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/register`);
});

Given('I am on the login page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/login`);
});

Given('I am logged in', async function (this: CustomWorld) {
  const email = 'logged-in@example.com';
  const password = 'Password123!';
  await createActiveUser(this, {
    email,
    displayName: 'Logged In User',
    password,
    role: 'user',
  });
  await loginThroughApi(this, email, password);
});

When('I visit the admin page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/admin`);
});

When('I visit the homepage', async function (this: CustomWorld) {
  await this.page.goto(this.webBaseUrl);
});

Then('I should see a table of users', async function (this: CustomWorld) {
  const table = this.page.locator('table').first();
  await table.waitFor({ timeout: 5000 });
  assert.ok(await table.isVisible(), 'Expected users table to be visible');
});

Then('I should see an access denied message', async function (this: CustomWorld) {
  const heading = this.page.getByRole('heading', { name: /zugriff verweigert/i }).first();
  await heading.waitFor({ timeout: 5000 });
  assert.ok(await heading.isVisible(), 'Expected access denied message');
});

Then('I should see a username field', async function (this: CustomWorld) {
  const textInputs = this.page.locator('input[type="text"], input[type="email"]');
  assert.ok(await textInputs.count() >= 1, 'Expected at least one visible registration identity field');
});

Then('I should see a password field', async function (this: CustomWorld) {
  const passwordField = this.page.locator('input[type="password"]').first();
  await passwordField.waitFor({ timeout: 5000 });
  assert.ok(await passwordField.isVisible(), 'Expected password field');
});

Then('I should see a link to registration', async function (this: CustomWorld) {
  const link = this.page.locator('a[href="/register"]').first();
  await link.waitFor({ timeout: 5000 });
  assert.ok(await link.isVisible(), 'Expected registration link');
});

Then('I should see my username in the navigation', async function (this: CustomWorld) {
  const button = this.page.getByTestId('user-menu-button').first();
  await button.waitFor({ timeout: 5000 });
  const text = await button.textContent();
  assert.ok(text?.includes('Logged In User'), `Expected username in navigation but got "${text ?? ''}"`);
});

Then('I should see a {string} option', async function (this: CustomWorld, text: string) {
  const userMenuButton = this.page.getByTestId('user-menu-button').first();
  if (await userMenuButton.count()) {
    const expanded = await userMenuButton.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await userMenuButton.click();
    }
  }

  const button = this.page.locator('header').getByRole('button', { name: new RegExp(text, 'i') }).first();
  await button.waitFor({ timeout: 5000 });
  assert.ok(await button.isVisible(), `Expected option "${text}"`);
});

Then('I should NOT see {string} link', async function (this: CustomWorld, text: string) {
  const count = await this.page.locator('header').getByRole('link', { name: text }).count();
  assert.strictEqual(count, 0, `Expected NOT to see link "${text}"`);
});
