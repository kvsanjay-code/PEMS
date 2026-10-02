import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { InspectionPage } from '../pages/InspectionPage';
import { LoginPage } from '../pages/LoginPage';
import { LogoutPage } from '../pages/LogoutPage';
import { PemsHeader } from '../pages/PemsHeader';
import { PemsHomePage } from '../pages/PemsHomePage';
import { RexPage } from '../pages/RexPage';
import { TimeEntryPage } from '../pages/TimeEntryPage';
import {
  claimRexNumber,
  InspectionType,
  markCreateAttempted,
  recordInspection,
  releaseIfUnused,
} from '../test-data/rexPool';

/** A REX claimed from the pool for one test run. */
export type RexClaim = {
  number: string;
  markCreateAttempted(): void;
  recordInspection(inspectionId: string): void;
};

type Pages = {
  loginPage: LoginPage;
  homePage: HomePage;
  logoutPage: LogoutPage;
  pemsHeader: PemsHeader;
  pemsHomePage: PemsHomePage;
  inspectionPage: InspectionPage;
  timeEntryPage: TimeEntryPage;
  rexPage: RexPage;
  rex: RexClaim;
};

type Options = {
  /** Which REX pool the test draws from; set with test.use({ rexType: ... }). */
  rexType: InspectionType;
};

export const test = base.extend<Pages & Options>({
  rexType: ['Horticulture', { option: true }],

  // Claimed only when a test asks for it; returned to the pool if the test never reached Create.
  rex: async ({ rexType }, use, testInfo) => {
    const number = claimRexNumber(rexType);
    testInfo.annotations.push({ type: 'REX', description: number });
    await use({
      number,
      markCreateAttempted: () => markCreateAttempted(number),
      recordInspection: inspectionId => {
        recordInspection(number, inspectionId);
        testInfo.annotations.push({ type: 'Inspection ID', description: inspectionId });
      },
    });
    if (releaseIfUnused(number)) {
      testInfo.annotations.push({ type: 'REX released', description: `${number} returned to the pool (Create never clicked)` });
    }
  },

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
