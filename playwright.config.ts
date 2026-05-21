import { defineConfig, devices } from '@playwright/test';

/**
 * Visual regression config for the data-matching wireframe.
 *
 * - `webServer` auto-starts the same Python static server the wireframe
 *   uses for local preview (port 4321, serves wireframes/data-matching/).
 * - Snapshots land in `screenshots/baseline/` next to the test files so
 *   they're visible and reviewable in PRs without diving into the
 *   Playwright defaults.
 */
export default defineConfig({
  testDir: 'tests',
  snapshotDir: 'screenshots/baseline',
  snapshotPathTemplate: '{snapshotDir}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
  expect: {
    // Allow ~1% pixel drift to absorb subpixel anti-aliasing on different
    // OS / GPU combos. Tighten if you want stricter checks.
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 4321 --directory wireframes/data-matching',
    url: 'http://127.0.0.1:4321/data-matching.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
