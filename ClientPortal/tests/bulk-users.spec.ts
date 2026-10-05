import { test } from '../fixtures/pages.fixture';
import { serviceRequestHistory } from '../test-data/services';
import { loadUsers } from '../test-data/users';

// Every user in the list shares this password.
const password = process.env.APP_PASSWORD!;

// A missing or empty user list fails as a single bulk test rather than stopping Playwright from loading
// every spec, so other tests still run when no list is present.
let users: string[] = [];
let userListError: string | undefined;
try {
  users = loadUsers();
} catch (error) {
  userListError = (error as Error).message;
}

// Short wait on the Services page before signing out; change with BULK_IDLE_MS (or -IdleSeconds).
const IDLE_BEFORE_LOGOUT_MS = Number(process.env.BULK_IDLE_MS ?? 3_000);

test.describe('Client Portal bulk check - Service Request History', () => {
  test.beforeAll(() => {
    if (!password) {
      throw new Error('APP_PASSWORD must be set in .env');
    }
  });

  if (userListError) {
    test('Load user list', () => {
      throw new Error(userListError);
    });
  }

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
