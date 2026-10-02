import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class PortalHomePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly heading: Locator;
  private readonly connectToNewServiceLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'Welcome to Agriculture Online Services' });
    this.connectToNewServiceLink = page.getByRole('link', { name: 'Connect to a new service' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async connectToNewService(): Promise<void> {
    await this.connectToNewServiceLink.click();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────────

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible({ timeout: 60_000 });
  }
}
