import { test } from '../fixtures/pages.fixture';
import { horticultureInspection as data } from '../test-data/horticulture';

const username = process.env.APP_USERNAME!;
const password = process.env.APP_PASSWORD!;

const IDLE_BEFORE_LOGOUT_MS = 10_000;

test.describe('PEMS happy path - Horticulture inspection', () => {
  test.use({ rexType: 'Horticulture' });

  test.beforeAll(() => {
    if (!username || !password) {
      throw new Error('APP_USERNAME and APP_PASSWORD must be set in .env');
    }
  });

  test('AO creates, completes and submits a Horticulture inspection', async ({
    loginPage,
    homePage,
    pemsHeader,
    pemsHomePage,
    inspectionPage,
    timeEntryPage,
    rexPage,
    logoutPage,
    rex,
  }) => {
    test.setTimeout(5 * 60_000);

    await test.step('Log in', async () => {
      await loginPage.goto();
      await loginPage.login(username, password);
      await homePage.expectLoggedIn();
    });

    await test.step('Open PEMS', async () => {
      await homePage.openPems();
      await pemsHomePage.expectLoaded();
    });

    await test.step(`Create Horticulture inspection for ${rex.number}`, async () => {
      const dialog = await pemsHomePage.openCreateHorticulture();
      rex.markCreateAttempted();
      await dialog.createWithRex(rex.number);
      rex.recordInspection(await inspectionPage.inspectionId());
      await inspectionPage.expectStatus('Active');
    });

    await test.step('Update REX details', async () => {
      await inspectionPage.updateRexDetails({ placeOfOrigin: data.placeOfOrigin });
    });

    await test.step('Update flow path details', async () => {
      await inspectionPage.updateFlowPath(data.flowPath);
    });

    await test.step('Update outcome details', async () => {
      await inspectionPage.updateOutcome(data.outcome);
    });

    await test.step('Record line result', async () => {
      await inspectionPage.recordLineResult(data.lineResult);
    });

    await test.step('Add time entry', async () => {
      await inspectionPage.openTimeEntryTab();
      await timeEntryPage.addTimeEntry(data.timeEntry);
    });

    await test.step('Submit inspection', async () => {
      await inspectionPage.submit();
    });

    await test.step('Request authorisation of the REX', async () => {
      await rexPage.search(rex.number);
      await rexPage.requestAuthorisation();
    });

    await test.step('Wait 10 seconds, then log out', async () => {
      await rexPage.stayIdle(IDLE_BEFORE_LOGOUT_MS);
      await pemsHeader.backToSelfService();
      await homePage.expectLoggedIn();
      await homePage.logout();
      await logoutPage.expectLoggedOut();
    });
  });
});
