import { Given, Then } from '@cucumber/cucumber';
import assert from 'assert';
import { CustomWorld } from '../support/world';

Given('I am on the testimonials page', async function (this: CustomWorld) {
  await this.page.goto(`${this.webBaseUrl}/kundenstimmen`);
});

Then('I should see intro text about client experiences', async function (this: CustomWorld) {
  const intro = this.page.getByText(/Kundinnen und Kunden sind meine beste Empfehlung/i);
  await intro.waitFor({ timeout: 5000 });
  assert.ok(await intro.isVisible(), 'Expected testimonials intro text to be visible');
});

Then('I should see exactly {int} testimonial cards', async function (this: CustomWorld, expectedCount: number) {
  const cards = this.page.locator('article');
  await cards.first().waitFor({ timeout: 5000 });
  assert.strictEqual(await cards.count(), expectedCount, `Expected ${expectedCount} testimonial cards`);
});

Then('I should see testimonial from {string}', async function (this: CustomWorld, name: string) {
  const locator = this.page.locator('article').filter({ hasText: name }).first();
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected to see testimonial from "${name}"`);
});

Then('testimonials should be displayed in a responsive grid', async function (this: CustomWorld) {
  const grid = this.page.getByTestId('testimonials-grid');
  await grid.waitFor({ timeout: 5000 });
  assert.ok(await grid.isVisible(), 'Expected testimonials grid to be visible');
});

Then('the grid should show {int} column on mobile', async function (this: CustomWorld, expectedColumns: number) {
  const grid = this.page.getByTestId('testimonials-grid');
  const className = await grid.getAttribute('class');
  assert.ok(className?.includes(`grid-cols-${expectedColumns}`), `Expected mobile grid-cols-${expectedColumns} but got "${className}"`);
});

Then('the grid should show {int} columns on tablet', async function (this: CustomWorld, expectedColumns: number) {
  const grid = this.page.getByTestId('testimonials-grid');
  const className = await grid.getAttribute('class');
  assert.ok(className?.includes(`md:grid-cols-${expectedColumns}`), `Expected tablet md:grid-cols-${expectedColumns} but got "${className}"`);
});

Then('the grid should show {int} columns on desktop', async function (this: CustomWorld, expectedColumns: number) {
  const grid = this.page.getByTestId('testimonials-grid');
  const className = await grid.getAttribute('class');
  assert.ok(className?.includes(`lg:grid-cols-${expectedColumns}`), `Expected desktop lg:grid-cols-${expectedColumns} but got "${className}"`);
});

Then('I should see a feedback CTA section with heading {string}', async function (this: CustomWorld, heading: string) {
  const locator = this.page.getByRole('heading', { level: 2, name: heading });
  await locator.waitFor({ timeout: 5000 });
  assert.ok(await locator.isVisible(), `Expected feedback CTA heading "${heading}"`);
});

Then('the page title should contain {string}', async function (this: CustomWorld, text: string) {
  const title = await this.page.title();
  assert.ok(title.includes(text), `Expected page title to contain "${text}" but got "${title}"`);
});

Then('the meta description should mention {string}', async function (this: CustomWorld, text: string) {
  const description = await this.page.getAttribute('meta[name="description"]', 'content');
  assert.ok(description, 'Expected meta description content');
  assert.ok(description.includes(text), `Expected meta description to contain "${text}" but got "${description}"`);
});
