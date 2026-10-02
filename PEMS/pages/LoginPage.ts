import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Self Service home URL; unauthenticated visits redirect to the sign-in page. Host comes from baseURL. */
const SELF_SERVICE_HOME_PATH = '/selfservice/faces/oracle/webcenter/portalapp/pages/private/home.jsf?impersonate=external';

export class LoginPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly heading: Locator;
  private readonly userId: Locator;
  private readonly password: Locator;
  private readonly termsCheckbox: Locator;
  private readonly loginButton: Locator;
  private readonly signedInGreeting: Locator;
  private readonly accessManagerError: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: /Welcome to the Department of Agriculture/ });
    this.userId = page.getByRole('textbox', { name: 'Enter User ID' });
    this.password = page.getByRole('textbox', { name: 'Enter Password' });
    this.termsCheckbox = page.getByRole('checkbox', { name: 'I accept the' });
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    this.signedInGreeting = page.getByRole('button', { name: /^Welcome / });
    this.accessManagerError = page.getByText('System error. Please contact the System Administrator.');
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.skipAdfSplashScreen();
    await this.page.goto(SELF_SERVICE_HOME_PATH);
    await this.waitForPageReady();
    await expect(this.heading).toBeVisible();
  }

  /**
   * Oracle Access Manager intermittently answers a valid login with "System error". That happens
   * before any test data is touched, so it is safe to reload the sign-in page and try once more.
   */
  async login(username: string, password: string): Promise<void> {
    await this.submitCredentials(username, password);
    if (await this.landedOnAccessManagerError()) {
      await this.goto();
      await this.submitCredentials(username, password);
      if (await this.landedOnAccessManagerError()) {
        throw new Error('Oracle Access Manager returned "System error" on two consecutive logins.');
      }
    }
  }

  private async submitCredentials(username: string, password: string): Promise<void> {
    await this.userId.fill(username);
    await this.password.fill(password);
    await expect(this.loginButton).toBeDisabled();
    await this.termsCheckbox.check();
    await expect(this.loginButton).toBeEnabled();
    await this.loginButton.click();
  }

  private async landedOnAccessManagerError(): Promise<boolean> {
    await expect(this.signedInGreeting.or(this.accessManagerError)).toBeVisible({ timeout: 30_000 });
    return this.accessManagerError.isVisible();
  }
}
