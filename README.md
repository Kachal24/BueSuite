# buesuite-e2e

Playwright + TypeScript end-to-end automation for the BueSuite web app (`buesuite-fe-client`).
First automated flow: **Employee Events → New Hire** (5-step wizard + Launch Onboarding submit).

## Prerequisites

- Node.js 20+ (22 LTS recommended)
- The local backend stack running (`docker compose up` in `buesuite-be-core`):
  Keycloak `:8090`, FastAPI `:8000`, Postgres `:5432` (realm/tenant `logitech`)
- The Angular dev server running in `buesuite-fe-client`:

  ```bash
  # bash
  NODE_OPTIONS=--max-old-space-size=8192 npm start
  ```

  ```powershell
  # PowerShell
  $env:NODE_OPTIONS='--max-old-space-size=8192'; npm start
  ```

## Setup

```bash
cd buesuite-e2e
npm install
npx playwright install chromium
# .env is already created; adjust if your stack differs (see .env.example)
```

## Running

```bash
npm test              # full suite (auth setup + all specs)
npm run test:smoke    # navigation smoke test only
npm run test:headed   # watch the browser
npm run test:ui       # Playwright UI mode
npm run report        # open the last HTML report
npm run codegen       # explore selectors with the manager session
```

On resource-constrained machines add `-- --workers=1` (parallel Chromium instances
alongside `ng serve` have crashed workers before).

## How auth works

`tests/auth/auth.setup.ts` runs first (the `setup` project): it performs a real
Keycloak login (`#username` / `#password` / `#kc-login`) as the **manager** test
user (the persona that initiates New Hire), saves the
`playwright/.auth/manager.json` storage state, and then verifies a fresh context
restored from that state silently re-authenticates (keycloak-js keeps tokens in
memory — the Keycloak SSO cookie on `:8090` is what storageState actually
preserves). All specs run in the `chromium` project with this state. When a
future spec needs another perspective (e.g. the employee), add that role to
`STORAGE_STATE` in `playwright.config.ts`, a matching login in `auth.setup.ts`,
and opt in per-spec with `test.use({ storageState: ... })`.

## App quirks the framework handles

- **Bootstrap deep-link hijack** — on the first load of a fresh browser session
  the app stamps `sessionStorage['loginDetail']` and force-navigates to
  `/app/onboard` (first-login wizard) or `/app/pulse`, discarding the requested
  URL. `BasePage.navigate()` waits for the stamp, lets the hijack land, and
  re-issues the deep link.
- **No test ids** — fields are custom `<app-input-form-feild>` widgets with
  non-unique `name`s and repeated ids. `src/components/input-form-field.ts`
  locates fields by their visible label inside `.input-feild-common` wrappers;
  SELECT-type fields are Material autocompletes handled via the overlay
  (`src/components/mat-autocomplete.ts`).
- **Typographic apostrophes** — labels like `Hire’s Name` use U+2019; the label
  map in `src/pages/new-hire-stepper.page.ts` matches them with regexes.
- **Screen-code ids repeat** — dialogs are located as
  `.dialog-wrapper#<SCREEN_CODE>` because the same id also appears on inner
  field wrappers.

## Known product issues hit by the happy path

1. **Compensation "Yes" poisons the submit** — with "Would you like to add
   Salary? = Yes" (the default) plus the auto-applied salary structure,
   `<app-salary-structure>` emits an empty pay-component row that is rendered
   nowhere in the UI. The final `POST core/employee/candidate` then fails 400
   (`pay.detail_list.0.component_id/frequency/payout_recurring_type` required).
   The test selects **No** to avoid the unreachable-state bug.
2. **Manager without a job assignment → 500** — `add_candidate`
   (`buesuite-be-core/app/routers/core/employee/service.py:1006`) dereferences
   `manager_position_details.id`; if the selected position's `report_to` person
   has no primary `person_job_assignment` row, the endpoint 500s. On the local
   seed, all vacant positions report to a person with no assignment, so the
   happy-path submit fails until the seed (or the backend null-guard) is fixed.

## Structure

```
playwright.config.ts        # setup + chromium projects, storageState wiring
src/config/env.ts           # .env loader (BASE_URL, credentials, ...)
src/components/             # widget wrappers (InputFormField, MatAutocomplete, DatePicker)
src/pages/                  # POM: employee-events, choose-hire-category, new-hire-stepper, launch dialog
src/data/                   # NewHireData type + faker factory (unique email per run)
src/fixtures/fixtures.ts    # test fixtures exposing page objects + fresh data
tests/auth/auth.setup.ts    # Keycloak login → storage states (+ silent re-login gate)
tests/employee-events/      # new-hire.spec.ts: @smoke, validation, happy path E2E
```

## Future work

- CI pipeline (needs a hosted/stable stack)
- API-based cleanup of candidates created by the happy path
- More event flows (Contractor/Intern/Consultant hires, Separation, Transfer)
# buesuite-playwright
# BueSuite
# BueSuite
