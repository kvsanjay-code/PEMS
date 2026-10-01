# Project history and decisions

How this test suite was built, what was learned about the PEMS environment along the way, and why the
code looks the way it does. Read this before changing the REX handling, the login flow or `BasePage`.
For setup and run commands, see the [README](../README.md).

Built 1–2 October 2026, step by step: each page was explored, its page object was proposed and approved,
then implemented and run against the vendor test environment.

---

## What was built

| Area | Result |
|---|---|
| Horticulture inspection happy path | Complete and passing, including 2 inspections created in parallel |
| Grain and Plant Product happy path | Scaffolded and skipped (`test.fixme`): login, create and logout work, the inspection-detail steps still need recording |
| Parallel and bulk runs | REX pool with locking, `bulk-horticulture.ps1` helper, verified with 6 parallel logins |
| Repository | `github.com/kvsanjay-code/PEMS`, `main` branch |

### How the Horticulture flow was captured
1. Login, Home and PEMS pages were explored with scripted Playwright snapshots.
2. A tester recorded the inspection-detail steps once with `npx playwright codegen`, against an inspection
   that had already been created, so the recording did not spend a REX.
3. The recording was rewritten into page objects:
   - Dropdowns are selected by visible label (`'Passed'`) instead of internal codes (`number:7100`).
   - The date-picker uses today's date instead of a generated element ID.
   - Every Save button is scoped to its own dialog.
   - Each step has an assertion confirming that the save worked.

---

## Findings about the environment

### 1. The ADF "Loading..." splash never clears for automated browsers
- **Symptom:** a full-screen "Loading..." covers the sign-in form indefinitely, in bundled Chromium, Edge and
  Chrome, headed or headless.
- **Cause:** Oracle ADF hides its splash only for returning visitors, recognised by a `localStorage` flag
  (`oracle.adfinternal.view.rich.splashScreenShown`). A fresh test browser is always a first visit, and on
  the sign-in page nothing else removes the splash.
- **Fix:** `BasePage.skipAdfSplashScreen()` sets the flag before any page script runs, matching a returning
  user's browser.

### 2. The splash can come back when ADF's scripts load slowly
- **Symptom:** 1 of 18 logins failed with the splash stuck, during a run of 6 parallel browsers.
- **Cause:** ADF shows the splash again if more than 300 ms pass between two of its inline scripts. That
  gap includes downloading ADF's JavaScript files, which is slower when several browsers start together.
- **Reproduced:** delaying `.js` responses by 1 s failed 3 of 3 runs. Delaying CSS or slowing the CPU 20×
  did not reproduce it.
- **Fix:** the same init script keeps `window.AdfSplashHideTime` permanently unset, so the re-show check
  never fires.
- **After the fix:** 3 of 3 runs passed with slow scripts, and 36 of 36 parallel logins passed (6 at a time).

### 3. Oracle Access Manager occasionally returns "System error"
- **Symptom:** once, a valid login landed on OAM's "System error. Please contact the System Administrator."
  page while another browser was logging in.
- **Investigation:** the same account logged in from 2 and then 6 browsers at once without errors in 54
  later attempts. Parallel sessions for one user are allowed, and the error is intermittent, not caused by
  concurrency.
- **Fix:** `LoginPage.login()` retries once when that specific page appears. This is safe because it happens
  before any REX is used. The retry branch has not yet been seen to run for real.

### 4. A REX number creates exactly one inspection
- After *Create*, a REX cannot be used again, and each REX belongs to one commodity type (Horticulture or Grain).
- Clicking the Horticulture tile only opens a dialog. Nothing is created until *Create* is clicked
  (confirmed by watching network requests).
- Submitting an inspection is irreversible, and so is sending "Request to authorise REX". A recording that
  reaches those steps uses up that inspection for further recording.

---

## Design decisions

| Decision | Why |
|---|---|
| **Page Object Model with private locators** | Tests contain only steps. Locators are `private`, so specs cannot depend on them; the TypeScript build fails if one tries. |
| **Locators as `readonly` fields, not methods** | Playwright locators are lazy, so fields never go stale. Methods are used only when a parameter is needed (`InspectionPage.field(label)`). |
| **Assertions inside page-object actions** | Each action confirms it worked (e.g. `updateFlowPath()` checks the saved values), so a failure points at the step that broke. |
| **`PemsHeader` component** | The "back to Self Service" link is on every PEMS screen, not just PEMS home. |
| **`CreateInspectionDialog` shared** | The Horticulture and Grain create dialogs are identical apart from their title. |
| **Page objects don't read `.env`** | Config takes only the host from `BASE_URL`; each page object owns its path. |
| **REX pool file instead of hard-coded REX numbers** | REX numbers are single-use. `test-data/rex-pool.json` records which are used and the inspection created from each. |
| **Claim under a file lock** | Parallel workers would otherwise pick the same REX. Verified: 6 simultaneous claims got 5 distinct REX numbers, and the 6th got a clear "none left" error. |
| **Release the REX if Create was never clicked** | A failure at login no longer wastes a REX. After Create it stays used, because PEMS may have consumed it. |
| **`retries: 0`** | A retry would silently spend a second REX. |
| **`--max-failures` and a trial batch for bulk runs** | Limits REX numbers lost to a systemic problem: at most 6 in the trial, then 5 in the main batch. |
| **Headed by default, `HEADLESS=1` for bulk** | The team watches single runs; bulk runs don't need windows. |
| **`tsx` for helper scripts** | Node won't run TypeScript files that use `import` in this CommonJS project. |

### Alternatives considered
- **A REX passed in per run** (`REX_NUMBER=... npm test`): simplest, but needs manual effort for every run.
- **Finding a free REX in the PEMS REX search:** fully automatic, but it has not been checked whether the
  search can filter for REX numbers that have no inspection yet. Worth investigating later.
- **One named test per REX from a data file:** produces nicer report names, but ties each REX to a fixed
  test, which makes rerunning failures harder.
- **Locators as methods** (from an external sample): equivalent in behaviour. Not adopted, but its two good
  ideas, private locators and no environment-variable reads in page objects, were.

---

## Development practices that saved REX numbers
- Explore pages with scripts that only read the page.
- Open dialogs without clicking *Create*.
- Record and debug detail steps against an existing *Active* inspection; only the final end-to-end run
  creates a new one.
- Verify changes with smoke tests and `-DryRun` modes that never claim a REX.

---

## Open items
1. **Grain and Plant Product path:** create one Grain inspection, record its detail steps with codegen,
   add the page-object steps and `test-data/grain.ts`, then remove `test.fixme`. Five Grain REX numbers are
   already in the local pool.
2. **`InspectionPage` is partly Horticulture-specific** (`openInspectionTab()` expects `/horticulture`). Make
   it generic or split it when Grain is built, depending on how different the Grain screens are.
3. **Before a 100-inspection run:** confirm with the environment owners that this volume of test data is
   acceptable, and do the 6-inspection trial first.
4. **Possible:** a permanent login-only smoke test (no REX) as a health check before bulk runs.
5. **Possible:** declare locators where they are defined (`private readonly x = this.page.getBy...`) to
   remove most constructors. This is a cosmetic change only.
