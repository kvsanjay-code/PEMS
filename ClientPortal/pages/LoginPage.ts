import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/** Portal home; unauthenticated visits redirect to the Online Services sign-in page. Host comes from baseURL. */
const PORTAL_PATH = '/portal';

export class LoginPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────────

  private readonly heading: Locator;
  private readonly emailOrClientId: Locator;
  private readonly password: Locator;
  private readonly loginButton: Locator;
  private readonly errorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1, name: 'Online Services - Login' });
    this.emailOrClientId = page.getByRole('textbox', { name: 'Email or Client ID' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    // Shown above the heading when the login is rejected, e.g. "An incorrect Username or Password was specified."
    this.errorMessage = page.locator('p').filter({ hasText: /\S/ }).first();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto(PORTAL_PATH);
    await this.expectLoaded();
  }

  /**
   * A rejected login reloads the sign-in page with p_error_code in the URL (e.g. OAM-2 for a wrong
   * username or password). Fail straight away with that code and message rather than waiting for a
   * portal page that will never load.
   */
  async login(username: string, password: string): Promise<void> {
    await this.emailOrClientId.fill(username);
    await this.password.fill(password);
    await this.loginButton.click();
    await this.page.waitForURL(
      url => !url.pathname.startsWith('/auth/faces/login') || url.searchParams.has('p_error_code'),
      { timeout: 60_000 },
    );
    const errorCode = new URL(this.page.url()).searchParams.get('p_error_code');
    if (errorCode) {
      const message = (await this.errorMessage.textContent({ timeout: 5_000 }).catch(() => null))?.trim();
      throw new Error(`Login rejected (${errorCode}): ${message || 'no message shown'}`);
    }
  }

  // ── Assertions ──────────────────────────────────────────────────────────────────

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }
}
