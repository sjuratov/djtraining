import { test, expect } from '@playwright/test';

test.describe('Testimonials (Kundenstimmen)', () => {
  test('should display page heading and intro text', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kundenstimmen');
    await expect(page.getByText(/Kundinnen und Kunden/i)).toBeVisible();
  });

  test('should display all 17 testimonial cards', async ({ page }) => {
    await page.goto('/kundenstimmen');

    const cards = page.locator('article');
    await expect(cards).toHaveCount(17);
  });

  test('should display client names in testimonials', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByText('Sandra M.')).toBeVisible();
    await expect(page.getByText('Thomas K.')).toBeVisible();
    await expect(page.getByText('Claudia B.')).toBeVisible();
    await expect(page.getByText('Andreas H.')).toBeVisible();
    await expect(page.getByText('Franziska E.')).toBeVisible();
  });

  test('should display testimonial text in German', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByText(/fantastische Trainerin/i)).toBeVisible();
    await expect(page.getByText(/Gruppentraining/i).first()).toBeVisible();
  });

  test('should use responsive grid layout', async ({ page }) => {
    await page.goto('/kundenstimmen');

    const grid = page.locator('[data-testid="testimonials-grid"]');
    await expect(grid).toBeVisible();
    await expect(grid).toHaveClass(/grid/);
    await expect(grid).toHaveClass(/md:grid-cols-2/);
    await expect(grid).toHaveClass(/lg:grid-cols-3/);
  });

  test('should display feedback CTA section', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByRole('heading', { name: /Deine Meinung zählt/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Feedback senden/i })).toBeVisible();
  });

  test('feedback CTA should link to email', async ({ page }) => {
    await page.goto('/kundenstimmen');

    const feedbackLink = page.getByRole('link', { name: /Feedback senden/i });
    await expect(feedbackLink).toHaveAttribute('href', /mailto:info@dj-training\.com/);
  });

  test('should have proper SEO meta tags', async ({ page }) => {
    await page.goto('/kundenstimmen');

    const title = await page.title();
    expect(title).toContain('Kundenstimmen');

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();
    expect(description).toMatch(/Bewertungen/i);
  });
});
