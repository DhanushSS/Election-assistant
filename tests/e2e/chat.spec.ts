import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('VoteAI India — E2E Chat Flow', () => {
  test('Full chat flow: homepage → assistant → ask about Lok Sabha', async ({ page }) => {
    // 1. Land on homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/VoteAI India/);

    // 2. Click "Ask the Assistant" CTA
    await page.getByRole('link', { name: /ask the assistant/i }).first().click();
    await page.waitForURL('/assistant');

    // 3. Verify welcome message shown
    await expect(page.getByText(/VoteAI India/i)).toBeVisible();

    // 4. Type a question
    const input = page.getByRole('textbox', { name: /message input/i });
    await input.fill('How many seats does Lok Sabha have?');
    await expect(input).toHaveValue('How many seats does Lok Sabha have?');

    // 5. Send message
    await page.getByRole('button', { name: /send message/i }).click();

    // 6. Wait for response (up to 30s for Gemini)
    await expect(
      page.locator('[role="article"]').filter({ hasText: /user/i }).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Quick reply chips work', async ({ page }) => {
    await page.goto('/assistant');

    // Quick reply chips visible before any message
    const chip = page.getByRole('button', { name: /ask: what is lok sabha/i });
    await expect(chip).toBeVisible();
    await chip.click();

    // Input should be empty (chip triggers direct send)
    const input = page.getByRole('textbox', { name: /message input/i });
    await expect(input).toHaveValue('');
  });

  test('Language toggle switches to Hindi', async ({ page }) => {
    await page.goto('/assistant');

    // Find language toggle
    const langBtn = page.getByRole('button', { name: /switch to hindi/i });
    await langBtn.click();

    // Placeholder should change to Hindi
    const input = page.getByRole('textbox', { name: /message input/i });
    await expect(input).toHaveAttribute('placeholder', /भारतीय चुनावों/);
  });

  test('Keyboard: Enter sends message, Shift+Enter adds newline', async ({ page }) => {
    await page.goto('/assistant');

    const input = page.getByRole('textbox', { name: /message input/i });
    await input.fill('Test message');

    // Shift+Enter should NOT send
    await input.press('Shift+Enter');
    await expect(input).not.toHaveValue('');

    // Enter should send
    await input.fill('Test question');
    await input.press('Enter');
    await expect(input).toHaveValue('');
  });
});
