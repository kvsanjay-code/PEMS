import { test } from '../fixtures/pages.fixture';
import { getRexNumber, markRexUsed } from '../test-data/rexPool';

const username = process.env.APP_USERNAME!;
const password = process.env.APP_PASSWORD!;

const IDLE_BEFORE_LOGOUT_MS = 10_000;

test.describe('PEMS happy path - Grain and Plant Product inspection', () => {
  test.beforeAll(() => {
    if (!username || !password) {
      throw new Error('APP_USERNAME and APP_PASSWORD must be set in .env');
    }
  });

  // TODO: remove fixme once the Grain inspection details steps are recorded and added.
  // Until then it is skipped so `npm test` does not spend a Grain REX on an incomplete flow.
  test.fixme('AO creates, completes and submits a Grain and Plant Product inspection', async ({
    loginPage,
    homePage,
    pemsHeader,
    pemsHomePage,
    inspectionPage,
    logoutPage,
  }) => {
    test.setTimeout(5 * 60_000);
    const rex = getRexNumber('Grain');
    test.info().annotations.push({ type: 'REX', description: rex });

    await test.step('Log in', async () => {
      await loginPage.goto();
      await loginPage.login(username, password);
      await homePage.expectLoggedIn();
    });

    await test.step('Open PEMS', async () => {
      await homePage.openPems();
      await pemsHomePage.expectLoaded();
    });

    await test.step(`Create Grain and Plant Product inspection for ${rex}`, async () => {
      const dialog = await pemsHomePage.openCreateGrain();
      await dialog.createWithRex(rex);
      const inspectionId = await inspectionPage.inspectionId();
      markRexUsed(rex, inspectionId);
      test.info().annotations.push({ type: 'Inspection ID', description: inspectionId });
      await inspectionPage.expectStatus('Active');
    });

    // Inspection details steps go here once recorded.

    await test.step('Wait 10 seconds, then log out', async () => {
      await inspectionPage.stayIdle(IDLE_BEFORE_LOGOUT_MS);
      await pemsHeader.backToSelfService();
      await homePage.expectLoggedIn();
      await homePage.logout();
      await logoutPage.expectLoggedOut();
    });
  });
});
