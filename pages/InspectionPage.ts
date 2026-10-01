import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { todayDayButtonLabel, todayDdMmYyyy } from '../utils/dates';

/** A PEMS inspection screen (#/inspection/<id>/horticulture). */
export class InspectionPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly heading: Locator;
  private readonly dialog: Locator;
  private readonly dialogSaveButton: Locator;
  private readonly timeEntryTab: Locator;
  private readonly actionsMenu: Locator;
  private readonly resultsTable: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.dialog = page.getByRole('dialog');
    this.dialogSaveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.timeEntryTab = page.getByRole('link', { name: /Time Entry/ });
    this.actionsMenu = page.locator('#inspection-actions');
    this.resultsTable = page.getByRole('table', { name: /List of inspection results/ });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  /** Value shown next to a label in the read-only summary sections. */
  private field(label: string): Locator {
    return this.page
      .locator('dt')
      .filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) })
      .locator('xpath=following-sibling::dd[1]');
  }

  async inspectionId(): Promise<string> {
    await expect(this.page).toHaveURL(/#\/inspection\/\d+/);
    return this.page.url().match(/#\/inspection\/(\d+)/)![1];
  }

  async expectStatus(status: 'Active' | 'Completed'): Promise<void> {
    await expect(this.heading).toContainText(`Inspection ${status}`);
  }

  private async saveDialog(): Promise<void> {
    await this.dialogSaveButton.click();
    await expect(this.dialog).toBeHidden();
  }

  async updateRexDetails({ placeOfOrigin }: { placeOfOrigin: string }): Promise<void> {
    await this.page.getByTitle('Change REX details').click();
    await this.dialog.getByRole('textbox', { name: 'Place of Origin' }).fill(placeOfOrigin);
    await this.saveDialog();
    await expect(this.field('Place of Origin')).toHaveText(placeOfOrigin);
  }

  async updateFlowPath({ result, resultTime }: { result: string; resultTime: string }): Promise<void> {
    await this.page.getByTitle('Change flow path details').click();
    await this.dialog.getByLabel('Inspection result').selectOption({ label: result });
    await this.dialog.locator('#resultDate-calendar').click();
    await this.page
      .getByRole('button', { name: todayDayButtonLabel(), exact: true })
      .filter({ hasNot: this.page.locator('.text-muted') })
      .click();
    await this.dialog.getByRole('textbox', { name: 'Result time*' }).fill(resultTime);
    await this.saveDialog();
    await expect(this.field('Inspection result')).toHaveText(result);
    await expect(this.field('Result time')).toHaveText(`${todayDdMmYyyy()} ${resultTime}`);
  }

  async updateOutcome({ samplingRate }: { samplingRate: string }): Promise<void> {
    await this.page.getByTitle('Change outcome details').click();
    await this.dialog.getByRole('checkbox', { name: 'Trade description matched' }).check();
    await this.dialog.getByRole('checkbox', { name: 'Compliance labelling verified' }).check();
    await this.dialog.getByLabel('Sampling rate').selectOption({ label: samplingRate });
    await this.saveDialog();
    await expect(this.field('Trade description')).toHaveText('Yes');
    await expect(this.field('Compliance labelling')).toHaveText('Yes');
    await expect(this.field('Sampling rate')).toHaveText(samplingRate);
  }

  async recordLineResult({ line, sampled, result }: { line: string; sampled: string; result: string }): Promise<void> {
    const row = this.resultsTable.getByRole('row').filter({ has: this.page.getByRole('cell', { name: line, exact: true }) });
    await row.getByRole('button', { name: 'Open' }).click();
    await this.dialog.getByRole('spinbutton', { name: 'Sampled number' }).fill(sampled);
    await this.dialog.getByLabel('Result', { exact: true }).selectOption({ label: result });
    await this.saveDialog();
    await expect(row.getByRole('cell').nth(4)).toHaveText(sampled);
    await expect(row.getByRole('cell').nth(5)).toHaveText(result);
  }

  async openTimeEntryTab(): Promise<void> {
    await this.timeEntryTab.click();
    await expect(this.page).toHaveURL(/#\/inspection\/\d+\/time-entry/);
  }

  async openInspectionTab(): Promise<void> {
    await this.page.getByRole('link', { name: /^\W*Inspection$/ }).click();
    await expect(this.page).toHaveURL(/#\/inspection\/\d+\/horticulture/);
  }

  /** Submits the inspection, ticking the 1st and 3rd confirmation boxes. */
  async submit(): Promise<void> {
    await this.actionsMenu.click();
    await this.page.getByText('Submit', { exact: true }).click();
    await this.dialog.getByRole('checkbox', { name: 'Are you sure you want to' }).check();
    await this.dialog.getByRole('checkbox', { name: 'I confirm and declare that' }).check();
    await this.saveDialog();
    await this.expectStatus('Completed');
  }
}
