# Client Portal

Happy-path tests for the Client Portal, written with Playwright + TypeScript using the Page Object Model.

Each test logs in, opens **Connect to a new service**, checks the **Service Request History** card reads exactly
"View Service Request History – You have no active requests" / "View the status of all current and completed
service requests.", then signs out. Any other text (e.g. "You have 2 active requests") fails the test.

## Setup

```powershell
cd Automation\ClientPortal
npm install
npx playwright install chromium
copy .env.example .env   # then fill in BASE_URL, APP_USERNAME, APP_PASSWORD
```

## Commands

| Command | What it does |
|---|---|
| `npm test` | Run the single-user happy path (headed by default; set `HEADLESS=1` for headless) |
| `npm run test:headed` | Same, with `--headed` passed explicitly |
| `npm run test:bulk` | Run the check for every user in the user list (see below) |
| `npm run export` / `npm run export:offline` | Package the project as a zip to copy to another machine (see below) |
| `npm run report` | Open the last HTML report |
| `npm run typecheck` | Type-check without running tests |
| `npm run codegen -- <url>` | Record a flow with Playwright codegen (save output under `recordings/`) |

## Bulk run: many users, one password

1. Put the logins (email or Client ID) in `test-data\users.txt`, one per line — see `users.example.txt`.
   A `.csv` with a header row also works: the `username` / `email` / `login` column is used, otherwise the first.
   From Excel, use **Save As → CSV**. User lists are never committed or exported.
2. Set the shared password as `APP_PASSWORD` in `.env` (`APP_USERNAME` is not used by the bulk run).
3. Run it:

```powershell
npm run test:bulk -- -Limit 10                              # trial run on the first 10 users
npm run test:bulk                                           # everyone, one at a time
npm run test:bulk -- -UsersFile D:\secure\users.csv -Workers 4
npm run test:bulk -- -UsersFile .\results\<run>\failed-users.txt   # re-check only last run's failures
```

| Option | Default | Meaning |
|---|---|---|
| `-UsersFile` | `test-data\users.txt` | User list (.txt or .csv) |
| `-Workers` | 1 | Users checked at the same time. Raise carefully: many parallel logins can trip the sign-in service. |
| `-Limit` | 0 (all) | Only check the first N users |
| `-IdleSeconds` | 0 | Wait on the Services page before signing out |
| `-Retries` | 1 | Extra attempts for a failing user, so a passing glitch doesn't list them as failed |
| `-Headed` | off | Show the browsers |

Each run writes to `results\<date-time>\`:

| File | Contents |
|---|---|
| `failed-users.csv` | Every user who did not pass: user, status, failed step (Log in / Connect to a new service / Verify Service Request History / Sign out), reason, attempts |
| `failed-users.txt` | Just the failed logins — feed it back in with `-UsersFile` to re-check them |
| `bulk-results.csv` | Every user, passed or not |

Example reasons: `Login rejected (OAM-2): An incorrect Username or Password was specified.` or
`Expected: "…You have no active requests" | Received: "…You have 2 active requests"`.
Screenshots, videos and traces for failures are in the HTML report (`npm run report`).

Timing: about 5 seconds per user, so 200 users take roughly 17 minutes with one worker.

## Moving to another machine

`npm run export` and `npm run export:offline` create a zip in `dist\`. Neither includes `.env`, user lists,
recordings or results.

| Export | Size | Target machine needs |
|---|---|---|
| `npm run export` (source) | < 1 MB | Node.js and internet access, then: `npm ci` and `npx playwright install chromium` |
| `npm run export:offline` | ~330 MB | Node.js only (no internet). Must be Windows x64. Includes packages and the Chromium browser. |

On the target machine:

```powershell
# unzip, then
cd ClientPortal
copy .env.example .env        # set BASE_URL and APP_PASSWORD
npm run test:bulk -- -UsersFile D:\secure\users.csv -Limit 10
```

With the offline export, always run through `npm run test:bulk` (or `scripts\run-bulk.ps1`): it points
Playwright at the bundled browser in `ms-playwright\`.

## Layout

| Folder | Contents |
|---|---|
| `pages/` | Page objects (`BasePage` plus one class per page or dialog) |
| `fixtures/` | `pages.fixture.ts` — injects page objects into tests |
| `tests/` | `happy-path.spec.ts` (single user) and `bulk-users.spec.ts` (one test per user in the list) |
| `test-data/` | Expected texts (`services.ts`) and the user-list loader (`users.ts`) |
| `reporters/` | `failed-users-reporter.ts` — writes the bulk-run CSVs |
| `scripts/` | `run-bulk.ps1` and `export.ps1` |
| `utils/` | Shared helpers |
