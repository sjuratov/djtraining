import { test, expect } from '@playwright/test';

test.describe('Services Overview (Angebot)', () => {
  test('should display heading and intro', async ({ page }) => {
    await page.goto('/angebot');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mein Angebot');
    await expect(page.getByText(/passende Angebot für deine Ziele/)).toBeVisible();
  });

  test('should display three service cards with links', async ({ page }) => {
    await page.goto('/angebot');
    await expect(page.locator('a[href="/personal-training"]')).toBeVisible();
    await expect(page.locator('a[href="/gruppentraining"]')).toBeVisible();
    await expect(page.locator('a[href="/ernaehrungscoaching"]')).toBeVisible();
  });

  test('should have proper page title', async ({ page }) => {
    await page.goto('/angebot');
    const title = await page.title();
    expect(title).toContain('Angebot');
  });
});

test.describe('Personal Training Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/personal-training');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Personal Training');
  });

  test('should display three sub-services', async ({ page }) => {
    await expect(page.locator('main').getByText('Individuelles Training').first()).toBeVisible();
    await expect(page.getByText('HIIT Training')).toBeVisible();
    await expect(page.getByText('Vibrationstraining')).toBeVisible();
  });

  test('should display Individuelles Training pricing', async ({ page }) => {
    await expect(page.getByText('100 CHF')).toBeVisible();
    await expect(page.getByText("1\u2019900 CHF")).toBeVisible();
    await expect(page.getByText("3\u2019600 CHF")).toBeVisible();
  });

  test('should display HIIT Training pricing', async ({ page }) => {
    await expect(page.getByText('50 CHF')).toBeVisible();
    await expect(page.getByText('960 CHF')).toBeVisible();
    await expect(page.getByText("1\u2019800 CHF")).toBeVisible();
  });

  test('should display Vibrationstraining pricing', async ({ page }) => {
    await expect(page.getByText('80 CHF')).toBeVisible();
    await expect(page.getByText("1\u2019440 CHF")).toBeVisible();
    await expect(page.getByText("2\u2019560 CHF")).toBeVisible();
  });

  test('should mention pair training', async ({ page }) => {
    await expect(page.getByText(/Paartraining/)).toBeVisible();
  });

  test('should display training hours', async ({ page }) => {
    await expect(page.getByText(/9:00–12:00/)).toBeVisible();
    await expect(page.getByText(/16:00–21:00/)).toBeVisible();
  });

  test('should have CTA to contact page', async ({ page }) => {
    const cta = page.locator('a[href="/kontakt"]');
    await expect(cta.first()).toBeVisible();
  });
});

test.describe('Gruppentraining Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/gruppentraining');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Gruppentraining');
  });

  test('should display group details', async ({ page }) => {
    await expect(page.locator('main').getByText(/5 Personen/).first()).toBeVisible();
    await expect(page.getByText(/60 Minuten/)).toBeVisible();
  });

  test('should display schedule', async ({ page }) => {
    await expect(page.locator('main').getByText('Montag').first()).toBeVisible();
    await expect(page.locator('main').getByText('Donnerstag').first()).toBeVisible();
    await expect(page.locator('main').getByText('18:00').first()).toBeVisible();
    await expect(page.locator('main').getByText('19:15').first()).toBeVisible();
  });

  test('should display pricing', async ({ page }) => {
    await expect(page.getByText('25 CHF')).toBeVisible();
    await expect(page.getByText('460 CHF')).toBeVisible();
    await expect(page.getByText('800 CHF')).toBeVisible();
  });

  test('should highlight free trial', async ({ page }) => {
    await expect(page.getByText(/Kostenloses Probetraining/)).toBeVisible();
  });

  test('should have CTA to contact page', async ({ page }) => {
    const cta = page.locator('a[href="/kontakt"]');
    await expect(cta.first()).toBeVisible();
  });
});

test.describe('Ernährungscoaching Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ernaehrungscoaching');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ernährungscoaching');
  });

  test('should highlight free initial consultation', async ({ page }) => {
    await expect(page.locator('main').getByText(/kostenlos/).first()).toBeVisible();
    await expect(page.locator('main').getByText(/Erstgespräch/).first()).toBeVisible();
  });

  test('should display pricing', async ({ page }) => {
    await expect(page.getByText('100 CHF')).toBeVisible();
    await expect(page.getByText('450 CHF')).toBeVisible();
    await expect(page.getByText('900 CHF')).toBeVisible();
  });

  test('should have CTA for initial consultation', async ({ page }) => {
    const cta = page.locator('a[href="/kontakt"]');
    await expect(cta.first()).toBeVisible();
  });
});
