import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** REX search (#/rfp-search) and the REX record it opens (#/rfp/<id>/...). */
export class RexPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly rexMenuLink: Locator;
  private readonly rexNumberSearch: Locator;
  private readonly searchButton: Locator;
  private readonly heading: Locator;
  private readonly serviceRequestTab: Locator;
  private readonly requestAuthorisationButton: Locator;
  private readonly dialog: Locator;
  private readonly authorisationsTable: Locator;

  constructor(page: Page) {
    super(page);
    this.rexMenuLink = page.getByRole('navigation').getByRole('link', { name: 'REX', exact: true });
    this.rexNumberSearch = page.getByRole('textbox', { name: 'REX number' });
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.heading = page.getByRole('heading', { level: 1 });
    this.serviceRequestTab = page.getByRole('link', { name: /Service Request/ });
    this.requestAuthorisationButton = page.getByRole('button', { name: 'Request to authorise REX' });
    this.dialog = page.getByRole('dialog');
    this.authorisationsTable = page.getByRole('table', { name: 'List of authorisations.' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async search(rex: string): Promise<void> {
    await this.rexMenuLink.click();
    await this.rexNumberSearch.fill(rex);
    await this.searchButton.click();
    await expect(this.heading).toContainText(`Request For Export ${rex}`);
  }

  async requestAuthorisation(): Promise<void> {
    await this.serviceRequestTab.click();
    await expect(this.page).toHaveURL(/#\/rfp\/\d+\/authorisations/);
    await this.requestAuthorisationButton.click();
    await this.dialog.getByRole('checkbox', { name: 'I declare that I am' }).check();
    await this.dialog.getByRole('checkbox', { name: 'I declare that the' }).check();
    await this.dialog.getByRole('button', { name: 'Send' }).click();
    await expect(this.dialog).toBeHidden();
    const request = this.authorisationsTable.getByRole('row').filter({ hasText: 'Request to authorise REX' });
    await expect(request.getByRole('cell').nth(1)).toHaveText('Requested');
  }
}
