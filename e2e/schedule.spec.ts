import { test, expect } from '@playwright/test';

test.describe('Training Schedule (Trainingszeiten)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trainingszeiten');
  });

  test('should display page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Trainingszeiten');
  });

  test('should display Personal Training schedule', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Personal Training/ }).first()).toBeVisible();
    await expect(page.getByText('9:00–12:00').first()).toBeVisible();
    await expect(page.getByText('16:00–21:00').first()).toBeVisible();
  });

  test('should show weekdays for Personal Training', async ({ page }) => {
    await expect(page.getByText('Montag').first()).toBeVisible();
    await expect(page.getByText('Dienstag').first()).toBeVisible();
    await expect(page.getByText('Mittwoch').first()).toBeVisible();
    await expect(page.getByText('Donnerstag').first()).toBeVisible();
    await expect(page.getByText('Freitag').first()).toBeVisible();
  });

  test('should display Gruppentraining schedule', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Gruppentraining/ }).first()).toBeVisible();
    await expect(page.getByText('18:00').first()).toBeVisible();
    await expect(page.getByText('19:15').first()).toBeVisible();
  });

  test('should show weekends as closed', async ({ page }) => {
    await expect(page.getByText('Samstag')).toBeVisible();
    await expect(page.getByText('Sonntag')).toBeVisible();
    const closedTexts = page.getByText('Geschlossen');
    await expect(closedTexts.first()).toBeVisible();
  });

  test('should have CTA to contact page', async ({ page }) => {
    const cta = page.getByRole('link', { name: /Kontakt aufnehmen/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '/kontakt');
  });

  test('should have proper page title', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('Trainingszeiten');
  });
});
