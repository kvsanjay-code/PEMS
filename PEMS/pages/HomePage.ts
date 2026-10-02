import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly welcomeUser: Locator;
  private readonly logoutLink: Locator;
  private readonly pemsTile: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeUser = page.getByRole('button', { name: /^Welcome / });
    this.logoutLink = page.getByRole('link', { name: 'Logout' });
    this.pemsTile = page.getByRole('link', { name: 'PEMS' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async expectLoggedIn(): Promise<void> {
    await this.waitForPageReady();
    await expect(this.page).toHaveTitle('Home');
    await expect(this.welcomeUser).toBeVisible();
    await expect(this.logoutLink).toBeVisible();
  }

  async openPems(): Promise<void> {
    await this.pemsTile.click();
    await this.page.waitForURL(/\/pems\//);
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }
}
