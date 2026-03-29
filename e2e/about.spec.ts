import { test, expect } from '@playwright/test';

test.describe('About Page (Über mich)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ueber-mich');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Über mich');
  });

  test('should display biography text', async ({ page }) => {
    await expect(page.getByText(/Kroatien geboren/)).toBeVisible();
    await expect(page.getByText(/2004 in England/)).toBeVisible();
    await expect(page.getByText(/internationale Erfahrung/)).toBeVisible();
    await expect(page.getByText(/privaten Studio in Buchs AG/)).toBeVisible();
  });

  test('should display professional qualifications', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Meine Qualifikationen/ })).toBeVisible();
    await expect(page.getByText('Zertifizierte Personal Trainerin')).toBeVisible();
    await expect(page.getByText('Ernährungscoach')).toBeVisible();
    await expect(page.getByText('Pilates Trainerin')).toBeVisible();
    await expect(page.getByText('HIIT Spezialistin')).toBeVisible();
    await expect(page.getByText('Vibrationstraining')).toBeVisible();
  });

  test('should display studio section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Mein Studio/ })).toBeVisible();
    await expect(page.getByText(/Rösslimattstrasse 2c/)).toBeVisible();
  });

  test('should display photo or placeholder', async ({ page }) => {
    const img = page.locator('[role="img"][aria-label*="Diana Juratovic"]');
    await expect(img).toBeVisible();
  });

  test('should have CTA linking to contact page', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Kontakt aufnehmen/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/kontakt');
  });

  test('should have proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Über mich');
  });
});
