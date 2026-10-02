import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LogoutPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly confirmationMessage: Locator;
  private readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.confirmationMessage = page.getByRole('heading', { name: 'You have successfully logged out.' });
    this.loginLink = page.getByRole('link', { name: 'LogIn' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async expectLoggedOut(): Promise<void> {
    await expect(this.page).toHaveURL(/signout\.jspx/);
    await expect(this.confirmationMessage).toBeVisible();
    await expect(this.loginLink).toBeVisible();
  }
}
