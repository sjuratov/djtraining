import { test, expect } from '@playwright/test';

test.describe('Impressum Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/impressum');
  });

  test('should display heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Impressum');
  });

  test('should display business information', async ({ page }) => {
    await expect(page.getByText("DJ\u2019s Training-Fitness Studio Juratovic")).toBeVisible();
    await expect(page.getByText('Diana Juratovic')).toBeVisible();
    await expect(page.getByText('Rösslimattstrasse 2c')).toBeVisible();
    await expect(page.getByText('CH-5033 Buchs AG')).toBeVisible();
  });

  test('should display commercial register number', async ({ page }) => {
    await expect(page.getByText('CH-400.1.035.771-0')).toBeVisible();
  });

  test('should display clickable phone and email', async ({ page }) => {
    await expect(page.locator('a[href="tel:+41786112479"]')).toBeVisible();
    await expect(page.locator('a[href="mailto:info@dj-training.com"]')).toBeVisible();
  });
});

test.describe('AGB Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/agb');
  });

  test('should display heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Allgemeine Geschäftsbedingungen');
  });

  test('should display cancellation policy', async ({ page }) => {
    await expect(page.getByText(/24 Stunden/)).toBeVisible();
  });

  test('should display health questionnaire requirement', async ({ page }) => {
    await expect(page.getByText(/Gesundheitsfragebogen/)).toBeVisible();
  });

  test('should display clean shoes requirement', async ({ page }) => {
    await expect(page.getByText(/saubere Hallenschuhe/)).toBeVisible();
  });

  test('should have numbered sections', async ({ page }) => {
    await expect(page.getByText('1. Geltungsbereich')).toBeVisible();
    await expect(page.getByText('10. Gerichtsstand')).toBeVisible();
  });
});

test.describe('Datenschutz Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/datenschutz');
  });

  test('should display heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Datenschutzerklärung');
  });

  test('should reference Swiss DSG', async ({ page }) => {
    await expect(page.getByText(/Datenschutz \(DSG\)/)).toBeVisible();
  });

  test('should describe data collection', async ({ page }) => {
    await expect(page.getByText(/Erhobene Daten/)).toBeVisible();
  });

  test('should include cookie policy', async ({ page }) => {
    await expect(page.getByText(/Cookies/)).toBeVisible();
  });

  test('should describe user rights', async ({ page }) => {
    await expect(page.getByText('Recht auf Auskunft')).toBeVisible();
    await expect(page.getByText('Recht auf Berichtigung')).toBeVisible();
    await expect(page.getByText('Recht auf Löschung')).toBeVisible();
  });

  test('should provide contact for data requests', async ({ page }) => {
    await expect(page.getByText('info@dj-training.com')).toBeVisible();
  });
});
