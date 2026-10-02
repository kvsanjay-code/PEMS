import { test } from '../fixtures/pages.fixture';
import { serviceRequestHistory } from '../test-data/services';
import { loadUsers } from '../test-data/users';

// Every user in the list shares this password.
const password = process.env.APP_PASSWORD!;
const users = loadUsers();

// No wait by default so 200 users finish quickly; set BULK_IDLE_MS (or -IdleSeconds) to add one.
const IDLE_BEFORE_LOGOUT_MS = Number(process.env.BULK_IDLE_MS ?? 0);

test.describe('Client Portal bulk check - Service Request History', () => {
  test.beforeAll(() => {
    if (!password) {
      throw new Error('APP_PASSWORD must be set in .env');
    }
  });

  for (const user of users) {
    // The "user" annotation is what the failed-users reporter keys its CSV rows on.
    test(user, { annotation: { type: 'user', description: user } }, async ({
      loginPage,
      portalHomePage,
      servicesPage,
      portalHeader,
    }) => {
      await test.step('Log in', async () => {
        await loginPage.goto();
        await loginPage.login(user, password);
        await portalHomePage.expectLoaded();
      });

      await test.step('Connect to a new service', async () => {
        await portalHomePage.connectToNewService();
        await servicesPage.expectLoaded();
      });

      await test.step('Verify Service Request History', async () => {
        await servicesPage.expectServiceRequestHistory(serviceRequestHistory);
      });

      await test.step('Sign out', async () => {
        await servicesPage.stayIdle(IDLE_BEFORE_LOGOUT_MS);
        await portalHeader.signOut();
        await loginPage.expectLoaded();
      });
    });
  }
});
