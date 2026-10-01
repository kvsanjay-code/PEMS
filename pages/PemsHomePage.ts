import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { CreateInspectionDialog } from './CreateInspectionDialog';

export class PemsHomePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly heading: Locator;
  private readonly horticultureTile: Locator;
  private readonly grainTile: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 2, name: 'Plant Exports Management System' });
    this.horticultureTile = page.locator('#create-horticulture');
    this.grainTile = page.locator('#create-goods');
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pems\/#\/home/);
    await expect(this.heading).toBeVisible();
  }

  async openCreateHorticulture(): Promise<CreateInspectionDialog> {
    await this.horticultureTile.click();
    const dialog = new CreateInspectionDialog(this.page, 'Create Horticulture Inspection');
    await dialog.expectOpen();
    return dialog;
  }

  async openCreateGrain(): Promise<CreateInspectionDialog> {
    await this.grainTile.click();
    const dialog = new CreateInspectionDialog(this.page, 'Create Grain and Plant Product Inspection');
    await dialog.expectOpen();
    return dialog;
  }
}
