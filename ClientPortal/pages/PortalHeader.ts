import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Banner and navigation shared by every signed-in portal page. */
export class PortalHeader extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly userMenuButton: Locator;
  private readonly signOutItem: Locator;

  constructor(page: Page) {
    super(page);
    // Labelled with the signed-in user's initials and name, e.g. "SV sanjay vndtest".
    this.userMenuButton = page.getByRole('navigation', { name: 'Supplementary' }).getByRole('button');
    this.signOutItem = page.getByRole('menuitem', { name: 'Sign out' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async signOut(): Promise<void> {
    await this.userMenuButton.click();
    await expect(this.signOutItem).toBeVisible();
    await this.signOutItem.click();
  }
}
