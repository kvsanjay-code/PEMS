import { test } from '../fixtures/pages.fixture';
import { serviceRequestHistory } from '../test-data/services';

const username = process.env.APP_USERNAME!;
const password = process.env.APP_PASSWORD!;

const IDLE_BEFORE_LOGOUT_MS = 10_000;

test.describe('Client Portal happy path', () => {
  test.beforeAll(() => {
    if (!username || !password) {
      throw new Error('APP_USERNAME and APP_PASSWORD must be set in .env');
    }
  });

  test('User checks Service Request History on the Services page', async ({
    loginPage,
    portalHomePage,
    servicesPage,
    portalHeader,
  }) => {
    await test.step('Log in', async () => {
      await loginPage.goto();
      await loginPage.login(username, password);
      await portalHomePage.expectLoaded();
    });

    await test.step('Connect to a new service', async () => {
      await portalHomePage.connectToNewService();
      await servicesPage.expectLoaded();
    });

    await test.step('Verify Service Request History', async () => {
      await servicesPage.expectServiceRequestHistory(serviceRequestHistory);
    });

    await test.step('Wait 10 seconds, then sign out', async () => {
      await servicesPage.stayIdle(IDLE_BEFORE_LOGOUT_MS);
      await portalHeader.signOut();
      await loginPage.expectLoaded();
    });
  });
});
