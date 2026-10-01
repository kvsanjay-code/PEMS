import { expect, Locator, Page } from '@playwright/test';

/** The "Create ... Inspection" modal opened from a PEMS home tile. */
export class CreateInspectionDialog {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly dialog: Locator;
  private readonly heading: Locator;
  private readonly rexNumber: Locator;
  private readonly createButton: Locator;

  constructor(page: Page, title: string) {
    this.dialog = page.getByRole('dialog');
    this.heading = this.dialog.getByRole('heading', { name: title });
    this.rexNumber = this.dialog.getByRole('textbox', { name: 'REX number' });
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async expectOpen(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async createWithRex(rex: string): Promise<void> {
    await this.rexNumber.fill(rex);
    await this.createButton.click();
  }
}
