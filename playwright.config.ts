import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // No retries: each run spends a single-use REX, so a retry would silently consume another one.
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // Only the host comes from the environment; page objects own their paths.
    baseURL: process.env.BASE_URL ? new URL(process.env.BASE_URL).origin : undefined,
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
