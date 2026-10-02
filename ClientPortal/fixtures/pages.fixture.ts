import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PortalHeader } from '../pages/PortalHeader';
import { PortalHomePage } from '../pages/PortalHomePage';
import { ServicesPage } from '../pages/ServicesPage';

type Pages = {
  loginPage: LoginPage;
  portalHeader: PortalHeader;
  portalHomePage: PortalHomePage;
  servicesPage: ServicesPage;
};

export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  portalHeader: async ({ page }, use) => {
    await use(new PortalHeader(page));
  },
  portalHomePage: async ({ page }, use) => {
    await use(new PortalHomePage(page));
  },
  servicesPage: async ({ page }, use) => {
    await use(new ServicesPage(page));
  },
});

export { expect } from '@playwright/test';
