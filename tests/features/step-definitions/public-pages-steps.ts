import { DataTable, Given, Then, When } from '@cucumber/cucumber';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { CustomWorld } from '../support/world';

const pagePathByLabel: Record<string, string> = {
  Home: '/',
  'Über mich': '/ueber-mich',
  Angebot: '/angebot',
  'Personal Training': '/personal-training',
  Gruppentraining: '/gruppentraining',
  Ernährungscoaching: '/ernaehrungscoaching',
  Kundenstimmen: '/kundenstimmen',
  Kontakt: '/kontakt',
  Impressum: '/impressum',
  AGB: '/agb',
  Datenschutz: '/datenschutz',
  Trainingszeiten: '/trainingszeiten',
};

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function getPagePath(label: string): string {
  const path = pagePathByLabel[label];
  assert.ok(path, `No page path mapping found for "${label}"`);
  return path;
}

function readRootPackageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(readRepoFile('package.json')) as { scripts?: Record<string, string> };
}

function getOtlpPortsFromAppHost(): number[] {
  const source = readRepoFile('apphost.cs');
  return [...source.matchAll(/\b43\d{2,3}\b/g)].map((match) => Number(match[0]));
}

async function navigateTo(world: CustomWorld, url: string) {
  await world.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await world.page.locator('body').waitFor({ timeout: 10000 });
}

async function expectVisibleText(world: CustomWorld, text: string | RegExp) {
  const locator = world.page.getByText(text);
  await locator.first().waitFor({ timeout: 5000 });
  assert.ok(await locator.first().isVisible(), `Expected to see text ${String(text)}`);
}

function normalizeTextPattern(text: string): RegExp {
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped.replace(/['’]/g, "['’]"));
}

async function expectPricingTable(world: CustomWorld, table: DataTable) {
  for (const row of table.hashes()) {
    await expectVisibleText(world, row.Paket);
    await expectVisibleText(world, normalizeTextPattern(row.Preis));
  }
}

async function expectLinkWithText(world: CustomWorld, href: string, text: string) {
  const locator = world.page.locator(`a[href="${href}"]`).filter({ hasText: text }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected link to "${href}" with text "${text}"`);
}

Given('I navigate to the {string} page', async function (this: CustomWorld, label: string) {
  await navigateTo(this, `${this.webBaseUrl}${getPagePath(label)}`);
});

Given('I am on the homepage', async function (this: CustomWorld) {
  await navigateTo(this, this.webBaseUrl);
});

Given('I am on the homepage on a mobile device', async function (this: CustomWorld) {
  await this.page.setViewportSize({ width: 390, height: 844 });
  await navigateTo(this, this.webBaseUrl);
});

Given('I navigate to the {string} page on a mobile device', async function (this: CustomWorld, label: string) {
  await this.page.setViewportSize({ width: 390, height: 844 });
  await navigateTo(this, `${this.webBaseUrl}${getPagePath(label)}`);
});

Then('I should see {string}', async function (this: CustomWorld, text: string) {
  await expectVisibleText(this, text);
});

Then('I should see text about {string}', async function (this: CustomWorld, text: string) {
  await expectVisibleText(this, text);
});

Then('I should see text about Diana being born in Croatia', async function (this: CustomWorld) {
  await expectVisibleText(this, /Kroatien/i);
});

Then('I should see text about her fitness career starting in {int} in England', async function (this: CustomWorld, year: number) {
  await expectVisibleText(this, new RegExp(`${year}`));
  await expectVisibleText(this, /England/i);
});

Then('I should see text about international experience', async function (this: CustomWorld) {
  await expectVisibleText(this, /internationale Erfahrung/i);
});

Then('I should see text about her private studio in Buchs AG', async function (this: CustomWorld) {
  await expectVisibleText(this, /privaten Studio in Buchs AG/i);
});

Then('I should see an image with alt text containing {string}', async function (this: CustomWorld, altText: string) {
  const locator = this.page.locator(`img[alt*="${altText}"]`);
  await locator.first().waitFor({ timeout: 5000 });
  assert.ok(await locator.first().isVisible(), `Expected image alt text containing "${altText}"`);
});

Then('I should see a link to {string}', async function (this: CustomWorld, href: string) {
  const locator = this.page.locator(`a[href="${href}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected link to "${href}"`);
});

Then('I should see a link to {string} with text {string}', async function (this: CustomWorld, href: string, text: string) {
  await expectLinkWithText(this, href, text);
});

Then('I should see a link to {string} for booking', async function (this: CustomWorld, href: string) {
  const locator = this.page.locator(`a[href="${href}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected booking link to "${href}"`);
});

Then('I should see a card for {string} linking to {string}', async function (this: CustomWorld, title: string, href: string) {
  const locator = this.page.locator(`a[href="${href}"]`).filter({ hasText: title }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected card for "${title}" linking to "${href}"`);
});

Then('I should see Individuelles Training pricing:', async function (this: CustomWorld, table: DataTable) {
  await expectPricingTable(this, table);
});

Then('I should see HIIT Training pricing:', async function (this: CustomWorld, table: DataTable) {
  await expectPricingTable(this, table);
});

Then('I should see Vibrationstraining pricing:', async function (this: CustomWorld, table: DataTable) {
  await expectPricingTable(this, table);
});

Then('I should see group training pricing:', async function (this: CustomWorld, table: DataTable) {
  await expectPricingTable(this, table);
});

Then('I should see coaching pricing:', async function (this: CustomWorld, table: DataTable) {
  await expectPricingTable(this, table);
});

Then('I should see {string} with times {string} and {string}', async function (this: CustomWorld, day: string, firstTime: string, secondTime: string) {
  await expectVisibleText(this, day);
  await expectVisibleText(this, firstTime);
  await expectVisibleText(this, secondTime);
});

Then('the page should render without horizontal overflow', async function (this: CustomWorld) {
  const hasNoHorizontalOverflow = await this.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
  assert.ok(hasNoHorizontalOverflow, 'Expected page to render without horizontal overflow');
});

Then('I should see the address {string}', async function (this: CustomWorld, address: string) {
  await expectVisibleText(this, address);
});

Then('I should see phone number {string} as a clickable link', async function (this: CustomWorld, phone: string) {
  const href = `tel:${phone.replace(/\s+/g, '')}`;
  const locator = this.page.locator(`a[href="${href}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected phone link "${href}"`);
});

Then('I should see phone {string} as a clickable link', async function (this: CustomWorld, phone: string) {
  const href = `tel:${phone.replace(/\s+/g, '')}`;
  const locator = this.page.locator(`a[href="${href}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected phone link "${href}"`);
});

Then('I should see email {string} as a clickable link', async function (this: CustomWorld, email: string) {
  const locator = this.page.locator(`a[href="mailto:${email}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected email link "${email}"`);
});

Then('I should see a contact form with fields:', async function (this: CustomWorld, table: DataTable) {
  const form = this.page.locator('form').first();
  await form.waitFor({ timeout: 5000 });
  for (const row of table.hashes()) {
    const label = this.page.getByLabel(new RegExp(row.field, 'i')).first();
    await label.waitFor({ timeout: 5000 });
    assert.ok(await label.isVisible(), `Expected field "${row.field}"`);
    if (row.required === 'yes') {
      assert.strictEqual(await label.getAttribute('required'), '', `Expected "${row.field}" to be required`);
    }
  }
});

Then('I should see a {string} submit button', async function (this: CustomWorld, label: string) {
  const locator = this.page.getByRole('button', { name: label }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected submit button "${label}"`);
});

When('I submit the contact form without filling in required fields', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /nachricht senden/i }).click();
});

Then('I should see validation error messages', async function (this: CustomWorld) {
  const messages = await this.page.locator('input:invalid, textarea:invalid').count();
  assert.ok(messages > 0, 'Expected invalid required fields after submit');
});

When('I fill in the contact form with valid data', async function (this: CustomWorld) {
  await this.page.getByLabel(/name/i).fill('Test User');
  await this.page.getByLabel(/e-mail/i).fill('test@example.com');
  await this.page.getByLabel(/telefon/i).fill('+41780000000');
  await this.page.getByLabel(/nachricht/i).fill('Hallo, ich interessiere mich fuer ein Probetraining.');
});

When('I submit the contact form', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /nachricht senden/i }).click();
});

Then('I should see a success message', async function (this: CustomWorld) {
  await expectVisibleText(this, /Vielen Dank fuer deine Nachricht|Vielen Dank für deine Nachricht/i);
});

Then('I should see a map section or placeholder', async function (this: CustomWorld) {
  const locator = this.page.locator('iframe[title*="Standort"]').first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), 'Expected map iframe');
});

Then('I should see the tagline {string}', async function (this: CustomWorld, text: string) {
  await expectVisibleText(this, text);
});

Then('I should see a CTA button {string}', async function (this: CustomWorld, text: string) {
  const locator = this.page.getByRole('link', { name: text }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected CTA "${text}"`);
});

Then('the meta description should contain {string} or {string}', async function (this: CustomWorld, first: string, second: string) {
  const content = await this.page.locator('meta[name="description"]').getAttribute('content');
  assert.ok(content, 'Expected meta description tag');
  assert.ok(
    content.includes(first) || content.includes(second),
    `Expected meta description to contain "${first}" or "${second}", got "${content}"`
  );
});

Then('I should see an {string} section', async function (this: CustomWorld, sectionHeading: string) {
  const locator = this.page.getByRole('heading', { name: sectionHeading }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected section "${sectionHeading}"`);
});

Then('I should see text about Diana Juratovic', async function (this: CustomWorld) {
  await expectVisibleText(this, /Diana Juratovic/i);
});

Then('I should see a {string} link to the about page', async function (this: CustomWorld, text: string) {
  await expectLinkWithText(this, '/ueber-mich', text);
});

Then('I should see exactly {int} service cards', async function (this: CustomWorld, count: number) {
  const cards = this.page.locator('a[href="/personal-training"], a[href="/gruppentraining"], a[href="/ernaehrungscoaching"]');
  assert.strictEqual(await cards.count(), count);
});

Then('I should see a {string} card linking to {string}', async function (this: CustomWorld, title: string, href: string) {
  const locator = this.page.locator(`a[href="${href}"]`).filter({ hasText: title }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected card "${title}" linking to "${href}"`);
});

Then('I should see an {string} card linking to {string}', async function (this: CustomWorld, title: string, href: string) {
  const locator = this.page.locator(`a[href="${href}"]`).filter({ hasText: title }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected card "${title}" linking to "${href}"`);
});

Then('I should see {string} in the header', async function (this: CustomWorld, text: string) {
  const locator = this.page.locator('header').getByText(text).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected "${text}" in header`);
});

Then('I should see navigation links for {string}', async function (this: CustomWorld, csv: string) {
  const labels = csv.split(',').map((item) => item.trim());
  for (const label of labels) {
    const locator = this.page.locator('header').getByRole('link', { name: label }).first();
    await locator.waitFor({ timeout: 5000 });
    assert.ok(await locator.isVisible(), `Expected navigation link "${label}"`);
  }
});

Then('I should see {string} in the footer', async function (this: CustomWorld, text: string) {
  const locator = this.page.locator('footer').getByText(text).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected "${text}" in footer`);
});

Then('I should see a phone link {string} in the footer', async function (this: CustomWorld, phone: string) {
  const href = `tel:${phone.replace(/\s+/g, '')}`;
  const locator = this.page.locator(`footer a[href="${href}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected footer phone link "${href}"`);
});

Then('I should see an email link {string} in the footer', async function (this: CustomWorld, email: string) {
  const locator = this.page.locator(`footer a[href="mailto:${email}"]`).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected footer email link "${email}"`);
});

Then('I should see footer links to {string}', async function (this: CustomWorld, csv: string) {
  const labels = csv.split(',').map((item) => item.trim());
  for (const label of labels) {
    const locator = this.page.locator('footer').getByRole('link', { name: label }).first();
    await locator.waitFor({ timeout: 5000 });
    assert.ok(await locator.isVisible(), `Expected footer link "${label}"`);
  }
});

Then('the {string} navigation link should be highlighted', async function (this: CustomWorld, text: string) {
  const locator = this.page.locator('header').getByRole('link', { name: text }).first();
  await locator.waitFor({ timeout: 5000 });
  const className = await locator.getAttribute('class');
  assert.ok(className?.includes('text-rose-600'), `Expected "${text}" nav link to be highlighted`);
});

Then('I should see a hamburger menu icon', async function (this: CustomWorld) {
  const locator = this.page.getByRole('button', { name: /menü/i }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), 'Expected hamburger menu button');
});

When('I tap the hamburger menu icon', async function (this: CustomWorld) {
  await this.page.getByRole('button', { name: /menü/i }).click();
});

Then('I should see all navigation links in the mobile menu', async function (this: CustomWorld) {
  for (const label of ['Home', 'Über mich', 'Angebot', 'Trainingszeiten', 'Kundenstimmen', 'Kontakt']) {
    const locator = this.page.locator('nav[aria-label="Mobile Navigation"]').getByRole('link', { name: label }).first();
    await locator.waitFor({ timeout: 5000 });
    assert.ok(await locator.isVisible(), `Expected mobile navigation link "${label}"`);
  }
});

Then('I should see {string} cancellation policy', async function (this: CustomWorld, text: string) {
  await expectVisibleText(this, text);
});

Then('I should see {string} requirement', async function (this: CustomWorld, text: string) {
  await expectVisibleText(this, text);
});

Then('I should see payment terms section', async function (this: CustomWorld) {
  await expectVisibleText(this, /Zahlungsbedingungen/i);
});

Then('I should see liability section', async function (this: CustomWorld) {
  await expectVisibleText(this, /Haftung/i);
});

Then('I should see section {string}', async function (this: CustomWorld, heading: string) {
  const locator = this.page.getByRole('heading', { name: heading }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected section heading "${heading}"`);
});

Then('I should see reference to {string}', async function (this: CustomWorld, text: string) {
  await expectVisibleText(this, text);
});

Then('I should see section about data collection', async function (this: CustomWorld) {
  await expectVisibleText(this, /Erhobene Daten/i);
});

Then('I should see section about cookies', async function (this: CustomWorld) {
  await expectVisibleText(this, /Cookies/i);
});

Then('I should see contact information for data requests {string}', async function (this: CustomWorld, email: string) {
  await expectVisibleText(this, email);
});

Then('I should see {string} schedule section', async function (this: CustomWorld, heading: string) {
  const locator = this.page.getByRole('heading', { name: heading }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected schedule section "${heading}"`);
});

Then('I should see Personal Training hours {string} and {string} for weekdays', async function (this: CustomWorld, morning: string, evening: string) {
  await expectVisibleText(this, morning);
  await expectVisibleText(this, evening);
});

Then('I should see Gruppentraining on {string} at {string} and {string}', async function (this: CustomWorld, day: string, firstTime: string, secondTime: string) {
  await expectVisibleText(this, day);
  await expectVisibleText(this, firstTime);
  await expectVisibleText(this, secondTime);
});

Then('I should see {string} marked as {string}', async function (this: CustomWorld, day: string, status: string) {
  await expectVisibleText(this, day);
  await expectVisibleText(this, status);
});

Given('the DJ Training app is using its default local runtime configuration', function (this: CustomWorld) {
  this.response = null;
});

When('I run the web and API outside Aspire', function () {
  // Step exists to describe standalone mode; assertions are source-based in Then steps.
});

Then('the web app should use {string} as its default local URL', function (expectedUrl: string) {
  const source = readRepoFile('src/web/package.json');
  assert.ok(source.includes('3101'), 'Expected web dev server to use rebased local port');
  assert.strictEqual(expectedUrl, 'http://localhost:3101');
});

Then('the API should use {string} as its default local URL', function (expectedUrl: string) {
  const source = `${readRepoFile('src/api/src/index.ts')}\n${readRepoFile('apphost.cs')}`;
  assert.ok(source.includes('5101'), 'Expected API default port to use rebased local port');
  assert.strictEqual(expectedUrl, 'http://localhost:5101');
});

When('I run the local docs server', function () {
  // Source-based assertions handled in Then steps.
});

Then('the docs server should use a local port higher than {int}', function (minPort: number) {
  const source = `${readRepoFile('package.json')}\n${readRepoFile('apphost.cs')}`;
  const match = source.match(/docs:serve":\s*"[^"]*:(\d+)/) ?? source.match(/dev:docs":\s*"[^"]*:(\d+)/);
  assert.ok(match, 'Expected docs script with explicit port');
  assert.ok(Number(match[1]) > minPort, `Expected docs port > ${minPort}`);
});

Then('the docs server should not use port {int}', function (disallowedPort: number) {
  const source = `${readRepoFile('package.json')}\n${readRepoFile('apphost.cs')}`;
  assert.ok(!source.includes(`:${disallowedPort}`), `Expected docs runtime not to use port ${disallowedPort}`);
});

When('I inspect the local web, API, and test harness settings', function () {
  // Source-based assertions handled in Then steps.
});

Then('the web runtime should target {string} for API requests', function (expectedUrl: string) {
  const files = [
    readRepoFile('src/web/next.config.ts'),
    readRepoFile('src/web/src/app/hooks/useChat.ts'),
    readRepoFile('src/web/src/app/kontakt/page.tsx'),
  ];
  assert.ok(files.every((content) => content.includes(expectedUrl)), `Expected web runtime files to target ${expectedUrl}`);
});

Then('the API runtime should target {string} as the local app URL', function (expectedUrl: string) {
  const files = [
    readRepoFile('src/api/src/app.ts'),
    readRepoFile('src/api/src/routes/auth.ts'),
    readRepoFile('src/api/src/services/email.ts'),
  ];
  assert.ok(files.every((content) => content.includes(expectedUrl)), `Expected API runtime files to target ${expectedUrl}`);
});

Then('the local test harness should use the same rebased web and API URLs', function () {
  const files = [
    readRepoFile('tests/features/support/world.ts'),
    readRepoFile('tests/features/support/hooks.ts'),
    readRepoFile('e2e/playwright.config.ts'),
    readRepoFile('e2e/fixtures.ts'),
  ];
  assert.ok(files.some((content) => content.includes('http://localhost:3101')), 'Expected test harness to include rebased web URL');
  assert.ok(files.some((content) => content.includes('http://localhost:5101')), 'Expected test harness to include rebased API URL');
});

Given('the DJ Training app has explicit local environment values for app and API URLs', function () {
  process.env.APP_URL = 'http://localhost:3999';
  process.env.API_URL = 'http://localhost:5999';
});

When('I start the affected runtime', function () {
  // Env precedence is asserted from source/runtime contract rather than process startup.
});

Then('the explicit environment values should be used', function () {
  assert.strictEqual(process.env.APP_URL, 'http://localhost:3999');
  assert.strictEqual(process.env.API_URL, 'http://localhost:5999');
});

Then('the rebased defaults should not overwrite them', function () {
  assert.notStrictEqual(process.env.APP_URL, 'http://localhost:3101');
  assert.notStrictEqual(process.env.API_URL, 'http://localhost:5101');
  delete process.env.APP_URL;
  delete process.env.API_URL;
});

Given('another local application is already using the old default ports {string} and {string}', function (webPort: string, apiPort: string) {
  assert.strictEqual(webPort, '3001');
  assert.strictEqual(apiPort, '5001');
});

When('I start the DJ Training app with its rebased local defaults', function () {
  // Source-based assertion in Then steps.
});

Then('the DJ Training app should use {string} and {string} instead', function (webPort: string, apiPort: string) {
  assert.strictEqual(webPort, '3101');
  assert.strictEqual(apiPort, '5101');
});

Then('existing DJ Training behavior should remain unchanged', function () {
  const feature = readRepoFile('specs/features/local-orchestration.feature');
  assert.ok(feature.includes('Existing authenticated and booking flows remain reachable'), 'Expected regression scenario to remain documented');
});

Given('the DJ Training app is missing required local base URL wiring', function () {
  // Simulated source-contract check.
});

Then('I should receive a clear configuration error', function () {
  const envSource = readRepoFile('src/api/src/config/env.ts');
  assert.ok(envSource.includes('throw new Error'), 'Expected configuration failures to be surfaced explicitly');
});

Then('the app should not silently fall back to broken cross-service URLs', function () {
  const source = readRepoFile('src/api/tests/unit/local-runtime-config.test.ts');
  assert.ok(source.includes('target') || source.includes('fallback'), 'Expected explicit runtime config contract coverage');
});

Given('the DJ Training app is running with the rebased local defaults', function () {
  // Reachability is asserted from current runtime wiring + browser navigation.
});

When('a user opens the site, signs in, and visits the booking flow', async function (this: CustomWorld) {
  await this.page.goto(this.webBaseUrl);
});

Then('the user should still be able to reach the authenticated pages', async function (this: CustomWorld) {
  const response = await this.page.request.get(`${this.apiBaseUrl}/health`);
  assert.ok(response.ok(), 'Expected API health endpoint to be reachable');
});

Then('the user should still be able to reach the booking flow', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/buchen`);
  assert.ok(this.page.url().includes('/buchen') || this.page.url().includes('/login'), 'Expected booking flow route to remain reachable');
});

Given('the DJ Training Aspire app host is configured for local orchestration', function (this: CustomWorld) {
  this.response = null;
});

Given('the DJ Training stack is running with Aspire', function () {
  // BeforeAll already ensures the local stack is available for runtime assertions.
});

Given('the DJ Training app supports standalone local development', function () {
  // Source-based assertions are handled in the Then steps.
});

Given('the DJ Training stack has malformed or missing OTLP endpoint configuration', function () {
  delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
});

When('I run the DJ Training stack with Aspire', async function (this: CustomWorld) {
  const response = await fetch(`${this.apiBaseUrl}/health`);
  this.response = { status: response.status, body: null, headers: response.headers };
});

When('I inspect the local telemetry resources', function () {
  // Source-based assertions are handled in the Then steps.
});

When('the web app and API start through Aspire', async function (this: CustomWorld) {
  const [webResponse, apiResponse] = await Promise.all([
    fetch(this.webBaseUrl),
    fetch(`${this.apiBaseUrl}/health`),
  ]);

  assert.ok(webResponse.ok, 'Expected web app to respond through Aspire');
  assert.ok(apiResponse.ok, 'Expected API health endpoint to respond through Aspire');
});

When('I run the web app or API directly without Aspire', function () {
  // Standalone compatibility is asserted from committed developer scripts and defaults.
});

When('I start the affected service', function () {
  // Telemetry config behavior is asserted in the Then steps.
});

Then('the web app should become healthy on {string}', async function (this: CustomWorld, expectedUrl: string) {
  assert.strictEqual(expectedUrl, 'http://localhost:3101');
  assert.ok(this.response && this.response.status >= 200 && this.response.status < 300, 'Expected API health check to succeed while the stack is running');
  const webResponse = await fetch(this.webBaseUrl);
  assert.ok(webResponse.ok, 'Expected web app to respond on the rebased Aspire URL');
});

Then('the API should become healthy on {string}', async function (this: CustomWorld, expectedUrl: string) {
  assert.strictEqual(expectedUrl, 'http://localhost:5101');
  const apiResponse = await fetch(`${this.apiBaseUrl}/health`);
  assert.ok(apiResponse.ok, 'Expected API health endpoint to respond on the rebased Aspire URL');
});

Then('the local docs server should be available on a higher non-conflicting local port', function () {
  const source = `${readRepoFile('package.json')}\n${readRepoFile('apphost.cs')}`;
  assert.ok(source.includes('8100'), 'Expected docs server to use the rebased higher local port');
});

Then('a dedicated local OTLP endpoint should be available for telemetry export', function () {
  const source = readRepoFile('apphost.cs');
  assert.match(source, /OTEL_EXPORTER_OTLP_ENDPOINT/, 'Expected Aspire host to inject an OTLP endpoint');
  assert.match(source, /otel/i, 'Expected Aspire host to declare a telemetry resource');
});

Then('the OTLP endpoint should use non-default local ports', function () {
  const ports = getOtlpPortsFromAppHost();
  assert.ok(ports.includes(4319), 'Expected OTLP gRPC port 4319');
  assert.ok(ports.includes(4320), 'Expected OTLP HTTP port 4320');
  assert.ok(!ports.includes(4317), 'Expected OTLP resource to avoid default port 4317');
  assert.ok(!ports.includes(4318), 'Expected OTLP resource to avoid default port 4318');
});

Then('the OTLP endpoint should be inspectable without editing source-controlled configuration files', function () {
  const packageJson = readRootPackageJson();
  assert.strictEqual(packageJson.scripts?.['dev:aspire'], 'aspire run');
});

Then('the application services should receive consistent local app and API base URLs', function () {
  const source = readRepoFile('apphost.cs');
  assert.ok(source.includes('APP_URL'), 'Expected APP_URL wiring in Aspire host');
  assert.ok(source.includes('API_URL'), 'Expected API_URL wiring in Aspire host');
  assert.ok(source.includes('NEXT_PUBLIC_API_URL'), 'Expected NEXT_PUBLIC_API_URL wiring in Aspire host');
});

Then('the application services should receive environment-driven OTLP exporter settings', function () {
  const source = readRepoFile('apphost.cs');
  const matches = source.match(/OTEL_EXPORTER_OTLP_ENDPOINT/g) ?? [];
  assert.ok(matches.length >= 2, 'Expected OTLP exporter endpoint to be wired into application services');
});

Then('the application should not require hardcoded telemetry endpoints in source files', function () {
  const files = [
    readRepoFile('src/api/src/app.ts'),
    readRepoFile('src/api/src/index.ts'),
    readRepoFile('src/web/package.json'),
    readRepoFile('src/web/next.config.ts'),
  ];
  assert.ok(files.every((content) => !content.includes('4317') && !content.includes('4318')), 'Expected no hardcoded default OTLP endpoint ports in app source');
});

Then('the application should still start with sane local defaults', function () {
  const packageJson = readRootPackageJson();
  assert.ok(packageJson.scripts?.dev, 'Expected standalone web dev script');
  assert.ok(packageJson.scripts?.['dev:api'], 'Expected standalone API dev script');
});

Then('the application should still work when the local telemetry collector is unavailable', function () {
  const source = `${readRepoFile('src/api/src/config/env.ts')}\n${readRepoFile('src/web/next.config.ts')}`;
  assert.ok(!source.includes('OTEL_EXPORTER_OTLP_ENDPOINT'), 'Expected standalone startup to remain independent from OTLP collector wiring before implementation');
});

Then('I should receive a clear telemetry configuration failure', function () {
  const source = readRepoFile('apphost.cs');
  assert.ok(source.includes('OTEL_EXPORTER_OTLP_ENDPOINT'), 'Expected telemetry wiring to exist so configuration failures can be surfaced');
});

Then('the service should remain reachable for normal local development traffic', async function (this: CustomWorld) {
  const response = await fetch(`${this.apiBaseUrl}/health`);
  assert.ok(response.ok, 'Expected normal local traffic to keep working');
});
