import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** The Time Entry tab of a PEMS inspection. */
export class TimeEntryPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly addButton: Locator;
  private readonly dialog: Locator;
  private readonly timeEntriesTable: Locator;

  constructor(page: Page) {
    super(page);
    // The page renders a second, hidden copy of the Add control for small screens.
    this.addButton = page.locator('#add-time-entry:visible');
    this.dialog = page.getByRole('dialog');
    this.timeEntriesTable = page.getByRole('table', { name: /List of time entries/ });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async addTimeEntry({ start, end }: { start: string; end: string }): Promise<void> {
    await this.addButton.click();
    await this.dialog.getByRole('textbox', { name: 'Start time*' }).fill(start);
    await this.dialog.getByRole('textbox', { name: 'End time*' }).fill(end);
    await this.dialog.getByRole('button', { name: 'Save' }).click();
    await expect(this.dialog).toBeHidden();
    await expect(this.timeEntriesTable.getByRole('cell', { name: `${start} - ${end}` })).toBeVisible();
  }
}
