# KASIRKU (Tokku) — Playwright E2E Tests

End-to-end tests for the KASIRKU POS web app, covering:

- **Auth** — registration form validation, account picker, PIN login/error states, route guard for unauthenticated visitors
- **Navigation** — sidebar routing across all main pages, logout
- **Dashboard** — summary stats render
- **Produk (SKU Master)** — create / edit / validation
- **Pelanggan (Customers)** — create, search, filter by type
- **Stok (Inventory)** — tab filters, stock-in adjustment
- **Kasir / POS** — full cash-sale flow (search → add to cart → checkout → payment → success)

## 1. Install

Copy this whole `e2e` folder **inside your KASIRKU project root** (as a
sibling of `index.html`, `pages/`, `js/`, etc.):

```
Kasirr-main/
├── index.html
├── pages/
├── js/
├── css/
└── e2e/              ← this folder
```

Then, from inside `e2e/`:

```bash
npm install
npx playwright install --with-deps chromium
```

## 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set a test account. **Important:** the app uses real
Supabase auth (`signUp` / `signInWithPassword`), so the test account's
email must be **confirmed** for login to succeed. Two options:

- **Easiest for local/dev testing:** in your Supabase project, go to
  *Authentication → Providers → Email* and turn **off** "Confirm email".
  The test suite registers this account itself on first run (and
  safely reuses it on every run after — the app auto-links to an
  existing account when it detects the email is already registered).
- **If you can't disable email confirmation:** create the user once
  (sign up through the app, or via Supabase dashboard → Authentication
  → Users → "Add user", then use its "Confirm email" action), matching
  the same email/password you put in `.env`. Every test run will still
  submit the registration form with those credentials — since the
  account already exists and is confirmed, the app logs in with the
  given password instead of erroring, and saves it into the fresh
  browser profile Playwright just launched.

## 3. Run

```bash
npx playwright test              # headless, all tests
npm run test:headed              # see the browser
npm run test:ui                  # interactive UI mode (great for debugging)
npm run test:auth                # only login/register tests
npm run test:pages               # dashboard/produk/pelanggan/stok/navigation
npm run test:pos                 # the POS checkout flow
npx playwright show-report       # open the last HTML report
```

The config auto-starts `npx serve <APP_DIR>` for you (see `APP_DIR` in
`.env`), so you normally don't need to run the dev server yourself. If
you already have it running on the configured `BASE_URL`, Playwright
will reuse it instead of starting a second instance.

## How it's organized

```
e2e/
├── playwright.config.js     # projects, webServer, storageState
├── global-setup.js          # registers/logs the shared test user in once
├── utils/testData.js        # env-driven test user + random product/customer factories
├── pages/                   # Page Object Models (one per screen)
└── tests/
    ├── auth/                # runs WITHOUT a saved session (project: auth-flows)
    ├── pages/                # runs WITH the authenticated session (project: chromium)
    └── pos/                  # POS flow, also run once on a mobile viewport
```

- **Global setup** runs once before the whole suite: it logs the shared
  test user in through the real UI and saves the resulting session
  (`storage/auth.json`). Every test in `tests/pages` and `tests/pos`
  reuses that session, so they don't each pay the login cost.
- **`tests/auth`** intentionally starts with an empty browser
  profile (no `storageState`) so it can test the logged-out screens
  and the account picker honestly. Where a "saved account" is needed
  to exercise the PIN flow, the test seeds `localStorage` directly
  with a fake account (same shape the app itself writes) instead of
  registering a throwaway Supabase user — this keeps those tests fast
  and independent of email confirmation settings.
- Tests that need catalog data (Stok, Kasir/POS) create their own
  product via the `ProdukPage` object first, using a randomized
  name/SKU per run, so tests don't collide with each other or with
  whatever is already in your database.

## Notes & assumptions

- Tests run against your **real configured Supabase project** (the
  anon key is hardcoded in `js/app.js`) — there's no mocking layer.
  Data created by the tests (products, customers, transactions) will
  persist in that database. Point `.env` / your Supabase project at a
  dev/staging instance, not production data, before running.
- `fullyParallel` is disabled and `workers: 1` on purpose: several
  tests share one Supabase test account and the same catalog table,
  so parallel workers would race each other.
- If a test fails, check `playwright-report/index.html` — traces,
  screenshots and video are captured automatically on failure.
