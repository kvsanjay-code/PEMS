import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

const BULK_SPEC = /bulk-users\.spec\.ts/;

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  // Users run in parallel only when asked; start low so the sign-in service is not flooded.
  workers: Number(process.env.WORKERS ?? 1),
  reporter: [['list'], ['html', { open: 'never' }], ['./reporters/failed-users-reporter.ts']],
  use: {
    // Only the host comes from the environment; page objects own their paths.
    baseURL: process.env.BASE_URL ? new URL(process.env.BASE_URL).origin : undefined,
    // Headed by default; set HEADLESS=1 for CI runs.
    headless: process.env.HEADLESS === '1',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'chromium', testIgnore: BULK_SPEC, use: { ...devices['Desktop Chrome'] } },
    {
      // One test per user in the user list; headless unless HEADED=1.
      name: 'bulk',
      testMatch: BULK_SPEC,
      fullyParallel: true,
      // One retry by default so a passing glitch in the sign-in service does not list a user as failed.
      retries: Number(process.env.BULK_RETRIES ?? 1),
      use: { ...devices['Desktop Chrome'], headless: process.env.HEADED !== '1' },
    },
  ],
});
