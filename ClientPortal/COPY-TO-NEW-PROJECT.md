# Reusing this project in a new test project

Which ClientPortal files to copy into a new Playwright project (for example a project for different test
data or another portal check), what to change in each, and what to leave behind.

## 1. Copy as is

These files do not depend on the Client Portal screens.

| File | What it gives you | Change |
|---|---|---|
| `package.json` | Scripts (`test`, `test:bulk`, `export`, `report`, `typecheck`, `codegen`) and dependency versions | `name` and `description` |
| `package-lock.json` | The same package versions | Nothing. Run `npm ci` after copying. |
| `tsconfig.json` | TypeScript settings | Nothing |
| `.gitignore` | Keeps `.env`, user lists, results, reports and `node_modules` out of git | Nothing |
| `.env.example` | Template for `BASE_URL`, `APP_USERNAME`, `APP_PASSWORD` | `BASE_URL` if the app is different |
| `playwright.config.ts` | Headed/headless switch, `chromium` and `bulk` projects, reports, traces, screenshots and video on failure | Only if the bulk spec gets a different file name (`BULK_SPEC`) |
| `pages/BasePage.ts` | Base class for all page objects (`stayIdle()`) | Nothing |
| `reporters/failed-users-reporter.ts` | Writes `failed-users.csv`, `failed-users.txt` and `bulk-results.csv` to `results\<date-time>\` | Nothing. It works for any test that has a `user` annotation and uses `test.step`. |
| `test-data/users.ts` | Reads the user list (.txt or .csv), drops duplicates, applies `BULK_LIMIT` | Nothing |
| `scripts/run-bulk.ps1` | `npm run test:bulk` options (`-UsersFile`, `-Workers`, `-Limit`, `-IdleSeconds`, `-Retries`, `-Headed`) | The `.SYNOPSIS` text and the `-IdleSeconds` comment, which mention the Services page |
| `scripts/export.ps1` | `npm run export` / `export:offline` zip packaging | Replace `ClientPortal` with the new folder name on lines 23, 48 and 50 |

## 2. Copy if the new project uses the same sign-in

Use these if the app signs in through the same Online Services page (**Email or Client ID** and **Password**).

| File | Change |
|---|---|
| `pages/LoginPage.ts` | `PORTAL_PATH`, the page opened before sign-in. The login, the "Login rejected (OAM-2)" error and `expectLoaded()` stay the same. |
| `pages/PortalHeader.ts` | Nothing if the signed-in pages have the same user menu with **Sign out**. Otherwise rewrite it for the new header. |

## 3. Copy the pattern, rewrite the content

These files are specific to the Client Portal check. Keep their structure and replace what they do.

| File | Keep | Replace |
|---|---|---|
| `pages/PortalHomePage.ts`, `pages/ServicesPage.ts` | Layout: private locators, then actions, then assertions | Write one page object per screen of the new flow |
| `fixtures/pages.fixture.ts` | The `base.extend` pattern | List the new page objects |
| `test-data/services.ts` | One file of expected values per screen | The expected texts for the new check |
| `tests/happy-path.spec.ts` | `test.step` per stage, the `.env` check in `beforeAll` | The steps of the new flow |
| `tests/bulk-users.spec.ts` | `loadUsers()`, one test per user, `annotation: { type: 'user', ... }` and `test.step` names (the reporter's "failed step" column uses the step names) | The steps inside the test |
| `README.md` | Sections: setup, commands, bulk run, moving to another machine, layout | Project name, what is tested, expected texts |

## 4. Do not copy

| Item | Why |
|---|---|
| `.env` | Holds the password. Create a new one from `.env.example`. |
| `test-data/users.txt`, `test-data/users.csv` | Real user lists. Keep them out of git and out of exports. |
| `node_modules/` | Recreated by `npm ci` |
| `results/`, `test-results/`, `playwright-report/` | Output of earlier runs |
| `.auth/`, `recordings/`, `dist/`, `ms-playwright/` | Saved sign-ins, codegen recordings, export zips, bundled browser |
| `COPY-TO-NEW-PROJECT.md` | This guide |

## 5. Steps

```powershell
# From C:\Playwright\Automation, copy the reusable files into the new folder
$src = 'ClientPortal'; $dst = 'NewProject'
robocopy $src $dst /E /XD node_modules dist test-results playwright-report results recordings .auth ms-playwright `
  /XF .env users.txt users.csv COPY-TO-NEW-PROJECT.md

cd $dst
npm ci
npx playwright install chromium
copy .env.example .env      # fill in BASE_URL, APP_USERNAME, APP_PASSWORD
```

Then:
1. Change the items in sections 1 and 2.
2. Record the new flow: `npm run codegen -- <url>` and save the output under `recordings/`.
3. Turn the recording into page objects and specs as in section 3, and delete the ClientPortal pages, test
   data and specs you no longer need.
4. Run `npm run typecheck`, then `npm test`, then a trial bulk run: `npm run test:bulk -- -Limit 5`.
5. Add the new project to the table in the root `README.md`.
