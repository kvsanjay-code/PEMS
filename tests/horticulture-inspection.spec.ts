import { test } from '../fixtures/pages.fixture';
import { horticultureInspection as data } from '../test-data/horticulture';
import { getRexNumber, markRexUsed } from '../test-data/rexPool';

const username = process.env.APP_USERNAME!;
const password = process.env.APP_PASSWORD!;

const IDLE_BEFORE_LOGOUT_MS = 10_000;

test.describe('PEMS happy path - Horticulture inspection', () => {
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
  }) => {
    test.setTimeout(5 * 60_000);
    const rex = getRexNumber('Horticulture');
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

    await test.step(`Create Horticulture inspection for ${rex}`, async () => {
      const dialog = await pemsHomePage.openCreateHorticulture();
      await dialog.createWithRex(rex);
      const inspectionId = await inspectionPage.inspectionId();
      markRexUsed(rex, inspectionId);
      test.info().annotations.push({ type: 'Inspection ID', description: inspectionId });
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
      await rexPage.search(rex);
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
