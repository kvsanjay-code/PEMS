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

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: /Welcome to the Department of Agriculture/ });
    this.userId = page.getByRole('textbox', { name: 'Enter User ID' });
    this.password = page.getByRole('textbox', { name: 'Enter Password' });
    this.termsCheckbox = page.getByRole('checkbox', { name: 'I accept the' });
    this.loginButton = page.getByRole('button', { name: 'Log in' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.skipAdfSplashScreen();
    await this.page.goto(SELF_SERVICE_HOME_PATH);
    await this.waitForPageReady();
    await expect(this.heading).toBeVisible();
  }

  async login(username: string, password: string): Promise<void> {
    await this.userId.fill(username);
    await this.password.fill(password);
    await expect(this.loginButton).toBeDisabled();
    await this.termsCheckbox.check();
    await expect(this.loginButton).toBeEnabled();
    await this.loginButton.click();
  }
}
