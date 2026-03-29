import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display hero section with tagline and CTA', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Gesundheit, Fitness & Wohlbefinden');
    await expect(page.getByRole('link', { name: /Kostenloses Probetraining/i })).toBeVisible();
  });

  test('should display about teaser section', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('main').getByText(/Diana Juratovic/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Mehr erfahren/i }).first()).toBeVisible();
  });

  test('should display three service cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Personal Training')).toBeVisible();
    await expect(page.getByText('Gruppentraining')).toBeVisible();
    await expect(page.getByText('Ernährungscoaching')).toBeVisible();
  });

  test('service cards should link to their detail pages', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('a[href="/personal-training"]')).toBeVisible();
    await expect(page.locator('a[href="/gruppentraining"]')).toBeVisible();
    await expect(page.locator('a[href="/ernaehrungscoaching"]')).toBeVisible();
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toContain("DJ's Training");

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description).toMatch(/Fitness|Gesundheit/i);
  });
});
