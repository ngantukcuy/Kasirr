const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');
const { testUser } = require('./utils/testData');
const { STORAGE_STATE_PATH } = require('./utils/storageStatePath');
const { LoginPage } = require('./pages/LoginPage');
const { RegisterPage } = require('./pages/RegisterPage');

/**
 * Polls until either the dashboard is reached or a (non-empty) toast
 * message shows up — capturing the toast text the moment it appears,
 * since the app's toasts auto-dismiss after ~3.5s and would otherwise
 * be gone by the time a fixed timeout elapses.
 */
async function waitForOutcome(page, { timeout = 10_000 } = {}) {
  const deadline = Date.now() + timeout;
  let lastToast = '';
  while (Date.now() < deadline) {
    if (page.url().includes('/pages/dashboard.html')) return { success: true, toastText: lastToast };
    const toastText = await page.locator('#toast-container').innerText().catch(() => '');
    if (toastText && toastText.trim()) lastToast = toastText.trim();
    await page.waitForTimeout(200);
  }
  return { success: false, toastText: lastToast };
}

function explain(toastText) {
  const t = (toastText || '').toLowerCase();
  if (t.includes('confirm')) {
    return 'The Supabase project requires email confirmation for this account. Either disable ' +
      '"Confirm email" in Supabase Auth settings, or confirm this specific user once in the ' +
      'Supabase dashboard (Authentication → Users).';
  }
  if (t.includes('invalid login credentials') || (t.includes('invalid') && t.includes('password'))) {
    return `TEST_PASSWORD in .env doesn't match the actual password of "${testUser.email}" in Supabase. ` +
      'If you created/confirmed this user manually in the dashboard, make sure the password there ' +
      'matches .env exactly (or delete the user and let the tests create it fresh).';
  }
  if (t.includes('row-level security') || t.includes('rls') || t.includes('permission denied') || t.includes('policy')) {
    return 'A Supabase Row Level Security (RLS) policy is blocking reads/writes on the "profiles" ' +
      'table for this user (KasirkuDB.Auth._loadProfile upserts a profile row on first login). ' +
      'Check that authenticated users have INSERT/SELECT/UPDATE policies on "profiles" for their own id.';
  }
  if (!toastText) {
    return 'No toast message was captured at all — the app may not be reachable, or the page ' +
      'errored before it could show one. Re-run with `npx playwright test --headed --debug` to ' +
      'watch it live, or check the saved screenshot for more detail.';
  }
  return 'Unrecognized error — see the exact toast text above and the saved screenshot for more detail.';
}

module.exports = async (config) => {
  // Don't read baseURL off config.projects[0].use — which project ends
  // up first depends on project ordering/filtering (e.g. --project flag),
  // and its "use" block may not even define baseURL. Pull it from
  // whichever project actually has it, falling back to BASE_URL env.
  const projectWithBaseURL = config.projects.find((p) => p.use && p.use.baseURL);
  const baseURL = (projectWithBaseURL && projectWithBaseURL.use.baseURL) || process.env.BASE_URL || 'http://localhost:4173';

  const outFile = STORAGE_STATE_PATH;
  const debugScreenshot = path.resolve(__dirname, 'storage', 'global-setup-failure.png');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage();

  async function fail(message, toastText) {
    await page.screenshot({ path: debugScreenshot, fullPage: true }).catch(() => {});
    throw new Error(
      `${message}\n` +
      (toastText ? `App toast message: "${toastText}"\n` : 'App toast message: (none captured)\n') +
      `Likely explanation: ${explain(toastText)}\n` +
      `Current page URL: ${page.url()}\n` +
      `Debug screenshot saved to: ${debugScreenshot}\n`
    );
  }

  try {
    await page.goto(`${baseURL}/index.html`);

    // Always go through the registration form once per run. This isn't
    // just for brand-new accounts: it's also how a CONFIRMED, already-
    // existing Supabase account gets written into THIS browser's
    // localStorage (the account picker only ever reads from
    // localStorage, never straight from Supabase). Playwright launches
    // a brand-new, empty browser profile every run, so without this
    // step the account picker would always be empty even for a
    // perfectly valid, confirmed account.
    // The app's own handleRegister() already handles both cases:
    //   - brand-new email -> creates the account
    //   - already-registered email -> logs in with the given password
    //     and links/saves it to this device instead of erroring out
    const loginPage = new LoginPage(page);
    await loginPage.goToRegister();
    const registerPage = new RegisterPage(page);
    await registerPage.register(testUser);

    const registerOutcome = await waitForOutcome(page, { timeout: 8_000 });
    if (registerOutcome.success) {
      await page.context().storageState({ path: outFile });
      return;
    }

    // Not redirected yet — should be back on (or still on) the login
    // view. Reload once so the account picker re-reads localStorage.
    await page.reload();
    await loginPage.loginView.waitFor({ state: 'visible' }).catch(() => {});
    const hasAccounts = await loginPage.hasSavedAccounts();
    if (!hasAccounts) {
      await fail(
        `No saved account found on this browser profile for "${testUser.email}" after ` +
        'attempting registration/link.',
        registerOutcome.toastText
      );
    }

    await loginPage.loginWithPin(testUser.email, testUser.pin);
    const loginOutcome = await waitForOutcome(page, { timeout: 8_000 });
    if (!loginOutcome.success) {
      await fail('Global setup could not reach an authenticated session after logging in.', loginOutcome.toastText);
    }

    await page.context().storageState({ path: outFile });
  } finally {
    await browser.close();
  }
};
