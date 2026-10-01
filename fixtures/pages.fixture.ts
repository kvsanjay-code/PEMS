import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { InspectionPage } from '../pages/InspectionPage';
import { LoginPage } from '../pages/LoginPage';
import { LogoutPage } from '../pages/LogoutPage';
import { PemsHeader } from '../pages/PemsHeader';
import { PemsHomePage } from '../pages/PemsHomePage';
import { RexPage } from '../pages/RexPage';
import { TimeEntryPage } from '../pages/TimeEntryPage';

type Pages = {
  loginPage: LoginPage;
  homePage: HomePage;
  logoutPage: LogoutPage;
  pemsHeader: PemsHeader;
  pemsHomePage: PemsHomePage;
  inspectionPage: InspectionPage;
  timeEntryPage: TimeEntryPage;
  rexPage: RexPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  logoutPage: async ({ page }, use) => {
    await use(new LogoutPage(page));
  },
  pemsHeader: async ({ page }, use) => {
    await use(new PemsHeader(page));
  },
  pemsHomePage: async ({ page }, use) => {
    await use(new PemsHomePage(page));
  },
  inspectionPage: async ({ page }, use) => {
    await use(new InspectionPage(page));
  },
  timeEntryPage: async ({ page }, use) => {
    await use(new TimeEntryPage(page));
  },
  rexPage: async ({ page }, use) => {
    await use(new RexPage(page));
  },
});

export { expect } from '@playwright/test';
