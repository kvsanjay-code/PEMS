# PEMS – Playwright + TypeScript (Page Object Model)

End-to-end happy-path tests for the Plant Exports Management System (PEMS), reached through the
department's Self Service portal.

| Test | Status |
|---|---|
| `tests/horticulture-inspection.spec.ts` | ✅ Log in → create Horticulture inspection from a REX → complete details → time entry → submit → request REX authorisation → log out |
| `tests/grain-inspection.spec.ts` | ⏸ Skipped (`test.fixme`) until the Grain inspection steps are recorded |

> **Every run that reaches *Create* spends one REX number.** A REX can only create one inspection.

How this was built, environment findings and design decisions: [docs/PROJECT-HISTORY.md](docs/PROJECT-HISTORY.md).

---

## Setup (fresh clone)

```powershell
npm install
npx playwright install chromium
Copy-Item .env.example .env        # then fill in APP_USERNAME and APP_PASSWORD
```

`.env`:
```
BASE_URL=https://online-vnd.agriculture.gov.au/...   # only the host is used
APP_USERNAME=
APP_PASSWORD=
```

## REX numbers

Tests take REX numbers from `test-data/rex-pool.json` (git-ignored, created on first import).

1. Put the numbers in a text file, one per line, e.g. `test-data/rex-numbers.txt` (git-ignored).
2. Import them:

```powershell
npm run rex:import -- test-data/rex-numbers.txt Horticulture   # or Grain
npm run rex:status                                             # unused / used per type
```

Duplicates and numbers already in the pool are skipped; invalid lines are reported (exit code 2).

---

## Running

```powershell
npx playwright test horticulture-inspection                    # one inspection, headed
$env:HEADLESS="1"; npx playwright test horticulture-inspection # headless
npx playwright test horticulture-inspection --ui               # UI mode (timeline + screenshots)
npm run report                                                 # last HTML report
```

### Bulk: many inspections in parallel (recommended)

```powershell
# Preview the commands without running anything
npm run bulk:horticulture -- -RexFile test-data/rex-numbers.txt -Count 100 -DryRun

# Import 100 REX numbers, run a 6-inspection trial, then the remaining 94, 6 at a time
npm run bulk:horticulture -- -RexFile test-data/rex-numbers.txt -Count 100
```

| Option | Default | Meaning |
|---|---|---|
| `-RexFile` | – | REX file to import first (omit if already imported) |
| `-Count` | 100 | Total inspections, trial included |
| `-Workers` | 6 | Browsers at once |
| `-TrialCount` | 6 | Trial batch size; the main batch only starts if the trial passes. `0` skips it |
| `-MaxFailures` | 5 | Stop the main batch after this many failures |
| `-Headed` | off | Show the browsers (bulk runs are headless by default) |
| `-DryRun` | off | Print the commands only |

The helper stops **before any test runs** if there aren't enough unused REX numbers or the REX file has invalid lines.

### Bulk: the same thing step by step

```powershell
npm run rex:import -- test-data/rex-numbers.txt Horticulture   # 1. load the REX numbers
npm run rex:status                                             # 2. confirm 100+ unused

$env:HEADLESS="1"                                              # 3. trial: 6 at once, uses 6 REXes
npx playwright test horticulture-inspection --repeat-each=6 --workers=6 --fully-parallel --max-failures=2

npx playwright test horticulture-inspection --repeat-each=94 --workers=6 --fully-parallel --max-failures=5   # 4. the rest
npm run report                                                 # 5. REX and inspection ID for every run
```

`--fully-parallel` is required: without it, repeats of the same test run one after another.

---

## Project structure

```
tests/          WHAT the user does – steps only, no locators
fixtures/       creates page objects and the `rex` claim for each test
pages/          HOW to use each screen – private locators + actions
  BasePage.ts             shared: ADF splash handling, stayIdle()
  LoginPage.ts            sign-in (+ one retry on Oracle Access Manager "System error")
  HomePage.ts / LogoutPage.ts
  PemsHeader.ts           header on every PEMS screen (back to Self Service)
  PemsHomePage.ts         create-inspection tiles
  CreateInspectionDialog.ts
  InspectionPage.ts / TimeEntryPage.ts / RexPage.ts
test-data/      rexPool.ts (claiming), horticulture.ts (form values), rex-pool.json (git-ignored)
utils/          dates.ts
scripts/        import-rex.ts, rex-status.ts, bulk-horticulture.ps1
```

## Behaviour worth knowing

- **ADF "Loading..." splash** never clears on a browser's first visit, and can reappear when ADF's scripts load slowly (common with parallel runs). `BasePage.skipAdfSplashScreen()` handles both.
- **REX claiming is parallel-safe**: claimed under a file lock, so workers never share a REX. If a test fails *before* clicking Create, its REX goes back to the pool automatically; after Create it stays used (PEMS may have consumed it).
- **`retries: 0`** on purpose: a retry would silently spend another REX.
- **Login retries once** when Oracle Access Manager returns its intermittent "System error" page.

---

## Migrating to another project

Copy:

```
pages/  fixtures/  utils/  scripts/
test-data/rexPool.ts  test-data/horticulture.ts
tests/horticulture-inspection.spec.ts  (and grain-inspection.spec.ts)
.env.example
```

Then:

1. **Dependencies**: `npm install -D @playwright/test dotenv tsx typescript @types/node`
2. **tsconfig.json**: `"module": "nodenext"`, `"moduleResolution": "nodenext"`, `"strict": true`.
3. **playwright.config.ts** – merge these settings into the existing config:
   ```ts
   import 'dotenv/config';
   // ...
   retries: 0,
   use: {
     baseURL: process.env.BASE_URL ? new URL(process.env.BASE_URL).origin : undefined,
     headless: process.env.HEADLESS === '1',
     actionTimeout: 15_000,
     navigationTimeout: 60_000,
   },
   expect: { timeout: 15_000 },
   ```
4. **package.json scripts**:
   ```json
   "rex:import": "tsx scripts/import-rex.ts",
   "rex:status": "tsx scripts/rex-status.ts",
   "bulk:horticulture": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/bulk-horticulture.ps1"
   ```
   If the tests are not in `tests/`, adjust the `horticulture-inspection` filter in `bulk-horticulture.ps1`.
5. **.gitignore**: `.env`, `.auth/`, `recordings/`, `test-data/rex-pool.json`, `test-data/*.txt`
6. **Existing fixtures**: if the project already has a custom `test`, combine them with
   `mergeTests(theirTest, test)` from `@playwright/test` instead of replacing either.
