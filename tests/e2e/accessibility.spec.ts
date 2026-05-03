import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/assistant', '/timeline'];

for (const path of PAGES) {
  test(`Accessibility: zero critical violations on ${path}`, async ({ page }) => {
    await page.goto(path);

    // Wait for page to be ready
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('[aria-hidden="true"]')
      .analyze();

    const critical = results.violations.filter(v => v.impact === 'critical');
    const serious = results.violations.filter(v => v.impact === 'serious');

    if (critical.length > 0 || serious.length > 0) {
      console.error('Accessibility violations found on', path);
      [...critical, ...serious].forEach(v => {
        console.error(`[${v.impact}] ${v.id}: ${v.description}`);
        v.nodes.forEach(n => console.error('  Element:', n.html));
      });
    }

    expect(critical).toHaveLength(0);
    expect(serious).toHaveLength(0);
  });
}

test('Skip navigation link is present and functional', async ({ page }) => {
  await page.goto('/');

  // Tab to skip nav
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: /skip to main content/i });
  await expect(skipLink).toBeFocused();
});

test('All interactive elements have accessible labels', async ({ page }) => {
  await page.goto('/assistant');

  // Send button
  const sendBtn = page.getByRole('button', { name: /send message/i });
  await expect(sendBtn).toHaveAttribute('aria-label', /send/i);

  // Language toggle
  const langBtn = page.getByRole('button', { name: /switch to/i });
  await expect(langBtn).toBeVisible();
});

test('Chat log has ARIA live region', async ({ page }) => {
  await page.goto('/assistant');

  const chatLog = page.locator('[role="log"]');
  await expect(chatLog).toHaveAttribute('aria-live', 'polite');
  await expect(chatLog).toHaveAttribute('aria-label', /conversation/i);
});

test('Mobile touch targets are at least 44x44px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/assistant');

  const sendBtn = page.getByRole('button', { name: /send message/i });
  const box = await sendBtn.boundingBox();

  expect(box).toBeTruthy();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});
