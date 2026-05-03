import { test, expect } from '@playwright/test';

test.describe('Election Timeline', () => {
  test('All 7 phases visible on timeline page', async ({ page }) => {
    await page.goto('/timeline');

    await expect(page).toHaveTitle(/Election Timeline/);

    // Check all 7 phase labels are present
    const phases = [
      'Voter Registration',
      'Nomination Filing',
      'Campaign Period',
      'Model Code of Conduct',
      'Polling Day',
      'Vote Counting',
      'Results',
    ];

    for (const phase of phases) {
      await expect(page.getByText(phase).first()).toBeVisible();
    }
  });

  test('Clicking Phase 3 opens detail panel', async ({ page }) => {
    await page.goto('/timeline');

    // On desktop, find the Campaign Period button
    const campaignBtn = page.getByRole('button', { name: /phase 3.*campaign/i }).first();
    await campaignBtn.click();

    // Detail panel should appear
    await expect(page.getByText(/Political rallies/i)).toBeVisible({ timeout: 3000 });
  });

  test('Detail panel closes when clicking again', async ({ page }) => {
    await page.goto('/timeline');

    const campaignBtn = page.getByRole('button', { name: /phase 3.*campaign/i }).first();
    await campaignBtn.click();

    // Panel opens
    await expect(page.getByText(/Political rallies/i)).toBeVisible({ timeout: 3000 });

    // Close button
    await page.getByRole('button', { name: /close phase detail/i }).click();
    await expect(page.getByText(/Political rallies/i)).not.toBeVisible({ timeout: 2000 });
  });

  test('Mobile layout — vertical timeline visible at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/timeline');

    // On mobile, phases shown as vertical list buttons
    const firstPhase = page.getByRole('button', { name: /phase 1.*voter registration/i }).first();
    await expect(firstPhase).toBeVisible();
  });
});
