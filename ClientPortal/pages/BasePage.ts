import { Page } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  // ── Actions ─────────────────────────────────────────────────────────────────────

  /** Leaves the user idle on the current page, e.g. to check the session survives inactivity. */
  async stayIdle(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
