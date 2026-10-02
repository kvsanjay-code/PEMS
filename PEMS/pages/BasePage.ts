import { expect, Locator, Page } from '@playwright/test';

const ADF_SPLASH_SHOWN_KEY = 'oracle.adfinternal.view.rich.splashScreenShown';

export abstract class BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly splashScreen: Locator;

  constructor(protected readonly page: Page) {
    this.splashScreen = page.locator('[id="afr::Splash"]');
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  /**
   * Oracle ADF shows a full-screen "Loading..." splash on a browser's first visit and only hides it
   * on later visits, once this localStorage flag exists. A fresh test context is always a first visit,
   * so set the flag before any page script runs, as a returning user's browser would have.
   *
   * ADF also re-shows the splash if more than 300ms pass between its inline scripts (it records the
   * hide time in window.AdfSplashHideTime). When ADF's scripts load slowly, e.g. with several browsers
   * running in parallel, that re-show fires and nothing on the sign-in page hides it again, so keep
   * that timestamp permanently unset.
   */
  protected async skipAdfSplashScreen(): Promise<void> {
    await this.page.addInitScript(key => {
      window.localStorage.setItem(key, '1');
      Object.defineProperty(window, 'AdfSplashHideTime', { configurable: true, get: () => undefined, set: () => {} });
    }, ADF_SPLASH_SHOWN_KEY);
  }

  protected async waitForPageReady(): Promise<void> {
    await expect(this.splashScreen).toBeHidden();
  }

  /** Leaves the user idle on the current page, e.g. to check the session survives inactivity. */
  async stayIdle(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }
}
