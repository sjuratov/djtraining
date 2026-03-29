import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('header should display brand name', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');

    await expect(header.getByText("DJ's Training")).toBeVisible();
  });

  test('header should display navigation links', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation');

    await expect(nav.getByRole('link', { name: /Home/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Über mich/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Angebot/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Trainingszeiten/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Kundenstimmen/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /Kontakt/i })).toBeVisible();
  });

  test('footer should display business information', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer.getByText("DJ's Training")).toBeVisible();
    await expect(footer.getByText(/Rösslimattstrasse 2c/)).toBeVisible();
    await expect(footer.getByText(/CH-5033 Buchs AG/)).toBeVisible();
  });

  test('footer should display contact information', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer.locator('a[href="tel:+41786112479"]')).toBeVisible();
    await expect(footer.locator('a[href="mailto:info@dj-training.com"]')).toBeVisible();
  });

  test('footer should contain legal links', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');

    await expect(footer.getByRole('link', { name: /Impressum/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /AGB/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Datenschutz/i })).toBeVisible();
  });

  test('navigation link to Über mich should work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: /Über mich/i }).click();
    await expect(page).toHaveURL(/\/ueber-mich/);
  });

  test('navigation link to Kontakt should work', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('navigation').getByRole('link', { name: /Kontakt/i }).click();
    await expect(page).toHaveURL(/\/kontakt/);
  });
});
