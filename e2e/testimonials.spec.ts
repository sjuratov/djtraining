import { test, expect } from '@playwright/test';

test.describe('Testimonials (Kundenstimmen)', () => {
  test('should display page heading and intro text', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Kundenstimmen');
    await expect(page.getByText(/Kundinnen und Kunden/i)).toBeVisible();
  });

  test('should display all 18 testimonial cards', async ({ page }) => {
    await page.goto('/kundenstimmen');

    const cards = page.locator('article');
    await expect(cards).toHaveCount(18);
  });

  test('should display real client names in testimonials', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByText('Monika Huber')).toBeVisible();
    await expect(page.getByText('Andrea Gut')).toBeVisible();
    await expect(page.getByText('Sabine Do-Thuong')).toBeVisible();
    await expect(page.getByText('Regina Lanner')).toBeVisible();
    await expect(page.getByText('Paula Cruz')).toBeVisible();
  });

  test('should display testimonial text in German', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await expect(page.getByText(/kompetente Trainerin/i).first()).toBeVisible();
    await expect(page.getByText(/Gruppentraining/i).first()).toBeVisible();
  });

  test('should show "Mehr lesen" for long reviews', async ({ page }) => {
    await page.goto('/kundenstimmen');

    const mehrLesen = page.getByText('Mehr lesen');
    const count = await mehrLesen.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open modal when clicking "Mehr lesen"', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await page.getByText('Mehr lesen').first().click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('button', { name: /schliessen|×/i })).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/kundenstimmen');

    await page.getByText('Mehr lesen').first().click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: /schliessen|×/i }).click();
    await expect(modal).not.toBeVisible();
  });

  test('should not show "Mehr lesen" for short reviews', async ({ page }) => {
    await page.goto('/kundenstimmen');

    // Myophysio has a very short review — its card should NOT have "Mehr lesen"
    const myophysioCard = page.locator('article', { hasText: 'Myophysio' });
    await expect(myophysioCard.getByText('Mehr lesen')).not.toBeVisible();
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
