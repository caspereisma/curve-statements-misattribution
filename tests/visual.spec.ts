import { test, expect, type Page } from '@playwright/test';

/**
 * Visual regression suite for the data-matching wireframe.
 *
 * Captures three states across three viewports — 27 snapshots total. Run with
 *   pnpm test:visual            # compare against the baseline
 *   pnpm test:visual:update     # rewrite the baseline (commit the diff)
 */

const VIEWPORTS = {
  desktop: { width: 1440, height: 1024 },
  tablet:  { width: 768,  height: 1024 },
  mobile:  { width: 375,  height: 812 },
};

const PAGE = '/data-matching.html';

// Wait for the dataset to render and fonts to load. The body class lands once
// rows are drawn; the document.fonts check ensures Nunito Sans is in place
// before we screenshot.
async function gotoReady(page: Page) {
  await page.goto(PAGE);
  await page.waitForSelector('.dm-master tbody tr[data-idx]');
  await page.evaluate(() => document.fonts.ready);
}

for (const [vp, size] of Object.entries(VIEWPORTS)) {
  test.describe(`viewport ${vp} (${size.width}x${size.height})`, () => {
    test.use({ viewport: size });

    test('all tab — default', async ({ page }) => {
      await gotoReady(page);
      await expect(page).toHaveScreenshot(`all-tab-default-${vp}.png`, { fullPage: true });
    });

    test('all tab — focus panel open', async ({ page }) => {
      await gotoReady(page);
      await page.locator('.dm-master tbody tr[data-idx]').first().click();
      await page.waitForSelector('.focus-cards');
      await expect(page).toHaveScreenshot(`all-tab-focus-open-${vp}.png`, { fullPage: true });
    });

    test('unprocessed tab', async ({ page }) => {
      await gotoReady(page);
      await page.locator('[data-tab="Unmapped"]').click();
      await page.waitForSelector('#unprocessed-rows tr[data-unp-idx]');
      await expect(page).toHaveScreenshot(`unprocessed-tab-${vp}.png`, { fullPage: true });
    });

    test('track aliases tab', async ({ page }) => {
      await gotoReady(page);
      await page.locator('[data-tab="TrackAliases"]').click();
      await page.waitForSelector('#alias-rows tr');
      await expect(page).toHaveScreenshot(`track-aliases-tab-${vp}.png`, { fullPage: true });
    });
  });
}
