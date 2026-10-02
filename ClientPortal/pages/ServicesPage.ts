import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export type ServiceRequestHistoryCard = {
  sectionHeading: string;
  title: string;
  description: string;
};

export class ServicesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly heading: Locator;
  private readonly loading: Locator;
  private readonly historyCardLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'Services', exact: true });
    this.loading = page.getByRole('alert').filter({ hasText: 'Loading' });
    // Partial match finds the card whatever its status suffix; expectServiceRequestHistory checks the full text.
    this.historyCardLink = page.getByRole('link', { name: 'View Service Request History' });
  }

  // ── Assertions ──────────────────────────────────────────────────────────────────

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.loading).toBeHidden();
  }

  /** Scrolls down to the Service Request History section; any difference in its text fails the test. */
  async expectServiceRequestHistory(card: ServiceRequestHistoryCard): Promise<void> {
    const sectionHeading = this.page.getByRole('heading', { level: 2, name: card.sectionHeading, exact: true });
    await sectionHeading.scrollIntoViewIfNeeded();
    await expect(sectionHeading).toBeVisible();

    await this.historyCardLink.scrollIntoViewIfNeeded();
    await expect(this.historyCardLink).toHaveText(card.title);

    await expect(this.page.getByText(card.description, { exact: true })).toBeVisible();
  }
}
