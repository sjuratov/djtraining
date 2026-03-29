import { test, expect } from '@playwright/test';

test.describe('Contact Page (Kontakt)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/kontakt');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kontakt');
  });

  test('should display address', async ({ page }) => {
    const main = page.locator('main');
    await expect(main.getByText('Rösslimattstrasse 2c').first()).toBeVisible();
    await expect(main.getByText('CH-5033 Buchs AG').first()).toBeVisible();
  });

  test('should display clickable phone number', async ({ page }) => {
    const phoneLink = page.locator('main a[href="tel:+41786112479"]').first();
    await expect(phoneLink).toBeVisible();
  });

  test('should display clickable email', async ({ page }) => {
    const emailLink = page.locator('main a[href="mailto:info@dj-training.com"]').first();
    await expect(emailLink).toBeVisible();
  });

  test('should display free trial CTA', async ({ page }) => {
    await expect(page.getByText(/Kostenloses Probetraining/)).toBeVisible();
  });

  test('should display contact form with all fields', async ({ page }) => {
    await expect(page.getByLabel(/Name/)).toBeVisible();
    await expect(page.getByLabel(/E-Mail/)).toBeVisible();
    await expect(page.getByLabel(/Telefon/)).toBeVisible();
    await expect(page.getByLabel(/Nachricht/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Nachricht senden/ })).toBeVisible();
  });

  test('should show validation errors on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /Nachricht senden/ }).click();
    // HTML5 validation should prevent submission
    const nameInput = page.getByLabel(/Name/);
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should display map placeholder', async ({ page }) => {
    await expect(page.getByText(/Karte|Standort|Map/i)).toBeVisible();
  });

  test('should have proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Kontakt');
  });
});
